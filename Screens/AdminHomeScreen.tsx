import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Alert,
  Animated,
  RefreshControl,
  Image,
} from 'react-native';
import { Card, FAB, Portal } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { rootStackParamList } from '../navigation/AppNavigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import initNotification from '../utils/pushNofication';

const { width, height } = Dimensions.get('window');

// Responsive helpers
const wp = (percentage: number) => (width * percentage) / 100;
const hp = (percentage: number) => (height * percentage) / 100;

type Props = {
  navigation: NativeStackNavigationProp<rootStackParamList, 'AdminHome'>;
};

const AdminHomePage: React.FC<Props> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [username, setUsername] = useState('Admin User');

  useEffect(() => {
    // Set role
    AsyncStorage.setItem('role', 'Admin');

    // Load username if available
    const loadUsername = async () => {
      const stored = await AsyncStorage.getItem('username');
      if (stored) setUsername(stored);
    };
    loadUsername();

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Initialize notifications
    initNotification();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => setRefreshing(false), 1000);
  };

  const menuItems = [
    {
      id: 1,
      title: 'Customer List',
      description: 'View and manage customers',
      icon: 'account-group',
      onPress: () => navigation.navigate('CustomerList'),
    },
    {
      id: 2,
      title: 'Projects List',
      description: 'Track ongoing projects',
      icon: 'folder-open',
      onPress: () => navigation.navigate('ProjectList'),
    },
    {
      id: 3,
      title: 'Quotations List',
      description: 'Track ongoing projects',
      icon: 'folder-open',
      onPress: () => navigation.navigate('QuotationList'),
    },

    {
      id: 4,
      title: 'Add Project',
      description: 'Create new project',
      icon: 'folder-plus',
      onPress: () => navigation.navigate('AddProject'),
    },
    {
      id: 5,
      title: 'Admin Panel',
      description: 'Manage users and roles',
      icon: 'cog',
      onPress: () => navigation.navigate('AdminPanel'),
    },
    {
      id: 6,
      title: 'Unattended Customers',
      description: 'View customers needing follow-up',
      icon: 'account-clock',
      onPress: () => navigation.navigate('unattendedCustomers'),
    },
  ];

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            AsyncStorage.multiRemove(['role', 'username']);
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'login' }],
              }),
            );
          },
        },
      ],
      { cancelable: true },
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../assets/logo.jpg')}
                style={{ width: wp(16), height: wp(14), borderRadius: wp(3) }}
                resizeMode="center"
              />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Indian Steel Company</Text>
              <Text style={styles.headerSubtitle}>Admin Portal</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <MaterialCommunityIcons
              name="logout"
              size={wp(6.5)}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Welcome Section */}
          <Animated.View style={[styles.welcomeSection, { opacity: fadeAnim }]}>
            <Text style={styles.welcomeText}>Welcome, {username}</Text>
            <Text style={styles.accountType}>Administrator Account</Text>
          </Animated.View>

          {/* Menu Grid */}
          <View style={styles.menuGrid}>
            {menuItems.map((item, index) => (
              <Animated.View
                key={item.id}
                style={[
                  styles.menuItemWrapper,
                  {
                    opacity: fadeAnim,
                    transform: [
                      {
                        translateY: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [50, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={item.onPress}
                  activeOpacity={0.8}
                  style={styles.menuTouchable}
                >
                  <Card style={styles.menuCard} elevation={4}>
                    <View style={styles.menuCardContent}>
                      <View style={styles.iconContainer}>
                        <MaterialCommunityIcons
                          name={item.icon}
                          size={wp(8)}
                          color="#2874b8"
                        />
                      </View>
                      <View style={styles.menuTextContainer}>
                        <Text style={styles.menuTitle}>{item.title}</Text>
                        <Text style={styles.menuDescription}>
                          {item.description}
                        </Text>
                      </View>
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={wp(6)}
                        color="#ccc"
                        style={styles.chevron}
                      />
                    </View>
                  </Card>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Version 1.0 • © 2025 Indian Steel Company
            </Text>
          </View>
        </ScrollView>

        {/* FAB for Logout */}
        {/* <Portal>
          <FAB
            icon="logout"
            style={styles.fab}
            color="#fff"
            onPress={handleLogout}
            label="Logout"
          />
        </Portal> */}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F5F5' },
  container: { flex: 1 },
  header: {
    backgroundColor: '#2874b8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    paddingVertical: hp(2.5),
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  logoContainer: {
    width: wp(13),
    height: wp(13),
    borderRadius: wp(3),
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(3),
  },
  headerText: { justifyContent: 'center' },
  headerTitle: {
    fontSize: wp(5.5),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: wp(3.5),
    color: '#E3F2FD',
    marginTop: hp(0.3),
    fontWeight: '500',
  },
  logoutBtn: {
    padding: wp(2),
  },
  content: { flex: 1 },
  welcomeSection: {
    paddingHorizontal: wp(5),
    paddingTop: hp(3),
    paddingBottom: hp(2),
  },
  welcomeText: {
    fontSize: wp(7),
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: 0.3,
  },
  accountType: {
    fontSize: wp(4),
    color: '#666666',
    marginTop: hp(0.5),
    fontWeight: '500',
  },
  menuGrid: {
    paddingHorizontal: wp(5),
    paddingBottom: hp(2),
  },
  menuItemWrapper: {
    marginBottom: hp(2),
  },
  menuTouchable: { borderRadius: wp(3) },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp(3),
    overflow: 'hidden',
  },
  menuCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: wp(4),
  },
  iconContainer: {
    width: wp(15),
    height: wp(15),
    borderRadius: wp(3.5),
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(4),
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: wp(4.8),
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: hp(0.3),
  },
  menuDescription: {
    fontSize: wp(3.6),
    color: '#666666',
    lineHeight: wp(5),
  },
  chevron: {
    marginLeft: wp(2),
  },
  footer: {
    alignItems: 'center',
    paddingVertical: hp(4),
  },
  footerText: {
    fontSize: wp(3.2),
    color: '#999999',
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    margin: wp(5),
    right: 0,
    bottom: 0,
    backgroundColor: '#e74c3c',
  },
});

export default AdminHomePage;
