import React from 'react';
import TabNavigator from './TabNavigator';

/**
 * ShopkeeperNavigator
 *
 * Delegates entirely to TabNavigator which provides the bottom tab shell
 * (Dashboard / Products / Add Product / Profile).
 * Deep-link screens (AddProduct, ScanProduct) are nested inside the
 * Products tab stack within TabNavigator.
 */
const ShopkeeperNavigator = () => <TabNavigator />;

export default ShopkeeperNavigator;
