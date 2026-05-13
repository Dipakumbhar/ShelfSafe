import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { MOCK_SHOPS, MOCK_PRODUCTS } from '../../constants/MockData';
import Colors from '../../constants/Colors';
import Icon from '../../components/Icon';
import ICONS from '../../constants/Icons';

const ShopDetailScreen = ({ route, navigation }) => {
  const { shopId } = route.params;
  const shop = MOCK_SHOPS.find((s) => s.id === shopId);

  if (!shop) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Shop not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show products as if they belong to this shop (mock: filter by index for variety)
  const shopProducts = MOCK_PRODUCTS.slice(0, 3);

  const statusConfig = {
    fresh: { color: Colors.accent, bg: '#EBF9F1', label: 'Fresh' },
    expiring: { color: Colors.warning, bg: '#FFF8E1', label: 'Expiring Soon' },
    expired: { color: Colors.danger, bg: '#FDECEA', label: 'Expired' },
  };

  const isCompliant = shop.expiredItems === 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Shop Banner */}
        <View style={styles.banner}>
          <View style={styles.shopIconBox}>
            <Icon name={ICONS.shop} size={32} color={Colors.white} />
          </View>
          <Text style={styles.shopName}>{shop.name}</Text>
          <Text style={styles.shopOwner}>Owner: {shop.owner}</Text>
          <View style={styles.locationRow}>
            <Icon name={ICONS.location} size={14} color="rgba(255,255,255,0.6)" style={styles.locationIcon} />
            <Text style={styles.shopLocation}>{shop.location}</Text>
          </View>
          <Text style={styles.shopId}>Shop ID: {shop.id}</Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderLeftColor: Colors.primary }]}>
            <Text style={[styles.statValue, { color: Colors.primary }]}>{shop.totalProducts}</Text>
            <Text style={styles.statLabel}>Total Products</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: Colors.warning }]}>
            <Text style={[styles.statValue, { color: Colors.warning }]}>{shop.expiringItems}</Text>
            <Text style={styles.statLabel}>Expiring</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: Colors.danger }]}>
            <Text style={[styles.statValue, { color: Colors.danger }]}>{shop.expiredItems}</Text>
            <Text style={styles.statLabel}>Expired</Text>
          </View>
        </View>

        {/* Compliance Status */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Compliance Status</Text>
          <View style={[
            styles.complianceBadge,
            isCompliant ? styles.complianceBadgeOk : styles.complianceBadgeFail,
          ]}>
            <View style={styles.complianceContent}>
              <Icon
                name={isCompliant ? ICONS.complianceOK : ICONS.complianceFail}
                size={18}
                color={isCompliant ? Colors.accent : Colors.danger}
                style={styles.complianceIcon}
              />
              <Text style={[
                styles.complianceText,
                { color: isCompliant ? Colors.accent : Colors.danger },
              ]}>
                {isCompliant
                  ? 'Compliant — No expired items'
                  : `Non-Compliant — ${shop.expiredItems} expired items found`}
              </Text>
            </View>
          </View>
        </View>

        {/* Sample Product List */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sample Products</Text>
          {shopProducts.map((p) => {
            const config = statusConfig[p.status];
            return (
              <View key={p.id} style={styles.productRow}>
                <View style={styles.productRowLeft}>
                  <Text style={styles.productName}>{p.name}</Text>
                  <Text style={styles.productMeta}>{p.expiryDate} · {p.quantity} {p.unit}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: config.bg }]}>
                  <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Admin Actions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Admin Actions</Text>
          <TouchableOpacity style={styles.actionBtn}>
            <Icon name={ICONS.send} size={16} color={Colors.white} style={styles.actionBtnIcon} />
            <Text style={styles.actionBtnText}>Send Compliance Warning</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnOutline]}>
            <Icon name={ICONS.generateReport} size={16} color={Colors.primary} style={styles.actionBtnIcon} />
            <Text style={[styles.actionBtnText, { color: Colors.primary }]}>Generate Report</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
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
  banner: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  shopIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  shopName: { color: Colors.white, fontSize: 22, fontWeight: '800' },
  shopOwner: { color: 'rgba(255,255,255,0.75)', fontSize: 14, marginTop: 4 },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationIcon: {
    marginRight: 4,
  },
  shopLocation: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  shopId: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    marginTop: 8,
    fontFamily: 'monospace',
  },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
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
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary, marginBottom: 14 },
  complianceBadge: { borderRadius: 10, padding: 14 },
  complianceBadgeOk: { backgroundColor: '#EBF9F1' },
  complianceBadgeFail: { backgroundColor: '#FDECEA' },
  complianceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  complianceIcon: {
    marginRight: 8,
  },
  complianceText: { fontSize: 14, fontWeight: '700' },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  productRowLeft: { flex: 1 },
  productName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  productMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 13,
    borderRadius: 10,
    marginBottom: 10,
  },
  actionBtnOutline: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  actionBtnIcon: {
    marginRight: 8,
  },
  actionBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  backBtnIcon: {
    marginRight: 6,
  },
  backBtnText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '600' },
  notFound: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notFoundText: { color: Colors.textMuted, fontSize: 16 },
});

export default ShopDetailScreen;
