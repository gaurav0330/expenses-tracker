import { useState } from 'react';
import { format, isSameMonth, getDaysInMonth, getDate } from 'date-fns';
import { TrendingDown, Coins, Target, Edit3, AlertTriangle, Sparkles, ShieldCheck } from 'lucide-react';
import { usePrivacy } from '../hooks/usePrivacy';
import { PrivacyAmount } from '../context/PrivacyContext';

export default function MonthlySummary({ 
  transactions, 
  currentDate, 
  budgetGoal = 0, 
  onSaveBudgetGoal,
}) {
  const { isMoneyHidden, toggleRevealKey } = usePrivacy();
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [newBudget, setNewBudget] = useState(budgetGoal || '');

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = transactions.filter(t => t.type === 'expense');
  const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round((netSavings / totalIncome) * 100)) : 0;

  // Spent Today Calculation
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const spentToday = expenses
    .filter(t => t.date === todayStr)
    .reduce((sum, t) => sum + t.amount, 0);

  // Budget & Daily Safe-to-Spend Runway calculations
  const budgetPercentage = budgetGoal > 0 ? Math.min(100, Math.round((totalExpense / budgetGoal) * 100)) : 0;
  const isBudgetExceeded = budgetGoal > 0 && totalExpense > budgetGoal;
  const isBudgetWarning = budgetGoal > 0 && totalExpense >= budgetGoal * 0.8 && !isBudgetExceeded;
  
  const isCurrentActiveMonth = isSameMonth(currentDate, new Date());
  const totalDaysInMonth = getDaysInMonth(currentDate);
  const dayOfMonth = isCurrentActiveMonth ? getDate(new Date()) : totalDaysInMonth;
  const remainingDays = Math.max(1, totalDaysInMonth - dayOfMonth + 1);
  const remainingBudget = Math.max(0, budgetGoal - totalExpense);
  const dailySafeSpend = budgetGoal > 0 && !isBudgetExceeded ? (remainingBudget / remainingDays) : 0;

  const handleBudgetSubmit = (e) => {
    e.preventDefault();
    const val = Math.max(0, parseFloat(newBudget) || 0);
    if (onSaveBudgetGoal) {
      onSaveBudgetGoal(val);
    }
    setIsEditingBudget(false);
  };

  return (
    <div className="space-y-4 mb-6">
      
      {/* 3-Card Core Cashflow Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
        
        {/* Card 1: Total Monthly Inflow (Income) */}
        <div 
          onClick={() => isMoneyHidden && toggleRevealKey('summary_total_income')}
          className={`fintech-card hover:border-emerald-500/40 hover:shadow-glow-emerald rounded-3xl p-5 sm:p-6 transition-all flex flex-col justify-between group relative overflow-hidden ${
            isMoneyHidden ? 'cursor-pointer' : ''
          }`}
          title={isMoneyHidden ? "Click to peek Total Income" : undefined}
        >
          {/* Subtle Accent Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Monthly Inflow
            </span>
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-2xl group-hover:scale-110 transition-transform border border-emerald-500/20">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="relative z-10">
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-amount tracking-tight">
              <PrivacyAmount 
                amount={totalIncome} 
                id="summary_total_income" 
                className="text-emerald-400" 
              />
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-xs text-slate-400 font-medium">
              <span>Earned in {format(currentDate, 'MMM yyyy')}</span>
              <span className="text-emerald-400 font-bold font-amount bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20 text-[11px]">
                {transactions.filter(t => t.type === 'income').length} deposits
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Monthly Outflow (Spent) */}
        <div 
          onClick={() => isMoneyHidden && toggleRevealKey('summary_total_expense')}
          className={`fintech-card hover:border-rose-500/40 hover:shadow-glow-rose rounded-3xl p-5 sm:p-6 transition-all flex flex-col justify-between group relative overflow-hidden ${
            isMoneyHidden ? 'cursor-pointer' : ''
          }`}
          title={isMoneyHidden ? "Click to peek Total Spent" : undefined}
        >
          {/* Subtle Accent Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-rose-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
              Monthly Outflow
            </span>
            <div className="p-2.5 bg-rose-500/15 text-rose-400 rounded-2xl group-hover:scale-110 transition-transform border border-rose-500/20">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="relative z-10">
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-amount tracking-tight">
              <PrivacyAmount 
                amount={totalExpense} 
                id="summary_total_expense" 
                className="text-rose-400" 
              />
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-xs text-slate-400 font-medium">
              <span>Spent in {format(currentDate, 'MMM yyyy')}</span>
              {isCurrentActiveMonth && (
                <span className="text-rose-300 font-bold bg-rose-500/15 px-2 py-0.5 rounded-lg font-amount text-[11px] border border-rose-500/20">
                  Today: <PrivacyAmount amount={spentToday} id="summary_spent_today" />
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card 3: Net Surplus & Savings Rate */}
        <div 
          onClick={() => isMoneyHidden && toggleRevealKey('summary_net_savings')}
          className={`fintech-card hover:border-cyan-500/40 hover:shadow-glow-cyan rounded-3xl p-5 sm:p-6 transition-all flex flex-col justify-between group relative overflow-hidden ${
            isMoneyHidden ? 'cursor-pointer' : ''
          }`}
          title={isMoneyHidden ? "Click to peek Net Surplus" : undefined}
        >
          {/* Subtle Accent Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${netSavings >= 0 ? 'bg-cyan-400' : 'bg-amber-400'} animate-pulse`} />
              Net Cashflow
            </span>
            <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-2xl group-hover:scale-110 transition-transform border border-cyan-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="relative z-10">
            <div className="text-2xl sm:text-3xl font-extrabold font-amount tracking-tight">
              <PrivacyAmount 
                amount={netSavings} 
                id="summary_net_savings" 
                prefix={netSavings > 0 ? '+' : ''}
                className={netSavings >= 0 ? 'text-cyan-400' : 'text-amber-400'} 
              />
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-xs text-slate-400 font-medium">
              <span>Savings Rate</span>
              <span className={`font-bold font-amount text-xs px-2 py-0.5 rounded-lg border ${
                netSavings >= 0 
                  ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/20' 
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/20'
              }`}>
                {savingsRate}% saved
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Monthly Budget & Daily Safe-to-Spend Runway Card (Copilot / Monzo Inspired) */}
      <div className="fintech-card rounded-3xl p-4 sm:p-5 shadow-2xl transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/15 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-slate-200">Budget Health & Daily Runway</h4>
                {isBudgetExceeded ? (
                  <span className="flex items-center gap-1 text-[10px] font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-md uppercase">
                    <AlertTriangle className="w-3 h-3" /> Exceeded
                  </span>
                ) : isBudgetWarning ? (
                  <span className="flex items-center gap-1 text-[10px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-md uppercase">
                    <AlertTriangle className="w-3 h-3" /> 80% Spent
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md uppercase">
                    <ShieldCheck className="w-3 h-3" /> On Track
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {budgetGoal > 0 ? (
                  isBudgetExceeded 
                    ? `Over budget by ₹${Math.round(totalExpense - budgetGoal).toLocaleString('en-IN')}` 
                    : isCurrentActiveMonth 
                      ? `${remainingDays} day(s) remaining in this month` 
                      : 'Monthly spending cap'
                ) : (
                  'Set a monthly limit to unlock the Daily Safe-to-Spend Runway'
                )}
              </p>
            </div>
          </div>

          {/* Budget Value & Safe-to-Spend Pill */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {budgetGoal > 0 && isCurrentActiveMonth && !isBudgetExceeded && (
              <div className="bg-slate-900/90 border border-emerald-500/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs shadow-inner">
                <span className="text-slate-400 font-medium">Safe to Spend:</span>
                <span className="text-emerald-400 font-extrabold font-amount">
                  <PrivacyAmount amount={dailySafeSpend} id="summary_daily_safe" />
                  <span className="text-[10px] text-emerald-400/80 font-sans ml-1">/ day</span>
                </span>
              </div>
            )}

            {!isEditingBudget ? (
              <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700/60 shadow-inner">
                <span className="text-xs font-semibold text-slate-300 font-amount">
                  {budgetGoal > 0 ? (
                    <>
                      <PrivacyAmount amount={totalExpense} id="summary_budget_spent" />
                      <span className="text-slate-500 mx-1">/</span>
                      <span className="text-emerald-400 font-bold">
                        <PrivacyAmount amount={budgetGoal} id="summary_budget_goal" />
                      </span>
                    </>
                  ) : (
                    <span className="text-slate-400 text-xs">No limit set</span>
                  )}
                </span>
                <button
                  onClick={() => {
                    setNewBudget(budgetGoal || '');
                    setIsEditingBudget(true);
                  }}
                  className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
                  title="Edit monthly budget goal"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleBudgetSubmit} className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  step="100"
                  autoFocus
                  value={newBudget}
                  onChange={(e) => setNewBudget(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1 text-xs text-white w-28 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-amount"
                  placeholder="Limit (₹)"
                />
                <button
                  type="submit"
                  className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-lg transition-colors"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingBudget(false)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg"
                >
                  ✕
                </button>
              </form>
            )}
          </div>

        </div>

        {/* Progress Bar with Gradient */}
        {budgetGoal > 0 && (
          <div className="w-full bg-slate-950/80 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-800/80">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isBudgetExceeded 
                  ? 'bg-rose-500 shadow-lg shadow-rose-500/50' 
                  : isBudgetWarning 
                    ? 'bg-amber-500 shadow-lg shadow-amber-500/50' 
                    : 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-lg shadow-emerald-500/50'
              }`}
              style={{ width: `${budgetPercentage}%` }}
            />
          </div>
        )}
      </div>

    </div>
  );
}
