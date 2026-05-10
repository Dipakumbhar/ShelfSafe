/**
 * SummaryCard — stat card with colored left border
 *
 * Used on Dashboard and Admin screens for inventory summaries.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from './Icon';
import Colors from '../constants/Colors';

const SummaryCard = ({ label, value, color, icon, style }) => (
  <View style={[styles.card, { borderLeftColor: color }, style]}>
    {icon && (
      <Icon name={icon} size={20} color={color} style={styles.icon} />
    )}
    <Text style={[styles.value, { color }]}>{value}</Text>
    <Text style={styles.label}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    alignItems: 'center',
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  icon: {
    marginBottom: 6,
  },
  value: {
    fontSize: 26,
    fontWeight: '800',
  },
  label: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
});

export default React.memo(SummaryCard);
