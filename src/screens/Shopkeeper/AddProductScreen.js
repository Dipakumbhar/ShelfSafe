/**
 * AddProductScreen.js
 *
 * Redesigned with:
 *  - DateTimePicker (calendar UI) for Manufacturing & Expiry Date
 *  - Correct OCR field mapping: MFG → manufacturingDate, EXP → expiryDate
 *  - Date order: Manufacturing Date first, then Expiry Date
 *  - Single top-level Scan button (no duplicate scan per field)
 *  - Promise-based launchCamera (react-native-image-picker v8+)
 *  - Runtime camera permission request on Android
 *  - Scanning loader/disabled state while OCR runs
 *  - Auto-fill + user-editable fields after scan
 *  - Clear error alerts for OCR failures
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  Animated,
  Easing,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { scanProduct } from '../../services/ocrService';
import { addProduct } from '../../services/productService';
import { getUserData } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { useShop } from '../../context/ShopContext';
import Colors from '../../constants/Colors';
import Icon from '../../components/Icon';
import ShopSwitcher from '../../components/ShopSwitcher';
import ICONS from '../../constants/Icons';

// ---------------------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------------------
const CATEGORIES = [
  'Grains', 'Dairy', 'Oils', 'Condiments', 'Beverages', 'Snacks', 'Other',
];

const EMPTY_FORM = {
  name: '',
  category: '',
  quantity: '',
  unit: '',
  batchNo: '',
  manufacturingDate: null,   // stored as Date object or null
  expiryDate: null,          // stored as Date object or null
  notes: '',
};

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------
/** Format a JS Date → readable "DD MMM YYYY" string */
const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/** Month-name lookup for parsing OCR dates */
const MONTH_LOOKUP = {
  JAN: '01', JANUARY: '01',
  FEB: '02', FEBRUARY: '02',
  MAR: '03', MARCH: '03',
  APR: '04', APRIL: '04',
  MAY: '05',
  JUN: '06', JUNE: '06',
  JUL: '07', JULY: '07',
  AUG: '08', AUGUST: '08',
  SEP: '09', SEPTEMBER: '09', SEPT: '09',
  OCT: '10', OCTOBER: '10',
  NOV: '11', NOVEMBER: '11',
  DEC: '12', DECEMBER: '12',
};

/** Expand 2-digit year → 4-digit year */
const expandYear = (yy) => {
  const n = parseInt(yy, 10);
  if (yy.length === 4) return yy;
  return (n > 50 ? 1900 + n : 2000 + n).toString();
};

/**
 * Parse a raw OCR date string (various formats) → JS Date or null.
 * Handles: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YY, MM/YYYY, MM/YY,
 *          DD MON YYYY, MON DD YYYY, MON YYYY, MON YY, DDMONYYYY, etc.
 * OCR dates are typically UPPERCASE — all comparisons are case-insensitive.
 */
const parseOCRDate = (str) => {
  if (!str) return null;
  const s = str.trim().toUpperCase();

  // ── YYYY-MM-DD  or  YYYY/MM/DD ───────────────────────
  const isoMatch = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (isoMatch) {
    const d = new Date(`${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`);
    if (!isNaN(d)) return d;
  }

  // ── DD/MM/YYYY  or  DD-MM-YYYY  or  DD.MM.YYYY ──────
  const dmyMatch = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const d = new Date(`${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`);
    if (!isNaN(d)) return d;
  }

  // ── DD/MM/YY  (2-digit year) ────────────────────────
  const dmyShort = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2})$/);
  if (dmyShort) {
    const yyyy = expandYear(dmyShort[3]);
    const d = new Date(`${yyyy}-${dmyShort[2].padStart(2, '0')}-${dmyShort[1].padStart(2, '0')}`);
    if (!isNaN(d)) return d;
  }

  // ── MM/YYYY  or  MM-YYYY ────────────────────────────
  const myMatch = s.match(/^(\d{1,2})[-/.](\d{4})$/);
  if (myMatch) {
    const d = new Date(`${myMatch[2]}-${myMatch[1].padStart(2, '0')}-01`);
    if (!isNaN(d)) return d;
  }

  // ── MM/YY  (2-digit year) ──────────────────────────
  const myShort = s.match(/^(\d{1,2})[-/](\d{2})$/);
  if (myShort) {
    const mm = parseInt(myShort[1], 10);
    if (mm >= 1 && mm <= 12) {
      const yyyy = expandYear(myShort[2]);
      const d = new Date(`${yyyy}-${myShort[1].padStart(2, '0')}-01`);
      if (!isNaN(d)) return d;
    }
  }

  // ── DD MON YYYY  /  DD-MON-YYYY  /  DD.MON.YYYY  /  DDMONYYYY ──
  const dMonY = s.match(/^(\d{1,2})[-./ ]?([A-Z]{3,9})\.?[-./ ]?(\d{2,4})$/);
  if (dMonY) {
    const mm = MONTH_LOOKUP[dMonY[2].replace(/\./g, '')];
    if (mm) {
      const yyyy = expandYear(dMonY[3]);
      const d = new Date(`${yyyy}-${mm}-${dMonY[1].padStart(2, '0')}`);
      if (!isNaN(d)) return d;
    }
  }

  // ── MON DD, YYYY  /  MON-DD-YYYY  /  MON DD YYYY ───
  const monDY = s.match(/^([A-Z]{3,9})\.?[-./ ]?(\d{1,2})[,-./ ]+(\d{2,4})$/);
  if (monDY) {
    const mm = MONTH_LOOKUP[monDY[1].replace(/\./g, '')];
    if (mm) {
      const yyyy = expandYear(monDY[3]);
      const d = new Date(`${yyyy}-${mm}-${monDY[2].padStart(2, '0')}`);
      if (!isNaN(d)) return d;
    }
  }

  // ── MON YYYY  /  MON/YYYY  /  MON-YYYY ─────────────
  const monY = s.match(/^([A-Z]{3,9})\.?[-/. ]?(\d{4})$/);
  if (monY) {
    const mm = MONTH_LOOKUP[monY[1].replace(/\./g, '')];
    if (mm) {
      const d = new Date(`${monY[2]}-${mm}-01`);
      if (!isNaN(d)) return d;
    }
  }

  // ── MON YY  (2-digit year) ─────────────────────────
  const monYShort = s.match(/^([A-Z]{3,9})\.?[-/. ]?(\d{2})$/);
  if (monYShort) {
    const mm = MONTH_LOOKUP[monYShort[1].replace(/\./g, '')];
    if (mm) {
      const yyyy = expandYear(monYShort[2]);
      const d = new Date(`${yyyy}-${mm}-01`);
      if (!isNaN(d)) return d;
    }
  }

  // ── Last resort: native JS parser ──────────────────
  const direct = new Date(str);
  if (!isNaN(direct)) return direct;

  console.warn('[parseOCRDate] Could not parse date string:', str);
  return null;
};

// ---------------------------------------------------------------------------
// LAZY LOADERS  (graceful fallback when native modules not linked)
// ---------------------------------------------------------------------------
const getCameraModule = () => {
  try {
    const { launchCamera } = require('react-native-image-picker');
    if (typeof launchCamera !== 'function') return null;
    return launchCamera;
  } catch {
    return null;
  }
};

// ---------------------------------------------------------------------------
// REQUEST CAMERA PERMISSION (Android only)
// ---------------------------------------------------------------------------
const requestCameraPermission = async () => {
  if (Platform.OS !== 'android') return true;
  try {
    // Android 13+ uses READ_MEDIA_IMAGES; older uses READ_EXTERNAL_STORAGE
    const permissions = [
      PermissionsAndroid.PERMISSIONS.CAMERA,
    ];

    const results = await PermissionsAndroid.requestMultiple(permissions);
    const cameraGranted =
      results[PermissionsAndroid.PERMISSIONS.CAMERA] ===
      PermissionsAndroid.RESULTS.GRANTED;

    if (!cameraGranted) {
      Alert.alert(
        'Permission Required',
        'Camera permission is required to scan product labels. Please enable it in Settings.',
        [{ text: 'OK' }],
      );
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[AddProductScreen] Permission error:', err);
    return false;
  }
};

// Icon helper is now the shared Icon component imported above

// ---------------------------------------------------------------------------
// PULSING RING — animated loader inside scan card
// ---------------------------------------------------------------------------
const PulsingRing = () => {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 600,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.4] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] });

  return (
    <View style={scanStyles.pulseWrapper}>
      <Animated.View
        style={[scanStyles.pulseRing, { transform: [{ scale }], opacity }]}
      />
      <Icon name={ICONS.camera} size={28} color={Colors.white} />
    </View>
  );
};

// ---------------------------------------------------------------------------
// DATE PICKER FIELD — tap to open calendar; shows formatted value
// ---------------------------------------------------------------------------
const DatePickerField = ({
  label,
  value,            // JS Date or null
  onChange,         // (date: Date) => void
  maximumDate,
  minimumDate,
  highlighted,
  disabled,
}) => {
  const [show, setShow] = useState(false);

  const onDateChange = useCallback(
    (_event, selectedDate) => {
      setShow(Platform.OS === 'ios'); // keep open on iOS until dismissed
      if (selectedDate) {
        onChange(selectedDate);
      }
    },
    [onChange],
  );

  return (
    <View style={inputStyles.group}>
      <Text style={inputStyles.label}>{label}</Text>
      <TouchableOpacity
        style={[
          inputStyles.dateRow,
          highlighted && inputStyles.dateRowHighlighted,
          disabled && inputStyles.dateRowDisabled,
        ]}
        onPress={() => !disabled && setShow(true)}
        activeOpacity={0.75}>
        <View style={inputStyles.dateIconWrap}>
          <Icon name={ICONS.calendar} size={18} color={highlighted ? Colors.accent : Colors.textSecondary} />
        </View>
        <Text
          style={[
            inputStyles.dateText,
            !value && inputStyles.datePlaceholder,
            highlighted && inputStyles.dateTextHighlighted,
          ]}>
          {value ? formatDate(value) : 'Tap to select date'}
        </Text>
        {value && !disabled && (
          <TouchableOpacity
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => onChange(null)}
            style={inputStyles.clearBtn}>
            <Icon name={ICONS.close} size={14} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {highlighted && (
        <View style={inputStyles.badgeRow}>
          <Icon name={ICONS.autoFix} size={13} color={Colors.accent} />
          <Text style={inputStyles.autofillBadge}>  Auto-filled by scan — tap to edit</Text>
        </View>
      )}

      {show && (
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
          onChange={onDateChange}
          maximumDate={maximumDate}
          minimumDate={minimumDate}
        />
      )}
    </View>
  );
};

// ---------------------------------------------------------------------------
// GENERIC TEXT FORM INPUT
// ---------------------------------------------------------------------------
const FormInput = ({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType,
  multiline,
  disabled,
}) => (
  <View style={inputStyles.group}>
    <Text style={inputStyles.label}>{label}</Text>
    <View style={[inputStyles.row, disabled && inputStyles.rowDisabled]}>
      <TextInput
        style={[inputStyles.input, multiline && inputStyles.textArea]}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType || 'default'}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        editable={!disabled}
      />
    </View>
  </View>
);

// ---------------------------------------------------------------------------
// MAIN SCREEN
// ---------------------------------------------------------------------------
const AddProductScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const {
    shops,
    activeShop,
    activeShopId,
    selectShop,
    loading: shopsLoading,
  } = useShop();
  const prefill = route?.params?.prefill || {};
  const manageShops = useCallback(
    () => navigation.navigate('Profile', { screen: 'MyShop' }),
    [navigation],
  );

  // Form state — dates are Date objects or null
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    ...prefill,
    manufacturingDate: prefill.manufacturingDate
      ? new Date(prefill.manufacturingDate)
      : null,
    expiryDate: prefill.expiryDate ? new Date(prefill.expiryDate) : null,
  });

  // Track which fields were auto-filled by OCR so we can highlight them
  const [autofilled, setAutofilled] = useState({
    manufacturingDate: false,
    expiryDate: false,
  });

  const [scanning, setScanning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [scanMsg, setScanMsg] = useState('');
  const [scanStatus, setScanStatus] = useState(''); // 'success' | 'warn' | 'error' | ''

  // Generic field updater — clears the highlight when user manually edits
  const update = useCallback((key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setAutofilled((prev) => ({ ...prev, [key]: false }));
  }, []);

  // -------------------------------------------------------------------------
  // SCAN HANDLER — Promise-based (react-native-image-picker v8+)
  // -------------------------------------------------------------------------
  const handleScan = useCallback(async () => {
    const launchCamera = getCameraModule();

    if (!launchCamera) {
      Alert.alert(
        'Camera Not Available',
        'react-native-image-picker is not installed or the app needs a rebuild.',
        [{ text: 'OK' }],
      );
      return;
    }

    // ── Request Android camera permission at runtime ───────────────────────
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      // v8+ returns a Promise; passing no callback forces Promise mode
      const response = await launchCamera({
        mediaType: 'photo',
        quality: 1.0,          // Maximum quality for best OCR accuracy
        saveToPhotos: false,
        includeBase64: false,
        maxWidth: 2048,        // Large enough for OCR, not too heavy
        maxHeight: 2048,
        cameraType: 'back',    // Rear camera for label scanning
      });

      if (response.didCancel) return;

      if (response.errorCode) {
        Alert.alert(
          'Camera Error',
          response.errorMessage ||
          `Camera failed (code: ${response.errorCode}). Please try again.`,
          [{ text: 'OK' }],
        );
        return;
      }

      const asset = response.assets?.[0];
      if (!asset?.uri) {
        Alert.alert('Error', 'No image captured. Please try again.');
        return;
      }

      // ── DEBUG: Log captured image URI ──────────────────────────────────────
      console.log('[AddProductScreen] ── SCAN PIPELINE START ──');
      console.log('[AddProductScreen] Image URI:', asset.uri);
      console.log('[AddProductScreen] Image type:', asset.type);
      console.log('[AddProductScreen] Image size:', asset.fileSize, 'bytes');

      // ── Start OCR ─────────────────────────────────────────────────────────
      setScanning(true);
      setScanMsg('');
      setScanStatus('');

      try {
        const {
          manufacturingDate: mfgRaw,
          expiryDate: expRaw,
          rawText,
          notConfigured,
        } = await scanProduct(asset.uri);

        // ── DEBUG: Log OCR results ────────────────────────────────────────
        console.log('[AddProductScreen] OCR notConfigured:', notConfigured);
        console.log('[AddProductScreen] OCR raw text:', rawText);
        console.log('[AddProductScreen] OCR raw MFG:', mfgRaw);
        console.log('[AddProductScreen] OCR raw EXP:', expRaw);

        // ML Kit not yet linked (needs native rebuild)
        if (notConfigured) {
          console.warn('[AddProductScreen] ML Kit not configured — needs rebuild');
          setScanMsg(
            'Photo captured! Rebuild the app to activate on-device OCR.',
          );
          setScanStatus('warn');
          return;
        }

        // No text detected at all
        if (!rawText && !mfgRaw && !expRaw) {
          console.warn('[AddProductScreen] No text detected in image');
          Alert.alert(
            'Could not detect dates',
            'No text was found in the image. Please capture a clear, well-lit close-up of the product label and try again, or enter dates manually.',
            [{ text: 'Enter Manually' }],
          );
          setScanStatus('');
          return;
        }

        // Parse OCR strings → Date objects
        const parsedMfg = parseOCRDate(mfgRaw);
        const parsedExp = parseOCRDate(expRaw);

        // ── DEBUG: Log parsed dates ───────────────────────────────────────
        console.log('[AddProductScreen] Parsed MFG Date:', parsedMfg);
        console.log('[AddProductScreen] Parsed EXP Date:', parsedExp);

        // Apply only the detected dates (keep existing values if not found)
        setForm((prev) => ({
          ...prev,
          manufacturingDate: parsedMfg ?? prev.manufacturingDate,
          expiryDate: parsedExp ?? prev.expiryDate,
        }));
        setAutofilled({
          manufacturingDate: !!parsedMfg,
          expiryDate: !!parsedExp,
        });

        if (parsedMfg || parsedExp) {
          const parts = [];
          if (parsedMfg) parts.push(`MFG: ${formatDate(parsedMfg)}`);
          if (parsedExp) parts.push(`EXP: ${formatDate(parsedExp)}`);
          setScanMsg(`Detected — ${parts.join('  ·  ')}`);
          setScanStatus('success');
          console.log('[AddProductScreen] ✅ Scan success:', parts.join(' | '));
        } else {
          // Text found but no recognisable dates
          console.warn('[AddProductScreen] Text found but no dates parsed. Raw text:', rawText);
          Alert.alert(
            'Could not detect dates',
            'Text was detected but no manufacturing / expiry dates could be read. Please enter dates manually.',
            [{ text: 'OK' }],
          );
          setScanStatus('warn');
          setScanMsg('No dates found — please enter manually.');
        }
        console.log('[AddProductScreen] ── SCAN PIPELINE END ──');
      } catch (ocrErr) {
        console.error('[AddProductScreen] OCR error:', ocrErr);
        console.error('[AddProductScreen] OCR error message:', ocrErr?.message);
        Alert.alert(
          'Scan Failed',
          ocrErr?.message ||
          'Could not detect dates. Please enter manually.',
          [{ text: 'OK' }],
        );
        setScanMsg('Scan failed — please enter manually.');
        setScanStatus('error');
      } finally {
        setScanning(false);
      }
    } catch (cameraErr) {
      console.error('[AddProductScreen] Camera error:', cameraErr);
      Alert.alert(
        'Camera Error',
        'Could not open the camera. Please check permissions in Settings.',
        [{ text: 'OK' }],
      );
    }
  }, []);

  // -------------------------------------------------------------------------
  // SUBMIT
  // -------------------------------------------------------------------------
  const handleSubmit = useCallback(async () => {
    const { name, category, quantity, expiryDate } = form;
    if (!activeShop) {
      Alert.alert(
        'Select a Store',
        'Choose an active store before adding products to inventory.',
      );
      return;
    }

    if (!name.trim() || !category || !quantity.trim() || !expiryDate) {
      Alert.alert(
        'Required Fields',
        'Please fill in Product Name, Category, Quantity, and Expiry Date.',
      );
      return;
    }

    // Sanity check: mfg should be before expiry
    if (form.manufacturingDate && expiryDate) {
      if (form.manufacturingDate > expiryDate) {
        Alert.alert(
          'Date Error',
          'Manufacturing date cannot be after the expiry date.',
        );
        return;
      }
    }

    if (submitting) return;
    setSubmitting(true);

    try {
      // Convert Date objects → ISO strings for Firestore
      const payload = {
        ...form,
        manufacturingDate: form.manufacturingDate
          ? form.manufacturingDate.toISOString()
          : null,
        expiryDate: form.expiryDate
          ? form.expiryDate.toISOString()
          : null,
      };

      // Read user notification preference
      let notificationsEnabled = true;
      try {
        const userData = await getUserData(user.uid);
        if (userData?.settings?.notificationsEnabled !== undefined) {
          notificationsEnabled = userData.settings.notificationsEnabled;
        }
      } catch (_) { /* non-blocking */ }

      const { notifResult } = await addProduct({
        shopkeeperId: user.uid,
        shopId: activeShop.id,
        shopName: activeShop.name,
        formData: payload,
        notificationsEnabled,
      });

      // Build success message based on notification outcome
      let notifMsg = '';
      if (notifResult === 'scheduled') {
        notifMsg = '\n\n✅ Expiry alert scheduled successfully (2 days before expiry).';
      } else if (notifResult === 'immediate') {
        notifMsg = '\n\n⚠️ Product expires within 2 days — alert sent immediately!';
      } else if (notifResult === 'skipped_expired') {
        notifMsg = '\n\n⚠️ Product is already expired — no alert scheduled.';
      } else if (notifResult === 'skipped_disabled') {
        notifMsg = '\n\n🔕 Notifications are currently disabled in your profile.';
      }

      Alert.alert(
        'Product Added',
        `"${name}" has been added to inventory.${notifMsg}`,
        [
          {
            text: 'Add Another',
            onPress: () => {
              setForm(EMPTY_FORM);
              setAutofilled({ manufacturingDate: false, expiryDate: false });
              setScanMsg('');
              setScanStatus('');
            },
          },
          {
            text: 'Go to Inventory',
            onPress: () => navigation.navigate('Products'),
          },
        ],
      );
    } catch (err) {
      console.error('[AddProductScreen] Failed to add product:', err);
      Alert.alert('Error', 'Failed to save product. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [activeShop, form, submitting, navigation, user]);

  // -------------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------------
  if (shopsLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading your stores...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled">
        <ShopSwitcher
          shops={shops}
          activeShopId={activeShopId}
          onSelect={selectShop}
          onManagePress={manageShops}
          subtitle="New products will be saved under the selected store only."
        />

        {!activeShop ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Select a Store First</Text>
            <Text style={styles.emptyStateText}>
              Create a store or switch the active one before adding inventory items.
            </Text>
            <TouchableOpacity
              style={styles.manageStoresBtn}
              onPress={manageShops}
              activeOpacity={0.85}>
              <Text style={styles.manageStoresBtnText}>Manage Stores</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* ── OCR SCAN CARD ────────────────────────────────────────────── */}
        <View style={scanStyles.card}>
          <View style={scanStyles.headerRow}>
            {/* Left: icon + title */}
            <View style={scanStyles.titleBlock}>
              {scanning ? (
                <PulsingRing />
              ) : (
                <View style={scanStyles.iconCircle}>
                  <Icon name={ICONS.camera} size={26} color={Colors.white} />
                </View>
              )}
              <View style={scanStyles.titleText}>
                <Text style={scanStyles.title}>
                  {scanning ? 'Scanning…' : 'Scan Product Label'}
                </Text>
                <Text style={scanStyles.subtitle}>
                  {scanning
                    ? 'Reading dates from label, please wait'
                    : 'Auto-fills Manufacturing & Expiry dates'}
                </Text>
              </View>
            </View>

            {/* Right: Scan button OR spinner */}
            {scanning ? (
              <ActivityIndicator
                size="small"
                color={Colors.accent}
                style={{ marginLeft: 12 }}
              />
            ) : (
              <TouchableOpacity
                style={scanStyles.scanBtn}
                onPress={handleScan}
                activeOpacity={0.85}>
                <Icon name={ICONS.camera} size={16} color={Colors.white} />
                <Text style={scanStyles.scanBtnText}>  Scan</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Result message badge */}
          {scanMsg !== '' && !scanning && (
            <View
              style={[
                scanStyles.msgBox,
                scanStatus === 'success' && scanStyles.msgSuccess,
                scanStatus === 'warn' && scanStyles.msgWarn,
                scanStatus === 'error' && scanStyles.msgError,
              ]}>
              {scanStatus === 'success' && <Icon name={ICONS.check} size={15} color="#065F46" />}
              {scanStatus === 'warn' && <Icon name={ICONS.warning} size={15} color="#92400E" />}
              {scanStatus === 'error' && <Icon name={ICONS.error} size={15} color="#991B1B" />}
              <Text
                style={[
                  scanStyles.msgText,
                  scanStatus === 'success' && scanStyles.msgTextSuccess,
                  scanStatus === 'warn' && scanStyles.msgTextWarn,
                  scanStatus === 'error' && scanStyles.msgTextError,
                ]}>
                {'  '}{scanMsg}
              </Text>
            </View>
          )}

          {/* Hint when idle */}
          {scanMsg === '' && !scanning && (
            <View style={scanStyles.hintRow}>
              <View style={scanStyles.hintContent}>
                <Icon name={ICONS.lightbulb} size={14} color="rgba(255,255,255,0.65)" style={scanStyles.hintIcon} />
                <Text style={scanStyles.hintText}>
                  Tap <Text style={{ fontWeight: '700' }}>Scan</Text> to open the camera and auto-detect dates from the product label.
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* ── PRODUCT INFORMATION ──────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Product Information</Text>
          <FormInput
            label="Product Name *"
            placeholder="e.g. Basmati Rice"
            value={form.name}
            onChangeText={(v) => update('name', v)}
            disabled={scanning}
          />
          <FormInput
            label="Batch Number"
            placeholder="e.g. BT-2025-001"
            value={form.batchNo}
            onChangeText={(v) => update('batchNo', v)}
            disabled={scanning}
          />
        </View>

        {/* ── CATEGORY ─────────────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Category *</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.catPill,
                  form.category === cat && styles.catPillActive,
                ]}
                disabled={scanning}
                onPress={() => update('category', cat)}>
                <Text
                  style={[
                    styles.catPillText,
                    form.category === cat && styles.catPillTextActive,
                  ]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── STOCK DETAILS ────────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Stock Details</Text>
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={inputStyles.label}>Quantity *</Text>
              <View style={[inputStyles.row, scanning && inputStyles.rowDisabled]}>
                <TextInput
                  style={inputStyles.input}
                  placeholder="e.g. 50"
                  placeholderTextColor={Colors.textMuted}
                  value={form.quantity}
                  onChangeText={(v) => update('quantity', v)}
                  keyboardType="numeric"
                  editable={!scanning}
                />
              </View>
            </View>
            <View style={styles.halfInput}>
              <Text style={inputStyles.label}>Unit</Text>
              <View style={[inputStyles.row, scanning && inputStyles.rowDisabled]}>
                <TextInput
                  style={inputStyles.input}
                  placeholder="kg / liters / pcs"
                  placeholderTextColor={Colors.textMuted}
                  value={form.unit}
                  onChangeText={(v) => update('unit', v)}
                  editable={!scanning}
                />
              </View>
            </View>
          </View>
        </View>

        {/* ── DATES — Manufacturing first, then Expiry ─────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dates</Text>

          {/* 1. Manufacturing Date */}
          <DatePickerField
            label="Manufacturing Date"
            value={form.manufacturingDate}
            onChange={(date) => update('manufacturingDate', date)}
            maximumDate={form.expiryDate || new Date()}
            highlighted={autofilled.manufacturingDate}
            disabled={scanning}
          />

          {/* Divider */}
          <View style={styles.divider} />

          {/* 2. Expiry Date */}
          <DatePickerField
            label="Expiry Date *"
            value={form.expiryDate}
            onChange={(date) => update('expiryDate', date)}
            minimumDate={form.manufacturingDate || undefined}
            highlighted={autofilled.expiryDate}
            disabled={scanning}
          />

          {/* Date validation hint */}
          {form.manufacturingDate && form.expiryDate && (
            <View style={styles.dateHintRow}>
              <Text style={styles.dateHintText}>
                <Icon name={ICONS.shelfLife} size={14} color={Colors.info} style={{ marginRight: 4 }} />Shelf life:{' '}
                {Math.ceil(
                  (new Date(form.expiryDate) - new Date(form.manufacturingDate)) /
                  (1000 * 60 * 60 * 24),
                )}{' '}
                days
              </Text>
            </View>
          )}
        </View>

        {/* ── ADDITIONAL NOTES ─────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Additional Notes</Text>
          <FormInput
            label="Notes"
            placeholder="Any additional remarks..."
            value={form.notes}
            onChangeText={(v) => update('notes', v)}
            multiline
            disabled={scanning}
          />
        </View>

        {/* ── SUBMIT / CANCEL ──────────────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.submitBtn, (submitting || scanning) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting || scanning}
          activeOpacity={0.85}>
          {submitting ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <View style={styles.submitBtnContent}>
              <Icon name={ICONS.check} size={18} color={Colors.white} style={styles.submitBtnIcon} />
              <Text style={styles.submitBtnText}>Add to Inventory</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => navigation.goBack()}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

// ---------------------------------------------------------------------------
// SCAN CARD STYLES
// ---------------------------------------------------------------------------
const scanStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseWrapper: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: Colors.accent,
  },
  titleText: { flex: 1 },
  title: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  subtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 3 },

  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 4,
  },
  scanBtnText: { color: Colors.white, fontSize: 14, fontWeight: '700' },

  msgBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  msgSuccess: { backgroundColor: '#D1FAE5' },
  msgWarn: { backgroundColor: '#FEF3C7' },
  msgError: { backgroundColor: '#FEE2E2' },
  msgText: { fontSize: 13, fontWeight: '500', lineHeight: 19, flex: 1 },
  msgTextSuccess: { color: '#065F46' },
  msgTextWarn: { color: '#92400E' },
  msgTextError: { color: '#991B1B' },

  hintRow: {
    marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  hintText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  hintContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  hintIcon: {
    marginRight: 6,
    marginTop: 2,
  },
});

// ---------------------------------------------------------------------------
// INPUT STYLES
// ---------------------------------------------------------------------------
const inputStyles = StyleSheet.create({
  group: { marginBottom: 16 },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  // Plain text input row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    backgroundColor: Colors.background,
    overflow: 'hidden',
  },
  rowDisabled: { opacity: 0.5 },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  textArea: { height: 80, textAlignVertical: 'top' },

  // Date picker row
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 13,
    minHeight: 48,
  },
  dateRowHighlighted: {
    borderColor: Colors.accent,
    backgroundColor: '#F0FDF4',
  },
  dateRowDisabled: { opacity: 0.5 },
  dateIconWrap: { marginRight: 10 },
  dateText: { flex: 1, fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  datePlaceholder: { color: Colors.textMuted, fontWeight: '400' },
  dateTextHighlighted: { color: Colors.accentDark, fontWeight: '600' },
  clearBtn: { paddingLeft: 8 },
  clearBtnText: { color: Colors.textMuted, fontSize: 14, fontWeight: '600' },

  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  autofillBadge: {
    fontSize: 11,
    color: Colors.accent,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

// ---------------------------------------------------------------------------
// SCREEN STYLES
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { padding: 16, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: Colors.textSecondary },

  card: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  emptyStateText: {
    fontSize: 13,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
  manageStoresBtn: {
    marginTop: 16,
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  manageStoresBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },

  row: { flexDirection: 'row', gap: 12, marginBottom: 0 },
  halfInput: { flex: 1 },

  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: 12,
  },

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  catPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catPillText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  catPillTextActive: { color: Colors.white, fontWeight: '600' },

  dateHintRow: {
    marginTop: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dateHintText: { fontSize: 12, color: Colors.info, fontWeight: '500' },

  submitBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnIcon: {
    marginRight: 6,
  },
  submitBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  cancelBtn: { alignItems: 'center', paddingVertical: 12 },
  cancelBtnText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '600' },
});

export default AddProductScreen;
