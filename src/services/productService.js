// src/services/productService.js
import firestore from '@react-native-firebase/firestore';

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
// SNAPSHOT PROCESSOR — shared between primary and fallback listeners
// ---------------------------------------------------------------------------

/**
 * Transform a Firestore snapshot into an array of product objects
 * with live-computed status.
 */
const processSnapshot = (snapshot) => {
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    const { daysLeft, status } = computeStatus(data.expiryDate);
    return {
      id: doc.id,
      ...data,
      daysLeft,
      status,
    };
  });
};

// ---------------------------------------------------------------------------
// WRITE
// ---------------------------------------------------------------------------

/**
 * Add a new product to Firestore.
 * The product is linked to the shopkeeper via their Firebase Auth UID.
 *
 * @param {string} shopkeeperId - Firebase Auth UID of the logged-in shopkeeper
 * @param {object} formData     - Form fields from AddProductScreen
 * @returns {Promise<string>}   - The new document's Firestore ID
 */
export const addProduct = async (shopkeeperId, formData) => {
  const { daysLeft, status } = computeStatus(formData.expiryDate);

  const payload = {
    shopkeeperId,
    name: formData.name.trim(),
    category: formData.category,
    quantity: formData.quantity,
    unit: formData.unit.trim(),
    batchNo: formData.batchNo.trim(),
    expiryDate: formData.expiryDate.trim(),
    manufacturingDate: formData.manufacturingDate.trim(),
    notes: formData.notes.trim(),
    status,
    daysLeft,
    createdAt: firestore.FieldValue.serverTimestamp(),
    updatedAt: firestore.FieldValue.serverTimestamp(),
  };

  const docRef = await firestore().collection(PRODUCTS_COLLECTION).add(payload);
  return docRef.id;
};

/**
 * Delete a product by its Firestore document ID.
 * @param {string} productId
 */
export const deleteProduct = async (productId) => {
  await firestore().collection(PRODUCTS_COLLECTION).doc(productId).delete();
};

// ---------------------------------------------------------------------------
// READ — Real-time listener with FALLBACK for missing composite index
// ---------------------------------------------------------------------------

/**
 * Subscribe to real-time updates of products owned by a shopkeeper.
 * Returns an `unsubscribe` function to detach the listener.
 *
 * **Fallback strategy:**
 * The primary query uses `.where()` + `.orderBy()` which requires a Firestore
 * composite index. If the index doesn't exist yet, Firestore throws
 * `failed-precondition`. In that case we:
 *   1. Log the index creation URL (included in the error message)
 *   2. Fall back to a simpler query (just `.where()`) and sort client-side
 *
 * @param {string}   shopkeeperId
 * @param {Function} onData   - Called with (products: array) on every update
 * @param {Function} onError  - Called with (error) if the listener fails
 */
export const subscribeToProducts = (shopkeeperId, onData, onError) => {
  let unsubscribed = false;
  let activeUnsubscribe = null;

  // ── Primary query: where + orderBy (requires composite index) ──
  try {
    activeUnsubscribe = firestore()
      .collection(PRODUCTS_COLLECTION)
      .where('shopkeeperId', '==', shopkeeperId)
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        (snapshot) => {
          if (unsubscribed) return;
          const products = processSnapshot(snapshot);
          onData(products);
        },
        (error) => {
          if (unsubscribed) return;

          // Check for missing-index error
          if (
            error.code === 'firestore/failed-precondition' ||
            error.code === 'failed-precondition'
          ) {
            console.warn(
              '────────────────────────────────────────────────────────\n' +
              '⚠️  FIRESTORE INDEX REQUIRED\n' +
              '────────────────────────────────────────────────────────\n' +
              'Your query needs a composite index.\n' +
              'The error message below contains a DIRECT LINK to create it:\n\n' +
              error.message + '\n\n' +
              'Alternatively, go to Firebase Console → Firestore → Indexes\n' +
              'and create a composite index on the "products" collection:\n' +
              '  • shopkeeperId  (Ascending)\n' +
              '  • createdAt     (Descending)\n' +
              '────────────────────────────────────────────────────────\n' +
              'Falling back to client-side sorting...\n',
            );

            // ── Fallback query: where only, sort client-side ──
            activeUnsubscribe = firestore()
              .collection(PRODUCTS_COLLECTION)
              .where('shopkeeperId', '==', shopkeeperId)
              .onSnapshot(
                (fallbackSnapshot) => {
                  if (unsubscribed) return;
                  const products = processSnapshot(fallbackSnapshot);
                  // Client-side sort by createdAt descending
                  products.sort((a, b) => {
                    const aTime = a.createdAt?.toMillis?.() || 0;
                    const bTime = b.createdAt?.toMillis?.() || 0;
                    return bTime - aTime;
                  });
                  onData(products);
                },
                (fallbackError) => {
                  if (unsubscribed) return;
                  console.error('subscribeToProducts fallback error:', fallbackError);
                  if (onError) {
                    onError(fallbackError);
                  }
                },
              );
          } else {
            // Non-index error — pass through
            console.error('subscribeToProducts error:', error);
            if (onError) {
              onError(error);
            }
          }
        },
      );
  } catch (error) {
    console.error('subscribeToProducts setup error:', error);
    if (onError) {
      onError(error);
    }
  }

  // Return a cleanup function that detaches whichever listener is active
  return () => {
    unsubscribed = true;
    if (activeUnsubscribe && typeof activeUnsubscribe === 'function') {
      activeUnsubscribe();
    }
  };
};
