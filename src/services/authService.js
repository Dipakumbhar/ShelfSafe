// src/services/authService.js
import auth from '@react-native-firebase/auth';

/**
 * Sign up a new user with email and password.
 * Returns the Firebase UserCredential on success.
 */
export const signup = async (email, password) => {
  const userCredential = await auth().createUserWithEmailAndPassword(
    email.trim(),
    password,
  );
  return userCredential;
};

/**
 * Sign in an existing user with email and password.
 * Returns the Firebase UserCredential on success.
 */
export const login = async (email, password) => {
  const userCredential = await auth().signInWithEmailAndPassword(
    email.trim(),
    password,
  );
  return userCredential;
};

/**
 * Sign out the currently authenticated user.
 */
export const logout = async () => {
  await auth().signOut();
};

/**
 * Get the currently signed-in Firebase user (or null).
 */
export const getCurrentUser = () => {
  return auth().currentUser;
};
