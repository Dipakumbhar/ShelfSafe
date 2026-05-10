import React, { memo } from 'react';
import Animated, { FadeInUp } from 'react-native-reanimated';

/**
 * AnimatedCard
 *
 * Wraps any child with a stagger-aware fade + slide-up entry animation.
 * Pass `index` to create a sequential stagger effect in lists.
 * Memoized to prevent unnecessary re-renders.
 */
const AnimatedCard = memo(({ children, index = 0, style }) => {
  // Cap the stagger delay so deep lists don't wait forever
  const cappedDelay = Math.min(index * 80, 600);

  return (
    <Animated.View
      entering={FadeInUp.delay(cappedDelay)
        .duration(350)
        .springify()
        .damping(18)
        .stiffness(120)}
      style={style}>
      {children}
    </Animated.View>
  );
});

AnimatedCard.displayName = 'AnimatedCard';

export default AnimatedCard;
