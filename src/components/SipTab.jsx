import { useState, useEffect } from 'react';
import { TrendingUp, Trash2, PlusCircle, Activity } from 'lucide-react';
import { addSip, getSips, deleteSip } from '../lib/expenseService';
import toast from 'react-hot-toast';
import { formatINR } from '../lib/utils';

export default function SipTab({ user }) {
  const [sips, setSips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  const [fundName, setFundName] = useState('');
  const [amount, setAmount] = useState('');
  const [deductionDate, setDeductionDate] = useState('1'); // 1-31

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
    if (!fundName || !amount || !deductionDate) return;
    
    setIsAdding(true);
    try {
      await addSip(user.uid, {
        fundName,
        amount: parseFloat(amount),
        deductionDate: parseInt(deductionDate, 10)
      });
      toast.success('SIP added successfully!');
      setFundName('');
      setAmount('');
      setDeductionDate('1');
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

  const totalSipAmount = sips.reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column - Form & Stats */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-gradient-to-br from-cyan-600 to-blue-700 rounded-2xl p-5 sm:p-6 shadow-xl shadow-cyan-950/30 text-white relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <h3 className="font-semibold text-cyan-100 text-xs tracking-wider uppercase mb-2">Total Monthly SIP</h3>
            <span className="text-3xl font-extrabold tracking-tight font-amount">{formatINR(totalSipAmount)}</span>
          </div>
        </div>

        <div className="bg-[#111827] rounded-3xl p-5 sm:p-8 shadow-2xl border border-slate-800/80">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
            <PlusCircle className="w-6 h-6 text-cyan-400" />
            New SIP Entry
          </h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Fund Name</label>
              <input type="text" required value={fundName} onChange={(e) => setFundName(e.target.value)} className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-white text-lg shadow-inner" placeholder="e.g., Nifty 50 Index Fund" />
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
              <label className="block text-sm font-semibold text-slate-300 mb-2">Deduction Date (1-31)</label>
              <input 
                type="number" 
                min="1" 
                max="31" 
                required 
                value={deductionDate} 
                onChange={(e) => setDeductionDate(e.target.value)} 
                onWheel={(e) => e.target.blur()}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
                }}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-white text-lg shadow-inner" 
              />
            </div>
            <button type="submit" disabled={isAdding} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 rounded-xl mt-8 shadow-xl shadow-cyan-600/20 flex justify-center text-lg transition-all active:scale-[0.98]">
              {isAdding ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save SIP'}
            </button>
          </form>
        </div>
      </div>

      {/* Right Column - List */}
      <div className="lg:col-span-2 bg-[#111827] rounded-2xl p-5 sm:p-6 shadow-xl border border-slate-800/80 flex flex-col h-[580px] max-h-[80vh] overflow-hidden">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          Active SIPs
        </h2>
        
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
                  <div className="w-12 h-12 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-200">{sip.fundName}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">
                        Date: {sip.deductionDate}{[1,21,31].includes(sip.deductionDate)?'st':[2,22].includes(sip.deductionDate)?'nd':[3,23].includes(sip.deductionDate)?'rd':'th'} of month
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-lg text-slate-200">{formatINR(sip.amount)}</span>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => handleDelete(sip.id)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg" title="Delete record">
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
  );
}
