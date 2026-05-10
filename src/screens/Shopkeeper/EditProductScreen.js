import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { updateProduct } from '../../services/productService';
import { getUserData } from '../../services/userService';
import Colors from '../../constants/Colors';
import Icon from '../../components/Icon';
import ICONS from '../../constants/Icons';

const CATEGORIES = [
  'Grains', 'Dairy', 'Oils', 'Condiments', 'Beverages', 'Snacks', 'Other',
];

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

const DatePickerField = ({
  label,
  value,
  onChange,
  maximumDate,
  minimumDate,
}) => {
  const [show, setShow] = useState(false);

  const onDateChange = useCallback(
    (_event, selectedDate) => {
      setShow(Platform.OS === 'ios');
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
        style={inputStyles.dateRow}
        onPress={() => setShow(true)}
        activeOpacity={0.75}>
        <View style={inputStyles.dateIconWrap}>
          <Icon name={ICONS.calendar} size={18} color={Colors.textSecondary} />
        </View>
        <Text style={[inputStyles.dateText, !value && inputStyles.datePlaceholder]}>
          {value ? formatDate(value) : 'Tap to select date'}
        </Text>
        {value && (
          <TouchableOpacity
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => onChange(null)}
            style={inputStyles.clearBtn}>
            <Icon name={ICONS.close} size={14} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

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

const FormInput = ({ label, placeholder, value, onChangeText, keyboardType, multiline }) => (
  <View style={inputStyles.group}>
    <Text style={inputStyles.label}>{label}</Text>
    <View style={inputStyles.row}>
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
    </View>
  </View>
);

const EditProductScreen = ({ navigation, route }) => {
  const { product } = route.params;

  const [form, setForm] = useState({
    name: product.name || '',
    category: product.category || '',
    quantity: String(product.quantity || ''),
    unit: product.unit || '',
    batchNo: product.batchNo || '',
    manufacturingDate: product.manufacturingDate ? new Date(product.manufacturingDate) : null,
    expiryDate: product.expiryDate ? new Date(product.expiryDate) : null,
    notes: product.notes || '',
  });

  const [submitting, setSubmitting] = useState(false);

  const update = useCallback((key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  }, []);

  const { user } = useAuth();

  const handleSubmit = useCallback(async () => {
    const { name, category, quantity, expiryDate } = form;
    if (!name.trim() || !category || !quantity.trim() || !expiryDate) {
      Alert.alert('Required Fields', 'Please fill in Product Name, Category, Quantity, and Expiry Date.');
      return;
    }

    if (form.manufacturingDate && expiryDate) {
      if (form.manufacturingDate > expiryDate) {
        Alert.alert('Date Error', 'Manufacturing date cannot be after the expiry date.');
        return;
      }
    }

    if (submitting) return;
    setSubmitting(true);

    try {
      const payload = {
        ...form,
        manufacturingDate: form.manufacturingDate ? form.manufacturingDate.toISOString() : null,
        expiryDate: form.expiryDate ? form.expiryDate.toISOString() : null,
      };

      // Read user notification preference
      let notificationsEnabled = true;
      try {
        const userData = await getUserData(user?.uid);
        if (userData?.settings?.notificationsEnabled !== undefined) {
          notificationsEnabled = userData.settings.notificationsEnabled;
        }
      } catch (_) { /* non-blocking */ }

      const notifResult = await updateProduct(product.id, payload, notificationsEnabled);

      // Build notification feedback message
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
        'Product Updated',
        `"${name}" has been updated.${notifMsg}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      console.error('[EditProductScreen] Failed to update product:', err);
      Alert.alert('Error', 'Failed to update product. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [form, submitting, navigation, product.id, user]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Product Information</Text>
          <FormInput label="Product Name *" placeholder="e.g. Basmati Rice" value={form.name} onChangeText={(v) => update('name', v)} />
          <FormInput label="Batch Number" placeholder="e.g. BT-2025-001" value={form.batchNo} onChangeText={(v) => update('batchNo', v)} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Category *</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity key={cat} style={[styles.catPill, form.category === cat && styles.catPillActive]} onPress={() => update('category', cat)}>
                <Text style={[styles.catPillText, form.category === cat && styles.catPillTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Stock Details</Text>
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={inputStyles.label}>Quantity *</Text>
              <View style={inputStyles.row}>
                <TextInput style={inputStyles.input} placeholder="e.g. 50" placeholderTextColor={Colors.textMuted} value={form.quantity} onChangeText={(v) => update('quantity', v)} keyboardType="numeric" />
              </View>
            </View>
            <View style={styles.halfInput}>
              <Text style={inputStyles.label}>Unit</Text>
              <View style={inputStyles.row}>
                <TextInput style={inputStyles.input} placeholder="kg / liters / pcs" placeholderTextColor={Colors.textMuted} value={form.unit} onChangeText={(v) => update('unit', v)} />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dates</Text>
          <DatePickerField label="Manufacturing Date" value={form.manufacturingDate} onChange={(date) => update('manufacturingDate', date)} maximumDate={form.expiryDate || new Date()} />
          <View style={styles.divider} />
          <DatePickerField label="Expiry Date *" value={form.expiryDate} onChange={(date) => update('expiryDate', date)} minimumDate={form.manufacturingDate || undefined} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Additional Notes</Text>
          <FormInput label="Notes" placeholder="Any additional remarks..." value={form.notes} onChangeText={(v) => update('notes', v)} multiline />
        </View>

        <TouchableOpacity style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={submitting} activeOpacity={0.85}>
          {submitting ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <View style={styles.submitBtnContent}>
              <Icon name={ICONS.check} size={18} color={Colors.white} style={styles.submitBtnIcon} />
              <Text style={styles.submitBtnText}>Save Changes</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const inputStyles = StyleSheet.create({
  group: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
  row: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10, backgroundColor: Colors.background, overflow: 'hidden' },
  input: { flex: 1, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: Colors.textPrimary },
  textArea: { height: 80, textAlignVertical: 'top' },
  dateRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10, backgroundColor: Colors.background, paddingHorizontal: 12, paddingVertical: 13, minHeight: 48 },
  dateIconWrap: { marginRight: 10 },
  dateText: { flex: 1, fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  datePlaceholder: { color: Colors.textMuted, fontWeight: '400' },
  clearBtn: { paddingLeft: 8 },
});

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: Colors.white, borderRadius: 14, padding: 16, marginBottom: 14, shadowColor: Colors.shadowColor, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary, marginBottom: 16, letterSpacing: 0.3 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 0 },
  halfInput: { flex: 1 },
  divider: { height: 1, backgroundColor: Colors.divider, marginVertical: 12 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.background },
  catPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catPillText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  catPillTextActive: { color: Colors.white, fontWeight: '600' },
  submitBtn: { backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginBottom: 10, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 4 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  submitBtnIcon: { marginRight: 6 },
  submitBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  cancelBtn: { alignItems: 'center', paddingVertical: 12 },
  cancelBtnText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '600' },
});

export default EditProductScreen;
