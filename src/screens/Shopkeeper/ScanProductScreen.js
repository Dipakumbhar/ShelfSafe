import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Image,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { scanProduct } from '../../services/ocrService';
import Colors from '../../constants/Colors';
import Icon from '../../components/Icon';
import ICONS from '../../constants/Icons';

// Lazy-require so missing package does not crash the bundler
const getCameraModule = () => {
  try {
    const { launchCamera } = require('react-native-image-picker');
    if (typeof launchCamera !== 'function') return null;
    return launchCamera;
  } catch {
    return null;
  }
};

// Request camera permission on Android at runtime
const requestCameraPermission = async () => {
  if (Platform.OS !== 'android') return true;
  try {
    const results = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.CAMERA,
    ]);
    const granted =
      results[PermissionsAndroid.PERMISSIONS.CAMERA] ===
      PermissionsAndroid.RESULTS.GRANTED;
    if (!granted) {
      Alert.alert(
        'Permission Required',
        'Camera permission is required to scan product labels.\nPlease enable it in Settings.',
        [{ text: 'OK' }],
      );
    }
    return granted;
  } catch (err) {
    console.warn('[ScanProductScreen] Permission error:', err);
    return false;
  }
};

// ---------------------------------------------------------------------------
// STATES: idle → capturing → scanning → result | error
// ---------------------------------------------------------------------------

const INITIAL_DATES = { expiryDate: '', manufacturingDate: '', rawText: '' };

const ScanProductScreen = ({ navigation }) => {
  const [phase, setPhase] = useState('idle'); // idle | scanning | result | error
  const [imageUri, setImageUri] = useState(null);
  const [dates, setDates] = useState(INITIAL_DATES);
  const [editMode, setEditMode] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showRawText, setShowRawText] = useState(false);

  // -------------------------------------------------------------------------
  // Camera capture
  // -------------------------------------------------------------------------
  // Promise-based scan (react-native-image-picker v8+)
  const handleScan = useCallback(async () => {
    const launchCamera = getCameraModule();
    if (!launchCamera) {
      Alert.alert(
        'Package Not Installed',
        'Camera scanning requires react-native-image-picker and @react-native-ml-kit/text-recognition.\nPlease rebuild the app after installing.',
        [{ text: 'OK' }],
      );
      return;
    }

    // Runtime permission on Android
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      // No callback → forces Promise mode in v8+
      const response = await launchCamera({
        mediaType: 'photo',
        quality: 1.0,          // Maximum quality for best OCR accuracy
        saveToPhotos: false,
        includeBase64: false,
        maxWidth: 2048,        // Cap resolution — large enough for OCR, not too heavy
        maxHeight: 2048,
        cameraType: 'back',    // Always use rear camera for label scanning
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

      setImageUri(asset.uri);
      setPhase('scanning');
      setErrorMsg('');
      setDates(INITIAL_DATES);
      setEditMode(false);

      try {
        const { expiryDate, manufacturingDate, rawText, notConfigured } =
          await scanProduct(asset.uri);

        if (notConfigured) {
          setErrorMsg(
            'On-device OCR is not yet active. Rebuild the app after linking @react-native-ml-kit/text-recognition, or enter dates manually.',
          );
          setEditMode(true);
          setPhase('result');
          return;
        }

        const nothingFound = !expiryDate && !manufacturingDate;
        setDates({
          expiryDate: expiryDate || '',
          manufacturingDate: manufacturingDate || '',
          rawText: rawText || '',
        });
        setShowRawText(false);

        if (nothingFound) {
          setErrorMsg(
            'Could not detect any dates. The image may be blurry or the label format is unsupported.\nPlease enter dates manually.',
          );
          setEditMode(true);
        }
        setPhase('result');
      } catch (ocrErr) {
        console.error('[ScanProductScreen] OCR error:', ocrErr);
        setErrorMsg(
          ocrErr?.message ||
            'Scanning failed. Please retake the photo with better lighting.',
        );
        setPhase('error');
      }
    } catch (cameraErr) {
      console.error('[ScanProductScreen] Camera error:', cameraErr);
      Alert.alert(
        'Camera Error',
        'Could not open the camera. Please check camera permissions in Settings.',
        [{ text: 'OK' }],
      );
    }
  }, []);

  // -------------------------------------------------------------------------
  // Confirm — navigate to AddProductScreen with pre-filled dates
  // -------------------------------------------------------------------------
  const handleConfirm = useCallback(() => {
    navigation.navigate('AddProduct', {
      prefill: {
        expiryDate: dates.expiryDate.trim(),
        manufacturingDate: dates.manufacturingDate.trim(),
      },
    });
  }, [navigation, dates]);

  // -------------------------------------------------------------------------
  // Reset to scan again
  // -------------------------------------------------------------------------
  const handleReset = useCallback(() => {
    setPhase('idle');
    setImageUri(null);
    setDates(INITIAL_DATES);
    setEditMode(false);
    setErrorMsg('');
    setShowRawText(false);
  }, []);

  // -------------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------------
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled">

        {/* ── IDLE / INSTRUCTION PHASE ── */}
        {phase === 'idle' && (
          <>
            <View style={styles.instructionCard}>
              <View style={styles.instructionIconWrap}>
                <Icon name={ICONS.camera} size={48} color={Colors.primary} />
              </View>
              <Text style={styles.instructionTitle}>
                Scan Product Expiry Label
              </Text>
              <Text style={styles.instructionText}>
                Position the camera so the expiry date label is clearly
                visible and well-lit. Avoid shadows and blurring.
              </Text>
              <View style={styles.tipRow}>
                <Icon name={ICONS.check} size={14} color={Colors.accent} style={styles.tipIcon} />
                <Text style={styles.tipText}>
                  Take a close-up, focused photo
                </Text>
              </View>
              <View style={styles.tipRow}>
                <Icon name={ICONS.check} size={14} color={Colors.accent} style={styles.tipIcon} />
                <Text style={styles.tipText}>
                  Ensure enough light (avoid flash glare)
                </Text>
              </View>
              <View style={styles.tipRow}>
                <Icon name={ICONS.check} size={14} color={Colors.accent} style={styles.tipIcon} />
                <Text style={styles.tipText}>
                  Look for labels like EXP, MFG, BEST BEFORE
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.scanBtn}
              onPress={handleScan}
              activeOpacity={0.85}>
              <Icon name={ICONS.camera} size={20} color={Colors.white} />
              <Text style={styles.scanBtnText}>Scan Product</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.manualBtn}
              onPress={() => navigation.navigate('AddProduct', {})}
              activeOpacity={0.8}>
              <Text style={styles.manualBtnText}>Enter Manually Instead</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── SCANNING PHASE ── */}
        {phase === 'scanning' && (
          <View style={styles.loadingCard}>
            {imageUri && (
              <Image
                source={{ uri: imageUri }}
                style={styles.previewImage}
                resizeMode="cover"
              />
            )}
            <View style={styles.loadingContent}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingTitle}>Analysing Image...</Text>
              <Text style={styles.loadingSubtitle}>
                Running text recognition on the label
              </Text>
            </View>
          </View>
        )}

        {/* ── RESULT PHASE ── */}
        {phase === 'result' && (
          <>
            {/* Captured Image Preview */}
            {imageUri && (
              <Image
                source={{ uri: imageUri }}
                style={styles.resultImage}
                resizeMode="cover"
              />
            )}

            {/* Error / Warning Banner */}
            {errorMsg !== '' && (
              <View style={styles.warnBanner}>
                <Icon name={ICONS.warning} size={18} color="#92400E" />
                <Text style={styles.warnText}>{errorMsg}</Text>
              </View>
            )}

            {/* Detected Details Card */}
            <View style={styles.resultCard}>
              <View style={styles.resultCardTitleRow}>
                {!errorMsg && <Icon name={ICONS.check} size={16} color={Colors.accent} style={styles.resultTitleIcon} />}
                <Text style={styles.resultCardTitle}>
                  {errorMsg ? 'Enter Dates Manually' : 'Detected Details'}
                </Text>
              </View>

              {/* Expiry Date */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Expiry Date</Text>
                {editMode ? (
                  <TextInput
                    style={styles.fieldInput}
                    value={dates.expiryDate}
                    onChangeText={(v) =>
                      setDates((prev) => ({ ...prev, expiryDate: v }))
                    }
                    placeholder="e.g. 10/05/2026 or 2026-05-10"
                    placeholderTextColor={Colors.textMuted}
                    autoCapitalize="characters"
                  />
                ) : (
                  <View style={[styles.fieldValue, !dates.expiryDate && styles.fieldValueEmpty]}>
                    <Text
                      style={[
                        styles.fieldValueText,
                        !dates.expiryDate && styles.fieldValueTextEmpty,
                      ]}>
                      {dates.expiryDate || 'Not detected'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Manufacturing Date */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Manufacturing Date</Text>
                {editMode ? (
                  <TextInput
                    style={styles.fieldInput}
                    value={dates.manufacturingDate}
                    onChangeText={(v) =>
                      setDates((prev) => ({ ...prev, manufacturingDate: v }))
                    }
                    placeholder="e.g. 10/02/2026 or 2026-02-10"
                    placeholderTextColor={Colors.textMuted}
                    autoCapitalize="characters"
                  />
                ) : (
                  <View style={[styles.fieldValue, !dates.manufacturingDate && styles.fieldValueEmpty]}>
                    <Text
                      style={[
                        styles.fieldValueText,
                        !dates.manufacturingDate && styles.fieldValueTextEmpty,
                      ]}>
                      {dates.manufacturingDate || 'Not detected'}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleConfirm}
                activeOpacity={0.85}>
                <Icon name={ICONS.check} size={16} color={Colors.white} style={styles.btnIcon} />
                <Text style={styles.confirmBtnText}>Confirm & Fill Form</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => setEditMode(!editMode)}
                activeOpacity={0.8}>
                <Icon
                  name={editMode ? ICONS.check : ICONS.edit}
                  size={16}
                  color={Colors.primary}
                  style={styles.btnIcon}
                />
                <Text style={styles.editBtnText}>
                  {editMode ? 'Done' : 'Edit'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Raw OCR text — collapsible debug view */}
            {dates.rawText !== '' && (
              <TouchableOpacity
                onPress={() => setShowRawText(!showRawText)}
                style={styles.rawTextToggle}
                activeOpacity={0.7}>
                <Text style={styles.rawTextToggleText}>
                  {showRawText ? '▲ Hide' : '▼ Show'} OCR raw text
                </Text>
              </TouchableOpacity>
            )}
            {showRawText && dates.rawText !== '' && (
              <View style={styles.rawTextBox}>
                <Text style={styles.rawTextContent}>{dates.rawText}</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.rescanBtn}
              onPress={handleReset}
              activeOpacity={0.8}>
              <Icon name={ICONS.refresh} size={16} color={Colors.textSecondary} style={styles.btnIcon} />
              <Text style={styles.rescanBtnText}>Scan Again</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── ERROR PHASE ── */}
        {phase === 'error' && (
          <>
            {imageUri && (
              <Image
                source={{ uri: imageUri }}
                style={styles.resultImage}
                resizeMode="cover"
              />
            )}
            <View style={styles.errorCard}>
              <Icon name={ICONS.error} size={36} color={Colors.danger} style={styles.errorIconStyle} />
              <Text style={styles.errorTitle}>Scan Failed</Text>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>

            <TouchableOpacity
              style={styles.scanBtn}
              onPress={handleReset}
              activeOpacity={0.85}>
              <Icon name={ICONS.refresh} size={20} color={Colors.white} />
              <Text style={styles.scanBtnText}>Try Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.manualBtn}
              onPress={() => navigation.navigate('AddProduct', {})}
              activeOpacity={0.8}>
              <Text style={styles.manualBtnText}>Enter Manually</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { padding: 16, paddingBottom: 40 },

  // Instruction
  instructionCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 22,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  instructionIconWrap: { marginBottom: 12 },
  instructionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 10,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  tipRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  tipIcon: {
    marginRight: 8,
    marginTop: 1,
  },
  tipText: { fontSize: 13, color: Colors.textSecondary, flex: 1, lineHeight: 19 },

  // Scan Button
  scanBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 12,
    gap: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  scanBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Manual Button
  manualBtn: { alignItems: 'center', paddingVertical: 12 },
  manualBtnText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },

  // Loading
  loadingCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  previewImage: { width: '100%', height: 200 },
  loadingContent: {
    padding: 28,
    alignItems: 'center',
    gap: 10,
  },
  loadingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  loadingSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },

  // Result Image
  resultImage: {
    width: '100%',
    height: 190,
    borderRadius: 14,
    marginBottom: 14,
  },

  // Warning Banner
  warnBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    alignItems: 'flex-start',
    gap: 10,
  },
  warnText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 19,
    fontWeight: '500',
  },

  // Result Card
  resultCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  resultCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultTitleIcon: {
    marginRight: 6,
  },
  resultCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  fieldGroup: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldValue: {
    backgroundColor: '#EBF8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: Colors.accent,
  },
  fieldValueEmpty: {
    backgroundColor: Colors.background,
    borderColor: Colors.border,
  },
  fieldValueText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.accent,
    letterSpacing: 0.3,
  },
  fieldValueTextEmpty: {
    color: Colors.textMuted,
    fontWeight: '500',
    fontSize: 14,
  },
  fieldInput: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
  },

  // Action Buttons
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  btnIcon: { marginRight: 4 },
  confirmBtn: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  editBtnText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  rescanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  rescanBtnText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },

  // Raw OCR text debug panel
  rawTextToggle: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 4,
  },
  rawTextToggleText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  rawTextBox: {
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rawTextContent: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 17,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },

  // Error Card
  errorCard: {
    backgroundColor: '#FFF5F5',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FED7D7',
  },
  errorIconStyle: { marginBottom: 10 },
  errorTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.danger,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ScanProductScreen;
