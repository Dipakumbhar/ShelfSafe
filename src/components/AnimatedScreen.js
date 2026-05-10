import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';

/**
 * AnimatedScreen
 *
 * Wraps screen content with a smooth fade-in + subtle slide-up entrance.
 * Uses combined FadeIn + SlideInUp for a lightweight, non-distracting effect.
 * Use as the outermost wrapper inside each screen component.
 */
const AnimatedScreen = ({ children, style, delay = 0 }) => {
  return (
    <Animated.View
      entering={FadeIn.delay(delay)
        .duration(350)
        .springify()
        .damping(20)
        .stiffness(120)}
      style={[styles.container, style]}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default AnimatedScreen;
