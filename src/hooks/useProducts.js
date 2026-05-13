// src/hooks/useProducts.js
import { useState, useEffect } from 'react';
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
 */
const useProducts = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.uid) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = subscribeToProducts(
      user.uid,
      (data) => {
        setProducts(data);
        setLoading(false);
        setError(null);
      },
      () => {
        setError('Failed to load products. Please try again.');
        setLoading(false);
      },
    );

    // Detach listener when the component unmounts or user changes
    return () => unsubscribe();
  }, [user?.uid]);

  return { products, loading, error };
};

export default useProducts;
