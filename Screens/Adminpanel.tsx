// screens/AdminPanel.tsx (updated with User Management and Create User tabs)
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { TabsProvider, Tabs, TabScreen } from 'react-native-paper-tabs';
import { Card, Text, TextInput, Button } from 'react-native-paper';
import { Dropdown } from 'react-native-element-dropdown';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { rootStackParamList } from '../navigation/AppNavigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');

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

  useEffect(() => {
    navigation?.addListener('focus', () => {
      loadUsers();
    });
  }, []);

  const loadUsers = async () => {
    try {
      const stored = await AsyncStorage.getItem('users');
      if (stored) {
        setUsers(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteUser = async (username: string) => {
    try {
      const stored = await AsyncStorage.getItem('users');
      if (stored) {
        const updatedUsers = JSON.parse(stored).filter(
          (u: User) => u.username !== username,
        );
        await AsyncStorage.setItem('users', JSON.stringify(updatedUsers));
        setUsers(updatedUsers);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <ScrollView style={styles.tabContent}>
      {users.map((user, index) => (
        <Card key={index} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.name}>{user.username}</Text>
            <Button
              mode="contained"
              onPress={() => deleteUser(user.username)}
              style={styles.deleteButton}
              buttonColor="#f00"
            >
              Delete
            </Button>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="email"
              size={width * 0.04}
              color="#2874b8"
            />
            <Text style={styles.infoText}>{user.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="account"
              size={width * 0.04}
              color="#2874b8"
            />
            <Text style={styles.infoText}>Role: {user.role}</Text>
          </View>
        </Card>
      ))}
    </ScrollView>
  );
};

const CreateUserTab = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'worker'>('worker');

  const roleOptions = [
    { label: 'Worker', value: 'worker' },
    { label: 'Admin', value: 'admin' },
  ];

  const handleCreateUser = async () => {
    if (!username || !email) return;
    const newUser: User = { username, email, role };
    try {
      const stored = await AsyncStorage.getItem('users');
      const users = stored ? JSON.parse(stored) : [];
      users.push(newUser);
      await AsyncStorage.setItem('users', JSON.stringify(users));
      setUsername('');
      setEmail('');
      setRole('worker');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <ScrollView style={styles.tabContent}>
      <View style={styles.formContainer}>
        <TextInput
          label="Username *"
          value={username}
          onChangeText={setUsername}
          mode="outlined"
          style={styles.input}
          theme={{ colors: { background: '#FFFFFF' } }}
        />
        <TextInput
          label="Email *"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          style={styles.input}
          keyboardType="email-address"
          theme={{ colors: { background: '#FFFFFF' } }}
        />
        <Dropdown
          style={[styles.dropdown, { marginBottom: height * 0.02 }]}
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
          onChange={item => setRole(item.value)}
          renderLeftIcon={() => (
            <Ionicons
              style={styles.icon}
              color="#2874b8"
              name={role === 'admin' ? 'shield' : 'person'}
              size={20}
            />
          )}
        />
        <Button
          mode="contained"
          onPress={handleCreateUser}
          style={styles.addButton}
          buttonColor="#2874b8"
        >
          Create User
        </Button>
      </View>
    </ScrollView>
  );
};

const AdminPanel: React.FC<Props> = ({ navigation }) => {
  return (
    <TabsProvider defaultIndex={0}>
      <Tabs
        uppercase={false}
        mode="scrollable"
        style={{ backgroundColor: '#fff' }}
        tabLabelStyle={styles.tabLabel}
      >
        <TabScreen label="Users" icon="account-group">
          <UserManagementTab navigation={navigation} />
        </TabScreen>
        <TabScreen label="Create User" icon="account-plus">
          <CreateUserTab />
        </TabScreen>
      </Tabs>
    </TabsProvider>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  tabContent: { padding: width * 0.04, paddingTop: height * 0.02 },
  card: {
    marginBottom: height * 0.03,
    padding: width * 0.04,
    backgroundColor: '#fff',
    borderRadius: width * 0.02,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: height * 0.02,
  },
  name: {
    fontSize: width * 0.045,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  status: {
    fontSize: width * 0.035,
    fontWeight: '500',
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: height * 0.01,
  },
  infoText: {
    marginLeft: width * 0.02,
    color: '#333',
    fontSize: width * 0.035,
  },
  daysLeft: {
    marginLeft: 'auto',
    color: '#888',
    fontSize: width * 0.03,
  },
  addButton: {
    marginTop: height * 0.02,
    borderRadius: width * 0.02,
    paddingVertical: height * 0.01,
  },
  deleteButton: {
    paddingHorizontal: width * 0.02,
    paddingVertical: height * 0.001,
    borderRadius: width * 0.02,
  },
  formContainer: { padding: width * 0.04 },
  input: {
    marginBottom: height * 0.02,
    backgroundColor: '#FFFFFF',
  },
  dropdown: {
    height: 50,
    borderColor: 'gray',
    borderWidth: 0.5,
    borderRadius: 4,
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
  },
  icon: {
    marginRight: 5,
  },
  placeholderStyle: {
    fontSize: 16,
    color: '#666',
  },
  selectedTextStyle: {
    fontSize: 16,
    color: '#000',
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  tabLabel: {
    fontSize: width * 0.04,
    textTransform: 'none',
  },
});

export default AdminPanel;
