// src/services/productService.js
import firestore from '@react-native-firebase/firestore';
import {
  scheduleExpiryAlert,
  cancelProductAlert,
} from './notificationService';

const PRODUCTS_COLLECTION = 'products';

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

/**
 * Parse a date string in either DD/MM/YYYY or YYYY-MM-DD format.
 * Returns a JS Date object, or null if unparseable.
 */
export const parseExpiryDate = (dateStr = '') => {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();

  // Full ISO datetime string: 2024-12-31T00:00:00.000Z — extract date part
  const isoDatetimeMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})T/);
  if (isoDatetimeMatch) {
    return new Date(
      Number(isoDatetimeMatch[1]),
      Number(isoDatetimeMatch[2]) - 1,
      Number(isoDatetimeMatch[3]),
    );
  }

  // YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
  }

  // DD/MM/YYYY
  const dmyMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dmyMatch) {
    return new Date(Number(dmyMatch[3]), Number(dmyMatch[2]) - 1, Number(dmyMatch[1]));
  }

  return null;
};

/**
 * Given an expiry date string, compute:
 *   - daysLeft  (negative = already expired)
 *   - status    'fresh' | 'expiring' | 'expired'
 */
export const computeStatus = (expiryDateStr) => {
  const expiry = parseExpiryDate(expiryDateStr);
  if (!expiry) return { daysLeft: null, status: 'fresh' };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);

  const diffMs = expiry - today;
  const daysLeft = Math.round(diffMs / (1000 * 60 * 60 * 24));

  let status;
  if (daysLeft < 0) {
    status = 'expired';
  } else if (daysLeft <= 30) {
    status = 'expiring';
  } else {
    status = 'fresh';
  }

  return { daysLeft, status };
};

// ---------------------------------------------------------------------------
// WRITE
// ---------------------------------------------------------------------------

/**
 * Add a new product to Firestore.
 * The product is linked to the shopkeeper via their Firebase Auth UID.
 *
 * @param {string}  shopkeeperId         - Firebase Auth UID
 * @param {object}  formData             - Form fields from AddProductScreen
 * @param {boolean} [notificationsEnabled=true] - User notification preference
 * @returns {Promise<{id: string, notifResult: string}>}
 */
export const addProduct = async (shopkeeperId, formData, notificationsEnabled = true) => {
  const { daysLeft, status } = computeStatus(formData.expiryDate);

  const payload = {
    shopkeeperId,
    name: formData.name.trim(),
    category: formData.category,
    quantity: formData.quantity,
    unit: (formData.unit || '').trim(),
    batchNo: (formData.batchNo || '').trim(),
    expiryDate: (formData.expiryDate || '').trim(),
    manufacturingDate: formData.manufacturingDate ? formData.manufacturingDate.trim() : '',
    notes: (formData.notes || '').trim(),
    status,
    daysLeft,
    createdAt: firestore.FieldValue.serverTimestamp(),
    updatedAt: firestore.FieldValue.serverTimestamp(),
  };

  const docRef = await firestore().collection(PRODUCTS_COLLECTION).add(payload);

  // Schedule expiry notification — non-blocking
  let notifResult = 'skipped_disabled';
  try {
    notifResult = scheduleExpiryAlert({
      productId: docRef.id,
      productName: payload.name,
      expiryDate: payload.expiryDate,
      notificationsEnabled,
    });
  } catch (notifErr) {
    console.warn('[productService] Failed to schedule notification:', notifErr);
  }

  return { id: docRef.id, notifResult };
};

/**
 * Delete a product by its Firestore document ID.
 * @param {string} productId
 */
export const deleteProduct = async (productId) => {
  await firestore().collection(PRODUCTS_COLLECTION).doc(productId).delete();

  // Cancel any scheduled notification for this product
  try {
    cancelProductAlert(productId);
  } catch (notifErr) {
    console.warn('[productService] Failed to cancel notification:', notifErr);
  }
};

/**
 * Updates an existing product in Firestore.
 *
 * @param {string}  productId            - Firestore doc ID
 * @param {object}  formData             - Updated form fields
 * @param {boolean} [notificationsEnabled=true] - User notification preference
 * @returns {Promise<string>} notifResult
 */
export const updateProduct = async (productId, formData, notificationsEnabled = true) => {
  const { daysLeft, status } = computeStatus(formData.expiryDate);

  const payload = {
    name: formData.name.trim(),
    category: formData.category,
    quantity: formData.quantity,
    unit: (formData.unit || '').trim(),
    batchNo: (formData.batchNo || '').trim(),
    expiryDate: (formData.expiryDate || '').trim(),
    manufacturingDate: formData.manufacturingDate ? formData.manufacturingDate.trim() : '',
    notes: (formData.notes || '').trim(),
    status,
    daysLeft,
    updatedAt: firestore.FieldValue.serverTimestamp(),
  };

  await firestore().collection(PRODUCTS_COLLECTION).doc(productId).update(payload);

  // Re-schedule expiry notification — non-blocking
  let notifResult = 'skipped_disabled';
  try {
    notifResult = scheduleExpiryAlert({
      productId,
      productName: payload.name,
      expiryDate: payload.expiryDate,
      notificationsEnabled,
    });
  } catch (notifErr) {
    console.warn('[productService] Failed to re-schedule notification:', notifErr);
  }

  return notifResult;
};

// ---------------------------------------------------------------------------
// READ — Real-time listener
// ---------------------------------------------------------------------------

/**
 * Subscribe to real-time updates of products owned by a shopkeeper.
 * Returns an `unsubscribe` function to detach the listener.
 *
 * Each product object will have an `id` field (Firestore doc ID) plus
 * all stored fields. Status is recomputed on each snapshot so "expiring"
 * items automatically advance to "expired" without needing a Firestore write.
 *
 * @param {string}   shopkeeperId
 * @param {Function} onData   - Called with (products: array) on every update
 * @param {Function} onError  - Called with (error) if the listener fails
 */
export const subscribeToProducts = (shopkeeperId, onData, onError) => {
  const unsubscribe = firestore()
    .collection(PRODUCTS_COLLECTION)
    .where('shopkeeperId', '==', shopkeeperId)
    .orderBy('createdAt', 'desc')
    .onSnapshot(
      (snapshot) => {
        const products = snapshot.docs.map((doc) => {
          const data = doc.data();
          // Recompute live status based on today's date
          const { daysLeft, status } = computeStatus(data.expiryDate);
          return {
            id: doc.id,
            ...data,
            daysLeft,
            status,
          };
        });
        onData(products);
      },
      (error) => {
        console.error('subscribeToProducts error:', error);
        if (onError) onError(error);
      },
    );

  return unsubscribe;
};
