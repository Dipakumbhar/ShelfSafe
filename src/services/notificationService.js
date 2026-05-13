
/** How many days before expiry to send the alert */
const ALERT_DAYS_BEFORE = 2;


export const configure = () => {
  // Create the notification channel (Android 8+ requirement)
  PushNotification.createChannel(
    {
      channelId: CHANNEL_ID,
      channelName: CHANNEL_NAME,
      channelDescription: CHANNEL_DESC,
      playSound: true,
      soundName: 'default',
      importance: 4, // HIGH
      vibrate: true,
    },
    (created) => {
    },
  );

  PushNotification.configure({
    onNotification: function (notification) {
      if (Platform.OS === 'ios') {
        notification.finish?.('UIBackgroundFetchResultNoData');
      }
    },
    onRegister: function (token) {
    },
    permissions: { alert: true, badge: true, sound: true },
    // Permissions auto-requested on iOS; Android 13+ handled separately in App.tsx
    requestPermissions: Platform.OS === 'ios',
    popInitialNotification: true,
  });
};

// ---------------------------------------------------------------------------
// DATE HELPERS
// ---------------------------------------------------------------------------

/**
 * Parse a date string to a JS Date at 9:00 AM local time.
 * Supports: full ISO datetime, YYYY-MM-DD, DD/MM/YYYY
 */
const parseDateString = (dateStr) => {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();

  // Full ISO datetime: 2024-12-31T00:00:00.000Z
  const isoDatetimeMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})T/);
  if (isoDatetimeMatch) {
    return new Date(
      Number(isoDatetimeMatch[1]),
      Number(isoDatetimeMatch[2]) - 1,
      Number(isoDatetimeMatch[3]),
      9, 0, 0,
    );
  }

  // YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return new Date(
      Number(isoMatch[1]),
      Number(isoMatch[2]) - 1,
      Number(isoMatch[3]),
      9, 0, 0,
    );
  }

  // DD/MM/YYYY
  const dmyMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dmyMatch) {
    return new Date(
      Number(dmyMatch[3]),
      Number(dmyMatch[2]) - 1,
      Number(dmyMatch[1]),
      9, 0, 0,
    );
  }

  return null;
};


const calculateNotifyDate = (expiryDateStr) => {
  const expiryDate = parseDateString(expiryDateStr);
  if (!expiryDate) return null;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const expiryDay = new Date(
    expiryDate.getFullYear(),
    expiryDate.getMonth(),
    expiryDate.getDate(),
  );

  // Already expired — do not schedule
  if (expiryDay < today) {
    return null;
  }

  // 2 days before expiry at 9:00 AM
  const notifyDate = new Date(expiryDate);
  notifyDate.setDate(notifyDate.getDate() - ALERT_DAYS_BEFORE);

  notifyDate.setHours(22, 42, 0, 0);

  // Notify date already passed → fire in 5 seconds (expiry is within 2 days)
  if (notifyDate <= now) {
    return new Date(now.getTime() + 5000);
  }

  return notifyDate;
};


const hashCode = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    // Keep stable 32-bit hash output for backward-compatible notification IDs.
    // eslint-disable-next-line no-bitwise
    hash = (hash << 5) - hash + char;
    // eslint-disable-next-line no-bitwise
    hash |= 0;
  }
  return hash;
};

/**
 * Schedule a local push notification for a product expiry.
 *
 * @param {object}  params
 * @param {string}  params.productId        - Firestore doc ID
 * @param {string}  params.productName      - Product display name
 * @param {string}  params.expiryDate       - Expiry date string
 * @param {boolean} [params.notificationsEnabled=true] - User preference gate
 *
 * @returns {'scheduled'|'immediate'|'skipped_expired'|'skipped_disabled'|'skipped_invalid'}
 */
export const scheduleExpiryAlert = ({
  productId,
  productName,
  expiryDate,
  notificationsEnabled = true,
}) => {
  // ── Respect user notification preference ──────────────────────────────────
  if (!notificationsEnabled) {
    return 'skipped_disabled';
  }

  const notifyDate = calculateNotifyDate(expiryDate);

  if (!notifyDate) {
    return 'skipped_expired';
  }

  // ── Build notification message ────────────────────────────────────────────
  const expiryParsed = parseDateString(expiryDate);
  const now = new Date();
  const daysLeft = Math.ceil((expiryParsed - now) / (1000 * 60 * 60 * 24));

  const title = 'ShelfSafe — Expiry Alert';
  let message;
  if (daysLeft <= 0) {
    message = `"${productName}" has expired! Remove it from your inventory.`;
  } else if (daysLeft === 1) {
    message = `"${productName}" is expiring tomorrow!`;
  } else {
    message = `"${productName}" is expiring in ${daysLeft} days. Check your inventory.`;
  }

  const isImmediate = notifyDate <= new Date(now.getTime() + 6000);

  // ── Numeric notification ID derived from Firestore doc ID ─────────────────
  // Ensure ID is always a positive non-zero integer
  const notificationId = productId
    ? (Math.abs(hashCode(productId)) || 1)
    : Math.floor(Math.random() * 1000000) + 1;

  // ── Cancel existing alert for this product before rescheduling ───────────
  try {
    PushNotification.cancelLocalNotification(notificationId.toString());
  } catch (_) { }

  // ── Schedule ──────────────────────────────────────────────────────────────
  try {
    PushNotification.localNotificationSchedule({
      // Android-specific
      channelId: CHANNEL_ID,
      id: notificationId,
      autoCancel: true,
      // Use 'ic_launcher' — guaranteed to exist; 'ic_notification' may not
      largeIcon: 'ic_launcher',
      smallIcon: 'ic_launcher',
      bigText: message,
      subText: 'ShelfSafe Inventory',
      vibrate: true,
      vibration: 300,
      priority: 'high',
      importance: 'high',
      // Cross-platform
      title,
      message,
      playSound: true,
      soundName: 'default',
      date: notifyDate,
      // Do NOT set allowWhileIdle: true — requires USE_EXACT_ALARM permission
      // which causes crashes on Android 12+ without user approval
      // Payload
      userInfo: { productId, productName, expiryDate },
      data: { productId, productName, expiryDate },
    });
  } catch (schedErr) {
    console.error('[NotificationService] Failed to schedule notification:', schedErr);
    return 'skipped_expired'; // graceful degradation
  }

  return isImmediate ? 'immediate' : 'scheduled';
};

/**
 * Cancel a previously scheduled notification for a specific product.
 * Call this when a product is deleted.
 *
 * @param {string} productId - Firestore document ID
 */
export const cancelProductAlert = (productId) => {
  if (!productId) return;
  const notificationId = Math.abs(hashCode(productId)).toString();
  PushNotification.cancelLocalNotification(notificationId);
};

/**
 * Cancel all scheduled notifications.
 * Call on logout or when user disables notifications.
 */
export const cancelAllAlerts = () => {
  PushNotification.cancelAllLocalNotifications();
};

/**
 * Explicitly request notification permissions.
 * On Android 13+ this is handled in App.tsx via PermissionsAndroid.
 * On iOS this triggers the system dialog.
 */
export const requestPermissions = () => {
  if (Platform.OS === 'ios') {
    PushNotification.requestPermissions();
  }
};

