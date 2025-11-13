import { PermissionsAndroid, Platform, Alert, Linking } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import Geocoder from 'react-native-geocoding';
Geocoder.init('AIzaSyB-CyxQda-K2tjS0EaahpBf5HEMnhtb2c8');
const requestPermissions = async () => {
  if (Platform.OS === 'ios') {
    const status = await Geolocation.requestAuthorization('whenInUse');
    if (status !== 'granted') {
      Alert.alert(
        'Site Access Needed',
        'Enable location for project tracking.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ],
      );
      return false;
    }
    return true;
  }

  if (Platform.OS !== 'android') return true;

  // Android: Request runtime perms
  const perms = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
  ]);

  const denied = Object.entries(perms).filter(
    ([, value]) => value === 'denied' || value === 'never_ask_again',
  );

  if (denied.length > 0) {
    Alert.alert(
      'Permissions Required',
      'Enable Location in Settings to track sites.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ],
    );
    return false;
  }

  return Object.values(perms).every(p => p === 'granted');
};

const getAddress = async (lat: number, lng: number) => {
  try {
    const json = await Geocoder.from(lat, lng);
    const address = json.results[0].formatted_address;
    console.log(address);
    return address;
  } catch (err) {
    console.warn(err);
    return null;
  }
};

export const getLocation = async () => {
  const ok = await requestPermissions();
  if (!ok) return null;

  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      async pos => {
        const address = await getAddress(
          pos.coords.latitude,
          pos.coords.longitude,
        );
        console.log('Steel Yard Locked:', pos);
        resolve({ pos, address });
        return { pos, address };
      },
      err => {
        console.error('Geo Jam Code:', err.code, err.message);
        let msg = 'GPS check—outdoors?';
        switch (err.code) {
          case 1:
            msg = 'Perms blocked—Settings fix?';
            break;
          case 2:
            msg = 'Signal weak—move to open area.';
            break;
          case 3:
            msg = 'Timed out—retry in yard.';
            break;
          case 4:
            msg = 'Play Services missing (Android).';
            break;
          default:
            msg = err.message;
        }
        Alert.alert('Location Alert', msg);
        reject(err);
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 30000,
      },
    );
  });
};
