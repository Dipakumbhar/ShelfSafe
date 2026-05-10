/**
 * Icon — Reusable vector icon component
 *
 * Uses MaterialIcons from react-native-vector-icons.
 * Falls back gracefully if the package is not linked.
 */

import React from 'react';
import { Text } from 'react-native';
import Colors from '../constants/Colors';

let MaterialIcons = null;
try {
  MaterialIcons = require('react-native-vector-icons/MaterialIcons').default;
} catch {
  MaterialIcons = null;
}

const Icon = ({ name, size = 24, color = Colors.textSecondary, style }) => {
  if (MaterialIcons) {
    return <MaterialIcons name={name} size={size} color={color} style={style} />;
  }
  // Fallback: render a neutral dot if vector icons unavailable
  return (
    <Text style={[{ fontSize: size - 4, color, textAlign: 'center' }, style]}>
      •
    </Text>
  );
};

export default React.memo(Icon);
