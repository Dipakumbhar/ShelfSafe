import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import Colors from '../constants/Colors';

/**
 * AnimatedButton
 *
 * A premium button with:
 * - Scale-down + bounce-back press animation
 * - Android ripple effect for Material Design touch feedback
 * - Rounded corners and subtle shadows
 * - Accepts mode ('contained' | 'outlined' | 'text')
 */

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const AnimatedButton = ({
  onPress,
  label,
  mode = 'contained',
  icon,
  style,
  labelStyle,
  disabled = false,
  color,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 300 });
  }, [scale]);

  const isContained = mode === 'contained';
  const isOutlined = mode === 'outlined';
  const isText = mode === 'text';

  const buttonStyle = [
    styles.base,
    isContained && [styles.contained, color && { backgroundColor: color }],
    isOutlined && [styles.outlined, color && { borderColor: color }],
    isText && styles.textMode,
    disabled && styles.disabled,
    style,
  ];

  const textStyle = [
    styles.label,
    isContained && styles.containedLabel,
    isOutlined && [styles.outlinedLabel, color && { color }],
    isText && [styles.textModeLabel, color && { color }],
    labelStyle,
  ];

  const rippleColor = isContained
    ? 'rgba(255,255,255,0.2)'
    : `rgba(27, 58, 107, 0.12)`;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      android_ripple={{
        color: rippleColor,
        borderless: false,
      }}
      style={[animatedStyle, ...buttonStyle]}>
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text style={textStyle}>{label}</Text>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: 14,
    gap: 10,
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
  },
  contained: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  outlined: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  textMode: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  containedLabel: {
    color: Colors.white,
  },
  outlinedLabel: {
    color: Colors.primary,
  },
  textModeLabel: {
    color: Colors.primary,
  },
  icon: {
    fontSize: 18,
  },
});

export default AnimatedButton;
