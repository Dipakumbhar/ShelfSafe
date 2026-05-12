// src/hooks/useProducts.js
import { useState, useEffect } from 'react';
import { subscribeToProducts } from '../services/productService';
import { useAuth } from '../context/AuthContext';
import { useShop } from '../context/ShopContext';

/**
 * Custom hook that subscribes to the current shopkeeper's product list
 * in real time via Firestore onSnapshot.
 *
 * Returns:
 *   products  - array of product objects (live data)
 *   loading   - true while the first snapshot is pending
 *   error     - error message string or null
 */
const useProducts = (options = {}) => {
  const { user } = useAuth();
  const { activeShopId, loading: shopsLoading } = useShop();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const includeAllShops = options.allShops === true;

  useEffect(() => {
    if (!user?.uid) {
      setProducts([]);
      setLoading(false);
      setError(null);
      return;
    }

    if (!includeAllShops && shopsLoading) {
      setLoading(true);
      return;
    }

    if (!includeAllShops && !activeShopId) {
      setProducts([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);

    const unsubscribe = subscribeToProducts(
      user.uid,
      { shopId: includeAllShops ? null : activeShopId },
      (data) => {
        setProducts(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError('Failed to load products. Please try again.');
        setLoading(false);
      },
    );

    // Detach listener when the component unmounts or user changes
    return () => unsubscribe();
  }, [activeShopId, includeAllShops, shopsLoading, user?.uid]);

  return { products, loading, error };
};

export default useProducts;
