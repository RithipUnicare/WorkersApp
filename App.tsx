import { NewAppScreen } from '@react-native/new-app-screen';
import {
  Alert,
  StatusBar,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { DefaultTheme, Provider as PaperProvider } from 'react-native-paper';
import { initNotification, triggerTestAlert } from './utils/pushNofication';

import AppNavigator from './navigation/AppNavigation';
import { useEffect } from 'react';
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#ffffff', // app background
    surface: '#ffffff', // components like TextInput background
    primary: '#6200ee', // your accent color
    text: '#000000', // text color
  },
};
function App() {
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    initNotification().then(success => {
      if (success) console.log('Notification initialized');
    });
  }, []);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        {/* <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} /> */}
        <AppNavigator />
      </PaperProvider>
    </SafeAreaProvider>
  );
}
export default App;
