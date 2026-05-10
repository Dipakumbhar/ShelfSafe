import React from 'react';
import { StyleSheet, Platform, StatusBar } from 'react-native';
import { Appbar } from 'react-native-paper';
import Colors from '../constants/Colors';

/**
 * AppHeader
 *
 * Reusable React Native Paper Appbar.Header with:
 * - Perfectly centered title (using titleStyle + contentStyle)
 * - Optional left back button
 * - Optional right action icons
 * - Elevation / shadow
 * - Consistent spacing and padding
 * - Responsive layout (no overlapping)
 */
const AppHeader = ({
  title,
  navigation,
  showBack = false,
  rightActions = [],
  elevated = true,
  subtitle,
}) => {
  return (
    <Appbar.Header
      style={[styles.header, elevated && styles.elevated]}
      statusBarHeight={Platform.OS === 'android' ? StatusBar.currentHeight : undefined}>
      {showBack && (
        <Appbar.BackAction
          onPress={() => navigation.goBack()}
          color={Colors.white}
          style={styles.backAction}
        />
      )}

      <Appbar.Content
        title={title}
        subtitle={subtitle}
        titleStyle={styles.title}
        subtitleStyle={styles.subtitle}
        style={[
          styles.content,
          showBack && rightActions.length === 0 && styles.contentWithBack,
          !showBack && rightActions.length > 0 && styles.contentWithRight,
        ]}
      />

      {/* Render right action icons */}
      {rightActions.map((action, index) => (
        <Appbar.Action
          key={index}
          icon={action.icon}
          onPress={action.onPress}
          color={Colors.white}
          style={styles.rightAction}
        />
      ))}

      {/* Balance spacer: if we have a back button but no right actions, add invisible spacer */}
      {showBack && rightActions.length === 0 && (
        <Appbar.Action
          icon="dots-vertical"
          color="transparent"
          style={styles.spacer}
          disabled
        />
      )}
    </Appbar.Header>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.primary,
    elevation: 0,
  },
  elevated: {
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  title: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    textAlign: 'center',
  },
  content: {
    alignItems: 'center',
  },
  contentWithBack: {
    // When there's a back button and no right actions, the invisible spacer balances it
    marginRight: 0,
  },
  contentWithRight: {
    // When there are right actions but no back button, shift content for balance
    marginLeft: 48,
  },
  backAction: {
    marginLeft: 4,
  },
  rightAction: {
    marginRight: 4,
  },
  spacer: {
    opacity: 0,
    marginRight: 4,
  },
});

export default AppHeader;
