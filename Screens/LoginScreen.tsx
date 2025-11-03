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
import { Card, TextInput, Button } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { rootStackParamList } from '../navigation/AppNavigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { UserAPI } from '../service/apiService';
import { User } from './Adminpanel';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

// Responsive helpers
const wp = (percentage: number) => (width * percentage) / 100;
const hp = (percentage: number) => (height * percentage) / 100;

type Props = {
  navigation: NativeStackNavigationProp<rootStackParamList, 'login'>;
};

const LoginScreen: React.FC<Props> = ({ navigation }) => {
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
    fetchUsers();
  }, []);

  const handleSignIn = () => {
    const user = users.find(
      user => user.email === email && user.password === password,
    );
    if (email === '' || password === '') {
      Alert.alert('Invalid Credentials', 'Email or password is incorrect.');
      return;
    }
    if (email === 'admin@indiansteel.com' && password === 'admin123') {
      AsyncStorage.setItem('user', JSON.stringify({ role: 'superadmin' }));
      navigation.replace('AdminHome');
    }
    if (user?.role === 'admin' || user?.role === 'superadmin') {
      AsyncStorage.setItem('user', JSON.stringify(user));
      navigation.replace('AdminHome');
    } else if (user?.role === 'worker') {
      AsyncStorage.setItem('user', JSON.stringify(user));
      navigation.replace('WorkersHome');
    } else {
      Alert.alert('Invalid Credentials', 'Email or password is incorrect.');
    }
  };

  return (
    <LinearGradient colors={['#0a411fff', '#0a411fff']} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
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

              {/* Email Field */}
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
                />
              </View>

              {/* Password Field */}
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

              {/* Sign In Button */}
              <Button
                mode="contained"
                onPress={handleSignIn}
                style={styles.button}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
                buttonColor="#0a411fff"
                rippleColor="#1e5a8e"
              >
                Sign In
              </Button>

              {/* Uncomment for demo mode */}
              {/* <View style={styles.demoContainer}>
                <Text style={styles.demoTitle}>Demo Credentials:</Text>
                <Text style={styles.demoText}>
                  Admin: admin@indiansteel.com / admin123
                </Text>
                <Text style={styles.demoText}>
                  Worker: worker@indiansteel.com / worker123
                </Text>
              </View> */}
            </Card.Content>
          </Card>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(5),
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
  cardContent: {
    padding: wp(7),
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: hp(2),
  },
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
    marginBottom: hp(4),
  },
  inputContainer: {
    marginBottom: hp(2.5),
  },
  input: {
    backgroundColor: '#fff',
  },
  inputContent: {
    fontSize: wp(4),
  },
  button: {
    marginTop: hp(2),
    borderRadius: wp(2.5),
  },
  buttonContent: {
    height: hp(7),
    justifyContent: 'center',
  },
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
