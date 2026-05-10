import React, { useEffect, useCallback } from 'react';
import { Pressable, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
  FadeInUp,
  interpolate,
} from 'react-native-reanimated';
import Colors from '../constants/Colors';

/**
 * AnimatedFAB
 *
 * Floating Action Button with:
 * - Subtle pulsating glow animation
 * - Press scale-bounce effect
 * - Perfectly centered above the bottom tab bar
 * - Responsive absolute positioning
 * - Premium shadow and elevation
 */

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const FAB_SIZE = 56;
const TAB_BAR_HEIGHT = 64;
const TAB_BAR_BOTTOM_PADDING = Platform.OS === 'ios' ? 20 : 6;
const FAB_BOTTOM = TAB_BAR_HEIGHT + TAB_BAR_BOTTOM_PADDING + 16;

const AnimatedFAB = ({ onPress, label, icon, style }) => {
  const pulseScale = useSharedValue(1);
  const pressScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    // Subtle breathing pulse
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    // Glow animation synced with pulse
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [pulseScale, glowOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value * pressScale.value }],
  }));

  const shadowAnimatedStyle = useAnimatedStyle(() => ({
    shadowOpacity: glowOpacity.value,
    elevation: interpolate(glowOpacity.value, [0.3, 0.5], [8, 14]),
  }));

  const handlePressIn = useCallback(() => {
    pressScale.value = withSpring(0.88, { damping: 15, stiffness: 400 });
  }, [pressScale]);

  const handlePressOut = useCallback(() => {
    pressScale.value = withSpring(1, { damping: 10, stiffness: 300 });
  }, [pressScale]);

  return (
    <Animated.View
      entering={FadeInUp.delay(400).duration(500).springify().damping(14)}
      style={styles.wrapper}>
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        android_ripple={{
          color: 'rgba(255,255,255,0.25)',
          borderless: true,
          radius: FAB_SIZE / 2,
        }}
        style={[styles.fab, animatedStyle, shadowAnimatedStyle, style]}>
        {icon && <Text style={styles.icon}>{icon}</Text>}
        {label && <Text style={styles.label}>{label}</Text>}
      </AnimatedPressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: FAB_BOTTOM,
    right: 20,
    zIndex: 100,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 28,
    gap: 8,
    minHeight: FAB_SIZE,
    // Premium shadow
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  icon: {
    fontSize: 20,
    color: Colors.white,
    fontWeight: '700',
  },
  label: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.4,
  },
});

export default AnimatedFAB;
