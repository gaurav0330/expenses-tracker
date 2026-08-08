import { useState } from 'react';
import { format, isSameMonth } from 'date-fns';
import { TrendingDown, TrendingUp, Wallet, Coins, Target, Edit3, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { formatINR } from '../lib/utils';

export default function MonthlySummary({ transactions, currentDate, previousBalance = 0, budgetGoal = 0, onSaveBudgetGoal }) {
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [newBudget, setNewBudget] = useState(budgetGoal || '');

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

  // Spent Today Calculation
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const spentToday = expenses
    .filter(t => t.date === todayStr)
    .reduce((sum, t) => sum + t.amount, 0);

  // Budget calculations
  const budgetPercentage = budgetGoal > 0 ? Math.min(100, Math.round((totalExpense / budgetGoal) * 100)) : 0;
  const isBudgetExceeded = budgetGoal > 0 && totalExpense > budgetGoal;
  const isBudgetWarning = budgetGoal > 0 && totalExpense >= budgetGoal * 0.8 && !isBudgetExceeded;

  const handleBudgetSubmit = (e) => {
    e.preventDefault();
    if (onSaveBudgetGoal) {
      onSaveBudgetGoal(parseFloat(newBudget) || 0);
    }
    setIsEditingBudget(false);
  };

  return (
    <div className="space-y-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Income Card */}
        <div className="bg-[#111827] hover:bg-[#151E32] rounded-2xl p-5 sm:p-6 shadow-xl border border-slate-800/80 hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-400 text-xs tracking-wider uppercase">
              Total Income
            </h3>
            <div className="p-2.5 bg-emerald-500/10 rounded-xl">
              <Coins className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-amount">
              {formatINR(totalIncome)}
            </span>
            <span className="text-slate-400 text-xs mt-2 font-medium">
              in {format(currentDate, 'MMM yyyy')}
            </span>
          </div>
        </div>

        {/* Total Spending Card */}
        <div className="bg-gradient-to-br from-rose-500 to-rose-700 rounded-2xl p-5 sm:p-6 shadow-xl shadow-rose-900/20 text-white relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-rose-100 text-xs tracking-wider uppercase">
                Total Spent
              </h3>
              <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                <TrendingDown className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight font-amount">
                {formatINR(totalExpense)}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-rose-100 text-xs font-medium">
                in {format(currentDate, 'MMM yyyy')}
              </p>
              {isSameMonth(currentDate, new Date()) && (
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-md text-white font-semibold backdrop-blur-sm font-amount">
                  Today: {formatINR(spentToday)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Balance Card */}
        <div className={`bg-gradient-to-br rounded-2xl p-5 sm:p-6 shadow-xl text-white relative overflow-hidden ${
          balance >= 0 ? 'from-emerald-600 to-teal-800 shadow-emerald-950/30' : 'from-orange-600 to-rose-800 shadow-rose-950/30'
        }`}>
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white/90 text-xs tracking-wider uppercase">
                Current Balance
              </h3>
              <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                <Wallet className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight font-amount">
                {formatINR(balance)}
              </span>
            </div>
            <div className="flex flex-col mt-2 gap-1 text-xs font-medium">
              <p className="text-white/90">
                This month: <span className="font-bold font-amount">{totalIncome - totalExpense >= 0 ? '+' : ''}{formatINR(totalIncome - totalExpense)}</span>
              </p>
              {previousBalance !== 0 && (
                <p className="text-white/70 text-[11px] font-amount">
                  Includes {formatINR(previousBalance)} rollover
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Top Category Card */}
        <div className="bg-[#111827] hover:bg-[#151E32] rounded-2xl p-5 sm:p-6 shadow-xl border border-slate-800/80 hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-400 text-xs tracking-wider uppercase">
              Top Category
            </h3>
            <div className="p-2.5 bg-rose-500/10 rounded-xl">
              <TrendingUp className="w-5 h-5 text-rose-400" />
            </div>
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-xl font-bold text-slate-100 truncate" title={topCategory ? topCategory[0] : 'None'}>
              {topCategory ? topCategory[0] : 'None'}
            </span>
            <span className="text-slate-400 text-xs mt-1 font-amount font-semibold">
              {topCategory ? formatINR(topCategory[1]) : '₹0.00'}
            </span>
          </div>
        </div>

      </div>

      {/* Monthly Budget Limit Progress Card */}
      <div className="bg-[#111827] hover:bg-[#151E32] rounded-2xl p-4 sm:p-5 shadow-xl border border-slate-800/80 transition-all">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <Target className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-sm text-slate-200">Monthly Budget Goal</h4>
            {isBudgetExceeded && (
              <span className="flex items-center gap-1 text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-md">
                <AlertTriangle className="w-3 h-3" /> Budget Exceeded
              </span>
            )}
            {isBudgetWarning && (
              <span className="flex items-center gap-1 text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-md">
                <AlertTriangle className="w-3 h-3" /> 80% Spent Warning
              </span>
            )}
          </div>

          {!isEditingBudget ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-300 font-amount">
                {budgetGoal > 0 ? (
                  <>
                    <span className="text-slate-400 text-xs mr-1 font-sans">Spent:</span>
                    <span className={isBudgetExceeded ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                      {formatINR(totalExpense)}
                    </span>
                    <span className="text-slate-500 mx-1 font-sans">/</span>
                    <span className="text-emerald-400 font-bold">{formatINR(budgetGoal)}</span>
                  </>
                ) : (
                  <span className="text-slate-400 text-xs font-sans">No limit set</span>
                )}
              </span>
              <button
                onClick={() => {
                  setNewBudget(budgetGoal || '');
                  setIsEditingBudget(true);
                }}
                className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
                title="Set monthly budget goal"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleBudgetSubmit} className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="100"
                autoFocus
                value={newBudget}
                onChange={(e) => setNewBudget(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1 text-sm text-white w-32 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-amount"
                placeholder="Limit (₹)"
              />
              <button
                type="submit"
                className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-lg transition-colors"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsEditingBudget(false)}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg"
              >
                Cancel
              </button>
            </form>
          )}
        </div>

        {budgetGoal > 0 && (
          <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-800/80">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isBudgetExceeded ? 'bg-rose-500' : isBudgetWarning ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${budgetPercentage}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
