import { useState, useEffect, useCallback } from 'react';
import { formatRawINR, setGlobalMoneyHidden } from '../lib/utils';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PrivacyContext } from './privacyContextInstance';
import { usePrivacy } from '../hooks/usePrivacy';
import toast from 'react-hot-toast';

export function PrivacyProvider({ children, user }) {
  // 1. Initialize from localStorage immediately (zero render flicker)
  const [isMoneyHidden, setIsMoneyHidden] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        return localStorage.getItem('hide_money_privacy') === 'true';
      }
    } catch {
      // ignore
    }
    return false;
  });

  // Track specific items that the user tapped to peek/reveal individually
  const [revealedKeys, setRevealedKeys] = useState(new Set());

  // Keep utils global sync in step
  useEffect(() => {
    setGlobalMoneyHidden(isMoneyHidden);
  }, [isMoneyHidden]);

  // 2. Sync with userSettings from Firestore on login or user change
  useEffect(() => {
    if (!user?.uid) return;

    let isMounted = true;
    const fetchUserSettings = async () => {
      try {
        const docRef = doc(db, 'userSettings', user.uid);
        const snap = await getDoc(docRef);
        if (snap.exists() && typeof snap.data().hideMoney === 'boolean') {
          const remotePref = snap.data().hideMoney;
          if (isMounted) {
            setIsMoneyHidden(remotePref);
            setGlobalMoneyHidden(remotePref);
            try {
              localStorage.setItem('hide_money_privacy', remotePref ? 'true' : 'false');
            } catch {}
          }
        }
      } catch (err) {
        console.error('Failed to load privacy preference from Firestore:', err);
      }
    };

    fetchUserSettings();
    return () => {
      isMounted = false;
    };
  }, [user?.uid]);

  // 3. Toggle Global Privacy (The Eye Button)
  const toggleGlobalPrivacy = useCallback(async () => {
    setIsMoneyHidden((prev) => {
      const next = !prev;
      setGlobalMoneyHidden(next);
      
      try {
        localStorage.setItem('hide_money_privacy', next ? 'true' : 'false');
      } catch {}

      // Save to Firestore so it persists across devices & logins
      if (user?.uid) {
        try {
          setDoc(doc(db, 'userSettings', user.uid), { hideMoney: next }, { merge: true });
        } catch (err) {
          console.error('Failed to save privacy preference:', err);
        }
      }

      // If turning OFF privacy mode, reset individual revealed keys
      if (!next) {
        setRevealedKeys(new Set());
        toast('Privacy Mode: Balances visible', { icon: '👁️' });
      } else {
        toast('Privacy Mode: Balances hidden (****)', { icon: '🔒' });
      }

      return next;
    });
  }, [user?.uid]);

  // 4. Toggle Peek/Reveal for an individual card or number
  const toggleRevealKey = useCallback((key) => {
    if (!key) return;
    setRevealedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const isKeyRevealed = useCallback((key) => {
    if (!key) return false;
    return revealedKeys.has(key);
  }, [revealedKeys]);

  return (
    <PrivacyContext.Provider
      value={{
        isMoneyHidden,
        toggleGlobalPrivacy,
        revealedKeys,
        toggleRevealKey,
        isKeyRevealed,
      }}
    >
      {children}
    </PrivacyContext.Provider>
  );
}

/**
 * Reusable PrivacyAmount Component
 * If Privacy Mode is active and this item isn't individually revealed, renders '₹••••••'.
 * Clicking it instantly reveals only this specific amount!
 */
export function PrivacyAmount({ 
  amount, 
  id, 
  className = '', 
  prefix = '', 
  suffix = '',
  overrideHidden = null 
}) {
  const { isMoneyHidden, toggleRevealKey, isKeyRevealed } = usePrivacy();

  const isRevealed = id ? isKeyRevealed(id) : false;
  const isHidden = overrideHidden !== null 
    ? overrideHidden 
    : (isMoneyHidden && !isRevealed);

  const handleClick = (e) => {
    if (isMoneyHidden && id) {
      e.stopPropagation();
      toggleRevealKey(id);
    }
  };

  if (isHidden) {
    return (
      <span
        onClick={handleClick}
        title="Privacy Mode active. Click to peek this amount."
        className={`cursor-pointer select-none font-amount tracking-wider text-slate-300 hover:text-amber-400 transition-colors ${className}`}
      >
        {prefix}₹••••••{suffix}
      </span>
    );
  }

  return (
    <span
      onClick={isMoneyHidden && id ? handleClick : undefined}
      title={isMoneyHidden && id ? "Click to re-hide this amount" : undefined}
      className={`${isMoneyHidden && id ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''} ${className}`}
    >
      {prefix}{formatRawINR(amount)}{suffix}
    </span>
  );
}
