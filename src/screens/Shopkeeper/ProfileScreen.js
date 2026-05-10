import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Switch,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { getUserData, updateNotificationSettings } from '../../services/userService';
import { cancelAllAlerts } from '../../services/notificationService';
import useProducts from '../../hooks/useProducts';
import Colors from '../../constants/Colors';
import Icon from '../../components/Icon';
import ICONS from '../../constants/Icons';

// ---------------------------------------------------------------------------
// Helper: get initials from email
// ---------------------------------------------------------------------------
const getInitials = (name, email = '') => {
  if (name) {
    const parts = name.trim().split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  const parts = email.split('@')[0].split(/[._-]/);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() || '').join('');
};

// ---------------------------------------------------------------------------
// MenuItem Component
// ---------------------------------------------------------------------------
const MenuItem = ({ icon, label, sublabel, onPress, danger, trailing }) => (
  <TouchableOpacity
    style={menuStyles.item}
    onPress={onPress}
    activeOpacity={0.7}
    disabled={!onPress}>
    <View style={[menuStyles.iconBox, danger && menuStyles.iconBoxDanger]}>
      <Icon name={icon} size={20} color={danger ? Colors.danger : Colors.primary} />
    </View>
    <View style={menuStyles.textBlock}>
      <Text style={[menuStyles.label, danger && { color: Colors.danger }]}>{label}</Text>
      {sublabel && <Text style={menuStyles.sublabel}>{sublabel}</Text>}
    </View>
    {trailing ? trailing : (onPress && <Icon name={ICONS.forward} size={22} color={Colors.textMuted} />)}
  </TouchableOpacity>
);

// ---------------------------------------------------------------------------
// STATS WIDGET Component
// ---------------------------------------------------------------------------
const StatsWidget = ({ total, expiring, expired }) => (
  <View style={statsStyles.container}>
    <View style={statsStyles.box}>
      <Text style={statsStyles.value}>{total}</Text>
      <Text style={statsStyles.label}>Total Items</Text>
    </View>
    <View style={statsStyles.divider} />
    <View style={statsStyles.box}>
      <Text style={[statsStyles.value, { color: Colors.warning }]}>{expiring}</Text>
      <Text style={statsStyles.label}>Expiring Soon</Text>
    </View>
    <View style={statsStyles.divider} />
    <View style={statsStyles.box}>
      <Text style={[statsStyles.value, { color: Colors.danger }]}>{expired}</Text>
      <Text style={statsStyles.label}>Expired</Text>
    </View>
  </View>
);

// ---------------------------------------------------------------------------
// PROFILE SCREEN
// ---------------------------------------------------------------------------
const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { products } = useProducts();
  const [profileData, setProfileData] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  const [privacyVisible, setPrivacyVisible] = useState(false);
  const [aboutVisible, setAboutVisible] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      const loadProfile = async () => {
        if (user?.uid) {
          const data = await getUserData(user.uid);
          setProfileData(data);
          if (data?.settings?.notificationsEnabled !== undefined) {
            setNotificationsEnabled(data.settings.notificationsEnabled);
          }
        }
      };
      loadProfile();
    }, [user])
  );

  const handleToggleNotifications = async (val) => {
    setNotificationsEnabled(val);
    if (user?.uid) {
      await updateNotificationSettings(user.uid, val);
    }
    // Cancel all pending alerts immediately when user disables notifications
    if (!val) {
      try {
        cancelAllAlerts();
      } catch (e) {
        console.warn('[ProfileScreen] Failed to cancel alerts:', e);
      }
    }
  };

  const name = profileData?.name || '';
  const initials = getInitials(name, user?.email || 'U');
  const roleName = user?.role === 'admin' ? 'Admin' : 'Shopkeeper';

  const totalProducts = products.length;
  const expiringSoon = products.filter(p => p.status === 'expiring').length;
  const expiredItems = products.filter(p => p.status === 'expired').length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>

        {/* Avatar + User Info */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials || 'U'}</Text>
          </View>
          <Text style={styles.email}>{name || user?.email || 'Shopkeeper'}</Text>
          {name ? <Text style={styles.emailSub}>{user?.email}</Text> : null}
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{roleName}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.section}>
          <StatsWidget total={totalProducts} expiring={expiringSoon} expired={expiredItems} />
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon={ICONS.profile}
              label="My Profile"
              sublabel="Edit your account details"
              onPress={() => navigation.navigate('EditProfile')}
            />
            <View style={styles.divider} />
            <MenuItem
              icon={ICONS.shop}
              label="My Shop"
              sublabel="Manage shop information"
              onPress={() => navigation.navigate('MyShop')}
            />
            <View style={styles.divider} />
            <MenuItem
              icon={ICONS.notifications}
              label="Notifications"
              sublabel="Expiry alerts and reminders"
              trailing={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={handleToggleNotifications}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                />
              }
            />
          </View>
        </View>

        {/* App Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon={ICONS.privacy}
              label="Privacy Policy"
              onPress={() => setPrivacyVisible(true)}
            />
            <View style={styles.divider} />
            <MenuItem
              icon={ICONS.about}
              label="About ShelfSafe"
              sublabel="Version 1.0.0"
              onPress={() => setAboutVisible(true)}
            />
          </View>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <View style={styles.menuCard}>
            <MenuItem
              icon={ICONS.logout}
              label="Logout"
              sublabel="Sign out of your account"
              onPress={() => {
                logout?.();
              }}
              danger
            />
          </View>
        </View>

      </ScrollView>

      {/* Privacy Policy Modal */}
      <Modal visible={privacyVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setPrivacyVisible(false)}>
        <SafeAreaView style={modalStyles.container}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>Privacy Policy</Text>
            <TouchableOpacity onPress={() => setPrivacyVisible(false)}><Icon name="close" size={24} color={Colors.textPrimary} /></TouchableOpacity>
          </View>
          <ScrollView style={modalStyles.body}>
            <Text style={modalStyles.text}>Your privacy is important to us. ShelfSafe collects and stores product and store information in Firestore to provide you with seamless inventory management and push notifications...</Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* About Modal */}
      <Modal visible={aboutVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setAboutVisible(false)}>
        <SafeAreaView style={modalStyles.container}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>About ShelfSafe</Text>
            <TouchableOpacity onPress={() => setAboutVisible(false)}><Icon name="close" size={24} color={Colors.textPrimary} /></TouchableOpacity>
          </View>
          <View style={modalStyles.bodyCenter}>
            <View style={modalStyles.logoBox}><Text style={modalStyles.logoText}>SS</Text></View>
            <Text style={modalStyles.appName}>ShelfSafe</Text>
            <Text style={modalStyles.appVersion}>Version 1.0.0</Text>
            <Text style={modalStyles.appDesc}>The smart way to manage your expiry inventory and prevent waste.</Text>
          </View>
        </SafeAreaView>
      </Modal>

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

const statsStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: 18,
    marginHorizontal: 16,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  box: { flex: 1, alignItems: 'center' },
  divider: { width: 1, backgroundColor: Colors.border, marginVertical: 4 },
  value: { fontSize: 20, fontWeight: '800', color: Colors.primary, marginBottom: 4 },
  label: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase' },
});

const modalStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.divider, backgroundColor: Colors.white },
  title: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  body: { padding: 20 },
  text: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22 },
  bodyCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  logoBox: { width: 80, height: 80, borderRadius: 20, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  logoText: { fontSize: 32, fontWeight: '800', color: Colors.white },
  appName: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  appVersion: { fontSize: 14, color: Colors.textMuted, marginBottom: 12 },
  appDesc: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { paddingBottom: 40 },

  profileCard: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingTop: 32,
    paddingBottom: 28,
    marginBottom: 0,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
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
    marginBottom: 4,
  },
  emailSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 10,
  },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    marginTop: 8,
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
