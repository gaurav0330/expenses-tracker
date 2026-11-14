import { useState, useMemo } from 'react';
import { X, Building2, Wallet, CreditCard, Landmark, Plus, Edit2, Trash2, Check, ArrowRightLeft, Shield, AlertTriangle } from 'lucide-react';
import { formatINR } from '../lib/utils';
import CustomDropdown from './CustomDropdown';
import toast from 'react-hot-toast';

const ACCOUNT_TYPES = [
  { id: 'savings', label: 'Savings Account', icon: Landmark },
  { id: 'current', label: 'Current Account', icon: Building2 },
  { id: 'cash', label: 'Cash in Hand', icon: Wallet },
  { id: 'credit_card', label: 'Credit Card', icon: CreditCard },
  { id: 'wallet', label: 'Digital Wallet', icon: Wallet },
  { id: 'other', label: 'Other', icon: Landmark }
];

const PRESET_COLORS = [
  { id: 'emerald', label: 'Emerald', bg: 'bg-emerald-500', border: 'border-emerald-500' },
  { id: 'blue', label: 'Blue', bg: 'bg-blue-500', border: 'border-blue-500' },
  { id: 'indigo', label: 'Indigo', bg: 'bg-indigo-500', border: 'border-indigo-500' },
  { id: 'purple', label: 'Purple', bg: 'bg-purple-500', border: 'border-purple-500' },
  { id: 'amber', label: 'Amber', bg: 'bg-amber-500', border: 'border-amber-500' },
  { id: 'rose', label: 'Rose', bg: 'bg-rose-500', border: 'border-rose-500' },
  { id: 'cyan', label: 'Cyan', bg: 'bg-cyan-500', border: 'border-cyan-500' }
];

export default function ManageAccountsModal({
  isOpen,
  onClose,
  accounts = [],
  accountBalances = {},
  categories = [],
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
  onShiftTransactions
}) {
  const [activeTab, setActiveTab] = useState('accounts'); // 'accounts' or 'shift'
  
  // Add Account State
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('savings');
  const [newOpeningBalance, setNewOpeningBalance] = useState('');
  const [newColor, setNewColor] = useState('blue');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Account State
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState('savings');
  const [editOpeningBalance, setEditOpeningBalance] = useState('');
  const [editColor, setEditColor] = useState('blue');

  // Delete Account Confirmation State
  const [deletingAccountId, setDeletingAccountId] = useState(null);
  const [migrationTargetId, setMigrationTargetId] = useState('');

  // Shift Transactions State
  const [shiftFromId, setShiftFromId] = useState(accounts[0]?.id || '');
  const [shiftToId, setShiftToId] = useState(accounts[1]?.id || accounts[0]?.id || '');
  const [shiftCategory, setShiftCategory] = useState('ALL');
  const [isShifting, setIsShifting] = useState(false);

  const accountTypeOptions = useMemo(() => {
    return ACCOUNT_TYPES.map(t => ({
      value: t.id,
      label: t.label,
      icon: t.icon
    }));
  }, []);

  const migrationOptions = useMemo(() => {
    return accounts
      .filter(a => a.id !== deletingAccountId)
      .map(a => ({
        value: a.id,
        label: `Move transactions to: ${a.name}`
      }));
  }, [accounts, deletingAccountId]);

  const shiftFromOptions = useMemo(() => {
    return accounts.map(a => ({ value: a.id, label: `${a.name} (${a.type})` }));
  }, [accounts]);

  const shiftToOptions = useMemo(() => {
    return accounts.filter(a => a.id !== shiftFromId).map(a => ({ value: a.id, label: `${a.name} (${a.type})` }));
  }, [accounts, shiftFromId]);

  const shiftCategoryOptions = useMemo(() => [
    { value: 'ALL', label: 'All Categories (Shift All Transactions)' },
    ...categories.map(c => ({ value: c, label: c }))
  ], [categories]);

  if (!isOpen) return null;

  const handleStartEdit = (acc) => {
    setEditingAccountId(acc.id);
    setEditName(acc.name);
    setEditType(acc.type || 'savings');
    setEditOpeningBalance(acc.openingBalance?.toString() || '0');
    setEditColor(acc.color || 'blue');
  };

  const handleSaveEdit = async (accId) => {
    if (!editName.trim()) {
      toast.error('Account name cannot be empty');
      return;
    }
    try {
      await onUpdateAccount(accId, {
        name: editName.trim(),
        type: editType,
        openingBalance: parseFloat(editOpeningBalance) || 0,
        color: editColor
      });
      toast.success('Account updated successfully!');
      setEditingAccountId(null);
    } catch {
      toast.error('Failed to update account');
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      toast.error('Please enter an account name');
      return;
    }
    setIsSubmitting(true);
    try {
      await onAddAccount({
        name: newName.trim(),
        type: newType,
        openingBalance: parseFloat(newOpeningBalance) || 0,
        color: newColor
      });
      toast.success(`Account "${newName.trim()}" created!`);
      setNewName('');
      setNewOpeningBalance('');
      setIsAddingNew(false);
    } catch {
      toast.error('Failed to create account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deletingAccountId) return;
    try {
      await onDeleteAccount(deletingAccountId, migrationTargetId || null);
      toast.success('Account deleted successfully');
      setDeletingAccountId(null);
      setMigrationTargetId('');
    } catch (err) {
      toast.error(err.message || 'Failed to delete account');
    }
  };

  const handleShiftSubmit = async (e) => {
    e.preventDefault();
    if (!shiftFromId || !shiftToId) {
      toast.error('Select both source and destination accounts');
      return;
    }
    if (shiftFromId === shiftToId) {
      toast.error('Source and destination accounts must be different');
      return;
    }

    setIsShifting(true);
    try {
      const count = await onShiftTransactions(
        shiftFromId, 
        shiftToId, 
        shiftCategory !== 'ALL' ? { category: shiftCategory } : {}
      );
      toast.success(`Successfully shifted ${count} transaction(s)!`);
    } catch {
      toast.error('Failed to shift transactions');
    } finally {
      setIsShifting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="fintech-card border border-white/[0.1] rounded-3xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/[0.06] flex items-center justify-between bg-dark-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 tracking-tight">
                Bank & Cash Accounts Management
              </h2>
              <p className="text-slate-400 text-xs">
                Maintain accurate balances for each bank, wallet & cash
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/[0.08] rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-white/[0.06] bg-dark-950/40 p-2 gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('accounts')}
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'accounts' 
                ? 'bg-slate-800 text-emerald-400 shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            My Accounts ({accounts.length})
          </button>
          <button
            onClick={() => setActiveTab('shift')}
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'shift' 
                ? 'bg-slate-800 text-indigo-400 shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            Shift Past Transactions
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 custom-scrollbar">
          
          {/* TAB 1: ACCOUNTS LIST & CREATION */}
          {activeTab === 'accounts' && (
            <div className="space-y-6">
              
              {/* Account Cards / List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Existing Accounts
                  </h3>
                  {!isAddingNew && (
                    <button
                      type="button"
                      onClick={() => setIsAddingNew(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold border border-emerald-500/30 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add New Bank / Wallet
                    </button>
                  )}
                </div>

                {accounts.map(acc => {
                  const isEditing = editingAccountId === acc.id;
                  const bal = accountBalances[acc.id] ?? (acc.openingBalance || 0);

                  if (isEditing) {
                    return (
                      <div key={acc.id} className="bg-slate-900 border border-slate-700 rounded-2xl p-4 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Account Name</label>
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Account Type</label>
                            <CustomDropdown
                              value={editType}
                              onChange={setEditType}
                              options={accountTypeOptions}
                              placeholder="Select Account Type"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Opening / Starting Balance (₹)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={editOpeningBalance}
                              onChange={(e) => setEditOpeningBalance(e.target.value)}
                              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-amount focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Color Theme</label>
                            <div className="flex gap-2 pt-1">
                              {PRESET_COLORS.map(c => (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => setEditColor(c.id)}
                                  className={`w-6 h-6 rounded-full ${c.bg} transition-all ${editColor === c.id ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : 'opacity-70 hover:opacity-100'}`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                          <button
                            type="button"
                            onClick={() => setEditingAccountId(null)}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(acc.id)}
                            className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
                          >
                            <Check className="w-3.5 h-3.5" /> Save Changes
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={acc.id}
                      className="bg-slate-900/70 hover:bg-slate-900 rounded-2xl p-4 border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 transition-all"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-300">
                          {acc.type === 'cash' ? <Wallet className="w-5 h-5 text-amber-400" /> :
                           acc.type === 'credit_card' ? <CreditCard className="w-5 h-5 text-rose-400" /> :
                           <Building2 className="w-5 h-5 text-emerald-400" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white text-sm sm:text-base">{acc.name}</h4>
                            {acc.isDefault && (
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-extrabold px-2 py-0.5 rounded-md border border-emerald-500/30">
                                Default
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                            <span className="capitalize">{acc.type}</span>
                            <span>•</span>
                            <span>Opening: <span className="font-amount">{formatINR(acc.openingBalance || 0)}</span></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-xs text-slate-400 block">Current Balance</span>
                          <span className={`text-base font-bold font-amount ${bal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {formatINR(bal)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(acc)}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                            title="Edit Account"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          
                          {accounts.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                setDeletingAccountId(acc.id);
                                const other = accounts.find(a => a.id !== acc.id);
                                setMigrationTargetId(other ? other.id : '');
                              }}
                              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                              title="Delete Account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add New Account Form */}
              {isAddingNew && (
                <form onSubmit={handleAddSubmit} className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-5 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                      <Plus className="w-4 h-4" /> Create New Bank Account or Wallet
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsAddingNew(false)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Bank / Account Name
                      </label>
                      <input
                        type="text"
                        required
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="e.g. SBI, HDFC, Cash Wallet, Axis"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Account Type
                      </label>
                      <CustomDropdown
                        value={newType}
                        onChange={setNewType}
                        options={accountTypeOptions}
                        placeholder="Select Account Type"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Current Real Balance / Opening Balance (₹)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={newOpeningBalance}
                        onChange={(e) => setNewOpeningBalance(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white font-amount focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      />
                      <span className="text-[11px] text-slate-500 mt-1 block">
                        What is inside this bank right now today.
                      </span>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Color Theme
                      </label>
                      <div className="flex gap-2 pt-2">
                        {PRESET_COLORS.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setNewColor(c.id)}
                            className={`w-7 h-7 rounded-full ${c.bg} transition-all ${newColor === c.id ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : 'opacity-70 hover:opacity-100'}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingNew(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !newName.trim()}
                      className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-2 shadow-lg disabled:opacity-50"
                    >
                      {isSubmitting ? 'Creating...' : 'Create Account'}
                    </button>
                  </div>
                </form>
              )}

              {/* Delete Modal Confirmation Box */}
              {deletingAccountId && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    Confirm Account Deletion
                  </div>
                  <p className="text-xs text-slate-300">
                    If this account has existing transactions, please select an account to migrate them to:
                  </p>
                  <CustomDropdown
                    value={migrationTargetId}
                    onChange={setMigrationTargetId}
                    options={migrationOptions}
                    placeholder="Select target account"
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setDeletingAccountId(null)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteSubmit}
                      className="px-4 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: SHIFT PAST TRANSACTIONS (BATCH MIGRATION) */}
          {activeTab === 'shift' && (
            <div className="space-y-5">
              <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-4 text-xs text-indigo-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-indigo-200 text-sm">
                  <Shield className="w-4 h-4 text-indigo-400" /> Batch Reassign Historical Transactions
                </div>
                <p className="text-slate-300">
                  Did you pay for some past expenses with your newly created bank or cash wallet? 
                  Use this tool to safely shift past transactions to the correct account in 1 click!
                </p>
              </div>

              <form onSubmit={handleShiftSubmit} className="space-y-4 bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Shift From (Source Account)
                    </label>
                    <CustomDropdown
                      value={shiftFromId}
                      onChange={setShiftFromId}
                      options={shiftFromOptions}
                      placeholder="Select Source Account"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Shift To (Target Account)
                    </label>
                    <CustomDropdown
                      value={shiftToId}
                      onChange={setShiftToId}
                      options={shiftToOptions}
                      placeholder="Select Target Account"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Filter by Category (Optional)
                  </label>
                  <CustomDropdown
                    value={shiftCategory}
                    onChange={setShiftCategory}
                    options={shiftCategoryOptions}
                    placeholder="All Categories"
                    searchable={shiftCategoryOptions.length > 6}
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    e.g. Choose &quot;Food &amp; Dining&quot; to only move lunch/dinner records, or &quot;All Categories&quot; to move everything.
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isShifting || shiftFromId === shiftToId}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isShifting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <ArrowRightLeft className="w-4 h-4" />
                        Execute Batch Shift
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

