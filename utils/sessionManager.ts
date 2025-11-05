import { AppState, AppStateStatus, Platform } from 'react-native';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CommonActions,
  NavigationContainerRef,
} from '@react-navigation/native';
import { rootStackParamList } from '../navigation/AppNavigation';

// Type for web event listeners
type EventHandler = () => void;

const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds
let logoutTimer: ReturnType<typeof setTimeout> | null = null;
let navigation: NavigationContainerRef<rootStackParamList> | null = null;

const resetLogoutTimer = () => {
  if (logoutTimer) {
    clearTimeout(logoutTimer);
  }
  logoutTimer = setTimeout(logoutUser, INACTIVITY_TIMEOUT);
};

const handleAppStateChange = (nextAppState: AppStateStatus) => {
  if (nextAppState === 'active') {
    resetLogoutTimer();
  } else if (logoutTimer) {
    clearTimeout(logoutTimer);
  }
};

export const setupSessionTimeout = (
  nav: NavigationContainerRef<rootStackParamList>,
) => {
  navigation = nav;
  let cleanupFunctions: (() => void)[] = [];

  // Handle user activity
  const handleUserActivity = () => {
    resetLogoutTimer();
  };

  // Setup event listeners for user activity
  const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
  const eventHandler: EventHandler = () => handleUserActivity();

  if (Platform.OS === 'web') {
    // Web environment
    events.forEach(event => {
      try {
        // @ts-ignore - We're checking for web environment
        if (typeof document !== 'undefined') {
          // @ts-ignore
          document.addEventListener(event, eventHandler);
          cleanupFunctions.push(() => {
            // @ts-ignore
            document.removeEventListener(event, eventHandler);
          });
        }
      } catch (e) {
        console.warn('Failed to add web event listener:', e);
      }
    });
  } else {
    // React Native environment - use AppState for background/foreground
    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );
    cleanupFunctions.push(() => subscription.remove());
  }

  // Initial setup
  resetLogoutTimer();

  // Return cleanup function
  return () => {
    cleanupFunctions.forEach(cleanup => cleanup());
    if (logoutTimer) clearTimeout(logoutTimer);
  };
};

const logoutUser = async () => {
  try {
    // Clear all stored data
    await AsyncStorage.multiRemove([
      'token',
      'user',
      'role',
      'username',
      'appLanguage',
    ]);

    // Navigate to login screen
    if (navigation) {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'login' }],
        }),
      );
    }

    Alert.alert(
      'Session Expired',
      'You have been logged out due to inactivity.',
      [{ text: 'OK' }],
    );
  } catch (error) {
    console.error('Error during logout:', error);
  }
};
