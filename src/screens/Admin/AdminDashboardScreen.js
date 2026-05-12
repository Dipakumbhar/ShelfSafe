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
import useAdminInventory from '../../hooks/useAdminInventory';
import Colors from '../../constants/Colors';
import Icon from '../../components/Icon';
import ICONS from '../../constants/Icons';

const OverviewCard = ({ label, value, color, icon }) => (
  <View style={[styles.overviewCard, { borderTopColor: color }]}>
    <Icon name={icon} size={20} color={color} style={styles.overviewIconStyle} />
    <Text style={[styles.overviewValue, { color }]}>{value}</Text>
    <Text style={styles.overviewLabel}>{label}</Text>
  </View>
);

const ShopkeeperCard = ({ item, onPress }) => {
  const displayName = item.name || 'Shopkeeper';
  const avatarLetter = (displayName || item.email || 'S').slice(0, 1).toUpperCase();

  return (
    <View style={styles.shopkeeperCard}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarBox}>
          <Text style={styles.avatarText}>{avatarLetter}</Text>
        </View>
        <View style={styles.profileCopy}>
          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileEmail}>{item.email}</Text>
          <Text style={styles.profileMeta}>
            {item.shopCount} stores and {item.totalProducts} products
          </Text>
        </View>
        {item.alertCount ? (
          <View style={styles.alertPill}>
            <Text style={styles.alertPillText}>{item.alertCount} alerts</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{item.shopCount}</Text>
          <Text style={styles.statLabel}>Stores</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: Colors.warning }]}>{item.expiringItems}</Text>
          <Text style={styles.statLabel}>Expiring</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: Colors.danger }]}>{item.expiredItems}</Text>
          <Text style={styles.statLabel}>Expired</Text>
        </View>
      </View>

      <Text style={styles.nestedTitle}>Stores</Text>
      {item.shops.length ? item.shops.map((shop) => (
        <TouchableOpacity
          key={shop.id}
          style={styles.shopRow}
          onPress={onPress}
          activeOpacity={0.85}>
          <View style={styles.shopRowLeft}>
            <Text style={styles.shopName}>{shop.name}</Text>
            <Text style={styles.shopMeta}>
              {shop.address || 'No address added'}
              {shop.id === item.activeShopId ? ' - Active' : ''}
            </Text>
          </View>
          <View style={styles.shopRowRight}>
            <Text style={styles.shopCount}>{shop.totalProducts}</Text>
            <Text style={styles.shopCountLabel}>items</Text>
          </View>
        </TouchableOpacity>
      )) : (
        <Text style={styles.emptyNestedText}>No stores available yet.</Text>
      )}

      <View style={styles.footerRow}>
        <TouchableOpacity style={styles.detailBtn} onPress={onPress} activeOpacity={0.85}>
          <Text style={styles.detailBtnText}>Open Full Profile</Text>
          <Icon name={ICONS.forward} size={16} color={Colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const AdminDashboardScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { shopkeepers, summary, loading, error } = useAdminInventory();

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading shopkeepers...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.banner}>
          <View>
            <Text style={styles.roleTag}>ADMINISTRATOR</Text>
            <Text style={styles.adminName}>Admin Panel</Text>
            <Text style={styles.adminEmail}>{user?.email}</Text>
          </View>
          <View style={styles.bannerActions}>
            <TouchableOpacity
              style={styles.profileBtn}
              onPress={() => navigation.navigate('AdminProfile')}
              activeOpacity={0.85}>
              <Icon name={ICONS.profile} size={14} color={Colors.white} style={styles.logoutIcon} />
              <Text style={styles.logoutText}>Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.85}>
              <Icon name={ICONS.logout} size={14} color={Colors.white} style={styles.logoutIcon} />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Platform Overview</Text>
        <View style={styles.overviewGrid}>
          <OverviewCard label="Shopkeepers" value={summary.totalShopkeepers} color={Colors.primary} icon={ICONS.profile} />
          <OverviewCard label="Stores" value={summary.totalShops} color={Colors.info} icon={ICONS.shop} />
          <OverviewCard label="Products" value={summary.totalProducts} color={Colors.accent} icon={ICONS.products} />
          <OverviewCard label="Alerts" value={summary.totalAlerts} color={Colors.danger} icon={ICONS.warning} />
        </View>

        <Text style={styles.sectionTitle}>Shopkeeper Hierarchy</Text>
        <Text style={styles.sectionSubtitle}>
          Live Firestore view of shopkeeper profile to stores to inventory.
        </Text>

        {error ? (
          <View style={styles.errorBanner}>
            <Icon name={ICONS.warning} size={16} color={Colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {shopkeepers.length ? shopkeepers.map((shopkeeper) => (
          <ShopkeeperCard
            key={shopkeeper.id}
            item={shopkeeper}
            onPress={() => navigation.navigate('ShopDetail', { shopkeeperId: shopkeeper.id })}
          />
        )) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No shopkeepers found</Text>
            <Text style={styles.emptyText}>
              Shopkeeper accounts will appear here once they sign up and sync to Firestore.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { padding: 20, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: Colors.textSecondary, fontSize: 14 },
  banner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: Colors.primaryDark,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  roleTag: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  adminName: { color: Colors.white, fontSize: 20, fontWeight: '700' },
  adminEmail: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },
  bannerActions: {
    alignItems: 'flex-end',
  },
  profileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    marginBottom: 8,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
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
    marginTop: -4,
    marginBottom: 12,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  overviewCard: {
    width: '48%',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderTopWidth: 4,
    marginBottom: 10,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 3,
  },
  overviewIconStyle: { marginBottom: 6 },
  overviewValue: { fontSize: 22, fontWeight: '800' },
  overviewLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2, fontWeight: '500' },
  shopkeeperCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatarBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '800',
  },
  profileCopy: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  profileEmail: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  profileMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  alertPill: {
    backgroundColor: '#FDECEA',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  alertPillText: { fontSize: 11, fontWeight: '700', color: Colors.danger },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.background,
    borderRadius: 10,
    paddingVertical: 12,
    marginBottom: 12,
  },
  statBox: { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2, fontWeight: '500' },
  nestedTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  shopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  shopRowLeft: { flex: 1, paddingRight: 12 },
  shopName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  shopMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 3 },
  shopRowRight: { alignItems: 'flex-end' },
  shopCount: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  shopCountLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  emptyNestedText: { fontSize: 13, color: Colors.textSecondary },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailBtnText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '700',
    marginRight: 4,
  },
  emptyCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  errorText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: Colors.danger,
  },
});

export default AdminDashboardScreen;
