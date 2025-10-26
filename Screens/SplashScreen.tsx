import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { rootStackParamList } from '../navigation/AppNavigation';

type Props = {
  navigation: NativeStackNavigationProp<rootStackParamList, 'splash'> | any;
};

const SplashScreen: React.FC<Props> = ({ navigation }) => {
  const [visible, setVisible] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const role = await AsyncStorage.getItem('role');
        if (role === 'worker') {
          // If role already set to worker, go straight to ProjectList
          navigation.replace('ProjectList');
          return;
        }
        if (role === 'admin') {
          // If admin previously chosen, go to Login
          navigation.replace({ name: 'login' });
          return;
        }
        // else keep modal visible so user can choose
        setVisible(true);
      } catch (e) {
        // ignore and show modal
        setVisible(true);
      }
    })();
  }, [navigation]);

  const chooseWorker = async () => {
    setLoading(true);
    try {
      await AsyncStorage.setItem('role', 'worker');
      // Navigate to ProjectList for workers
      navigation.replace('ProjectList');
    } catch (e) {
      console.error('Failed to save role', e);
      setLoading(false);
    }
  };

  const chooseAdmin = () => {
    // Do not save role for admin (user must log in)
    navigation.replace('login');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>
        <Text style={styles.appName}>WorkersApp</Text>
        <Text style={styles.subtitle}>
          Welcome — choose your role to continue
        </Text>

        <Modal
          visible={visible}
          animationType="slide"
          transparent
          onRequestClose={() => {}}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Continue as</Text>

              <TouchableOpacity
                style={styles.buttonPrimary}
                onPress={chooseWorker}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Worker</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.buttonOutline}
                onPress={chooseAdmin}
              >
                <Text style={styles.buttonOutlineText}>Admin</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.buttonSkip}
                onPress={() => setVisible(false)}
              >
                <Text style={styles.buttonSkipText}>Skip</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Minimal splash content shown behind modal */}
        <View style={styles.brandBox} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  appName: { fontSize: 28, fontWeight: '700', color: '#222' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 8 },
  brandBox: { height: 200, width: 200, marginTop: 32 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  buttonPrimary: {
    backgroundColor: '#2874b8',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  buttonOutline: {
    borderColor: '#2874b8',
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonOutlineText: { color: '#2874b8', fontWeight: '600', fontSize: 16 },
  buttonSkip: { padding: 8, marginTop: 4 },
  buttonSkipText: { color: '#888' },
});

export default SplashScreen;
