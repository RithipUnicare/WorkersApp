import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Card,
  TextInput,
  Button,
  ActivityIndicator,
  Snackbar,
} from 'react-native-paper';
import { TabsProvider, Tabs, TabScreen } from 'react-native-paper-tabs';
import { Dropdown } from 'react-native-element-dropdown';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { rootStackParamList } from '../navigation/AppNavigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

const { width, height } = Dimensions.get('window');

// Responsive helpers
const wp = (percentage: number) => (width * percentage) / 100;
const hp = (percentage: number) => (height * percentage) / 100;

type Props = {
  navigation: NativeStackNavigationProp<rootStackParamList, 'AdminPanel'>;
};

type User = {
  username: string;
  email: string;
  role: 'admin' | 'worker';
};

const UserManagementTab: React.FC<Props> = ({ navigation }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadUsers);
    loadUsers();
    return unsubscribe;
  }, [navigation]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const stored = await AsyncStorage.getItem('users');
      if (stored) {
        setUsers(JSON.parse(stored));
      } else {
        setUsers([]);
      }
    } catch (e) {
      console.error('Failed to load users', e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  }, []);

  const deleteUser = async (username: string) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const stored = await AsyncStorage.getItem('users');
              if (stored) {
                const updatedUsers = JSON.parse(stored).filter(
                  (u: User) => u.username !== username,
                );
                await AsyncStorage.setItem(
                  'users',
                  JSON.stringify(updatedUsers),
                );
                setUsers(updatedUsers);
                setSnackbar({
                  visible: true,
                  message: 'User deleted successfully',
                });
              }
            } catch (e) {
              setSnackbar({ visible: true, message: 'Failed to delete user' });
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
      <Text style={styles.emptyText}>No users found</Text>
      <Text style={styles.emptySubtext}>Create a new user to get started</Text>
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
            <ActivityIndicator size="large" color="#2874b8" />
          </View>
        ) : users.length === 0 ? (
          renderEmpty()
        ) : (
          users.map((user, index) => (
            <Card key={index} style={styles.userCard} elevation={3}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.username}>{user.username}</Text>
                  <Text style={styles.userRole}>
                    {user.role === 'admin' ? 'Administrator' : 'Worker'}
                  </Text>
                </View>
                <Button
                  mode="contained"
                  onPress={() => deleteUser(user.username)}
                  style={styles.deleteButton}
                  contentStyle={styles.deleteButtonContent}
                  buttonColor="#e74c3c"
                  icon="delete"
                >
                  Delete
                </Button>
              </View>

              <View style={styles.infoRow}>
                <MaterialCommunityIcons
                  name="email"
                  size={wp(5)}
                  color="#2874b8"
                />
                <Text style={styles.infoText}>{user.email}</Text>
              </View>

              <View style={styles.infoRow}>
                <MaterialCommunityIcons
                  name={user.role === 'admin' ? 'shield-account' : 'account'}
                  size={wp(5)}
                  color="#2874b8"
                />
                <Text style={styles.infoText}>Role: {user.role}</Text>
              </View>
            </Card>
          ))
        )}
        <View style={{ height: hp(10) }} />
      </ScrollView>

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
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'worker'>('worker');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  const roleOptions = [
    { label: 'Worker', value: 'worker', icon: 'account' },
    { label: 'Admin', value: 'admin', icon: 'shield-account' },
  ];

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleCreateUser = async () => {
    if (!username.trim()) {
      setSnackbar({ visible: true, message: 'Username is required' });
      return;
    }
    if (!email.trim()) {
      setSnackbar({ visible: true, message: 'Email is required' });
      return;
    }
    if (!validateEmail(email)) {
      setSnackbar({ visible: true, message: 'Invalid email format' });
      return;
    }

    setLoading(true);
    const newUser: User = {
      username: username.trim(),
      email: email.trim(),
      role,
    };

    try {
      const stored = await AsyncStorage.getItem('users');
      const users: User[] = stored ? JSON.parse(stored) : [];

      // Check duplicate
      if (
        users.some(
          u => u.username === newUser.username || u.email === newUser.email,
        )
      ) {
        setSnackbar({
          visible: true,
          message: 'User with this username or email already exists',
        });
        setLoading(false);
        return;
      }

      users.push(newUser);
      await AsyncStorage.setItem('users', JSON.stringify(users));
      setSnackbar({ visible: true, message: 'User created successfully!' });
      setUsername('');
      setEmail('');
      setRole('worker');
    } catch (e) {
      setSnackbar({ visible: true, message: 'Failed to create user' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ScrollView style={styles.tabContent}>
        <View style={styles.formContainer}>
          <TextInput
            label="Username *"
            value={username}
            onChangeText={setUsername}
            mode="outlined"
            style={styles.input}
            theme={{ roundness: wp(2.5) }}
            contentStyle={styles.inputContent}
            outlineColor="#ddd"
            activeOutlineColor="#2874b8"
            left={<TextInput.Icon icon="account" size={wp(6)} />}
          />

          <TextInput
            label="Email *"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            theme={{ roundness: wp(2.5) }}
            contentStyle={styles.inputContent}
            outlineColor="#ddd"
            activeOutlineColor="#2874b8"
            left={<TextInput.Icon icon="email" size={wp(6)} />}
          />

          <Dropdown
            style={styles.dropdown}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            inputSearchStyle={styles.inputSearchStyle}
            iconStyle={styles.iconStyle}
            data={roleOptions}
            maxHeight={200}
            labelField="label"
            valueField="value"
            placeholder="Select Role"
            value={role}
            onChange={item => setRole(item.value as 'admin' | 'worker')}
            renderLeftIcon={() => (
              <Ionicons
                style={styles.dropdownIcon}
                color="#2874b8"
                name={role === 'admin' ? 'shield-checkmark' : 'person'}
                size={wp(5.5)}
              />
            )}
          />

          <Button
            mode="contained"
            onPress={handleCreateUser}
            style={styles.createButton}
            contentStyle={styles.createButtonContent}
            buttonColor="#2874b8"
            loading={loading}
            disabled={loading || !username.trim() || !email.trim()}
            icon="account-plus"
          >
            Create User
          </Button>
        </View>
        <View style={{ height: hp(10) }} />
      </ScrollView>

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
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <TabsProvider defaultIndex={0}>
        <Tabs
          mode="scrollable"
          uppercase={false}
          showTextLabel={true}
          style={styles.tabs}
          theme={{
            colors: {
              primary: '#2874b8',
            },
          }}
        >
          <TabScreen label="Users" icon="account-group">
            <UserManagementTab navigation={navigation} />
          </TabScreen>

          <TabScreen label="Create User" icon="account-plus">
            <CreateUserTab />
          </TabScreen>
        </Tabs>
      </TabsProvider>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F5F5' },
  tabs: { backgroundColor: '#fff', elevation: 4, marginTop: hp(-3) },
  tabContent: { flex: 1, paddingHorizontal: wp(4), paddingTop: hp(2) },
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
  emptyText: {
    fontSize: wp(5),
    color: '#999',
    marginTop: hp(2),
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: wp(3.8),
    color: '#bbb',
    marginTop: hp(1),
    textAlign: 'center',
    paddingHorizontal: wp(10),
  },

  // User Management
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
  username: {
    fontSize: wp(4.8),
    fontWeight: '600',
    color: '#1a1a1a',
  },
  userRole: {
    fontSize: wp(3.4),
    color: '#2874b8',
    marginTop: hp(0.3),
  },
  deleteButton: {
    borderRadius: wp(2),
  },
  deleteButtonContent: { height: hp(5) },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  infoText: {
    marginLeft: wp(2),
    color: '#333',
    fontSize: wp(3.8),
    flex: 1,
  },

  // Create User
  formContainer: { paddingVertical: hp(1) },
  input: {
    marginBottom: hp(2.5),
    backgroundColor: '#fff',
  },
  inputContent: { fontSize: wp(4) },
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
  placeholderStyle: { fontSize: wp(4), color: '#999' },
  selectedTextStyle: { fontSize: wp(4), color: '#000' },
  inputSearchStyle: { height: hp(5), fontSize: wp(4) },
  iconStyle: { width: wp(5), height: wp(5) },
  createButton: {
    marginTop: hp(1),
    borderRadius: wp(2.5),
  },
  createButtonContent: { height: hp(7) },

  // Snackbar
  snackbar: {
    margin: wp(4),
    borderRadius: wp(2),
  },
  snackbarSuccess: { backgroundColor: '#27ae60' },
  snackbarError: { backgroundColor: '#e74c3c' },
});

export default AdminPanel;
