import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import Colors from '../../constants/Colors';
import AppHeader from '../../components/AppHeader';
import AnimatedScreen from '../../components/AnimatedScreen';
import AnimatedCard from '../../components/AnimatedCard';

// ---------------------------------------------------------------------------
// Helper: get initials from email
// ---------------------------------------------------------------------------
const getInitials = (email = '') => {
  const parts = email.split('@')[0].split(/[._-]/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');
};

// ---------------------------------------------------------------------------
// Lazy-load vector icons
// ---------------------------------------------------------------------------
const Icon = ({ name, size = 20, color = Colors.textSecondary }) => {
  try {
    const MaterialIcons = require('react-native-vector-icons/MaterialIcons').default;
    return <MaterialIcons name={name} size={size} color={color} />;
  } catch {
    const map = {
      'person': '👤', 'store': '🏪', 'info': 'ℹ', 'logout': '↩',
      'chevron-right': '›', 'notifications': '🔔', 'shield': '🔒',
    };
    return <Text style={{ fontSize: size - 4, color }}>{map[name] || '•'}</Text>;
  }
};

// ---------------------------------------------------------------------------
// MenuItem Component
// ---------------------------------------------------------------------------
const MenuItem = ({ icon, label, sublabel, onPress, danger }) => (
  <TouchableOpacity
    style={menuStyles.item}
    onPress={onPress}
    activeOpacity={0.7}>
    <View style={[menuStyles.iconBox, danger && menuStyles.iconBoxDanger]}>
      <Icon name={icon} size={20} color={danger ? Colors.danger : Colors.primary} />
    </View>
    <View style={menuStyles.textBlock}>
      <Text style={[menuStyles.label, danger && { color: Colors.danger }]}>{label}</Text>
      {sublabel && <Text style={menuStyles.sublabel}>{sublabel}</Text>}
    </View>
    <Icon name="chevron-right" size={22} color={Colors.textMuted} />
  </TouchableOpacity>
);

// ---------------------------------------------------------------------------
// PROFILE SCREEN
// ---------------------------------------------------------------------------
const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const initials = getInitials(user?.email || 'U');

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader title="My Profile" />
      <AnimatedScreen>
        <ScrollView contentContainerStyle={styles.container}>

          {/* Avatar + User Info */}
          <AnimatedCard index={0}>
            <View style={styles.profileCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials || 'U'}</Text>
              </View>
              <Text style={styles.email}>{user?.email || 'Shopkeeper'}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>Shopkeeper</Text>
              </View>
            </View>
          </AnimatedCard>

          {/* Account Section */}
          <AnimatedCard index={1}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account</Text>
              <View style={styles.menuCard}>
                <MenuItem
                  icon="person"
                  label="My Profile"
                  sublabel="Edit your account details"
                  onPress={() => {}}
                />
                <View style={styles.divider} />
                <MenuItem
                  icon="store"
                  label="My Shop"
                  sublabel="Manage shop information"
                  onPress={() => {}}
                />
                <View style={styles.divider} />
                <MenuItem
                  icon="notifications"
                  label="Notifications"
                  sublabel="Expiry alerts and reminders"
                  onPress={() => {}}
                />
              </View>
            </View>
          </AnimatedCard>

          {/* App Section */}
          <AnimatedCard index={2}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>App</Text>
              <View style={styles.menuCard}>
                <MenuItem
                  icon="shield"
                  label="Privacy Policy"
                  onPress={() => {}}
                />
                <View style={styles.divider} />
                <MenuItem
                  icon="info"
                  label="About ShelfSafe"
                  sublabel="Version 1.0.0"
                  onPress={() => {}}
                />
              </View>
            </View>
          </AnimatedCard>

          {/* Logout */}
          <AnimatedCard index={3}>
            <View style={styles.section}>
              <View style={styles.menuCard}>
                <MenuItem
                  icon="logout"
                  label="Logout"
                  sublabel="Sign out of your account"
                  onPress={() => {
                    logout?.();
                    navigation?.navigate?.('Auth');
                  }}
                  danger
                />
              </View>
            </View>
          </AnimatedCard>

        </ScrollView>
      </AnimatedScreen>
    </SafeAreaView>
  );
};

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------
const menuStyles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  iconBoxDanger: { backgroundColor: '#FEF2F2' },
  textBlock: { flex: 1 },
  label: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  sublabel: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
});

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { paddingBottom: 120 },

  profileCard: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingTop: 32,
    paddingBottom: 28,
    marginBottom: 0,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primary,
  },
  email: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  roleText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  section: { paddingHorizontal: 16, marginTop: 22 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingLeft: 4,
  },
  menuCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginLeft: 70,
  },
});

export default ProfileScreen;
