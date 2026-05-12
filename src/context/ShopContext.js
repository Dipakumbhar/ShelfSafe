import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import {
  bootstrapShopkeeperShops,
  createShop as createShopRecord,
  setActiveShop as setActiveShopRecord,
  subscribeToShops,
  updateShop as updateShopRecord,
} from '../services/shopService';
import { subscribeToUser } from '../services/userService';

const ShopContext = createContext(null);

export const ShopProvider = ({ children }) => {
  const { user } = useAuth();
  const [shops, setShops] = useState([]);
  const [activeShopId, setActiveShopId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.role !== 'shopkeeper' || !user?.uid) {
      setShops([]);
      setActiveShopId(null);
      setLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;
    let shopsReady = false;
    let userReady = false;

    const finishInitialLoad = () => {
      if (isMounted && shopsReady && userReady) {
        setLoading(false);
      }
    };

    setLoading(true);
    setError(null);

    bootstrapShopkeeperShops(user.uid).catch((bootstrapError) => {
      console.error('bootstrapShopkeeperShops error:', bootstrapError);
      if (isMounted) {
        setError('Failed to load your stores.');
      }
    });

    const unsubscribeShops = subscribeToShops(
      user.uid,
      (shopData) => {
        if (!isMounted) return;
        shopsReady = true;
        setShops(shopData);
        finishInitialLoad();
      },
      () => {
        if (!isMounted) return;
        shopsReady = true;
        setError('Failed to load your stores.');
        finishInitialLoad();
      },
    );

    const unsubscribeUser = subscribeToUser(
      user.uid,
      (userData) => {
        if (!isMounted) return;
        userReady = true;
        setActiveShopId(userData?.activeShopId || null);
        finishInitialLoad();
      },
      () => {
        if (!isMounted) return;
        userReady = true;
        setError('Failed to load your active store.');
        finishInitialLoad();
      },
    );

    return () => {
      isMounted = false;
      unsubscribeShops();
      unsubscribeUser();
    };
  }, [user?.role, user?.uid]);

  const activeShop = shops.find((shop) => shop.id === activeShopId) || shops[0] || null;
  const resolvedActiveShopId = activeShop?.id || activeShopId || null;

  const selectShop = useCallback(async (shopId) => {
    if (!user?.uid || !shopId || shopId === resolvedActiveShopId) {
      return;
    }

    await setActiveShopRecord(user.uid, shopId);
  }, [resolvedActiveShopId, user?.uid]);

  const createShop = useCallback(async (shopData) => {
    if (!user?.uid) {
      throw new Error('No shopkeeper is signed in.');
    }

    return createShopRecord(user.uid, shopData);
  }, [user?.uid]);

  const updateShop = useCallback(async (shopId, shopData) => {
    return updateShopRecord(shopId, shopData);
  }, []);

  return (
    <ShopContext.Provider
      value={{
        shops,
        activeShop,
        activeShopId: resolvedActiveShopId,
        loading,
        error,
        selectShop,
        createShop,
        updateShop,
      }}>
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);

  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }

  return context;
};

export default ShopContext;
