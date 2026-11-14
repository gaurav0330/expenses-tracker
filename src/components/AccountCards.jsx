import { Landmark, Building2, Wallet, CreditCard, ArrowRightLeft, Settings, Check, Plus, Layers, FilterX } from 'lucide-react';
import { usePrivacy } from '../hooks/usePrivacy';
import { PrivacyAmount } from '../context/PrivacyContext';

export default function AccountCards({
  accounts = [],
  accountBalances = {},
  selectedAccountId = 'ALL',
  onSelectAccount,
  onOpenTransfer,
  onOpenManage
}) {
  const { isMoneyHidden, toggleRevealKey } = usePrivacy();

  const totalCombined = accounts.reduce((sum, acc) => {
    return sum + (accountBalances[acc.id] ?? (Number(acc.openingBalance) || 0));
  }, 0);

  const selectedAccountObj = accounts.find(a => a.id === selectedAccountId);

  const getAccountIcon = (type) => {
    switch (type) {
      case 'cash':
        return <Wallet className="w-4 h-4 text-amber-400" />;
      case 'credit_card':
        return <CreditCard className="w-4 h-4 text-rose-400" />;
      case 'current':
        return <Building2 className="w-4 h-4 text-blue-400" />;
      default:
        return <Landmark className="w-4 h-4 text-emerald-400" />;
    }
  };

  const getCardStyle = (color, isSelected) => {
    const selectedRing = isSelected 
      ? 'ring-2 ring-emerald-400 shadow-xl shadow-emerald-500/20 border-emerald-400/90 scale-[1.02]' 
      : 'border-slate-800/80 hover:border-slate-700 hover:scale-[1.01]';

    switch (color) {
      case 'blue':
        return `bg-gradient-to-br from-blue-950/50 via-[#0F172A] to-[#0B1324] border-t-[rgba(255,255,255,0.14)] ${selectedRing}`;
      case 'indigo':
        return `bg-gradient-to-br from-indigo-950/50 via-[#0F172A] to-[#0B1324] border-t-[rgba(255,255,255,0.14)] ${selectedRing}`;
      case 'purple':
        return `bg-gradient-to-br from-purple-950/50 via-[#0F172A] to-[#0B1324] border-t-[rgba(255,255,255,0.14)] ${selectedRing}`;
      case 'amber':
        return `bg-gradient-to-br from-amber-950/50 via-[#0F172A] to-[#0B1324] border-t-[rgba(255,255,255,0.14)] ${selectedRing}`;
      case 'rose':
        return `bg-gradient-to-br from-rose-950/50 via-[#0F172A] to-[#0B1324] border-t-[rgba(255,255,255,0.14)] ${selectedRing}`;
      case 'cyan':
        return `bg-gradient-to-br from-cyan-950/50 via-[#0F172A] to-[#0B1324] border-t-[rgba(255,255,255,0.14)] ${selectedRing}`;
      default:
        return `bg-gradient-to-br from-emerald-950/50 via-[#0F172A] to-[#0B1324] border-t-[rgba(255,255,255,0.14)] ${selectedRing}`;
    }
  };

  return (
    <div className="space-y-3.5 mb-7">
      
      {/* Liquid Net Worth Hero Bar (Apple Wallet / Revolut Style) */}
      <div className="fintech-card rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-emerald-500/5 to-transparent pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          
          {/* Net Worth Figure */}
          <div 
            onClick={() => isMoneyHidden && toggleRevealKey('hero_liquid_wealth')}
            className={`flex flex-col ${isMoneyHidden ? 'cursor-pointer' : ''}`}
            title={isMoneyHidden ? "Click to peek Net Liquid Balance" : undefined}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-1 bg-emerald-500/10 text-emerald-400 rounded-md">
                <Layers className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Total Net Liquid Wealth
              </span>
              {selectedAccountId !== 'ALL' && (
                <span className="text-[10px] font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                  Filtered: {selectedAccountObj?.name || 'Account'}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectAccount('ALL');
                    }}
                    className="hover:text-white ml-0.5"
                    title="Clear filter"
                  >
                    <FilterX className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>

            <div className="text-3xl sm:text-4xl font-extrabold font-amount tracking-tight">
              <PrivacyAmount 
                amount={selectedAccountId === 'ALL' ? totalCombined : (accountBalances[selectedAccountId] ?? selectedAccountObj?.openingBalance ?? 0)} 
                id="hero_liquid_wealth" 
                className={totalCombined >= 0 ? 'text-white' : 'text-rose-400'} 
              />
            </div>

            <p className="text-xs text-slate-400 mt-1 font-medium">
              {selectedAccountId === 'ALL' 
                ? `Synchronized across all ${accounts.length} bank accounts & cash wallets`
                : `Showing balance & transactions for ${selectedAccountObj?.name}`
              }
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
            {accounts.length > 1 && (
              <button
                type="button"
                onClick={onOpenTransfer}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 hover:text-white rounded-2xl text-xs font-bold border border-indigo-500/30 transition-all shadow-md active:scale-95 cursor-pointer"
                title="Shift money between bank accounts"
              >
                <ArrowRightLeft className="w-4 h-4 text-indigo-400" />
                <span>Shift / Transfer</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenManage}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white rounded-2xl text-xs font-bold border border-slate-700/60 transition-all shadow-md active:scale-95 cursor-pointer"
              title="Manage Bank Accounts, Rename & Batch Migrate"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Manage Accounts</span>
            </button>
          </div>

        </div>
      </div>

      {/* Cards Deck Carousel / Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3.5">
        
        {/* Card 0: "All Combined" Master Filter */}
        <button
          type="button"
          onClick={() => onSelectAccount('ALL')}
          className={`text-left p-3.5 sm:p-4 rounded-3xl border transition-all duration-200 flex flex-col justify-between shadow-lg relative overflow-hidden group cursor-pointer ${
            selectedAccountId === 'ALL'
              ? 'bg-slate-800/90 border-emerald-400/80 ring-2 ring-emerald-400 shadow-xl shadow-emerald-500/10 scale-[1.02]'
              : 'fintech-card border-white/[0.08] hover:border-white/[0.15] hover:scale-[1.01]'
          }`}
        >
          <div className="flex items-center justify-between w-full mb-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              All Accounts
            </span>
            {selectedAccountId === 'ALL' && (
              <span className="p-1 bg-emerald-500/20 text-emerald-400 rounded-full">
                <Check className="w-3 h-3" />
              </span>
            )}
          </div>
          <div>
            <div className="text-sm sm:text-base lg:text-lg font-extrabold font-amount tracking-tight truncate">
              <PrivacyAmount 
                amount={totalCombined} 
                id="acc_all_combined" 
                className={totalCombined >= 0 ? 'text-emerald-400' : 'text-rose-400'} 
              />
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-400 block mt-1 font-medium">
              {accounts.length} linked accounts
            </span>
          </div>
        </button>

        {/* Individual Bank Account Cards */}
        {accounts.map(acc => {
          const isSelected = selectedAccountId === acc.id;
          const bal = accountBalances[acc.id] ?? (Number(acc.openingBalance) || 0);

          return (
            <button
              key={acc.id}
              type="button"
              onClick={() => {
                if (isMoneyHidden) {
                  toggleRevealKey(`acc_${acc.id}`);
                }
                onSelectAccount(isSelected ? 'ALL' : acc.id);
              }}
              className={`text-left p-3.5 sm:p-4 rounded-3xl border transition-all duration-200 flex flex-col justify-between shadow-lg relative overflow-hidden group cursor-pointer ${getCardStyle(acc.color, isSelected)}`}
              title={isMoneyHidden ? `Click to peek ${acc.name} balance & filter` : `Filter by ${acc.name}`}
            >
              <div className="flex items-start justify-between w-full mb-2.5">
                <div className="p-1.5 sm:p-2 bg-slate-900/90 rounded-2xl border border-slate-700/60 shadow-inner">
                  {getAccountIcon(acc.type)}
                </div>
                {isSelected ? (
                  <span className="p-1 bg-emerald-500/20 text-emerald-400 rounded-full">
                    <Check className="w-3 h-3" />
                  </span>
                ) : acc.isDefault ? (
                  <span className="text-[8px] sm:text-[9px] font-extrabold bg-slate-800/90 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded uppercase tracking-wider">
                    Main
                  </span>
                ) : (
                  <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">
                    {acc.type}
                  </span>
                )}
              </div>

              <div>
                <h4 className="font-bold text-white text-xs sm:text-sm truncate" title={acc.name}>
                  {acc.name}
                </h4>
                <div className="text-sm sm:text-base lg:text-lg font-extrabold font-amount tracking-tight mt-0.5 truncate">
                  <PrivacyAmount 
                    amount={bal} 
                    id={`acc_${acc.id}`} 
                    className={bal >= 0 ? 'text-slate-100' : 'text-rose-400'} 
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 capitalize mt-1 font-medium">
                  <span className="truncate">{acc.type.replace('_', ' ')}</span>
                  {isSelected && <span className="text-emerald-400 font-extrabold">Active</span>}
                </div>
              </div>
            </button>
          );
        })}

        {/* Quick Add Bank Card */}
        <button
          type="button"
          onClick={onOpenManage}
          className="p-3.5 sm:p-4 rounded-3xl border border-dashed border-white/[0.1] hover:border-emerald-500/40 bg-white/[0.02] hover:bg-white/[0.04] transition-all flex flex-col items-center justify-center text-center gap-1.5 group text-slate-400 hover:text-emerald-400 cursor-pointer"
          title="Add another bank account or cash wallet"
        >
          <div className="p-2 rounded-2xl bg-slate-800/80 group-hover:bg-emerald-500/10 transition-colors">
            <Plus className="w-4 h-4 text-slate-400 group-hover:text-emerald-400" />
          </div>
          <span className="text-xs font-bold">+ Add Bank</span>
        </button>

      </div>
    </div>
  );
}
