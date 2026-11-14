import { addDays, format, getDate, parseISO, differenceInDays } from 'date-fns';

/**
 * 90-Day Cashflow & Low-Balance Forecasting Engine
 * Combines current bank balances, recurring EMIs, SIPs, subscriptions,
 * and historical daily burn rate to project day-by-day cashflow.
 */
export function calculateCashflowForecast({
  accounts = [],
  accountBalances = {},
  transactions = [],
  emis = [],
  sips = [],
  subscriptions = [],
  forecastDays = 90,
  lowBalanceThreshold = 5000
}) {
  const today = new Date();

  // 1. Calculate Current Balances
  const defaultAcc = accounts.find(a => a.isDefault) || accounts[0] || { id: 'acc_main', name: 'Primary Account' };
  
  let currentTotalBalance = 0;
  const currentPerAccountBalances = {};

  accounts.forEach(acc => {
    const bal = accountBalances[acc.id] ?? (Number(acc.openingBalance) || 0);
    currentPerAccountBalances[acc.id] = bal;
    currentTotalBalance += bal;
  });

  // Fallback if no accounts configured
  if (accounts.length === 0) {
    currentPerAccountBalances[defaultAcc.id] = 0;
  }

  // 2. Calculate Average Daily Discretionary Burn Rate
  // Look at past expense transactions (excluding transfers and investments/EMIs if already separate)
  const now = new Date();
  const thirtyDaysAgo = addDays(now, -30);

  const pastExpenses = transactions.filter(t => {
    if (t.type !== 'expense') return false;
    if (t.isTransfer) return false;
    // Disregard transactions older than 60 days
    if (t.date) {
      try {
        const d = parseISO(t.date);
        return d >= thirtyDaysAgo;
      } catch {
        return true;
      }
    }
    return true;
  });

  const totalPastExpense = pastExpenses.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const daysSpan = Math.max(1, Math.min(30, pastExpenses.length > 0 ? 30 : 1));
  const dailyBurnRate = pastExpenses.length > 0 
    ? Math.round(totalPastExpense / daysSpan)
    : 0;

  // 3. Prepare Recurring Commitments
  const activeEmis = emis.filter(e => {
    const isCompleted = e.status === 'completed' || (e.paidInstallments >= e.totalTenure && e.totalTenure > 0);
    return !isCompleted && (Number(e.monthlyEmi) || 0) > 0;
  });

  const activeSips = sips.filter(s => (Number(s.amount) || 0) > 0);

  const activeSubs = subscriptions.filter(s => {
    const isActive = s.status !== 'cancelled' && s.status !== 'paused';
    return isActive && (Number(s.amount) || 0) > 0;
  });

  // Calculate monthly recurring total
  const monthlyEmiSum = activeEmis.reduce((s, e) => s + (Number(e.monthlyEmi) || 0), 0);
  const monthlySipSum = activeSips.reduce((s, sip) => s + (Number(sip.amount) || 0), 0);
  const monthlySubSum = activeSubs.reduce((s, sub) => {
    const amt = Number(sub.amount) || 0;
    return s + (sub.billingCycle === 'yearly' ? Math.round(amt / 12) : amt);
  }, 0);
  const monthlyRecurringTotal = monthlyEmiSum + monthlySipSum + monthlySubSum;

  // 4. Simulate Day-by-Day for `forecastDays`
  const dailyProjections = [];
  const perAccountProjections = {};
  accounts.forEach(acc => {
    perAccountProjections[acc.id] = currentPerAccountBalances[acc.id] || 0;
  });

  let runningTotalBalance = currentTotalBalance;
  const warnings = [];
  const accountsWarned = new Set();

  for (let d = 1; d <= forecastDays; d++) {
    const simDate = addDays(today, d);
    const dayOfMonth = getDate(simDate);
    const dateStr = format(simDate, 'yyyy-MM-dd');
    const displayLabel = format(simDate, 'd MMM');

    let recurringOutflow = 0;
    const dayEvents = [];

    // Check EMIs
    activeEmis.forEach(emi => {
      const emiDay = parseInt(emi.dueDay || 5, 10);
      if (emiDay === dayOfMonth) {
        const amt = Number(emi.monthlyEmi) || 0;
        recurringOutflow += amt;
        dayEvents.push({
          type: 'EMI',
          name: emi.itemName || 'EMI',
          amount: amt,
          accountId: emi.accountId
        });

        // Debit matching account
        const targetAccId = emi.accountId || defaultAcc.id;
        if (perAccountProjections[targetAccId] !== undefined) {
          perAccountProjections[targetAccId] -= amt;
        }
      }
    });

    // Check SIPs
    activeSips.forEach(sip => {
      let sipDay = 10;
      if (sip.deductionDate) {
        sipDay = parseInt(sip.deductionDate, 10);
      } else if (sip.date) {
        try {
          sipDay = getDate(parseISO(sip.date));
        } catch {
          sipDay = 10;
        }
      }

      if (sipDay === dayOfMonth) {
        const amt = Number(sip.amount) || 0;
        recurringOutflow += amt;
        dayEvents.push({
          type: 'SIP',
          name: sip.fundName || 'Mutual Fund SIP',
          amount: amt,
          accountId: sip.accountId
        });

        const targetAccId = sip.accountId || defaultAcc.id;
        if (perAccountProjections[targetAccId] !== undefined) {
          perAccountProjections[targetAccId] -= amt;
        }
      }
    });

    // Check Subscriptions
    activeSubs.forEach(sub => {
      const renewalDay = parseInt(sub.renewalDay || 1, 10);
      let isDueToday = false;

      if (sub.billingCycle === 'monthly') {
        isDueToday = (renewalDay === dayOfMonth);
      } else if (sub.billingCycle === 'yearly' && sub.nextRenewalDate) {
        try {
          isDueToday = (differenceInDays(parseISO(sub.nextRenewalDate), simDate) === 0);
        } catch {
          isDueToday = (renewalDay === dayOfMonth);
        }
      }

      if (isDueToday) {
        const amt = Number(sub.amount) || 0;
        recurringOutflow += amt;
        dayEvents.push({
          type: 'Subscription',
          name: sub.name || 'Subscription',
          amount: amt,
          accountId: sub.accountId
        });

        const targetAccId = sub.accountId || defaultAcc.id;
        if (perAccountProjections[targetAccId] !== undefined) {
          perAccountProjections[targetAccId] -= amt;
        }
      }
    });

    // Discretionary burn deduction
    runningTotalBalance -= (dailyBurnRate + recurringOutflow);

    // Primary account absorbs daily burn rate
    if (perAccountProjections[defaultAcc.id] !== undefined) {
      perAccountProjections[defaultAcc.id] -= dailyBurnRate;
    }

    // Check for Low-Balance breaches on each account
    accounts.forEach(acc => {
      const bal = perAccountProjections[acc.id] ?? 0;
      if (bal < lowBalanceThreshold && !accountsWarned.has(acc.id)) {
        accountsWarned.add(acc.id);
        const dayOrdinal = getDayOrdinal(dayOfMonth);
        warnings.push({
          accountId: acc.id,
          accountName: acc.name,
          date: `${dayOrdinal} ${format(simDate, 'MMM')}`,
          projectedBalance: bal,
          dayOffset: d,
          message: `Based on upcoming EMIs and burn rate, ${acc.name} balance may drop below ₹${lowBalanceThreshold.toLocaleString('en-IN')} on the ${dayOrdinal} (${format(simDate, 'MMM d')}).`
        });
      }
    });

    // Check total portfolio breach
    if (runningTotalBalance < lowBalanceThreshold && !accountsWarned.has('total')) {
      accountsWarned.add('total');
      const dayOrdinal = getDayOrdinal(dayOfMonth);
      warnings.push({
        accountId: 'total',
        accountName: 'Total Balance',
        date: `${dayOrdinal} ${format(simDate, 'MMM')}`,
        projectedBalance: runningTotalBalance,
        dayOffset: d,
        message: `Total liquid cash may drop below ₹${lowBalanceThreshold.toLocaleString('en-IN')} around ${format(simDate, 'MMMM d')}.`
      });
    }

    dailyProjections.push({
      day: d,
      date: dateStr,
      label: displayLabel,
      balance: Math.max(-50000, Math.round(runningTotalBalance)),
      burn: dailyBurnRate,
      recurring: recurringOutflow,
      totalOutflow: dailyBurnRate + recurringOutflow,
      events: dayEvents
    });
  }

  // 5. Milestones
  const day30 = dailyProjections[29] || dailyProjections[dailyProjections.length - 1];
  const day60 = dailyProjections[59] || dailyProjections[dailyProjections.length - 1];
  const day90 = dailyProjections[89] || dailyProjections[dailyProjections.length - 1];

  return {
    currentTotalBalance,
    dailyBurnRate,
    monthlyRecurringTotal,
    projections: dailyProjections,
    milestones: {
      day30: day30?.balance ?? currentTotalBalance,
      day60: day60?.balance ?? currentTotalBalance,
      day90: day90?.balance ?? currentTotalBalance
    },
    warnings,
    activeCommitmentsCount: activeEmis.length + activeSips.length + activeSubs.length
  };
}

function getDayOrdinal(day) {
  if (!day) return '';
  const d = parseInt(day, 10);
  if ([1, 21, 31].includes(d)) return `${d}st`;
  if ([2, 22].includes(d)) return `${d}nd`;
  if ([3, 23].includes(d)) return `${d}rd`;
  return `${d}th`;
}
