// import notifee, { AndroidImportance } from '@notifee/react-native';
// import { PermissionsAndroid, Platform } from 'react-native';
// import { OneSignal, LogLevel } from 'react-native-onesignal';

// const initNotification = async () => {
//   if (Platform.OS === 'android' && Platform.Version >= 33) {
//     const granted = await PermissionsAndroid.request(
//       PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
//     );
//     if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
//       console.log('Notification permission denied');
//       return;
//     } else {
//       console.log('Notification permission granted');
//     }
//   }
//   await notifee.requestPermission();
//   await notifee.deleteChannel('default');
//   const channelId = await notifee.createChannel({
//     id: 'default',
//     name: 'Default',
//     description: 'Default Channel',
//     importance: AndroidImportance.HIGH,
//     sound: 'default',
//   });
//   OneSignal.Debug.setLogLevel(LogLevel.Verbose);
//   OneSignal.initialize('2828e5e4-8bee-49ea-915f-2563b95dbf40');
//   OneSignal.Notifications.requestPermission(false);
//   OneSignal.Notifications.permissionNative().then(permission => {
//     console.log('Permission:', permission);
//   });

//   //   await notifee.displayNotification({
//   //     title: 'Notification Title',
//   //     body: 'Main body content of the notification',
//   //     android: {
//   //       channelId,
//   //       smallIcon: 'ic_launcher',
//   //       pressAction: {
//   //         id: 'default',
//   //       },
//   //       sound: 'default',
//   //     },
//   //   });
// };

// export default initNotification;
// //2828e5e4-8bee-49ea-915f-2563b95dbf40

import { PermissionsAndroid, Platform, Alert } from 'react-native';
import { OneSignal } from 'react-native-onesignal';

const ONE_SIGNAL_APP_ID = '2828e5e4-8bee-49ea-915f-2563b95dbf40';

export const initNotification = async () => {
  // 1. Android 13+ Notification Permission
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
      Alert.alert('Permission Denied', 'Notifications will not work.');
      return false;
    }
  }

  // 2. Initialize OneSignal
  OneSignal.initialize(ONE_SIGNAL_APP_ID);

  // 3. Request Push Permission (iOS: shows prompt, Android: uses above)
  OneSignal.Notifications.requestPermission(true);

  // 4. Foreground Handler (OneSignal shows notification automatically)
  OneSignal.Notifications.addEventListener('foregroundWillDisplay', event => {
    // Let OneSignal show its default notification
    // No preventDefault() → default UI appears
    console.log('Foreground push:', event.notification);
  });

  // 5. Click / Tap Handler (works in background & killed state)
  OneSignal.Notifications.addEventListener('click', event => {
    const { notification } = event;
    Alert.alert(
      'Notification Tapped',
      `${notification.title}\n${notification.body}`,
    );
    // Navigate using your navigation ref:
    // navigation.navigate('Details', notification.additionalData);
  });

  return true;
};

// TEST: Send a local test (OneSignal doesn't send local, but you can simulate)
export const triggerTestAlert = () => {
  Alert.alert('Test', 'OneSignal is ready! Send a real push from dashboard.');
};

export default initNotification;
