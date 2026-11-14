import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Repeat, Plus, Trash2, Edit3, CheckCircle2, 
  Calendar, CreditCard, Sparkles, Tv, Film, 
  Music, Dumbbell, Wifi, Cloud, Bot, Building2
} from 'lucide-react';
import { format } from 'date-fns';
import { getSubscriptions, addSubscription, updateSubscription, deleteSubscription } from '../lib/expenseService';
import { formatINR } from '../lib/utils';
import { PrivacyAmount } from '../context/PrivacyContext';
import LoadingScreen from './LoadingScreen';
import CustomDropdown from './CustomDropdown';
import toast from 'react-hot-toast';

const PRESET_SERVICES = [
  { name: 'Netflix', category: 'Entertainment', amount: 649, cycle: 'monthly', icon: Film, color: 'text-red-500 bg-red-500/10 border-red-500/20' },
  { name: 'Spotify', category: 'Entertainment', amount: 119, cycle: 'monthly', icon: Music, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { name: 'YouTube Premium', category: 'Entertainment', amount: 149, cycle: 'monthly', icon: Tv, color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  { name: 'Amazon Prime', category: 'Entertainment', amount: 1499, cycle: 'yearly', icon: Film, color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
  { name: 'Gym / Fitness', category: 'Health & Fitness', amount: 2000, cycle: 'monthly', icon: Dumbbell, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { name: 'Broadband / Wi-Fi', category: 'Bills & Utilities', amount: 999, cycle: 'monthly', icon: Wifi, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  { name: 'Google One / iCloud', category: 'Bills & Utilities', amount: 130, cycle: 'monthly', icon: Cloud, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
  { name: 'ChatGPT / AI Tools', category: 'Bills & Utilities', amount: 1999, cycle: 'monthly', icon: Bot, color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' },
];

export default function SubscriptionsTab({ 
  user, 
  accounts = [], 
  accountBalances = {},
  onLogExpense 
}) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Entertainment');
  const [amount, setAmount] = useState('');
  const [billingCycle, setBillingCycle] = useState('monthly'); // monthly, yearly, quarterly
  const [renewalDay, setRenewalDay] = useState('5');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [autoDebit, setAutoDebit] = useState(true);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSubscriptions = useCallback(async () => {
    if (!user?.uid) return;
    setIsLoading(true);
    try {
      const data = await getSubscriptions(user.uid);
      setSubscriptions(data);
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
      toast.error('Failed to load subscriptions');
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  // Ensure default account
  useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      const def = accounts.find(a => a.isDefault) || accounts[0];
      setAccountId(def.id);
    }
  }, [accounts, accountId]);

  // Calculations
  const metrics = useMemo(() => {
    let monthlyTotal = 0;
    let annualTotal = 0;
    let activeCount = 0;

    subscriptions.forEach(sub => {
      if (sub.status === 'paused' || sub.status === 'cancelled') return;
      activeCount++;
      const amt = Number(sub.amount) || 0;
      if (sub.billingCycle === 'monthly') {
        monthlyTotal += amt;
        annualTotal += amt * 12;
      } else if (sub.billingCycle === 'yearly') {
        monthlyTotal += amt / 12;
        annualTotal += amt;
      } else if (sub.billingCycle === 'quarterly') {
        monthlyTotal += amt / 3;
        annualTotal += amt * 4;
      }
    });

    return {
      monthlyTotal: Math.round(monthlyTotal),
      annualTotal: Math.round(annualTotal),
      activeCount
    };
  }, [subscriptions]);

  const cycleOptions = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly / Annual' },
    { value: 'quarterly', label: 'Quarterly' }
  ];

  const subCategoryOptions = [
    { value: 'Entertainment', label: 'Entertainment' },
    { value: 'Health & Fitness', label: 'Health & Fitness' },
    { value: 'Bills & Utilities', label: 'Bills & Utilities' },
    { value: 'Shopping', label: 'Shopping' },
    { value: 'Other', label: 'Other' }
  ];

  const renewalDayOptions = useMemo(() => {
    return Array.from({ length: 31 }, (_, i) => ({
      value: String(i + 1),
      label: `Day ${i + 1} of month`
    }));
  }, []);

  const subAccountOptions = useMemo(() => {
    return accounts.map(acc => {
      const bal = accountBalances[acc.id] ?? (Number(acc.openingBalance) || 0);
      return {
        value: acc.id,
        label: acc.name,
        subtext: formatINR(bal)
      };
    });
  }, [accounts, accountBalances]);

  const resetForm = () => {
    setName('');
    setCategory('Entertainment');
    setAmount('');
    setBillingCycle('monthly');
    setRenewalDay('5');
    setAccountId(accounts.find(a => a.isDefault)?.id || accounts[0]?.id || '');
    setAutoDebit(true);
    setNotes('');
    setEditingSub(null);
  };

  const openAddModal = (preset = null) => {
    resetForm();
    if (preset) {
      setName(preset.name);
      setCategory(preset.category);
      setAmount(preset.amount.toString());
      setBillingCycle(preset.cycle);
    }
    setIsAddModalOpen(true);
  };

  const openEditModal = (sub) => {
    setEditingSub(sub);
    setName(sub.name || '');
    setCategory(sub.category || 'Entertainment');
    setAmount(sub.amount?.toString() || '');
    setBillingCycle(sub.billingCycle || 'monthly');
    setRenewalDay(sub.renewalDay?.toString() || '5');
    setAccountId(sub.accountId || accounts[0]?.id || '');
    setAutoDebit(sub.autoDebit !== false);
    setNotes(sub.notes || '');
    setIsAddModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!name.trim() || isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid subscription name and amount');
      return;
    }

    const matchedAccount = accounts.find(a => a.id === accountId) || accounts[0] || { id: 'acc_main', name: 'Primary Account' };

    setIsSubmitting(true);
    try {
      const subData = {
        name: name.trim(),
        category,
        amount: numAmount,
        billingCycle,
        renewalDay: parseInt(renewalDay, 10) || 1,
        accountId: matchedAccount.id,
        accountName: matchedAccount.name,
        autoDebit,
        notes: notes.trim(),
        status: editingSub ? (editingSub.status || 'active') : 'active'
      };

      if (editingSub) {
        await updateSubscription(editingSub.id, subData);
        toast.success(`Updated ${name}!`);
      } else {
        await addSubscription(user.uid, subData);
        toast.success(`Tracked ${name}!`);
      }

      setIsAddModalOpen(false);
      resetForm();
      fetchSubscriptions();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save subscription');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, subName) => {
    if (!window.confirm(`Are you sure you want to delete "${subName}"?`)) return;
    try {
      await deleteSubscription(id);
      toast.success(`Deleted ${subName}`);
      fetchSubscriptions();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete subscription');
    }
  };

  const handleLogAsExpense = async (sub) => {
    if (!onLogExpense) return;
    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      await onLogExpense({
        type: 'expense',
        amount: Number(sub.amount),
        category: sub.category || 'Bills & Utilities',
        description: `${sub.name} (Subscription Renewal)`,
        accountId: sub.accountId || accounts[0]?.id || 'acc_main',
        accountName: sub.accountName || accounts[0]?.name || 'Bank',
        date: todayStr
      });
      await updateSubscription(sub.id, { lastPaidDate: todayStr });
      toast.success(`Logged ₹${sub.amount} expense for ${sub.name}!`);
      fetchSubscriptions();
    } catch (err) {
      console.error(err);
      toast.error('Failed to log expense');
    }
  };

  // Helper for renewal countdown
  const getRenewalInfo = (sub) => {
    const today = new Date();
    const currentDay = today.getDate();
    const targetDay = parseInt(sub.renewalDay || 1, 10);
    
    let daysLeft;
    if (targetDay >= currentDay) {
      daysLeft = targetDay - currentDay;
    } else {
      // Days left until next month
      const daysInCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      daysLeft = (daysInCurrentMonth - currentDay) + targetDay;
    }

    let badgeText = '';
    let badgeColor = 'text-slate-400 bg-slate-800 border-slate-700';

    if (daysLeft === 0) {
      badgeText = 'Due Today';
      badgeColor = 'text-amber-400 bg-amber-500/15 border-amber-500/30 font-bold';
    } else if (daysLeft === 1) {
      badgeText = 'Due Tomorrow';
      badgeColor = 'text-amber-400 bg-amber-500/15 border-amber-500/30 font-bold';
    } else if (daysLeft <= 3) {
      badgeText = `Due in ${daysLeft} days`;
      badgeColor = 'text-amber-300 bg-amber-500/10 border-amber-500/20';
    } else {
      badgeText = `Renews in ${daysLeft} days`;
      badgeColor = 'text-slate-400 bg-slate-800/80 border-slate-700/60';
    }

    return { daysLeft, badgeText, badgeColor, targetDay };
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & KPI Summary Cards */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Repeat className="w-6 h-6 text-cyan-400" />
            <span>Recurring Subscriptions Tracker</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Track OTT, Gym, Broadband, Cloud and SaaS commitments with automated renewals
          </p>
        </div>

        <button
          onClick={() => openAddModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-cyan-500/20 transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Subscription</span>
        </button>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="fintech-card border border-white/[0.08] rounded-3xl p-5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Monthly Commitment
          </span>
          <div className="text-2xl font-amount font-extrabold text-white">
            <PrivacyAmount amount={metrics.monthlyTotal} />
            <span className="text-xs font-normal text-slate-500 ml-1.5">/ month</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-2 block">
            Across {metrics.activeCount} active recurring services
          </span>
        </div>

        <div className="fintech-card border border-white/[0.08] rounded-3xl p-5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Annualized Cost Sum
          </span>
          <div className="text-2xl font-amount font-extrabold text-purple-400">
            <PrivacyAmount amount={metrics.annualTotal} />
            <span className="text-xs font-normal text-slate-500 ml-1.5">/ year</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-2 block">
            Total yearly recurring drain on cashflow
          </span>
        </div>

        <div className="fintech-card border border-white/[0.08] rounded-3xl p-5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Active Subscriptions
          </span>
          <div className="text-2xl font-amount font-extrabold text-emerald-400">
            {metrics.activeCount}
            <span className="text-xs font-normal text-slate-500 ml-1.5">Services</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-2 block">
            Auto-debits monitored against low balances
          </span>
        </div>
      </div>

      {/* Quick Add Presets Bar */}
      <div className="fintech-card border border-white/[0.08] rounded-3xl p-4 sm:p-5 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Quick Add Popular Subscriptions
          </span>
        </div>
        <div className="flex items-center gap-2.5 overflow-x-auto custom-scrollbar pb-1">
          {PRESET_SERVICES.map((p, idx) => {
            const Icon = p.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => openAddModal(p)}
                className={`flex items-center gap-2 px-3 py-2 rounded-2xl border text-xs font-bold shrink-0 transition-all hover:scale-105 active:scale-95 cursor-pointer ${p.color}`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{p.name}</span>
                <span className="font-amount opacity-80 text-[11px]">₹{p.amount}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Subscriptions Grid */}
      {isLoading ? (
        <LoadingScreen fullScreen={false} size="sm" message="Loading Subscriptions..." subtext="" />
      ) : subscriptions.length === 0 ? (
        <div className="fintech-card border border-white/[0.08] rounded-3xl p-10 text-center shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-dark-950/80 border border-white/[0.08] flex items-center justify-center mx-auto mb-4 text-cyan-400">
            <Repeat className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1 tracking-tight">No Subscriptions Tracked Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-5">
            Add Netflix, Spotify, Gym, Cloud, or Broadband subscriptions to forecast recurring renewals and avoid surprise bank debits.
          </p>
          <button
            onClick={() => openAddModal()}
            className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
          >
            Track First Subscription
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subscriptions.map(sub => {
            const renewal = getRenewalInfo(sub);
            const numAmt = Number(sub.amount) || 0;
            const annualCost = sub.billingCycle === 'yearly' 
              ? numAmt 
              : sub.billingCycle === 'quarterly' 
              ? numAmt * 4 
              : numAmt * 12;

            return (
              <div
                key={sub.id}
                className="fintech-card border border-white/[0.08] hover:border-cyan-500/40 rounded-3xl p-5 shadow-xl transition-all flex flex-col justify-between group relative overflow-hidden"
              >
                <div>
                  {/* Top Row: Name, Category, Renewal Badge */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h4 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {sub.name}
                      </h4>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {sub.category}
                      </span>
                    </div>

                    <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full border ${renewal.badgeColor}`}>
                      {renewal.badgeText}
                    </span>
                  </div>

                  {/* Amount Display */}
                  <div className="my-3">
                    <div className="text-2xl font-amount font-extrabold text-white">
                      <PrivacyAmount amount={numAmt} />
                      <span className="text-xs font-normal text-slate-400 ml-1">
                        / {sub.billingCycle === 'yearly' ? 'yr' : sub.billingCycle === 'quarterly' ? 'quarter' : 'mo'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 font-amount">
                      Annual: ₹{annualCost.toLocaleString('en-IN')}/yr
                    </div>
                  </div>

                  {/* Metadata: Account and Renewal Date */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Calendar className="w-3.5 h-3.5" /> Renews On:
                      </span>
                      <span className="font-semibold text-slate-300">
                        Day {sub.renewalDay || 1} of month
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <CreditCard className="w-3.5 h-3.5" /> Debit Bank:
                      </span>
                      <span className="font-semibold text-slate-300 truncate max-w-[140px]">
                        {sub.accountName || 'Primary Account'}
                      </span>
                    </div>

                    {sub.lastPaidDate && (
                      <div className="flex items-center justify-between text-[11px] text-emerald-400/80">
                        <span>Last Paid:</span>
                        <span>{sub.lastPaidDate}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleLogAsExpense(sub)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    title="Log current cycle payment directly to expenses ledger"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Log Paid</span>
                  </button>

                  <button
                    onClick={() => openEditModal(sub)}
                    className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 border border-slate-700/60 transition-colors cursor-pointer"
                    title="Edit Subscription"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(sub.id, sub.name)}
                    className="p-2 text-rose-400 hover:text-rose-300 rounded-xl hover:bg-rose-500/10 border border-rose-500/20 transition-colors cursor-pointer"
                    title="Delete Subscription"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Subscription Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div 
            className="fintech-card border border-white/[0.1] rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Repeat className="w-5 h-5 text-cyan-400" />
                {editingSub ? 'Edit Subscription' : 'Track New Subscription'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 rounded-lg hover:bg-slate-800"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Subscription / Service Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Netflix Premium 4K, Anytime Fitness"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="649"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-amount font-bold text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Billing Cycle
                  </label>
                  <CustomDropdown
                    value={billingCycle}
                    onChange={setBillingCycle}
                    options={cycleOptions}
                    placeholder="Select cycle"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <CustomDropdown
                    value={category}
                    onChange={setCategory}
                    options={subCategoryOptions}
                    placeholder="Select category"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Renewal Day of Month
                  </label>
                  <CustomDropdown
                    value={renewalDay}
                    onChange={setRenewalDay}
                    options={renewalDayOptions}
                    placeholder="Select day"
                    searchable={true}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                  Linked Bank Account
                </label>
                <CustomDropdown
                  value={accountId}
                  onChange={setAccountId}
                  options={subAccountOptions}
                  placeholder="Select bank account"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-cyan-500/25 transition-all mt-4 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : editingSub ? 'Update Subscription' : 'Save Subscription'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
