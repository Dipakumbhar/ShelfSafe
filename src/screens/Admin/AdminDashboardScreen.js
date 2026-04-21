import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { MOCK_SHOPS } from '../../constants/MockData';
import Colors from '../../constants/Colors';

const OverviewCard = ({ label, value, color, icon }) => (
  <View style={[styles.overviewCard, { borderLeftColor: color }]}>
    <Text style={styles.overviewIcon}>{icon}</Text>
    <Text style={[styles.overviewValue, { color }]}>{value}</Text>
    <Text style={styles.overviewLabel}>{label}</Text>
  </View>
);

const ShopCard = ({ item, onPress }) => {
  const hasIssues = item.expiredItems > 0 || item.expiringItems > 0;
  return (
    <TouchableOpacity style={styles.shopCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.shopCardHeader}>
        <View style={styles.shopIconBox}>
          <Text style={styles.shopIcon}>🏪</Text>
        </View>
        <View style={styles.shopInfo}>
          <Text style={styles.shopName}>{item.name}</Text>
          <Text style={styles.shopOwner}>{item.owner}</Text>
          <Text style={styles.shopLocation}>📍 {item.location}</Text>
        </View>
        {hasIssues && (
          <View style={styles.alertDot} />
        )}
      </View>
      <View style={styles.shopStats}>
        <View style={styles.shopStat}>
          <Text style={styles.shopStatVal}>{item.totalProducts}</Text>
          <Text style={styles.shopStatLabel}>Total</Text>
        </View>
        <View style={styles.shopStat}>
          <Text style={[styles.shopStatVal, { color: Colors.warning }]}>{item.expiringItems}</Text>
          <Text style={styles.shopStatLabel}>Expiring</Text>
        </View>
        <View style={styles.shopStat}>
          <Text style={[styles.shopStatVal, { color: Colors.danger }]}>{item.expiredItems}</Text>
          <Text style={styles.shopStatLabel}>Expired</Text>
        </View>
      </View>
      <Text style={styles.viewDetail}>View Details  →</Text>
    </TouchableOpacity>
  );
};

const AdminDashboardScreen = ({ navigation }) => {
  const { user, logout } = useAuth();

  const totalProducts = MOCK_SHOPS.reduce((s, sh) => s + sh.totalProducts, 0);
  const totalExpired = MOCK_SHOPS.reduce((s, sh) => s + sh.expiredItems, 0);
  const totalExpiring = MOCK_SHOPS.reduce((s, sh) => s + sh.expiringItems, 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Admin Banner */}
        <View style={styles.banner}>
          <View>
            <Text style={styles.roleTag}>ADMINISTRATOR</Text>
            <Text style={styles.adminName}>Admin Panel</Text>
            <Text style={styles.adminEmail}>{user?.email}</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Platform Overview */}
        <Text style={styles.sectionTitle}>Platform Overview</Text>
        <View style={styles.overviewRow}>
          <OverviewCard label="Shops" value={MOCK_SHOPS.length} color={Colors.primary} icon="🏪" />
          <OverviewCard label="Products" value={totalProducts} color={Colors.info} icon="📦" />
          <OverviewCard label="Alerts" value={totalExpired + totalExpiring} color={Colors.danger} icon="⚠️" />
        </View>

        {/* Shops List */}
        <Text style={styles.sectionTitle}>Registered Shops</Text>
        {MOCK_SHOPS.map((shop) => (
          <ShopCard
            key={shop.id}
            item={shop}
            onPress={() => navigation.navigate('ShopDetail', { shopId: shop.id })}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { padding: 20, paddingBottom: 40 },
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
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  logoutText: { color: Colors.white, fontSize: 13, fontWeight: '600' },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
    marginTop: 4,
  },
  overviewRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  overviewCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 3,
  },
  overviewIcon: { fontSize: 20, marginBottom: 6 },
  overviewValue: { fontSize: 22, fontWeight: '800' },
  overviewLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2, fontWeight: '500' },
  shopCard: {
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
  shopCardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  shopIconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  shopIcon: { fontSize: 22 },
  shopInfo: { flex: 1 },
  shopName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  shopOwner: { fontSize: 13, color: Colors.textSecondary, marginTop: 1 },
  shopLocation: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  alertDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.danger,
    marginTop: 4,
  },
  shopStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.background,
    borderRadius: 10,
    paddingVertical: 12,
    marginBottom: 12,
  },
  shopStat: { alignItems: 'center' },
  shopStatVal: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  shopStatLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2, fontWeight: '500' },
  viewDetail: {
    textAlign: 'right',
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '700',
  },
});

export default AdminDashboardScreen;
