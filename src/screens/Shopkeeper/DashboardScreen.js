import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useAuth } from '../../context/AuthContext';
import useProducts from '../../hooks/useProducts';
import Colors from '../../constants/Colors';
import AppHeader from '../../components/AppHeader';
import AnimatedScreen from '../../components/AnimatedScreen';
import AnimatedCard from '../../components/AnimatedCard';
import AnimatedButton from '../../components/AnimatedButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Stat Card ──────────────────────────────────────────────────────────────
const StatCard = ({ label, value, color, index }) => (
  <AnimatedCard index={index} style={[styles.statCard, { borderLeftColor: color }]}>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </AnimatedCard>
);

// ─── Error State ────────────────────────────────────────────────────────────
const ErrorBanner = ({ message, onRetry }) => (
  <Animated.View
    entering={FadeIn.duration(400)}
    style={styles.errorContainer}>
    <View style={styles.errorCard}>
      <Text style={styles.errorIcon}>⚠️</Text>
      <Text style={styles.errorTitle}>Something went wrong</Text>
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

// ─── Dashboard Screen ───────────────────────────────────────────────────────
const DashboardScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { products, loading, error, retry } = useProducts();

  // Memoize stats to avoid recalculating on every render
  const stats = useMemo(() => {
    const total = products.length;
    const expiring = products.filter((p) => p.status === 'expiring').length;
    const expired = products.filter((p) => p.status === 'expired').length;
    const fresh = products.filter((p) => p.status === 'fresh').length;
    return { total, expiring, expired, fresh };
  }, [products]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader title="Expiry Tracker" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading inventory...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader
          title="Expiry Tracker"
          rightActions={[{ icon: 'logout', onPress: logout }]}
        />
        <ErrorBanner message={error} onRetry={retry} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title="Expiry Tracker"
        rightActions={[{ icon: 'logout', onPress: logout }]}
      />
      <AnimatedScreen>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}>

          {/* Welcome Banner */}
          <AnimatedCard index={0}>
            <View style={styles.banner}>
              <View style={styles.bannerCircle1} />
              <View style={styles.bannerCircle2} />
              <View style={styles.bannerContent}>
                <Text style={styles.welcomeText}>Welcome back,</Text>
                <Text style={styles.userName} numberOfLines={1}>
                  {user?.email?.split('@')[0] || 'Shopkeeper'}
                </Text>
              </View>
              <View style={styles.bannerBadge}>
                <Text style={styles.bannerBadgeText}>{stats.total}</Text>
                <Text style={styles.bannerBadgeLabel}>Items</Text>
              </View>
            </View>
          </AnimatedCard>

          {/* Summary Section */}
          <Animated.View entering={FadeInDown.delay(120).duration(350)}>
            <Text style={styles.sectionTitle}>Inventory Summary</Text>
          </Animated.View>

          <View style={styles.statsRow}>
            <StatCard label="Total" value={stats.total} color={Colors.primary} index={2} />
            <StatCard label="Fresh" value={stats.fresh} color={Colors.accent} index={3} />
          </View>
          <View style={styles.statsRow}>
            <StatCard label="Expiring" value={stats.expiring} color={Colors.warning} index={4} />
            <StatCard label="Expired" value={stats.expired} color={Colors.danger} index={5} />
          </View>

          {/* Quick Actions */}
          <Animated.View entering={FadeInDown.delay(250).duration(350)}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </Animated.View>

          <AnimatedCard index={6}>
            <AnimatedButton
              label="Scan Product"
              icon="📷"
              mode="contained"
              onPress={() => navigation.navigate('Products', { screen: 'ScanProduct' })}
              style={styles.actionButton}
            />
          </AnimatedCard>

          <AnimatedCard index={7}>
            <AnimatedButton
              label="View All Items"
              icon="📦"
              mode="outlined"
              onPress={() => navigation.navigate('Products')}
              style={styles.actionButton}
            />
          </AnimatedCard>

          {/* Alert Banner */}
          {(stats.expired > 0 || stats.expiring > 0) && (
            <AnimatedCard index={8}>
              <View style={styles.alertBanner}>
                <View style={styles.alertIconWrap}>
                  <Text style={styles.alertIcon}>⚠️</Text>
                </View>
                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle}>Attention Required</Text>
                  <Text style={styles.alertText}>
                    {stats.expired > 0 ? `${stats.expired} expired` : ''}
                    {stats.expired > 0 && stats.expiring > 0 ? ' · ' : ''}
                    {stats.expiring > 0 ? `${stats.expiring} expiring soon` : ''}
                  </Text>
                </View>
              </View>
            </AnimatedCard>
          )}
        </ScrollView>
      </AnimatedScreen>
    </SafeAreaView>
  );
};

// ─── STYLES ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { padding: 20, paddingBottom: 120 },
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

  // Welcome banner
  banner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 22,
    marginBottom: 28,
    overflow: 'hidden',
    // Premium shadow
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 8,
  },
  bannerCircle1: {
    position: 'absolute',
    top: -35,
    right: -35,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  bannerCircle2: {
    position: 'absolute',
    bottom: -40,
    left: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  bannerContent: { flex: 1 },
  welcomeText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '500' },
  userName: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: 0.2,
  },
  bannerBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    marginLeft: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  bannerBadgeText: {
    color: Colors.white,
    fontSize: 24,
    fontWeight: '800',
  },
  bannerBadgeLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 14,
    marginTop: 4,
    letterSpacing: 0.2,
  },

  // Stats
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    borderLeftWidth: 4,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },

  statValue: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  // Actions
  actionButton: {
    marginBottom: 12,
  },

  // Alert banner
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8F0',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FFE0B2',
    gap: 14,
    shadowColor: Colors.warning,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  alertIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertIcon: { fontSize: 20 },
  alertContent: { flex: 1 },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8B5E00',
    marginBottom: 2,
  },
  alertText: {
    fontSize: 12,
    color: '#A0722A',
    fontWeight: '500',
  },
});

export default DashboardScreen;
