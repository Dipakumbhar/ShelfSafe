import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import { scanProduct } from '../../services/ocrService';
import { addProduct } from '../../services/productService';
import { useAuth } from '../../context/AuthContext';
import Colors from '../../constants/Colors';

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
  expiryDate: '',
  manufacturingDate: '',
  notes: '',
};

// ---------------------------------------------------------------------------
// Lazy-require camera so missing package doesn't crash the bundler
// ---------------------------------------------------------------------------
const getCameraModule = () => {
  try {
    const { launchCamera } = require('react-native-image-picker');
    return launchCamera;
  } catch {
    return null;
  }
};

// Lazy-require vector icons
const getIcon = (name, size = 18, color = Colors.white) => {
  try {
    const MaterialIcons = require('react-native-vector-icons/MaterialIcons').default;
    return <MaterialIcons name={name} size={size} color={color} />;
  } catch {
    // Fallback text representations
    const fallbacks = {
      'camera-alt': '📷',
      'check-circle': '✓',
      'warning': '⚠',
      'error': '✕',
      'auto-fix-high': '✦',
    };
    return <Text style={{ fontSize: size - 4, color }}>{fallbacks[name] || '•'}</Text>;
  }
};

// ---------------------------------------------------------------------------
// SUB-COMPONENTS
// ---------------------------------------------------------------------------
const FormInput = ({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType,
  multiline,
  highlighted,
  onScanPress,
}) => (
  <View style={inputStyles.group}>
    <Text style={inputStyles.label}>{label}</Text>
    <View style={[inputStyles.row, highlighted && inputStyles.rowHighlighted]}>
      <TextInput
        style={[inputStyles.input, multiline && inputStyles.textArea]}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType || 'default'}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
      {onScanPress && (
        <TouchableOpacity
          style={inputStyles.cameraBtn}
          onPress={onScanPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          {getIcon('camera-alt', 18, Colors.primary)}
        </TouchableOpacity>
      )}
    </View>
    {highlighted && (
      <View style={inputStyles.badgeRow}>
        {getIcon('auto-fix-high', 13, Colors.accent)}
        <Text style={inputStyles.autofillBadge}>Auto-filled by scan</Text>
      </View>
    )}
  </View>
);

// ---------------------------------------------------------------------------
// PULSING SCAN ANIMATION
// ---------------------------------------------------------------------------
const PulsingRing = () => {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
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
    ).start();
    return () => pulse.stopAnimation();
  }, [pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] });

  return (
    <View style={scanStyles.pulseWrapper}>
      <Animated.View
        style={[scanStyles.pulseRing, { transform: [{ scale }], opacity }]}
      />
      {getIcon('camera-alt', 28, Colors.white)}
    </View>
  );
};

// ---------------------------------------------------------------------------
// MAIN SCREEN
// ---------------------------------------------------------------------------
const AddProductScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const prefill = route?.params?.prefill || {};
  const [form, setForm] = useState({ ...EMPTY_FORM, ...prefill });
  const [autofilled, setAutofilled] = useState({
    expiryDate: false,
    manufacturingDate: false,
  });
  const [scanning, setScanning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [scanMsg, setScanMsg] = useState('');
  const [scanStatus, setScanStatus] = useState(''); // 'success' | 'warn' | 'error' | ''

  const update = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    if (autofilled[key]) {
      setAutofilled((prev) => ({ ...prev, [key]: false }));
    }
  };

  // -------------------------------------------------------------------------
  // SCAN HANDLER
  // -------------------------------------------------------------------------
  const handleScan = () => {
    const launchCamera = getCameraModule();

    if (!launchCamera) {
      Alert.alert(
        'Camera Not Available',
        'Please make sure react-native-image-picker is installed and the app is rebuilt.',
        [{ text: 'OK' }],
      );
      return;
    }

    launchCamera(
      { mediaType: 'photo', quality: 0.9, saveToPhotos: false },
      async (response) => {
        if (response.didCancel) return;
        if (response.errorCode) {
          Alert.alert('Camera Error', response.errorMessage || 'Could not open the camera.');
          return;
        }

        const asset = response.assets?.[0];
        if (!asset?.uri) {
          Alert.alert('Error', 'No image captured. Please try again.');
          return;
        }

        setScanning(true);
        setScanMsg('');
        setScanStatus('');

        try {
          const { expiryDate, manufacturingDate, rawText, notConfigured } =
            await scanProduct(asset.uri);

          // ML Kit not yet linked (needs rebuild after install)
          if (notConfigured) {
            setScanMsg('📷  Photo captured! Rebuild the app to activate on-device OCR.');
            setScanStatus('warn');
            return;
          }

          // No text detected at all
          if (rawText === '' && !expiryDate && !manufacturingDate) {
            Alert.alert(
              'Unable to Detect Date',
              'No text found in the image. Please capture a clear image of the expiry label and try again.',
              [{ text: 'Enter Manually' }],
            );
            setScanStatus('');
            return;
          }

          // Apply detected dates
          setForm((prev) => ({
            ...prev,
            expiryDate: expiryDate || prev.expiryDate,
            manufacturingDate: manufacturingDate || prev.manufacturingDate,
          }));
          setAutofilled({
            expiryDate: !!expiryDate,
            manufacturingDate: !!manufacturingDate,
          });

          const found = expiryDate || manufacturingDate;
          if (found) {
            const parts = [];
            if (expiryDate) parts.push(`Expiry: ${expiryDate}`);
            if (manufacturingDate) parts.push(`MFG: ${manufacturingDate}`);
            setScanMsg(`Detected — ${parts.join('  ·  ')}`);
            setScanStatus('success');
          } else {
            // Text found but no recognisable dates
            Alert.alert(
              'Unable to Detect Date',
              'Text was found but no expiry/manufacturing date could be read. Please enter dates manually.',
              [{ text: 'OK' }],
            );
            setScanStatus('warn');
            setScanMsg('No dates detected — please enter manually.');
          }
        } catch (err) {
          console.error('Scan error:', err);
          setScanMsg('Scan failed. Please enter dates manually.');
          setScanStatus('error');
        } finally {
          setScanning(false);
        }
      },
    );
  };

  // -------------------------------------------------------------------------
  // SUBMIT
  // -------------------------------------------------------------------------
  const handleSubmit = async () => {
    const { name, category, quantity, expiryDate } = form;
    if (!name || !category || !quantity || !expiryDate) {
      Alert.alert(
        'Required Fields',
        'Please fill in Name, Category, Quantity, and Expiry Date.',
      );
      return;
    }

    if (submitting) return;
    setSubmitting(true);

    try {
      await addProduct(user.uid, form);
      Alert.alert('Product Added', `"${name}" has been added to inventory.`, [
        {
          text: 'Add Another',
          onPress: () => {
            setForm(EMPTY_FORM);
            setAutofilled({ expiryDate: false, manufacturingDate: false });
            setScanMsg('');
            setScanStatus('');
          },
        },
        { text: 'Go to Inventory', onPress: () => navigation.navigate('Products') },
      ]);
    } catch (err) {
      console.error('Failed to add product:', err);
      Alert.alert('Error', 'Failed to save product. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // -------------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------------
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled">

        {/* ── OCR SCAN CARD ── */}
        <View style={scanStyles.card}>
          {/* Header row */}
          <View style={scanStyles.headerRow}>
            <View style={scanStyles.titleBlock}>
              {/* Animated icon or pulsing ring */}
              {scanning ? (
                <PulsingRing />
              ) : (
                <View style={scanStyles.iconCircle}>
                  {getIcon('camera-alt', 26, Colors.white)}
                </View>
              )}
              <View style={scanStyles.titleText}>
                <Text style={scanStyles.title}>Scan Expiry Date</Text>
                <Text style={scanStyles.subtitle}>
                  {scanning
                    ? 'Reading label… please wait'
                    : 'Capture clear image of expiry label'}
                </Text>
              </View>
            </View>

            {!scanning && (
              <TouchableOpacity
                style={scanStyles.scanBtn}
                onPress={handleScan}
                activeOpacity={0.85}>
                <Text style={scanStyles.scanBtnText}>Scan</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Result message */}
          {scanMsg !== '' && !scanning && (
            <View
              style={[
                scanStyles.msgBox,
                scanStatus === 'success' && scanStyles.msgSuccess,
                scanStatus === 'warn' && scanStyles.msgWarn,
                scanStatus === 'error' && scanStyles.msgError,
              ]}>
              {scanStatus === 'success' && getIcon('check-circle', 15, '#065F46')}
              {scanStatus === 'warn' && getIcon('warning', 15, '#92400E')}
              {scanStatus === 'error' && getIcon('error', 15, '#991B1B')}
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
        </View>

        {/* ── PRODUCT INFO ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Product Information</Text>
          <FormInput
            label="Product Name *"
            placeholder="e.g. Basmati Rice"
            value={form.name}
            onChangeText={(v) => update('name', v)}
          />
          <FormInput
            label="Batch Number"
            placeholder="e.g. BT-2025-001"
            value={form.batchNo}
            onChangeText={(v) => update('batchNo', v)}
          />
        </View>

        {/* ── CATEGORY ── */}
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

        {/* ── STOCK DETAILS ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Stock Details</Text>
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={inputStyles.label}>Quantity *</Text>
              <TextInput
                style={inputStyles.input}
                placeholder="e.g. 50"
                placeholderTextColor={Colors.textMuted}
                value={form.quantity}
                onChangeText={(v) => update('quantity', v)}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={inputStyles.label}>Unit</Text>
              <TextInput
                style={inputStyles.input}
                placeholder="kg / liters / pcs"
                placeholderTextColor={Colors.textMuted}
                value={form.unit}
                onChangeText={(v) => update('unit', v)}
              />
            </View>
          </View>

          <FormInput
            label="Expiry Date * (DD/MM/YYYY or YYYY-MM-DD)"
            placeholder="e.g. 2026-12-31"
            value={form.expiryDate}
            onChangeText={(v) => update('expiryDate', v)}
            highlighted={autofilled.expiryDate}
            onScanPress={handleScan}
          />
          <FormInput
            label="Manufacturing Date (DD/MM/YYYY or YYYY-MM-DD)"
            placeholder="e.g. 2026-02-01"
            value={form.manufacturingDate}
            onChangeText={(v) => update('manufacturingDate', v)}
            highlighted={autofilled.manufacturingDate}
            onScanPress={handleScan}
          />
        </View>

        {/* ── NOTES ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Additional Notes</Text>
          <FormInput
            label="Notes"
            placeholder="Any additional remarks..."
            value={form.notes}
            onChangeText={(v) => update('notes', v)}
            multiline
          />
        </View>

        {/* ── SUBMIT ── */}
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          activeOpacity={0.85}>
          <Text style={styles.submitBtnText}>
            {submitting ? 'Saving…' : '✓  Add to Inventory'}
          </Text>
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
    backgroundColor: Colors.accent,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
});

// ---------------------------------------------------------------------------
// INPUT STYLES (shared across FormInput)
// ---------------------------------------------------------------------------
const inputStyles = StyleSheet.create({
  group: { marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    backgroundColor: Colors.background,
    overflow: 'hidden',
  },
  rowHighlighted: {
    borderColor: Colors.accent,
    backgroundColor: '#F0FDF4',
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  cameraBtn: {
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
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
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary, marginBottom: 14 },

  row: { flexDirection: 'row', gap: 12, marginBottom: 0 },
  halfInput: { flex: 1 },

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
  submitBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  cancelBtn: { alignItems: 'center', paddingVertical: 12 },
  cancelBtnText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '600' },
});

export default AddProductScreen;
