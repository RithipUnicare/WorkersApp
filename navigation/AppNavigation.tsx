import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../Screens/LoginScreen';
import AdminHomePage from '../Screens/AdminHomeScreen';
import WorkerHomePage from '../Screens/WorkerScreen';
import { useColorScheme } from 'react-native';
import CustomerList from '../Screens/AdminCustomerList';
import AddCustomer from '../Screens/AdminAddCustomer';
import AddProject from '../Screens/AdminAddProduct';
import ProjectList from '../Screens/AdminProductList';
import AdminPanel from '../Screens/Adminpanel';
import PaymentPage from '../Screens/PaymentPage';

export type rootStackParamList = {
  login: undefined;
  AdminHome: undefined;
  WorkersHome: undefined;
  CustomerList: undefined;
  AddCustomer: undefined;
  ProjectList: undefined;
  AddProject: undefined;
  AdminPanel: undefined;
  PaymentPage: { customer: any }; // We'll use 'any' here to avoid type issues
};

const Stack = createNativeStackNavigator<rootStackParamList>();

const AppNavigation = () => {
  const theme = useColorScheme() === 'dark';

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="login"
        screenOptions={{
          headerStyle: {
            backgroundColor: theme ? '#1C2526' : '#FFFFFF',
          },
          headerTintColor: theme ? '#FFFFFF' : '#000000',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="login"
          component={LoginScreen}
          options={{
            title: 'Login',
            headerStyle: { backgroundColor: '#2874b8' },
            headerTitleStyle: {
              color: '#fff',
            },
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen
          name="AdminHome"
          component={AdminHomePage}
          options={{
            title: 'Home',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="WorkersHome"
          component={WorkerHomePage}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="CustomerList"
          component={CustomerList}
          options={{
            headerStyle: { backgroundColor: '#2874b8' },
            headerTitleStyle: {
              color: '#fff',
            },
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen
          name="AddCustomer"
          component={AddCustomer}
          options={{
            presentation: 'modal',
            gestureDirection: 'vertical',
            headerStyle: { backgroundColor: '#2874b8' },
            headerTitleStyle: {
              color: '#fff',
            },
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen
          name="ProjectList"
          component={ProjectList}
          options={{
            headerStyle: { backgroundColor: '#2874b8' },
            headerTitleStyle: {
              color: '#fff',
            },
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen
          name="AddProject"
          component={AddProject}
          options={{
            presentation: 'modal',
            gestureDirection: 'vertical',
            headerStyle: { backgroundColor: '#2874b8' },
            headerTitleStyle: {
              color: '#fff',
            },
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen
          name="AdminPanel"
          component={AdminPanel}
          options={{
            headerStyle: { backgroundColor: '#2874b8' },
            headerTitleStyle: {
              color: '#fff',
            },
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen
          name="PaymentPage"
          component={PaymentPage}
          options={{
            title: 'Payments',
            headerStyle: { backgroundColor: '#2874b8' },
            headerTitleStyle: {
              color: '#fff',
            },
            headerTintColor: '#fff',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigation;
