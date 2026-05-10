import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
  Alert,
} from 'react-native';
import { Card, ActivityIndicator } from 'react-native-paper';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { scanProduct } from '../../services/ocrService';
import Colors from '../../constants/Colors';
import AppHeader from '../../components/AppHeader';
import AnimatedScreen from '../../components/AnimatedScreen';
import AnimatedButton from '../../components/AnimatedButton';
import AnimatedCard from '../../components/AnimatedCard';

// Lazy-require so missing package does not crash the bundler
const getCameraModule = () => {
  try {
    const { launchCamera } = require('react-native-image-picker');
    return launchCamera;
  } catch {
    return null;
  }
};

// ---------------------------------------------------------------------------
// STATES: idle → capturing → scanning → result | error
// ---------------------------------------------------------------------------

const INITIAL_DATES = { expiryDate: '', manufacturingDate: '' };

const ScanProductScreen = ({ navigation }) => {
  const [phase, setPhase] = useState('idle'); // idle | scanning | result | error
  const [imageUri, setImageUri] = useState(null);
  const [dates, setDates] = useState(INITIAL_DATES);
  const [editMode, setEditMode] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // -------------------------------------------------------------------------
  // Camera capture
  // -------------------------------------------------------------------------
  const handleScan = async () => {
    const launchCamera = getCameraModule();
    if (!launchCamera) {
      Alert.alert(
        'Package Not Installed',
        'Camera scanning requires:\n\nnpm install react-native-image-picker @react-native-ml-kit/text-recognition\n\nAfter installing, rebuild the app.',
        [{ text: 'OK' }],
      );
      return;
    }

    const options = {
      mediaType: 'photo',
      quality: 0.9,
      saveToPhotos: false,
      includeBase64: false,
    };

    launchCamera(options, async (response) => {
      if (response.didCancel) {
        return;
      }
      if (response.errorCode) {
        Alert.alert(
          'Camera Error',
          response.errorMessage || 'Could not open camera.',
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
        const { expiryDate, manufacturingDate } = await scanProduct(asset.uri);
        const nothingFound = !expiryDate && !manufacturingDate;

        setDates({
          expiryDate: expiryDate || '',
          manufacturingDate: manufacturingDate || '',
        });

        if (nothingFound) {
          setErrorMsg(
            'Could not detect any dates. The image may be blurry or the label format is unsupported.\nPlease enter dates manually.',
          );
          setEditMode(true);
        }
        setPhase('result');
      } catch (err) {
        console.error('OCR error:', err);
        setErrorMsg(
          'Scanning failed. Please retake the photo with better lighting.',
        );
        setPhase('error');
      }
    });
  };

  // -------------------------------------------------------------------------
  // Confirm — navigate to AddProductScreen with pre-filled dates
  // -------------------------------------------------------------------------
  const handleConfirm = () => {
    navigation.navigate('AddProduct', {
      prefill: {
        expiryDate: dates.expiryDate.trim(),
        manufacturingDate: dates.manufacturingDate.trim(),
      },
    });
  };

  // -------------------------------------------------------------------------
  // Reset to scan again
  // -------------------------------------------------------------------------
  const handleReset = () => {
    setPhase('idle');
    setImageUri(null);
    setDates(INITIAL_DATES);
    setEditMode(false);
    setErrorMsg('');
  };

  // -------------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------------
  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title="Scan Product"
        navigation={navigation}
        showBack
      />
      <AnimatedScreen>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled">

          {/* ── IDLE / INSTRUCTION PHASE ── */}
          {phase === 'idle' && (
            <>
              <AnimatedCard index={0}>
                <Card style={styles.instructionCard}>
                  <Card.Content style={styles.instructionContent}>
                    <Text style={styles.instructionIcon}>📷</Text>
                    <Text style={styles.instructionTitle}>
                      Scan Product Expiry Label
                    </Text>
                    <Text style={styles.instructionText}>
                      Position the camera so the expiry date label is clearly
                      visible and well-lit. Avoid shadows and blurring.
                    </Text>
                    <View style={styles.tipRow}>
                      <Text style={styles.tipDot}>✔</Text>
                      <Text style={styles.tipText}>
                        Take a close-up, focused photo
                      </Text>
                    </View>
                    <View style={styles.tipRow}>
                      <Text style={styles.tipDot}>✔</Text>
                      <Text style={styles.tipText}>
                        Ensure enough light (avoid flash glare)
                      </Text>
                    </View>
                    <View style={styles.tipRow}>
                      <Text style={styles.tipDot}>✔</Text>
                      <Text style={styles.tipText}>
                        Look for labels like EXP, MFG, BEST BEFORE
                      </Text>
                    </View>
                  </Card.Content>
                </Card>
              </AnimatedCard>

              <AnimatedCard index={1}>
                <AnimatedButton
                  label="Scan Product"
                  icon="📷"
                  mode="contained"
                  onPress={handleScan}
                  style={styles.scanBtn}
                />
              </AnimatedCard>

              <AnimatedCard index={2}>
                <AnimatedButton
                  label="Enter Manually Instead"
                  mode="text"
                  onPress={() => navigation.navigate('AddProduct', {})}
                />
              </AnimatedCard>
            </>
          )}

          {/* ── SCANNING PHASE ── */}
          {phase === 'scanning' && (
            <Animated.View entering={FadeIn.duration(400)}>
              <Card style={styles.loadingCard}>
                {imageUri && (
                  <Card.Cover
                    source={{ uri: imageUri }}
                    style={styles.previewImage}
                  />
                )}
                <Card.Content style={styles.loadingContent}>
                  <ActivityIndicator
                    size="large"
                    color={Colors.primary}
                    animating
                  />
                  <Text style={styles.loadingTitle}>Analysing Image...</Text>
                  <Text style={styles.loadingSubtitle}>
                    Running text recognition on the label
                  </Text>
                </Card.Content>
              </Card>
            </Animated.View>
          )}

          {/* ── RESULT PHASE ── */}
          {phase === 'result' && (
            <>
              {/* Captured Image Preview */}
              {imageUri && (
                <Animated.View entering={FadeIn.duration(400)}>
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.resultImage}
                    resizeMode="cover"
                  />
                </Animated.View>
              )}

              {/* Error / Warning Banner */}
              {errorMsg !== '' && (
                <Animated.View
                  entering={FadeInDown.delay(100).duration(400)}
                  style={styles.warnBanner}>
                  <Text style={styles.warnIcon}>⚠</Text>
                  <Text style={styles.warnText}>{errorMsg}</Text>
                </Animated.View>
              )}

              {/* Detected Details Card */}
              <Animated.View entering={FadeInDown.delay(150).duration(400)}>
                <Card style={styles.resultCard}>
                  <Card.Content>
                    <Text style={styles.resultCardTitle}>
                      {errorMsg ? 'Enter Dates Manually' : '✅  Detected Details'}
                    </Text>

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
                        <View
                          style={[
                            styles.fieldValue,
                            !dates.expiryDate && styles.fieldValueEmpty,
                          ]}>
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
                            setDates((prev) => ({
                              ...prev,
                              manufacturingDate: v,
                            }))
                          }
                          placeholder="e.g. 10/02/2026 or 2026-02-10"
                          placeholderTextColor={Colors.textMuted}
                          autoCapitalize="characters"
                        />
                      ) : (
                        <View
                          style={[
                            styles.fieldValue,
                            !dates.manufacturingDate && styles.fieldValueEmpty,
                          ]}>
                          <Text
                            style={[
                              styles.fieldValueText,
                              !dates.manufacturingDate &&
                                styles.fieldValueTextEmpty,
                            ]}>
                            {dates.manufacturingDate || 'Not detected'}
                          </Text>
                        </View>
                      )}
                    </View>
                  </Card.Content>
                </Card>
              </Animated.View>

              {/* Action Buttons */}
              <Animated.View
                entering={FadeInDown.delay(250).duration(400)}
                style={styles.actionRow}>
                <AnimatedButton
                  label="✓ Confirm & Fill"
                  mode="contained"
                  onPress={handleConfirm}
                  color={Colors.accent}
                  style={styles.confirmBtn}
                />
                <AnimatedButton
                  label={editMode ? '✓ Done' : '✏ Edit'}
                  mode="outlined"
                  onPress={() => setEditMode(!editMode)}
                  style={styles.editBtn}
                />
              </Animated.View>

              <AnimatedButton
                label="🔄 Scan Again"
                mode="text"
                onPress={handleReset}
              />
            </>
          )}

          {/* ── ERROR PHASE ── */}
          {phase === 'error' && (
            <>
              {imageUri && (
                <Animated.View entering={FadeIn.duration(400)}>
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.resultImage}
                    resizeMode="cover"
                  />
                </Animated.View>
              )}
              <Animated.View entering={FadeInDown.delay(100).duration(400)}>
                <Card style={styles.errorCard}>
                  <Card.Content style={styles.errorContent}>
                    <Text style={styles.errorIcon}>❌</Text>
                    <Text style={styles.errorTitle}>Scan Failed</Text>
                    <Text style={styles.errorText}>{errorMsg}</Text>
                  </Card.Content>
                </Card>
              </Animated.View>

              <AnimatedCard index={1}>
                <AnimatedButton
                  label="🔄 Try Again"
                  icon=""
                  mode="contained"
                  onPress={handleReset}
                  style={styles.scanBtn}
                />
              </AnimatedCard>

              <AnimatedCard index={2}>
                <AnimatedButton
                  label="Enter Manually"
                  mode="text"
                  onPress={() => navigation.navigate('AddProduct', {})}
                />
              </AnimatedCard>
            </>
          )}
        </ScrollView>
      </AnimatedScreen>
    </SafeAreaView>
  );
};

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { padding: 16, paddingBottom: 40 },

  // Instruction Card
  instructionCard: {
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    backgroundColor: Colors.white,
  },
  instructionContent: {
    alignItems: 'center',
    padding: 22,
  },
  instructionIcon: { fontSize: 48, marginBottom: 12 },
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
  tipDot: {
    fontSize: 13,
    color: Colors.accent,
    fontWeight: '700',
    marginRight: 8,
    marginTop: 1,
  },
  tipText: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 19,
  },

  // Scan Button
  scanBtn: {
    marginBottom: 12,
  },

  // Loading Card
  loadingCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 3,
    backgroundColor: Colors.white,
  },
  previewImage: { height: 200 },
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
  warnIcon: { fontSize: 18 },
  warnText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 19,
    fontWeight: '500',
  },

  // Result Card
  resultCard: {
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    backgroundColor: Colors.white,
  },
  resultCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
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
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  confirmBtn: {
    flex: 2,
  },
  editBtn: {
    flex: 1,
  },

  // Error Card
  errorCard: {
    borderRadius: 16,
    marginBottom: 16,
    elevation: 0,
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FED7D7',
  },
  errorContent: {
    alignItems: 'center',
    padding: 24,
  },
  errorIcon: { fontSize: 36, marginBottom: 10 },
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
