import { useState, useEffect } from 'react';
import { PlusCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { format } from 'date-fns';

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

export default function AddTransaction({ onAddTransaction, isLoading, customCategories = [], onAddCustomCategory }) {
  const allCategories = [...DEFAULT_CATEGORIES, ...customCategories.filter(c => !DEFAULT_CATEGORIES.includes(c))];
  
  const [type, setType] = useState('expense'); // 'expense' or 'income'
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(allCategories[0]);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    if (!category && allCategories.length > 0) {
      setCategory(allCategories[0]);
    }
  }, [allCategories, category]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !date) return;

    let finalCategory = category;
    
    if (isAddingCustom && newCategoryName.trim()) {
      finalCategory = newCategoryName.trim();
      if (onAddCustomCategory) {
        await onAddCustomCategory(finalCategory);
      }
    }

    await onAddTransaction({
      type,
      amount: parseFloat(amount),
      description,
      category: finalCategory,
      date
    });

    setAmount('');
    setDescription('');
    if (isAddingCustom) {
      setIsAddingCustom(false);
      setNewCategoryName('');
      setCategory(finalCategory);
    }
  };

  return (
    <div className="bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-700/50">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-emerald-400" />
          New Transaction
        </h2>
        
        {/* Toggle Income/Expense */}
        <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`px-3 py-1 text-sm font-medium rounded-md flex items-center gap-1 transition-colors ${
              type === 'expense' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowDownRight className="w-4 h-4" />
            Expense
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`px-3 py-1 text-sm font-medium rounded-md flex items-center gap-1 transition-colors ${
              type === 'income' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            Income
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Amount (₹)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Description (Optional)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
            placeholder="What was this for?"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Category</label>
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
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors text-slate-200"
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
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                  placeholder="New category..."
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingCustom(false);
                    setNewCategoryName('');
                  }}
                  className="px-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors [color-scheme:dark]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full text-white font-medium py-3 rounded-lg mt-6 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg ${
            type === 'expense' ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
          }`}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            `Save ${type === 'expense' ? 'Expense' : 'Income'}`
          )}
        </button>
      </form>
    </div>
  );
}
