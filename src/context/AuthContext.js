import React, { createContext, useContext, useEffect, useState } from 'react';
import auth from '@react-native-firebase/auth';
import { getUserDataWithRetry } from '../services/userService';
import { logout as firebaseLogout } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const syncAuthenticatedUser = async (firebaseUser) => {
      if (!firebaseUser) {
        if (isMounted) {
          setUser(null);
        }
        return;
      }

      const userData = await getUserDataWithRetry(firebaseUser.uid, {
        attempts: 16,
        delayMs: 250,
      });

      if (userData) {
        if (isMounted) {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || userData.email,
            role: userData.role,
          });
        }
        return;
      }

      console.warn('[AuthContext] User document missing after retry. Signing out.');
      await auth().signOut();

      if (isMounted) {
        setUser(null);
      }
    };

    const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
      try {
        await syncAuthenticatedUser(firebaseUser);
      } catch (error) {
        console.error('Error fetching user data:', error);
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const refreshUser = async () => {
    const currentUser = auth().currentUser;

    if (!currentUser) {
      setUser(null);
      return null;
    }

    setLoading(true);
    try {
      await currentUser.reload();
      const refreshedUser = auth().currentUser || currentUser;
      const userData = await getUserDataWithRetry(refreshedUser.uid, {
        attempts: 8,
        delayMs: 200,
      });

      if (!userData) {
        setUser(null);
        return null;
      }

      const nextUser = {
        uid: refreshedUser.uid,
        email: refreshedUser.email || userData.email,
        role: userData.role,
      };

      setUser(nextUser);
      return nextUser;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const { cancelAllAlerts } = require('../services/notificationService');
      cancelAllAlerts();

      await firebaseLogout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: user !== null,
        logout,
        refreshUser,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
