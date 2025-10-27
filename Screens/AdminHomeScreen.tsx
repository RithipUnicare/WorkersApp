import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import { Card } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { rootStackParamList } from '../navigation/AppNavigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import initNotification from '../utils/pushNofication';

type props = {
  navigation: NativeStackNavigationProp<rootStackParamList, 'AdminHome'>;
};

const { width, height } = Dimensions.get('window');

const AdminHomePage: React.FC<props> = ({ navigation }) => {
  useEffect(() => {
    AsyncStorage.removeItem('role');
    AsyncStorage.setItem('role', 'Admin');
  }, []);
  const menuItems = [
    {
      id: 1,
      title: 'Customer List',
      description: 'View and manage customers',
      icon: 'account-group',
      iconColor: '#2874b8',
      iconBg: '#E3F2FD',
      onPress: () => navigation.navigate('CustomerList'),
    },
    {
      id: 2,
      title: 'Projects List',
      description: 'Track ongoing projects',
      icon: 'folder-open',
      iconColor: '#2874b8',
      iconBg: '#E3F2FD',
      onPress: () => navigation.navigate('ProjectList'),
    },
    {
      id: 3,
      title: 'Add Project',
      description: 'Create new project',
      icon: 'folder-plus',
      iconColor: '#2874b8',
      iconBg: '#E3F2FD',
      onPress: () => navigation.navigate('AddProject'),
    },
    {
      id: 4,
      title: 'Admin Panel',
      description: 'Manage users and roles',
      icon: 'cog',
      iconColor: '#2874b8',
      iconBg: '#E3F2FD',
      onPress: () => navigation.navigate('AdminPanel'),
    },
    // {
    //   id: 5,
    //   title: 'Testing',
    //   description: 'Testing',
    //   icon: 'cog',
    //   iconColor: '#2874b8',
    //   iconBg: '#E3F2FD',
    //   onPress: () => navigation.navigate('TestingScreen'),
    // },
    {
      id: 6,
      title: 'Unattended Customers',
      description: 'View Unattended Customers',
      icon: 'account-clock',
      iconColor: '#2874b8',
      iconBg: '#E3F2FD',
      onPress: () => navigation.navigate('unattendedCustomers'),
    },
  ];

  const handleLogout = () => {
    Alert.alert('Logout', 'are you sure you want to logout', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Logout',
        onPress: () =>
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'login' }],
            }),
          ),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons
            name="factory"
            size={width * 0.08}
            color="#FFFFFF"
          />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Indian Steel Company</Text>
            <Text style={styles.headerSubtitle}>Worker App</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <MaterialCommunityIcons
            name="logout"
            size={width * 0.06}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome, Admin User</Text>
          <Text style={styles.accountType}>Admin Account</Text>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map(item => (
            <TouchableOpacity
              key={item.id}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <Card style={styles.menuCard}>
                <View style={styles.menuCardContent}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: item.iconBg },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={item.icon}
                      size={width * 0.08}
                      color={item.iconColor}
                    />
                  </View>
                  <View style={styles.menuTextContainer}>
                    <Text style={styles.menuTitle}>{item.title}</Text>
                    <Text style={styles.menuDescription}>
                      {item.description}
                    </Text>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Version 1.0 • © 2025 Indian Steel Company
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#2874b8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: width * 0.05,
    paddingVertical: height * 0.02,
    elevation: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: width * 0.03,
  },
  headerTitle: {
    fontSize: width * 0.05,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: width * 0.035,
    color: '#E3F2FD',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  welcomeSection: {
    paddingHorizontal: width * 0.05,
    paddingTop: height * 0.03,
    paddingBottom: height * 0.02,
  },
  welcomeText: {
    fontSize: width * 0.065,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: height * 0.005,
  },
  accountType: {
    fontSize: width * 0.04,
    color: '#888888',
  },
  menuContainer: {
    paddingHorizontal: width * 0.05,
    paddingBottom: height * 0.02,
  },
  menuCard: {
    marginBottom: height * 0.015,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: '#FFFFFF',
  },
  menuCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: width * 0.04,
  },
  iconContainer: {
    width: width * 0.14,
    height: width * 0.14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTextContainer: {
    flex: 1,
    marginLeft: width * 0.04,
  },
  menuTitle: {
    fontSize: width * 0.045,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: height * 0.005,
  },
  menuDescription: {
    fontSize: width * 0.035,
    color: '#888888',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: height * 0.03,
  },
  footerText: {
    fontSize: width * 0.032,
    color: '#888888',
  },
});

export default AdminHomePage;
