// src/services/userService.js
import firestore from '@react-native-firebase/firestore';

const USERS_COLLECTION = 'users';
const ADMIN_EMAIL = 'admin@gmail.com';

const wait = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

export const resolveRole = (email) => {
  return email.trim().toLowerCase() === ADMIN_EMAIL ? 'admin' : 'shopkeeper';
};

/**
 * Creates a user document in Firestore "users" collection.
 * @param {string} uid   - Firebase Auth UID
 * @param {string} email - User's email address
 * @param {string} role  - "admin" | "shopkeeper"
 */
export const createUserInFirestore = async (uid, email, role) => {
  await firestore().collection(USERS_COLLECTION).doc(uid).set({
    uid,
    email: email.trim().toLowerCase(),
    role,
    activeShopId: null,
    settings: {
      notificationsEnabled: true,
    },
    createdAt: firestore.FieldValue.serverTimestamp(),
  });
};

/**
 * Fetches the user's role from Firestore.
 * Returns the role string, or null if the document doesn't exist.
 * @param {string} uid - Firebase Auth UID
 */
export const getUserRole = async (uid) => {
  const doc = await firestore().collection(USERS_COLLECTION).doc(uid).get();
  if (doc.exists) {
    return doc.data().role;
  }
  return null;
};

/**
 * Fetches the full user document from Firestore.
 * @param {string} uid - Firebase Auth UID
 */
export const getUserData = async (uid) => {
  const doc = await firestore().collection(USERS_COLLECTION).doc(uid).get();
  if (doc.exists) {
    return doc.data();
  }
  return null;
};

export const getUserDataWithRetry = async (uid, options = {}) => {
  const attempts = options.attempts ?? 12;
  const delayMs = options.delayMs ?? 250;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const userData = await getUserData(uid);

    if (userData) {
      return userData;
    }

    if (attempt < attempts - 1) {
      await wait(delayMs);
    }
  }

  return null;
};

/**
 * Updates user profile details in Firestore.
 * @param {string} uid - Firebase Auth UID
 * @param {object} data - Data to update (e.g. { name: 'John' })
 */
export const updateUserProfile = async (uid, data) => {
  const payload = { ...data };

  if (typeof payload.email === 'string') {
    payload.email = payload.email.trim().toLowerCase();
  }

  await firestore().collection(USERS_COLLECTION).doc(uid).set(
    {
      ...payload,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
};

/**
 * Persist the currently active shop for a shopkeeper.
 */
export const updateUserActiveShop = async (uid, activeShopId) => {
  await firestore().collection(USERS_COLLECTION).doc(uid).set(
    {
      activeShopId,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
};

/**
 * Updates the user's notification settings.
 * @param {string} uid - Firebase Auth UID
 * @param {boolean} notificationsEnabled - true or false
 */
export const updateNotificationSettings = async (uid, notificationsEnabled) => {
  await firestore().collection(USERS_COLLECTION).doc(uid).set(
    {
      settings: { notificationsEnabled },
      updatedAt: firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
};

/**
 * Subscribe to a single user document in real time.
 * @param {string} uid
 * @param {Function} onData
 * @param {Function} onError
 */
export const subscribeToUser = (uid, onData, onError) => {
  return firestore().collection(USERS_COLLECTION).doc(uid).onSnapshot(
    (doc) => {
      onData(doc.exists ? doc.data() : null);
    },
    (error) => {
      console.error('subscribeToUser error:', error);
      if (onError) onError(error);
    },
  );
};
