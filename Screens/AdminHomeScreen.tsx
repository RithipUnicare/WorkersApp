import React, { useEffect, useState, useCallback } from 'react';
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
import { Card } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { rootStackParamList } from '../navigation/AppNavigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import initNotification from '../utils/pushNofication';
import { useTranslator } from 'react-native-translator';
import CustomDrawer from '../utils/customDrawer';

const { width, height } = Dimensions.get('window');
const wp = (percentage: number) => (width * percentage) / 100;
const hp = (percentage: number) => (height * percentage) / 100;

type Props = {
  navigation: NativeStackNavigationProp<rootStackParamList, 'AdminHome'>;
};

const enToTa: Record<string, string> = {
  // Header
  'Admin Portal': 'நிர்வாகி போர்டல்',

  // Welcome
  Welcome: 'வரவேற்கிறோம்',
  'Administrator Account': 'நிர்வாகி கணக்கு',

  // Menu items
  'Customer List': 'வாடிக்கையாளர் பட்டியல்',
  'View and manage customers': 'வாடிக்கையாளர்களைப் பார்க்கவும் நிர்வகிக்கவும்',

  'Projects List': 'திட்டப் பட்டியல்',
  'Track ongoing projects': 'நடந்து கொண்டிருக்கும் திட்டங்களைக் கண்காணிக்கவும்',

  'Quotations List': 'மேற்கோள் பட்டியல்',

  'Admin Panel': 'நிர்வாகி பேனல்',
  'Manage users and roles': 'பயனர்கள் மற்றும் பாத்திரங்களை நிர்வகிக்கவும்',

  'Unattended Customers': 'கவனிக்கப்படாத வாடிக்கையாளர்கள்',
  'View customers needing follow-up':
    'பின்தொடர்தல் தேவைப்படும் வாடிக்கையாளர்களைப் பார்க்கவும்',
  'Pending Payments': 'நிலுவையில் பொருட்கள்',

  // Footer
  'Version 1.0 • © 2025 Indian Steel Company':
    'பதிப்பு 1.0 • © 2025 இந்தியன் ஸ்டீல் நிறுவனம்',

  // Logout dialog
  Logout: 'வெளியேறு',
  'Are you sure you want to logout?':
    'நீங்கள் உறுதியாக வெளியேற விரும்புகிறீர்களா?',
  Cancel: 'ரத்துசெய்',
};

const AdminHomePage: React.FC<Props> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [username, setUsername] = useState('');
  const [isTamil, setIsTamil] = useState(false);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [drawerVisible, setDrawerVisible] = useState(false);

  const { translate } = useTranslator();

  useEffect(() => {
    const init = async () => {
      // language
      const savedLang = await AsyncStorage.getItem('appLanguage');
      const tamil = savedLang === 'ta';
      setIsTamil(tamil);

      // username
      const stored = await AsyncStorage.getItem('username');
      if (stored) setUsername(stored);

      // role
      //await AsyncStorage.setItem('role', 'Admin');
      const currentUser = await AsyncStorage.getItem('user');
      const parsedUser = currentUser ? JSON.parse(currentUser) : null;

      setUsername(parsedUser?.name || 'Admin User');
      // animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();

      initNotification();
    };
    init();
  }, [fadeAnim]);

  useEffect(() => {
    if (!isTamil) {
      setTranslations({});
      return;
    }

    const translateAll = async () => {
      const result: Record<string, string> = {};
      for (const en of Object.keys(enToTa)) {
        try {
          // Google Translate (tamil = 'ta')
          const ta = await translate('en', 'ta', en, { type: 'google' });
          result[en] = ta;
        } catch {
          result[en] = enToTa[en] || en; // fallback to static map
        }
      }
      setTranslations(result);
    };

    translateAll();
  }, [isTamil, translate]);

  const toggleLanguage = useCallback(async () => {
    const newLang = !isTamil;
    setIsTamil(newLang);
    await AsyncStorage.setItem('appLanguage', newLang ? 'ta' : 'en');
  }, [isTamil]);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const t = (english: string): string => {
    if (!isTamil) return english;
    return translations[english] ?? enToTa[english] ?? english;
  };

  const openDrawer = () => {
    setDrawerVisible(true);
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
  };

  const menuItems = [
    {
      id: 1,
      title: t('Customer List'),
      description: t('View and manage customers'),
      icon: 'account-group',
      color: '#4CAF50', // Green → people/customer friendly
      onPress: () => navigation.navigate('CustomerList'),
    },

    {
      id: 2,
      title: t('Quotations List'),
      description: t('Track ongoing projects'),
      icon: 'folder-open',
      color: '#2196F3', // Blue → documents, quotations, files
      onPress: () => navigation.navigate('QuotationList'),
    },

    {
      id: 3,
      title: t('Projects List'),
      description: t('Track ongoing projects'),
      icon: 'hammer-screwdriver',
      color: '#FF9800', // Orange → construction/work/project tools
      onPress: () => navigation.navigate('ProjectList'),
    },
    {
      id: 4,
      title: t('Unattended Customers'),
      description: t('View customers needing follow-up'),
      icon: 'account-clock',
      color: '#F44336', // Red → urgent, attention needed
      onPress: () => navigation.navigate('unattendedCustomers'),
    },

    {
      id: 5,
      title: t('Pending Payments'),
      description: t('View pending payments'),
      icon: 'cash',
      color: '#009688', // Teal → finance, money, calm status
      onPress: () => navigation.navigate('pendingPayments'),
    },
  ];

  const handleLogout = () => {
    Alert.alert(
      t('Logout'),
      t('Are you sure you want to logout?'),
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('Logout'),
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove([
              'role',
              'username',
              'appLanguage',
              'user',
            ]);
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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={openDrawer}
              style={styles.logoContainer}
              activeOpacity={0.7}
            >
              <Image
                source={require('../assets/logo.jpg')}
                style={{ width: wp(16), height: wp(14), borderRadius: wp(3) }}
                resizeMode="center"
              />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Indian Steel Company</Text>
              <Text style={styles.headerSubtitle}>{t('Admin Portal')}</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity onPress={toggleLanguage} style={styles.langBtn}>
              <Text style={styles.langText}>{isTamil ? 'த' : 'EN'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
              <MaterialCommunityIcons
                name="logout"
                size={wp(6.5)}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Welcome */}
          <Animated.View style={[styles.welcomeSection, { opacity: fadeAnim }]}>
            <Text style={styles.welcomeText}>
              {t('Welcome')}, {username}
            </Text>
            <Text style={styles.accountType}>{t('Administrator Account')}</Text>
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
                          color={item.color}
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
              {t('Version 1.0 • © 2025 Indian Steel Company')}
            </Text>
          </View>
        </ScrollView>

        {/* Custom Drawer */}
        <CustomDrawer
          visible={drawerVisible}
          onClose={closeDrawer}
          navigation={navigation}
        />
      </View>
    </SafeAreaView>
  );
};

/* -------------------------------------------------
   Styles
   ------------------------------------------------- */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F5F5' },
  container: { flex: 1 },
  header: {
    backgroundColor: '#075E54',
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

  headerRight: { flexDirection: 'row', alignItems: 'center' },
  langBtn: {
    backgroundColor: '#ffffff33',
    paddingHorizontal: wp(1.5),
    paddingVertical: wp(1),
    borderRadius: wp(2),
    marginRight: wp(2),
  },
  langText: { color: '#fff', fontWeight: '600', fontSize: wp(4) },
  logoutBtn: { padding: wp(2) },

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
  menuItemWrapper: { marginBottom: hp(2) },
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
  menuTextContainer: { flex: 1 },
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
  chevron: { marginLeft: wp(2) },
  footer: { alignItems: 'center', paddingVertical: hp(4) },
  footerText: {
    fontSize: wp(3.2),
    color: '#999999',
    fontWeight: '500',
  },
});

export default AdminHomePage;
