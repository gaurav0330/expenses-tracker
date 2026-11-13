import { useState, useEffect, useRef } from 'react';
import { Bell, CreditCard, TrendingUp, X, CheckCircle, AlertTriangle, ArrowRight, Volume2 } from 'lucide-react';
import { formatINR } from '../lib/utils';
import toast from 'react-hot-toast';

export function NotificationBell({ upcomingDues = [], urgentDues = [], totalUrgentAmount = 0, onNavigateTab }) {
  const [isOpen, setIsOpen] = useState(false);
  const [browserAlertsEnabled, setBrowserAlertsEnabled] = useState(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRequestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      toast.error('Browser notifications are not supported in this browser.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setBrowserAlertsEnabled(true);
        toast.success('Desktop reminders enabled! You will be alerted before due dates.');
        new Notification('Reminders Active! 🔔', {
          body: 'We will notify you 1–2 days before your EMIs and SIPs auto-debit.',
          icon: '/favicon.svg'
        });
      } else {
        setBrowserAlertsEnabled(false);
        toast.error('Notification permission was denied.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 sm:p-2.5 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl sm:rounded-2xl border border-slate-800 hover:border-amber-500/40 transition-all shadow-md flex items-center justify-center shrink-0 cursor-pointer"
        title="Upcoming EMI & SIP Payment Reminders"
        aria-label="Upcoming Payment Reminders"
      >
        <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300" />
        
        {urgentDues.length > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 sm:h-5 sm:w-5 pointer-events-none">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 sm:h-5 sm:w-5 bg-rose-500 text-white font-extrabold text-[9px] sm:text-[10px] items-center justify-center shadow-lg font-amount">
              {urgentDues.length}
            </span>
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Mobile Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 z-40 sm:hidden backdrop-blur-xs" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="fixed left-3 right-3 top-20 sm:top-auto sm:left-auto sm:right-0 sm:absolute sm:mt-3 sm:w-96 bg-[#111827] border border-slate-800 rounded-3xl shadow-2xl z-50 overflow-hidden animate-fadeIn max-h-[82vh] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-800/80 bg-slate-900/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-100">Payment Reminders</h4>
                <p className="text-[11px] text-slate-400">EMIs & SIP auto-debit alerts</p>
              </div>
            </div>
            
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Urgent Alert Callout inside Dropdown */}
          {urgentDues.length > 0 && (
            <div className="m-3 p-3 bg-gradient-to-r from-amber-500/15 to-rose-500/15 border border-amber-500/30 rounded-2xl flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-amber-300 block">
                  Keep {formatINR(totalUrgentAmount)} in your bank account!
                </span>
                <span className="text-slate-300 text-[11px] mt-0.5 block">
                  {urgentDues.length} payment(s) auto-debiting in the next 1–2 days.
                </span>
              </div>
            </div>
          )}

          {/* Dues List */}
          <div className="max-h-72 overflow-y-auto p-2 space-y-2 custom-scrollbar">
            {upcomingDues.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                <CheckCircle className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
                No active EMIs or SIP commitments found.
              </div>
            ) : (
              upcomingDues.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    if (onNavigateTab) {
                      onNavigateTab(item.type === 'EMI' ? 'emis' : 'sips');
                      setIsOpen(false);
                    }
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    item.isUrgent
                      ? 'bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/20'
                      : 'bg-slate-900/50 border-slate-800/80 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      item.type === 'EMI' 
                        ? 'bg-purple-500/20 text-purple-400' 
                        : 'bg-cyan-500/20 text-cyan-400'
                    }`}>
                      {item.type === 'EMI' ? <CreditCard className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-200 truncate">{item.title}</span>
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                          item.type === 'EMI' ? 'bg-purple-500/20 text-purple-300' : 'bg-cyan-500/20 text-cyan-300'
                        }`}>
                          {item.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.subtext}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs sm:text-sm font-bold text-white font-amount block">
                      {formatINR(item.amount)}
                    </span>
                    <span className={`text-[10px] font-extrabold block mt-0.5 ${
                      item.daysUntil === 0 
                        ? 'text-rose-400' 
                        : item.daysUntil <= 2 
                        ? 'text-amber-400' 
                        : 'text-slate-400'
                    }`}>
                      {item.dateLabel}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer with Browser Alert Toggle */}
          <div className="p-3 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
              <Volume2 className="w-3.5 h-3.5 text-slate-400" />
              Desktop Alerts:
            </span>
            
            {browserAlertsEnabled ? (
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                ✓ Enabled
              </span>
            ) : (
              <button
                onClick={handleRequestPermission}
                className="text-[11px] font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/30 transition-all cursor-pointer"
              >
                Enable Reminders
              </button>
            )}
          </div>
        </div>
        </>
      )}
    </div>
  );
}

export function UrgentDuesBanner({ urgentDues = [], totalAmount = 0, onNavigate }) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (!urgentDues || urgentDues.length === 0 || isDismissed) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-rose-500/15 border border-amber-500/30 rounded-3xl p-4 sm:p-5 mb-6 shadow-2xl relative overflow-hidden animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-extrabold text-sm sm:text-base text-amber-200">
                Bank Balance Reminder: {formatINR(totalAmount)} Required in Bank Account!
              </h4>
              <span className="text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-md uppercase">
                Due in 1–2 Days
              </span>
            </div>
            
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Ensure funds are deposited in your bank before auto-debit to prevent bounce charges or ECS failure penalties:
            </p>

            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              {urgentDues.map((due) => (
                <button
                  key={due.id}
                  onClick={() => onNavigate(due.type === 'EMI' ? 'emis' : 'sips')}
                  className="flex items-center gap-1.5 px-3 py-1 bg-slate-900/90 hover:bg-slate-800 rounded-xl border border-slate-700/80 text-xs font-semibold text-slate-200 hover:text-white transition-all shadow-sm cursor-pointer"
                >
                  <span className={due.type === 'EMI' ? 'text-purple-400 font-bold' : 'text-cyan-400 font-bold'}>
                    {due.type}:
                  </span>
                  <span>{due.title}</span>
                  <span className="font-amount font-bold text-amber-400">({formatINR(due.amount)})</span>
                  <span className="text-[10px] text-rose-400 font-bold">[{due.dateLabel}]</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
          <button
            onClick={() => onNavigate(urgentDues[0].type === 'EMI' ? 'emis' : 'sips')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
          >
            Review Details <ArrowRight className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={() => setIsDismissed(true)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl transition-all cursor-pointer"
            title="Dismiss alert for this session"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
