import { useState } from 'react';
import { format, isSameMonth } from 'date-fns';
import { TrendingDown, TrendingUp, Wallet, Coins, Target, Edit3, AlertTriangle } from 'lucide-react';
import { usePrivacy } from '../hooks/usePrivacy';
import { PrivacyAmount } from '../context/PrivacyContext';

export default function MonthlySummary({ 
  transactions, 
  currentDate, 
  previousBalance = 0, 
  budgetGoal = 0, 
  onSaveBudgetGoal,
  accounts = [],
  accountBalances = {}
}) {
  const { isMoneyHidden, toggleRevealKey } = usePrivacy();
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [newBudget, setNewBudget] = useState(budgetGoal || '');

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = transactions.filter(t => t.type === 'expense');
  const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
  
  const balance = accounts.length > 0
    ? accounts.reduce((sum, acc) => sum + (accountBalances[acc.id] ?? (Number(acc.openingBalance) || 0)), 0)
    : (previousBalance + totalIncome - totalExpense);

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
    const val = Math.max(0, parseFloat(newBudget) || 0);
    if (onSaveBudgetGoal) {
      onSaveBudgetGoal(val);
    }
    setIsEditingBudget(false);
  };

  return (
    <div className="space-y-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Income Card */}
        <div 
          onClick={() => isMoneyHidden && toggleRevealKey('summary_total_income')}
          className={`bg-[#111827] hover:bg-[#151E32] rounded-2xl p-5 sm:p-6 shadow-xl border border-slate-800/80 hover:border-slate-700/80 transition-all ${
            isMoneyHidden ? 'cursor-pointer hover:border-emerald-500/40' : ''
          }`}
          title={isMoneyHidden ? "Click to peek / reveal Total Income" : undefined}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-400 text-xs tracking-wider uppercase">
              Total Income
            </h3>
            <div className="p-2.5 bg-emerald-500/10 rounded-xl">
              <Coins className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div className="flex flex-col">
            <PrivacyAmount 
              amount={totalIncome} 
              id="summary_total_income" 
              className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-amount" 
            />
            <span className="text-slate-400 text-xs mt-2 font-medium">
              in {format(currentDate, 'MMM yyyy')}
            </span>
          </div>
        </div>

        {/* Total Spending Card */}
        <div 
          onClick={() => isMoneyHidden && toggleRevealKey('summary_total_expense')}
          className={`bg-gradient-to-br from-rose-500 to-rose-700 rounded-2xl p-5 sm:p-6 shadow-xl shadow-rose-900/20 text-white relative overflow-hidden ${
            isMoneyHidden ? 'cursor-pointer' : ''
          }`}
          title={isMoneyHidden ? "Click to peek / reveal Total Spent" : undefined}
        >
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-rose-100 text-xs tracking-wider uppercase">
                Total Spent
              </h3>
              <div className="p-2.5 bg-white/20 rounded-xl">
                <TrendingDown className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <PrivacyAmount 
                amount={totalExpense} 
                id="summary_total_expense" 
                className="text-2xl sm:text-3xl font-extrabold tracking-tight font-amount" 
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-rose-100 text-xs font-medium">
                in {format(currentDate, 'MMM yyyy')}
              </p>
              {isSameMonth(currentDate, new Date()) && (
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-md text-white font-semibold backdrop-blur-sm font-amount">
                  Today: <PrivacyAmount amount={spentToday} id="summary_spent_today" className="font-semibold" />
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Balance Card */}
        <div 
          onClick={() => isMoneyHidden && toggleRevealKey('summary_current_balance')}
          className={`bg-gradient-to-br rounded-2xl p-5 sm:p-6 shadow-xl text-white relative overflow-hidden ${
            isMoneyHidden ? 'cursor-pointer' : ''
          } ${
            balance >= 0 ? 'from-emerald-600 to-teal-800 shadow-emerald-950/30' : 'from-orange-600 to-rose-800 shadow-rose-950/30'
          }`}
          title={isMoneyHidden ? "Click to peek / reveal Current Balance" : undefined}
        >
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white/90 text-xs tracking-wider uppercase">
                Current Balance
              </h3>
              <div className="p-2.5 bg-white/20 rounded-xl">
                <Wallet className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <PrivacyAmount 
                amount={balance} 
                id="summary_current_balance" 
                className="text-2xl sm:text-3xl font-extrabold tracking-tight font-amount" 
              />
            </div>
            <div className="flex flex-col mt-2 gap-1 text-xs font-medium">
              <p className="text-white/90">
                This month: <PrivacyAmount 
                  amount={totalIncome - totalExpense} 
                  id="summary_month_diff" 
                  prefix={totalIncome - totalExpense >= 0 ? '+' : ''} 
                  className="font-bold font-amount" 
                />
              </p>
              <p className="text-white/70 text-[11px] font-amount">
                {accounts.length > 0 ? `Total across ${accounts.length} bank accounts` : (previousBalance !== 0 ? `Includes rollover` : 'All accounts synchronized')}
              </p>
            </div>
          </div>
        </div>

        {/* Top Category Card */}
        <div 
          onClick={() => isMoneyHidden && toggleRevealKey('summary_top_category')}
          className={`bg-[#111827] hover:bg-[#151E32] rounded-2xl p-5 sm:p-6 shadow-xl border border-slate-800/80 hover:border-slate-700/80 transition-all ${
            isMoneyHidden ? 'cursor-pointer hover:border-rose-500/40' : ''
          }`}
          title={isMoneyHidden ? "Click to peek / reveal Top Category" : undefined}
        >
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
              <PrivacyAmount amount={topCategory ? topCategory[1] : 0} id="summary_top_category" />
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
                      <PrivacyAmount amount={totalExpense} id="summary_budget_spent" />
                    </span>
                    <span className="text-slate-500 mx-1 font-sans">/</span>
                    <span className="text-emerald-400 font-bold">
                      <PrivacyAmount amount={budgetGoal} id="summary_budget_goal" />
                    </span>
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
