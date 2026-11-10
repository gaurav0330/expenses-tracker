import { useState, useEffect } from 'react';
import { X, LogOut, Wallet, ShieldCheck, TrendingUp, TrendingDown, Users, Activity, Landmark, Layers, Sparkles, AlertCircle } from 'lucide-react';
import { getAllTimeSummary } from '../lib/expenseService';
import { formatINR } from '../lib/utils';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import toast from 'react-hot-toast';

export default function ProfileModal({ user, isOpen, onClose }) {
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && user?.uid) {
      setIsLoading(true);
      getAllTimeSummary(user.uid)
        .then(data => setSummary(data))
        .catch(err => {
          console.error(err);
          toast.error('Failed to load financial portfolio summary');
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, user?.uid]);

  if (!isOpen) return null;

  const handleSignOut = () => {
    signOut(auth);
    onClose();
  };

  const savingsRate = summary && summary.totalIncome > 0 
    ? Math.max(0, (((summary.totalIncome - summary.totalExpense) / summary.totalIncome) * 100)).toFixed(1)
    : '0.0';

  const topCategories = summary && summary.categoryTotals 
    ? Object.entries(summary.categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#111827] border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col custom-scrollbar">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-500/20">
              {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                User Profile & Complete Summary
                <span className="text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Active
                </span>
              </h2>
              <p className="text-slate-400 text-xs">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <div className="w-10 h-10 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4" />
              <p className="text-slate-400 text-sm font-medium">Calculating your complete financial portfolio...</p>
            </div>
          ) : summary ? (
            <>
              {/* Total Estimated Assets / Net Worth Hero Card */}
              <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-100 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-200" /> True Net Financial Worth
                    </span>
                    <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1 font-amount">
                      {formatINR(summary.netWorth)}
                    </h3>
                    <p className="text-xs text-emerald-100 mt-2 font-medium">
                      Assets ({formatINR(summary.totalAssets || 0)}) {summary.remainingEmiLiability > 0 ? `- EMI Debt (${formatINR(summary.remainingEmiLiability)})` : ''}
                    </p>
                  </div>
                  <div className="bg-white/15 backdrop-blur-md px-4 py-3 rounded-xl border border-white/20 text-center sm:text-right shrink-0">
                    <span className="text-xs font-semibold uppercase text-emerald-100 block">Overall Savings Rate</span>
                    <span className="text-2xl font-bold text-white font-amount">{savingsRate}%</span>
                  </div>
                </div>
              </div>

              {/* All-Time Financial Metrics Grid */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> All-Time Account Overview ({summary.totalTxnsCount} transactions)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Total Income */}
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block font-medium">Total Income (All-Time)</span>
                      <span className="text-lg font-bold text-emerald-400 font-amount">{formatINR(summary.totalIncome)}</span>
                    </div>
                  </div>

                  {/* Total Expense */}
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
                    <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-lg">
                      <TrendingDown className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block font-medium">Total Expenses (All-Time)</span>
                      <span className="text-lg font-bold text-rose-400 font-amount">{formatINR(summary.totalExpense)}</span>
                    </div>
                  </div>

                  {/* Main Net Balance */}
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
                    <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-lg">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block font-medium">Main Account Net</span>
                      <span className={`text-lg font-bold font-amount ${summary.netBalance >= 0 ? 'text-slate-200' : 'text-rose-400'}`}>
                        {formatINR(summary.netBalance)}
                      </span>
                    </div>
                  </div>

                  {/* Pending Lending */}
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block font-medium">Pending to Receive</span>
                      <span className="text-lg font-bold text-indigo-400 font-amount">{formatINR(summary.pendingLend)}</span>
                    </div>
                  </div>

                  {/* Monthly SIP Commitment */}
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
                    <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-lg">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block font-medium">Monthly SIP Plan</span>
                      <span className="text-lg font-bold text-purple-400 font-amount">{formatINR(summary.totalSip)}</span>
                    </div>
                  </div>

                  {/* Side Cash Vault */}
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
                    <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-lg">
                      <Landmark className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block font-medium">Side Cash Vault</span>
                      <span className="text-lg font-bold text-amber-400 font-amount">{formatINR(summary.sideBalance)}</span>
                    </div>
                  </div>

                  {/* Outstanding EMI Debt (if active) */}
                  {summary.remainingEmiLiability > 0 && (
                    <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex items-center gap-3 sm:col-span-2 lg:col-span-3">
                      <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-lg">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 block font-medium">Outstanding EMI Liabilities ({summary.activeEmisCount} active plans)</span>
                        <span className="text-lg font-bold text-rose-400 font-amount">{formatINR(summary.remainingEmiLiability)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* All-Time Top Spending Categories */}
              {topCategories.length > 0 && (
                <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-400" /> Top Spending Categories (All-Time)
                  </h4>
                  <div className="space-y-3">
                    {topCategories.map(([cat, amount]) => {
                      const share = summary.totalExpense > 0 ? ((amount / summary.totalExpense) * 100).toFixed(1) : 0;
                      return (
                        <div key={cat} className="space-y-1">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="text-slate-200">{cat}</span>
                            <span className="text-slate-400 font-amount">{formatINR(amount)} ({share}%)</span>
                          </div>
                          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.max(share, 2)}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 rounded-xl text-xs font-bold transition-all"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all border border-slate-700"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
