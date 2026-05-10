import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Pressable,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Searchbar, Chip, Card, ActivityIndicator } from 'react-native-paper';
import Animated, {
  FadeIn,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import useProducts from '../../hooks/useProducts';
import { deleteProduct } from '../../services/productService';
import Colors from '../../constants/Colors';
import AppHeader from '../../components/AppHeader';
import AnimatedScreen from '../../components/AnimatedScreen';
import AnimatedFAB from '../../components/AnimatedFAB';

const statusConfig = {
  fresh: { color: Colors.accent, bg: '#EBF9F1', label: 'Fresh', emoji: '✅' },
  expiring: { color: Colors.warning, bg: '#FFF8E1', label: 'Expiring', emoji: '⏳' },
  expired: { color: Colors.danger, bg: '#FDECEA', label: 'Expired', emoji: '❌' },
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ─── Product Card ───────────────────────────────────────────────────────────
const ProductCard = ({ item, index, onPress }) => {
  const config = statusConfig[item.status];
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 10, stiffness: 300 });
  }, [scale]);

  // Cap the entry animation delay
  const entryDelay = Math.min(index * 60, 480);

  return (
    <Animated.View
      entering={FadeInUp.delay(entryDelay)
        .duration(350)
        .springify()
        .damping(18)}>
      <AnimatedPressable
        onPress={() => onPress(item)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        android_ripple={{
          color: 'rgba(27, 58, 107, 0.06)',
          borderless: false,
        }}
        style={animatedStyle}>
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <View style={styles.cardTop}>
              <View style={styles.cardLeft}>
                <Text style={styles.productName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.category}>{item.category}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
                <Text style={[styles.statusText, { color: config.color }]}>
                  {config.emoji} {config.label}
                </Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.cardBottom}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Qty</Text>
                <Text style={styles.infoValue}>
                  {item.quantity} {item.unit}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Batch</Text>
                <Text style={styles.infoValue}>{item.batchNo || '—'}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Expiry</Text>
                <Text style={[styles.infoValue, { color: config.color }]}>
                  {item.expiryDate}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Days</Text>
                <Text
                  style={[
                    styles.infoValue,
                    { color: config.color, fontWeight: '800' },
                  ]}>
                  {item.daysLeft == null
                    ? '—'
                    : item.daysLeft < 0
                      ? `${Math.abs(item.daysLeft)}d ago`
                      : `${item.daysLeft}d`}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </AnimatedPressable>
    </Animated.View>
  );
};

// ─── Error State ────────────────────────────────────────────────────────────
const ErrorBanner = ({ message, onRetry }) => (
  <Animated.View
    entering={FadeIn.duration(400)}
    style={styles.errorContainer}>
    <View style={styles.errorCard}>
      <Text style={styles.errorIcon}>⚠️</Text>
      <Text style={styles.errorTitle}>Unable to load products</Text>
      <Text style={styles.errorMessage}>{message}</Text>
      {onRetry && (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={onRetry}
          activeOpacity={0.8}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  </Animated.View>
);

// ─── Product List Screen ────────────────────────────────────────────────────
const ProductListScreen = ({ navigation }) => {
  const { products, loading, error, retry } = useProducts();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filters = ['all', 'fresh', 'expiring', 'expired'];

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || p.status === filter;
    return matchSearch && matchFilter;
  });

  const renderProduct = useCallback(({ item, index }) => (
    <ProductCard
      item={item}
      index={index}
      onPress={(product) =>
        navigation.navigate('ItemDetails', { item: product })
      }
    />
  ), [navigation]);

  const keyExtractor = useCallback((item) => item.id, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader title="Product Inventory" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader title="Product Inventory" />
        <ErrorBanner message={error} onRetry={retry} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader title="Product Inventory" />
      <AnimatedScreen>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search products..."
            value={search}
            onChangeText={setSearch}
            style={styles.searchBar}
            inputStyle={styles.searchInput}
            iconColor={Colors.textMuted}
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        {/* Filter Chips */}
        <View style={styles.filterRow}>
          {filters.map((f) => {
            const isActive = filter === f;
            return (
              <Chip
                key={f}
                selected={isActive}
                onPress={() => setFilter(f)}
                style={[
                  styles.filterChip,
                  isActive && styles.filterChipActive,
                ]}
                textStyle={[
                  styles.filterText,
                  isActive && styles.filterTextActive,
                ]}
                mode={isActive ? 'flat' : 'outlined'}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Chip>
            );
          })}
        </View>

        <FlatList
          data={filtered}
          keyExtractor={keyExtractor}
          renderItem={renderProduct}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Animated.View entering={FadeIn.delay(200).duration(400)} style={styles.empty}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyTitle}>
                {products.length === 0 ? 'No products yet' : 'No results'}
              </Text>
              <Text style={styles.emptyText}>
                {products.length === 0
                  ? 'Tap the button below to add your first product!'
                  : 'Try a different search or filter.'}
              </Text>
            </Animated.View>
          }
        />

        {/* Animated Pulsing FAB */}
        <AnimatedFAB
          label="Add Product"
          icon="+"
          onPress={() => navigation.navigate('AddProduct')}
        />
      </AnimatedScreen>
    </SafeAreaView>
  );
};

// ─── STYLES ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 14, fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },

  // Error state
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorCard: {
    backgroundColor: Colors.white,
    borderRadius: 22,
    padding: 36,
    alignItems: 'center',
    width: '100%',
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  errorIcon: { fontSize: 52, marginBottom: 18 },
  errorTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 28,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 13,
    paddingHorizontal: 36,
    borderRadius: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Search
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.divider,
  },
  searchBar: {
    backgroundColor: Colors.background,
    borderRadius: 14,
    elevation: 0,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    fontSize: 14,
    color: Colors.textPrimary,
  },

  // Filters
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.divider,
  },
  filterChip: {
    backgroundColor: Colors.background,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: Colors.white,
    fontWeight: '600',
  },

  // List
  list: { padding: 16, paddingBottom: 120 },

  // Cards
  card: {
    borderRadius: 16,
    marginBottom: 14,
    backgroundColor: Colors.white,
    elevation: 3,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardLeft: { flex: 1, marginRight: 10 },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.1,
  },
  category: { fontSize: 12, color: Colors.textMuted, marginTop: 3, fontWeight: '500' },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.divider,
    marginVertical: 12,
  },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  infoItem: { alignItems: 'center', flex: 1 },
  infoLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600',
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: { fontSize: 13, color: Colors.textPrimary, fontWeight: '600' },

  // Empty state
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 56 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 16,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
  },
});

export default ProductListScreen;
