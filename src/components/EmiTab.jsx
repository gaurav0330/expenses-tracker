import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { 
  CreditCard, PlusCircle, Trash2, Pencil, X, Calendar, 
  CheckCircle2, AlertCircle, ShoppingBag, Landmark, Check, Clock
} from 'lucide-react';
import { addEmi, getEmis, updateEmi, deleteEmi, payEmiInstallment, addTransaction } from '../lib/expenseService';
import toast from 'react-hot-toast';
import { formatINR } from '../lib/utils';

export default function EmiTab({ user, onTransactionAdded }) {
  const [emis, setEmis] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('active'); // 'active', 'completed', 'all'
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingEmi, setEditingEmi] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [payingItem, setPayingItem] = useState(null);
  const [logToOverview, setLogToOverview] = useState(true);
  const [payCategory, setPayCategory] = useState('Shopping');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Add Form state
  const [itemName, setItemName] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [downPayment, setDownPayment] = useState('0');
  const [monthlyEmi, setMonthlyEmi] = useState('');
  const [totalTenure, setTotalTenure] = useState('6');
  const [paidInstallments, setPaidInstallments] = useState('0');
  const [dueDay, setDueDay] = useState('5');
  const [sourceCard, setSourceCard] = useState('Credit Card EMI');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Edit Form state
  const [editItemName, setEditItemName] = useState('');
  const [editTotalPrice, setEditTotalPrice] = useState('');
  const [editDownPayment, setEditDownPayment] = useState('0');
  const [editMonthlyEmi, setEditMonthlyEmi] = useState('');
  const [editTotalTenure, setEditTotalTenure] = useState('');
  const [editPaidInstallments, setEditPaidInstallments] = useState('0');
  const [editDueDay, setEditDueDay] = useState('5');
  const [editSourceCard, setEditSourceCard] = useState('');
  const [editStartDate, setEditStartDate] = useState('');

  const fetchEmis = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getEmis(user.uid);
      setEmis(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load EMI records');
    } finally {
      setIsLoading(false);
    }
  }, [user.uid]);

  useEffect(() => {
    fetchEmis();
  }, [fetchEmis]);

  const resetAddForm = () => {
    setItemName('');
    setTotalPrice('');
    setDownPayment('0');
    setMonthlyEmi('');
    setTotalTenure('6');
    setPaidInstallments('0');
    setDueDay('5');
    setSourceCard('Credit Card EMI');
    setStartDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!itemName.trim() || !totalPrice || !monthlyEmi || !totalTenure) {
      toast.error('Please fill in all required fields');
      return;
    }

    const price = parseFloat(totalPrice);
    const down = parseFloat(downPayment || 0);
    const emi = parseFloat(monthlyEmi);
    const tenure = parseInt(totalTenure);
    const paid = parseInt(paidInstallments || 0);

    if (price <= 0 || emi <= 0 || tenure <= 0) {
      toast.error('Prices and tenure must be positive numbers');
      return;
    }

    setIsSubmitting(true);
    try {
      const isCompleted = paid >= tenure;
      await addEmi(user.uid, {
        itemName: itemName.trim(),
        totalPrice: price,
        downPayment: down,
        monthlyEmi: emi,
        totalTenure: tenure,
        paidInstallments: paid,
        dueDay: parseInt(dueDay || 5),
        sourceCard: sourceCard.trim() || 'Credit Card EMI',
        startDate,
        status: isCompleted ? 'completed' : 'active'
      });

      toast.success('EMI Purchase added successfully!');
      resetAddForm();
      setIsAddModalOpen(false);
      await fetchEmis();
    } catch (error) {
      console.error(error);
      toast.error('Failed to add EMI purchase');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (item) => {
    setEditingEmi(item);
    setEditItemName(item.itemName || '');
    setEditTotalPrice(item.totalPrice ? item.totalPrice.toString() : '');
    setEditDownPayment(item.downPayment ? item.downPayment.toString() : '0');
    setEditMonthlyEmi(item.monthlyEmi ? item.monthlyEmi.toString() : '');
    setEditTotalTenure(item.totalTenure ? item.totalTenure.toString() : '6');
    setEditPaidInstallments(item.paidInstallments ? item.paidInstallments.toString() : '0');
    setEditDueDay(item.dueDay ? item.dueDay.toString() : '5');
    setEditSourceCard(item.sourceCard || 'Credit Card EMI');
    setEditStartDate(item.startDate || format(new Date(), 'yyyy-MM-dd'));
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editingEmi || !editItemName.trim()) return;

    const price = parseFloat(editTotalPrice);
    const down = parseFloat(editDownPayment || 0);
    const emi = parseFloat(editMonthlyEmi);
    const tenure = parseInt(editTotalTenure);
    const paid = parseInt(editPaidInstallments || 0);

    setIsSavingEdit(true);
    try {
      const isCompleted = paid >= tenure;
      await updateEmi(editingEmi.id, {
        itemName: editItemName.trim(),
        totalPrice: price,
        downPayment: down,
        monthlyEmi: emi,
        totalTenure: tenure,
        paidInstallments: paid,
        dueDay: parseInt(editDueDay || 5),
        sourceCard: editSourceCard.trim() || 'Credit Card EMI',
        startDate: editStartDate,
        status: isCompleted ? 'completed' : 'active'
      });

      toast.success('EMI details updated!');
      setEditingEmi(null);
      await fetchEmis();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update EMI');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = (id) => {
    setDeletingId(id);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteEmi(deletingId);
      setEmis(prev => prev.filter(item => item.id !== deletingId));
      toast.success('EMI record deleted');
      setDeletingId(null);
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete EMI');
    }
  };

  const handlePayInstallment = (item) => {
    const currentPaid = item.paidInstallments || 0;
    const totalTenure = item.totalTenure || 1;

    if (currentPaid >= totalTenure) {
      toast.success('This EMI is already fully completed!');
      return;
    }
    setPayingItem(item);
  };

  const confirmPayInstallment = async () => {
    if (!payingItem) return;
    const currentPaid = payingItem.paidInstallments || 0;
    const totalTenure = payingItem.totalTenure || 1;

    setIsProcessingPayment(true);
    try {
      await payEmiInstallment(payingItem.id, currentPaid, totalTenure);
      toast.success(`Marked 1 installment paid for ${payingItem.itemName}!`);

      if (logToOverview) {
        await addTransaction(user.uid, {
          type: 'expense',
          category: payCategory,
          description: `EMI Payment: ${payingItem.itemName} (${currentPaid + 1}/${totalTenure})`,
          amount: payingItem.monthlyEmi,
          date: format(new Date(), 'yyyy-MM-dd')
        });
        toast.success('Logged EMI payment into main transactions!');
        if (onTransactionAdded) onTransactionAdded();
      }

      setPayingItem(null);
      await fetchEmis();
    } catch (error) {
      console.error(error);
      toast.error('Failed to record installment payment');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // --- STATS COMPUTATIONS ---
  const activeEmis = emis.filter(e => e.status === 'active' && (e.paidInstallments || 0) < (e.totalTenure || 1));
  const completedEmis = emis.filter(e => e.status === 'completed' || (e.paidInstallments || 0) >= (e.totalTenure || 1));

  const totalMonthlyCommitment = activeEmis.reduce((sum, e) => sum + (e.monthlyEmi || 0), 0);
  
  const totalRemainingLiability = activeEmis.reduce((sum, e) => {
    const paid = e.paidInstallments || 0;
    const totalTenure = e.totalTenure || 1;
    const remainingTenure = Math.max(0, totalTenure - paid);
    return sum + (remainingTenure * (e.monthlyEmi || 0));
  }, 0);

  // Filtered List for UI
  const displayEmis = emis.filter(item => {
    const isDone = item.status === 'completed' || (item.paidInstallments || 0) >= (item.totalTenure || 1);
    if (filter === 'active') return !isDone;
    if (filter === 'completed') return isDone;
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Top KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Monthly EMI Commitment */}
        <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-5 shadow-xl shadow-purple-950/30 text-white relative overflow-hidden flex items-center justify-between">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <p className="font-semibold text-purple-100 text-xs tracking-wider uppercase mb-1">Monthly EMI Commitment</p>
            <h3 className="text-3xl font-extrabold tracking-tight font-amount">{formatINR(totalMonthlyCommitment)}</h3>
            <p className="text-xs text-purple-200 mt-1">across {activeEmis.length} active EMIs</p>
          </div>
          <div className="p-3 bg-white/10 text-white rounded-xl relative z-10">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        {/* Total Remaining Liability */}
        <div className="bg-[#111827] hover:bg-[#151E32] rounded-2xl p-5 shadow-xl border border-slate-800/80 transition-all flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Outstanding Debt</p>
            <h3 className="text-2xl font-extrabold text-rose-400 font-amount">{formatINR(totalRemainingLiability)}</h3>
            <p className="text-xs text-slate-500 mt-1">remaining principal balance</p>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Active EMIs Count */}
        <div className="bg-[#111827] hover:bg-[#151E32] rounded-2xl p-5 shadow-xl border border-slate-800/80 transition-all flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Active Purchases</p>
            <h3 className="text-2xl font-extrabold text-purple-400 font-amount">{activeEmis.length}</h3>
            <p className="text-xs text-slate-500 mt-1">ongoing monthly plans</p>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        {/* Completed EMIs */}
        <div className="bg-[#111827] hover:bg-[#151E32] rounded-2xl p-5 shadow-xl border border-slate-800/80 transition-all flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Completed EMIs</p>
            <h3 className="text-2xl font-extrabold text-emerald-400 font-amount">{completedEmis.length}</h3>
            <p className="text-xs text-slate-500 mt-1">fully paid-off items 🎉</p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Full-Width EMI List Container */}
      <div className="bg-[#111827] rounded-3xl p-5 sm:p-8 shadow-2xl border border-slate-800/80 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
              <CreditCard className="w-6 h-6 text-purple-400" />
              EMI Purchases & Monthly Commitments
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm font-medium mt-1">
              Track gadgets, appliances, and items bought on monthly installment plans
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter Buttons */}
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
              <button
                onClick={() => setFilter('active')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${filter === 'active' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Active ({activeEmis.length})
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${filter === 'completed' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Completed ({completedEmis.length})
              </button>
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${filter === 'all' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                All ({emis.length})
              </button>
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-sm shadow-xl shadow-purple-600/20 transition-all active:scale-98 shrink-0"
            >
              <PlusCircle className="w-5 h-5" />
              New EMI Purchase
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 flex justify-center items-center">
            <div className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          </div>
        ) : displayEmis.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4">
              <ShoppingBag className="w-8 h-8 text-slate-600" />
            </div>
            <h3 className="text-lg font-medium text-slate-300">No EMI purchases found</h3>
            <p className="text-slate-500 mt-1 max-w-sm">Click "+ New EMI Purchase" above to track gadgets or items bought on monthly installment plans.</p>
          </div>
        ) : (
          <div className="min-h-[460px] max-h-[640px] flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
            {displayEmis.map((item) => {
              const paidCount = item.paidInstallments || 0;
              const totalTenure = item.totalTenure || 1;
              const isDone = item.status === 'completed' || paidCount >= totalTenure;
              const progressPct = Math.min(100, Math.round((paidCount / totalTenure) * 100));
              const remainingMonths = Math.max(0, totalTenure - paidCount);
              const remainingBalance = remainingMonths * (item.monthlyEmi || 0);

              return (
                <div 
                  key={item.id} 
                  className={`group bg-slate-900/60 hover:bg-slate-900 rounded-2xl p-5 border border-slate-800/80 hover:border-slate-700 transition-all space-y-4 ${
                    isDone ? 'opacity-80 border-emerald-500/20' : ''
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Item title & source badge */}
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                        isDone ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      }`}>
                        {isDone ? <CheckCircle2 className="w-6 h-6" /> : <CreditCard className="w-6 h-6" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-100 text-lg">{item.itemName}</h4>
                          <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md border ${
                            isDone ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                          }`}>
                            {isDone ? 'COMPLETED' : 'ACTIVE EMI'}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-800 text-purple-300 flex items-center gap-1.5 border border-purple-500/20">
                            <Landmark className="w-3.5 h-3.5 text-purple-400" />
                            {item.sourceCard || 'Credit Card EMI'}
                          </span>
                          <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-800/80 text-slate-400 flex items-center gap-1.5 border border-slate-700/50">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            Due on {item.dueDay || 5}th of every month
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* EMI monthly amount & total balance */}
                    <div className="flex items-center gap-6 justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800">
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block font-medium">Monthly Installment</span>
                        <span className="font-extrabold text-xl text-purple-400 font-amount">{formatINR(item.monthlyEmi)}/mo</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block font-medium">Total Price</span>
                        <span className="font-bold text-base text-slate-200 font-amount">{formatINR(item.totalPrice)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar & Installment Counter */}
                  <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800/80 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-300 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-purple-400" />
                        Installments: <span className="text-purple-300 font-bold">{paidCount} of {totalTenure} months paid</span>
                      </span>
                      <span className="text-slate-400">
                        {isDone ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Fully Cleared
                          </span>
                        ) : (
                          <span>Remaining Balance: <strong className="text-rose-400 font-amount">{formatINR(remainingBalance)}</strong> ({remainingMonths} mos left)</span>
                        )}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${isDone ? 'bg-emerald-400' : 'bg-gradient-to-r from-purple-500 to-indigo-500'}`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Card Action Controls */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-500 font-medium">
                      Started: {item.startDate || 'N/A'} {item.downPayment > 0 && `(Down payment: ${formatINR(item.downPayment)})`}
                    </span>

                    <div className="flex items-center gap-2">
                      {!isDone && (
                        <button
                          onClick={() => handlePayInstallment(item)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl border border-emerald-500/30 transition-all active:scale-95"
                          title="Mark 1 month installment paid"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Pay 1 Month EMI
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-2 text-slate-400 hover:text-purple-400 hover:bg-purple-400/10 rounded-lg transition-all"
                        title="Edit EMI details"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-all"
                        title="Delete EMI record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- PAY INSTALLMENT CONFIRM MODAL --- */}
      {payingItem && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Pay Monthly Installment
              </h3>
              <button 
                onClick={() => setPayingItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Item:</span>
                <span className="font-bold text-white">{payingItem.itemName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Installment:</span>
                <span className="font-bold text-purple-300 font-amount">
                  {(payingItem.paidInstallments || 0) + 1} of {payingItem.totalTenure}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount Due:</span>
                <span className="font-extrabold text-emerald-400 text-base font-amount">
                  {formatINR(payingItem.monthlyEmi)}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-start gap-2.5 cursor-pointer bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <input
                  type="checkbox"
                  checked={logToOverview}
                  onChange={(e) => setLogToOverview(e.target.checked)}
                  className="w-4 h-4 mt-0.5 accent-emerald-500 rounded shrink-0 cursor-pointer"
                />
                <span className="text-xs text-slate-300 font-medium">
                  Log this payment as an expense in your <strong className="text-emerald-400">Overview</strong> tab for this month
                </span>
              </label>

              {logToOverview && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Expense Category</label>
                  <select
                    value={payCategory}
                    onChange={(e) => setPayCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    <option value="Shopping">Shopping</option>
                    <option value="Bills & Utilities">Bills & Utilities</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPayingItem(null)}
                className="w-1/2 px-4 py-3 rounded-xl border border-slate-700 text-slate-300 font-semibold text-sm hover:bg-slate-800 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessingPayment}
                onClick={confirmPayInstallment}
                className="w-1/2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/20 transition-all active:scale-98 disabled:opacity-50"
              >
                {isProcessingPayment ? 'Processing...' : 'Confirm Pay'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRM MODAL --- */}
      {deletingId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative space-y-5 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Delete EMI Purchase?</h3>
              <p className="text-xs text-slate-400 mt-1">This will permanently remove the record from your EMI tracker.</p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="w-1/2 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-semibold text-xs hover:bg-slate-800 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="w-1/2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xl shadow-rose-600/20 transition-all active:scale-98"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all">
          <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-6 h-6 text-purple-400" />
                New EMI Purchase Entry
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Item / Purchase Name</label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  placeholder="e.g. iPhone 15 Pro, LG Fridge, Gaming Laptop"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Total Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={totalPrice}
                    onChange={(e) => setTotalPrice(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm font-amount focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    placeholder="60000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Down Payment (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={downPayment}
                    onChange={(e) => setDownPayment(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm font-amount focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Monthly EMI Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={monthlyEmi}
                    onChange={(e) => setMonthlyEmi(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm font-amount focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    placeholder="5000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Total Tenure (Months)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={totalTenure}
                    onChange={(e) => setTotalTenure(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm font-amount focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    placeholder="12"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Installments Paid So Far</label>
                  <input
                    type="number"
                    min="0"
                    value={paidInstallments}
                    onChange={(e) => setPaidInstallments(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm font-amount focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">EMI Due Day of Month</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm font-amount focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    placeholder="5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Bank / Card Used</label>
                <input
                  type="text"
                  value={sourceCard}
                  onChange={(e) => setSourceCard(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  placeholder="e.g. HDFC Credit Card, ICICI No-Cost EMI, Bajaj Finserv"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Start Date</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm [color-scheme:dark]"
                />
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-1/2 px-4 py-3 rounded-xl border border-slate-700 text-slate-300 font-semibold text-sm hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-1/2 px-4 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-xl shadow-purple-600/20 transition-all active:scale-98 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save EMI Purchase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT EMI MODAL --- */}
      {editingEmi && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all">
          <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Pencil className="w-6 h-6 text-purple-400" />
                Edit EMI Purchase Record
              </h3>
              <button
                onClick={() => setEditingEmi(null)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Item / Purchase Name</label>
                <input
                  type="text"
                  required
                  value={editItemName}
                  onChange={(e) => setEditItemName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Total Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editTotalPrice}
                    onChange={(e) => setEditTotalPrice(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm font-amount focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Down Payment (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editDownPayment}
                    onChange={(e) => setEditDownPayment(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm font-amount focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Monthly EMI Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editMonthlyEmi}
                    onChange={(e) => setEditMonthlyEmi(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm font-amount focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Total Tenure (Months)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editTotalTenure}
                    onChange={(e) => setEditTotalTenure(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm font-amount focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Installments Paid So Far</label>
                  <input
                    type="number"
                    min="0"
                    value={editPaidInstallments}
                    onChange={(e) => setEditPaidInstallments(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm font-amount focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">EMI Due Day of Month</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={editDueDay}
                    onChange={(e) => setEditDueDay(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm font-amount focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Bank / Card Used</label>
                <input
                  type="text"
                  value={editSourceCard}
                  onChange={(e) => setEditSourceCard(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Start Date</label>
                <input
                  type="date"
                  required
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm [color-scheme:dark]"
                />
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingEmi(null)}
                  className="w-1/2 px-4 py-3 rounded-xl border border-slate-700 text-slate-300 font-semibold text-sm hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="w-1/2 px-4 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-xl shadow-purple-600/20 transition-all active:scale-98 disabled:opacity-50"
                >
                  {isSavingEdit ? 'Saving...' : 'Update EMI'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
