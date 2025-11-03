import { NewAppScreen } from '@react-native/new-app-screen';
import {
  Alert,
  AppState,
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
import { initNotification } from './utils/pushNofication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppNavigator from './navigation/AppNavigation';
import { useEffect, useRef } from 'react';
import { TranslatorProvider } from 'react-native-translator';
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
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    initNotification().then(success => {
      if (success) console.log('Notification initialized');
    });
    // const subscription = AppState.addEventListener(
    //   'change',
    //   async nextAppState => {
    //     if (appState.current.match(/active/) && nextAppState === 'background') {
    //       console.log('App going to background — clearing storage...');
    //       await AsyncStorage.clear();
    //     }
    //     appState.current = nextAppState;
    //   },
    // );

    // return () => {
    //   subscription.remove();
    // };
  }, []);

  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <TranslatorProvider>
        <PaperProvider theme={theme}>
          {/* <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} /> */}
          <AppNavigator />
        </PaperProvider>
      </TranslatorProvider>
    </SafeAreaProvider>
  );
}
export default App;
