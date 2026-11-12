let isPrivacyGlobal = false;
try {
  isPrivacyGlobal = typeof window !== 'undefined' && localStorage.getItem('hide_money_privacy') === 'true';
} catch {
  isPrivacyGlobal = false;
}

export const getIsMoneyHidden = () => isPrivacyGlobal;

export const setGlobalMoneyHidden = (val) => {
  isPrivacyGlobal = Boolean(val);
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hide_money_privacy', isPrivacyGlobal ? 'true' : 'false');
    }
  } catch {}
};

export const formatRawINR = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '₹0.00';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatINR = (amount, overrideHidden = null) => {
  const hidden = overrideHidden !== null ? overrideHidden : isPrivacyGlobal;
  if (hidden) {
    return '₹••••••';
  }
  return formatRawINR(amount);
};
