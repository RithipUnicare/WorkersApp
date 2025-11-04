import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, TextInput, Button, SegmentedButtons } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import { rootStackParamList } from '../navigation/AppNavigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { UserAPI } from '../service/apiService';
import { User } from './Adminpanel';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const wp = (percentage: number) => (width * percentage) / 100;
const hp = (percentage: number) => (height * percentage) / 100;

type Props = {
  navigation: NativeStackNavigationProp<rootStackParamList, 'login'>;
};

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<'worker' | 'admin'>('worker');

  // Worker Login State
  const [mobile, setMobile] = useState('');

  // Admin Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await UserAPI.getAll();
        setUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    const alreadyLogin = async () => {
      const user = await AsyncStorage.getItem('user');
      const UserRole = user ? JSON.parse(user).role : null;
      if (user) {
        if (UserRole === 'worker') {
          navigation.navigate('WorkersHome');
        } else {
          navigation.navigate('AdminHome');
        }
      }
    };
    alreadyLogin();
    fetchUsers();
  }, []);

  const handleWorkerLogin = async () => {
    if (!mobile.trim()) {
      Alert.alert('Invalid Input', 'Please enter your mobile number.');
      return;
    }

    const user = users.find(u => u.mobile === mobile.trim());
    if (!user) {
      Alert.alert('Not Found', 'No worker found with this mobile number.');
      return;
    }

    if (user.role !== 'worker') {
      Alert.alert(
        'Access Denied',
        'This mobile is not registered as a worker.',
      );
      return;
    }

    await AsyncStorage.setItem('user', JSON.stringify(user));
    navigation.replace('WorkersHome');
  };

  const handleAdminLogin = () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Invalid Input', 'Email and password are required.');
      return;
    }

    const user = users.find(u => u.email === email && u.password === password);

    // Superadmin hardcoded
    if (email === 'admin@indiansteel.com' && password === 'admin1234') {
      AsyncStorage.setItem(
        'user',
        JSON.stringify({ role: 'superadmin', name: 'Super Admin' }),
      );
      navigation.replace('AdminHome');
      return;
    }

    if (!user) {
      Alert.alert('Invalid Credentials', 'Email or password is incorrect.');
      return;
    }

    if (user.role === 'admin' || user.role === 'superadmin') {
      AsyncStorage.setItem('user', JSON.stringify(user));
      navigation.replace('AdminHome');
    } else {
      Alert.alert('Access Denied', 'You do not have admin access.');
    }
  };

  const handleSubmit = () => {
    if (activeTab === 'worker') {
      handleWorkerLogin();
    } else {
      handleAdminLogin();
    }
  };

  return (
    <LinearGradient colors={['#0a411fff', '#0a411fff']} style={styles.gradient}>
      <SafeAreaView
        style={styles.safeArea}
        edges={['top', 'left', 'right', 'bottom']}
      >
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? hp(5) : hp(10)}
        >
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              {/* Logo */}
              <View style={styles.logoContainer}>
                <View style={styles.iconBox}>
                  <Image
                    source={require('../assets/logo.jpg')}
                    style={{
                      width: wp(28),
                      height: wp(28),
                      borderRadius: wp(3),
                    }}
                    resizeMode="contain"
                  />
                </View>
              </View>

              <Text style={styles.title}>Indian Steel Company</Text>
              <Text style={styles.subtitle}>Worker App</Text>

              {/* Tab Switch */}
              <SegmentedButtons
                value={activeTab}
                onValueChange={value =>
                  setActiveTab(value as 'worker' | 'admin')
                }
                buttons={[
                  {
                    value: 'worker',
                    label: 'Worker Login',
                    icon: 'account-hard-hat',
                    style:
                      activeTab === 'worker'
                        ? styles.activeTab
                        : styles.inactiveTab,
                  },
                  {
                    value: 'admin',
                    label: 'Admin Login',
                    icon: 'shield-account',
                    style:
                      activeTab === 'admin'
                        ? styles.activeTab
                        : styles.inactiveTab,
                  },
                ]}
                style={[styles.segmentedButtons]}
              />

              {/* Worker Login Form */}
              {activeTab === 'worker' && (
                <View style={styles.inputContainer}>
                  <TextInput
                    label="Mobile Number"
                    value={mobile}
                    onChangeText={setMobile}
                    mode="outlined"
                    keyboardType="phone-pad"
                    style={styles.input}
                    theme={{ roundness: wp(2.5) }}
                    contentStyle={styles.inputContent}
                    outlineColor="#ddd"
                    activeOutlineColor="#0a411fff"
                    left={<TextInput.Icon icon="phone" color="#0a411fff" />}
                  />
                </View>
              )}

              {/* Admin Login Form */}
              {activeTab === 'admin' && (
                <>
                  <View style={styles.inputContainer}>
                    <TextInput
                      label="Email"
                      value={email}
                      onChangeText={setEmail}
                      mode="outlined"
                      style={styles.input}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      theme={{ roundness: wp(2.5) }}
                      contentStyle={styles.inputContent}
                      outlineColor="#ddd"
                      activeOutlineColor="#0a411fff"
                      left={<TextInput.Icon icon="email" color="#0a411fff" />}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <TextInput
                      label="Password"
                      value={password}
                      onChangeText={setPassword}
                      mode="outlined"
                      style={styles.input}
                      secureTextEntry={!showPassword}
                      theme={{ roundness: wp(2.5) }}
                      contentStyle={styles.inputContent}
                      outlineColor="#ddd"
                      activeOutlineColor="#0a411fff"
                      left={<TextInput.Icon icon="lock" color="#0a411fff" />}
                      right={
                        <TextInput.Icon
                          icon={showPassword ? 'eye-off' : 'eye'}
                          size={wp(6)}
                          onPress={() => setShowPassword(!showPassword)}
                          color="#0a411fff"
                        />
                      }
                    />
                  </View>
                </>
              )}

              {/* Sign In Button */}
              <Button
                mode="contained"
                onPress={handleSubmit}
                style={styles.button}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
                buttonColor="#0a411fff"
                rippleColor="#1e5a8e"
              >
                {activeTab === 'worker' ? 'Login as Worker' : 'Login as Admin'}
              </Button>

              {/* Demo Info (Uncomment for testing) */}
              {/* {activeTab === 'admin' && (
                <View style={styles.demoContainer}>
                  <Text style={styles.demoTitle}>Demo Admin:</Text>
                  <Text style={styles.demoText}>admin@indiansteel.com / admin123</Text>
                </View>
              )}
              {activeTab === 'worker' && (
                <View style={styles.demoContainer}>
                  <Text style={styles.demoTitle}>Demo Worker Mobile:</Text>
                  <Text style={styles.demoText}>9876543210</Text>
                </View>
              )} */}
            </Card.Content>
          </Card>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    //marginTop:hp(6)
  },
  card: {
    width: '100%',
    maxWidth: wp(90),
    borderRadius: wp(4),
    elevation: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  cardContent: { padding: wp(7) },
  logoContainer: { alignItems: 'center', marginBottom: hp(2) },
  iconBox: {
    width: wp(22),
    height: wp(22),
    borderRadius: wp(5),
    backgroundColor: '#0a411fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  title: {
    fontSize: wp(6.5),
    fontWeight: '800',
    textAlign: 'center',
    color: '#1a1a1a',
    letterSpacing: 0.5,
    marginBottom: hp(0.5),
  },
  subtitle: {
    fontSize: wp(4.2),
    textAlign: 'center',
    color: '#666666',
    fontWeight: '500',
    marginBottom: hp(3),
  },
  segmentedButtons: {
    marginBottom: hp(3),
  },
  activeTab: {
    backgroundColor: '#518b67ff',
    color: '#fff',
  },
  inactiveTab: {
    backgroundColor: '#e0e0e0',
  },
  inputContainer: { marginBottom: hp(2.5) },
  input: { backgroundColor: '#fff' },
  inputContent: { fontSize: wp(4) },
  button: {
    marginTop: hp(2),
    borderRadius: wp(2.5),
  },
  buttonContent: { height: hp(7), justifyContent: 'center' },
  buttonLabel: {
    color: '#FFFFFF',
    fontSize: wp(4.5),
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  demoContainer: {
    marginTop: hp(4),
    backgroundColor: '#f8f9fa',
    borderRadius: wp(2.5),
    padding: wp(4),
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  demoTitle: {
    fontSize: wp(3.8),
    fontWeight: '700',
    color: '#333333',
    marginBottom: hp(1),
    textAlign: 'center',
  },
  demoText: {
    fontSize: wp(3.4),
    color: '#555555',
    marginBottom: hp(0.5),
    lineHeight: wp(5),
  },
});

export default LoginScreen;
