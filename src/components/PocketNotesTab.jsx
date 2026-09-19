import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { NotebookPen, PlusCircle, Trash2, ArrowUpRight, ArrowDownRight, StickyNote, Wallet, Landmark } from 'lucide-react';
import { addPocketEntry, getPocketEntries, deletePocketEntry } from '../lib/expenseService';
import toast from 'react-hot-toast';
import { formatINR } from '../lib/utils';

export default function PocketNotesTab({ user }) {
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'money', 'notes'

  const [entryType, setEntryType] = useState('received'); // 'received', 'spent', 'note'
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const fetchEntries = async () => {
    setIsLoading(true);
    try {
      const data = await getPocketEntries(user.uid);
      setEntries(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load pocket notes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [user.uid]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (entryType !== 'note' && (!amount || parseFloat(amount) <= 0)) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsAdding(true);
    try {
      await addPocketEntry(user.uid, {
        type: entryType,
        title: title.trim(),
        amount: entryType === 'note' ? 0 : parseFloat(amount),
        note: note.trim(),
        date
      });
      toast.success(entryType === 'note' ? 'Note saved!' : 'Pocket entry added!');
      setTitle('');
      setAmount('');
      setNote('');
      await fetchEntries();
    } catch (error) {
      console.error(error);
      toast.error('Failed to add entry.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deletePocketEntry(id);
      setEntries(entries.filter(e => e.id !== id));
      toast.success('Entry deleted');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete');
    }
  };

  // Calculations
  const totalReceived = entries
    .filter(e => e.type === 'received')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalSpent = entries
    .filter(e => e.type === 'spent')
    .reduce((sum, e) => sum + e.amount, 0);

  const sideBalance = totalReceived - totalSpent;
  const notesCount = entries.filter(e => e.type === 'note').length;

  // Filtered List
  const filteredEntries = entries.filter(e => {
    if (filter === 'money') return e.type === 'received' || e.type === 'spent';
    if (filter === 'notes') return e.type === 'note';
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Side Balance Card */}
        <div className="bg-gradient-to-br from-amber-600 to-orange-700 rounded-2xl p-5 shadow-xl text-white relative overflow-hidden shadow-amber-950/30">
          <div className="absolute -right-6 -top-6 w-28 h-28 bg-white/10 rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-100">Side Cash Balance</span>
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Landmark className="w-5 h-5 text-white" />
              </div>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-amount">{formatINR(sideBalance)}</h3>
            <p className="text-xs text-amber-100 mt-1">Separate from main account</p>
          </div>
        </div>

        {/* Total Received */}
        <div className="bg-[#111827] hover:bg-[#151E32] rounded-2xl p-5 shadow-xl border border-slate-800/80 transition-all flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Received</p>
            <h3 className="text-2xl font-extrabold text-emerald-400 font-amount">{formatINR(totalReceived)}</h3>
            <p className="text-xs text-slate-500 mt-1">from Father / Others</p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        {/* Total Spent */}
        <div className="bg-[#111827] hover:bg-[#151E32] rounded-2xl p-5 shadow-xl border border-slate-800/80 transition-all flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Side Expenses</p>
            <h3 className="text-2xl font-extrabold text-rose-400 font-amount">{formatINR(totalSpent)}</h3>
            <p className="text-xs text-slate-500 mt-1">spent from side cash</p>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
            <ArrowDownRight className="w-6 h-6" />
          </div>
        </div>

        {/* Quick Notes */}
        <div className="bg-[#111827] hover:bg-[#151E32] rounded-2xl p-5 shadow-xl border border-slate-800/80 transition-all flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Saved Notes</p>
            <h3 className="text-2xl font-extrabold text-cyan-400 font-amount">{notesCount}</h3>
            <p className="text-xs text-slate-500 mt-1">memos & instructions</p>
          </div>
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl">
            <StickyNote className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Form & List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Column */}
        <div className="lg:col-span-1 bg-[#111827] rounded-3xl p-5 sm:p-8 shadow-2xl border border-slate-800/80">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <NotebookPen className="w-6 h-6 text-amber-400" />
            Add Pocket Entry
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Entry Type Selector */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Entry Type</label>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-900 p-1.5 rounded-xl border border-slate-700/50">
                <button
                  type="button"
                  onClick={() => setEntryType('received')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    entryType === 'received' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  + Received
                </button>
                <button
                  type="button"
                  onClick={() => setEntryType('spent')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    entryType === 'spent' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  - Spent
                </button>
                <button
                  type="button"
                  onClick={() => setEntryType('note')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    entryType === 'note' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  📝 Note
                </button>
              </div>
            </div>

            {/* Title / Description */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                {entryType === 'note' ? 'Note Header' : 'Reason / Source'}
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3.5 text-white text-base focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-inner"
                placeholder={entryType === 'received' ? 'e.g., From Father for Mess Fee' : entryType === 'spent' ? 'e.g., Books / College Expense' : 'e.g., Dad said to pay bill tomorrow'}
              />
            </div>

            {/* Amount (only if not a pure note) */}
            {entryType !== 'note' && (
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
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3.5 text-white text-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-inner"
                  placeholder="0.00"
                />
              </div>
            )}

            {/* Date */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3.5 text-white shadow-inner [color-scheme:dark]"
              />
            </div>

            {/* Additional Note / Memo */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Details / Notes (Optional)</label>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-inner resize-none"
                placeholder="Any special instruction or details..."
              />
            </div>

            <button
              type="submit"
              disabled={isAdding}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 rounded-xl shadow-xl shadow-amber-500/20 flex justify-center text-lg transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isAdding ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save Pocket Entry'}
            </button>
          </form>
        </div>

        {/* List Column */}
        <div className="lg:col-span-2 bg-[#111827] rounded-2xl p-5 sm:p-6 shadow-xl border border-slate-800/80 flex flex-col h-[580px] max-h-[80vh] overflow-hidden">
          <div className="flex flex-wrap items-center justify-between mb-6 gap-3">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <StickyNote className="w-5 h-5 text-amber-400" />
              Side Vault & Notes Log
            </h2>

            {/* Filter Buttons */}
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700/50 text-xs font-semibold">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${filter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                All ({entries.length})
              </button>
              <button
                onClick={() => setFilter('money')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${filter === 'money' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Money Log
              </button>
              <button
                onClick={() => setFilter('notes')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${filter === 'notes' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Notes ({notesCount})
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex-1 flex justify-center items-center">
              <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4">
                <NotebookPen className="w-8 h-8 text-slate-600" />
              </div>
              <h3 className="text-lg font-medium text-slate-300">No entries yet</h3>
              <p className="text-slate-500 mt-1 max-w-[250px]">Keep money received from your father or separate notes isolated here!</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto max-h-[460px] space-y-4 pr-2 custom-scrollbar">
              {filteredEntries.map((item) => {
                const isRec = item.type === 'received';
                const isSpent = item.type === 'spent';
                const isNote = item.type === 'note';

                return (
                  <div
                    key={item.id}
                    className="group bg-slate-900/50 hover:bg-slate-900 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between border border-transparent hover:border-slate-700 transition-all gap-3"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
                          isRec ? 'bg-emerald-500/10 text-emerald-400' : isSpent ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'
                        }`}
                      >
                        {isRec ? <ArrowUpRight className="w-5 h-5" /> : isSpent ? <ArrowDownRight className="w-5 h-5" /> : <StickyNote className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-slate-200">{item.title}</h4>
                          <span
                            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                              isRec
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : isSpent
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {isRec ? 'Received' : isSpent ? 'Spent' : 'Note'}
                          </span>
                        </div>
                        {item.note && <p className="text-slate-400 text-xs mt-1 font-normal bg-slate-800/60 px-2.5 py-1 rounded-md">{item.note}</p>}
                        <span className="text-xs text-slate-500 mt-1 block">
                          {format(parseISO(item.date), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      {!isNote && (
                        <span className={`font-bold text-base sm:text-lg font-amount ${isRec ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isRec ? '+' : '-'}{formatINR(item.amount)}
                        </span>
                      )}
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                        title="Delete entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
