import { useState, useMemo } from 'react';
import { X, Activity, ShieldAlert, Sparkles } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { calculateCashflowForecast } from '../lib/forecastService';
import { formatINR } from '../lib/utils';
import { PrivacyAmount } from '../context/PrivacyContext';

export default function CashflowForecastModal({
  isOpen,
  onClose,
  accounts = [],
  accountBalances = {},
  transactions = [],
  emis = [],
  sips = [],
  subscriptions = []
}) {
  const [selectedHorizon, setSelectedHorizon] = useState(90); // 30, 60, or 90

  const forecast = useMemo(() => {
    return calculateCashflowForecast({
      accounts,
      accountBalances,
      transactions,
      emis,
      sips,
      subscriptions,
      forecastDays: 90,
      lowBalanceThreshold: 5000
    });
  }, [accounts, accountBalances, transactions, emis, sips, subscriptions]);

  const displayedProjections = useMemo(() => {
    return forecast.projections.slice(0, selectedHorizon);
  }, [forecast.projections, selectedHorizon]);

  if (!isOpen) return null;

  const currentBal = forecast.currentTotalBalance;
  const targetMilestoneBal = selectedHorizon === 30 
    ? forecast.milestones.day30 
    : selectedHorizon === 60 
    ? forecast.milestones.day60 
    : forecast.milestones.day90;
  const netDelta = targetMilestoneBal - currentBal;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="fintech-card border border-white/[0.1] rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-white/[0.06] flex items-center justify-between shrink-0 bg-dark-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  90-Day Cashflow & Balance Forecast
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  AI Projection
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Simulating daily discretionary burn + active EMIs, SIPs, and subscriptions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar">

          {/* Proactive Low-Balance Warning Alert */}
          {forecast.warnings.length > 0 ? (
            <div className="space-y-2">
              {forecast.warnings.map((w, idx) => (
                <div 
                  key={idx}
                  className="bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-transparent border border-amber-500/40 rounded-2xl p-4 flex items-start gap-3.5 shadow-lg shadow-amber-500/5 animate-pulse-slow"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                        Low Balance Warning
                      </span>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.2 rounded-full font-bold">
                        {w.date}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-200 mt-1 font-medium">
                      {w.message}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Projected Balance: <span className="font-amount font-bold text-rose-400">{formatINR(w.projectedBalance)}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3.5 flex items-center gap-3 text-xs text-emerald-400">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Healthy cashflow detected. No low-balance alerts below ₹5,000 projected across next 90 days.</span>
            </div>
          )}

          {/* Horizon Toggle & Milestone Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Projection Milestones
              </span>
              <div className="inline-flex bg-slate-800/90 p-1 rounded-xl border border-slate-700/60">
                {[30, 60, 90].map(days => (
                  <button
                    key={days}
                    onClick={() => setSelectedHorizon(days)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      selectedHorizon === days 
                        ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {days} Days
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Day 30 */}
              <div 
                onClick={() => setSelectedHorizon(30)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  selectedHorizon === 30 
                    ? 'bg-slate-800/90 border-cyan-500/60 shadow-lg shadow-cyan-500/10' 
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Day 30 Projection</span>
                  {selectedHorizon === 30 && <span className="w-2 h-2 rounded-full bg-cyan-400" />}
                </div>
                <div className="text-lg font-amount font-extrabold text-white">
                  <PrivacyAmount amount={forecast.milestones.day30} />
                </div>
                <div className={`text-[11px] font-amount font-bold mt-1 ${forecast.milestones.day30 >= currentBal ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {forecast.milestones.day30 >= currentBal ? '+' : ''}{formatINR(forecast.milestones.day30 - currentBal)}
                </div>
              </div>

              {/* Day 60 */}
              <div 
                onClick={() => setSelectedHorizon(60)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  selectedHorizon === 60 
                    ? 'bg-slate-800/90 border-cyan-500/60 shadow-lg shadow-cyan-500/10' 
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Day 60 Projection</span>
                  {selectedHorizon === 60 && <span className="w-2 h-2 rounded-full bg-cyan-400" />}
                </div>
                <div className="text-lg font-amount font-extrabold text-white">
                  <PrivacyAmount amount={forecast.milestones.day60} />
                </div>
                <div className={`text-[11px] font-amount font-bold mt-1 ${forecast.milestones.day60 >= currentBal ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {forecast.milestones.day60 >= currentBal ? '+' : ''}{formatINR(forecast.milestones.day60 - currentBal)}
                </div>
              </div>

              {/* Day 90 */}
              <div 
                onClick={() => setSelectedHorizon(90)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  selectedHorizon === 90 
                    ? 'bg-slate-800/90 border-cyan-500/60 shadow-lg shadow-cyan-500/10' 
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Day 90 Projection</span>
                  {selectedHorizon === 90 && <span className="w-2 h-2 rounded-full bg-cyan-400" />}
                </div>
                <div className="text-lg font-amount font-extrabold text-white">
                  <PrivacyAmount amount={forecast.milestones.day90} />
                </div>
                <div className={`text-[11px] font-amount font-bold mt-1 ${forecast.milestones.day90 >= currentBal ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {forecast.milestones.day90 >= currentBal ? '+' : ''}{formatINR(forecast.milestones.day90 - currentBal)}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Chart */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Trajectory ({selectedHorizon}-Day Curve)
              </span>
              <div className="text-xs text-slate-400">
                Burn rate: <span className="font-amount font-bold text-slate-200">{formatINR(forecast.dailyBurnRate)}/day</span>
              </div>
            </div>

            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={displayedProjections} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="label" 
                    stroke="#64748b" 
                    fontSize={11} 
                    tickLine={false}
                    interval={Math.floor(selectedHorizon / 6)}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={11} 
                    tickLine={false} 
                    tickFormatter={(val) => `₹${Math.round(val / 1000)}k`}
                    domain={['auto', 'auto']}
                  />
                  <ReferenceLine y={5000} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: '₹5k Safety Buffer', fill: '#f59e0b', fontSize: 10, position: 'right' }} />
                  <ReferenceLine y={0} stroke="#f43f5e" strokeDasharray="4 4" />
                  <Tooltip content={<CustomForecastTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="balance" 
                    stroke="#06b6d4" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#forecastGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Engine Parameters Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Starting Liquid Cash
              </span>
              <span className="text-sm font-amount font-bold text-slate-200 mt-1 block">
                <PrivacyAmount amount={currentBal} />
              </span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Monthly Recurring Load
              </span>
              <span className="text-sm font-amount font-bold text-rose-400 mt-1 block">
                <PrivacyAmount amount={forecast.monthlyRecurringTotal} />
                <span className="text-[10px] text-slate-500 font-normal ml-1">/ mo</span>
              </span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Net Horizon Change ({selectedHorizon}d)
              </span>
              <span className={`text-sm font-amount font-bold mt-1 block ${netDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {netDelta >= 0 ? '+' : ''}{formatINR(netDelta)}
              </span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            Based on {forecast.activeCommitmentsCount} active EMI/SIP/subscription obligations.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Close Forecast
          </button>
        </div>
      </div>
    </div>
  );
}

function CustomForecastTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;

  return (
    <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1.5 z-50 max-w-xs">
      <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-1">
        <span className="font-bold text-slate-300">{data.date} (Day {data.day})</span>
        <span className="font-amount font-bold text-cyan-400">{formatINR(data.balance)}</span>
      </div>

      <div className="text-[11px] text-slate-400 space-y-0.5">
        <div className="flex justify-between">
          <span>Est. Daily Burn:</span>
          <span className="font-amount text-slate-300">{formatINR(data.burn)}</span>
        </div>
        {data.recurring > 0 && (
          <div className="flex justify-between text-rose-400">
            <span>Recurring Debits:</span>
            <span className="font-amount font-bold">-{formatINR(data.recurring)}</span>
          </div>
        )}
      </div>

      {data.events && data.events.length > 0 && (
        <div className="pt-1 border-t border-slate-800/80">
          <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Due Today:</span>
          <div className="space-y-0.5 mt-0.5">
            {data.events.map((ev, i) => (
              <div key={i} className="text-[11px] text-slate-300 flex justify-between">
                <span className="truncate max-w-[150px]">{ev.name} ({ev.type})</span>
                <span className="font-amount text-rose-300 font-semibold">{formatINR(ev.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
