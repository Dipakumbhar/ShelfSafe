// utils/dateUtils.js
// Utility helpers for expiry date calculation

export const getDaysLeft = (expiryDateStr) => {
  const today = new Date();
  const expiry = new Date(expiryDateStr);
  const diff = expiry - today;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const getExpiryStatus = (daysLeft) => {
  if (daysLeft < 0) return 'expired';
  if (daysLeft <= 14) return 'expiring';
  return 'fresh';
};

export const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
