import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import useProducts from '../../hooks/useProducts';
import { deleteProduct } from '../../services/productService';
import Colors from '../../constants/Colors';

const statusConfig = {
  fresh: { color: Colors.accent, bg: '#EBF9F1', label: 'Fresh' },
  expiring: { color: Colors.warning, bg: '#FFF8E1', label: 'Expiring Soon' },
  expired: { color: Colors.danger, bg: '#FDECEA', label: 'Expired' },
};

const ProductCard = ({ item, onDelete }) => {
  const config = statusConfig[item.status];

  const handleDelete = () => {
    Alert.alert(
      'Delete Product',
      `Remove "${item.name}" from inventory?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(item.id);
            } catch (err) {
              Alert.alert('Error', 'Failed to delete product.');
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardLeft}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.category}>{item.category}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
          <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.cardBottom}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Qty</Text>
          <Text style={styles.infoValue}>{item.quantity} {item.unit}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Batch</Text>
          <Text style={styles.infoValue}>{item.batchNo || '—'}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Expiry</Text>
          <Text style={[styles.infoValue, { color: config.color }]}>{item.expiryDate}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Days Left</Text>
          <Text style={[styles.infoValue, { color: config.color, fontWeight: '700' }]}>
            {item.daysLeft == null
              ? '—'
              : item.daysLeft < 0
                ? `${Math.abs(item.daysLeft)}d ago`
                : `${item.daysLeft}d`}
          </Text>
        </View>
      </View>
      <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
        <Text style={styles.deleteBtnText}>🗑 Remove</Text>
      </TouchableOpacity>
    </View>
  );
};

const ProductListScreen = ({ navigation }) => {
  const { products, loading } = useProducts();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filters = ['all', 'fresh', 'expiring', 'expired'];

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || p.status === filter;
    return matchSearch && matchFilter;
  });

  if (loading) {
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
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter Pills */}
      <View style={styles.filterRow}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterPill, filter === f && styles.filterPillActive]}
            onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ProductCard item={item} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyText}>
              {products.length === 0
                ? 'No products yet. Add your first product!'
                : 'No products match your search.'}
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddTab')}>
        <Text style={styles.fabText}>+ Add Product</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: Colors.textSecondary },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  searchInput: {
    backgroundColor: Colors.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: Colors.white,
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
  card: {
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
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLeft: { flex: 1 },
  productName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  category: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },
  divider: { height: 1, backgroundColor: Colors.divider, marginVertical: 12 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  infoItem: { alignItems: 'center' },
  infoLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '500', marginBottom: 2 },
  infoValue: { fontSize: 13, color: Colors.textPrimary, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48 },
  emptyText: { color: Colors.textMuted, fontSize: 15, marginTop: 10 },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  deleteBtn: {
    alignSelf: 'flex-end',
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  deleteBtnText: { fontSize: 12, color: Colors.danger, fontWeight: '600' },
});

export default ProductListScreen;
