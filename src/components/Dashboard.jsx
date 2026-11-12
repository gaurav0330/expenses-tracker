import { useState, useEffect, useCallback } from 'react';
import { addMonths, subMonths, format, isSameMonth } from 'date-fns';
import { ChevronLeft, ChevronRight, LayoutDashboard, LogOut, Wallet, Users, TrendingUp, PieChart, NotebookPen, Calendar, Fuel, CreditCard, Eye, EyeOff } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { usePrivacy } from '../hooks/usePrivacy';
import toast from 'react-hot-toast';

import MonthlySummary from './MonthlySummary';
import AddTransaction from './AddTransaction';
import TransactionList from './TransactionList';
import LendingTab from './LendingTab';
import SipTab from './SipTab';
import AnalyticsTab from './AnalyticsTab';
import PocketNotesTab from './PocketNotesTab';
import PetrolTab from './PetrolTab';
import EmiTab from './EmiTab';
import ProfileModal from './ProfileModal';
import AccountCards from './AccountCards';
import TransferModal from './TransferModal';
import ManageAccountsModal from './ManageAccountsModal';
import { NotificationBell, UrgentDuesBanner } from './UpcomingDuesNotification';
import { useUpcomingDues } from '../hooks/useUpcomingDues';

import { 
  addTransaction, 
  getTransactionsForMonth, 
  deleteTransaction, 
  getUserCategories, 
  addUserCategory, 
  getBudgetGoal, 
  setBudgetGoal,
  getUserAccounts,
  addBankAccount,
  updateBankAccount,
  deleteBankAccount,
  shiftTransactions,
  addTransfer
} from '../lib/expenseService';

export default function Dashboard({ user }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('overview');
  const [previousBalance, setPreviousBalance] = useState(0); // overview, lending, sips
  const [budgetGoal, setBudgetGoalState] = useState(0);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Bank Accounts & Transfers State
  const [accounts, setAccounts] = useState([]);
  const [accountBalances, setAccountBalances] = useState({});
  const [selectedAccountFilter, setSelectedAccountFilter] = useState('ALL');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isManageAccountsOpen, setIsManageAccountsOpen] = useState(false);
  const { isMoneyHidden, toggleGlobalPrivacy } = usePrivacy();

  const [transactions, setTransactions] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState(null);

  const { upcomingDues, urgentDues, totalUrgentAmount } = useUpcomingDues(user);

  const fetchTransactionsAndCategories = useCallback(async (date) => {
    setIsLoading(true);
    setError(null);
    try {
      const userAccounts = await getUserAccounts(user.uid);
      setAccounts(userAccounts);

      const { transactions, previousBalance, allTimeBalances } = await getTransactionsForMonth(user.uid, date, userAccounts);
      setTransactions(transactions);
      setPreviousBalance(previousBalance);
      setAccountBalances(allTimeBalances || {});
      
      const categories = await getUserCategories(user.uid);
      setCustomCategories(categories);

      const goal = await getBudgetGoal(user.uid);
      setBudgetGoalState(goal);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch data. Make sure Firestore is configured properly.");
    } finally {
      setIsLoading(false);
    }
  }, [user.uid]);

  useEffect(() => {
    fetchTransactionsAndCategories(currentDate);
  }, [currentDate, fetchTransactionsAndCategories]);

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handleJumpToCurrentMonth = () => setCurrentDate(new Date());

  const handleSaveBudgetGoal = async (newGoal) => {
    try {
      await setBudgetGoal(user.uid, newGoal);
      setBudgetGoalState(newGoal);
      toast.success('Monthly budget updated!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update budget');
    }
  };

  const handleAddCustomCategory = async (categoryName) => {
    try {
      await addUserCategory(user.uid, categoryName);
      setCustomCategories(prev => [...prev, categoryName]);
      toast.success('Category added');
    } catch (err) {
      console.error(err);
      toast.error("Failed to add category.");
    }
  };

  const handleAddTransaction = async (transactionData) => {
    setIsAdding(true);
    try {
      const newId = await addTransaction(user.uid, transactionData);
      await fetchTransactionsAndCategories(currentDate);
      return newId;
    } catch (err) {
      console.error(err);
      toast.error("Failed to add transaction.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddTransfer = async (transferData) => {
    setIsAdding(true);
    try {
      const newId = await addTransfer(user.uid, transferData);
      await fetchTransactionsAndCategories(currentDate);
      return newId;
    } catch (err) {
      console.error(err);
      toast.error("Failed to execute transfer.");
      throw err;
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddBankAccount = async (accountData) => {
    try {
      const newAcc = await addBankAccount(user.uid, accountData);
      await fetchTransactionsAndCategories(currentDate);
      return newAcc;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleUpdateBankAccount = async (accId, updatedFields) => {
    try {
      const updated = await updateBankAccount(user.uid, accId, updatedFields);
      await fetchTransactionsAndCategories(currentDate);
      return updated;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleDeleteBankAccount = async (accId, targetMigrationId) => {
    try {
      const remaining = await deleteBankAccount(user.uid, accId, targetMigrationId);
      if (selectedAccountFilter === accId) {
        setSelectedAccountFilter('ALL');
      }
      await fetchTransactionsAndCategories(currentDate);
      return remaining;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleShiftTransactions = async (fromId, toId, options) => {
    try {
      const count = await shiftTransactions(user.uid, fromId, toId, options);
      await fetchTransactionsAndCategories(currentDate);
      return count;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleDeleteTransaction = async (id) => {
    try {
      await deleteTransaction(id);
      await fetchTransactionsAndCategories(currentDate);
      toast.success('Transaction deleted');
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete transaction.");
    }
  };

  const handleTogglePrivacy = () => {
    toggleGlobalPrivacy();
  };

  const handleSignOut = () => {
    signOut(auth);
  };

  return (
    <div className="min-h-screen text-slate-100 selection:bg-emerald-500/30">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-4 sm:py-8">
        
        <header className="flex flex-col xl:flex-row xl:items-center justify-between mb-6 sm:mb-8 gap-4 xl:gap-6 bg-[#111827] p-4 sm:p-5 rounded-3xl border border-slate-800 shadow-2xl">
          <div className="flex items-center justify-between w-full xl:w-auto shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25 shrink-0">
                <LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-extrabold text-white tracking-tight">ExpenseTracker</h1>
                <p className="text-slate-400 text-xs sm:text-sm font-medium">Intelligent Money & Asset Management</p>
              </div>
            </div>
            
            {/* Mobile / Tablet Controls */}
            <div className="flex xl:hidden items-center gap-2">
              <button
                onClick={handleTogglePrivacy}
                className={`p-2 rounded-xl border transition-all ${
                  isMoneyHidden 
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-400' 
                    : 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:text-white'
                }`}
                title={isMoneyHidden ? "Show balances (Privacy Mode active)" : "Hide balances (Privacy Mode: ****)"}
              >
                {isMoneyHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>

              <NotificationBell 
                upcomingDues={upcomingDues} 
                urgentDues={urgentDues} 
                totalUrgentAmount={totalUrgentAmount} 
                onNavigateTab={setActiveTab} 
              />

              <button
                onClick={() => setIsProfileOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700/60 transition-all font-bold text-xs shadow-md"
                title="View Profile & Financial Summary"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center font-extrabold text-[10px]">
                  {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-extrabold px-1.5 py-0.5 rounded-md">
                  Profile
                </span>
              </button>

              <button
                onClick={handleSignOut}
                className="p-2 bg-slate-800/80 hover:bg-rose-500/10 text-slate-300 hover:text-rose-400 rounded-xl border border-slate-700/60 transition-all shrink-0"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3 w-full xl:w-auto min-w-0">
            {/* Tab Navigation */}
            <div className="flex w-full xl:w-auto bg-slate-900/90 rounded-2xl p-1.5 border border-slate-800/80 shadow-inner overflow-x-auto custom-scrollbar shrink min-w-0">
              <button 
                onClick={() => setActiveTab('overview')}
                className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap shrink-0 ${
                  activeTab === 'overview' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Overview
              </button>
              <button 
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap shrink-0 ${
                  activeTab === 'analytics' ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/20' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <PieChart className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Analytics
              </button>
              <button 
                onClick={() => setActiveTab('lending')}
                className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap shrink-0 ${
                  activeTab === 'lending' ? 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Lending
              </button>
              <button 
                onClick={() => setActiveTab('sips')}
                className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap shrink-0 ${
                  activeTab === 'sips' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> SIPs
              </button>
              <button 
                onClick={() => setActiveTab('pocket')}
                className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap shrink-0 ${
                  activeTab === 'pocket' ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <NotebookPen className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Pocket Notes
              </button>
              <button 
                onClick={() => setActiveTab('petrol')}
                className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap shrink-0 ${
                  activeTab === 'petrol' ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/20' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Fuel className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Fuel & Mileage
              </button>
              <button 
                onClick={() => setActiveTab('emis')}
                className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap shrink-0 ${
                  activeTab === 'emis' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/20' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> EMI Tracker
              </button>
            </div>

            {/* Desktop User Profile, Reminders & Sign Out Buttons */}
            <div className="hidden xl:flex items-center gap-2 shrink-0">
              <button
                onClick={handleTogglePrivacy}
                className={`p-2.5 rounded-2xl border transition-all shadow-md flex items-center justify-center ${
                  isMoneyHidden 
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 hover:bg-amber-500/25 ring-1 ring-amber-500/30' 
                    : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title={isMoneyHidden ? "Show balances (Privacy Mode active)" : "Hide balances (Privacy Mode: ****)"}
              >
                {isMoneyHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>

              <NotificationBell 
                upcomingDues={upcomingDues} 
                urgentDues={urgentDues} 
                totalUrgentAmount={totalUrgentAmount} 
                onNavigateTab={setActiveTab} 
              />

              <button
                onClick={() => setIsProfileOpen(true)}
                className="flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 rounded-2xl border border-slate-800 hover:border-emerald-500/40 transition-all font-bold text-xs shadow-md whitespace-nowrap"
                title="View Complete Financial Summary & Profile"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-extrabold text-xs shrink-0">
                  {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="truncate max-w-[100px]">{user?.email?.split('@')[0]}</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-extrabold px-2 py-0.5 rounded-md border border-emerald-500/20">
                  Profile
                </span>
              </button>

              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-900/90 hover:bg-rose-500/10 text-slate-300 hover:text-rose-400 rounded-2xl border border-slate-800 hover:border-rose-500/40 transition-all font-bold text-xs shrink-0 whitespace-nowrap"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </header>

        {/* Urgent Dues Bank Balance Alert Banner */}
        <UrgentDuesBanner 
          urgentDues={urgentDues} 
          totalAmount={totalUrgentAmount} 
          onNavigate={setActiveTab} 
        />

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-8 text-red-400 font-medium">
            {error}
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
            <div className="flex flex-wrap items-center justify-between mb-6 gap-3">
              <h2 className="text-xl font-bold">Monthly Overview</h2>
              {/* Month Selector */}
              <div className="flex items-center gap-2">
                {!isSameMonth(currentDate, new Date()) && (
                  <button
                    onClick={handleJumpToCurrentMonth}
                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl border border-emerald-500/30 transition-all shadow-sm"
                    title="Jump to Current Month"
                  >
                    <Calendar className="w-3.5 h-3.5" /> Today
                  </button>
                )}
                <div className="flex items-center bg-slate-900/90 rounded-2xl p-1 border border-slate-800 shadow-inner">
                  <button 
                    onClick={handlePrevMonth}
                    className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="w-32 text-center font-semibold text-xs sm:text-sm text-slate-200">
                    {format(currentDate, 'MMMM yyyy')}
                  </span>
                  <button 
                    onClick={handleNextMonth}
                    className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <MonthlySummary 
              transactions={transactions} 
              currentDate={currentDate} 
              previousBalance={previousBalance}
              budgetGoal={budgetGoal}
              onSaveBudgetGoal={handleSaveBudgetGoal}
              accounts={accounts}
              accountBalances={accountBalances}
            />

            <AccountCards 
              accounts={accounts}
              accountBalances={accountBalances}
              selectedAccountId={selectedAccountFilter}
              onSelectAccount={setSelectedAccountFilter}
              onOpenTransfer={() => setIsTransferModalOpen(true)}
              onOpenManage={() => setIsManageAccountsOpen(true)}
            />

            {(() => {
              const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
              const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
              
              const totalCombinedBalance = accounts.length > 0 
                ? accounts.reduce((sum, acc) => sum + (accountBalances[acc.id] ?? (Number(acc.openingBalance) || 0)), 0)
                : (previousBalance + totalIncome - totalExpense);

              const displayedBalance = selectedAccountFilter === 'ALL'
                ? totalCombinedBalance
                : (accountBalances[selectedAccountFilter] ?? (Number(accounts.find(a => a.id === selectedAccountFilter)?.openingBalance) || 0));

              return (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                  <div className="lg:col-span-1">
                    <AddTransaction 
                      onAddTransaction={handleAddTransaction} 
                      onAddTransfer={handleAddTransfer}
                      isLoading={isAdding} 
                      customCategories={customCategories}
                      onAddCustomCategory={handleAddCustomCategory}
                      currentDate={currentDate}
                      accounts={accounts}
                      accountBalances={accountBalances}
                      onOpenManageAccounts={() => setIsManageAccountsOpen(true)}
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <TransactionList 
                      transactions={transactions} 
                      onDeleteTransaction={handleDeleteTransaction}
                      isLoading={isLoading}
                      currentBalance={displayedBalance}
                      previousBalance={previousBalance}
                      accounts={accounts}
                      selectedAccountFilter={selectedAccountFilter}
                      onSelectAccountFilter={setSelectedAccountFilter}
                    />
                  </div>
                </div>
              );
            })()}
          </>
        )}

        {activeTab === 'analytics' && <AnalyticsTab transactions={transactions} currentDate={currentDate} />}
        {activeTab === 'lending' && <LendingTab user={user} />}
        {activeTab === 'sips' && <SipTab user={user} />}
        {activeTab === 'pocket' && <PocketNotesTab user={user} />}
        {activeTab === 'petrol' && <PetrolTab user={user} onSyncExpense={handleAddTransaction} onDeleteExpense={handleDeleteTransaction} />}
        {activeTab === 'emis' && <EmiTab user={user} currentDate={currentDate} onTransactionAdded={() => fetchTransactionsAndCategories(currentDate)} />}

        {/* User Profile & Financial Portfolio Modal */}
        <ProfileModal
          user={user}
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
        />

        {/* Shift / Transfer Funds Modal */}
        <TransferModal
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          accounts={accounts}
          accountBalances={accountBalances}
          onTransfer={handleAddTransfer}
        />

        {/* Manage Bank Accounts & Batch Shift Modal */}
        <ManageAccountsModal
          isOpen={isManageAccountsOpen}
          onClose={() => setIsManageAccountsOpen(false)}
          accounts={accounts}
          accountBalances={accountBalances}
          categories={customCategories}
          onAddAccount={handleAddBankAccount}
          onUpdateAccount={handleUpdateBankAccount}
          onDeleteAccount={handleDeleteBankAccount}
          onShiftTransactions={handleShiftTransactions}
        />

      </div>
    </div>
  );
}
