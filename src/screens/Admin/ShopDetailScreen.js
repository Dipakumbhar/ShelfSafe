import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import useAdminInventory from '../../hooks/useAdminInventory';
import Colors from '../../constants/Colors';
import Icon from '../../components/Icon';
import ICONS from '../../constants/Icons';

const statusConfig = {
  fresh: { color: Colors.accent, bg: '#EBF9F1', label: 'Fresh' },
  expiring: { color: Colors.warning, bg: '#FFF8E1', label: 'Expiring Soon' },
  expired: { color: Colors.danger, bg: '#FDECEA', label: 'Expired' },
};

const ShopDetailScreen = ({ route, navigation }) => {
  const { shopkeeperId } = route.params;
  const { shopkeepers, loading } = useAdminInventory();
  const shopkeeper = shopkeepers.find((entry) => entry.id === shopkeeperId);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading shopkeeper profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!shopkeeper) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.notFoundText}>Shopkeeper not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const displayName = shopkeeper.name || 'Shopkeeper Profile';
  const avatarLetter = (displayName || shopkeeper.email || 'S').slice(0, 1).toUpperCase();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.banner}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>{avatarLetter}</Text>
          </View>
          <Text style={styles.bannerTitle}>{displayName}</Text>
          <Text style={styles.bannerSubtitle}>{shopkeeper.email}</Text>
          <Text style={styles.bannerMeta}>Shopkeeper ID: {shopkeeper.id}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderLeftColor: Colors.primary }]}>
            <Text style={[styles.statValue, { color: Colors.primary }]}>{shopkeeper.totalProducts}</Text>
            <Text style={styles.statLabel}>Products</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: Colors.info }]}>
            <Text style={[styles.statValue, { color: Colors.info }]}>{shopkeeper.shopCount}</Text>
            <Text style={styles.statLabel}>Stores</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: Colors.danger }]}>
            <Text style={[styles.statValue, { color: Colors.danger }]}>{shopkeeper.alertCount}</Text>
            <Text style={styles.statLabel}>Alerts</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Stores and Inventory</Text>
          <Text style={styles.sectionSubtitle}>
            Structured as shopkeeper profile to stores to inventory.
          </Text>
        </View>

        {shopkeeper.shops.length ? shopkeeper.shops.map((shop) => {
          const isCompliant = shop.expiredItems === 0;

          return (
            <View key={shop.id} style={styles.card}>
              <View style={styles.shopHeader}>
                <View style={styles.shopHeaderLeft}>
                  <Text style={styles.cardTitle}>{shop.name}</Text>
                  <Text style={styles.shopAddress}>{shop.address || 'No address added'}</Text>
                </View>
                <View style={styles.shopBadges}>
                  {shop.id === shopkeeper.activeShopId ? (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>Active</Text>
                    </View>
                  ) : null}
                  {shop.isLegacy ? (
                    <View style={styles.legacyBadge}>
                      <Text style={styles.legacyBadgeText}>Legacy</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              <View style={styles.shopStatsRow}>
                <View style={styles.shopStatBox}>
                  <Text style={styles.shopStatValue}>{shop.totalProducts}</Text>
                  <Text style={styles.shopStatLabel}>Products</Text>
                </View>
                <View style={styles.shopStatBox}>
                  <Text style={[styles.shopStatValue, { color: Colors.warning }]}>{shop.expiringItems}</Text>
                  <Text style={styles.shopStatLabel}>Expiring</Text>
                </View>
                <View style={styles.shopStatBox}>
                  <Text style={[styles.shopStatValue, { color: Colors.danger }]}>{shop.expiredItems}</Text>
                  <Text style={styles.shopStatLabel}>Expired</Text>
                </View>
              </View>

              <View
                style={[
                  styles.complianceBadge,
                  { backgroundColor: isCompliant ? '#EBF9F1' : '#FDECEA' },
                ]}>
                <Icon
                  name={isCompliant ? ICONS.complianceOK : ICONS.complianceFail}
                  size={16}
                  color={isCompliant ? Colors.accentDark : Colors.danger}
                  style={styles.complianceIcon}
                />
                <Text
                  style={[
                    styles.complianceText,
                    { color: isCompliant ? Colors.accentDark : Colors.danger },
                  ]}>
                  {isCompliant ? 'Compliant inventory' : `${shop.expiredItems} expired items need attention`}
                </Text>
              </View>

              <Text style={styles.inventoryTitle}>Inventory</Text>
              {shop.inventory.length ? shop.inventory.map((product) => {
                const config = statusConfig[product.status];
                return (
                  <View key={product.id} style={styles.productRow}>
                    <View style={styles.productRowLeft}>
                      <Text style={styles.productName}>{product.name}</Text>
                      <Text style={styles.productMeta}>
                        {product.expiryDate} - {product.quantity} {product.unit}
                      </Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: config.bg }]}>
                      <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
                    </View>
                  </View>
                );
              }) : (
                <Text style={styles.emptyInventoryText}>No products stored in this shop yet.</Text>
              )}
            </View>
          );
        }) : (
          <View style={styles.card}>
            <Text style={styles.emptyInventoryText}>No stores available for this shopkeeper yet.</Text>
          </View>
        )}

        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <Icon name={ICONS.back} size={16} color={Colors.textSecondary} style={styles.backBtnIcon} />
          <Text style={styles.backBtnText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: Colors.textSecondary, fontSize: 14 },
  notFoundText: { color: Colors.textMuted, fontSize: 16 },
  banner: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileAvatarText: {
    color: Colors.white,
    fontSize: 28,
    fontWeight: '800',
  },
  bannerTitle: { color: Colors.white, fontSize: 22, fontWeight: '800' },
  bannerSubtitle: { color: 'rgba(255,255,255,0.75)', fontSize: 14, marginTop: 4 },
  bannerMeta: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    marginTop: 8,
    fontFamily: 'monospace',
  },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 3,
  },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2, fontWeight: '500' },
  sectionHeader: { marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  sectionSubtitle: { marginTop: 4, fontSize: 12, color: Colors.textSecondary },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  shopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  shopHeaderLeft: { flex: 1, paddingRight: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.primary, marginBottom: 6 },
  shopAddress: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
  shopBadges: { alignItems: 'flex-end' },
  activeBadge: {
    backgroundColor: '#EEF2FF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
  },
  activeBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.primary },
  legacyBadge: {
    backgroundColor: '#FFF3E0',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  legacyBadgeText: { fontSize: 11, fontWeight: '700', color: '#7D4E00' },
  shopStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.background,
    borderRadius: 10,
    paddingVertical: 12,
    marginBottom: 12,
  },
  shopStatBox: { alignItems: 'center' },
  shopStatValue: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  shopStatLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2, fontWeight: '500' },
  complianceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
  },
  complianceIcon: { marginRight: 8 },
  complianceText: { fontSize: 13, fontWeight: '700' },
  inventoryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  productRowLeft: { flex: 1, paddingRight: 12 },
  productName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  productMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  emptyInventoryText: { fontSize: 13, color: Colors.textSecondary, marginTop: 6 },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  backBtnIcon: { marginRight: 6 },
  backBtnText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '600' },
});

export default ShopDetailScreen;
