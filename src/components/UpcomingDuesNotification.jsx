import { useState, useEffect, useRef } from 'react';
import { Bell, CreditCard, TrendingUp, X, CheckCircle, AlertTriangle, ArrowRight, Volume2 } from 'lucide-react';
import { formatINR } from '../lib/utils';
import { PrivacyAmount } from '../context/PrivacyContext';
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
            className="fixed inset-0 bg-black/70 z-40 sm:hidden backdrop-blur-sm" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="fixed left-3 right-3 top-20 sm:top-auto sm:left-auto sm:right-0 sm:absolute sm:mt-3 sm:w-96 fintech-card border border-white/[0.1] rounded-3xl shadow-2xl z-50 overflow-hidden animate-fadeIn max-h-[82vh] flex flex-col backdrop-blur-2xl">
          {/* Header */}
          <div className="p-4 border-b border-white/[0.06] bg-dark-950/70 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-white tracking-tight">Payment Reminders</h4>
                <p className="text-[11px] text-slate-400">EMIs & SIP auto-debit alerts</p>
              </div>
            </div>
            
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Urgent Alert Callout inside Dropdown */}
          {urgentDues.length > 0 && (
            <div className="m-3 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-2.5 backdrop-blur-md">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-amber-300 block">
                  Keep <PrivacyAmount amount={totalUrgentAmount} id="notif_urgent_total" /> in your bank account!
                </span>
                <span className="text-slate-300 text-[11px] mt-0.5 block">
                  {urgentDues.length} payment(s) auto-debiting in the next 1–2 days.
                </span>
              </div>
            </div>
          )}

          {/* Dues List */}
          <div className="max-h-72 overflow-y-auto p-2.5 space-y-2 custom-scrollbar">
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
                      ? 'bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/15'
                      : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.06] hover:border-white/[0.1]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                      item.type === 'EMI' 
                        ? 'bg-purple-500/15 text-purple-400 border-purple-500/30' 
                        : 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                    }`}>
                      {item.type === 'EMI' ? <CreditCard className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate">{item.title}</span>
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
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
                      <PrivacyAmount amount={item.amount} id={`due_${item.id}`} />
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
          <div className="p-3 border-t border-white/[0.06] bg-dark-950/70 flex items-center justify-between text-xs">
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
    <div className="fintech-card border border-amber-500/30 rounded-3xl p-4 sm:p-5 mb-6 shadow-2xl relative overflow-hidden animate-fadeIn">
      {/* Subtle Warm Amber Halos */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="p-2.5 bg-amber-500/15 text-amber-400 rounded-2xl shrink-0 mt-0.5 border border-amber-500/25">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-extrabold text-sm sm:text-base text-amber-200 tracking-tight flex items-center gap-1.5 flex-wrap">
                <span>Bank Balance Reminder:</span>
                <PrivacyAmount amount={totalAmount} id="banner_urgent_total" className="text-amber-300 font-amount font-extrabold" />
                <span>Required in Bank Account!</span>
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
                  className="flex items-center gap-1.5 px-3 py-1 bg-dark-950/80 hover:bg-dark-900 rounded-xl border border-white/[0.08] text-xs font-semibold text-slate-200 hover:text-white transition-all shadow-sm cursor-pointer"
                >
                  <span className={due.type === 'EMI' ? 'text-purple-400 font-bold' : 'text-cyan-400 font-bold'}>
                    {due.type}:
                  </span>
                  <span className="truncate max-w-[140px]">{due.title}</span>
                  <span className="text-amber-300 font-amount font-bold">
                    (<PrivacyAmount amount={due.amount} id={`due_${due.id}`} />)
                  </span>
                  <span className="text-[10px] text-rose-400 font-bold">[{due.dateLabel}]</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
          <button
            onClick={() => onNavigate(urgentDues[0].type === 'EMI' ? 'emis' : 'sips')}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/25 transition-all active:scale-95 cursor-pointer"
          >
            Review Details <ArrowRight className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={() => setIsDismissed(true)}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/[0.08] rounded-xl transition-all cursor-pointer"
            title="Dismiss alert for this session"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
