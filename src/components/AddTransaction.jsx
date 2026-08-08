import { useState, useEffect } from 'react';
import { PlusCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { format } from 'date-fns';
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

    try {
      await onAddTransaction({
        type,
        amount: parseFloat(amount),
        description,
        category: finalCategory,
        date
      });
      toast.success(`${type === 'expense' ? 'Expense' : 'Income'} added successfully!`);
      setAmount('');
      setDescription('');
      if (isAddingCustom) {
        setIsAddingCustom(false);
        setNewCategoryName('');
        setCategory(finalCategory);
      }
    } catch (error) {
      toast.error('Failed to add transaction.');
    }
  };

  return (
    <div className="bg-[#111827] rounded-3xl p-5 sm:p-8 shadow-2xl border border-slate-800/80">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <PlusCircle className="w-6 h-6 text-emerald-400 shrink-0" />
          <span className="hidden sm:inline">New Transaction</span>
          <span className="sm:hidden">New</span>
        </h2>
        
        {/* Improved Sleek Toggle Switch */}
        <button
          type="button"
          onClick={() => setType(type === 'expense' ? 'income' : 'expense')}
          className="relative flex bg-slate-900 p-1 rounded-xl border border-slate-700/50 shadow-inner w-[220px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        >
          {/* Animated Slider Background */}
          <div 
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg shadow-lg transition-all duration-300 ease-out ${
              type === 'expense' ? 'left-1 bg-rose-500 shadow-rose-500/20' : 'left-[calc(50%+2px)] bg-emerald-500 shadow-emerald-500/20'
            }`} 
          />
          
          <div
            className={`relative w-1/2 py-2.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider z-10 transition-colors duration-300 rounded-lg ${
              type === 'expense' ? 'text-white' : 'text-slate-400'
            }`}
          >
            Expense
          </div>
          
          <div
            className={`relative w-1/2 py-2.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider z-10 transition-colors duration-300 rounded-lg ${
              type === 'income' ? 'text-white' : 'text-slate-400'
            }`}
          >
            Income
          </div>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">Amount (₹)</label>
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
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-5 py-4 text-white text-lg font-amount focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-inner"
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">Description (Optional)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-5 py-4 text-white text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-inner"
            placeholder="What was this for?"
          />
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Category</label>
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
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-white text-base shadow-inner appearance-none cursor-pointer"
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
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-white shadow-inner"
                  placeholder="New category..."
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingCustom(false);
                    setNewCategoryName('');
                  }}
                  className="px-4 bg-slate-700 hover:bg-slate-600 rounded-xl text-sm font-bold transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-white shadow-inner [color-scheme:dark]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full text-white font-bold py-4 rounded-xl mt-8 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg shadow-xl ${
            type === 'expense' ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
          }`}
        >
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            `Save ${type === 'expense' ? 'Expense' : 'Income'}`
          )}
        </button>
      </form>
    </div>
  );
}
