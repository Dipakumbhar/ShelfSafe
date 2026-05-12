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
 * Send a Firebase password reset email to the given address.
 */
export const sendPasswordReset = async (email) => {
  await auth().sendPasswordResetEmail(email.trim().toLowerCase());
};

/**
 * Sign out the currently authenticated user.
 */
export const logout = async () => {
  await auth().signOut();
};

export const updateCurrentUserEmail = async (email) => {
  const currentUser = auth().currentUser;

  if (!currentUser) {
    throw new Error('No authenticated user found.');
  }

  const normalizedEmail = email.trim().toLowerCase();

  await currentUser.updateEmail(normalizedEmail);
  await currentUser.reload();

  return auth().currentUser;
};

/**
 * Get the currently signed-in Firebase user (or null).
 */
export const getCurrentUser = () => {
  return auth().currentUser;
};
