import { collection, addDoc, query, where, getDocs, deleteDoc, doc, orderBy, setDoc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "./firebase";
import { startOfMonth, endOfMonth, format } from "date-fns";

const TRANSACTIONS_COLLECTION = "transactions";
const SETTINGS_COLLECTION = "userSettings";
const LENDING_COLLECTION = "lends";
const SIPS_COLLECTION = "sips";

// --- Transactions (Income & Expense) ---

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

export const getTransactionsForMonth = async (userId, date) => {
  try {
    const start = format(startOfMonth(date), 'yyyy-MM-dd');
    const end = format(endOfMonth(date), 'yyyy-MM-dd');

    // Query only by userId to completely avoid needing a composite index in Firestore
    const q = query(
      collection(db, TRANSACTIONS_COLLECTION),
      where("userId", "==", userId)
    );

    const querySnapshot = await getDocs(q);
    const transactions = [];
    let previousBalance = 0;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Filter by date range in memory
      if (data.date >= start && data.date <= end) {
        transactions.push({ id: doc.id, ...data });
      } 
      // Calculate rollover balance for everything before this month
      else if (data.date < start) {
        if (data.type === 'income') {
          previousBalance += data.amount;
        } else {
          previousBalance -= data.amount;
        }
      }
    });
    
    // Sort in memory
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date) || new Date(b.createdAt) - new Date(a.createdAt));
    
    return { transactions, previousBalance };
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
    return sips.sort((a, b) => a.deductionDate - b.deductionDate);
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

// --- Pocket Notes / Side Cash ---

const POCKET_COLLECTION = "pocketNotes";

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
    // 1. Transactions
    const txQ = query(collection(db, TRANSACTIONS_COLLECTION), where("userId", "==", userId));
    const txSnap = await getDocs(txQ);
    let totalIncome = 0;
    let totalExpense = 0;
    const categoryTotals = {};

    txSnap.forEach(doc => {
      const d = doc.data();
      if (d.type === 'income') {
        totalIncome += d.amount || 0;
      } else {
        totalExpense += d.amount || 0;
        if (d.category) {
          categoryTotals[d.category] = (categoryTotals[d.category] || 0) + (d.amount || 0);
        }
      }
    });

    // 2. Lends (pending to receive)
    const lendQ = query(collection(db, LENDING_COLLECTION), where("userId", "==", userId));
    const lendSnap = await getDocs(lendQ);
    let pendingLend = 0;
    lendSnap.forEach(doc => {
      const d = doc.data();
      if (d.status === 'pending') {
        pendingLend += d.amount || 0;
      }
    });

    // 3. SIPs
    const sipQ = query(collection(db, SIPS_COLLECTION), where("userId", "==", userId));
    const sipSnap = await getDocs(sipQ);
    let totalSip = 0;
    sipSnap.forEach(doc => {
      totalSip += doc.data().amount || 0;
    });

    // 4. Pocket Notes (Side Cash)
    const pQ = query(collection(db, POCKET_COLLECTION), where("userId", "==", userId));
    const pSnap = await getDocs(pQ);
    let sideReceived = 0;
    let sideSpent = 0;
    pSnap.forEach(doc => {
      const d = doc.data();
      if (d.type === 'received') sideReceived += d.amount || 0;
      if (d.type === 'spent') sideSpent += d.amount || 0;
    });

    const netBalance = totalIncome - totalExpense;
    const sideBalance = sideReceived - sideSpent;
    const netWorth = netBalance + sideBalance + pendingLend;

    return {
      totalIncome,
      totalExpense,
      netBalance,
      pendingLend,
      totalSip,
      sideBalance,
      netWorth,
      categoryTotals,
      totalTxnsCount: txSnap.size
    };
  } catch (error) {
    console.error("Error getting all-time summary: ", error);
    throw error;
  }
};
