import React, { useCallback, useState } from 'react';
import {
  Alert,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import useProducts from '../../hooks/useProducts';
import { useShop } from '../../context/ShopContext';
import { deleteProduct } from '../../services/productService';
import Colors from '../../constants/Colors';
import Icon from '../../components/Icon';
import ProductCard from '../../components/ProductCard';
import ShopSwitcher from '../../components/ShopSwitcher';
import ICONS from '../../constants/Icons';

const ProductListScreen = ({ navigation }) => {
  const {
    shops,
    activeShop,
    activeShopId,
    selectShop,
    loading: shopsLoading,
  } = useShop();
  const { products, loading } = useProducts();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filters = ['all', 'fresh', 'expiring', 'expired'];
  const openStoreManager = () => navigation.navigate('Profile', { screen: 'MyShop' });

  const filtered = products.filter((product) => {
    const matchSearch = product.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || product.status === filter;
    return matchSearch && matchFilter;
  });

  const handleDelete = useCallback(async (productId) => {
    try {
      await deleteProduct(productId);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete product.');
    }
  }, []);

  const handleEdit = useCallback((product) => {
    navigation.navigate('EditProduct', { product });
  }, [navigation]);

  const renderItem = useCallback(({ item }) => (
    <ProductCard item={item} onDelete={handleDelete} onEdit={handleEdit} />
  ), [handleDelete, handleEdit]);

  const keyExtractor = useCallback((item) => item.id, []);

  if (loading || shopsLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerArea}>
        <ShopSwitcher
          shops={shops}
          activeShopId={activeShopId}
          onSelect={selectShop}
          onManagePress={openStoreManager}
          subtitle="Only the selected store's inventory is shown below."
        />

        {activeShop ? (
          <>
            <View style={styles.searchContainer}>
              <View style={styles.searchRow}>
                <Icon name={ICONS.search} size={18} color={Colors.textMuted} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder={`Search in ${activeShop.name}`}
                  placeholderTextColor={Colors.textMuted}
                  value={search}
                  onChangeText={setSearch}
                />
              </View>
            </View>

            <View style={styles.filterRow}>
              {filters.map((entry) => (
                <TouchableOpacity
                  key={entry}
                  style={[styles.filterPill, filter === entry && styles.filterPillActive]}
                  onPress={() => setFilter(entry)}
                  activeOpacity={0.85}>
                  <Text style={[styles.filterText, filter === entry && styles.filterTextActive]}>
                    {entry.charAt(0).toUpperCase() + entry.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <View style={styles.emptyStoreCard}>
            <Text style={styles.emptyStoreTitle}>Choose a store first</Text>
            <Text style={styles.emptyStoreText}>
              Inventory is separated by store, so select an active store before browsing products.
            </Text>
            <TouchableOpacity style={styles.manageBtn} onPress={openStoreManager} activeOpacity={0.85}>
              <Text style={styles.manageBtnText}>Manage Stores</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <FlatList
        data={activeShop ? filtered : []}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={(
          <View style={styles.empty}>
            <Icon name={ICONS.empty} size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>
              {!activeShop
                ? 'No active store selected yet.'
                : products.length === 0
                  ? `No products in ${activeShop.name} yet.`
                  : 'No products match your search.'}
            </Text>
          </View>
        )}
      />

      <TouchableOpacity
        style={[styles.fab, !activeShop && styles.fabDisabled]}
        onPress={() => (activeShop ? navigation.navigate('AddTab') : openStoreManager())}
        activeOpacity={0.85}>
        <Icon name={ICONS.add} size={18} color={Colors.white} />
        <Text style={styles.fabText}>{activeShop ? 'Add Product' : 'Add Store'}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: Colors.textSecondary },
  headerArea: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: { marginLeft: 12 },
  searchInput: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  filterTextActive: { color: Colors.white, fontWeight: '600' },
  list: { padding: 16, paddingBottom: 100 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 15,
    marginTop: 10,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    gap: 6,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  fabDisabled: {
    backgroundColor: Colors.textSecondary,
  },
  fabText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  emptyStoreCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  emptyStoreTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  emptyStoreText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
  manageBtn: {
    alignSelf: 'flex-start',
    marginTop: 14,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  manageBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
});

export default ProductListScreen;
