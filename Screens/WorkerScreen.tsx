import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { Card } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { rootStackParamList } from '../navigation/AppNavigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslator } from 'react-native-translator';

const { width, height } = Dimensions.get('window');
const wp = (percentage: number) => (width * percentage) / 100;

type Props = {
  navigation: NativeStackNavigationProp<rootStackParamList, 'WorkersHome'>;
};

const enToTa: Record<string, string> = {
  // Header
  'Indian Steel Company': 'Indian Steel Company',
  'Worker App': 'தொழிலாளி ஆப்',

  // Welcome
  Welcome: 'வரவேற்கிறோம்',
  'Worker Account': 'தொழிலாளி கணக்கு',

  // Menu Items
  'Projects List': 'திட்டப் பட்டியல்',
  'Track ongoing projects': 'நடந்து கொண்டிருக்கும் திட்டங்களைக் கண்காணிக்கவும்',

  // Logout
  Logout: 'வெளியேறு',
  'are you sure you want to logout':
    'நீங்கள் உறுதியாக வெளியேற விரும்புகிறீர்களா?',
  Cancel: 'ரத்துசெய்',

  // Footer
  'Version 1.0 • © 2025 Indian Steel Company':
    'பதிப்பு 1.0 • © 2025 இந்தியன் ஸ்டீல் நிறுவனம்',
};

const WorkerHomePage: React.FC<Props> = ({ navigation }) => {
  const [username, setUsername] = useState<string>('');
  const [isTamil, setIsTamil] = useState(false);
  const [translations, setTranslations] = useState<Record<string, string>>({});

  const { translate } = useTranslator();

  // Initialize language and username
  useEffect(() => {
    const init = async () => {
      // Get language
      const savedLang = await AsyncStorage.getItem('appLanguage');
      const tamil = savedLang === 'ta';
      setIsTamil(tamil);

      // Get username
      const currentUser = await AsyncStorage.getItem('user');
      const parsedUser = currentUser ? JSON.parse(currentUser) : null;
      setUsername(parsedUser?.name || 'Worker User');
    };
    init();
  }, []);

  // Translate all strings when Tamil is enabled
  useEffect(() => {
    if (!isTamil) {
      setTranslations({});
      return;
    }

    const translateAll = async () => {
      const result: Record<string, string> = {};
      for (const en of Object.keys(enToTa)) {
        try {
          const ta = await translate('en', 'ta', en, { type: 'google' });
          result[en] = ta;
        } catch {
          result[en] = enToTa[en] || en;
        }
      }
      setTranslations(result);
    };
    translateAll();
  }, [isTamil, translate]);

  const t = useCallback(
    (english: string): string => {
      if (!isTamil) return english;
      return translations[english] ?? enToTa[english] ?? english;
    },
    [isTamil, translations],
  );

  const toggleLanguage = useCallback(async () => {
    const newLang = !isTamil;
    setIsTamil(newLang);
    await AsyncStorage.setItem('appLanguage', newLang ? 'ta' : 'en');
  }, [isTamil]);

  const menuItems = [
    {
      id: 2,
      title: t('Projects List'),
      description: t('Track ongoing projects'),
      icon: 'folder-open',
      iconColor: '#0a411fff',
      iconBg: '#E3F2FD',
      onPress: () => navigation.navigate('ProjectList'),
    },
  ];

  const handleLogout = () => {
    Alert.alert(t('Logout'), t('are you sure you want to logout'), [
      {
        text: t('Cancel'),
        style: 'cancel',
      },
      {
        text: t('Logout'),
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
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require('../assets/logo.jpg')}
            resizeMode="contain"
            style={{
              width: wp(15),
              height: wp(15),
              marginRight: wp(2),
            }}
          />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>{t('Indian Steel Company')}</Text>
            <Text style={styles.headerSubtitle}>{t('Worker App')}</Text>
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

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View>
          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>{`${t(
              'Welcome',
            )}, ${username}`}</Text>
            <Text style={styles.accountType}>{t('Worker Account')}</Text>
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
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {t('Version 1.0 • © 2025 Indian Steel Company')}
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
    backgroundColor: '#0a411fff',
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
  headerText: {
    marginLeft: width * 0.03,
    maxWidth: width * 0.6,
    overflow: 'hidden',
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
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

export default WorkerHomePage;
