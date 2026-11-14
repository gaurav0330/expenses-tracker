import { useState, useEffect, useCallback } from 'react';
import { addMonths, subMonths, format, isSameMonth } from 'date-fns';
import { ChevronLeft, ChevronRight, LogOut, Wallet, Users, TrendingUp, PieChart, NotebookPen, Calendar, Fuel, CreditCard, Eye, EyeOff, ArrowRightLeft, Repeat, Activity } from 'lucide-react';
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
import SubscriptionsTab from './SubscriptionsTab';
import ProfileModal from './ProfileModal';
import AccountCards from './AccountCards';
import TransferModal from './TransferModal';
import ManageAccountsModal from './ManageAccountsModal';
import CashflowForecastModal from './CashflowForecastModal';
import Logo from './Logo';
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
  const [previousBalance, setPreviousBalance] = useState(0);
  const [budgetGoal, setBudgetGoalState] = useState(0);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Bank Accounts & Transfers State
  const [accounts, setAccounts] = useState([]);
  const [accountBalances, setAccountBalances] = useState({});
  const [selectedAccountFilter, setSelectedAccountFilter] = useState('ALL');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isManageAccountsOpen, setIsManageAccountsOpen] = useState(false);
  const [isForecastOpen, setIsForecastOpen] = useState(false);
  const { isMoneyHidden, toggleGlobalPrivacy } = usePrivacy();

  const [transactions, setTransactions] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState(null);

  const { upcomingDues, urgentDues, totalUrgentAmount, rawEmis, rawSips, rawSubs } = useUpcomingDues(user);

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
      await updateBankAccount(accId, updatedFields);
      await fetchTransactionsAndCategories(currentDate);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleDeleteBankAccount = async (accId) => {
    try {
      await deleteBankAccount(accId);
      await fetchTransactionsAndCategories(currentDate);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleShiftTransactions = async (fromAccId, toAccId, filterOptions) => {
    try {
      const count = await shiftTransactions(user.uid, fromAccId, toAccId, filterOptions);
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

  const navTabs = [
    { id: 'overview', label: 'Overview', icon: Wallet, color: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/20' },
    { id: 'analytics', label: 'Analytics', icon: PieChart, color: 'from-purple-500 to-indigo-600', shadow: 'shadow-purple-500/20' },
    { id: 'subscriptions', label: 'Subscriptions', icon: Repeat, color: 'from-cyan-500 to-blue-600', shadow: 'shadow-cyan-500/20' },
    { id: 'emis', label: 'EMI & Loans', icon: CreditCard, color: 'from-pink-600 to-rose-600', shadow: 'shadow-pink-600/20' },
    { id: 'sips', label: 'SIPs & Wealth', icon: TrendingUp, color: 'from-teal-500 to-emerald-600', shadow: 'shadow-teal-500/20' },
    { id: 'petrol', label: 'Fuel & Mileage', icon: Fuel, color: 'from-orange-500 to-amber-600', shadow: 'shadow-orange-500/20' },
    { id: 'lending', label: 'Lending & Debts', icon: Users, color: 'from-indigo-500 to-blue-600', shadow: 'shadow-indigo-500/20' },
    { id: 'pocket', label: 'Pocket Notes', icon: NotebookPen, color: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/20' },
  ];

  return (
    <div className="min-h-screen text-slate-100 selection:bg-emerald-500/30 overflow-x-hidden">
      
      {/* 1. Global FinTech Frosted Topbar */}
      <header className="sticky top-0 z-40 backdrop-blur-2xl bg-[#070B16]/90 border-b border-slate-800/80 px-3 sm:px-8 py-3.5 transition-all shadow-2xl">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-3">
          
          {/* Brand Logo & Name */}
          <Logo withText size="md" />

          {/* Central Global Month Navigator (Desktop & Tablet) */}
          <div className="hidden md:flex items-center gap-2">
            {!isSameMonth(currentDate, new Date()) && (
              <button
                onClick={handleJumpToCurrentMonth}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl border border-emerald-500/30 transition-all shadow-sm active:scale-95 cursor-pointer"
                title="Jump to current active month"
              >
                <Calendar className="w-3.5 h-3.5" /> Today
              </button>
            )}
            <div className="flex items-center bg-dark-950/80 rounded-2xl p-1 border border-white/[0.08] shadow-inner">
              <button 
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-white/[0.06] rounded-xl transition-colors text-slate-400 hover:text-white cursor-pointer active:scale-95"
                title="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="w-32 text-center font-extrabold text-xs sm:text-sm text-slate-100 tracking-tight font-sans">
                {format(currentDate, 'MMMM yyyy')}
              </span>
              <button 
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-white/[0.06] rounded-xl transition-colors text-slate-400 hover:text-white cursor-pointer active:scale-95"
                title="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Global Action Cluster */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* 90-Day Forecast CTA */}
            <button
              onClick={() => setIsForecastOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-cyan-500/15 via-blue-500/15 to-transparent hover:from-cyan-500/25 hover:to-blue-500/25 text-cyan-300 hover:text-white rounded-xl sm:rounded-2xl text-xs font-bold border border-cyan-500/30 transition-all shadow-sm active:scale-95 cursor-pointer"
              title="Open 90-Day Cashflow & Low-Balance Forecasting"
            >
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Forecast</span>
            </button>

            {/* Quick Shift CTA */}
            {accounts.length > 1 && (
              <button
                onClick={() => setIsTransferModalOpen(true)}
                className="hidden lg:flex items-center gap-1.5 px-3 py-2 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 hover:text-white rounded-xl sm:rounded-2xl text-xs font-bold border border-indigo-500/30 transition-all shadow-sm active:scale-95 cursor-pointer"
                title="Quick Shift Funds"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Shift Funds</span>
              </button>
            )}

            {/* Privacy Mode Eye Toggle */}
            <button
              onClick={handleTogglePrivacy}
              className={`p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border transition-all cursor-pointer active:scale-95 ${
                isMoneyHidden 
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 ring-1 ring-amber-500/30 shadow-lg shadow-amber-500/10' 
                  : 'bg-dark-950/80 border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.06]'
              }`}
              title={isMoneyHidden ? "Show balances (Privacy Mode active)" : "Hide balances (Privacy Mode: ****)"}
            >
              {isMoneyHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>

            {/* Notification Bell */}
            <NotificationBell 
              upcomingDues={upcomingDues} 
              urgentDues={urgentDues} 
              totalUrgentAmount={totalUrgentAmount} 
              onNavigateTab={setActiveTab} 
            />

            {/* Profile Avatar Button */}
            <button
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 bg-dark-950/80 hover:bg-dark-900 text-slate-200 rounded-xl sm:rounded-2xl border border-white/[0.08] hover:border-emerald-500/40 transition-all font-bold text-xs shadow-md shrink-0 cursor-pointer active:scale-95"
              title="View Complete Financial Summary & Profile"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-extrabold text-xs shrink-0 shadow-sm">
                {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="hidden sm:inline-block truncate max-w-[100px] text-slate-300">
                {user?.email?.split('@')[0]}
              </span>
            </button>

            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              className="p-2 sm:p-2.5 bg-dark-950/80 hover:bg-rose-500/15 text-slate-400 hover:text-rose-400 rounded-xl sm:rounded-2xl border border-white/[0.08] hover:border-rose-500/30 transition-all shrink-0 cursor-pointer active:scale-95"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>

          </div>

        </div>
      </header>

      {/* Main Content Workspace Container */}
      <div className="max-w-[1440px] mx-auto px-3 sm:px-8 py-4 sm:py-6 space-y-6">

        {/* 2. Dedicated Segmented Sub-Navigation Bar */}
        <div className="flex items-center justify-between gap-3 fintech-glass rounded-2xl p-1.5 border border-white/[0.08] shadow-2xl overflow-x-auto custom-scrollbar">
          <div className="flex items-center gap-1 min-w-0">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive 
                      ? `bg-gradient-to-r ${tab.color} text-white shadow-lg ${tab.shadow}` 
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Mobile Month Navigator (Visible only on mobile/tablet) */}
          <div className="flex md:hidden items-center gap-1 shrink-0 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button 
              onClick={handlePrevMonth}
              className="p-1 text-slate-400 hover:text-white"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-bold text-slate-200 px-1 font-amount">
              {format(currentDate, 'MMM yy')}
            </span>
            <button 
              onClick={handleNextMonth}
              className="p-1 text-slate-400 hover:text-white"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Urgent Dues Bank Balance Alert Banner */}
        <UrgentDuesBanner 
          urgentDues={urgentDues} 
          totalAmount={totalUrgentAmount} 
          onNavigate={setActiveTab} 
        />

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-400 font-medium">
            {error}
          </div>
        )}

        {/* Tab Content: OVERVIEW */}
        {activeTab === 'overview' && (
          <>
            {/* Level 1: Liquid Net Worth & Bank Accounts Deck */}
            <AccountCards 
              accounts={accounts}
              accountBalances={accountBalances}
              selectedAccountId={selectedAccountFilter}
              onSelectAccount={setSelectedAccountFilter}
              onOpenTransfer={() => setIsTransferModalOpen(true)}
              onOpenManage={() => setIsManageAccountsOpen(true)}
            />

            {/* Level 2: Cashflow Intelligence & Daily Safe-to-Spend Runway */}
            <MonthlySummary 
              transactions={transactions} 
              currentDate={currentDate} 
              budgetGoal={budgetGoal}
              onSaveBudgetGoal={handleSaveBudgetGoal}
            />

            {/* Level 3: Transaction Studio (Action & Ledger) */}
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
                  
                  {/* Left Column: Quick Record Entry Studio */}
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

                  {/* Right Column: Transaction Ledger & Search */}
                  <div className="lg:col-span-2">
                    <TransactionList 
                      transactions={transactions} 
                      onDeleteTransaction={handleDeleteTransaction}
                      isLoading={isLoading}
                      currentBalance={displayedBalance}
                      previousBalance={previousBalance}
                      accounts={accounts}
                      accountBalances={accountBalances}
                      selectedAccountFilter={selectedAccountFilter}
                      onSelectAccountFilter={setSelectedAccountFilter}
                      user={user}
                      currentDate={currentDate}
                      totalIncome={totalIncome}
                      totalExpense={totalExpense}
                    />
                  </div>

                </div>
              );
            })()}
          </>
        )}

        {/* OTHER APP MODULES */}
        {activeTab === 'analytics' && <AnalyticsTab transactions={transactions} currentDate={currentDate} />}
        {activeTab === 'subscriptions' && (
          <SubscriptionsTab 
            user={user} 
            accounts={accounts} 
            accountBalances={accountBalances} 
            onLogExpense={handleAddTransaction} 
          />
        )}
        {activeTab === 'emis' && <EmiTab user={user} currentDate={currentDate} onTransactionAdded={() => fetchTransactionsAndCategories(currentDate)} />}
        {activeTab === 'sips' && <SipTab user={user} />}
        {activeTab === 'petrol' && <PetrolTab user={user} onSyncExpense={handleAddTransaction} onDeleteExpense={handleDeleteTransaction} />}
        {activeTab === 'lending' && <LendingTab user={user} />}
        {activeTab === 'pocket' && <PocketNotesTab user={user} />}

        {/* MODALS */}
        <ProfileModal
          user={user}
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
        />

        <CashflowForecastModal
          isOpen={isForecastOpen}
          onClose={() => setIsForecastOpen(false)}
          accounts={accounts}
          accountBalances={accountBalances}
          transactions={transactions}
          emis={rawEmis}
          sips={rawSips}
          subscriptions={rawSubs}
        />

        <TransferModal
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          accounts={accounts}
          accountBalances={accountBalances}
          onTransfer={handleAddTransfer}
        />

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
