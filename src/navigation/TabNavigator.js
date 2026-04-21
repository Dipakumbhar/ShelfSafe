import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Colors from '../constants/Colors';

// Screens
import DashboardScreen from '../screens/Shopkeeper/DashboardScreen';
import ProductListScreen from '../screens/Shopkeeper/ProductListScreen';
import AddProductScreen from '../screens/Shopkeeper/AddProductScreen';
import ScanProductScreen from '../screens/Shopkeeper/ScanProductScreen';
import ProfileScreen from '../screens/Shopkeeper/ProfileScreen';

// ─── Lazy Vector Icons ────────────────────────────────────────────────────────
const getMatIcon = () => {
  try {
    return require('react-native-vector-icons/MaterialIcons').default;
  } catch {
    return null;
  }
};

// ─── TAB ICON COMPONENT ───────────────────────────────────────────────────────
const TabIcon = ({ iconName, label, focused, isCenter }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Animate on focus change
  React.useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: focused ? 1.18 : 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
  }, [focused, scaleAnim]);

  const MatIcon = getMatIcon();
  const iconColor = isCenter
    ? Colors.white
    : focused
    ? Colors.primary
    : Colors.textMuted;
  const iconSize = isCenter ? 28 : 24;

  const iconEl = MatIcon ? (
    <MatIcon name={iconName} size={iconSize} color={iconColor} />
  ) : (
    <Text style={{ fontSize: iconSize - 6, color: iconColor }}>
      {{ dashboard: '🏠', inventory: '📦', 'add-circle': '➕', person: '👤' }[iconName] || '•'}
    </Text>
  );

  if (isCenter) {
    return (
      <Animated.View
        style={[
          tabStyles.centerBtn,
          { transform: [{ scale: scaleAnim }] },
          focused && tabStyles.centerBtnFocused,
        ]}>
        {iconEl}
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[tabStyles.tabIconWrap, { transform: [{ scale: scaleAnim }] }]}>
      {iconEl}
      {focused && <View style={tabStyles.activeDot} />}
    </Animated.View>
  );
};

// ─── NESTED STACKS ────────────────────────────────────────────────────────────
const DashStack = createNativeStackNavigator();
const DashboardStack = () => (
  <DashStack.Navigator screenOptions={stackOptions}>
    <DashStack.Screen name="DashboardScreen" component={DashboardScreen} options={{ title: 'Dashboard' }} />
  </DashStack.Navigator>
);

const ProdStack = createNativeStackNavigator();
const ProductsStack = () => (
  <ProdStack.Navigator screenOptions={stackOptions}>
    <ProdStack.Screen name="ProductListScreen" component={ProductListScreen} options={{ title: 'Product Inventory' }} />
    <ProdStack.Screen name="AddProduct" component={AddProductScreen} options={{ title: 'Add New Product' }} />
    <ProdStack.Screen name="ScanProduct" component={ScanProductScreen} options={{ title: 'Scan Product Label' }} />
  </ProdStack.Navigator>
);

const AddStack = createNativeStackNavigator();
const AddProductStack = () => (
  <AddStack.Navigator screenOptions={stackOptions}>
    <AddStack.Screen name="AddProductScreen" component={AddProductScreen} options={{ title: 'Add New Product' }} />
  </AddStack.Navigator>
);

const ProfileStack = createNativeStackNavigator();
const ProfileStackNavigator = () => (
  <ProfileStack.Navigator screenOptions={stackOptions}>
    <ProfileStack.Screen name="ProfileScreen" component={ProfileScreen} options={{ title: 'My Profile' }} />
  </ProfileStack.Navigator>
);

const stackOptions = {
  headerStyle: { backgroundColor: Colors.primary },
  headerTintColor: Colors.white,
  headerTitleStyle: { fontWeight: '700', fontSize: 17 },
  contentStyle: { backgroundColor: Colors.background },
};

// ─── BOTTOM TAB NAVIGATOR ─────────────────────────────────────────────────────
const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: false,
        tabBarStyle: tabStyles.bar,
        tabBarShowLabel: true,
        tabBarLabelStyle: tabStyles.label,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarItemStyle: tabStyles.item,
        tabBarHideOnKeyboard: true,
      }}>

      <Tab.Screen
        name="Dashboard"
        component={DashboardStack}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="dashboard" label="Dashboard" focused={focused} />
          ),
        }}
      />

      <Tab.Screen
        name="Products"
        component={ProductsStack}
        options={{
          tabBarLabel: 'Products',
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="inventory" label="Products" focused={focused} />
          ),
        }}
      />

      {/* CENTER: Add Product */}
      <Tab.Screen
        name="AddTab"
        component={AddProductStack}
        options={{
          tabBarLabel: '',
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="add-circle" label="" focused={focused} isCenter />
          ),
          tabBarItemStyle: tabStyles.centerItem,
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="person" label="Profile" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// ─── STYLES ───────────────────────────────────────────────────────────────────
const tabStyles = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 84 : 64,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 0,
    paddingBottom: Platform.OS === 'ios' ? 20 : 6,
    paddingTop: 6,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  item: {
    paddingTop: 4,
    height: 54,
  },
  centerItem: {
    // Extra top offset so the center button floats above the bar
    marginTop: -24,
    height: 70,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },

  // Center floating button
  centerBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 4,
    borderColor: Colors.white,
  },
  centerBtnFocused: {
    backgroundColor: Colors.primaryLight,
    shadowOpacity: 0.6,
  },

  // Regular tab icon
  tabIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
    marginTop: 3,
  },
});

export default TabNavigator;
