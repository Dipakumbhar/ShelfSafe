import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Colors from '../constants/Colors';
import AdminDashboardScreen from '../screens/Admin/AdminDashboardScreen';
import ShopDetailScreen from '../screens/Admin/ShopDetailScreen';

const Stack = createNativeStackNavigator();

const AdminNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primaryDark },
        headerTintColor: Colors.textOnPrimary,
        headerTitleStyle: { fontWeight: '600', fontSize: 18 },
        contentStyle: { backgroundColor: Colors.background },
      }}>
      <Stack.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{ title: 'Admin Control Panel' }}
      />
      <Stack.Screen
        name="ShopDetail"
        component={ShopDetailScreen}
        options={{ title: 'Shop Details' }}
      />
    </Stack.Navigator>
  );
};

export default AdminNavigator;
