import { useState, useEffect } from 'react';
import { Fuel, Gauge, PlusCircle, Calendar, Trash2, Pencil, Activity, Check, X, Flame, Navigation, ArrowUpRight } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { addPetrolLog, getPetrolLogs, deletePetrolLog, updatePetrolLog } from '../lib/expenseService';
import toast from 'react-hot-toast';
import { formatINR } from '../lib/utils';
import { format } from 'date-fns';

export default function PetrolTab({ user, onSyncExpense, onDeleteExpense }) {
  const TODAY = format(new Date(), 'yyyy-MM-dd');

  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [eventType, setEventType] = useState('refuel'); // 'refuel' (Fill Petrol) or 'reserve' (Hit Reserve)
  const [date, setDate] = useState(TODAY);
  const [odometer, setOdometer] = useState('');
  const [amount, setAmount] = useState('');
  const [liters, setLiters] = useState('');
  const [pricePerLiter, setPricePerLiter] = useState('112');
  const [isFullTank, setIsFullTank] = useState(true);
  const [vehicleName, setVehicleName] = useState('My Bike');
  const [isPaidByMe, setIsPaidByMe] = useState(true);

  // Edit modal state
  const [editingLog, setEditingLog] = useState(null);
  const [editEventType, setEditEventType] = useState('refuel');
  const [editDate, setEditDate] = useState('');
  const [editOdometer, setEditOdometer] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editLiters, setEditLiters] = useState('');
  const [editVehicleName, setEditVehicleName] = useState('');
  const [editIsPaidByMe, setEditIsPaidByMe] = useState(true);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const data = await getPetrolLogs(user.uid);
      setLogs(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load petrol logs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [user.uid]);

  // Handle auto-calculating liters when amount or price/liter changes
  const handleAmountChange = (val) => {
    setAmount(val);
    if (val && pricePerLiter && parseFloat(pricePerLiter) > 0) {
      const l = (parseFloat(val) / parseFloat(pricePerLiter)).toFixed(2);
      setLiters(l);
    }
  };

  const handleLitersChange = (val) => {
    setLiters(val);
    if (val && amount && parseFloat(val) > 0) {
      const p = (parseFloat(amount) / parseFloat(val)).toFixed(2);
      setPricePerLiter(p);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || !odometer) return;

    if (eventType === 'refuel' && (!amount || !liters)) {
      toast.error('Please enter amount and liters for petrol fill');
      return;
    }

    setIsSubmitting(true);
    try {
      let syncedId = null;
      // Deduct from main expenses ONLY if paid by me
      if (eventType === 'refuel' && isPaidByMe && onSyncExpense && parseFloat(amount) > 0) {
        syncedId = await onSyncExpense({
          type: 'expense',
          amount: parseFloat(amount),
          description: `Petrol Fill - ${liters}L (${vehicleName})`,
          category: 'Transportation',
          date: date,
        });
      }

      const logData = {
        type: eventType,
        date,
        odometer: parseFloat(odometer),
        amount: eventType === 'refuel' ? parseFloat(amount) : 0,
        liters: eventType === 'refuel' ? parseFloat(liters) : 0,
        pricePerLiter: eventType === 'refuel' ? parseFloat(pricePerLiter || 0) : 0,
        isFullTank: eventType === 'refuel' ? isFullTank : false,
        vehicleName: vehicleName.trim() || 'My Bike',
        isPaidByMe: eventType === 'refuel' ? isPaidByMe : true,
        syncedTransactionId: syncedId || null,
      };

      await addPetrolLog(user.uid, logData);

      toast.success(eventType === 'refuel' ? 'Petrol fill logged!' : 'Reserve event logged!');
      setOdometer('');
      setAmount('');
      setLiters('');
      setDate(TODAY);
      await fetchLogs();
    } catch (error) {
      console.error(error);
      toast.error('Failed to save log');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (log) => {
    try {
      await deletePetrolLog(log.id);
      if (log.syncedTransactionId && onDeleteExpense) {
        try {
          await onDeleteExpense(log.syncedTransactionId);
        } catch {
          // ignore if transaction already deleted
        }
      }
      setLogs(logs.filter(l => l.id !== log.id));
      toast.success('Log deleted');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete log');
    }
  };

  const openEditModal = (log) => {
    setEditingLog(log);
    setEditEventType(log.type || 'refuel');
    setEditDate(log.date || TODAY);
    setEditOdometer(log.odometer ? log.odometer.toString() : '');
    setEditAmount(log.amount ? log.amount.toString() : '');
    setEditLiters(log.liters ? log.liters.toString() : '');
    setEditVehicleName(log.vehicleName || 'My Bike');
    setEditIsPaidByMe(log.isPaidByMe !== false);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingLog || !editDate || !editOdometer) return;

    setIsSavingEdit(true);
    try {
      await updatePetrolLog(editingLog.id, {
        type: editEventType,
        date: editDate,
        odometer: parseFloat(editOdometer),
        amount: editEventType === 'refuel' ? parseFloat(editAmount || 0) : 0,
        liters: editEventType === 'refuel' ? parseFloat(editLiters || 0) : 0,
        vehicleName: editVehicleName.trim() || 'My Bike',
        isPaidByMe: editEventType === 'refuel' ? editIsPaidByMe : true,
      });

      toast.success('Log updated!');
      setEditingLog(null);
      await fetchLogs();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update log');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // --- MILEAGE & STATS COMPUTATIONS ---
  // Sort chronologically (oldest first) for trip math
  const chronLogs = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date) || new Date(a.createdAt) - new Date(b.createdAt));

  let totalSpent = 0;
  let totalLiters = 0;
  let minOdo = Infinity;
  let maxOdo = -Infinity;

  chronLogs.forEach((log) => {
    if (log.type === 'refuel') {
      totalSpent += log.amount || 0;
      totalLiters += log.liters || 0;
    }
    if (log.odometer) {
      if (log.odometer < minOdo) minOdo = log.odometer;
      if (log.odometer > maxOdo) maxOdo = log.odometer;
    }
  });

  const totalDistance = (minOdo !== Infinity && maxOdo !== -Infinity && maxOdo > minOdo) ? (maxOdo - minOdo) : 0;
  const avgMileage = (totalLiters > 0 && totalDistance > 0) ? (totalDistance / totalLiters).toFixed(1) : '0.0';
  const costPerKm = (totalDistance > 0 && totalSpent > 0) ? (totalSpent / totalDistance).toFixed(2) : '0.00';

  // Compute Reserve-to-Reserve & Refuel Mileage for each log
  const processedLogs = chronLogs.map((log, index) => {
    const prevLog = chronLogs[index - 1];
    const distanceDelta = (prevLog && log.odometer && prevLog.odometer) ? (log.odometer - prevLog.odometer) : 0;
    
    let legMileage = null;
    if (log.type === 'refuel' && prevLog && distanceDelta > 0 && log.liters > 0) {
      legMileage = (distanceDelta / log.liters).toFixed(1);
    } else if (log.type === 'reserve' && prevLog && distanceDelta > 0) {
      // Find fuel filled between prevLog and this reserve event
      let fuelInInterval = 0;
      for (let j = index - 1; j >= 0; j--) {
        if (chronLogs[j].type === 'refuel') {
          fuelInInterval += chronLogs[j].liters || 0;
        }
        if (chronLogs[j].type === 'reserve') break;
      }
      if (fuelInInterval > 0) {
        legMileage = (distanceDelta / fuelInInterval).toFixed(1);
      }
    }

    return {
      ...log,
      distanceDelta,
      legMileage
    };
  });

  // Display logs newest first for UI list
  const displayLogs = [...processedLogs].reverse();

  // Recharts Chart Data (chronological)
  const chartData = processedLogs
    .filter(l => l.legMileage !== null || l.amount > 0)
    .map(l => ({
      date: format(new Date(l.date + 'T00:00:00'), 'MMM d'),
      mileage: l.legMileage ? parseFloat(l.legMileage) : null,
      amount: l.amount || 0,
      liters: l.liters || 0,
      odometer: l.odometer
    }));

  return (
    <div className="space-y-8">
      {/* Top KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Average Mileage */}
        <div className="bg-gradient-to-br from-amber-600 to-orange-700 rounded-2xl p-5 shadow-xl text-white relative overflow-hidden flex items-center justify-between">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <p className="font-semibold text-amber-100 text-xs tracking-wider uppercase mb-1">Average Mileage</p>
            <h3 className="text-3xl font-extrabold tracking-tight font-amount">{avgMileage} <span className="text-lg font-medium">km/L</span></h3>
            <p className="text-xs text-amber-200 mt-1">overall fuel efficiency</p>
          </div>
          <div className="p-3 bg-white/10 text-white rounded-xl relative z-10">
            <Gauge className="w-6 h-6" />
          </div>
        </div>

        {/* Cost per KM */}
        <div className="bg-[#111827] hover:bg-[#151E32] rounded-2xl p-5 shadow-xl border border-slate-800/80 transition-all flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Cost per KM</p>
            <h3 className="text-2xl font-extrabold text-amber-400 font-amount">₹{costPerKm} <span className="text-xs text-slate-400 font-normal">/ km</span></h3>
            <p className="text-xs text-slate-500 mt-1">running cost</p>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <Navigation className="w-6 h-6" />
          </div>
        </div>

        {/* Total Distance Covered */}
        <div className="bg-[#111827] hover:bg-[#151E32] rounded-2xl p-5 shadow-xl border border-slate-800/80 transition-all flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Distance Tracked</p>
            <h3 className="text-2xl font-extrabold text-cyan-400 font-amount">{totalDistance.toLocaleString()} <span className="text-xs text-slate-400 font-normal">km</span></h3>
            <p className="text-xs text-slate-500 mt-1">odometer range</p>
          </div>
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* Total Petrol Spent */}
        <div className="bg-[#111827] hover:bg-[#151E32] rounded-2xl p-5 shadow-xl border border-slate-800/80 transition-all flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Petrol Spent</p>
            <h3 className="text-2xl font-extrabold text-emerald-400 font-amount">{formatINR(totalSpent)}</h3>
            <p className="text-xs text-slate-500 mt-1">{totalLiters.toFixed(1)} Liters filled</p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <Fuel className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Left Form & Right Log History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - New Petrol / Reserve Entry Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#111827] rounded-3xl p-5 sm:p-8 shadow-2xl border border-slate-800/80">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <PlusCircle className="w-6 h-6 text-amber-400" />
              Log Petrol / Reserve
            </h2>

            {/* Event Type Selector Tabs */}
            <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1.5 rounded-xl mb-6 border border-slate-800">
              <button
                type="button"
                onClick={() => setEventType('refuel')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  eventType === 'refuel'
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Fuel className="w-4 h-4" />
                Petrol Fill
              </button>
              <button
                type="button"
                onClick={() => setEventType('reserve')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  eventType === 'reserve'
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Flame className="w-4 h-4" />
                Hit Reserve
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Vehicle Name</label>
                <input
                  type="text"
                  required
                  value={vehicleName}
                  onChange={(e) => setVehicleName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-white text-base shadow-inner"
                  placeholder="e.g., Royal Enfield / Activa"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center justify-between">
                  <span>Current Odometer (km)</span>
                  <Gauge className="w-4 h-4 text-amber-400" />
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  required
                  value={odometer}
                  onChange={(e) => setOdometer(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-white text-lg font-amount shadow-inner"
                  placeholder="e.g., 12450"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-white text-base shadow-inner [color-scheme:dark]"
                />
              </div>

              {eventType === 'refuel' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Amount (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={amount}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-white text-lg font-amount shadow-inner"
                        placeholder="500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Liters (L)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={liters}
                        onChange={(e) => handleLitersChange(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-white text-lg font-amount shadow-inner"
                        placeholder="4.85"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Rate (₹ / Liter)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={pricePerLiter}
                      onChange={(e) => {
                        setPricePerLiter(e.target.value);
                        if (amount && parseFloat(e.target.value) > 0) {
                          setLiters((parseFloat(amount) / parseFloat(e.target.value)).toFixed(2));
                        }
                      }}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 text-sm shadow-inner"
                      placeholder="112"
                    />
                  </div>

                  {/* Deduct from account balance option card */}
                  <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-2">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isPaidByMe}
                        onChange={(e) => setIsPaidByMe(e.target.checked)}
                        className="w-4 h-4 mt-0.5 accent-amber-500 rounded shrink-0"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">
                          Deduct from my Account Balance? (Paid by me)
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5 leading-snug">
                          {isPaidByMe 
                            ? '✓ Will add an expense under Transportation to deduct money from Overview balance.' 
                            : '⚡ Someone else / Friend paid. Will track fuel & mileage without deducting money from your balance.'}
                        </span>
                      </div>
                    </label>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full font-bold py-4 rounded-xl mt-6 shadow-xl flex justify-center text-lg transition-all active:scale-[0.98] text-white ${
                  eventType === 'refuel'
                    ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20'
                    : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                }`}
              >
                {isSubmitting ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : eventType === 'refuel' ? (
                  'Save Petrol Fill'
                ) : (
                  'Log Reserve Hit'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column - Log History */}
        <div className="lg:col-span-2 bg-[#111827] rounded-2xl p-5 sm:p-6 shadow-xl border border-slate-800/80 flex flex-col h-[600px] overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Fuel className="w-5 h-5 text-amber-400" />
              Petrol & Reserve Log History
            </h2>
            <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
              {logs.length} total entries
            </span>
          </div>

          {isLoading ? (
            <div className="flex-1 flex justify-center items-center">
              <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
            </div>
          ) : displayLogs.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4">
                <Gauge className="w-8 h-8 text-slate-600" />
              </div>
              <h3 className="text-lg font-medium text-slate-300">No petrol logs found</h3>
              <p className="text-slate-500 mt-1 max-w-sm">Log your petrol fills or reserve events to start tracking bike mileage.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {displayLogs.map((log) => (
                <div key={log.id} className="group bg-slate-900/50 hover:bg-slate-900 rounded-xl p-4 flex items-center justify-between border border-transparent hover:border-slate-700 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border shrink-0 ${
                      log.type === 'reserve'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {log.type === 'reserve' ? <Flame className="w-6 h-6" /> : <Fuel className="w-6 h-6" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-slate-200">
                          {log.type === 'reserve' ? 'Hit Reserve' : 'Petrol Fill'}
                        </h4>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-medium">
                          {log.vehicleName || 'My Bike'}
                        </span>

                        {log.type === 'refuel' && (
                          log.isPaidByMe !== false ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Paid by Me (Deducted)
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20">
                              Paid by Friend (No Impact)
                            </span>
                          )
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-800 text-amber-300 flex items-center gap-1 border border-amber-500/20">
                          <Gauge className="w-3.5 h-3.5 text-amber-400" />
                          {log.odometer?.toLocaleString()} km
                        </span>
                        
                        {log.distanceDelta > 0 && (
                          <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-800 text-emerald-400 flex items-center gap-1 border border-emerald-500/20">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            +{log.distanceDelta} km trip
                          </span>
                        )}

                        <span className="text-xs font-medium px-2 py-1 rounded-md bg-slate-800/80 text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {log.date}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-5">
                    {/* Mileage Badge if computed */}
                    {log.legMileage && (
                      <div className="text-right hidden sm:block">
                        <span className="text-xs font-semibold uppercase text-slate-400 block">Mileage</span>
                        <span className="text-base font-extrabold text-amber-400 font-amount">{log.legMileage} km/L</span>
                      </div>
                    )}

                    {/* Amount & Liters */}
                    <div className="text-right">
                      {log.type === 'refuel' ? (
                        <>
                          <span className="font-bold text-lg text-slate-200 block">{formatINR(log.amount)}</span>
                          <span className="text-xs text-slate-400 block font-amount">{log.liters} L</span>
                        </>
                      ) : (
                        <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-500/20">
                          RESERVE
                        </span>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={() => openEditModal(log)}
                        className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 rounded-lg transition-all"
                        title="Edit log"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(log)}
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-all"
                        title="Delete log"
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

      {/* Analytics & Charts Section */}
      {chartData.length > 0 && (
        <div className="bg-[#111827] rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800/80 space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2 text-white">
            <Gauge className="w-5 h-5 text-amber-400" />
            Fuel & Mileage Analytics
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Mileage Trend Line Chart */}
            <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
              <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-400" />
                Mileage Performance Trend (km / L)
              </h3>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} unit=" km/L" />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff' }} />
                    <Line type="monotone" dataKey="mileage" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', r: 5 }} name="Mileage (km/L)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Petrol Expenses Bar Chart */}
            <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
              <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                <Fuel className="w-4 h-4 text-emerald-400" />
                Fuel Expense & Volume Fill
              </h3>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip 
                      formatter={(val, name) => [name === 'amount' ? formatINR(val) : `${val} L`, name === 'amount' ? 'Amount Spent' : 'Liters']}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff' }} 
                    />
                    <Bar dataKey="amount" fill="#10b981" radius={[6, 6, 0, 0]} name="Amount (₹)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- EDIT LOG MODAL --- */}
      {editingLog && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all">
          <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Pencil className="w-5 h-5 text-amber-400" />
                Edit Log Entry
              </h3>
              <button
                onClick={() => setEditingLog(null)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Event Type</label>
                <select
                  value={editEventType}
                  onChange={(e) => setEditEventType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-3.5 text-white font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                >
                  <option value="refuel">Petrol Fill</option>
                  <option value="reserve">Hit Reserve</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Vehicle Name</label>
                <input
                  type="text"
                  required
                  value={editVehicleName}
                  onChange={(e) => setEditVehicleName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-3.5 text-white text-base shadow-inner"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Odometer Reading (km)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={editOdometer}
                  onChange={(e) => setEditOdometer(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-3.5 text-white font-amount text-lg shadow-inner"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Date</label>
                <input
                  type="date"
                  required
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-3.5 text-white shadow-inner [color-scheme:dark]"
                />
              </div>

              {editEventType === 'refuel' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Amount (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-3.5 text-white font-amount text-lg shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Liters (L)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={editLiters}
                      onChange={(e) => setEditLiters(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-3.5 text-white font-amount text-lg shadow-inner"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingLog(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-3.5 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-amber-600/20 flex justify-center items-center gap-2 transition-all active:scale-[0.98]"
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
