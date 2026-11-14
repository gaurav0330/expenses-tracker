import { useState, useEffect, useMemo } from 'react';
import { PlusCircle, ArrowRightLeft, Sparkles, Calendar, Tag, Building2 } from 'lucide-react';
import { format, isSameMonth, subDays } from 'date-fns';
import { formatINR } from '../lib/utils';
import { detectCategory } from '../lib/smartCategorizer';
import CustomDropdown from './CustomDropdown';
import toast from 'react-hot-toast';

const DEFAULT_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Health & Fitness',
  'Travel',
  'Salary',
  'Lending',
  'SIP / Investment',
  'Other'
];

const PRESET_AMOUNTS = [100, 500, 1000, 2000, 5000];

export default function AddTransaction({ 
  onAddTransaction, 
  onAddTransfer,
  isLoading, 
  customCategories = [], 
  onAddCustomCategory, 
  currentDate,
  accounts = [],
  accountBalances = {},
  onOpenManageAccounts
}) {
  const allCategories = useMemo(() => [
    ...DEFAULT_CATEGORIES, 
    ...customCategories.filter(c => !DEFAULT_CATEGORIES.includes(c))
  ], [customCategories]);
  
  const [type, setType] = useState('expense'); // 'expense', 'income', or 'transfer'
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(allCategories[0]);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [autoMatchedCategory, setAutoMatchedCategory] = useState(null);
  const [hasUserManuallySelectedCategory, setHasUserManuallySelectedCategory] = useState(false);

  // Bank account selection
  const defaultAccId = useMemo(() => {
    return accounts.find(a => a.isDefault)?.id || accounts[0]?.id || 'acc_main';
  }, [accounts]);

  const [selectedAccountId, setSelectedAccountId] = useState(defaultAccId);
  const [fromAccountId, setFromAccountId] = useState(defaultAccId);
  const [toAccountId, setToAccountId] = useState(accounts[1]?.id || defaultAccId);

  useEffect(() => {
    if (defaultAccId && !selectedAccountId) {
      setSelectedAccountId(defaultAccId);
    }
    if (defaultAccId && !fromAccountId) {
      setFromAccountId(defaultAccId);
    }
  }, [defaultAccId, selectedAccountId, fromAccountId]);

  // Synchronize form date when currentDate changes if not in same month
  useEffect(() => {
    if (currentDate) {
      const today = new Date();
      if (isSameMonth(currentDate, today)) {
        setDate(format(today, 'yyyy-MM-dd'));
      } else {
        setDate(format(currentDate, 'yyyy-MM-01'));
      }
    }
  }, [currentDate]);

  useEffect(() => {
    if (!category && allCategories.length > 0) {
      setCategory(allCategories[0]);
    }
  }, [allCategories, category]);

  const accountOptions = useMemo(() => {
    return accounts.map(acc => {
      const bal = accountBalances[acc.id] ?? (Number(acc.openingBalance) || 0);
      return {
        value: acc.id,
        label: `${acc.name} (${acc.type.toUpperCase()})`,
        subtext: formatINR(bal)
      };
    });
  }, [accounts, accountBalances]);

  const fromAccountOptions = accountOptions;
  const toAccountOptions = useMemo(() => {
    return accountOptions.filter(opt => opt.value !== fromAccountId);
  }, [accountOptions, fromAccountId]);

  const categoryOptions = useMemo(() => [
    ...allCategories.map(cat => ({ value: cat, label: cat })),
    { value: 'ADD_NEW', label: '+ Add Custom Category' }
  ], [allCategories]);

  const handleCategorySelect = (val) => {
    if (val === 'ADD_NEW') {
      setIsAddingCustom(true);
    } else {
      setCategory(val);
      setHasUserManuallySelectedCategory(true);
      setAutoMatchedCategory(null);
    }
  };

  const handlePresetAmount = (presetVal) => {
    const currentVal = parseFloat(amount) || 0;
    setAmount((currentVal + presetVal).toString());
  };

  const handleSetQuickDate = (daysAgo = 0) => {
    const targetDate = daysAgo === 0 ? new Date() : subDays(new Date(), daysAgo);
    setDate(format(targetDate, 'yyyy-MM-dd'));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid amount greater than 0');
      return;
    }
    if (!date) {
      toast.error('Please select a valid date');
      return;
    }

    if (type === 'transfer') {
      if (!fromAccountId || !toAccountId) {
        toast.error('Please select both From and To accounts');
        return;
      }
      if (fromAccountId === toAccountId) {
        toast.error('Source and Destination accounts must be different');
        return;
      }
      const fromAcc = accounts.find(a => a.id === fromAccountId) || { name: 'Account' };
      const toAcc = accounts.find(a => a.id === toAccountId) || { name: 'Account' };

      try {
        if (onAddTransfer) {
          await onAddTransfer({
            fromAccountId,
            fromAccountName: fromAcc.name,
            toAccountId,
            toAccountName: toAcc.name,
            amount: numAmount,
            description: description.trim() || `Shifted to ${toAcc.name}`,
            date
          });
        } else {
          await onAddTransaction({
            type: 'transfer',
            amount: numAmount,
            description: description.trim() || `Transfer from ${fromAcc.name} to ${toAcc.name}`,
            category: 'Transfer',
            fromAccountId,
            fromAccountName: fromAcc.name,
            toAccountId,
            toAccountName: toAcc.name,
            date
          });
        }
        toast.success(`Successfully shifted ${formatINR(numAmount)} to ${toAcc.name}!`);
        setAmount('');
        setDescription('');
      } catch {
        toast.error('Failed to complete transfer.');
      }
      return;
    }

    // Expense or Income
    let finalCategory = category;
    if (isAddingCustom && newCategoryName.trim()) {
      finalCategory = newCategoryName.trim();
      if (onAddCustomCategory) {
        await onAddCustomCategory(finalCategory);
      }
    }

    const selectedAcc = accounts.find(a => a.id === selectedAccountId) || accounts[0] || { id: 'acc_main', name: 'Main Bank' };

    try {
      await onAddTransaction({
        type,
        amount: numAmount,
        description: description.trim(),
        category: finalCategory,
        accountId: selectedAcc.id,
        accountName: selectedAcc.name,
        date
      });
      toast.success(`${type === 'expense' ? 'Expense' : 'Income'} recorded in ${selectedAcc.name}!`);
      setAmount('');
      setDescription('');
      setAutoMatchedCategory(null);
      setHasUserManuallySelectedCategory(false);
      if (isAddingCustom) {
        setIsAddingCustom(false);
        setNewCategoryName('');
        setCategory(finalCategory);
      }
    } catch {
      toast.error('Failed to add transaction.');
    }
  };

  const handleDescriptionChange = (e) => {
    const val = e.target.value;
    setDescription(val);

    if (type !== 'transfer' && !hasUserManuallySelectedCategory) {
      const match = detectCategory(val, allCategories);
      if (match) {
        setCategory(match.category);
        setAutoMatchedCategory(match);
      } else {
        setAutoMatchedCategory(null);
      }
    }
  };

  const currentTheme = type === 'expense' 
    ? { 
        ring: 'focus:ring-rose-500/50 focus:border-rose-500', 
        badge: 'bg-rose-500 text-white shadow-rose-500/25',
        btn: 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 shadow-rose-500/25',
        accentText: 'text-rose-400'
      }
    : type === 'income' 
    ? { 
        ring: 'focus:ring-emerald-500/50 focus:border-emerald-500', 
        badge: 'bg-emerald-500 text-white shadow-emerald-500/25',
        btn: 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/25',
        accentText: 'text-emerald-400'
      }
    : { 
        ring: 'focus:ring-indigo-500/50 focus:border-indigo-500', 
        badge: 'bg-indigo-600 text-white shadow-indigo-600/25',
        btn: 'bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 shadow-indigo-500/25',
        accentText: 'text-indigo-400'
      };

  return (
    <div className="fintech-card rounded-3xl p-5 sm:p-7 shadow-2xl transition-all relative overflow-hidden">
      {/* Subtle Ambient Backlight Glow */}
      <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-20 ${
        type === 'expense' ? 'bg-rose-500' : type === 'income' ? 'bg-emerald-500' : 'bg-indigo-500'
      }`} />
      
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 mb-5 pb-4 border-b border-white/[0.06] relative z-10">
        <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
          <PlusCircle className={`w-5 h-5 ${currentTheme.accentText} shrink-0`} />
          <span className="tracking-tight text-white font-extrabold">Quick Record</span>
        </h2>
        
        {/* 3-Way Mode Switcher: Expense | Income | Transfer */}
        <div className="flex bg-dark-950/80 p-1 rounded-2xl border border-white/[0.06] shadow-inner backdrop-blur-md">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
              type === 'expense' 
                ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md shadow-rose-500/30' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Expense
          </button>
          
          <button
            type="button"
            onClick={() => setType('income')}
            className={`px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
              type === 'income' 
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/30' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Income
          </button>

          <button
            type="button"
            onClick={() => setType('transfer')}
            className={`px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1 cursor-pointer ${
              type === 'transfer' 
                ? 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-md shadow-indigo-600/30' 
                : 'text-slate-400 hover:text-white'
            }`}
            title="Shift money between bank accounts"
          >
            <ArrowRightLeft className="w-3 h-3" />
            <span>Shift</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Large Amount Input with Quick Preset Chips */}
        <div>
          <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2">
            Amount (₹)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-amount font-bold text-slate-500">
              ₹
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onWheel={(e) => e.target.blur()}
              onKeyDown={(e) => {
                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                  e.preventDefault();
                }
              }}
              className={`w-full bg-dark-950/80 border border-white/[0.08] rounded-2xl pl-10 pr-4 py-3.5 text-white text-2xl font-amount font-extrabold focus:outline-none focus:ring-2 ${currentTheme.ring} transition-all shadow-inner placeholder:text-slate-600`}
              placeholder="0.00"
            />
          </div>

          {/* Quick Preset Amount Buttons */}
          <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto custom-scrollbar pb-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Quick:
            </span>
            {PRESET_AMOUNTS.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handlePresetAmount(val)}
                className="px-2.5 py-1 bg-white/[0.04] hover:bg-white/[0.08] hover:text-white text-slate-300 rounded-xl text-xs font-bold font-amount border border-white/[0.06] transition-all shrink-0 active:scale-95 cursor-pointer"
              >
                +{val >= 1000 ? `${val / 1000}k` : val}
              </button>
            ))}
            {amount && (
              <button
                type="button"
                onClick={() => setAmount('')}
                className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-[11px] font-bold transition-all shrink-0 cursor-pointer"
                title="Clear amount"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* BANK ACCOUNT SELECTOR */}
        {type === 'transfer' ? (
          <div className="bg-dark-950/60 border border-white/[0.06] rounded-2xl p-3.5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                  From (Debit Bank)
                </label>
                <CustomDropdown
                  value={fromAccountId}
                  onChange={setFromAccountId}
                  options={fromAccountOptions}
                  placeholder="Select source bank"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                  To (Credit Bank)
                </label>
                <CustomDropdown
                  value={toAccountId}
                  onChange={setToAccountId}
                  options={toAccountOptions}
                  placeholder="Select destination bank"
                />
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {type === 'expense' ? 'Paid From (Bank / Wallet)' : 'Deposit To (Bank / Wallet)'}
              </label>
              {onOpenManageAccounts && (
                <button
                  type="button"
                  onClick={onOpenManageAccounts}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold transition-colors cursor-pointer"
                >
                  + Add Bank
                </button>
              )}
            </div>
            <CustomDropdown
              value={selectedAccountId}
              onChange={setSelectedAccountId}
              options={accountOptions}
              icon={Building2}
              placeholder="Select bank / wallet"
            />
          </div>
        )}

        {/* Description Input */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
              Description (Optional)
            </label>
            {autoMatchedCategory && type !== 'transfer' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 animate-fadeIn">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                Auto-detected: <strong>{autoMatchedCategory.category}</strong>
              </span>
            )}
          </div>
          <input
            type="text"
            value={description}
            onChange={handleDescriptionChange}
            className="w-full bg-dark-950/80 border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-inner placeholder:text-slate-500"
            placeholder={type === 'transfer' ? 'e.g. ATM Cash, UPI, Split' : 'e.g. Swiggy, Uber, Netflix, Starbucks'}
          />
        </div>

        {/* Category & Date Grid */}
        <div className={`grid gap-3.5 ${type === 'transfer' ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
          {type !== 'transfer' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  Category
                </label>
                {autoMatchedCategory && (
                  <span className="text-[10px] text-slate-400">
                    from "{autoMatchedCategory.keyword}"
                  </span>
                )}
              </div>
              {!isAddingCustom ? (
                <CustomDropdown
                  value={category}
                  onChange={handleCategorySelect}
                  options={categoryOptions}
                  icon={Tag}
                  placeholder="Select Category"
                  searchable={categoryOptions.length > 7}
                />
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    autoFocus
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="flex-1 bg-dark-950/80 border border-white/[0.08] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-white shadow-inner"
                    placeholder="New category..."
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCustom(false);
                      setNewCategoryName('');
                    }}
                    className="px-3 bg-white/[0.08] hover:bg-white/[0.14] rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Date
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleSetQuickDate(0)}
                  className="text-[10px] text-slate-400 hover:text-emerald-400 px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/[0.06] cursor-pointer"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleSetQuickDate(1)}
                  className="text-[10px] text-slate-400 hover:text-cyan-400 px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/[0.06] cursor-pointer"
                >
                  Y'day
                </button>
              </div>
            </div>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-dark-950/80 border border-white/[0.08] rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-white text-xs sm:text-sm shadow-inner [color-scheme:dark]"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full text-white font-extrabold py-3.5 rounded-2xl mt-4 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base shadow-xl cursor-pointer ${currentTheme.btn}`}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            type === 'expense' 
              ? 'Save Expense' 
              : type === 'income' 
              ? 'Save Income' 
              : 'Execute Fund Transfer'
          )}
        </button>
      </form>
    </div>
  );
}
