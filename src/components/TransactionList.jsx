import { useState, useMemo } from 'react';
import { Trash2, ShoppingBag, Coffee, Car, Film, Home, Dumbbell, Plane, MoreHorizontal, ArrowUpRight, ArrowRightLeft, Search, Download, Building2, Tag, FileText } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { PrivacyAmount } from '../context/PrivacyContext';
import { generateExecutivePdfStatement } from '../lib/pdfStatementGenerator';
import LoadingScreen from './LoadingScreen';
import CustomDropdown from './CustomDropdown';
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
  accountBalances = {},
  selectedAccountFilter = 'ALL',
  onSelectAccountFilter,
  user = {},
  currentDate = new Date(),
  totalIncome = 0,
  totalExpense = 0
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const defaultAccountName = useMemo(() => {
    return accounts.find(a => a.isDefault)?.name || accounts[0]?.name || 'Main Bank';
  }, [accounts]);

  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(transactions.map(t => t.category).filter(Boolean)));
  }, [transactions]);

  const accountOptions = useMemo(() => [
    { value: 'ALL', label: 'All Accounts' },
    ...accounts.map(acc => {
      const bal = accountBalances[acc.id] ?? (Number(acc.openingBalance) || 0);
      return {
        value: acc.id,
        label: acc.name,
        subtext: `₹${bal.toLocaleString('en-IN')}`
      };
    })
  ], [accounts, accountBalances]);

  const categoryOptions = useMemo(() => [
    { value: 'ALL', label: 'All Categories' },
    ...uniqueCategories.map(cat => ({ value: cat, label: cat }))
  ], [uniqueCategories]);

  if (isLoading) {
    return (
      <div className="fintech-card rounded-3xl p-5 sm:p-6 shadow-2xl h-[520px] sm:h-[580px] lg:h-[640px] xl:h-[700px] flex items-center justify-center">
        <LoadingScreen fullScreen={false} size="sm" message="Loading Transactions..." subtext="" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="fintech-card rounded-3xl p-5 sm:p-6 shadow-2xl h-[520px] sm:h-[580px] lg:h-[640px] xl:h-[700px] flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-dark-950/80 rounded-2xl border border-white/[0.08] flex items-center justify-center mb-4">
          <ShoppingBag className="w-8 h-8 text-slate-500" />
        </div>
        <h3 className="text-lg font-bold text-white tracking-tight">No transactions yet</h3>
        <p className="text-slate-400 text-xs mt-1 max-w-[260px]">You haven't added any transactions for this month. Add one to get started!</p>
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

  const handleExportPDF = () => {
    if (transactionsWithBalance.length === 0) {
      toast.error('No transactions available to generate PDF statement.');
      return;
    }
    toast.loading('Preparing Executive PDF Statement...', { duration: 1500 });
    generateExecutivePdfStatement({
      user,
      currentDate,
      transactions: transactionsWithBalance,
      accounts,
      accountBalances,
      totalIncome,
      totalExpense,
      netBalance: currentBalance ?? 0
    });
  };

  return (
    <div className="fintech-card rounded-3xl p-4 sm:p-6 lg:p-7 shadow-2xl overflow-hidden flex flex-col h-[520px] sm:h-[580px] lg:h-[640px] xl:h-[700px] relative">
      
      {/* Card Header */}
      <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="tracking-tight font-extrabold">Recent Transactions</span>
            {selectedAccountFilter !== 'ALL' && (
              <span className="text-xs bg-emerald-500/15 text-emerald-400 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                {accounts.find(a => a.id === selectedAccountFilter)?.name || 'Filtered'}
              </span>
            )}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {currentBalance !== undefined && (
            <div className="bg-dark-950/80 px-3.5 py-1.5 rounded-xl border border-white/[0.08] flex items-center gap-2 shadow-inner">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
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
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 hover:text-white text-xs font-bold rounded-xl border border-white/[0.08] transition-all shadow-sm cursor-pointer"
            title="Export Statement as CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" /> Export CSV
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-600/30 to-blue-600/30 hover:from-cyan-600/50 hover:to-blue-600/50 text-cyan-200 hover:text-white text-xs font-bold rounded-xl border border-cyan-500/40 transition-all shadow-sm cursor-pointer"
            title="Export Executive PDF Statement"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" /> Export PDF
          </button>
        </div>
      </div>

      {/* Search & Filter Controls Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 mb-4">
        {/* Search Input */}
        <div className="sm:col-span-2 relative group">
          <Search className="w-4 h-4 text-slate-400 group-hover:text-slate-300 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes, category, bank..."
            className="w-full bg-dark-950/80 hover:bg-dark-900 border border-white/[0.08] hover:border-white/[0.15] rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/80 transition-all shadow-inner"
          />
        </div>

        {/* Bank Account Filter Dropdown */}
        <CustomDropdown
          value={selectedAccountFilter}
          onChange={(val) => onSelectAccountFilter && onSelectAccountFilter(val)}
          options={accountOptions}
          icon={Building2}
          placeholder="All Accounts"
        />

        {/* Category Filter Dropdown */}
        <CustomDropdown
          value={selectedCategory}
          onChange={(val) => setSelectedCategory(val)}
          options={categoryOptions}
          icon={Tag}
          placeholder="All Categories"
          searchable={categoryOptions.length > 6}
        />
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
                className="group bg-white/[0.02] hover:bg-white/[0.05] rounded-2xl p-3.5 sm:p-4 flex items-center justify-between border border-white/[0.04] hover:border-white/[0.1] transition-all"
              >
                <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                  {/* Icon */}
                  <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                    isTransfer 
                      ? 'text-indigo-400 bg-indigo-500/15 border-indigo-500/30' 
                      : isIncome 
                      ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' 
                      : 'text-rose-400 bg-rose-500/15 border-rose-500/30'
                  }`}>
                    {isTransfer ? (
                      <ArrowRightLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : isIncome ? (
                      <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <CategoryIcon category={t.category} className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </div>

                  {/* Title & Metadata */}
                  <div className="min-w-0">
                    <h4 className="font-semibold text-white text-sm sm:text-base truncate max-w-xs sm:max-w-md">
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
                        <span className="text-[11px] font-semibold text-slate-300 bg-white/[0.05] border border-white/[0.08] px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>{t.accountName || defaultAccountName}</span>
                        </span>
                      )}

                      {/* Category Tag */}
                      <span className="text-[11px] font-medium text-slate-400 bg-white/[0.03] px-2 py-0.5 rounded-md border border-white/[0.06]">
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
