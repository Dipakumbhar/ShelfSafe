import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Card, Divider } from 'react-native-paper';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import AppHeader from '../../components/AppHeader';
import AnimatedScreen from '../../components/AnimatedScreen';
import AnimatedButton from '../../components/AnimatedButton';
import Colors from '../../constants/Colors';

const statusConfig = {
  fresh: { color: Colors.accent, bg: '#EBF9F1', label: 'Fresh', emoji: '✅' },
  expiring: { color: Colors.warning, bg: '#FFF8E1', label: 'Expiring Soon', emoji: '⚠️' },
  expired: { color: Colors.danger, bg: '#FDECEA', label: 'Expired', emoji: '❌' },
};

const DetailRow = ({ label, value, valueColor, index = 0 }) => (
  <Animated.View
    entering={FadeInDown.delay(200 + index * 80).duration(400)}
    style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={[styles.detailValue, valueColor && { color: valueColor }]}>
      {value}
    </Text>
  </Animated.View>
);

const ItemDetailsScreen = ({ route, navigation }) => {
  const { item } = route.params;
  const config = statusConfig[item.status] || statusConfig.fresh;

  const daysText =
    item.daysLeft == null
      ? '—'
      : item.daysLeft < 0
        ? `${Math.abs(item.daysLeft)} days ago`
        : item.daysLeft === 0
          ? 'Today'
          : `${item.daysLeft} days`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title="Item Details"
        navigation={navigation}
        showBack
      />
      <AnimatedScreen>
        <ScrollView contentContainerStyle={styles.container}>
          {/* Status Banner */}
          <Animated.View
            entering={FadeIn.duration(500)}
            style={[styles.statusBanner, { backgroundColor: config.bg }]}>
            <Text style={styles.statusEmoji}>{config.emoji}</Text>
            <View style={styles.statusContent}>
              <Text style={[styles.statusLabel, { color: config.color }]}>
                {config.label}
              </Text>
              <Text style={styles.statusSubtext}>
                {item.daysLeft != null && item.daysLeft >= 0
                  ? `${item.daysLeft} days until expiry`
                  : item.daysLeft != null
                    ? `Expired ${Math.abs(item.daysLeft)} days ago`
                    : 'Status unknown'}
              </Text>
            </View>
          </Animated.View>

          {/* Product Name Card */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <Card style={styles.nameCard}>
              <Card.Content style={styles.nameCardContent}>
                <Text style={styles.productName}>{item.name}</Text>
                <View style={[styles.categoryBadge]}>
                  <Text style={styles.categoryText}>{item.category}</Text>
                </View>
              </Card.Content>
            </Card>
          </Animated.View>

          {/* Details Card */}
          <Animated.View entering={FadeInDown.delay(150).duration(400)}>
            <Card style={styles.detailsCard}>
              <Card.Content>
                <Text style={styles.sectionTitle}>Product Information</Text>
                <Divider style={styles.divider} />

                <DetailRow
                  label="Expiry Date"
                  value={item.expiryDate}
                  valueColor={config.color}
                  index={0}
                />
                <DetailRow
                  label="Days Remaining"
                  value={daysText}
                  valueColor={config.color}
                  index={1}
                />
                <DetailRow
                  label="Quantity"
                  value={`${item.quantity} ${item.unit}`}
                  index={2}
                />
                <DetailRow
                  label="Batch Number"
                  value={item.batchNo || '—'}
                  index={3}
                />
                <DetailRow
                  label="Category"
                  value={item.category}
                  index={4}
                />
                <DetailRow
                  label="Status"
                  value={config.label}
                  valueColor={config.color}
                  index={5}
                />
              </Card.Content>
            </Card>
          </Animated.View>

          {/* Action Buttons */}
          <Animated.View
            entering={FadeInDown.delay(400).duration(400)}
            style={styles.actionRow}>
            <AnimatedButton
              label="Back to List"
              mode="outlined"
              icon="←"
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
            />
          </Animated.View>
        </ScrollView>
      </AnimatedScreen>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    gap: 14,
  },
  statusEmoji: {
    fontSize: 32,
  },
  statusContent: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  statusSubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  nameCard: {
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    backgroundColor: Colors.white,
  },
  nameCardContent: {
    padding: 20,
    alignItems: 'center',
  },
  productName: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  categoryBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  detailsCard: {
    borderRadius: 16,
    marginBottom: 20,
    elevation: 3,
    backgroundColor: Colors.white,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  divider: {
    backgroundColor: Colors.divider,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '700',
    textAlign: 'right',
    maxWidth: '55%',
  },
  actionRow: {
    marginTop: 4,
  },
  backBtn: {
    borderColor: Colors.primary,
  },
});

export default ItemDetailsScreen;
