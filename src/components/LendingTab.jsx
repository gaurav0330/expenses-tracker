import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Users, CheckCircle, Clock, Trash2, PlusCircle } from 'lucide-react';
import { addLend, getLends, updateLendStatus, deleteLend } from '../lib/expenseService';

export default function LendingTab({ user }) {
  const [lends, setLends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
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
      setPerson('');
      setAmount('');
      setDescription('');
      await fetchLends();
    } catch (error) {
      console.error(error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'pending' ? 'paid' : 'pending';
    try {
      await updateLendStatus(id, newStatus);
      setLends(lends.map(l => l.id === id ? { ...l, status: newStatus } : l));
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteLend(id);
      setLends(lends.filter(l => l.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  const pendingTotal = lends.filter(l => l.status === 'pending').reduce((sum, l) => sum + l.amount, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column - Form & Stats */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 shadow-xl shadow-indigo-900/20 text-white relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <h3 className="font-medium text-indigo-50 text-sm tracking-wider uppercase mb-2">Total Pending (To Receive)</h3>
            <span className="text-3xl font-bold tracking-tight">₹{pendingTotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-700/50">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-indigo-400" />
            New Lending Entry
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Who did you lend to?</label>
              <input type="text" required value={person} onChange={(e) => setPerson(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white" placeholder="Name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Amount (₹)</label>
              <input type="number" step="0.01" min="0" required value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Description (Optional)</label>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white" placeholder="Reason" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Date</label>
              <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white [color-scheme:dark]" />
            </div>
            <button type="submit" disabled={isAdding} className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-3 rounded-lg mt-6 shadow-lg shadow-indigo-500/20 flex justify-center">
              {isAdding ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save Entry'}
            </button>
          </form>
        </div>
      </div>

      {/* Right Column - List */}
      <div className="lg:col-span-2 bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-700/50 flex flex-col min-h-[400px]">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-400" />
          Active Lending Records
        </h2>
        
        {isLoading ? (
          <div className="flex-1 flex justify-center items-center">
            <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : lends.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-slate-600" />
            </div>
            <h3 className="text-lg font-medium text-slate-300">No records found</h3>
            <p className="text-slate-500 mt-1">You haven't lent any money to anyone yet.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {lends.map((lend) => (
              <div key={lend.id} className="group bg-slate-900/50 hover:bg-slate-900 rounded-xl p-4 flex items-center justify-between border border-transparent hover:border-slate-700 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${lend.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-orange-500/10 text-orange-400'}`}>
                    {lend.status === 'paid' ? <CheckCircle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-200">{lend.person}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${lend.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-orange-500/10 text-orange-400'}`}>
                        {lend.status.toUpperCase()}
                      </span>
                      <span className="text-xs text-slate-500">{format(parseISO(lend.date), 'MMM d, yyyy')}</span>
                      {lend.description && <span className="text-xs text-slate-500">• {lend.description}</span>}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-lg text-slate-200">₹{lend.amount.toFixed(2)}</span>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => handleToggleStatus(lend.id, lend.status)} className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-lg" title={lend.status === 'pending' ? 'Mark Paid' : 'Mark Pending'}>
                      {lend.status === 'pending' ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleDelete(lend.id)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg" title="Delete record">
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
