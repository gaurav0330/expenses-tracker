import { collection, addDoc, query, where, getDocs, deleteDoc, doc, setDoc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "./firebase";
import { startOfMonth, endOfMonth, format } from "date-fns";

const TRANSACTIONS_COLLECTION = "transactions";
const SETTINGS_COLLECTION = "userSettings";
const LENDING_COLLECTION = "lends";
const SIPS_COLLECTION = "sips";
const POCKET_COLLECTION = "pocketNotes";
const PETROL_COLLECTION = "petrolLogs";
const EMIS_COLLECTION = "emis";

// --- Bank Accounts & Wallets ---

export const DEFAULT_BANK_ACCOUNTS = [
  {
    id: 'acc_main',
    name: 'Main Bank',
    type: 'savings',
    openingBalance: 0,
    color: 'emerald',
    isDefault: true,
    createdAt: new Date().toISOString()
  }
];

export const getUserAccounts = async (userId) => {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && Array.isArray(docSnap.data().accounts) && docSnap.data().accounts.length > 0) {
      return docSnap.data().accounts;
    }
    return DEFAULT_BANK_ACCOUNTS;
  } catch (error) {
    console.error("Error getting user accounts: ", error);
    return DEFAULT_BANK_ACCOUNTS;
  }
};

export const saveUserAccounts = async (userId, accounts) => {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, userId);
    await setDoc(docRef, { accounts }, { merge: true });
    return accounts;
  } catch (error) {
    console.error("Error saving user accounts: ", error);
    throw error;
  }
};

export const addBankAccount = async (userId, accountData) => {
  try {
    const existing = await getUserAccounts(userId);
    const newAccount = {
      id: `acc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: accountData.name.trim(),
      type: accountData.type || 'savings',
      openingBalance: parseFloat(accountData.openingBalance) || 0,
      color: accountData.color || 'blue',
      isDefault: existing.length === 0,
      createdAt: new Date().toISOString()
    };
    const updated = [...existing, newAccount];
    await saveUserAccounts(userId, updated);
    return newAccount;
  } catch (error) {
    console.error("Error adding bank account: ", error);
    throw error;
  }
};

export const updateBankAccount = async (userId, accountId, updatedFields) => {
  try {
    const existing = await getUserAccounts(userId);
    const updated = existing.map(acc => {
      if (acc.id === accountId) {
        return {
          ...acc,
          ...updatedFields,
          name: updatedFields.name !== undefined ? updatedFields.name.trim() : acc.name,
          openingBalance: updatedFields.openingBalance !== undefined 
            ? (parseFloat(updatedFields.openingBalance) || 0)
            : acc.openingBalance
        };
      }
      if (updatedFields.isDefault && acc.id !== accountId) {
        return { ...acc, isDefault: false };
      }
      return acc;
    });
    await saveUserAccounts(userId, updated);
    return updated;
  } catch (error) {
    console.error("Error updating bank account: ", error);
    throw error;
  }
};

export const deleteBankAccount = async (userId, accountId, targetMigrationAccountId = null) => {
  try {
    const existing = await getUserAccounts(userId);
    if (existing.length <= 1) {
      throw new Error("You must keep at least one bank account.");
    }

    const accountToDelete = existing.find(a => a.id === accountId);
    if (!accountToDelete) return existing;

    const remaining = existing.filter(a => a.id !== accountId);
    if (accountToDelete.isDefault && remaining.length > 0) {
      remaining[0].isDefault = true;
    }

    // Migrate transactions if a target account is specified
    if (targetMigrationAccountId) {
      await shiftTransactions(userId, accountId, targetMigrationAccountId);
    }

    await saveUserAccounts(userId, remaining);
    return remaining;
  } catch (error) {
    console.error("Error deleting bank account: ", error);
    throw error;
  }
};

export const shiftTransactions = async (userId, fromAccountId, toAccountId, options = {}) => {
  try {
    const q = query(
      collection(db, TRANSACTIONS_COLLECTION),
      where("userId", "==", userId)
    );
    const querySnapshot = await getDocs(q);
    const updates = [];

    const accounts = await getUserAccounts(userId);
    const targetAccount = accounts.find(a => a.id === toAccountId);
    const targetName = targetAccount ? targetAccount.name : 'Account';

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      // Match transactions belonging to fromAccountId or untagged if fromAccountId is acc_main/default
      const matchesAccount = (data.accountId === fromAccountId) || 
        (!data.accountId && (fromAccountId === 'acc_main' || accounts.find(a => a.id === fromAccountId)?.isDefault));

      if (matchesAccount) {
        if (options.category && data.category !== options.category) {
          return;
        }
        if (options.startDate && data.date < options.startDate) {
          return;
        }
        if (options.endDate && data.date > options.endDate) {
          return;
        }

        updates.push(
          updateDoc(doc(db, TRANSACTIONS_COLLECTION, docSnap.id), {
            accountId: toAccountId,
            accountName: targetName
          })
        );
      }
    });

    await Promise.all(updates);
    return updates.length;
  } catch (error) {
    console.error("Error shifting transactions: ", error);
    throw error;
  }
};

export const addTransfer = async (userId, { fromAccountId, toAccountId, fromAccountName, toAccountName, amount, description, date }) => {
  try {
    const docRef = await addDoc(collection(db, TRANSACTIONS_COLLECTION), {
      userId,
      type: 'transfer',
      amount: parseFloat(amount),
      description: description?.trim() || `Transfer to ${toAccountName}`,
      category: 'Transfer',
      fromAccountId,
      fromAccountName,
      toAccountId,
      toAccountName,
      date,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding transfer: ", error);
    throw error;
  }
};

// --- Transactions (Income, Expense, Transfer) ---

export const addTransaction = async (userId, data) => {
  try {
    const docRef = await addDoc(collection(db, TRANSACTIONS_COLLECTION), {
      ...data,
      userId,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding transaction: ", error);
    throw error;
  }
};

export const getTransactionsForMonth = async (userId, date, providedAccounts = null) => {
  try {
    const start = format(startOfMonth(date), 'yyyy-MM-dd');
    const end = format(endOfMonth(date), 'yyyy-MM-dd');

    const accounts = providedAccounts || await getUserAccounts(userId);
    const defaultAcc = accounts.find(a => a.isDefault) || accounts[0] || DEFAULT_BANK_ACCOUNTS[0];
    const defaultAccountId = defaultAcc.id;

    // Initialize allTimeBalances with opening balances
    const allTimeBalances = {};
    accounts.forEach(acc => {
      allTimeBalances[acc.id] = Number(acc.openingBalance) || 0;
    });
    if (allTimeBalances[defaultAccountId] === undefined) {
      allTimeBalances[defaultAccountId] = Number(defaultAcc.openingBalance) || 0;
    }

    // Query only by userId to avoid needing a composite index in Firestore
    const q = query(
      collection(db, TRANSACTIONS_COLLECTION),
      where("userId", "==", userId)
    );

    const querySnapshot = await getDocs(q);
    const transactions = [];
    let previousBalance = 0;

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const t = { id: docSnap.id, ...data };
      const amount = Number(data.amount) || 0;
      
      // Filter by date range in memory for active month
      if (data.date >= start && data.date <= end) {
        transactions.push(t);
      } 
      // Calculate overall rollover balance for everything before this month
      else if (data.date < start) {
        if (data.type === 'income') {
          previousBalance += amount;
        } else if (data.type === 'expense') {
          previousBalance -= amount;
        }
        // Transfers between user accounts do not alter total overall balance
      }

      // Calculate all-time balances per account
      if (data.type === 'income') {
        const accId = data.accountId || defaultAccountId;
        allTimeBalances[accId] = (allTimeBalances[accId] || 0) + amount;
      } else if (data.type === 'expense') {
        const accId = data.accountId || defaultAccountId;
        allTimeBalances[accId] = (allTimeBalances[accId] || 0) - amount;
      } else if (data.type === 'transfer') {
        const fromId = data.fromAccountId || defaultAccountId;
        const toId = data.toAccountId || defaultAccountId;
        allTimeBalances[fromId] = (allTimeBalances[fromId] || 0) - amount;
        allTimeBalances[toId] = (allTimeBalances[toId] || 0) + amount;
      }
    });
    
    // Sort in memory
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date) || new Date(b.createdAt) - new Date(a.createdAt));
    
    return { transactions, previousBalance, allTimeBalances, accounts };
  } catch (error) {
    console.error("Error getting transactions: ", error);
    throw error;
  }
};

export const deleteTransaction = async (id) => {
  try {
    await deleteDoc(doc(db, TRANSACTIONS_COLLECTION, id));
  } catch (error) {
    console.error("Error deleting transaction: ", error);
    throw error;
  }
};

// --- Custom Categories ---

export const getUserCategories = async (userId) => {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data().categories) {
      return docSnap.data().categories;
    }
    return [];
  } catch (error) {
    console.error("Error getting user categories: ", error);
    return [];
  }
};

export const addUserCategory = async (userId, categoryName) => {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      await updateDoc(docRef, {
        categories: arrayUnion(categoryName)
      });
    } else {
      await setDoc(docRef, {
        categories: [categoryName]
      });
    }
  } catch (error) {
    console.error("Error adding user category: ", error);
    throw error;
  }
};

export const getBudgetGoal = async (userId) => {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data().budgetGoal) {
      return docSnap.data().budgetGoal;
    }
    return 0;
  } catch (error) {
    console.error("Error getting budget goal: ", error);
    return 0;
  }
};

export const setBudgetGoal = async (userId, goal) => {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      await updateDoc(docRef, { budgetGoal: parseFloat(goal) });
    } else {
      await setDoc(docRef, { budgetGoal: parseFloat(goal) });
    }
  } catch (error) {
    console.error("Error setting budget goal: ", error);
    throw error;
  }
};

// --- Lending ---

export const addLend = async (userId, data) => {
  try {
    const docRef = await addDoc(collection(db, LENDING_COLLECTION), {
      ...data,
      userId,
      status: 'pending', // pending, paid
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding lend: ", error);
    throw error;
  }
};

export const getLends = async (userId) => {
  try {
    const q = query(
      collection(db, LENDING_COLLECTION),
      where("userId", "==", userId)
    );
    const querySnapshot = await getDocs(q);
    const lends = [];
    querySnapshot.forEach((doc) => {
      lends.push({ id: doc.id, ...doc.data() });
    });
    return lends.sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (error) {
    console.error("Error getting lends: ", error);
    throw error;
  }
};

export const updateLendStatus = async (id, status) => {
  try {
    await updateDoc(doc(db, LENDING_COLLECTION, id), { status });
  } catch (error) {
    console.error("Error updating lend status: ", error);
    throw error;
  }
};

export const deleteLend = async (id) => {
  try {
    await deleteDoc(doc(db, LENDING_COLLECTION, id));
  } catch (error) {
    console.error("Error deleting lend: ", error);
    throw error;
  }
};

// --- SIPs ---

export const addSip = async (userId, data) => {
  try {
    const docRef = await addDoc(collection(db, SIPS_COLLECTION), {
      ...data,
      userId,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding SIP: ", error);
    throw error;
  }
};

export const getSips = async (userId) => {
  try {
    const q = query(
      collection(db, SIPS_COLLECTION),
      where("userId", "==", userId)
    );
    const querySnapshot = await getDocs(q);
    const sips = [];
    querySnapshot.forEach((doc) => {
      sips.push({ id: doc.id, ...doc.data() });
    });
    return sips.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0) || (a.deductionDate || 0) - (b.deductionDate || 0));
  } catch (error) {
    console.error("Error getting SIPs: ", error);
    throw error;
  }
};

export const deleteSip = async (id) => {
  try {
    await deleteDoc(doc(db, SIPS_COLLECTION, id));
  } catch (error) {
    console.error("Error deleting SIP: ", error);
    throw error;
  }
};

export const updateSip = async (id, data) => {
  try {
    await updateDoc(doc(db, SIPS_COLLECTION, id), data);
  } catch (error) {
    console.error("Error updating SIP: ", error);
    throw error;
  }
};

// --- Pocket Notes / Side Cash ---

export const addPocketEntry = async (userId, data) => {
  try {
    const docRef = await addDoc(collection(db, POCKET_COLLECTION), {
      ...data,
      userId,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding pocket entry: ", error);
    throw error;
  }
};

export const getPocketEntries = async (userId) => {
  try {
    const q = query(
      collection(db, POCKET_COLLECTION),
      where("userId", "==", userId)
    );
    const querySnapshot = await getDocs(q);
    const entries = [];
    querySnapshot.forEach((doc) => {
      entries.push({ id: doc.id, ...doc.data() });
    });
    return entries.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
  } catch (error) {
    console.error("Error getting pocket entries: ", error);
    throw error;
  }
};

export const deletePocketEntry = async (id) => {
  try {
    await deleteDoc(doc(db, POCKET_COLLECTION, id));
  } catch (error) {
    console.error("Error deleting pocket entry: ", error);
    throw error;
  }
};

// --- All-Time Financial Summary ---

export const getAllTimeSummary = async (userId) => {
  try {
    const txQ = query(collection(db, TRANSACTIONS_COLLECTION), where("userId", "==", userId));
    const lendQ = query(collection(db, LENDING_COLLECTION), where("userId", "==", userId));
    const sipQ = query(collection(db, SIPS_COLLECTION), where("userId", "==", userId));
    const pQ = query(collection(db, POCKET_COLLECTION), where("userId", "==", userId));
    const emiQ = query(collection(db, EMIS_COLLECTION), where("userId", "==", userId));

    // Parallel fetch all 5 collections simultaneously
    const [txSnap, lendSnap, sipSnap, pSnap, emiSnap] = await Promise.all([
      getDocs(txQ),
      getDocs(lendQ),
      getDocs(sipQ),
      getDocs(pQ),
      getDocs(emiQ)
    ]);

    // 1. Transactions & Accounts
    const accounts = await getUserAccounts(userId);
    const totalOpeningBalance = accounts.reduce((sum, a) => sum + (Number(a.openingBalance) || 0), 0);

    let totalIncome = 0;
    let totalExpense = 0;
    const categoryTotals = {};

    txSnap.forEach(doc => {
      const d = doc.data();
      if (d.type === 'income') {
        totalIncome += d.amount || 0;
      } else if (d.type === 'expense') {
        totalExpense += d.amount || 0;
        if (d.category) {
          categoryTotals[d.category] = (categoryTotals[d.category] || 0) + (d.amount || 0);
        }
      }
    });

    // 2. Lends (pending to receive)
    let pendingLend = 0;
    lendSnap.forEach(doc => {
      const d = doc.data();
      if (d.status === 'pending') {
        pendingLend += d.amount || 0;
      }
    });

    // 3. SIPs
    let totalSip = 0;
    sipSnap.forEach(doc => {
      totalSip += doc.data().amount || 0;
    });

    // 4. Pocket Notes (Side Cash)
    let sideReceived = 0;
    let sideSpent = 0;
    pSnap.forEach(doc => {
      const d = doc.data();
      if (d.type === 'received') sideReceived += d.amount || 0;
      if (d.type === 'spent') sideSpent += d.amount || 0;
    });

    // 5. EMIs (Remaining Liabilities)
    let remainingEmiLiability = 0;
    let activeEmisCount = 0;
    emiSnap.forEach(doc => {
      const d = doc.data();
      const paid = d.paidInstallments || 0;
      const tenure = d.totalTenure || 1;
      const monthlyEmi = d.monthlyEmi || 0;
      if (d.status === 'active' && paid < tenure) {
        remainingEmiLiability += Math.max(0, tenure - paid) * monthlyEmi;
        activeEmisCount += 1;
      }
    });

    const netBalance = totalOpeningBalance + totalIncome - totalExpense;
    const sideBalance = sideReceived - sideSpent;
    const totalAssets = netBalance + sideBalance + pendingLend;
    const netWorth = totalAssets - remainingEmiLiability;

    return {
      totalIncome,
      totalExpense,
      totalOpeningBalance,
      accounts,
      netBalance,
      pendingLend,
      totalSip,
      sideBalance,
      totalAssets,
      remainingEmiLiability,
      activeEmisCount,
      netWorth,
      categoryTotals,
      totalTxnsCount: txSnap.size
    };
  } catch (error) {
    console.error("Error getting all-time summary: ", error);
    throw error;
  }
};

// --- Petrol & Mileage Tracker ---

export const addPetrolLog = async (userId, data) => {
  try {
    const docRef = await addDoc(collection(db, PETROL_COLLECTION), {
      ...data,
      userId,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding petrol log: ", error);
    throw error;
  }
};

export const getPetrolLogs = async (userId) => {
  try {
    const q = query(
      collection(db, PETROL_COLLECTION),
      where("userId", "==", userId)
    );
    const querySnapshot = await getDocs(q);
    const logs = [];
    querySnapshot.forEach((doc) => {
      logs.push({ id: doc.id, ...doc.data() });
    });
    // Sort chronologically (oldest to newest for mileage calculations, or newest first for UI)
    return logs.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
  } catch (error) {
    console.error("Error getting petrol logs: ", error);
    throw error;
  }
};

export const deletePetrolLog = async (id) => {
  try {
    await deleteDoc(doc(db, PETROL_COLLECTION, id));
  } catch (error) {
    console.error("Error deleting petrol log: ", error);
    throw error;
  }
};

export const updatePetrolLog = async (id, data) => {
  try {
    await updateDoc(doc(db, PETROL_COLLECTION, id), data);
  } catch (error) {
    console.error("Error updating petrol log: ", error);
    throw error;
  }
};

// --- EMI Tracker ---

export const addEmi = async (userId, data) => {
  try {
    const docRef = await addDoc(collection(db, EMIS_COLLECTION), {
      ...data,
      userId,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding EMI: ", error);
    throw error;
  }
};

export const getEmis = async (userId) => {
  try {
    const q = query(
      collection(db, EMIS_COLLECTION),
      where("userId", "==", userId)
    );
    const querySnapshot = await getDocs(q);
    const emis = [];
    querySnapshot.forEach((doc) => {
      emis.push({ id: doc.id, ...doc.data() });
    });
    // Sort chronologically by creation or start date
    return emis.sort((a, b) => new Date(b.createdAt || b.startDate) - new Date(a.createdAt || a.startDate));
  } catch (error) {
    console.error("Error getting EMIs: ", error);
    throw error;
  }
};

export const updateEmi = async (id, data) => {
  try {
    await updateDoc(doc(db, EMIS_COLLECTION, id), data);
  } catch (error) {
    console.error("Error updating EMI: ", error);
    throw error;
  }
};

export const deleteEmi = async (id) => {
  try {
    await deleteDoc(doc(db, EMIS_COLLECTION, id));
  } catch (error) {
    console.error("Error deleting EMI: ", error);
    throw error;
  }
};

export const payEmiInstallment = async (id, currentPaidCount, totalTenure) => {
  try {
    const nextPaidCount = Math.min(totalTenure, (currentPaidCount || 0) + 1);
    const isCompleted = nextPaidCount >= totalTenure;
    await updateDoc(doc(db, EMIS_COLLECTION, id), {
      paidInstallments: nextPaidCount,
      status: isCompleted ? 'completed' : 'active',
      lastPaidAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error paying EMI installment: ", error);
    throw error;
  }
};

// --- Recurring Subscriptions Tracker ---

const SUBSCRIPTIONS_COLLECTION = "subscriptions";

export const addSubscription = async (userId, data) => {
  try {
    const docRef = await addDoc(collection(db, SUBSCRIPTIONS_COLLECTION), {
      ...data,
      userId,
      amount: parseFloat(data.amount) || 0,
      renewalDay: parseInt(data.renewalDay, 10) || 1,
      billingCycle: data.billingCycle || 'monthly',
      status: data.status || 'active',
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding subscription: ", error);
    throw error;
  }
};

export const getSubscriptions = async (userId) => {
  try {
    const q = query(
      collection(db, SUBSCRIPTIONS_COLLECTION),
      where("userId", "==", userId)
    );
    const querySnapshot = await getDocs(q);
    const subs = [];
    querySnapshot.forEach((doc) => {
      subs.push({ id: doc.id, ...doc.data() });
    });
    return subs.sort((a, b) => (a.renewalDay || 1) - (b.renewalDay || 1));
  } catch (error) {
    if (error.code === 'permission-denied') {
      console.warn("Firestore Notice: The 'subscriptions' rule needs to be published to your Firebase Console.");
      return [];
    }
    console.error("Error getting subscriptions: ", error);
    return [];
  }
};

export const updateSubscription = async (id, data) => {
  try {
    await updateDoc(doc(db, SUBSCRIPTIONS_COLLECTION, id), data);
  } catch (error) {
    console.error("Error updating subscription: ", error);
    throw error;
  }
};

export const deleteSubscription = async (id) => {
  try {
    await deleteDoc(doc(db, SUBSCRIPTIONS_COLLECTION, id));
  } catch (error) {
    console.error("Error deleting subscription: ", error);
    throw error;
  }
};

