import { Trash2, ShoppingBag, Coffee, Car, Film, Home, Dumbbell, Plane, MoreHorizontal, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';

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

export default function TransactionList({ transactions, onDeleteTransaction, isLoading }) {
  if (isLoading) {
    return (
      <div className="bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-700/50 min-h-[400px] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-700/50 min-h-[400px] flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4">
          <ShoppingBag className="w-8 h-8 text-slate-600" />
        </div>
        <h3 className="text-lg font-medium text-slate-300">No transactions yet</h3>
        <p className="text-slate-500 mt-1 max-w-[250px]">You haven't added any transactions for this month. Add one to get started!</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-700/50 overflow-hidden flex flex-col h-full">
      <h2 className="text-xl font-semibold mb-6">Recent Transactions</h2>
      <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
        {transactions.map((t) => {
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
                <span className={`font-semibold text-lg ${isIncome ? 'text-emerald-400' : 'text-slate-200'}`}>
                  {isIncome ? '+' : '-'}₹{t.amount.toFixed(2)}
                </span>
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
        })}
      </div>
    </div>
  );
}
