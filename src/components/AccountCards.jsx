import { Landmark, Building2, Wallet, CreditCard, ArrowRightLeft, Settings, Check, Plus } from 'lucide-react';
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

  const getAccountIcon = (type) => {
    switch (type) {
      case 'cash':
        return <Wallet className="w-5 h-5 text-amber-400" />;
      case 'credit_card':
        return <CreditCard className="w-5 h-5 text-rose-400" />;
      case 'current':
        return <Building2 className="w-5 h-5 text-blue-400" />;
      default:
        return <Landmark className="w-5 h-5 text-emerald-400" />;
    }
  };

  const getCardGradient = (color, isSelected) => {
    const baseSelected = isSelected 
      ? 'ring-2 ring-emerald-400 shadow-emerald-500/10' 
      : 'border-slate-800/80 hover:border-slate-700';

    switch (color) {
      case 'blue':
        return `bg-gradient-to-br from-blue-950/40 via-[#111827] to-[#111827] ${baseSelected}`;
      case 'indigo':
        return `bg-gradient-to-br from-indigo-950/40 via-[#111827] to-[#111827] ${baseSelected}`;
      case 'purple':
        return `bg-gradient-to-br from-purple-950/40 via-[#111827] to-[#111827] ${baseSelected}`;
      case 'amber':
        return `bg-gradient-to-br from-amber-950/40 via-[#111827] to-[#111827] ${baseSelected}`;
      case 'rose':
        return `bg-gradient-to-br from-rose-950/40 via-[#111827] to-[#111827] ${baseSelected}`;
      case 'cyan':
        return `bg-gradient-to-br from-cyan-950/40 via-[#111827] to-[#111827] ${baseSelected}`;
      default:
        return `bg-gradient-to-br from-emerald-950/40 via-[#111827] to-[#111827] ${baseSelected}`;
    }
  };

  return (
    <div className="space-y-3 mb-6">
      
      {/* Bar Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-200">Bank & Cash Accounts</h3>
            <p className="text-[11px] text-slate-400">Click any account to filter transactions</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {accounts.length > 1 && (
            <button
              type="button"
              onClick={onOpenTransfer}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 hover:text-indigo-200 rounded-xl text-xs font-bold border border-indigo-500/30 transition-all shadow-sm active:scale-95"
              title="Shift money between bank accounts"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Shift / Transfer</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenManage}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700/60 transition-all shadow-sm active:scale-95"
            title="Manage Accounts & Batch Migrate"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span>Manage Accounts</span>
          </button>
        </div>
      </div>

      {/* Accounts Carousel / Grid */}
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3">
        
        {/* Card 0: "All Accounts" Combined Total */}
        <button
          type="button"
          onClick={() => onSelectAccount('ALL')}
          className={`text-left p-3 sm:p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between shadow-lg relative overflow-hidden group ${
            selectedAccountId === 'ALL'
              ? 'bg-slate-800 border-emerald-500/60 ring-2 ring-emerald-500/30'
              : 'bg-[#111827] border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between w-full mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              All Combined
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
            <span className="text-[11px] text-slate-400 block mt-0.5">
              {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'} total
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
              className={`text-left p-3 sm:p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between shadow-lg relative overflow-hidden group ${getCardGradient(acc.color, isSelected)}`}
              title={isMoneyHidden ? `Click to peek ${acc.name} balance & filter` : undefined}
            >
              <div className="flex items-start justify-between w-full mb-2">
                <div className="p-1.5 sm:p-2 bg-slate-900/80 rounded-xl border border-slate-700/60 shadow-inner">
                  {getAccountIcon(acc.type)}
                </div>
                {isSelected ? (
                  <span className="p-1 bg-emerald-500/20 text-emerald-400 rounded-full">
                    <Check className="w-3 h-3" />
                  </span>
                ) : acc.isDefault ? (
                  <span className="text-[9px] font-extrabold bg-slate-800/90 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700/60 uppercase">
                    Main
                  </span>
                ) : null}
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
                <div className="flex items-center justify-between text-[10px] text-slate-400 capitalize mt-1">
                  <span>{acc.type}</span>
                  {isSelected && <span className="text-emerald-400 font-bold">Filtered</span>}
                </div>
              </div>
            </button>
          );
        })}

        {/* Quick Add Card */}
        <button
          type="button"
          onClick={onOpenManage}
          className="p-3.5 sm:p-4 rounded-2xl border border-dashed border-slate-800 hover:border-emerald-500/40 bg-slate-900/30 hover:bg-slate-900/60 transition-all flex flex-col items-center justify-center text-center gap-1.5 group text-slate-400 hover:text-emerald-400"
          title="Add another bank account or cash wallet"
        >
          <div className="p-2 rounded-xl bg-slate-800 group-hover:bg-emerald-500/10 transition-colors">
            <Plus className="w-4 h-4 text-slate-400 group-hover:text-emerald-400" />
          </div>
          <span className="text-xs font-bold">+ Add Bank</span>
        </button>

      </div>
    </div>
  );
}

