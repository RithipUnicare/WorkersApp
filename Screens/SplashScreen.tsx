import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { rootStackParamList } from '../navigation/AppNavigation';

const { width, height } = Dimensions.get('window');
const wp = (percentage: number) => (width * percentage) / 100;
const hp = (percentage: number) => (height * percentage) / 100;

type Props = {
  navigation: NativeStackNavigationProp<rootStackParamList, 'splash'>;
};

const SplashScreen: React.FC<Props> = ({ navigation }) => {
  const [visible, setVisible] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const role = await AsyncStorage.getItem('role');

        if (role === 'worker') {
          navigation.replace('WorkersHome');
          return;
        }
        if (role === 'admin') {
          navigation.replace('AdminHome');
          return;
        }
        if (role === 'superadmin') {
          navigation.replace('AdminHome');
          return;
        }

        // No role → show modal
        setVisible(true);
      } catch (e) {
        setVisible(true);
      }
    })();
  }, []);

  const chooseWorker = async () => {
    setLoading(true);
    try {
      await AsyncStorage.setItem('role', 'worker');
      navigation.replace('WorkersHome');
    } catch (e) {
      console.error('Failed to save role', e);
      setLoading(false);
    }
  };

  const chooseAdmin = async () => {
    await AsyncStorage.setItem('role', 'admin');
    navigation.replace('login');
  };

  const chooseSuperAdmin = async () => {
    await AsyncStorage.setItem('role', 'superadmin');
    navigation.replace('login');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>
        <Text style={styles.appName}>WorkersApp</Text>
        <Text style={styles.subtitle}>
          Welcome — choose your role to continue
        </Text>

        {/* Optional brand/logo placeholder */}
        <View style={styles.brandBox} />

        <Modal
          visible={visible}
          animationType="fade"
          transparent
          onRequestClose={() => {}}
          statusBarTranslucent
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Continue as</Text>

              {/* Worker Button */}
              <TouchableOpacity
                style={[styles.buttonPrimary, loading && styles.buttonDisabled]}
                onPress={chooseWorker}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size={wp(5)} />
                ) : (
                  <Text style={styles.buttonText}>Worker</Text>
                )}
              </TouchableOpacity>

              {/* Admin Button */}
              <TouchableOpacity
                style={styles.buttonOutline}
                onPress={chooseAdmin}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonOutlineText}>Admin</Text>
              </TouchableOpacity>

              {/* Super Admin Button */}
              <TouchableOpacity
                style={styles.buttonSecondary}
                onPress={chooseSuperAdmin}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonSecondaryText}>Super Admin</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(6),
  },
  appName: {
    fontSize: wp(8),
    fontWeight: '800',
    color: '#222',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: wp(4),
    color: '#666',
    marginTop: hp(1),
    textAlign: 'center',
    paddingHorizontal: wp(8),
  },
  brandBox: {
    height: wp(45),
    width: wp(45),
    marginTop: hp(4),
    backgroundColor: '#f0f4f8',
    borderRadius: wp(12),
    opacity: 0.6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(6),
  },
  modalCard: {
    width: '100%',
    maxWidth: wp(90),
    backgroundColor: '#fff',
    borderRadius: wp(4),
    paddingVertical: hp(4),
    paddingHorizontal: wp(6),
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  modalTitle: {
    fontSize: wp(5.5),
    fontWeight: '700',
    color: '#222',
    marginBottom: hp(2.5),
  },
  buttonPrimary: {
    backgroundColor: '#0a411fff',
    paddingVertical: hp(1.8),
    paddingHorizontal: wp(8),
    borderRadius: wp(2.5),
    width: '100%',
    alignItems: 'center',
    marginBottom: hp(1.5),
    minHeight: hp(6),
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: wp(4.5),
  },
  buttonOutline: {
    borderColor: '#0a411fff',
    borderWidth: 1.5,
    paddingVertical: hp(1.8),
    paddingHorizontal: wp(8),
    borderRadius: wp(2.5),
    width: '100%',
    alignItems: 'center',
    marginBottom: hp(1.5),
    minHeight: hp(6),
    justifyContent: 'center',
  },
  buttonOutlineText: {
    color: '#0a411fff',
    fontWeight: '600',
    fontSize: wp(4.5),
  },
  buttonSecondary: {
    backgroundColor: '#e74c3c',
    paddingVertical: hp(1.8),
    paddingHorizontal: wp(8),
    borderRadius: wp(2.5),
    width: '100%',
    alignItems: 'center',
    minHeight: hp(6),
    justifyContent: 'center',
  },
  buttonSecondaryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: wp(4.5),
  },
});

export default SplashScreen;
