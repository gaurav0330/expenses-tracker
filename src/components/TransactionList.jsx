import { useState, useMemo } from 'react';
import { Trash2, ShoppingBag, Coffee, Car, Film, Home, Dumbbell, Plane, MoreHorizontal, ArrowUpRight, ArrowRightLeft, Search, Download, Building2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { PrivacyAmount } from '../context/PrivacyContext';
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
    'Transfer': <ArrowRightLeft className={className} />,
    'Other': <MoreHorizontal className={className} />
  };
  return icons[category] || <MoreHorizontal className={className} />;
};

export default function TransactionList({ 
  transactions = [], 
  onDeleteTransaction, 
  isLoading, 
  currentBalance, 
  previousBalance = 0,
  accounts = [],
  selectedAccountFilter = 'ALL',
  onSelectAccountFilter
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const defaultAccountName = useMemo(() => {
    return accounts.find(a => a.isDefault)?.name || accounts[0]?.name || 'Main Bank';
  }, [accounts]);

  if (isLoading) {
    return (
      <div className="bg-[#111827] rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-800/80 h-[520px] sm:h-[580px] lg:h-[640px] xl:h-[700px] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-[#111827] rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-800/80 h-[520px] sm:h-[580px] lg:h-[640px] xl:h-[700px] flex flex-col items-center justify-center text-center">
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
      } else if (t.type === 'expense') {
        running -= t.amount;
      }
      // Internal transfers between accounts do not change total overall net balance
      balanceMap.set(t.id, running);
    });

    return transactions.map(t => ({
      ...t,
      runningBalance: balanceMap.get(t.id) ?? 0
    }));
  })();

  // Filtered transactions
  const filteredTransactions = transactionsWithBalance.filter(t => {
    // 1. Account Filter
    if (selectedAccountFilter !== 'ALL') {
      const touchesAccount = 
        t.accountId === selectedAccountFilter ||
        (!t.accountId && accounts.find(a => a.id === selectedAccountFilter)?.isDefault) ||
        t.fromAccountId === selectedAccountFilter ||
        t.toAccountId === selectedAccountFilter;
      if (!touchesAccount) return false;
    }

    // 2. Category Filter
    const matchesCategory = selectedCategory === 'ALL' || t.category === selectedCategory;

    // 3. Search Query
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      (t.description && t.description.toLowerCase().includes(q)) || 
      (t.category && t.category.toLowerCase().includes(q)) ||
      (t.accountName && t.accountName.toLowerCase().includes(q)) ||
      (t.fromAccountName && t.fromAccountName.toLowerCase().includes(q)) ||
      (t.toAccountName && t.toAccountName.toLowerCase().includes(q)) ||
      t.amount.toString().includes(q);

    return matchesCategory && matchesSearch;
  });

  // Extract unique categories for filter dropdown
  const uniqueCategories = Array.from(new Set(transactions.map(t => t.category).filter(Boolean)));

  // Export CSV Handler
  const handleExportCSV = () => {
    if (transactionsWithBalance.length === 0) return;
    
    const headers = ['Date', 'Type', 'Category', 'Account / Shift Details', 'Description', 'Amount (INR)', 'Running Balance (INR)'];
    const rows = transactionsWithBalance.map(t => {
      let accLabel = t.accountName || defaultAccountName;
      if (t.type === 'transfer') {
        accLabel = `${t.fromAccountName || 'Account'} -> ${t.toAccountName || 'Account'}`;
      }
      return [
        t.date,
        t.type,
        `"${(t.category || '').replace(/"/g, '""')}"`,
        `"${accLabel.replace(/"/g, '""')}"`,
        `"${(t.description || '').replace(/"/g, '""')}"`,
        t.amount,
        t.runningBalance
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const monthLabel = transactionsWithBalance[0]?.date 
      ? format(parseISO(transactionsWithBalance[0].date), 'MMMM_yyyy') 
      : format(new Date(), 'yyyy_MM');
    link.setAttribute('download', `Transactions_${monthLabel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV Statement exported!');
  };

  return (
    <div className="bg-[#111827] rounded-3xl p-4 sm:p-6 lg:p-7 shadow-2xl border border-slate-800/80 overflow-hidden flex flex-col h-[520px] sm:h-[580px] lg:h-[640px] xl:h-[700px]">
      
      {/* Card Header */}
      <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <span>Recent Transactions</span>
            {selectedAccountFilter !== 'ALL' && (
              <span className="text-xs bg-emerald-500/20 text-emerald-400 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                {accounts.find(a => a.id === selectedAccountFilter)?.name || 'Filtered'}
              </span>
            )}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {currentBalance !== undefined && (
            <div className="bg-slate-900/90 px-3.5 py-1.5 rounded-xl border border-slate-700/60 flex items-center gap-2 shadow-inner">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                {selectedAccountFilter === 'ALL' ? 'Total Balance:' : 'Account Balance:'}
              </span>
              <PrivacyAmount 
                amount={currentBalance} 
                id="tx_header_balance" 
                className={`text-sm font-bold font-amount ${currentBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`} 
              />
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
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 mb-4">
        {/* Search Input */}
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search note, category, bank..."
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-inner"
          />
        </div>

        {/* Bank Account Filter */}
        <div>
          <select
            value={selectedAccountFilter}
            onChange={(e) => onSelectAccountFilter && onSelectAccountFilter(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer shadow-inner"
          >
            <option value="ALL">All Bank Accounts</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.name}</option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer shadow-inner"
          >
            <option value="ALL">All Categories</option>
            {uniqueCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Transactions List */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 sm:pr-2 space-y-2.5 sm:space-y-3 custom-scrollbar">
        {filteredTransactions.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-16">
            <Search className="w-8 h-8 text-slate-600 mb-2" />
            <p className="text-sm font-medium text-slate-400">No matching transactions</p>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your search query, bank filter, or category filter.</p>
          </div>
        ) : (
          filteredTransactions.map((t) => {
            const isIncome = t.type === 'income';
            const isTransfer = t.type === 'transfer';

            return (
              <div 
                key={t.id} 
                className="group bg-slate-900/60 hover:bg-slate-900 rounded-xl p-4 flex items-center justify-between border border-slate-800/60 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                  {/* Icon */}
                  <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 shrink-0 ${
                    isTransfer 
                      ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' 
                      : isIncome 
                      ? 'text-emerald-400' 
                      : 'text-rose-400'
                  }`}>
                    {isTransfer ? (
                      <ArrowRightLeft className="w-5 h-5" />
                    ) : isIncome ? (
                      <ArrowUpRight className="w-5 h-5" />
                    ) : (
                      <CategoryIcon category={t.category} className="w-5 h-5" />
                    )}
                  </div>

                  {/* Title & Metadata */}
                  <div className="min-w-0">
                    <h4 className="font-semibold text-slate-200 text-sm sm:text-base truncate max-w-xs sm:max-w-md">
                      {isTransfer 
                        ? (t.description || `Shift: ${t.fromAccountName || 'Account'} → ${t.toAccountName || 'Account'}`)
                        : (t.description || (isIncome ? 'Income' : 'Expense'))
                      }
                    </h4>

                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1">
                      {/* Bank Account Tag */}
                      {isTransfer ? (
                        <span className="text-[11px] font-bold text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <span>{t.fromAccountName || 'Account'}</span>
                          <span>→</span>
                          <span>{t.toAccountName || 'Account'}</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-300 bg-slate-800/90 border border-slate-700/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>{t.accountName || defaultAccountName}</span>
                        </span>
                      )}

                      {/* Category Tag */}
                      <span className="text-[11px] font-medium text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-md border border-slate-700/30">
                        {t.category || (isTransfer ? 'Transfer' : 'General')}
                      </span>

                      {/* Date */}
                      <span className="text-[11px] text-slate-500">
                        {format(parseISO(t.date), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Amount & Running Balance */}
                <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                  <div className="flex flex-col items-end">
                    <PrivacyAmount
                      amount={t.amount}
                      id={`tx_${t.id}`}
                      prefix={isTransfer ? '⇄ ' : isIncome ? '+' : '-'}
                      className={`font-bold text-base sm:text-lg font-amount ${
                        isTransfer 
                          ? 'text-indigo-400' 
                          : isIncome 
                          ? 'text-emerald-400' 
                          : 'text-slate-200'
                      }`}
                    />
                    <span className="text-[11px] text-slate-400 font-medium mt-0.5 flex items-center gap-1 font-amount">
                      <span className="text-slate-500 font-sans">Bal:</span>
                      <PrivacyAmount
                        amount={t.runningBalance}
                        id={`tx_${t.id}`}
                        className={t.runningBalance >= 0 ? 'text-emerald-400/90' : 'text-rose-400/90'}
                      />
                    </span>
                  </div>

                  <button
                    onClick={() => onDeleteTransaction(t.id)}
                    className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
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
