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
import { navigationRef } from '../navigation/AppNavigation';
import { navigate } from '../utils/navigationService';
import { resetLogoutTimer, setupSessionTimeout } from '../utils/sessionManager';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONE_SIGNAL_APP_ID = '81985d30-6da5-4f7a-8b63-e629cddfefb3';

export const initNotification = async () => {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
      Alert.alert('Permission Denied', 'Notifications will not work.');
      return false;
    }
  }

  OneSignal.initialize(ONE_SIGNAL_APP_ID);

  OneSignal.Notifications.requestPermission(true);

  OneSignal.Notifications.addEventListener('foregroundWillDisplay', event => {
    console.log('Foreground push:', event.notification);
  });

  OneSignal.Notifications.addEventListener('click', event => {
    const { notification } = event;
    console.log('notification clicked', notification);
    AsyncStorage.setItem('notificationNavigate', 'unattendedCustomers');
    const cleanupSessionTimeout = setupSessionTimeout(navigationRef);
    navigate('splash');
    cleanupSessionTimeout();
  });

  return true;
};

export const triggerTestAlert = () => {
  Alert.alert('Test', 'OneSignal is ready! Send a real push from dashboard.');
};

export async function sendPushNotification(title: string, message: string) {
  const url = 'https://onesignal.com/api/v1/notifications?c=push';

  const ONE_SIGNAL_APP_ID = '81985d30-6da5-4f7a-8b63-e629cddfefb3';

  // Replace with your OneSignal REST API key
  const REST_API_KEY =
    'os_v2_app_qgmf2mdnuvhxvc3d4yu43x7pwnmqqkljjnvehdevihpg376ze6252qe5ny6vetxg26l3nt5iifupn25n3mi45rf7dkju2mphrhdrfvy';

  const body = {
    app_id: ONE_SIGNAL_APP_ID,
    included_segments: ['All'],
    headings: { en: title },
    contents: { en: message },
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${REST_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    const json = await res.json();

    if (!res.ok) {
      console.log('Push error:', json);
      throw new Error(json?.errors || 'Failed to send notification');
    }

    console.log('Push notification sent:', json);
    return json;
  } catch (err) {
    console.error('Push API Error:', err);
    throw err;
  }
}

export default initNotification;

// import { PermissionsAndroid, Platform, Alert } from 'react-native';
// import { OneSignal } from 'react-native-onesignal';
// import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
// import BackgroundService from 'react-native-background-actions';
// import { CustomerAPI } from '../service/apiService';

// const ONE_SIGNAL_APP_ID = '2828e5e4-8bee-49ea-915f-2563b95dbf40';
// const CHANNEL_ID = 'unattended-customers';
// let navigationRef: any = null;

// export const setNavigationRef = (ref: any) => (navigationRef = ref);

// const createNotificationChannel = async () => {
//   await notifee.createChannel({
//     id: CHANNEL_ID,
//     name: 'Unattended Customers',
//     description: 'Notifications for unattended customers',
//     importance: AndroidImportance.HIGH,
//     sound: 'default',
//     vibration: true,
//   });
// };

// export const requestNotificationPermissions = async () => {
//   if (Platform.OS === 'android' && Platform.Version >= 33) {
//     const granted = await PermissionsAndroid.request(
//       PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
//     );
//     if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
//       Alert.alert('Permission Denied', 'Notifications will not work.');
//       return false;
//     }
//   }
//   await createNotificationChannel();
//   await notifee.requestPermission();
//   return true;
// };

// export const showUnattendedCustomerNotification = async (customer: any) => {
//   try {
//     await notifee.displayNotification({
//       id: `unattended-${customer.id}`,
//       title: '🔔 Unattended Customer',
//       body: `${customer.name}\n📱 ${customer.contactNo}`,
//       data: {
//         type: 'unattended_customer',
//         customerId: customer.id.toString(),
//         customerData: JSON.stringify(customer),
//       },
//       android: {
//         channelId: CHANNEL_ID,
//         importance: AndroidImportance.HIGH,
//         pressAction: { id: 'default' },
//         smallIcon: 'ic_launcher',
//         sound: 'default',
//         vibrationPattern: [300, 500],
//         color: '#2874b8',
//         largeIcon: 'ic_launcher',
//         actions: [
//           { title: 'View Details', pressAction: { id: 'view_details' } },
//           { title: 'Dismiss', pressAction: { id: 'dismiss' } },
//         ],
//       },
//       ios: {
//         sound: 'default',
//         categoryId: 'unattended_customer',
//         interruptionLevel: 'timeSensitive',
//       },
//     });
//   } catch (e) {
//     console.error('Error showing notification:', e);
//   }
// };

// export const checkAndNotifyUnattendedCustomers = async () => {
//   try {
//     const response = await CustomerAPI.getReminder();
//     if (response.success && response.data?.length > 0) {
//       for (const c of response.data)
//         await showUnattendedCustomerNotification(c);
//       return response.data.length;
//     }
//     return 0;
//   } catch (e) {
//     console.error('Error checking unattended customers:', e);
//     return 0;
//   }
// };

// const handleNotificationPress = async (detail: any) => {
//   const { notification, pressAction } = detail;
//   if (notification?.data?.type === 'unattended_customer') {
//     const customerId = notification.data.customerId;
//     const customerData = notification.data.customerData
//       ? JSON.parse(notification.data.customerData)
//       : null;
//     if (navigationRef?.current) {
//       if (pressAction?.id === 'view_details')
//         navigationRef.current.navigate('unattendedCustomers', {
//           customerId,
//           customerData,
//         });
//       else navigationRef.current.navigate('unattendedCustomers');
//     }
//   }
// };

// export const setupNotifeeListeners = () => {
//   notifee.onForegroundEvent(({ type, detail }) => {
//     if (type === EventType.PRESS || type === EventType.ACTION_PRESS)
//       handleNotificationPress(detail);
//   });
//   notifee.onBackgroundEvent(async ({ type, detail }) => {
//     if (type === EventType.PRESS || type === EventType.ACTION_PRESS)
//       handleNotificationPress(detail);
//   });
// };

// const sleep = (t: number) => new Promise(r => setTimeout(r, t));

// const backgroundTask = async ({ delay }: any) => {
//   while (BackgroundService.isRunning()) {
//     await checkAndNotifyUnattendedCustomers();
//     await sleep(delay);
//   }
// };

// export const startBackgroundTask = async () => {
//   const options = {
//     taskName: 'UnattendedCheck',
//     taskTitle: 'Checking unattended customers',
//     taskDesc: 'Running background check...',
//     taskIcon: { name: 'ic_launcher', type: 'mipmap' },
//     color: '#2874b8',
//     parameters: { delay: 15 * 60 * 1000 },
//   };
//   //await BackgroundService.start(backgroundTask, options);
// };

// export const stopBackgroundTask = async () => {
//   await BackgroundService.stop();
// };

// export const initOneSignal = async () => {
//   OneSignal.initialize(ONE_SIGNAL_APP_ID);
//   OneSignal.Notifications.requestPermission(true);
//   OneSignal.Notifications.addEventListener('click', e => {
//     const { notification } = e;
//     if (notification.additionalData?.screen && navigationRef?.current)
//       navigationRef.current.navigate(
//         notification.additionalData.screen,
//         notification.additionalData.params,
//       );
//   });
// };

// export const initNotification = async () => {
//   try {
//     const ok = await requestNotificationPermissions();
//     if (!ok) return false;
//     setupNotifeeListeners();
//     await initOneSignal();
//     await startBackgroundTask();
//     await checkAndNotifyUnattendedCustomers();
//     console.log('Notification system initialized');
//     return true;
//   } catch (e) {
//     console.error('Error initializing notifications:', e);
//     return false;
//   }
// };

// export const testUnattendedNotification = async () => {
//   await showUnattendedCustomerNotification({
//     id: 1,
//     name: 'John Doe',
//     mobile: '+91 98765 43210',
//     address: 'Test Address',
//   });
// };

// export default initNotification;
