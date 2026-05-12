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
import { useShop } from '../../context/ShopContext';
import useProducts from '../../hooks/useProducts';
import Colors from '../../constants/Colors';
import Icon from '../../components/Icon';
import SummaryCard from '../../components/SummaryCard';
import ShopSwitcher from '../../components/ShopSwitcher';
import ICONS from '../../constants/Icons';

const DashboardScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const {
    shops,
    activeShop,
    activeShopId,
    selectShop,
    loading: shopsLoading,
  } = useShop();
  const { products, loading } = useProducts();

  const total = products.length;
  const expiring = products.filter((product) => product.status === 'expiring').length;
  const expired = products.filter((product) => product.status === 'expired').length;
  const fresh = products.filter((product) => product.status === 'fresh').length;

  const openStoreManager = () => navigation.navigate('Profile', { screen: 'MyShop' });

  if (loading || shopsLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading your stores...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.banner}>
          <View style={styles.bannerCopy}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.email}</Text>
            <Text style={styles.bannerSubtext}>
              {activeShop ? `Active store: ${activeShop.name}` : 'Select a store to work on inventory'}
            </Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.85}>
            <Icon name={ICONS.logout} size={16} color={Colors.white} style={styles.logoutIcon} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <ShopSwitcher
          shops={shops}
          activeShopId={activeShopId}
          onSelect={selectShop}
          onManagePress={openStoreManager}
          subtitle="Each store now has a separate inventory and active store context."
        />

        {!activeShop ? (
          <View style={styles.emptyCard}>
            <Icon name={ICONS.shop} size={30} color={Colors.primary} />
            <Text style={styles.emptyTitle}>No active store selected</Text>
            <Text style={styles.emptyText}>
              Add a store or choose one from the switcher above before managing products.
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={openStoreManager} activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>Manage Stores</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Inventory Summary</Text>
            <Text style={styles.sectionSubtitle}>Viewing stock for {activeShop.name}</Text>
            <View style={styles.statsRow}>
              <SummaryCard label="Total Items" value={total} color={Colors.primary} icon={ICONS.products} />
              <SummaryCard label="Fresh" value={fresh} color={Colors.accent} icon={ICONS.success} />
            </View>
            <View style={styles.statsRow}>
              <SummaryCard label="Expiring Soon" value={expiring} color={Colors.warning} icon={ICONS.warning} />
              <SummaryCard label="Expired" value={expired} color={Colors.danger} icon={ICONS.expiry} />
            </View>

            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('Products')}
              activeOpacity={0.85}>
              <View style={styles.actionBtnIcon}>
                <Icon name={ICONS.products} size={22} color={Colors.primary} />
              </View>
              <View style={styles.actionBtnContent}>
                <Text style={styles.actionBtnTitle}>View Product Inventory</Text>
                <Text style={styles.actionBtnSub}>Browse products saved under {activeShop.name}</Text>
              </View>
              <Icon name={ICONS.forward} size={22} color={Colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('AddTab')}
              activeOpacity={0.85}>
              <View style={[styles.actionBtnIcon, { backgroundColor: '#EBF9F1' }]}>
                <Icon name={ICONS.addProduct} size={22} color={Colors.accent} />
              </View>
              <View style={styles.actionBtnContent}>
                <Text style={styles.actionBtnTitle}>Add New Product</Text>
                <Text style={styles.actionBtnSub}>Save new stock directly into {activeShop.name}</Text>
              </View>
              <Icon name={ICONS.forward} size={22} color={Colors.textMuted} />
            </TouchableOpacity>

            {(expired > 0 || expiring > 0) ? (
              <View style={styles.alertBanner}>
                <Icon name={ICONS.warning} size={20} color="#7D4E00" />
                <Text style={styles.alertText}>
                  {expired > 0 ? `${expired} expired` : ''}
                  {expired > 0 && expiring > 0 ? ' and ' : ''}
                  {expiring > 0 ? `${expiring} expiring soon` : ''}
                  {' '}in {activeShop.name}
                </Text>
              </View>
            ) : null}
          </>
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
    alignItems: 'flex-start',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 18,
  },
  bannerCopy: { flex: 1, paddingRight: 12 },
  welcomeText: { color: 'rgba(255,255,255,0.75)', fontSize: 13 },
  userName: { color: Colors.white, fontSize: 20, fontWeight: '700', marginTop: 2 },
  bannerSubtext: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    marginTop: 6,
    lineHeight: 18,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  logoutIcon: { marginRight: 6 },
  logoutText: { color: Colors.white, fontSize: 13, fontWeight: '600' },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
    marginTop: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: -6,
    marginBottom: 12,
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
  emptyCard: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  primaryBtn: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
});

export default DashboardScreen;
