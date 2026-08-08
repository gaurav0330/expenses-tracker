import { useState } from 'react';
import { Trash2, ShoppingBag, Coffee, Car, Film, Home, Dumbbell, Plane, MoreHorizontal, ArrowUpRight, ArrowDownRight, Search, Download, Filter } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { formatINR } from '../lib/utils';
import toast from 'react-hot-toast';

const CategoryIcon = ({ category, className }) => {
  const icons = {
    'Food & Dining': <Coffee className={className} />,
    'Transportation': <Car className={className} />,
    'Shopping': <ShoppingBag className={className} />,
    'Entertainment': <Film className={className} />,
    'Bills & Utilities': <Home className={className} />,
    'Health & Fitness': <Dumbbell className={className} />,
    'Travel': <Plane className={className} />,
    'Other': <MoreHorizontal className={className} />
  };
  return icons[category] || <MoreHorizontal className={className} />;
};

export default function TransactionList({ transactions, onDeleteTransaction, isLoading, currentBalance, previousBalance = 0 }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  if (isLoading) {
    return (
      <div className="bg-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl border border-slate-700/50 h-[580px] max-h-[80vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl border border-slate-700/50 h-[580px] max-h-[80vh] flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4">
          <ShoppingBag className="w-8 h-8 text-slate-600" />
        </div>
        <h3 className="text-lg font-medium text-slate-300">No transactions yet</h3>
        <p className="text-slate-500 mt-1 max-w-[250px]">You haven't added any transactions for this month. Add one to get started!</p>
      </div>
    );
  }

  // Calculate running balance for each transaction in chronological order (oldest to newest)
  const transactionsWithBalance = (() => {
    const sortedAsc = [...transactions].sort((a, b) => 
      new Date(a.date) - new Date(b.date) || new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
    );

    let running = previousBalance;
    const balanceMap = new Map();

    sortedAsc.forEach((t) => {
      if (t.type === 'income') {
        running += t.amount;
      } else {
        running -= t.amount;
      }
      balanceMap.set(t.id, running);
    });

    return transactions.map(t => ({
      ...t,
      runningBalance: balanceMap.get(t.id) ?? 0
    }));
  })();

  // Filtered transactions
  const filteredTransactions = transactionsWithBalance.filter(t => {
    const matchesCategory = selectedCategory === 'ALL' || t.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      (t.description && t.description.toLowerCase().includes(q)) || 
      (t.category && t.category.toLowerCase().includes(q)) ||
      t.amount.toString().includes(q);
    return matchesCategory && matchesSearch;
  });

  // Extract unique categories for filter dropdown
  const uniqueCategories = Array.from(new Set(transactions.map(t => t.category)));

  // Export CSV Handler
  const handleExportCSV = () => {
    if (transactionsWithBalance.length === 0) return;
    
    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount (INR)', 'Running Balance (INR)'];
    const rows = transactionsWithBalance.map(t => [
      t.date,
      t.type,
      `"${(t.category || '').replace(/"/g, '""')}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      t.amount,
      t.runningBalance
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Transactions_${format(new Date(), 'yyyy_MM_dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV Statement exported!');
  };

  return (
    <div className="bg-[#111827] rounded-2xl p-5 sm:p-6 shadow-xl border border-slate-800/80 overflow-hidden flex flex-col h-[580px] max-h-[80vh]">
      {/* Card Header */}
      <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
        <h2 className="text-xl font-bold text-slate-100">Recent Transactions</h2>
        <div className="flex items-center gap-2">
          {currentBalance !== undefined && (
            <div className="bg-slate-900/90 px-3.5 py-1.5 rounded-xl border border-slate-700/60 flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Current Balance:</span>
              <span className={`text-sm font-bold font-amount ${currentBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatINR(currentBalance)}
              </span>
            </div>
          )}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold rounded-xl border border-slate-700/60 transition-all shadow-sm"
            title="Export Statement as CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" /> Export CSV
          </button>
        </div>
      </div>

      {/* Search & Filter Controls Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search description, category..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            {uniqueCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
        {filteredTransactions.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-12">
            <Search className="w-8 h-8 text-slate-600 mb-2" />
            <p className="text-sm font-medium text-slate-400">No matching transactions</p>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your search query or category filter.</p>
          </div>
        ) : (
          filteredTransactions.map((t) => {
          const isIncome = t.type === 'income';
          return (
            <div 
              key={t.id} 
              className="group bg-slate-900/50 hover:bg-slate-900 rounded-xl p-4 flex items-center justify-between border border-transparent hover:border-slate-700 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isIncome ? <ArrowUpRight className="w-5 h-5" /> : <CategoryIcon category={t.category} className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="font-medium text-slate-200">
                    {t.description || (isIncome ? 'Income' : 'Expense')}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                      {t.category}
                    </span>
                    <span className="text-xs text-slate-500">
                      {format(parseISO(t.date), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <span className={`font-bold text-base sm:text-lg font-amount ${isIncome ? 'text-emerald-400' : 'text-slate-200'}`}>
                    {isIncome ? '+' : '-'}{formatINR(t.amount)}
                  </span>
                  <span className="text-xs text-slate-400 font-medium mt-0.5 flex items-center gap-1 font-amount">
                    <span className="text-slate-500 font-sans">Bal:</span>
                    <span className={t.runningBalance >= 0 ? 'text-emerald-400/90' : 'text-rose-400/90'}>
                      {formatINR(t.runningBalance)}
                    </span>
                  </span>
                </div>
                <button
                  onClick={() => onDeleteTransaction(t.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                  title="Delete transaction"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })
      )}
      </div>
    </div>
  );
}
