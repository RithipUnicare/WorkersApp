import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Card, TextInput, Button } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { rootStackParamList } from '../navigation/AppNavigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

const { width, height } = Dimensions.get('window');

type props = {
  navigation: NativeStackNavigationProp<rootStackParamList, 'login'>;
};

const LoginScreen: React.FC<props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = () => {
    // Placeholder for sign-in logic
    if (email === 'admin@indiansteel.com' && password === 'admin123') {
      navigation.replace('AdminHome');
    } else if (email === 'worker@indiansteel.com' && password === 'worker123') {
      navigation.replace('WorkersHome');
    } else
      Alert.alert('Invalid credentials', 'Email address or password is wrong');
    console.log('Sign In:', { email, password });
  };

  return (
    <LinearGradient colors={['#1e5a8e', '#2874b8']} style={styles.background}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 100} // Adjust offset as needed
      >
        <Card style={styles.card}>
          <Card.Content>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <View style={styles.iconBox}>
                <MaterialCommunityIcons
                  name="factory"
                  size={width * 0.1}
                  color="#FFFFFF"
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
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
              />
            </View>

            {/* Sign In Button */}
            <Button
              mode="contained"
              onPress={handleSignIn}
              style={styles.button}
              labelStyle={styles.buttonLabel}
              buttonColor="#2874b8"
            >
              Sign In
            </Button>

            {/* Demo Credentials */}
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
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: width * 0.05,
  },
  card: {
    width: width * 0.9,
    maxWidth: 400,
    borderRadius: 12,
    elevation: 8,
    backgroundColor: '#FFFFFF',
    padding: width * 0.05,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: height * 0.025,
  },
  iconBox: {
    width: width * 0.18,
    height: width * 0.18,
    borderRadius: 16,
    backgroundColor: '#2874b8',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  title: {
    fontSize: width * 0.055,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: height * 0.005,
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: width * 0.04,
    textAlign: 'center',
    marginBottom: height * 0.04,
    color: '#888888',
    fontWeight: '400',
  },
  inputContainer: {
    marginBottom: height * 0.02,
  },
  label: {
    fontSize: width * 0.035,
    fontWeight: '600',
    color: '#333333',
    marginBottom: height * 0.01,
  },
  input: {
    backgroundColor: '#FFFFFF',
    fontSize: width * 0.038,
  },
  button: {
    marginTop: height * 0.01,
    borderRadius: 8,
    paddingVertical: height * 0.005,
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontSize: width * 0.04,
    fontWeight: '600',
    paddingVertical: height * 0.005,
  },
  demoContainer: {
    marginTop: height * 0.03,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: width * 0.04,
  },
  demoTitle: {
    fontSize: width * 0.033,
    fontWeight: '700',
    color: '#333333',
    marginBottom: height * 0.01,
  },
  demoText: {
    fontSize: width * 0.03,
    color: '#666666',
    marginBottom: height * 0.005,
    lineHeight: 18,
  },
});

export default LoginScreen;
