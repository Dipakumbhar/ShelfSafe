import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import useProducts from '../../hooks/useProducts';
import Colors from '../../constants/Colors';

const StatCard = ({ label, value, color }) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const DashboardScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { products, loading } = useProducts();

  const total = products.length;
  const expiring = products.filter((p) => p.status === 'expiring').length;
  const expired = products.filter((p) => p.status === 'expired').length;
  const fresh = products.filter((p) => p.status === 'fresh').length;

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading inventory...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Welcome Banner */}
        <View style={styles.banner}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.email}</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Summary Section */}
        <Text style={styles.sectionTitle}>Inventory Summary</Text>
        <View style={styles.statsRow}>
          <StatCard label="Total Items" value={total} color={Colors.primary} />
          <StatCard label="Fresh" value={fresh} color={Colors.accent} />
        </View>
        <View style={styles.statsRow}>
          <StatCard label="Expiring Soon" value={expiring} color={Colors.warning} />
          <StatCard label="Expired" value={expired} color={Colors.danger} />
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('Products')}>
          <View style={styles.actionBtnIcon}>
            <Text style={styles.actionIcon}>📦</Text>
          </View>
          <View style={styles.actionBtnContent}>
            <Text style={styles.actionBtnTitle}>View Product Inventory</Text>
            <Text style={styles.actionBtnSub}>Browse all products &amp; expiry dates</Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('AddTab')}>
          <View style={[styles.actionBtnIcon, { backgroundColor: '#EBF9F1' }]}>
            <Text style={styles.actionIcon}>➕</Text>
          </View>
          <View style={styles.actionBtnContent}>
            <Text style={styles.actionBtnTitle}>Add New Product</Text>
            <Text style={styles.actionBtnSub}>Scan or enter product details</Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>

        {/* Alert Banner */}
        {(expired > 0 || expiring > 0) && (
          <View style={styles.alertBanner}>
            <Text style={styles.alertIcon}>⚠️</Text>
            <Text style={styles.alertText}>
              {expired > 0 ? `${expired} expired` : ''}
              {expired > 0 && expiring > 0 ? ' · ' : ''}
              {expiring > 0 ? `${expiring} expiring soon` : ''} — Take action now
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { padding: 20, paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: Colors.textSecondary },
  banner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  welcomeText: { color: 'rgba(255,255,255,0.75)', fontSize: 13 },
  userName: { color: Colors.white, fontSize: 20, fontWeight: '700', marginTop: 2 },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  logoutText: { color: Colors.white, fontSize: 13, fontWeight: '600' },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
    marginTop: 4,
  },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  statValue: { fontSize: 28, fontWeight: '800' },
  statLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 4, fontWeight: '500' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  actionBtnIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  actionIcon: { fontSize: 22 },
  actionBtnContent: { flex: 1 },
  actionBtnTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  actionBtnSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  actionArrow: { fontSize: 22, color: Colors.textMuted },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
    gap: 10,
  },
  alertIcon: { fontSize: 20 },
  alertText: { flex: 1, color: '#7D4E00', fontSize: 13, fontWeight: '600' },
});

export default DashboardScreen;
