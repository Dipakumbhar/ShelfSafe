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
import Icon from '../../components/Icon';
import SummaryCard from '../../components/SummaryCard';
import ICONS from '../../constants/Icons';

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
          <View style={styles.bannerContent}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">
              {user?.email}
            </Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Icon name={ICONS.logout} size={16} color={Colors.white} style={styles.logoutIcon} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Summary Section */}
        <Text style={styles.sectionTitle}>Inventory Summary</Text>
        <View style={styles.statsRow}>
          <SummaryCard label="Total Items" value={total} color={Colors.primary} icon={ICONS.products} />
          <SummaryCard label="Fresh" value={fresh} color={Colors.accent} icon={ICONS.success} />
        </View>
        <View style={styles.statsRow}>
          <SummaryCard label="Expiring Soon" value={expiring} color={Colors.warning} icon={ICONS.warning} />
          <SummaryCard label="Expired" value={expired} color={Colors.danger} icon={ICONS.expiry} />
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('Products')}>
          <View style={styles.actionBtnIcon}>
            <Icon name={ICONS.products} size={22} color={Colors.primary} />
          </View>
          <View style={styles.actionBtnContent}>
            <Text style={styles.actionBtnTitle}>View Product Inventory</Text>
            <Text style={styles.actionBtnSub}>Browse all products &amp; expiry dates</Text>
          </View>
          <Icon name={ICONS.forward} size={22} color={Colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('AddTab')}>
          <View style={[styles.actionBtnIcon, styles.actionBtnIconAccent]}>
            <Icon name={ICONS.addProduct} size={22} color={Colors.accent} />
          </View>
          <View style={styles.actionBtnContent}>
            <Text style={styles.actionBtnTitle}>Add New Product</Text>
            <Text style={styles.actionBtnSub}>Scan or enter product details</Text>
          </View>
          <Icon name={ICONS.forward} size={22} color={Colors.textMuted} />
        </TouchableOpacity>

        {/* Alert Banner */}
        {(expired > 0 || expiring > 0) && (
          <View style={styles.alertBanner}>
            <Icon name={ICONS.warning} size={20} color="#7D4E00" />
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
  },
  bannerContent: {
    flex: 1,
    minWidth: 0,
    marginRight: 12,
    justifyContent: 'center',
  },
  welcomeText: { color: 'rgba(255,255,255,0.75)', fontSize: 13 },
  userName: { color: Colors.white, fontSize: 20, fontWeight: '700', marginTop: 2, flexShrink: 1 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  logoutIcon: {
    marginRight: 6,
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
  actionBtnIconAccent: { backgroundColor: '#EBF9F1' },
  actionBtnContent: { flex: 1 },
  actionBtnTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  actionBtnSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
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
  alertText: { flex: 1, color: '#7D4E00', fontSize: 13, fontWeight: '600' },
});

export default DashboardScreen;
