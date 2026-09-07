import { useState, useEffect } from 'react';
import { TrendingUp, Trash2, PlusCircle, Activity, Calendar, Clock, PieChart as PieIcon, Layers, Wallet, Tag, Pencil, X, Check } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { addSip, getSips, deleteSip, updateSip } from '../lib/expenseService';
import toast from 'react-hot-toast';
import { formatINR } from '../lib/utils';
import { format } from 'date-fns';

const COLORS = ['#06b6d4', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#14b8a6', '#f43f5e'];

const DEFAULT_SUGGESTED_FUNDS = [
  'Nifty 50 Index Fund',
  'Parag Parikh Flexi Cap',
  'HDFC Small Cap Fund',
  'Quant Mid Cap Fund',
  'SBI Bluechip Fund'
];

const getOrdinalSuffix = (day) => {
  if (!day) return 'th';
  const d = parseInt(day, 10);
  if ([1, 21, 31].includes(d)) return 'st';
  if ([2, 22].includes(d)) return 'nd';
  if ([3, 23].includes(d)) return 'rd';
  return 'th';
};

export default function SipTab({ user }) {
  const TODAY = format(new Date(), 'yyyy-MM-dd');
  
  const [sips, setSips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // New SIP form state
  const [fundName, setFundName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(TODAY);

  // Edit SIP modal state
  const [editingSip, setEditingSip] = useState(null);
  const [editFundName, setEditFundName] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editDate, setEditDate] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const fetchSips = async () => {
    setIsLoading(true);
    try {
      const data = await getSips(user.uid);
      setSips(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSips();
  }, [user.uid]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fundName || !amount || !date) return;
    
    setIsAdding(true);
    try {
      const dateObj = new Date(date + 'T00:00:00');
      const deductionDay = dateObj.getDate();

      await addSip(user.uid, {
        fundName: fundName.trim(),
        amount: parseFloat(amount),
        date: date,
        deductionDate: deductionDay
      });
      
      toast.success('SIP added successfully!');
      setFundName('');
      setAmount('');
      setDate(TODAY);
      await fetchSips();
    } catch (error) {
      console.error(error);
      toast.error('Failed to add SIP.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteSip(id);
      setSips(sips.filter(s => s.id !== id));
      toast.success('SIP deleted');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete SIP');
    }
  };

  const openEditModal = (sip) => {
    setEditingSip(sip);
    setEditFundName(sip.fundName || '');
    setEditAmount(sip.amount !== undefined ? sip.amount.toString() : '');
    
    let recordDate = '';
    if (sip.date) {
      recordDate = sip.date;
    } else if (sip.createdAt) {
      try {
        recordDate = format(new Date(sip.createdAt), 'yyyy-MM-dd');
      } catch {
        // ignore invalid date string
      }
    }
    
    if (!recordDate && sip.deductionDate) {
      try {
        const now = new Date();
        const day = String(Math.min(Math.max(parseInt(sip.deductionDate, 10) || 1, 1), 28)).padStart(2, '0');
        recordDate = `${format(now, 'yyyy-MM')}-${day}`;
      } catch {
        // ignore
      }
    }

    setEditDate(recordDate || TODAY);
  };

  const handleUpdateSip = async (e) => {
    e.preventDefault();
    if (!editingSip || !editFundName || !editAmount || !editDate) return;

    setIsSavingEdit(true);
    try {
      const dateObj = new Date(editDate + 'T00:00:00');
      const deductionDay = dateObj.getDate();

      await updateSip(editingSip.id, {
        fundName: editFundName.trim(),
        amount: parseFloat(editAmount),
        date: editDate,
        deductionDate: deductionDay
      });

      toast.success('SIP record updated successfully!');
      setEditingSip(null);
      await fetchSips();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update SIP.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // --- Saved / Previous Fund Suggestions ---
  const savedFundNames = Array.from(new Set([
    ...sips.map(s => s.fundName ? s.fundName.trim().replace(/\s+/g, ' ') : '').filter(Boolean),
    ...DEFAULT_SUGGESTED_FUNDS
  ]));

  // --- Analytics Calculations ---
  const totalSipAmount = sips.reduce((sum, s) => sum + s.amount, 0);
  const activeFundsCount = sips.length;
  const avgSipAmount = activeFundsCount > 0 ? totalSipAmount / activeFundsCount : 0;

  // Group by normalized Fund Name for allocation analytics
  const fundMap = sips.reduce((acc, s) => {
    const rawName = (s.fundName || 'Other Fund').trim().replace(/\s+/g, ' ');
    const lowerKey = rawName.toLowerCase();
    
    if (!acc[lowerKey]) {
      acc[lowerKey] = {
        name: rawName,
        value: 0
      };
    }
    acc[lowerKey].value += s.amount || 0;
    return acc;
  }, {});

  const fundAnalytics = Object.values(fundMap).map((item, index) => {
    const pct = totalSipAmount > 0 ? (item.value / totalSipAmount) * 100 : 0;
    return {
      name: item.name,
      value: item.value,
      percentage: parseFloat(pct.toFixed(1)),
      color: COLORS[index % COLORS.length]
    };
  }).sort((a, b) => b.value - a.value);

  const topFundShare = fundAnalytics.length > 0 ? fundAnalytics[0].percentage : 0;

  // Date Formatting Helpers
  const formatAddedDate = (createdAt, fallbackDate) => {
    if (createdAt) {
      try {
        return format(new Date(createdAt), 'MMM d, yyyy');
      } catch {
        // fallback
      }
    }
    if (fallbackDate) {
      try {
        return format(new Date(fallbackDate + 'T00:00:00'), 'MMM d, yyyy');
      } catch {
        // fallback
      }
    }
    return 'Recently';
  };

  const formatSipDate = (sip) => {
    if (sip.date) {
      try {
        return format(new Date(sip.date + 'T00:00:00'), 'MMM d, yyyy');
      } catch {
        // fallback
      }
    }
    if (sip.deductionDate) {
      return `${sip.deductionDate}${getOrdinalSuffix(sip.deductionDate)} of month`;
    }
    return 'N/A';
  };

  return (
    <div className="space-y-8">
      {/* Analytics KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Monthly SIP */}
        <div className="bg-gradient-to-br from-cyan-600 to-blue-700 rounded-2xl p-5 shadow-xl shadow-cyan-950/30 text-white relative overflow-hidden flex items-center justify-between">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <p className="font-semibold text-cyan-100 text-xs tracking-wider uppercase mb-1">Total Monthly SIP</p>
            <h3 className="text-2xl font-extrabold tracking-tight font-amount">{formatINR(totalSipAmount)}</h3>
            <p className="text-xs text-cyan-200 mt-1">recurring commitment</p>
          </div>
          <div className="p-3 bg-white/10 text-white rounded-xl relative z-10">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Active Funds Count */}
        <div className="bg-[#111827] hover:bg-[#151E32] rounded-2xl p-5 shadow-xl border border-slate-800/80 transition-all flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Active SIP Funds</p>
            <h3 className="text-2xl font-extrabold text-cyan-400 font-amount">{activeFundsCount}</h3>
            <p className="text-xs text-slate-500 mt-1">total portfolios</p>
          </div>
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Average SIP Amount */}
        <div className="bg-[#111827] hover:bg-[#151E32] rounded-2xl p-5 shadow-xl border border-slate-800/80 transition-all flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Average per Fund</p>
            <h3 className="text-2xl font-extrabold text-blue-400 font-amount">{formatINR(avgSipAmount)}</h3>
            <p className="text-xs text-slate-500 mt-1">avg monthly investment</p>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        {/* Top Fund Allocation Share */}
        <div className="bg-[#111827] hover:bg-[#151E32] rounded-2xl p-5 shadow-xl border border-slate-800/80 transition-all flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Top Fund Allocation</p>
            <h3 className="text-2xl font-extrabold text-purple-400 font-amount">{topFundShare}%</h3>
            <p className="text-xs text-slate-500 mt-1 truncate max-w-[130px]">
              {fundAnalytics.length > 0 ? fundAnalytics[0].name : 'No SIPs'}
            </p>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl">
            <PieIcon className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Left Form & Right Active List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - New SIP Form with Suggestions */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#111827] rounded-3xl p-5 sm:p-8 shadow-2xl border border-slate-800/80">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <PlusCircle className="w-6 h-6 text-cyan-400" />
              New SIP Entry
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center justify-between">
                  <span>Fund Name</span>
                  <Tag className="w-3.5 h-3.5 text-cyan-400" />
                </label>
                <input 
                  type="text" 
                  list="sip-fund-suggestions"
                  required 
                  value={fundName} 
                  onChange={(e) => setFundName(e.target.value)} 
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-white text-lg shadow-inner" 
                  placeholder="e.g., Nifty 50 Index Fund" 
                />
                
                {/* HTML Datalist */}
                <datalist id="sip-fund-suggestions">
                  {savedFundNames.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>

                {/* Quick Suggestion Pills */}
                {savedFundNames.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-slate-400 mb-2 font-medium">Saved / Popular Funds:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {savedFundNames.slice(0, 6).map((name) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => setFundName(name)}
                          className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                            fundName === name
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-semibold'
                              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700/60'
                          }`}
                        >
                          + {name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Amount (₹)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0" 
                  required 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                  onWheel={(e) => e.target.blur()}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
                  }}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-white text-lg font-amount shadow-inner" 
                  placeholder="0.00" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  SIP Date (Calendar)
                </label>
                <input 
                  type="date" 
                  required 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)} 
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-white text-lg shadow-inner [color-scheme:dark]" 
                />
              </div>

              <button 
                type="submit" 
                disabled={isAdding} 
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 rounded-xl mt-8 shadow-xl shadow-cyan-600/20 flex justify-center text-lg transition-all active:scale-[0.98]"
              >
                {isAdding ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save SIP'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column - Active SIPs List (Order Added) */}
        <div className="lg:col-span-2 bg-[#111827] rounded-2xl p-5 sm:p-6 shadow-xl border border-slate-800/80 flex flex-col h-[600px] overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              Active SIPs
            </h2>
            <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
              Ordered by addition
            </span>
          </div>
          
          {isLoading ? (
            <div className="flex-1 flex justify-center items-center">
              <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
            </div>
          ) : sips.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4">
                <TrendingUp className="w-8 h-8 text-slate-600" />
              </div>
              <h3 className="text-lg font-medium text-slate-300">No SIPs found</h3>
              <p className="text-slate-500 mt-1">Start investing and track your SIPs here.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {sips.map((sip) => (
                <div key={sip.id} className="group bg-slate-900/50 hover:bg-slate-900 rounded-xl p-4 flex items-center justify-between border border-transparent hover:border-slate-700 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20 shrink-0">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-200">{sip.fundName}</h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-800 text-cyan-300 flex items-center gap-1 border border-cyan-500/20">
                          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                          {formatSipDate(sip)}
                        </span>
                        <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-800/80 text-slate-400 flex items-center gap-1 border border-slate-700/50">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          Added: {formatAddedDate(sip.createdAt, sip.date)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-lg text-slate-200">{formatINR(sip.amount)}</span>
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => openEditModal(sip)} 
                        className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-lg transition-all" 
                        title="Edit record"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(sip.id)} 
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all" 
                        title="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SIP Analytics Section */}
      {sips.length > 0 && (
        <div className="bg-[#111827] rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800/80 space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2 text-white">
            <PieIcon className="w-5 h-5 text-cyan-400" />
            SIP Investment Breakdown & Analytics
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Recharts Pie Chart */}
            <div className="h-64 flex justify-center items-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={fundAnalytics}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {fundAnalytics.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [formatINR(value), 'Monthly Amount']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Inner Donut Center Stats */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs text-slate-400 uppercase font-semibold">Total</span>
                <span className="text-lg font-bold text-white font-amount">{formatINR(totalSipAmount)}</span>
              </div>
            </div>

            {/* Fund Allocation Bars */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-300 tracking-wide uppercase mb-2">Fund Allocation Share</h3>
              {fundAnalytics.map((item, idx) => (
                <div key={`${item.name}-${idx}`} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-200 flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: item.color }} />
                      {item.name}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 font-amount">{formatINR(item.value)}</span>
                      <span className="font-bold text-cyan-400 font-amount min-w-[45px] text-right">{item.percentage}%</span>
                    </div>
                  </div>
                  <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
                      style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- EDIT SIP MODAL --- */}
      {editingSip && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all">
          <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Pencil className="w-5 h-5 text-cyan-400" />
                Edit SIP Record
              </h3>
              <button 
                onClick={() => setEditingSip(null)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSip} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Fund Name</label>
                <input 
                  type="text" 
                  list="sip-fund-suggestions"
                  required 
                  value={editFundName} 
                  onChange={(e) => setEditFundName(e.target.value)} 
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-white text-lg shadow-inner" 
                  placeholder="e.g., Nifty 50 Index Fund" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Amount (₹)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0" 
                  required 
                  value={editAmount} 
                  onChange={(e) => setEditAmount(e.target.value)} 
                  onWheel={(e) => e.target.blur()}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
                  }}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-white text-lg font-amount shadow-inner" 
                  placeholder="0.00" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  SIP Date (Calendar)
                </label>
                <input 
                  type="date" 
                  required 
                  value={editDate} 
                  onChange={(e) => setEditDate(e.target.value)} 
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-white text-lg shadow-inner [color-scheme:dark]" 
                />
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingSip(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-3.5 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-cyan-600/20 flex justify-center items-center gap-2 transition-all active:scale-[0.98]"
                >
                  {isSavingEdit ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
