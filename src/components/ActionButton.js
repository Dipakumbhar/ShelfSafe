/**
 * ActionButton — icon + label button component
 *
 * Used for primary/secondary actions across screens.
 * Supports icon-left layout, disabled state, and outline variant.
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Icon from './Icon';
import Colors from '../constants/Colors';

const ActionButton = ({
  icon,
  label,
  onPress,
  style,
  textStyle,
  iconSize = 18,
  iconColor,
  outline = false,
  danger = false,
  disabled = false,
  loading = false,
}) => {
  const bgColor = danger
    ? Colors.danger
    : outline
    ? Colors.white
    : Colors.primary;
  const txtColor = outline
    ? danger
      ? Colors.danger
      : Colors.primary
    : Colors.white;
  const borderStyle = outline
    ? { borderWidth: 1.5, borderColor: danger ? Colors.danger : Colors.primary }
    : {};

  return (
    <TouchableOpacity
      style={[
        styles.btn,
        { backgroundColor: bgColor },
        borderStyle,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}>
      {loading ? (
        <ActivityIndicator color={txtColor} size="small" />
      ) : (
        <>
          {icon && (
            <Icon
              name={icon}
              size={iconSize}
              color={iconColor || txtColor}
              style={styles.icon}
            />
          )}
          <Text style={[styles.label, { color: txtColor }, textStyle]}>
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  icon: {
    marginRight: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.6,
  },
});

export default React.memo(ActionButton);
