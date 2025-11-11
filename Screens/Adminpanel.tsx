import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Dimensions,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Card,
  TextInput,
  Button,
  ActivityIndicator,
  Snackbar,
  Portal,
  Dialog,
} from 'react-native-paper';
import { TabsProvider, Tabs, TabScreen } from 'react-native-paper-tabs';
import { Dropdown } from 'react-native-element-dropdown';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { rootStackParamList } from '../navigation/AppNavigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { UserAPI } from '../service/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslator } from 'react-native-translator';

const { width, height } = Dimensions.get('window');
const wp = (percentage: number) => (width * percentage) / 100;
const hp = (percentage: number) => (height * percentage) / 100;

type Props = {
  navigation: NativeStackNavigationProp<rootStackParamList, 'AdminPanel'>;
};

export type User = {
  id: number;
  name: string;
  mobile: string;
  email: string;
  username: string;
  role: string;
  password: string;
  createdAt: string;
  updatedAt: string;
};

const enToTa: Record<string, string> = {
  // Tabs
  Users: 'பயனர்கள்',
  'Create User': 'புதிய பயனர் உருவாக்கு',

  // User Management
  'No users found': 'பயனர்கள் எதுவும் இல்லை',
  'Create a new user to get started': 'தொடங்க ஒரு புதிய பயனரை உருவாக்கவும்',
  Administrator: 'நிர்வாகி',
  Worker: 'தொழிலாளி',
  Super_Administrator: 'உயர்நிர்வாகி',
  Delete: 'நீக்கு',
  'Are you sure you want to delete this user?':
    'இந்த பயனரை நிச்சயமாக நீக்க வேண்டுமா?',
  Cancel: 'ரத்து',
  'User Details': 'பயனர் விவரங்கள்',
  'Full Name *': 'முழு பெயர் *',
  'Mobile *': 'கைபேசி *',
  'Email *': 'மின்னஞ்சல் *',
  'Username *': 'பயனர் பெயர் *',
  'Select Role': 'பங்கு தேர்ந்தெடு',
  Created: 'உருவாக்கப்பட்டது',
  Updated: 'புதுப்பிக்கப்பட்டது',
  Close: 'மூடு',
  'Save Changes': 'மாற்றங்களை சேமி',
  'All fields are required': 'அனைத்து புலங்களும் தேவை',
  'Failed to load users': 'பயனர்களை ஏற்ற முடியவில்லை',
  'User updated successfully': 'பயனர் வெற்றிகரமாக புதுப்பிக்கப்பட்டது',
  'Failed to update user': 'பயனரை புதுப்பிக்க முடியவில்லை',
  'User deleted successfully': 'பயனர் வெற்றிகரமாக நீக்கப்பட்டது',
  'Failed to delete user': 'பயனரை நீக்க முடியவில்லை',

  // Create User
  'Password *': 'கடவுச்சொல் *',
  //'Create User': 'பயனர் உருவாக்கு',
  'Invalid email format': 'தவறான மின்னஞ்சல் வடிவம்',
  'Invalid mobile number (10 digits required)':
    'தவறான கைபேசி எண் (10 இலக்கங்கள் தேவை)',
  'Password must be at least 6 characters':
    'கடவுச்சொல் குறைந்தது 6 எழுத்துகள் இருக்க வேண்டும்',
  'User created successfully!': 'பயனர் வெற்றிகரமாக உருவாக்கப்பட்டது!',
  'Failed to create user': 'பயனரை உருவாக்க முடியவில்லை',

  // Roles
  'Super Admin': 'சூப்பர் நிர்வாகி',
  Admin: 'நிர்வாகி',
  // Worker: 'தொழிலாளி',
};

const UserManagementTab: React.FC<Props> = ({ navigation }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  const [userModalVisible, setUserModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editRole, setEditRole] = useState('worker');

  const [isTamil, setIsTamil] = useState(false);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const { translate } = useTranslator();

  const getFontSize = useCallback(
    (enSize: number) => (isTamil ? enSize * 0.85 : enSize),
    [isTamil],
  );

  useEffect(() => {
    const initLang = async () => {
      const saved = await AsyncStorage.getItem('appLanguage');
      setIsTamil(saved === 'ta');
    };
    initLang();
  }, []);

  useEffect(() => {
    if (!isTamil) {
      setTranslations({});
      return;
    }
    const translateAll = async () => {
      const result: Record<string, string> = {};
      for (const en of Object.keys(enToTa)) {
        try {
          const ta = await translate('en', 'ta', en, { type: 'google' });
          result[en] = ta;
        } catch {
          result[en] = enToTa[en] ?? en;
        }
      }
      setTranslations(result);
    };
    translateAll();
  }, [isTamil, translate]);

  const t = useCallback(
    (english: string): string => {
      if (!isTamil) return english;
      return translations[english] ?? enToTa[english] ?? english;
    },
    [isTamil, translations],
  );

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadUsers();
    });
    loadUsers();
    return unsubscribe;
  }, [navigation, isTamil]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await UserAPI.getAll();
      if (res.success) {
        // Filter out users with username 'admin'
        const filteredUsers = res.data.filter(
          (u: User) => u.username !== 'admin',
        );
        setUsers(filteredUsers);
      } else {
        setSnackbar({
          visible: true,
          message: res.error || t('Failed to load users'),
        });
      }
    } catch (e) {
      setSnackbar({ visible: true, message: t('Failed to load users') });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  }, []);

  const openUserModal = (user: User) => {
    setEditName(user.name);
    setEditMobile(user.mobile);
    setEditEmail(user.email);
    setEditUsername(user.username);
    setEditRole(user.role);
    setSelectedUser(user);
    setUserModalVisible(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    const payload = {
      name: editName.trim(),
      mobile: editMobile.trim(),
      email: editEmail.trim(),
      username: editUsername.trim(),
      role: editRole,
    };

    if (
      !payload.name ||
      !payload.mobile ||
      !payload.email ||
      !payload.username
    ) {
      setSnackbar({ visible: true, message: t('All fields are required') });
      return;
    }

    try {
      const res = await UserAPI.update(selectedUser.id, payload);
      if (res.success) {
        setUsers(prev =>
          prev.map(u => (u.id === selectedUser.id ? { ...u, ...payload } : u)),
        );
        setUserModalVisible(false);
        setSnackbar({ visible: true, message: t('User updated successfully') });
      } else {
        setSnackbar({
          visible: true,
          message: res.error || t('Failed to update user'),
        });
      }
    } catch {
      setSnackbar({ visible: true, message: t('Failed to update user') });
    }
  };

  const deleteUser = async (id: number, event?: any) => {
    if (event) event.stopPropagation();
    Alert.alert(
      t('Delete User'),
      t('Are you sure you want to delete this user?'),
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('Delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await UserAPI.delete(id);
              setUsers(prev => prev.filter(u => u.id !== id));
              setSnackbar({
                visible: true,
                message: t('User deleted successfully'),
              });
              loadUsers();
            } catch {
              setSnackbar({
                visible: true,
                message: t('Failed to delete user'),
              });
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="account-off" size={wp(20)} color="#ccc" />
      <Text style={[styles.emptyText, { fontSize: getFontSize(wp(5)) }]}>
        {t('No users found')}
      </Text>
      <Text style={[styles.emptySubtext, { fontSize: getFontSize(wp(3.8)) }]}>
        {t('Create a new user to get started')}
      </Text>
    </View>
  );

  return (
    <>
      <ScrollView
        style={styles.tabContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#0a411fff" />
          </View>
        ) : users.length === 0 ? (
          renderEmpty()
        ) : (
          users.map(user => (
            <TouchableOpacity key={user.id} onPress={() => openUserModal(user)}>
              <Card style={styles.userCard} elevation={3}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text
                      style={[
                        styles.username,
                        { fontSize: getFontSize(wp(4.8)) },
                      ]}
                    >
                      {user.name}
                    </Text>
                    <Text
                      style={[
                        styles.userRole,
                        { fontSize: getFontSize(wp(3.4)) },
                      ]}
                    >
                      {user.role}
                    </Text>
                  </View>
                  <Button
                    mode="contained"
                    onPress={e => deleteUser(user.id, e)}
                    style={styles.deleteButton}
                    contentStyle={styles.deleteButtonContent}
                    buttonColor="#e74c3c"
                    icon="delete"
                  >
                    {t('Delete')}
                  </Button>
                </View>

                <View style={styles.infoRow}>
                  <MaterialCommunityIcons
                    name="email"
                    size={wp(5)}
                    color="#0a411fff"
                  />
                  <Text
                    style={[
                      styles.infoText,
                      { fontSize: getFontSize(wp(3.8)) },
                    ]}
                  >
                    {user.email}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <MaterialCommunityIcons
                    name="phone"
                    size={wp(5)}
                    color="#0a411fff"
                  />
                  <Text
                    style={[
                      styles.infoText,
                      { fontSize: getFontSize(wp(3.8)) },
                    ]}
                  >
                    {user.mobile}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <MaterialCommunityIcons
                    name={
                      user.role === 'superadmin'
                        ? 'crown'
                        : user.role === 'admin'
                        ? 'shield-account'
                        : 'account'
                    }
                    size={wp(5)}
                    color="#0a411fff"
                  />
                  <Text
                    style={[
                      styles.infoText,
                      { fontSize: getFontSize(wp(3.8)) },
                    ]}
                  >
                    {t('Role')}:{' '}
                    {t(
                      user.role === 'superadmin'
                        ? isTamil
                          ? 'Super_Administrator'
                          : 'Super Administrator'
                        : user.role === 'admin'
                        ? 'Administrator'
                        : 'Worker',
                    )}
                  </Text>
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: hp(10) }} />
      </ScrollView>

      <Portal>
        <Dialog
          visible={userModalVisible}
          onDismiss={() => setUserModalVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title
            style={[styles.dialogTitle, { fontSize: getFontSize(wp(5)) }]}
          >
            {t('User Details')}
          </Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogScrollArea}>
            <ScrollView contentContainerStyle={styles.dialogContent}>
              {selectedUser && (
                <View>
                  <TextInput
                    label={t('Full Name *')}
                    value={editName}
                    onChangeText={setEditName}
                    mode="outlined"
                    style={styles.input}
                    theme={{ roundness: wp(2.5) }}
                    contentStyle={[
                      styles.inputContent,
                      { fontSize: getFontSize(wp(4)) },
                    ]}
                    outlineColor="#ddd"
                    activeOutlineColor="#0a411fff"
                    left={
                      <TextInput.Icon icon="account-outline" size={wp(6)} />
                    }
                  />

                  <TextInput
                    label={t('Mobile *')}
                    value={editMobile}
                    onChangeText={setEditMobile}
                    mode="outlined"
                    style={styles.input}
                    keyboardType="phone-pad"
                    maxLength={10}
                    theme={{ roundness: wp(2.5) }}
                    contentStyle={[
                      styles.inputContent,
                      { fontSize: getFontSize(wp(4)) },
                    ]}
                    outlineColor="#ddd"
                    activeOutlineColor="#0a411fff"
                    left={<TextInput.Icon icon="phone" size={wp(6)} />}
                  />

                  <TextInput
                    label={t('Email *')}
                    value={editEmail}
                    onChangeText={setEditEmail}
                    mode="outlined"
                    style={styles.input}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    theme={{ roundness: wp(2.5) }}
                    contentStyle={[
                      styles.inputContent,
                      { fontSize: getFontSize(wp(4)) },
                    ]}
                    outlineColor="#ddd"
                    activeOutlineColor="#0a411fff"
                    left={<TextInput.Icon icon="email" size={wp(6)} />}
                  />

                  <TextInput
                    label={t('Username *')}
                    value={editUsername}
                    onChangeText={setEditUsername}
                    mode="outlined"
                    style={styles.input}
                    autoCapitalize="none"
                    theme={{ roundness: wp(2.5) }}
                    contentStyle={[
                      styles.inputContent,
                      { fontSize: getFontSize(wp(4)) },
                    ]}
                    outlineColor="#ddd"
                    activeOutlineColor="#0a411fff"
                    left={<TextInput.Icon icon="account" size={wp(6)} />}
                  />

                  <Dropdown
                    style={styles.dropdown}
                    placeholderStyle={[
                      styles.placeholderStyle,
                      { fontSize: getFontSize(wp(4)) },
                    ]}
                    selectedTextStyle={[
                      styles.selectedTextStyle,
                      { fontSize: getFontSize(wp(4)) },
                    ]}
                    inputSearchStyle={[
                      styles.inputSearchStyle,
                      { fontSize: getFontSize(wp(4)) },
                    ]}
                    iconStyle={styles.iconStyle}
                    data={[
                      {
                        label: t('Super Admin'),
                        value: 'superadmin',
                        icon: 'shield-account',
                      },
                      { label: t('Worker'), value: 'worker', icon: 'account' },
                      { label: t('Admin'), value: 'admin', icon: 'shield' },
                    ]}
                    maxHeight={200}
                    labelField="label"
                    valueField="value"
                    placeholder={t('Select Role')}
                    value={editRole}
                    onChange={item =>
                      setEditRole(item.value as 'admin' | 'worker')
                    }
                    renderLeftIcon={() => (
                      <Ionicons
                        style={styles.dropdownIcon}
                        color="#0a411fff"
                        name={
                          editRole === 'admin' ? 'shield-checkmark' : 'person'
                        }
                        size={wp(5.5)}
                      />
                    )}
                  />

                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons
                      name="calendar"
                      size={wp(5)}
                      color="#0a411fff"
                    />
                    <Text
                      style={[
                        styles.infoText,
                        { fontSize: getFontSize(wp(3.8)) },
                      ]}
                    >
                      {t('Created')}:{' '}
                      {new Date(selectedUser.createdAt).toLocaleDateString(
                        'en-IN',
                      )}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons
                      name="update"
                      size={wp(5)}
                      color="#0a411fff"
                    />
                    <Text
                      style={[
                        styles.infoText,
                        { fontSize: getFontSize(wp(3.8)) },
                      ]}
                    >
                      {t('Updated')}:{' '}
                      {new Date(selectedUser.updatedAt).toLocaleDateString(
                        'en-IN',
                      )}
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setUserModalVisible(false)}>
              {t('Close')}
            </Button>
            <Button
              onPress={handleUpdateUser}
              disabled={!editName || !editMobile || !editEmail || !editUsername}
            >
              {t('Save Changes')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbar.message}
      </Snackbar>
    </>
  );
};

const CreateUserTab: React.FC = () => {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'worker' | 'superadmin'>('worker');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });
  const [passwordVisible, setPasswordVisible] = useState(false);

  const [isTamil, setIsTamil] = useState(false);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const { translate } = useTranslator();

  const getFontSize = useCallback(
    (enSize: number) => (isTamil ? enSize * 0.85 : enSize),
    [isTamil],
  );

  useEffect(() => {
    const initLang = async () => {
      const saved = await AsyncStorage.getItem('appLanguage');
      setIsTamil(saved === 'ta');
    };
    initLang();
  }, []);

  useEffect(() => {
    if (!isTamil) {
      setTranslations({});
      return;
    }
    const translateAll = async () => {
      const result: Record<string, string> = {};
      for (const en of Object.keys(enToTa)) {
        try {
          const ta = await translate('en', 'ta', en, { type: 'google' });
          result[en] = ta;
        } catch {
          result[en] = enToTa[en] ?? en;
        }
      }
      setTranslations(result);
    };
    translateAll();
  }, [isTamil, translate]);

  const t = useCallback(
    (english: string): string => {
      if (!isTamil) return english;
      return translations[english] ?? enToTa[english] ?? english;
    },
    [isTamil, translations],
  );

  const roleOptions = [
    { label: t('Worker'), value: 'worker', icon: 'account' },
    { label: t('Admin'), value: 'admin', icon: 'shield-account' },
    { label: t('Super Admin'), value: 'superadmin', icon: 'shield-account' },
  ];

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validateMobile = (mobile: string) =>
    mobile.length === 10 && /^\d{10}$/.test(mobile);
  const validatePassword = (password: string) => password.length >= 6;

  const handleCreateUser = async () => {
    if (openButton()) {
      setSnackbar({ visible: true, message: t('All fields are required') });
      return;
    }
    if (!validateEmail(email) && role !== 'worker') {
      setSnackbar({ visible: true, message: t('Invalid email format') });
      return;
    }
    if (!validateMobile(mobile)) {
      setSnackbar({
        visible: true,
        message: t('Invalid mobile number (10 digits required)'),
      });
      return;
    }
    if (!validatePassword(password) && role !== 'worker') {
      setSnackbar({
        visible: true,
        message: t('Password must be at least 6 characters'),
      });
      return;
    }

    setLoading(true);
    const payload = {
      name: name,
      mobile: mobile.trim(),
      email: email.trim(),
      username: username.trim(),
      password: password.trim(),
      role,
    };

    try {
      const res = await UserAPI.create(payload);
      console.log('user creation', res);
      if (res.success) {
        setSnackbar({
          visible: true,
          message: t('User created successfully!'),
        });
        setName('');
        setMobile('');
        setEmail('');
        setUsername('');
        setPassword('');
        setRole('worker');
      } else {
        setSnackbar({
          visible: true,
          message: res.error || t('Failed to create user'),
        });
      }
    } catch {
      setSnackbar({ visible: true, message: t('Failed to create user') });
    } finally {
      setLoading(false);
    }
  };

  const openButton = () => {
    if (role === 'worker') {
      return !username.trim() || !mobile.trim() || loading || !name.trim();
    }
    return (
      loading ||
      !name.trim() ||
      !mobile.trim() ||
      !email.trim() ||
      !username.trim() ||
      !password.trim()
    );
  };

  return (
    <>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : hp(12)}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formContainer}>
            <TextInput
              label={t('Full Name *')}
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
              theme={{ roundness: wp(2.5) }}
              contentStyle={[
                styles.inputContent,
                { fontSize: getFontSize(wp(4)) },
              ]}
              outlineColor="#ddd"
              activeOutlineColor="#0a411fff"
              left={<TextInput.Icon icon="account-outline" size={wp(6)} />}
            />

            <TextInput
              label={t('Mobile *')}
              value={mobile}
              onChangeText={setMobile}
              mode="outlined"
              style={styles.input}
              keyboardType="phone-pad"
              maxLength={14}
              theme={{ roundness: wp(2.5) }}
              contentStyle={[
                styles.inputContent,
                { fontSize: getFontSize(wp(4)) },
              ]}
              outlineColor="#ddd"
              activeOutlineColor="#0a411fff"
              left={<TextInput.Icon icon="phone" size={wp(6)} />}
              right={
                mobile.length === 10 && (
                  <TextInput.Icon icon="check" size={wp(6)} />
                )
              }
            />

            {role !== 'worker' && (
              <TextInput
                label={t('Email *')}
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                theme={{ roundness: wp(2.5) }}
                contentStyle={[
                  styles.inputContent,
                  { fontSize: getFontSize(wp(4)) },
                ]}
                outlineColor="#ddd"
                activeOutlineColor="#0a411fff"
                left={<TextInput.Icon icon="email" size={wp(6)} />}
              />
            )}

            <TextInput
              label={t('Username *')}
              value={username}
              onChangeText={setUsername}
              mode="outlined"
              style={styles.input}
              autoCapitalize="none"
              theme={{ roundness: wp(2.5) }}
              contentStyle={[
                styles.inputContent,
                { fontSize: getFontSize(wp(4)) },
              ]}
              outlineColor="#ddd"
              activeOutlineColor="#0a411fff"
              left={<TextInput.Icon icon="account" size={wp(6)} />}
            />

            {role !== 'worker' && (
              <TextInput
                label={t('Password *')}
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                style={styles.input}
                secureTextEntry={!passwordVisible}
                theme={{ roundness: wp(2.5) }}
                contentStyle={[
                  styles.inputContent,
                  { fontSize: getFontSize(wp(4)) },
                ]}
                outlineColor="#ddd"
                activeOutlineColor="#0a411fff"
                left={<TextInput.Icon icon="lock" size={wp(6)} />}
                right={
                  <TextInput.Icon
                    icon={passwordVisible ? 'eye-off' : 'eye'}
                    size={wp(6)}
                    onPress={() => setPasswordVisible(!passwordVisible)}
                  />
                }
              />
            )}

            <Dropdown
              style={styles.dropdown}
              placeholderStyle={[
                styles.placeholderStyle,
                { fontSize: getFontSize(wp(4)) },
              ]}
              selectedTextStyle={[
                styles.selectedTextStyle,
                { fontSize: getFontSize(wp(4)) },
              ]}
              inputSearchStyle={[
                styles.inputSearchStyle,
                { fontSize: getFontSize(wp(4)) },
              ]}
              iconStyle={styles.iconStyle}
              data={roleOptions}
              maxHeight={200}
              labelField="label"
              valueField="value"
              placeholder={t('Select Role')}
              value={role}
              onChange={item =>
                setRole(item.value as 'admin' | 'worker' | 'superadmin')
              }
              renderLeftIcon={() => (
                <Ionicons
                  style={styles.dropdownIcon}
                  color="#0a411fff"
                  name={
                    role === 'superadmin'
                      ? 'shield-checkmark'
                      : role === 'admin'
                      ? 'shield'
                      : 'person'
                  }
                  size={wp(5.5)}
                />
              )}
            />

            <Button
              mode="contained"
              onPress={handleCreateUser}
              style={styles.createButton}
              contentStyle={styles.createButtonContent}
              buttonColor="#0a411fff"
              loading={loading}
              disabled={openButton()}
              icon="account-plus"
            >
              {t('Create User')}
            </Button>

            <View style={{ height: hp(15) }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
        duration={4000}
        style={[
          styles.snackbar,
          snackbar.message.includes('success')
            ? styles.snackbarSuccess
            : styles.snackbarError,
        ]}
      >
        {snackbar.message}
      </Snackbar>
    </>
  );
};

const AdminPanel: React.FC<Props> = ({ navigation }) => {
  const [isTamil, setIsTamil] = useState(false);
  const t = (en: string) => en; // Will be overridden by child

  useEffect(() => {
    const initLang = async () => {
      const saved = await AsyncStorage.getItem('appLanguage');
      setIsTamil(saved === 'ta');
    };
    initLang();
  }, []);

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <TabsProvider defaultIndex={0}>
        <Tabs
          mode="scrollable"
          uppercase={false}
          showTextLabel={true}
          style={styles.tabs}
          theme={{ colors: { primary: '#0a411fff' } }}
        >
          <TabScreen
            label={isTamil ? 'பயனர்கள்' : 'Users'}
            icon="account-group"
          >
            <UserManagementTab navigation={navigation} />
          </TabScreen>

          <TabScreen
            label={isTamil ? 'புதிய பயனர்' : 'Create User'}
            icon="account-plus"
          >
            <CreateUserTab />
          </TabScreen>
        </Tabs>
      </TabsProvider>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F5F5' },
  tabs: { backgroundColor: '#fff', elevation: 4 },
  tabContent: { flex: 1, paddingHorizontal: wp(4), paddingTop: hp(3) },
  scrollContent: { padding: wp(5), paddingBottom: hp(5) },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp(10),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp(8),
  },
  emptyText: { color: '#999', marginTop: hp(2), fontWeight: '600' },
  emptySubtext: {
    color: '#bbb',
    marginTop: hp(1),
    textAlign: 'center',
    paddingHorizontal: wp(10),
  },
  userCard: {
    marginBottom: hp(2),
    padding: wp(4),
    backgroundColor: '#fff',
    borderRadius: wp(3),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp(1.5),
  },
  username: { fontWeight: '600', color: '#1a1a1a' },
  userRole: { color: '#0a411fff', marginTop: hp(0.3) },
  deleteButton: { borderRadius: wp(2) },
  deleteButtonContent: { height: hp(5) },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: hp(1) },
  infoText: { marginLeft: wp(2), color: '#333', flex: 1 },
  dialog: {
    maxWidth: width * 0.95,
    alignSelf: 'center',
    minWidth: width * 0.9,
    minHeight: height * 0.5,
    maxHeight: height * 0.7,
  },
  dialogTitle: { fontWeight: '600', paddingBottom: hp(1) },
  dialogScrollArea: { paddingHorizontal: 0, paddingTop: 0, paddingBottom: 0 },
  dialogContent: {
    paddingHorizontal: wp(6),
    paddingTop: hp(1),
    paddingBottom: hp(2),
  },
  formContainer: { paddingVertical: hp(2) },
  input: { marginBottom: hp(2.5), backgroundColor: '#fff' },
  inputContent: {},
  dropdown: {
    height: hp(7),
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: wp(2.5),
    paddingHorizontal: wp(3),
    backgroundColor: '#fff',
    marginBottom: hp(2.5),
  },
  dropdownIcon: { marginRight: wp(2) },
  placeholderStyle: { color: '#999' },
  selectedTextStyle: { color: '#000' },
  inputSearchStyle: { height: hp(5) },
  iconStyle: { width: wp(5), height: wp(5) },
  createButton: { marginTop: hp(1), borderRadius: wp(2.5) },
  createButtonContent: { height: hp(7) },
  snackbar: { margin: wp(4), borderRadius: wp(2) },
  snackbarSuccess: { backgroundColor: '#27ae60' },
  snackbarError: { backgroundColor: '#e74c3c' },
});

export default AdminPanel;
