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

const { width, height } = Dimensions.get('window');

// Responsive helpers
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

const UserManagementTab: React.FC<Props> = ({ navigation }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  // Modal states
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editRole, setEditRole] = useState('worker');

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadUsers);
    loadUsers();
    return unsubscribe;
  }, [navigation]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await UserAPI.getAll();
      if (res.success) {
        setUsers(res.data);
      } else {
        setSnackbar({
          visible: true,
          message: res.error || 'Failed to load users',
        });
      }
    } catch (e) {
      console.error('Failed to load users', e);
      setSnackbar({ visible: true, message: 'Failed to load users' });
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
      setSnackbar({ visible: true, message: 'All fields are required' });
      return;
    }

    try {
      console.log('Update payload', payload);
      const res = await UserAPI.update(selectedUser.id, payload);

      console.log('Update response', res);
      if (res.success) {
        setUsers(prev =>
          prev.map(u => (u.id === selectedUser.id ? { ...u, ...payload } : u)),
        );
        setUserModalVisible(false);
        setSnackbar({ visible: true, message: 'User updated successfully' });
      } else {
        setSnackbar({
          visible: true,
          message: res.error || 'Failed to update user',
        });
      }
    } catch (e) {
      //console.error('Update user error', e);
      setSnackbar({ visible: true, message: 'Failed to update user' });
    }
  };

  const deleteUser = async (id: number, event?: any) => {
    if (event) event.stopPropagation();
    Alert.alert(
      'Delete User',
      'Are you sure you want to delete this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await UserAPI.delete(id);
              setUsers(prev => prev.filter(u => u.id !== id));
              setSnackbar({
                visible: true,
                message: 'User deleted successfully',
              });
              loadUsers();
            } catch (e) {
              //console.error('Delete error', e);
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
          users.map(user => (
            <TouchableOpacity key={user.id} onPress={() => openUserModal(user)}>
              <Card style={styles.userCard} elevation={3}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.username}>{user.name}</Text>
                    <Text style={styles.userRole}>
                      {user.role === 'admin' ? 'Administrator' : 'Worker'}
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
                    name="phone"
                    size={wp(5)}
                    color="#2874b8"
                  />
                  <Text style={styles.infoText}>{user.mobile}</Text>
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
          <Dialog.Title style={styles.dialogTitle}>User Details</Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogScrollArea}>
            <ScrollView contentContainerStyle={styles.dialogContent}>
              {selectedUser && (
                <View>
                  <TextInput
                    label="Full Name *"
                    value={editName}
                    onChangeText={setEditName}
                    mode="outlined"
                    style={styles.input}
                    theme={{ roundness: wp(2.5) }}
                    contentStyle={styles.inputContent}
                    outlineColor="#ddd"
                    activeOutlineColor="#2874b8"
                    left={
                      <TextInput.Icon icon="account-outline" size={wp(6)} />
                    }
                  />

                  <TextInput
                    label="Mobile *"
                    value={editMobile}
                    onChangeText={setEditMobile}
                    mode="outlined"
                    style={styles.input}
                    keyboardType="phone-pad"
                    maxLength={10}
                    theme={{ roundness: wp(2.5) }}
                    contentStyle={styles.inputContent}
                    outlineColor="#ddd"
                    activeOutlineColor="#2874b8"
                    left={<TextInput.Icon icon="phone" size={wp(6)} />}
                  />

                  <TextInput
                    label="Email *"
                    value={editEmail}
                    onChangeText={setEditEmail}
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

                  <TextInput
                    label="Username *"
                    value={editUsername}
                    onChangeText={setEditUsername}
                    mode="outlined"
                    style={styles.input}
                    autoCapitalize="none"
                    theme={{ roundness: wp(2.5) }}
                    contentStyle={styles.inputContent}
                    outlineColor="#ddd"
                    activeOutlineColor="#2874b8"
                    left={<TextInput.Icon icon="account" size={wp(6)} />}
                  />

                  <Dropdown
                    style={styles.dropdown}
                    placeholderStyle={styles.placeholderStyle}
                    selectedTextStyle={styles.selectedTextStyle}
                    inputSearchStyle={styles.inputSearchStyle}
                    iconStyle={styles.iconStyle}
                    data={[
                      {
                        label: 'Super Admin',
                        value: 'superadmin',
                        icon: 'shield-account',
                      },
                      { label: 'Worker', value: 'worker', icon: 'account' },
                      {
                        label: 'Admin',
                        value: 'admin',
                        icon: 'shield',
                      },
                    ]}
                    maxHeight={200}
                    labelField="label"
                    valueField="value"
                    placeholder="Select Role"
                    value={editRole}
                    onChange={item =>
                      setEditRole(item.value as 'admin' | 'worker')
                    }
                    renderLeftIcon={() => (
                      <Ionicons
                        style={styles.dropdownIcon}
                        color="#2874b8"
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
                      color="#2874b8"
                    />
                    <Text style={styles.infoText}>
                      Created:{' '}
                      {new Date(selectedUser.createdAt).toLocaleDateString()}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons
                      name="update"
                      size={wp(5)}
                      color="#2874b8"
                    />
                    <Text style={styles.infoText}>
                      Updated:{' '}
                      {new Date(selectedUser.updatedAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setUserModalVisible(false)}>Close</Button>
            <Button
              onPress={handleUpdateUser}
              disabled={!editName || !editMobile || !editEmail || !editUsername}
            >
              Save Changes
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

  const roleOptions = [
    { label: 'Worker', value: 'worker', icon: 'account' },
    { label: 'Admin', value: 'admin', icon: 'shield-account' },
    { label: 'Super Admin', value: 'superadmin', icon: 'shield-account' },
  ];

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validateMobile = (mobile: string) =>
    mobile.length === 10 && /^\d{10}$/.test(mobile);

  const validatePassword = (password: string) => password.length >= 6;

  const handleCreateUser = async () => {
    if (
      !name.trim() ||
      !mobile.trim() ||
      !email.trim() ||
      !username.trim() ||
      !password.trim()
    ) {
      setSnackbar({ visible: true, message: 'All fields are required' });
      return;
    }
    if (!validateEmail(email)) {
      setSnackbar({ visible: true, message: 'Invalid email format' });
      return;
    }
    if (!validateMobile(mobile)) {
      setSnackbar({
        visible: true,
        message: 'Invalid mobile number (10 digits required)',
      });
      return;
    }
    if (!validatePassword(password)) {
      setSnackbar({
        visible: true,
        message: 'Password must be at least 6 characters',
      });
      return;
    }

    setLoading(true);
    const payload = {
      name: name.trim(),
      mobile: mobile.trim(),
      email: email.trim(),
      username: username.trim(),
      password: password.trim(),
      role,
    };

    try {
      const res = await UserAPI.create(payload);
      if (res.success) {
        setSnackbar({ visible: true, message: 'User created successfully!' });
        setName('');
        setMobile('');
        setEmail('');
        setUsername('');
        setPassword('');
        setRole('worker');
      } else {
        setSnackbar({
          visible: true,
          message: res.error || 'Failed to create user',
        });
      }
    } catch (e) {
      console.error('Create user error', e);
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
            label="Full Name *"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
            theme={{ roundness: wp(2.5) }}
            contentStyle={styles.inputContent}
            outlineColor="#ddd"
            activeOutlineColor="#2874b8"
            left={<TextInput.Icon icon="account-outline" size={wp(6)} />}
          />

          <TextInput
            label="Mobile *"
            value={mobile}
            onChangeText={setMobile}
            mode="outlined"
            style={styles.input}
            keyboardType="phone-pad"
            maxLength={10}
            theme={{ roundness: wp(2.5) }}
            contentStyle={styles.inputContent}
            outlineColor="#ddd"
            activeOutlineColor="#2874b8"
            left={<TextInput.Icon icon="phone" size={wp(6)} />}
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

          <TextInput
            label="Username *"
            value={username}
            onChangeText={setUsername}
            mode="outlined"
            style={styles.input}
            autoCapitalize="none"
            theme={{ roundness: wp(2.5) }}
            contentStyle={styles.inputContent}
            outlineColor="#ddd"
            activeOutlineColor="#2874b8"
            left={<TextInput.Icon icon="account" size={wp(6)} />}
          />

          <TextInput
            label="Password *"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            style={styles.input}
            secureTextEntry
            theme={{ roundness: wp(2.5) }}
            contentStyle={styles.inputContent}
            outlineColor="#ddd"
            activeOutlineColor="#2874b8"
            left={<TextInput.Icon icon="lock" size={wp(6)} />}
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
            onChange={item =>
              setRole(item.value as 'admin' | 'worker' | 'superadmin')
            }
            renderLeftIcon={() => (
              <Ionicons
                style={styles.dropdownIcon}
                color="#2874b8"
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
            buttonColor="#2874b8"
            loading={loading}
            disabled={
              loading ||
              !name.trim() ||
              !mobile.trim() ||
              !email.trim() ||
              !username.trim() ||
              !password.trim()
            }
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
  tabs: { backgroundColor: '#fff', elevation: 4 },
  tabContent: {
    flex: 1,
    paddingHorizontal: wp(4),
    paddingTop: hp(3),
  },
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

  // Dialog Styles
  dialog: {
    maxWidth: width * 0.95,
    alignSelf: 'center',
    minWidth: width * 0.9,
    minHeight: height * 0.5,
    maxHeight: height * 0.7,
  },
  dialogTitle: {
    fontSize: wp(5),
    fontWeight: '600',
    paddingBottom: hp(1),
  },
  dialogScrollArea: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  dialogContent: {
    paddingHorizontal: wp(6),
    paddingTop: hp(1),
    paddingBottom: hp(2),
  },

  // Create User
  formContainer: { paddingVertical: hp(2) },
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
