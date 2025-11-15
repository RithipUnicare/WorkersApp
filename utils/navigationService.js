import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigationRef } from '../navigation/AppNavigation';

//export const navigationRef = navigationRef;

let pendingNavigation = null;

export function navigate(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  } else {
    pendingNavigation = { name, params };
  }
}

export async function processPendingNavigation() {
  const user = await AsyncStorage.getItem('user');
  if (pendingNavigation && navigationRef.isReady()) {
    const { name, params } = pendingNavigation;
    if (user) {
      navigationRef.navigate(name, params);
    }
    // } else {
    //   navigationRef.navigate('login');
    // }
    pendingNavigation = null;
  }
}
