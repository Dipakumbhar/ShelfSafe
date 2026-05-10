import React, { useEffect } from 'react';
import { Platform, PermissionsAndroid, Alert, Linking } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import { configure as configureNotifications } from './src/services/notificationService';

// ---------------------------------------------------------------------------
// Android 13+ (API 33+): POST_NOTIFICATIONS runtime permission
// ---------------------------------------------------------------------------
const requestPostNotificationPermission = async () => {
  if (Platform.OS !== 'android' || Platform.Version < 33) return;
  try {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      {
        title: 'Notification Permission',
        message:
          'ShelfSafe needs permission to send expiry alerts before products expire.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      },
    );
    console.log('[App] POST_NOTIFICATIONS result:', result);
  } catch (err) {
    console.warn('[App] POST_NOTIFICATIONS request failed:', err);
  }
};

// ---------------------------------------------------------------------------
// Android 12 only (API 31–32): SCHEDULE_EXACT_ALARM must be granted by user
// in Settings → Apps → ShelfSafe → Alarms & Reminders
// Android 13+ uses USE_EXACT_ALARM which is auto-granted via the manifest.
// ---------------------------------------------------------------------------
const requestExactAlarmPermissionIfNeeded = async () => {
  if (Platform.OS !== 'android') return;
  // Only API 31 and 32 need user to manually grant SCHEDULE_EXACT_ALARM
  // API 33+ uses USE_EXACT_ALARM which is auto-approved
  if (Platform.Version < 31 || Platform.Version >= 33) return;

  Alert.alert(
    'Enable Expiry Alerts',
    'To send you timely expiry notifications, ShelfSafe needs permission to schedule exact alarms.\n\nPlease tap "Open Settings", then enable "Alarms & Reminders" for ShelfSafe.',
    [
      { text: 'Skip', style: 'cancel' },
      {
        text: 'Open Settings',
        onPress: () => {
          // Deep-link directly to the exact alarm permission settings for this app
          Linking.openURL(
            'android.settings.REQUEST_SCHEDULE_EXACT_ALARM'
          ).catch(() => {
            // Fallback: open general app settings
            Linking.openSettings();
          });
        },
      },
    ],
  );
};

const App = () => {
  useEffect(() => {
    // 1. Initialize push notification channel & handlers
    configureNotifications();

    // 2. Request POST_NOTIFICATIONS on Android 13+
    requestPostNotificationPermission();

    // 3. Guide Android 12 users to grant Alarms & Reminders
    requestExactAlarmPermissionIfNeeded();
  }, []);

  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
};

export default App;
