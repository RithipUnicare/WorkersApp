// import React, { useEffect, useState } from 'react';
// import {
//   View,
//   Text,
//   Modal,
//   TouchableOpacity,
//   StyleSheet,
//   StatusBar,
//   ActivityIndicator,
//   Dimensions,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { NativeStackNavigationProp } from '@react-navigation/native-stack';
// import { rootStackParamList } from '../navigation/AppNavigation';

// const { width, height } = Dimensions.get('window');
// const wp = (percentage: number) => (width * percentage) / 100;
// const hp = (percentage: number) => (height * percentage) / 100;

// type Props = {
//   navigation: NativeStackNavigationProp<rootStackParamList, 'splash'>;
// };

// const SplashScreen: React.FC<Props> = ({ navigation }) => {
//   const [visible, setVisible] = useState(true);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     (async () => {
//       try {
//         const role = await AsyncStorage.getItem('role');

//         if (role === 'worker') {
//           navigation.replace('WorkersHome');
//           return;
//         }
//         if (role === 'admin') {
//           navigation.replace('AdminHome');
//           return;
//         }
//         if (role === 'superadmin') {
//           navigation.replace('AdminHome');
//           return;
//         }

//         // No role → show modal
//         setVisible(true);
//       } catch (e) {
//         setVisible(true);
//       }
//     })();
//   }, []);

//   const chooseWorker = async () => {
//     setLoading(true);
//     try {
//       await AsyncStorage.setItem('role', 'worker');
//       navigation.replace('WorkersHome');
//     } catch (e) {
//       console.error('Failed to save role', e);
//       setLoading(false);
//     }
//   };

//   const chooseAdmin = async () => {
//     await AsyncStorage.setItem('role', 'admin');
//     navigation.replace('login');
//   };

//   const chooseSuperAdmin = async () => {
//     await AsyncStorage.setItem('role', 'superadmin');
//     navigation.replace('login');
//   };

//   return (
//     <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
//       <StatusBar barStyle="dark-content" backgroundColor="#fff" />
//       <View style={styles.container}>
//         <Text style={styles.appName}>WorkersApp</Text>
//         <Text style={styles.subtitle}>
//           Welcome — choose your role to continue
//         </Text>

//         {/* Optional brand/logo placeholder */}
//         <View style={styles.brandBox} />

//         <Modal
//           visible={visible}
//           animationType="fade"
//           transparent
//           onRequestClose={() => {}}
//           statusBarTranslucent
//         >
//           <View style={styles.modalBackdrop}>
//             <View style={styles.modalCard}>
//               <Text style={styles.modalTitle}>Continue as</Text>

//               {/* Worker Button */}
//               <TouchableOpacity
//                 style={[styles.buttonPrimary, loading && styles.buttonDisabled]}
//                 onPress={chooseWorker}
//                 disabled={loading}
//                 activeOpacity={0.8}
//               >
//                 {loading ? (
//                   <ActivityIndicator color="#fff" size={wp(5)} />
//                 ) : (
//                   <Text style={styles.buttonText}>Worker</Text>
//                 )}
//               </TouchableOpacity>

//               {/* Admin Button */}
//               <TouchableOpacity
//                 style={styles.buttonOutline}
//                 onPress={chooseAdmin}
//                 activeOpacity={0.8}
//               >
//                 <Text style={styles.buttonOutlineText}>Admin</Text>
//               </TouchableOpacity>

//               {/* Super Admin Button */}
//               <TouchableOpacity
//                 style={styles.buttonSecondary}
//                 onPress={chooseSuperAdmin}
//                 activeOpacity={0.8}
//               >
//                 <Text style={styles.buttonSecondaryText}>Super Admin</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </Modal>
//       </View>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     backgroundColor: '#fff',
//   },
//   container: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingHorizontal: wp(6),
//   },
//   appName: {
//     fontSize: wp(8),
//     fontWeight: '800',
//     color: '#222',
//     letterSpacing: 0.5,
//   },
//   subtitle: {
//     fontSize: wp(4),
//     color: '#666',
//     marginTop: hp(1),
//     textAlign: 'center',
//     paddingHorizontal: wp(8),
//   },
//   brandBox: {
//     height: wp(45),
//     width: wp(45),
//     marginTop: hp(4),
//     backgroundColor: '#f0f4f8',
//     borderRadius: wp(12),
//     opacity: 0.6,
//   },
//   modalBackdrop: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: wp(6),
//   },
//   modalCard: {
//     width: '100%',
//     maxWidth: wp(90),
//     backgroundColor: '#fff',
//     borderRadius: wp(4),
//     paddingVertical: hp(4),
//     paddingHorizontal: wp(6),
//     alignItems: 'center',
//     elevation: 10,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.15,
//     shadowRadius: 12,
//   },
//   modalTitle: {
//     fontSize: wp(5.5),
//     fontWeight: '700',
//     color: '#222',
//     marginBottom: hp(2.5),
//   },
//   buttonPrimary: {
//     backgroundColor: '#0a411fff',
//     paddingVertical: hp(1.8),
//     paddingHorizontal: wp(8),
//     borderRadius: wp(2.5),
//     width: '100%',
//     alignItems: 'center',
//     marginBottom: hp(1.5),
//     minHeight: hp(6),
//     justifyContent: 'center',
//   },
//   buttonDisabled: {
//     opacity: 0.7,
//   },
//   buttonText: {
//     color: '#fff',
//     fontWeight: '600',
//     fontSize: wp(4.5),
//   },
//   buttonOutline: {
//     borderColor: '#0a411fff',
//     borderWidth: 1.5,
//     paddingVertical: hp(1.8),
//     paddingHorizontal: wp(8),
//     borderRadius: wp(2.5),
//     width: '100%',
//     alignItems: 'center',
//     marginBottom: hp(1.5),
//     minHeight: hp(6),
//     justifyContent: 'center',
//   },
//   buttonOutlineText: {
//     color: '#0a411fff',
//     fontWeight: '600',
//     fontSize: wp(4.5),
//   },
//   buttonSecondary: {
//     backgroundColor: '#e74c3c',
//     paddingVertical: hp(1.8),
//     paddingHorizontal: wp(8),
//     borderRadius: wp(2.5),
//     width: '100%',
//     alignItems: 'center',
//     minHeight: hp(6),
//     justifyContent: 'center',
//   },
//   buttonSecondaryText: {
//     color: '#fff',
//     fontWeight: '600',
//     fontSize: wp(4.5),
//   },
// });

// export default SplashScreen;

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Dimensions,
  Animated,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { rootStackParamList } from '../navigation/AppNavigation';
const { width, height } = Dimensions.get('window');
const wp = (percentage: number) => (width * percentage) / 100;
const hp = (percentage: number) => (height * percentage) / 100;

type Props = {
  navigation: NativeStackNavigationProp<rootStackParamList, 'splash'>;
};

const SplashScreen: React.FC<Props> = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate after 2 seconds
    const timer = setTimeout(() => {
      navigation.replace('login');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0a411f" />
      <View style={styles.container}>
        {/* Animated Logo/Brand Box */}
        <Animated.View
          style={[
            styles.brandBox,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Image
            style={styles.logoInner}
            source={require('../assets/logo.jpg')}
          />
        </Animated.View>

        {/* Animated App Name */}
        <Animated.Text
          style={[
            styles.appName,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          Indian Steels
        </Animated.Text>

        {/* Animated Subtitle */}
        <Animated.Text
          style={[
            styles.subtitle,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          Manage your workforce efficiently
        </Animated.Text>

        {/* Loading Indicator */}
        <Animated.View
          style={[
            styles.loadingContainer,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={styles.loadingBar}>
            <Animated.View
              style={[
                styles.loadingProgress,
                {
                  transform: [{ scaleX: fadeAnim }],
                },
              ]}
            />
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a411f',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(6),
  },
  brandBox: {
    height: wp(35),
    width: wp(35),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: wp(17.5),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(4),
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  logoInner: {
    height: wp(20),
    width: wp(20),
    backgroundColor: '#fff',
    borderRadius: wp(10),
  },
  appName: {
    fontSize: wp(9),
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
    marginBottom: hp(1),
  },
  subtitle: {
    fontSize: wp(4),
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    paddingHorizontal: wp(8),
    marginBottom: hp(6),
  },
  loadingContainer: {
    position: 'absolute',
    bottom: hp(8),
    width: wp(50),
  },
  loadingBar: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  loadingProgress: {
    height: '100%',
    backgroundColor: '#fff',
    transformOrigin: 'left',
  },
});

export default SplashScreen;
