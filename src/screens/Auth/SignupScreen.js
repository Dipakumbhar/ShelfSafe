import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { signup } from '../../services/authService';
import { createUserInFirestore, resolveRole } from '../../services/userService';
import Colors from '../../constants/Colors';

const SignupScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureText, setSecureText] = useState(true);
  const [secureConfirm, setSecureConfirm] = useState(true);
  const [error, setError] = useState('');

  const getErrorMessage = (code) => {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/weak-password':
        return 'Password must be at least 6 characters.';
      case 'auth/operation-not-allowed':
        return 'Email/password sign-up is not enabled.';
      default:
        return 'Sign up failed. Please try again.';
    }
  };

  const handleSignup = async () => {
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter a password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      // 1. Create Firebase Auth user
      const userCredential = await signup(email, password);
      const { uid } = userCredential.user;
      const userEmail = userCredential.user.email;

      // 2. Determine role
      const role = resolveRole(userEmail);

      // 3. Store user in Firestore
      await createUserInFirestore(uid, userEmail, role);

      // Auth state listener in AuthContext will handle navigation
    } catch (err) {
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>SS</Text>
          </View>
          <Text style={styles.appName}>ShelfSafe</Text>
          <Text style={styles.tagline}>Create your account</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign Up</Text>
          <Text style={styles.cardSubtitle}>
            Fill in your details to get started
          </Text>

          {/* Error Banner */}
          {error !== '' && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠  {error}</Text>
            </View>
          )}

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. yourname@gmail.com"
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (error) setError('');
              }}
              editable={!loading}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Min. 6 characters"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={secureText}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (error) setError('');
                }}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setSecureText(!secureText)}
                style={styles.eyeBtn}>
                <Text style={styles.eyeText}>
                  {secureText ? '👁' : '🙈'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Re-enter your password"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={secureConfirm}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (error) setError('');
                }}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setSecureConfirm(!secureConfirm)}
                style={styles.eyeBtn}>
                <Text style={styles.eyeText}>
                  {secureConfirm ? '👁' : '🙈'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Role Hint */}
          <View style={styles.roleHint}>
            <Text style={styles.roleHintText}>
              ℹ  Your role will be assigned automatically based on your email.
            </Text>
          </View>

          {/* Signup Button */}
          <TouchableOpacity
            style={[styles.signupBtn, loading && styles.signupBtnDisabled]}
            onPress={handleSignup}
            disabled={loading}
            activeOpacity={0.8}>
            {loading ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <Text style={styles.signupBtnText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Navigate to Login */}
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => navigation.goBack()}
            disabled={loading}
            activeOpacity={0.8}>
            <Text style={styles.loginBtnText}>
              Already have an account? Sign In
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>© 2026 ShelfSafe. All rights reserved.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.primary },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 32,
    backgroundColor: Colors.primary,
  },
  header: { alignItems: 'center', marginBottom: 28 },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  logoText: { fontSize: 24, fontWeight: '800', color: Colors.primary },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  tagline: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  card: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  errorBox: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FED7D7',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  inputGroup: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
  },
  passwordRow: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  eyeBtn: { paddingHorizontal: 14 },
  eyeText: { fontSize: 18 },
  roleHint: {
    backgroundColor: '#EBF8FF',
    borderWidth: 1,
    borderColor: '#BEE3F8',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  roleHintText: {
    color: Colors.info,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  signupBtn: {
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    minHeight: 50,
  },
  signupBtnDisabled: { opacity: 0.7 },
  signupBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.divider },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  loginBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  loginBtnText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    marginTop: 24,
  },
});

export default SignupScreen;
