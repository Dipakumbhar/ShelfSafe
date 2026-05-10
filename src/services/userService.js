// src/services/userService.js
import firestore from '@react-native-firebase/firestore';

const USERS_COLLECTION = 'users';
const ADMIN_EMAIL = 'admin@gmail.com';


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

/**
 * Updates user profile details in Firestore.
 * @param {string} uid - Firebase Auth UID
 * @param {object} data - Data to update (e.g. { name: 'John' })
 */
export const updateUserProfile = async (uid, data) => {
  await firestore().collection(USERS_COLLECTION).doc(uid).update(data);
};

/**
 * Updates shop details in Firestore.
 * @param {string} uid - Firebase Auth UID
 * @param {object} shopData - Shop data to update (e.g. { name: 'My Shop', address: '123 St' })
 */
export const updateShopDetails = async (uid, shopData) => {
  await firestore().collection(USERS_COLLECTION).doc(uid).set(
    { shop: shopData },
    { merge: true }
  );
};

/**
 * Updates the user's notification settings.
 * @param {string} uid - Firebase Auth UID
 * @param {boolean} notificationsEnabled - true or false
 */
export const updateNotificationSettings = async (uid, notificationsEnabled) => {
  await firestore().collection(USERS_COLLECTION).doc(uid).set(
    { settings: { notificationsEnabled } },
    { merge: true }
  );
};
