// src/hooks/useProducts.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { subscribeToProducts } from '../services/productService';
import { useAuth } from '../context/AuthContext';

/**
 * Custom hook that subscribes to the current shopkeeper's product list
 * in real time via Firestore onSnapshot.
 *
 * Returns:
 *   products  - array of product objects (live data)
 *   loading   - true while the first snapshot is pending
 *   error     - error message string or null
 *   retry     - function to re-subscribe after a failure
 */
const useProducts = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const unsubscribeRef = useRef(null);

  const subscribe = useCallback(() => {
    if (!user?.uid) {
      setProducts([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    // Detach previous listener if any
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    try {
      unsubscribeRef.current = subscribeToProducts(
        user.uid,
        (data) => {
          setProducts(data);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('useProducts subscription error:', err);
          setError(
            err?.code === 'firestore/permission-denied' ||
            err?.code === 'permission-denied'
              ? 'You do not have permission to view these products.'
              : 'Failed to load products. Please check your connection and try again.',
          );
          setLoading(false);
        },
      );
    } catch (err) {
      console.error('useProducts setup error:', err);
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    subscribe();

    // Detach listener when the component unmounts or user changes
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [subscribe, retryCount]);

  /**
   * Call this from a "Retry" button to re-subscribe after an error.
   */
  const retry = useCallback(() => {
    setRetryCount((c) => c + 1);
  }, []);

  return { products, loading, error, retry };
};

export default useProducts;
