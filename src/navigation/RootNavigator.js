import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import ShopkeeperNavigator from './ShopkeeperNavigator';
import AdminNavigator from './AdminNavigator';
import Colors from '../constants/Colors';

const Stack = createNativeStackNavigator();

const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <View style={styles.logoBox}>
      <Text style={styles.logoText}>SS</Text>
    </View>
    <Text style={styles.loadingTitle}>ShelfSafe</Text>
    <ActivityIndicator
      size="large"
      color={Colors.white}
      style={styles.spinner}
    />
    <Text style={styles.loadingSubtitle}>Loading your account...</Text>
  </View>
);

const RootNavigator = () => {
  const { isAuthenticated, loading, user } = useAuth();

  // Show loading screen while Firebase checks auth state
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : user?.role === 'admin' ? (
        <Stack.Screen name="AdminApp" component={AdminNavigator} />
      ) : (
        <Stack.Screen name="ShopkeeperApp" component={ShopkeeperNavigator} />
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 22,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  logoText: { fontSize: 32, fontWeight: '800', color: Colors.primary },
  loadingTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.5,
    marginBottom: 24,
  },
  spinner: { marginBottom: 16 },
  loadingSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
});

export default RootNavigator;
