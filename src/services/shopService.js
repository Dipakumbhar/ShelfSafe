import firestore from '@react-native-firebase/firestore';
import { getUserData, updateUserActiveShop } from './userService';

const SHOPS_COLLECTION = 'shops';
const PRODUCTS_COLLECTION = 'products';

const getTimestampMs = (value) => {
  if (!value) return 0;
  if (typeof value?.toDate === 'function') {
    return value.toDate().getTime();
  }
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const sortShopsByCreatedAt = (shops = []) => {
  return [...shops].sort(
    (first, second) => getTimestampMs(first.createdAt) - getTimestampMs(second.createdAt),
  );
};

const normalizeShopPayload = (shopData = {}) => {
  return {
    name: (shopData.name || '').trim(),
    address: (shopData.address || '').trim(),
  };
};

const deriveDefaultShopName = (userData = {}) => {
  if (userData?.shop?.name?.trim()) {
    return userData.shop.name.trim();
  }

  if (userData?.name?.trim()) {
    return `${userData.name.trim()}'s Store`;
  }

  const emailHandle = (userData?.email || '')
    .split('@')[0]
    .replace(/[._-]+/g, ' ')
    .trim();

  if (emailHandle) {
    return `${emailHandle} Store`;
  }

  return 'Main Store';
};

const migrateLegacyInventoryToShop = async (shopkeeperId, shop) => {
  const snapshot = await firestore()
    .collection(PRODUCTS_COLLECTION)
    .where('shopkeeperId', '==', shopkeeperId)
    .get();

  const docsToUpdate = snapshot.docs.filter((doc) => {
    const data = doc.data();
    return !data.shopId || !data.shopName;
  });

  if (!docsToUpdate.length) {
    return;
  }

  const batch = firestore().batch();
  docsToUpdate.forEach((doc) => {
    batch.update(doc.ref, {
      shopId: shop.id,
      shopName: shop.name,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  });
  await batch.commit();
};

const syncShopNameOnProducts = async (shopId, shopName) => {
  const snapshot = await firestore()
    .collection(PRODUCTS_COLLECTION)
    .where('shopId', '==', shopId)
    .get();

  if (snapshot.empty) {
    return;
  }

  const batch = firestore().batch();
  snapshot.docs.forEach((doc) => {
    batch.update(doc.ref, {
      shopName,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  });
  await batch.commit();
};

export const createShop = async (shopkeeperId, shopData, options = {}) => {
  const normalizedShop = normalizeShopPayload(shopData);

  if (!normalizedShop.name) {
    throw new Error('Shop name is required.');
  }

  const shopRef = firestore().collection(SHOPS_COLLECTION).doc();
  await shopRef.set({
    shopkeeperId,
    ...normalizedShop,
    createdAt: firestore.FieldValue.serverTimestamp(),
    updatedAt: firestore.FieldValue.serverTimestamp(),
  });

  if (options.setActive !== false) {
    await updateUserActiveShop(shopkeeperId, shopRef.id);
  }

  return {
    id: shopRef.id,
    shopkeeperId,
    ...normalizedShop,
  };
};

export const updateShop = async (shopId, shopData) => {
  const normalizedShop = normalizeShopPayload(shopData);

  if (!normalizedShop.name) {
    throw new Error('Shop name is required.');
  }

  await firestore().collection(SHOPS_COLLECTION).doc(shopId).update({
    ...normalizedShop,
    updatedAt: firestore.FieldValue.serverTimestamp(),
  });

  await syncShopNameOnProducts(shopId, normalizedShop.name);
};

export const setActiveShop = async (shopkeeperId, shopId) => {
  await updateUserActiveShop(shopkeeperId, shopId);
};

export const bootstrapShopkeeperShops = async (shopkeeperId) => {
  const [userData, shopsSnapshot] = await Promise.all([
    getUserData(shopkeeperId),
    firestore()
      .collection(SHOPS_COLLECTION)
      .where('shopkeeperId', '==', shopkeeperId)
      .get(),
  ]);

  let shops = sortShopsByCreatedAt(
    shopsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })),
  );

  if (!shops.length) {
    const createdShop = await createShop(
      shopkeeperId,
      {
        name: deriveDefaultShopName(userData || {}),
        address: userData?.shop?.address || '',
      },
      { setActive: false },
    );

    shops = [createdShop];
  }

  const activeShopId = userData?.activeShopId;
  const resolvedShopId = shops.some((shop) => shop.id === activeShopId)
    ? activeShopId
    : shops[0]?.id || null;

  if (resolvedShopId) {
    await updateUserActiveShop(shopkeeperId, resolvedShopId);
    const resolvedShop = shops.find((shop) => shop.id === resolvedShopId) || shops[0];
    await migrateLegacyInventoryToShop(shopkeeperId, resolvedShop);
  }

  return {
    shops,
    activeShopId: resolvedShopId,
  };
};

export const subscribeToShops = (shopkeeperId, onData, onError) => {
  return firestore()
    .collection(SHOPS_COLLECTION)
    .where('shopkeeperId', '==', shopkeeperId)
    .onSnapshot(
      (snapshot) => {
        const shops = sortShopsByCreatedAt(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })),
        );
        onData(shops);
      },
      (error) => {
        console.error('subscribeToShops error:', error);
        if (onError) onError(error);
      },
    );
};
