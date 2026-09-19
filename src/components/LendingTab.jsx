import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Users, CheckCircle, Clock, Trash2, PlusCircle, X } from 'lucide-react';
import { addLend, getLends, updateLendStatus, deleteLend } from '../lib/expenseService';
import toast from 'react-hot-toast';
import { formatINR } from '../lib/utils';

export default function LendingTab({ user }) {
  const [lends, setLends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const [person, setPerson] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [description, setDescription] = useState('');

  const fetchLends = async () => {
    setIsLoading(true);
    try {
      const data = await getLends(user.uid);
      setLends(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLends();
  }, [user.uid]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!person || !amount || !date) return;
    
    setIsAdding(true);
    try {
      await addLend(user.uid, {
        person,
        amount: parseFloat(amount),
        description,
        date
      });
      toast.success('Lending entry added!');
      setPerson('');
      setAmount('');
      setDescription('');
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setIsAddModalOpen(false);
      await fetchLends();
    } catch (error) {
      console.error(error);
      toast.error('Failed to add entry.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'pending' ? 'paid' : 'pending';
    try {
      await updateLendStatus(id, newStatus);
      setLends(lends.map(l => l.id === id ? { ...l, status: newStatus } : l));
      toast.success(`Marked as ${newStatus}`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteLend(id);
      setLends(lends.filter(l => l.id !== id));
      toast.success('Entry deleted');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete');
    }
  };

  const pendingTotal = lends.filter(l => l.status === 'pending').reduce((sum, l) => sum + l.amount, 0);

  return (
    <div className="space-y-8">
      {/* Top Stat Banner */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 sm:p-8 shadow-xl shadow-indigo-950/30 text-white relative overflow-hidden flex items-center justify-between">
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="relative z-10">
          <h3 className="font-semibold text-indigo-100 text-xs tracking-wider uppercase mb-2">Total Pending (To Receive)</h3>
          <span className="text-3xl sm:text-4xl font-extrabold tracking-tight font-amount">{formatINR(pendingTotal)}</span>
          <p className="text-xs text-indigo-200 mt-1">across all pending lending records</p>
        </div>
        <div className="p-4 bg-white/10 text-white rounded-2xl relative z-10 hidden sm:block">
          <Users className="w-8 h-8" />
        </div>
      </div>

      {/* Main Full-Width Lending Records Container */}
      <div className="bg-[#111827] rounded-3xl p-5 sm:p-8 shadow-2xl border border-slate-800/80 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
              <Users className="w-6 h-6 text-indigo-400" />
              Active Lending Records
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm font-medium mt-1">
              Track money lent to friends, family, and colleagues
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-xl shadow-indigo-600/20 transition-all active:scale-98 shrink-0"
          >
            <PlusCircle className="w-5 h-5" />
            New Lending Entry
          </button>
        </div>
        
        {isLoading ? (
          <div className="py-20 flex justify-center items-center">
            <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : lends.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-slate-600" />
            </div>
            <h3 className="text-lg font-medium text-slate-300">No records found</h3>
            <p className="text-slate-500 mt-1 max-w-sm">Click "+ New Lending Entry" above to track money lent to others.</p>
          </div>
        ) : (
          <div className="max-h-[460px] overflow-y-auto custom-scrollbar pr-2 space-y-4">
            {lends.map((lend) => (
              <div key={lend.id} className="group bg-slate-900/60 hover:bg-slate-900 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between border border-slate-800/80 hover:border-slate-700 transition-all gap-4">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${lend.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-orange-500/10 text-orange-400'}`}>
                    {lend.status === 'paid' ? <CheckCircle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100 text-base">{lend.person}</h4>
                    {lend.description && (
                      <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1.5 whitespace-pre-wrap break-words max-w-md bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/50">
                        {lend.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${lend.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>
                        {lend.status.toUpperCase()}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">{format(parseISO(lend.date), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-5 justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800">
                  <span className="font-extrabold text-xl text-slate-100 font-amount">{formatINR(lend.amount)}</span>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => handleToggleStatus(lend.id, lend.status)} className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-all" title={lend.status === 'pending' ? 'Mark Paid' : 'Mark Pending'}>
                      {lend.status === 'pending' ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleDelete(lend.id)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all" title="Delete record">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- ADD LENDING MODAL --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all">
          <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-6 h-6 text-indigo-400" />
                New Lending Entry
              </h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Who did you lend to?</label>
                <input 
                  type="text" 
                  required 
                  value={person} 
                  onChange={(e) => setPerson(e.target.value)} 
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white text-lg shadow-inner" 
                  placeholder="Person Name" 
                />
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
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white text-lg font-amount shadow-inner" 
                  placeholder="0.00" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Description (Optional)</label>
                <input 
                  type="text" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white text-lg shadow-inner" 
                  placeholder="Reason / Note" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Date</label>
                <input 
                  type="date" 
                  required 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)} 
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white text-lg shadow-inner [color-scheme:dark]" 
                />
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-3.5 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isAdding} 
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-xl shadow-indigo-600/20 flex justify-center text-lg transition-all active:scale-[0.98]"
                >
                  {isAdding ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
