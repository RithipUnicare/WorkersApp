import {
  NavigationContainer,
  useNavigationContainerRef,
} from '@react-navigation/native';
import { createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { setupSessionTimeout } from '../utils/sessionManager';
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
import CustomerDetail from '../Screens/CustomerScreen';
import ProjectDetails from '../Screens/ProductDetails';
import UnattendedCustomers from '../Screens/unattendedCustimers';
import SplashScreen from '../Screens/SplashScreen';
import RecoredAudio from '../utils/audioRecorder';
import { Project } from '../Screens/AdminProductList';
import { Customer } from '../Screens/AdminCustomerList';
import { QuotationItem } from '../Screens/AddQuotationScreen';
import { Quotation } from '../Screens/QuotationDetail';
import AddQuotation from '../Screens/AddQuotationScreen';
import QuotationList from '../Screens/QuotationList';
import QuotationDetail from '../Screens/QuotationDetail';
import PendingPayments from '../Screens/PendingPayments';
import { processPendingNavigation } from '../utils/navigationService.js';
import CreatedQuotationList from '../Screens/ProjectCreatedQuotations';

export type rootStackParamList = {
  login: undefined;
  AdminHome: any;
  WorkersHome: any;
  CustomerList: { rejected?: boolean } | undefined;
  AddCustomer: { customer: Customer } | any;
  ProjectList: { Completed: boolean } | undefined;
  AddProject: { customer: Customer } | { projectToEdit: Project } | any;
  AdminPanel: undefined;
  PaymentPage: { project: Project } | any;
  TestingScreen: undefined;
  CustomerDetail: { customer: Customer };
  ProjectDetails: { project: Project };
  unattendedCustomers: undefined;
  RecoredAudio: { project: Project } | { quotation: Quotation } | any;
  splash: undefined;
  AddQuotation: { customer: Customer } | { quotationToEdit: Quotation } | any;
  QuotationList: { Completed: boolean } | undefined;
  QuotationDetail: { quotation: Quotation };
  pendingPayments: undefined;
  createdQuotation: undefined;
};

const Stack = createNativeStackNavigator<rootStackParamList>();
export const navigationRef = createNavigationContainerRef<rootStackParamList>();
const AppNavigation = () => {
  const theme = useColorScheme() === 'dark';

  useEffect(() => {
    const cleanupSessionTimeout = setupSessionTimeout(navigationRef);

    return () => {
      if (cleanupSessionTimeout) {
        cleanupSessionTimeout();
      }
    };
  }, []);

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        processPendingNavigation();
      }}
    >
      <Stack.Navigator
        initialRouteName="splash"
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
          name="splash"
          component={SplashScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="login"
          component={LoginScreen}
          options={{
            title: 'Login',
            headerStyle: { backgroundColor: '#00312bff' },
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
            headerStyle: { backgroundColor: '#075E54' },
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
            headerStyle: { backgroundColor: '#075E54' },
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
            headerStyle: { backgroundColor: '#075E54' },
            headerTitleStyle: {
              color: '#fff',
            },
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen
          name="ProjectDetails"
          component={ProjectDetails}
          options={{
            title: 'Project Details',
            headerStyle: { backgroundColor: '#075E54' },
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
            headerStyle: { backgroundColor: '#075E54' },
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
            headerStyle: { backgroundColor: '#075E54' },
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
            headerStyle: { backgroundColor: '#075E54' },
            headerTitleStyle: {
              color: '#fff',
            },
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen
          name="CustomerDetail"
          component={CustomerDetail}
          options={{
            title: 'Customer Details',
            headerStyle: { backgroundColor: '#075E54' },
            headerTitleStyle: {
              color: '#fff',
            },
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen
          name="unattendedCustomers"
          component={UnattendedCustomers}
          options={{
            title: 'Unattended Customers',
            headerStyle: { backgroundColor: '#075E54' },
            headerTitleStyle: {
              color: '#fff',
            },
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen
          name="RecoredAudio"
          component={RecoredAudio}
          options={{
            title: 'Recored Audio',
            headerStyle: { backgroundColor: '#075E54' },
            headerTitleStyle: {
              color: '#fff',
            },
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen
          name="AddQuotation"
          component={AddQuotation}
          options={{
            title: 'Add Quotation',
            headerStyle: { backgroundColor: '#075E54' },
            headerTitleStyle: {
              color: '#fff',
            },
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen
          name="QuotationList"
          component={QuotationList}
          options={{
            title: 'Quotations',
            headerStyle: { backgroundColor: '#075E54' },
            headerTitleStyle: {
              color: '#fff',
            },
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen
          name="QuotationDetail"
          component={QuotationDetail}
          options={{
            title: 'Quotation Details',
            headerStyle: { backgroundColor: '#075E54' },
            headerTitleStyle: {
              color: '#fff',
            },
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen
          name="pendingPayments"
          component={PendingPayments}
          options={{
            title: 'Pending Payments',
            headerStyle: { backgroundColor: '#075E54' },
            headerTitleStyle: {
              color: '#fff',
            },
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen
          name="createdQuotation"
          component={CreatedQuotationList}
          options={{
            title: 'Created Quotation',
            headerStyle: { backgroundColor: '#075E54' },
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
