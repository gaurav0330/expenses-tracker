import { format } from 'date-fns';
import { TrendingDown, TrendingUp, Wallet, Coins } from 'lucide-react';
import { formatINR } from '../lib/utils';

export default function MonthlySummary({ transactions, currentDate, previousBalance = 0 }) {
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = transactions.filter(t => t.type !== 'income');
  const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
  
  const balance = previousBalance + totalIncome - totalExpense;

  const categoryTotals = expenses.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});
  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      
      {/* Total Income Card */}
      <div className="bg-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl border border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-slate-400 text-sm tracking-wider uppercase">
            Total Income
          </h3>
          <div className="p-2 bg-slate-900 rounded-lg">
            <Coins className="w-5 h-5 text-emerald-400" />
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-2xl sm:text-3xl font-bold text-slate-200">
            {formatINR(totalIncome)}
          </span>
          <span className="text-slate-400 text-sm mt-2 font-medium">
            in {format(currentDate, 'MMM yyyy')}
          </span>
        </div>
      </div>

      {/* Total Spending Card */}
      <div className="bg-gradient-to-br from-rose-500 to-rose-700 rounded-2xl p-5 sm:p-6 shadow-xl shadow-rose-900/20 text-white relative overflow-hidden">
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-rose-50 text-sm tracking-wider uppercase">
              Total Spent
            </h3>
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <TrendingDown className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight">
              {formatINR(totalExpense)}
            </span>
          </div>
          <p className="text-rose-100 text-sm mt-2 font-medium">
            in {format(currentDate, 'MMM yyyy')}
          </p>
        </div>
      </div>

      {/* Balance Card */}
      <div className={`bg-gradient-to-br rounded-2xl p-5 sm:p-6 shadow-xl text-white relative overflow-hidden ${
        balance >= 0 ? 'from-emerald-500 to-emerald-700 shadow-emerald-900/20' : 'from-orange-500 to-orange-700 shadow-orange-900/20'
      }`}>
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-white/80 text-sm tracking-wider uppercase">
              Remaining Balance
            </h3>
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Wallet className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight">
              {formatINR(balance)}
            </span>
          </div>
          <div className="flex flex-col mt-2 gap-1 text-sm font-medium">
            <p className="text-white/80">
              {previousBalance === 0 ? 'Saved this month' : 'Total available'}
            </p>
            {previousBalance !== 0 && (
              <p className="text-white/60 text-xs">
                Includes {formatINR(previousBalance)} rollover
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Top Category Card */}
      <div className="bg-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl border border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-slate-400 text-sm tracking-wider uppercase">
            Top Category
          </h3>
          <div className="p-2 bg-slate-900 rounded-lg">
            <TrendingUp className="w-5 h-5 text-rose-400" />
          </div>
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="text-xl font-bold text-slate-200 truncate" title={topCategory ? topCategory[0] : 'None'}>
            {topCategory ? topCategory[0] : 'None'}
          </span>
          <span className="text-slate-400 text-sm mt-1">
            {topCategory ? formatINR(topCategory[1]) : '₹0.00'}
          </span>
        </div>
      </div>

    </div>
  );
}
