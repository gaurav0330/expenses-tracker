import { useState, useEffect } from 'react';
import { addMonths, subMonths, format } from 'date-fns';
import { ChevronLeft, ChevronRight, LayoutDashboard, LogOut, Wallet, Users, TrendingUp, PieChart } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import toast from 'react-hot-toast';

import MonthlySummary from './MonthlySummary';
import AddTransaction from './AddTransaction';
import TransactionList from './TransactionList';
import LendingTab from './LendingTab';
import SipTab from './SipTab';
import AnalyticsTab from './AnalyticsTab';

import { addTransaction, getTransactionsForMonth, deleteTransaction, getUserCategories, addUserCategory } from '../lib/expenseService';

export default function Dashboard({ user }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('overview');
  const [previousBalance, setPreviousBalance] = useState(0); // overview, lending, sips
  
  const [transactions, setTransactions] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState(null);

  const fetchTransactionsAndCategories = async (date) => {
    setIsLoading(true);
    setError(null);
    try {
      const { transactions, previousBalance } = await getTransactionsForMonth(user.uid, date);
      setTransactions(transactions);
      setPreviousBalance(previousBalance);
      
      const categories = await getUserCategories(user.uid);
      setCustomCategories(categories);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch data. Make sure Firestore is configured properly.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactionsAndCategories(currentDate);
  }, [currentDate, user.uid]);

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

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
      await addTransaction(user.uid, transactionData);
      const { transactions, previousBalance } = await getTransactionsForMonth(user.uid, currentDate);
      setTransactions(transactions);
      setPreviousBalance(previousBalance);
      // Toast success is handled inside AddTransaction
    } catch (err) {
      console.error(err);
      toast.error("Failed to add transaction.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteTransaction = async (id) => {
    try {
      await deleteTransaction(id);
      setTransactions(transactions.filter(t => t.id !== id));
      toast.success('Transaction deleted');
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete transaction.");
    }
  };

  const handleSignOut = () => {
    signOut(auth);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 selection:bg-emerald-500/30">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-6 sm:mb-8 gap-4 sm:gap-6">
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">ExpenseTracker</h1>
                <p className="text-slate-400 text-xs sm:text-sm font-medium">Manage your money wisely</p>
              </div>
            </div>
            
            {/* Mobile Sign Out Button */}
            <button
              onClick={handleSignOut}
              className="md:hidden flex items-center justify-center w-10 h-10 bg-slate-800 hover:bg-rose-500/10 text-slate-300 hover:text-rose-400 rounded-xl border border-slate-700/50 transition-all shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-wrap md:flex-nowrap items-center gap-4">
            
            {/* Tab Navigation */}
            <div className="flex w-full md:w-auto bg-slate-800 rounded-xl p-1.5 border border-slate-700/50 shadow-inner overflow-x-auto custom-scrollbar">
              <button 
                onClick={() => setActiveTab('overview')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-colors whitespace-nowrap ${activeTab === 'overview' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}`}
              >
                <Wallet className="w-4 h-4" /> Overview
              </button>
              <button 
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-colors whitespace-nowrap ${activeTab === 'analytics' ? 'bg-purple-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}`}
              >
                <PieChart className="w-4 h-4" /> Analytics
              </button>
              <button 
                onClick={() => setActiveTab('lending')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-colors whitespace-nowrap ${activeTab === 'lending' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}`}
              >
                <Users className="w-4 h-4" /> Lending
              </button>
              <button 
                onClick={() => setActiveTab('sips')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-colors whitespace-nowrap ${activeTab === 'sips' ? 'bg-cyan-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}`}
              >
                <TrendingUp className="w-4 h-4" /> SIPs
              </button>
            </div>

            {/* Desktop Sign Out Button */}
            <button
              onClick={handleSignOut}
              className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-rose-500/10 text-slate-300 hover:text-rose-400 rounded-xl border border-slate-700/50 hover:border-rose-500/50 transition-all font-bold text-sm shrink-0"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </header>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-8 text-red-400 font-medium">
            {error}
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Monthly Overview</h2>
              {/* Month Selector */}
              <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700/50 shadow-inner">
                <button 
                  onClick={handlePrevMonth}
                  className="p-2 hover:bg-slate-700 rounded-md transition-colors text-slate-400 hover:text-white"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="w-32 text-center font-semibold text-slate-200">
                  {format(currentDate, 'MMMM yyyy')}
                </span>
                <button 
                  onClick={handleNextMonth}
                  className="p-2 hover:bg-slate-700 rounded-md transition-colors text-slate-400 hover:text-white"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <MonthlySummary 
              transactions={transactions} 
              currentDate={currentDate} 
              previousBalance={previousBalance}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-1">
                <AddTransaction 
                  onAddTransaction={handleAddTransaction} 
                  isLoading={isAdding} 
                  customCategories={customCategories}
                  onAddCustomCategory={handleAddCustomCategory}
                />
              </div>
              <div className="lg:col-span-2">
                <TransactionList 
                  transactions={transactions} 
                  onDeleteTransaction={handleDeleteTransaction}
                  isLoading={isLoading}
                />
              </div>
            </div>
          </>
        )}

        {activeTab === 'analytics' && <AnalyticsTab transactions={transactions} />}
        {activeTab === 'lending' && <LendingTab user={user} />}
        {activeTab === 'sips' && <SipTab user={user} />}

      </div>
    </div>
  );
}
