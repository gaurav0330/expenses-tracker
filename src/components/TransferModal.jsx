import { useState, useId } from 'react';
import { X, ArrowRightLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { formatINR } from '../lib/utils';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function TransferModal({ 
  isOpen, 
  onClose, 
  accounts = [], 
  accountBalances = {}, 
  onTransfer 
}) {
  const fromSelectId = useId();
  const toSelectId = useId();
  const amountInputId = useId();
  const dateInputId = useId();
  const noteInputId = useId();

  const [fromAccountId, setFromAccountId] = useState(accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(accounts[1]?.id || accounts[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const fromAcc = accounts.find(a => a.id === fromAccountId) || accounts[0];
  const toAcc = accounts.find(a => a.id === toAccountId) || accounts[1] || accounts[0];

  const fromBalance = accountBalances[fromAcc?.id] ?? (fromAcc?.openingBalance || 0);
  const toBalance = accountBalances[toAcc?.id] ?? (toAcc?.openingBalance || 0);

  const numAmount = parseFloat(amount) || 0;
  const newFromBalance = fromBalance - numAmount;
  const newToBalance = toBalance + numAmount;

  const handleSwap = () => {
    const temp = fromAccountId;
    setFromAccountId(toAccountId);
    setToAccountId(temp);
  };

  const handleQuickAmount = (val) => {
    setAmount(val.toString());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fromAccountId || !toAccountId) {
      toast.error('Please select both From and To accounts');
      return;
    }
    if (fromAccountId === toAccountId) {
      toast.error('Source and Destination accounts must be different');
      return;
    }
    if (numAmount <= 0) {
      toast.error('Please enter an amount greater than 0');
      return;
    }

    setIsSubmitting(true);
    try {
      await onTransfer({
        fromAccountId,
        fromAccountName: fromAcc.name,
        toAccountId,
        toAccountName: toAcc.name,
        amount: numAmount,
        description: description.trim() || `Shifted to ${toAcc.name}`,
        date
      });
      toast.success(`Successfully shifted ${formatINR(numAmount)} to ${toAcc.name}!`);
      setAmount('');
      setDescription('');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to complete transfer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#111827] border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Shift / Transfer Money
              </h2>
              <p className="text-slate-400 text-xs">
                Move money between accounts with zero impact on monthly expenses
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          
          {/* Account Selection Box with Swap */}
          <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800/80 space-y-3">
            
            {/* From Account */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor={fromSelectId} className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  From (Debit)
                </label>
                <span className="text-xs font-amount text-slate-400">
                  Balance: <span className={fromBalance >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{formatINR(fromBalance)}</span>
                </span>
              </div>
              <select
                id={fromSelectId}
                value={fromAccountId}
                onChange={(e) => setFromAccountId(e.target.value)}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer shadow-inner"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.type.toUpperCase()}) — {formatINR(accountBalances[acc.id] ?? acc.openingBalance)}
                  </option>
                ))}
              </select>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center -my-1">
              <button
                type="button"
                onClick={handleSwap}
                className="p-1.5 bg-slate-800 hover:bg-indigo-600/30 text-indigo-400 hover:text-indigo-300 rounded-full border border-slate-700 transition-all shadow-md active:scale-95"
                title="Swap From and To accounts"
              >
                <ArrowRightLeft className="w-4 h-4 rotate-90" />
              </button>
            </div>

            {/* To Account */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor={toSelectId} className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  To (Credit)
                </label>
                <span className="text-xs font-amount text-slate-400">
                  Balance: <span className={toBalance >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{formatINR(toBalance)}</span>
                </span>
              </div>
              <select
                id={toSelectId}
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer shadow-inner"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id} disabled={acc.id === fromAccountId}>
                    {acc.name} ({acc.type.toUpperCase()}) {acc.id === fromAccountId ? '(Selected above)' : `— ${formatINR(accountBalances[acc.id] ?? acc.openingBalance)}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label htmlFor={amountInputId} className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Transfer Amount (₹)
            </label>
            <input
              id={amountInputId}
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-xl font-amount text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner"
            />
            {/* Quick Amount Chips */}
            <div className="flex flex-wrap gap-2 mt-2">
              {[500, 1000, 2000, 5000, 10000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAmount(val)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700/60 font-amount transition-colors"
                >
                  +{formatINR(val)}
                </button>
              ))}
              {fromBalance > 0 && (
                <button
                  type="button"
                  onClick={() => handleQuickAmount(fromBalance)}
                  className="px-2.5 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-xs font-semibold rounded-lg border border-indigo-500/40 font-amount transition-colors"
                >
                  All ({formatINR(fromBalance)})
                </button>
              )}
            </div>
          </div>

          {/* Date & Note Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor={dateInputId} className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Transfer Date
              </label>
              <div className="relative">
                <input
                  id={dateInputId}
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 [color-scheme:dark] shadow-inner"
                />
              </div>
            </div>
            <div>
              <label htmlFor={noteInputId} className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Note / Description
              </label>
              <input
                id={noteInputId}
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. ATM Cash, UPI, Split"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner"
              />
            </div>
          </div>

          {/* Live Preview Card */}
          {numAmount > 0 && (
            <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-3.5 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-indigo-300 font-bold">
                <span>Transfer Preview</span>
                <span className="flex items-center gap-1 font-normal text-slate-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Total Wealth Unchanged
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 text-slate-300 font-amount">
                <span>{fromAcc?.name}: {formatINR(fromBalance)} → <span className="font-bold text-rose-400">{formatINR(newFromBalance)}</span></span>
                <ArrowRight className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>{toAcc?.name}: {formatINR(toBalance)} → <span className="font-bold text-emerald-400">{formatINR(newToBalance)}</span></span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || numAmount <= 0}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ArrowRightLeft className="w-4 h-4" />
                  Confirm Shift
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
