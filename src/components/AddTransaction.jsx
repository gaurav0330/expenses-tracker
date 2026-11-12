import { useState, useEffect, useMemo } from 'react';
import { PlusCircle, ArrowRightLeft } from 'lucide-react';
import { format, isSameMonth } from 'date-fns';
import { formatINR } from '../lib/utils';
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
      toast.success(`${type === 'expense' ? 'Expense' : 'Income'} added to ${selectedAcc.name}!`);
      setAmount('');
      setDescription('');
      if (isAddingCustom) {
        setIsAddingCustom(false);
        setNewCategoryName('');
        setCategory(finalCategory);
      }
    } catch {
      toast.error('Failed to add transaction.');
    }
  };

  return (
    <div className="bg-[#111827] rounded-3xl p-5 sm:p-8 shadow-2xl border border-slate-800/80">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <PlusCircle className="w-6 h-6 text-emerald-400 shrink-0" />
          <span>New Entry</span>
        </h2>
        
        {/* 3-Way Mode Switcher: Expense | Income | Transfer */}
        <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800 shadow-inner">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`px-3 sm:px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
              type === 'expense' 
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Expense
          </button>
          
          <button
            type="button"
            onClick={() => setType('income')}
            className={`px-3 sm:px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
              type === 'income' 
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Income
          </button>

          <button
            type="button"
            onClick={() => setType('transfer')}
            className={`px-3 sm:px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1 ${
              type === 'transfer' 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25' 
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
        
        {/* Amount Input */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Amount (₹)
          </label>
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
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-3.5 text-white text-xl font-amount focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-inner"
            placeholder="0.00"
          />
        </div>

        {/* TRANSFER FIELDS */}
        {type === 'transfer' ? (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  From (Debit Bank)
                </label>
                <select
                  value={fromAccountId}
                  onChange={(e) => setFromAccountId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({formatINR(accountBalances[acc.id] ?? acc.openingBalance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  To (Credit Bank)
                </label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id} disabled={acc.id === fromAccountId}>
                      {acc.name} {acc.id === fromAccountId ? '(Selected)' : `(${formatINR(accountBalances[acc.id] ?? acc.openingBalance)})`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ) : (
          /* EXPENSE / INCOME ACCOUNT SELECTOR */
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {type === 'expense' ? 'Paid From (Account / Wallet)' : 'Deposit To (Account / Wallet)'}
              </label>
              {onOpenManageAccounts && (
                <button
                  type="button"
                  onClick={onOpenManageAccounts}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
                >
                  + Add Bank
                </button>
              )}
            </div>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-inner cursor-pointer"
            >
              {accounts.map(acc => {
                const bal = accountBalances[acc.id] ?? (Number(acc.openingBalance) || 0);
                return (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.type.toUpperCase()}) — Bal: {formatINR(bal)}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {/* Description Input */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Description (Optional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-inner"
            placeholder={type === 'transfer' ? 'e.g. ATM Cash, UPI, Split' : 'What was this for?'}
          />
        </div>

        {/* Category & Date Grid (Category hidden for Transfer) */}
        <div className={`grid gap-4 ${type === 'transfer' ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
          {type !== 'transfer' && (
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Category</label>
              {!isAddingCustom ? (
                <select
                  value={category}
                  onChange={(e) => {
                    if (e.target.value === 'ADD_NEW') {
                      setIsAddingCustom(true);
                    } else {
                      setCategory(e.target.value);
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-white text-sm shadow-inner cursor-pointer"
                >
                  {allCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="ADD_NEW" className="font-bold text-emerald-400">+ Add Custom Category</option>
                </select>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    autoFocus
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-white shadow-inner"
                    placeholder="New category..."
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCustom(false);
                      setNewCategoryName('');
                    }}
                    className="px-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-xs font-bold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-white text-sm shadow-inner [color-scheme:dark]"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full text-white font-bold py-3.5 rounded-xl mt-4 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base shadow-xl ${
            type === 'expense' 
              ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20' 
              : type === 'income' 
              ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' 
              : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'
          }`}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            type === 'expense' 
              ? 'Save Expense' 
              : type === 'income' 
              ? 'Save Income' 
              : 'Shift Funds Between Accounts'
          )}
        </button>
      </form>
    </div>
  );
}
