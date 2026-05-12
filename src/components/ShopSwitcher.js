import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Colors from '../constants/Colors';
import Icon from './Icon';
import ICONS from '../constants/Icons';

const ShopSwitcher = ({
  shops = [],
  activeShopId,
  onSelect,
  onManagePress,
  title = 'Your Stores',
  subtitle = 'Choose which store inventory you want to work with.',
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        {onManagePress ? (
          <TouchableOpacity style={styles.manageBtn} onPress={onManagePress} activeOpacity={0.8}>
            <Icon name={ICONS.edit} size={14} color={Colors.primary} />
            <Text style={styles.manageText}>Manage</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {shops.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shopRow}>
          {shops.map((shop) => {
            const isActive = shop.id === activeShopId;
            return (
              <TouchableOpacity
                key={shop.id}
                style={[styles.shopPill, isActive && styles.shopPillActive]}
                onPress={() => onSelect?.(shop.id)}
                activeOpacity={0.8}>
                <Icon
                  name={ICONS.shop}
                  size={15}
                  color={isActive ? Colors.white : Colors.primary}
                  style={styles.shopIcon}
                />
                <View style={styles.shopCopy}>
                  <Text style={[styles.shopName, isActive && styles.shopNameActive]} numberOfLines={1}>
                    {shop.name}
                  </Text>
                  <Text style={[styles.shopMeta, isActive && styles.shopMetaActive]} numberOfLines={1}>
                    {shop.address || 'No address added yet'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Icon name={ICONS.shop} size={18} color={Colors.textMuted} />
          <Text style={styles.emptyText}>Add your first store to start organizing inventory.</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerText: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  manageText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  shopRow: {
    paddingRight: 4,
  },
  shopPill: {
    width: 190,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginRight: 10,
    backgroundColor: Colors.background,
  },
  shopPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  shopIcon: {
    marginRight: 10,
  },
  shopCopy: {
    flex: 1,
  },
  shopName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  shopNameActive: {
    color: Colors.white,
  },
  shopMeta: {
    marginTop: 2,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  shopMetaActive: {
    color: 'rgba(255,255,255,0.75)',
  },
  emptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  emptyText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});

export default ShopSwitcher;
