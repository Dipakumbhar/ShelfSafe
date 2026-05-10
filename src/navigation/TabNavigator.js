import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
  Pressable,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../constants/Colors';

// Screens
import DashboardScreen from '../screens/Shopkeeper/DashboardScreen';
import ProductListScreen from '../screens/Shopkeeper/ProductListScreen';
import AddProductScreen from '../screens/Shopkeeper/AddProductScreen';
import ScanProductScreen from '../screens/Shopkeeper/ScanProductScreen';
import ProfileScreen from '../screens/Shopkeeper/ProfileScreen';
import ItemDetailsScreen from '../screens/Shopkeeper/ItemDetailsScreen';

// ─── Lazy Vector Icons ────────────────────────────────────────────────────────
const getMatIcon = () => {
  try {
    return require('react-native-vector-icons/MaterialIcons').default;
  } catch {
    return null;
  }
};

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const TAB_BAR_HEIGHT = 64;

// ─── TAB ICON COMPONENT ───────────────────────────────────────────────────────
const TabIcon = ({ iconName, focused }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: focused ? 1.15 : 1,
      useNativeDriver: true,
      speed: 22,
      bounciness: 6,
    }).start();
  }, [focused, scaleAnim]);

  const MatIcon = getMatIcon();
  const iconColor = focused ? Colors.primary : Colors.textMuted;
  const iconSize = 22;

  const emojiMap = {
    dashboard: '🏠',
    inventory: '📦',
    'add-circle': '➕',
    person: '👤',
  };

  const iconEl = MatIcon ? (
    <MatIcon name={iconName} size={iconSize} color={iconColor} />
  ) : (
    <Text style={{ fontSize: iconSize - 4, color: iconColor }}>
      {emojiMap[iconName] || '•'}
    </Text>
  );

  return (
    <Animated.View
      style={[tabStyles.tabIconWrap, { transform: [{ scale: scaleAnim }] }]}>
      {iconEl}
      {focused && <View style={tabStyles.activeDot} />}
    </Animated.View>
  );
};

// ─── SHARED STACK OPTIONS ─────────────────────────────────────────────────────
const stackOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: Colors.background },
  animation: 'slide_from_right',
};

// ─── NESTED STACKS ────────────────────────────────────────────────────────────
const DashStack = createNativeStackNavigator();
const DashboardStack = () => (
  <DashStack.Navigator screenOptions={stackOptions}>
    <DashStack.Screen name="DashboardScreen" component={DashboardScreen} />
  </DashStack.Navigator>
);

const ProdStack = createNativeStackNavigator();
const ProductsStack = () => (
  <ProdStack.Navigator screenOptions={stackOptions}>
    <ProdStack.Screen name="ProductListScreen" component={ProductListScreen} />
    <ProdStack.Screen name="AddProduct" component={AddProductScreen} />
    <ProdStack.Screen name="ScanProduct" component={ScanProductScreen} />
    <ProdStack.Screen name="ItemDetails" component={ItemDetailsScreen} />
  </ProdStack.Navigator>
);

const AddStack = createNativeStackNavigator();
const AddProductStack = () => (
  <AddStack.Navigator screenOptions={stackOptions}>
    <AddStack.Screen name="AddProductScreen" component={AddProductScreen} />
  </AddStack.Navigator>
);

const ProfileStack = createNativeStackNavigator();
const ProfileStackNavigator = () => (
  <ProfileStack.Navigator screenOptions={stackOptions}>
    <ProfileStack.Screen name="ProfileScreen" component={ProfileScreen} />
  </ProfileStack.Navigator>
);

// ─── BOTTOM TAB NAVIGATOR ─────────────────────────────────────────────────────
const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 8);
  const barHeight = TAB_BAR_HEIGHT + bottomPadding;

  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          ...tabStyles.bar,
          height: barHeight,
          paddingBottom: bottomPadding,
        },
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
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="dashboard" label="Home" focused={focused} />
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

      <Tab.Screen
        name="AddTab"
        component={AddProductStack}
        options={{
          tabBarLabel: 'Add',
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="add-circle" focused={focused} />
          ),
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
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 0,
    paddingTop: 8,
    paddingHorizontal: 4,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 24,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
    letterSpacing: 0.2,
  },


  // Regular tab icon
  tabIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.primary,
    marginTop: 4,
  },
});

export default TabNavigator;
