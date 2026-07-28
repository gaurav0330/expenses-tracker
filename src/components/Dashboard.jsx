import { useState, useEffect } from 'react';
import { addMonths, subMonths, format } from 'date-fns';
import { ChevronLeft, ChevronRight, LayoutDashboard, LogOut, Wallet, Users, TrendingUp } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

import MonthlySummary from './MonthlySummary';
import AddTransaction from './AddTransaction';
import TransactionList from './TransactionList';
import LendingTab from './LendingTab';
import SipTab from './SipTab';

import { addTransaction, getTransactionsForMonth, deleteTransaction, getUserCategories, addUserCategory } from '../lib/expenseService';

export default function Dashboard({ user }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('overview'); // overview, lending, sips
  
  const [transactions, setTransactions] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState(null);

  const fetchTransactionsAndCategories = async (date) => {
    setIsLoading(true);
    setError(null);
    try {
      const [transactionsData, categoriesData] = await Promise.all([
        getTransactionsForMonth(user.uid, date),
        getUserCategories(user.uid)
      ]);
      setTransactions(transactionsData);
      setCustomCategories(categoriesData);
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
    } catch (err) {
      console.error(err);
      alert("Failed to add custom category.");
    }
  };

  const handleAddTransaction = async (transactionData) => {
    setIsAdding(true);
    try {
      await addTransaction(user.uid, transactionData);
      const data = await getTransactionsForMonth(user.uid, currentDate);
      setTransactions(data);
    } catch (err) {
      console.error(err);
      alert("Failed to add transaction.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteTransaction = async (id) => {
    try {
      await deleteTransaction(id);
      setTransactions(transactions.filter(t => t.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete transaction.");
    }
  };

  const handleSignOut = () => {
    signOut(auth);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 selection:bg-emerald-500/30">
      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Header & Navigation */}
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">ExpenseTracker</h1>
              <p className="text-slate-400 text-sm font-medium">Manage your money wisely</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            
            {/* Tab Navigation */}
            <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700/50 shadow-inner overflow-x-auto custom-scrollbar">
              <button 
                onClick={() => setActiveTab('overview')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'overview' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}`}
              >
                <Wallet className="w-4 h-4" /> Overview
              </button>
              <button 
                onClick={() => setActiveTab('lending')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'lending' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}`}
              >
                <Users className="w-4 h-4" /> Lending
              </button>
              <button 
                onClick={() => setActiveTab('sips')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'sips' ? 'bg-cyan-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}`}
              >
                <TrendingUp className="w-4 h-4" /> SIPs
              </button>
            </div>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-rose-500/10 text-slate-300 hover:text-rose-400 rounded-lg border border-slate-700/50 hover:border-rose-500/50 transition-all font-medium text-sm"
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
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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

        {activeTab === 'lending' && <LendingTab user={user} />}
        {activeTab === 'sips' && <SipTab user={user} />}

      </div>
    </div>
  );
}
