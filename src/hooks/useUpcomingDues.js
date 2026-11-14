import { useState, useEffect, useCallback } from 'react';
import { getEmis, getSips, getSubscriptions } from '../lib/expenseService';
import { formatINR } from '../lib/utils';
import { format, isSameMonth, getDaysInMonth } from 'date-fns';

const getOrdinalSuffix = (day) => {
  if (!day) return 'th';
  const d = parseInt(day, 10);
  if ([1, 21, 31].includes(d)) return 'st';
  if ([2, 22].includes(d)) return 'nd';
  if ([3, 23].includes(d)) return 'rd';
  return 'th';
};

export function useUpcomingDues(user) {
  const [upcomingDues, setUpcomingDues] = useState([]);
  const [rawEmis, setRawEmis] = useState([]);
  const [rawSips, setRawSips] = useState([]);
  const [rawSubs, setRawSubs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshDues = useCallback(async () => {
    if (!user?.uid) return;
    setIsLoading(true);
    try {
      const [emisRes, sipsRes, subsRes] = await Promise.allSettled([
        getEmis(user.uid),
        getSips(user.uid),
        getSubscriptions(user.uid)
      ]);

      const emis = emisRes.status === 'fulfilled' ? emisRes.value : [];
      const sips = sipsRes.status === 'fulfilled' ? sipsRes.value : [];
      const subs = subsRes.status === 'fulfilled' ? subsRes.value : [];

      setRawEmis(emis);
      setRawSips(sips);
      setRawSubs(subs);

      const now = new Date();
      const currentDay = now.getDate();
      const daysInThisMonth = getDaysInMonth(now);

      const items = [];

      // 1. Process Active EMIs
      emis.forEach((emi) => {
        const paidCount = emi.paidInstallments || 0;
        const totalTenure = emi.totalTenure || 1;
        const isDone = emi.status === 'completed' || paidCount >= totalTenure;
        if (isDone) return;

        // Check if already paid this calendar month
        const paidThisMonth = emi.lastPaidAt && isSameMonth(new Date(emi.lastPaidAt), now);
        if (paidThisMonth) return;

        const dueDay = parseInt(emi.dueDay || 5, 10);
        let daysUntil = 0;

        if (dueDay >= currentDay) {
          daysUntil = dueDay - currentDay;
        } else {
          // Rolls into next month
          daysUntil = (daysInThisMonth - currentDay) + dueDay;
        }

        items.push({
          id: `emi-${emi.id}`,
          rawId: emi.id,
          type: 'EMI',
          title: emi.itemName,
          amount: emi.monthlyEmi || 0,
          dueDay,
          daysUntil,
          subtext: `${emi.sourceCard || 'Credit Card EMI'} (${paidCount + 1}/${totalTenure})`,
          isUrgent: daysUntil <= 2,
          dateLabel: daysUntil === 0 
            ? 'Due Today!' 
            : daysUntil === 1 
            ? 'Due Tomorrow' 
            : `Due in ${daysUntil} days`
        });
      });

      // 2. Process SIPs
      sips.forEach((sip) => {
        let deductionDay = parseInt(sip.deductionDate, 10);
        if (isNaN(deductionDay) && sip.date) {
          try {
            deductionDay = new Date(sip.date + 'T00:00:00').getDate();
          } catch {
            deductionDay = 10;
          }
        }
        if (isNaN(deductionDay) || deductionDay <= 0) deductionDay = 10;

        let daysUntil = 0;
        if (deductionDay >= currentDay) {
          daysUntil = deductionDay - currentDay;
        } else {
          daysUntil = (daysInThisMonth - currentDay) + deductionDay;
        }

        items.push({
          id: `sip-${sip.id}`,
          rawId: sip.id,
          type: 'SIP',
          title: sip.fundName,
          amount: sip.amount || 0,
          dueDay: deductionDay,
          daysUntil,
          subtext: `Monthly SIP debit on ${deductionDay}${getOrdinalSuffix(deductionDay)} of month`,
          isUrgent: daysUntil <= 2,
          dateLabel: daysUntil === 0 
            ? 'Due Today!' 
            : daysUntil === 1 
            ? 'Due Tomorrow' 
            : `Due in ${daysUntil} days`
        });
      });

      // 3. Process Subscriptions
      subs.forEach((sub) => {
        if (sub.status === 'paused' || sub.status === 'cancelled') return;
        const renewalDay = parseInt(sub.renewalDay || 1, 10);
        let daysUntil = 0;
        if (renewalDay >= currentDay) {
          daysUntil = renewalDay - currentDay;
        } else {
          daysUntil = (daysInThisMonth - currentDay) + renewalDay;
        }

        items.push({
          id: `sub-${sub.id}`,
          rawId: sub.id,
          type: 'Subscription',
          title: sub.name,
          amount: Number(sub.amount) || 0,
          dueDay: renewalDay,
          daysUntil,
          subtext: `Recurring ${sub.billingCycle || 'monthly'} subscription`,
          isUrgent: daysUntil <= 2,
          dateLabel: daysUntil === 0 
            ? 'Due Today!' 
            : daysUntil === 1 
            ? 'Due Tomorrow' 
            : `Due in ${daysUntil} days`
        });
      });

      // Sort by soonest due date
      items.sort((a, b) => a.daysUntil - b.daysUntil);
      setUpcomingDues(items);

      // Trigger native browser notification if enabled and urgent items exist
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        const urgentItems = items.filter(i => i.isUrgent);
        if (urgentItems.length > 0) {
          const todayKey = `notif_seen_${user.uid}_${format(now, 'yyyy-MM-dd')}`;
          if (!localStorage.getItem(todayKey)) {
            const totalNeeded = urgentItems.reduce((sum, i) => sum + i.amount, 0);
            try {
              new Notification('Bank Balance Reminder 🔔', {
                body: `You have ${urgentItems.length} payment(s) totaling ${formatINR(totalNeeded)} due in 1–2 days. Ensure your bank account is funded!`,
                icon: '/favicon.svg'
              });
              localStorage.setItem(todayKey, 'true');
            } catch (err) {
              console.error(err);
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to calculate upcoming dues:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    refreshDues();
  }, [refreshDues]);

  const urgentDues = upcomingDues.filter(i => i.isUrgent);
  const totalUrgentAmount = urgentDues.reduce((sum, i) => sum + i.amount, 0);

  return {
    upcomingDues,
    urgentDues,
    totalUrgentAmount,
    rawEmis,
    rawSips,
    rawSubs,
    isLoading,
    refreshDues
  };
}

