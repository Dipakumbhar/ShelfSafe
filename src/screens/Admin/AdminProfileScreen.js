import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { updateCurrentUserEmail } from '../../services/authService';
import { getUserData, updateUserProfile } from '../../services/userService';
import Colors from '../../constants/Colors';
import Icon from '../../components/Icon';
import ICONS from '../../constants/Icons';

const AdminProfileScreen = ({ navigation }) => {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (user?.uid) {
          const data = await getUserData(user.uid);
          setName(data?.name || '');
          setEmail(data?.email || user?.email || '');
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user?.email, user?.uid]);

  const getErrorMessage = (code) => {
    switch (code) {
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/email-already-in-use':
        return 'Another account is already using this email.';
      case 'auth/requires-recent-login':
        return 'Please sign out and sign in again before changing your email.';
      default:
        return 'Failed to update admin profile.';
    }
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      Alert.alert('Validation Error', 'Name cannot be empty.');
      return;
    }

    if (!normalizedEmail) {
      Alert.alert('Validation Error', 'Email cannot be empty.');
      return;
    }

    if (saving) {
      return;
    }

    setSaving(true);
    try {
      if (normalizedEmail !== (user?.email || '').trim().toLowerCase()) {
        await updateCurrentUserEmail(normalizedEmail);
      }

      await updateUserProfile(user.uid, {
        name: trimmedName,
        email: normalizedEmail,
      });

      await refreshUser?.();

      Alert.alert('Success', 'Admin profile updated successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('[AdminProfileScreen] Failed to update profile:', error);
      Alert.alert('Error', getErrorMessage(error.code));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroCard}>
          <View style={styles.heroIconBox}>
            <Icon name={ICONS.profile} size={30} color={Colors.white} />
          </View>
          <Text style={styles.heroTitle}>Admin Profile</Text>
          <Text style={styles.heroSubtitle}>
            Update the administrator name and email used for this account.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Admin Name</Text>
          <View style={styles.inputRow}>
            <Icon name={ICONS.profile} size={18} color={Colors.textMuted} style={styles.icon} />
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter admin name"
              placeholderTextColor={Colors.textMuted}
              editable={!saving}
            />
          </View>

          <Text style={styles.label}>Email Address</Text>
          <View style={styles.inputRow}>
            <Icon name={ICONS.email} size={18} color={Colors.textMuted} style={styles.icon} />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter admin email"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
              editable={!saving}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}>
          {saving ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <Text style={styles.saveBtnText}>Save Admin Profile</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 16, paddingBottom: 40 },
  heroCard: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  heroIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
  },
  heroSubtitle: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.72)',
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
    marginTop: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
  },
  icon: { marginRight: 8 },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});

export default AdminProfileScreen;
