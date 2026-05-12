import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useShop } from '../../context/ShopContext';
import Colors from '../../constants/Colors';
import Icon from '../../components/Icon';
import ICONS from '../../constants/Icons';

const EMPTY_FORM = {
  name: '',
  address: '',
};

const MyShopScreen = () => {
  const {
    shops,
    activeShopId,
    activeShop,
    loading,
    createShop,
    updateShop,
    selectShop,
  } = useShop();

  const [editingShopId, setEditingShopId] = useState(null);
  const [shopName, setShopName] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [saving, setSaving] = useState(false);

  const editingShop = shops.find((shop) => shop.id === editingShopId) || null;

  const resetForm = () => {
    setEditingShopId(null);
    setShopName(EMPTY_FORM.name);
    setShopAddress(EMPTY_FORM.address);
  };

  const startEditing = (shop) => {
    setEditingShopId(shop.id);
    setShopName(shop.name || '');
    setShopAddress(shop.address || '');
  };

  const handleSave = async () => {
    if (!shopName.trim()) {
      Alert.alert('Store Name Required', 'Please enter a name for this store.');
      return;
    }

    setSaving(true);
    try {
      if (editingShopId) {
        await updateShop(editingShopId, { name: shopName, address: shopAddress });
        Alert.alert('Store Updated', `"${shopName.trim()}" has been updated.`);
      } else {
        await createShop({ name: shopName, address: shopAddress });
        Alert.alert('Store Added', `"${shopName.trim()}" is ready for separate inventory.`);
      }
      resetForm();
    } catch (error) {
      console.error('[MyShopScreen] Failed to save store:', error);
      Alert.alert('Error', 'Failed to save store details.');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectShop = async (shopId) => {
    try {
      await selectShop(shopId);
    } catch (error) {
      console.error('[MyShopScreen] Failed to switch store:', error);
      Alert.alert('Error', 'Failed to switch the active store.');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroCopy}>
              <Text style={styles.heroEyebrow}>MULTI-STORE MODE</Text>
              <Text style={styles.heroTitle}>Manage all your stores</Text>
              <Text style={styles.heroSubtitle}>
                Every store now keeps its own inventory. The active store is used in dashboard, product list, and add product screens.
              </Text>
            </View>
            <View style={styles.heroCountPill}>
              <Text style={styles.heroCountValue}>{shops.length}</Text>
              <Text style={styles.heroCountLabel}>Stores</Text>
            </View>
          </View>

          <View style={styles.activeStorePanel}>
            <Icon name={ICONS.shop} size={18} color={Colors.primary} />
            <View style={styles.activeStoreCopy}>
              <Text style={styles.activeStoreLabel}>Active Store</Text>
              <Text style={styles.activeStoreName}>
                {activeShop ? activeShop.name : 'No store selected'}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Your Stores</Text>
        {shops.length ? shops.map((shop) => {
          const isActive = shop.id === activeShopId;
          const isEditing = shop.id === editingShopId;

          return (
            <View key={shop.id} style={styles.storeCard}>
              <View style={styles.storeHeader}>
                <View style={styles.storeIconBox}>
                  <Icon name={ICONS.shop} size={20} color={Colors.primary} />
                </View>
                <View style={styles.storeInfo}>
                  <Text style={styles.storeName}>{shop.name}</Text>
                  <Text style={styles.storeAddress}>{shop.address || 'No address added yet'}</Text>
                </View>
                {isActive ? (
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>Active</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.storeActions}>
                <TouchableOpacity
                  style={[
                    styles.storeActionBtn,
                    isActive && styles.storeActionBtnDisabled,
                  ]}
                  disabled={isActive}
                  onPress={() => handleSelectShop(shop.id)}
                  activeOpacity={0.85}>
                  <Text
                    style={[
                      styles.storeActionText,
                      isActive && styles.storeActionTextDisabled,
                    ]}>
                    {isActive ? 'Currently Active' : 'Use for Inventory'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.storeActionBtn, styles.storeActionSecondary]}
                  onPress={() => startEditing(shop)}
                  activeOpacity={0.85}>
                  <Text style={styles.storeActionSecondaryText}>
                    {isEditing ? 'Editing Now' : 'Edit Store'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No stores added yet</Text>
            <Text style={styles.emptyText}>
              Add your first store below to start keeping inventory separately for each location.
            </Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>{editingShop ? 'Edit Store' : 'Add New Store'}</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Store Name</Text>
          <View style={styles.inputRow}>
            <Icon name={ICONS.shop} size={18} color={Colors.textMuted} style={styles.icon} />
            <TextInput
              style={styles.input}
              value={shopName}
              onChangeText={setShopName}
              placeholder="e.g. Super Mart - Branch 2"
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          <Text style={styles.label}>Store Address</Text>
          <View style={styles.inputRow}>
            <Icon name={ICONS.location} size={18} color={Colors.textMuted} style={styles.icon} />
            <TextInput
              style={[styles.input, styles.textArea]}
              value={shopAddress}
              onChangeText={setShopAddress}
              placeholder="Enter store address"
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}>
            {saving ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <Text style={styles.saveBtnText}>
                {editingShop ? 'Save Store Changes' : 'Add Store'}
              </Text>
            )}
          </TouchableOpacity>

          {editingShop ? (
            <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}>
              <Text style={styles.cancelBtnText}>Cancel Editing</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 16, paddingBottom: 40 },
  heroCard: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  heroCopy: { flex: 1, paddingRight: 8 },
  heroEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1.4,
  },
  heroTitle: {
    marginTop: 6,
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
  },
  heroSubtitle: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.72)',
  },
  heroCountPill: {
    minWidth: 78,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
  },
  heroCountValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
  },
  heroCountLabel: {
    marginTop: 2,
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },
  activeStorePanel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    borderRadius: 14,
    padding: 14,
    backgroundColor: Colors.white,
  },
  activeStoreCopy: { marginLeft: 10, flex: 1 },
  activeStoreLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  activeStoreName: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  storeCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  storeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  storeInfo: { flex: 1 },
  storeName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  storeAddress: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textSecondary,
  },
  activeBadge: {
    backgroundColor: '#E8F6EE',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.accentDark,
  },
  storeActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  storeActionBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  storeActionBtnDisabled: {
    backgroundColor: '#D8E2F2',
  },
  storeActionText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  storeActionTextDisabled: {
    color: Colors.primary,
  },
  storeActionSecondary: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  storeActionSecondaryText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 18,
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
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
    marginTop: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
  },
  icon: { marginRight: 8 },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 18,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 6,
  },
  cancelBtnText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default MyShopScreen;
