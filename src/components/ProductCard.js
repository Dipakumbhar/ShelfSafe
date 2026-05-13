/**
 * ProductCard — reusable product list item
 *
 * Extracted from ProductListScreen for reuse.
 * Shows product name, category, status badge, stock info,
 * days-left indicator, and delete button.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Icon from './Icon';
import Colors from '../constants/Colors';
import ICONS from '../constants/Icons';

const statusConfig = {
  fresh: { color: Colors.accent, bg: '#EBF9F1', label: 'Fresh' },
  expiring: { color: Colors.warning, bg: '#FFF8E1', label: 'Expiring Soon' },
  expired: { color: Colors.danger, bg: '#FDECEA', label: 'Expired' },
};
const DEFAULT_CONFIG = { color: Colors.textMuted, bg: '#F3F4F6', label: 'Unknown' };

const ProductCard = ({ item, onDelete, onEdit }) => {
  const config = statusConfig[item.status] || DEFAULT_CONFIG;

  const handleDelete = () => {
    Alert.alert(
      'Delete Product',
      `Remove "${item.name}" from inventory?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (onDelete) {
              onDelete(item.id);
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
          <Text style={[styles.infoValue, styles.infoValueStrong, { color: config.color }]}>
            {item.daysLeft == null
              ? '—'
              : item.daysLeft < 0
                ? `${Math.abs(item.daysLeft)}d ago`
                : `${item.daysLeft}d`}
          </Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.editBtn} onPress={() => onEdit && onEdit(item)}>
          <Icon name={ICONS.edit || 'create'} size={14} color={Colors.primary} style={styles.actionIcon} />
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Icon name={ICONS.delete} size={14} color={Colors.danger} style={styles.actionIcon} />
          <Text style={styles.deleteBtnText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
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
  infoValueStrong: { fontWeight: '700' },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    gap: 8,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  actionIcon: {
    marginRight: 4,
  },
  editBtnText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
  deleteBtnText: { fontSize: 12, color: Colors.danger, fontWeight: '600' },
});

export default React.memo(ProductCard);

