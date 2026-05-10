/**
 * InputField — styled text input with optional icon
 *
 * Drop-in replacement for raw TextInput with consistent styling.
 */

import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import Icon from './Icon';
import Colors from '../constants/Colors';

const InputField = ({
  label,
  placeholder,
  value,
  onChangeText,
  icon,
  keyboardType,
  secureTextEntry,
  autoCapitalize,
  autoCorrect,
  multiline,
  numberOfLines,
  editable = true,
  style,
  inputStyle,
  rightElement,
}) => (
  <View style={[styles.group, style]}>
    {label && <Text style={styles.label}>{label}</Text>}
    <View style={[styles.row, !editable && styles.rowDisabled]}>
      {icon && (
        <Icon
          name={icon}
          size={18}
          color={Colors.textMuted}
          style={styles.icon}
        />
      )}
      <TextInput
        style={[styles.input, multiline && styles.textArea, inputStyle]}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType || 'default'}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        multiline={multiline}
        numberOfLines={numberOfLines || (multiline ? 3 : 1)}
        editable={editable}
      />
      {rightElement}
    </View>
  </View>
);

const styles = StyleSheet.create({
  group: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    backgroundColor: Colors.background,
  },
  rowDisabled: {
    opacity: 0.6,
  },
  icon: {
    marginLeft: 12,
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
});

export default React.memo(InputField);
