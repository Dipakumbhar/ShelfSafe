import { useEffect, useState } from 'react';
import firestore from '@react-native-firebase/firestore';
import {
  computeStatus,
  subscribeToAllProducts,
  summarizeProducts,
} from '../services/productService';

const getTimestampMs = (value) => {
  if (!value) return 0;
  if (typeof value?.toDate === 'function') {
    return value.toDate().getTime();
  }
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const sortByCreatedAt = (items = [], descending = false) => {
  return [...items].sort((first, second) => {
    const delta = getTimestampMs(first.createdAt) - getTimestampMs(second.createdAt);
    return descending ? -delta : delta;
  });
};

const buildFallbackShopName = (shopkeeper) => {
  if (shopkeeper?.shop?.name?.trim()) {
    return shopkeeper.shop.name.trim();
  }

  if (shopkeeper?.name?.trim()) {
    return `${shopkeeper.name.trim()}'s Store`;
  }

  return 'Unassigned Store';
};

const decorateProduct = (product) => {
  const { daysLeft, status } = computeStatus(product.expiryDate);
  return {
    ...product,
    daysLeft,
    status,
  };
};

const useAdminInventory = () => {
  const [users, setUsers] = useState([]);
  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let usersReady = false;
    let shopsReady = false;
    let productsReady = false;

    const finishInitialLoad = () => {
      if (usersReady && shopsReady && productsReady) {
        setLoading(false);
      }
    };

    setLoading(true);
    setError(null);

    const unsubscribeUsers = firestore().collection('users').onSnapshot(
      (snapshot) => {
        usersReady = true;
        setUsers(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })),
        );
        finishInitialLoad();
      },
      (usersError) => {
        console.error('Admin users snapshot error:', usersError);
        usersReady = true;
        setError('Failed to load shopkeepers.');
        finishInitialLoad();
      },
    );

    const unsubscribeShops = firestore().collection('shops').onSnapshot(
      (snapshot) => {
        shopsReady = true;
        setShops(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })),
        );
        finishInitialLoad();
      },
      (shopsError) => {
        console.error('Admin shops snapshot error:', shopsError);
        shopsReady = true;
        setError('Failed to load shops.');
        finishInitialLoad();
      },
    );

    const unsubscribeProducts = subscribeToAllProducts(
      (productData) => {
        productsReady = true;
        setProducts(productData);
        finishInitialLoad();
      },
      (productsError) => {
        console.error('Admin products snapshot error:', productsError);
        productsReady = true;
        setError('Failed to load inventory.');
        finishInitialLoad();
      },
    );

    return () => {
      unsubscribeUsers();
      unsubscribeShops();
      unsubscribeProducts();
    };
  }, []);

  const shopkeepers = sortByCreatedAt(
    users
      .filter((user) => user.role === 'shopkeeper')
      .map((shopkeeper) => {
        const realShops = shops.filter((shop) => shop.shopkeeperId === shopkeeper.id);
        const orphanProducts = products.filter(
          (product) => product.shopkeeperId === shopkeeper.id && !product.shopId,
        );

        const shopEntries = sortByCreatedAt(realShops).map((shop) => {
          const inventory = sortByCreatedAt(
            products
              .filter((product) => (
                product.shopkeeperId === shopkeeper.id && product.shopId === shop.id
              ))
              .map(decorateProduct),
            true,
          );
          const summary = summarizeProducts(inventory);

          return {
            ...shop,
            inventory,
            ...summary,
            alertCount: summary.expiringItems + summary.expiredItems,
          };
        });

        if (orphanProducts.length) {
          const inventory = sortByCreatedAt(orphanProducts.map(decorateProduct), true);
          const summary = summarizeProducts(inventory);

          shopEntries.push({
            id: `legacy-${shopkeeper.id}`,
            shopkeeperId: shopkeeper.id,
            name: buildFallbackShopName(shopkeeper),
            address: shopkeeper?.shop?.address || '',
            createdAt: shopkeeper.createdAt || null,
            isLegacy: true,
            inventory,
            ...summary,
            alertCount: summary.expiringItems + summary.expiredItems,
          });
        } else if (!shopEntries.length && shopkeeper?.shop) {
          shopEntries.push({
            id: `legacy-empty-${shopkeeper.id}`,
            shopkeeperId: shopkeeper.id,
            name: buildFallbackShopName(shopkeeper),
            address: shopkeeper.shop.address || '',
            createdAt: shopkeeper.createdAt || null,
            isLegacy: true,
            inventory: [],
            ...summarizeProducts([]),
            alertCount: 0,
          });
        }

        const allInventory = shopEntries.flatMap((shop) => shop.inventory);
        const summary = summarizeProducts(allInventory);

        return {
          ...shopkeeper,
          shops: shopEntries,
          shopCount: shopEntries.length,
          activeShopId: shopkeeper.activeShopId || shopEntries[0]?.id || null,
          ...summary,
          alertCount: summary.expiringItems + summary.expiredItems,
        };
      }),
  );

  const summary = {
    totalShopkeepers: shopkeepers.length,
    totalShops: shopkeepers.reduce((count, shopkeeper) => count + shopkeeper.shopCount, 0),
    totalProducts: shopkeepers.reduce((count, shopkeeper) => count + shopkeeper.totalProducts, 0),
    totalAlerts: shopkeepers.reduce((count, shopkeeper) => count + shopkeeper.alertCount, 0),
  };

  return {
    shopkeepers,
    summary,
    loading,
    error,
  };
};

export default useAdminInventory;
