import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  Modal,
  Animated,
  Pressable,
} from 'react-native';
import { Drawer, Divider, Avatar } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.75;
const wp = (percentage: number) => (width * percentage) / 100;
const hp = (percentage: number) => (height * percentage) / 100;

interface CustomDrawerProps {
  visible: boolean;
  onClose: () => void;
  navigation: any;
}

const CustomDrawer: React.FC<CustomDrawerProps> = ({
  visible,
  onClose,
  navigation,
}) => {
  const [username, setUsername] = useState('');
  const [isTamil, setIsTamil] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-DRAWER_WIDTH));
  const [isVisible, setIsVisible] = useState(visible);

  useEffect(() => {
    const loadUserData = async () => {
      const currentUser = await AsyncStorage.getItem('user');
      const parsedUser = currentUser ? JSON.parse(currentUser) : null;
      setUsername(parsedUser?.name || 'Admin User');

      const savedLang = await AsyncStorage.getItem('appLanguage');
      console.log(savedLang);
      setIsTamil(savedLang === 'ta');
    };
    loadUserData();
  }, []);

  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -DRAWER_WIDTH,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setIsVisible(false);
      });
    }
  }, [visible, slideAnim]);

  const t = (english: string, tamil: string) => {
    return isTamil ? tamil : english;
  };

  const handleNavigation = (route: string) => {
    onClose();
    if (route === 'AdminPanel') {
      navigation.navigate(route);
    } else {
      navigation.navigate(route, { Completed: true });
    }
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Overlay */}
        <Pressable style={styles.overlay} onPress={onClose} />

        {/* Drawer Content */}
        <Animated.View
          style={[
            styles.drawerContainer,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              <Avatar.Image
                size={wp(20)}
                source={require('../assets/logo.jpg')}
                style={styles.avatar}
              />
            </View>
            <Text style={styles.companyName}>Indian Steel Company</Text>
            <View style={{ flexDirection: 'row', gap: wp(3) }}>
              <Text style={styles.username}>{username}</Text>
              <Text style={styles.username}>.</Text>
              <Text style={styles.role}>{t('Administrator', 'நிர்வாகி')}</Text>
            </View>
          </View>

          <Divider style={styles.divider} />

          {/* Menu Items */}
          <Drawer.Section style={styles.section}>
            <Drawer.Item
              label={t('Completed Projects', 'முடிக்கப்பட்ட திட்டங்கள்')}
              icon={({ size, color }) => (
                <MaterialCommunityIcons
                  name="folder-check"
                  size={size}
                  color="#075E54"
                />
              )}
              onPress={() => {
                //setIsVisible(false);
                handleNavigation('ProjectList');
              }}
              style={styles.drawerItem}
              //labelStyle={styles.drawerLabel}
            />

            <Drawer.Item
              label={t('Completed Quotations', 'முடிக்கப்பட்ட மேற்கோள்கள்')}
              icon={({ size, color }) => (
                <MaterialCommunityIcons
                  name="file-document"
                  size={size}
                  color="#075E54"
                />
              )}
              onPress={() => {
                //setIsVisible(false);
                handleNavigation('QuotationList');
              }}
              style={styles.drawerItem}
              //labelStyle={styles.drawerLabel}
            />

            <Drawer.Item
              label={t('Admin Panel', 'நிர்வாகி பேனல்')}
              icon={({ size, color }) => (
                <MaterialCommunityIcons
                  name="cog"
                  size={size}
                  color="#075E54"
                />
              )}
              onPress={() => {
                handleNavigation('AdminPanel');
              }}
              style={styles.drawerItem}
              //labelStyle={styles.drawerLabel}
            />
            {/* <Drawer.Item
              label={t('Projected Quotation', 'திட்டமிடப்பட்ட மேற்கோள்')}
              icon={({ size, color }) => (
                <MaterialCommunityIcons
                  name="file-document"
                  size={size}
                  color="#075E54"
                />
              )}
              onPress={() => {
                //setIsVisible(false);
                handleNavigation('createdQuotation');
              }}
              style={styles.drawerItem}
              //labelStyle={styles.drawerLabel}
            /> */}
          </Drawer.Section>

          <Divider style={styles.divider} />

          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <MaterialCommunityIcons name="close" size={24} color="#666" />
            <Text style={styles.closeText}>
              {t('Close Menu', 'மெனுவை மூடு')}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawerContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    backgroundColor: '#075E54',
    paddingTop: hp(3),
    paddingBottom: hp(2),
    paddingHorizontal: wp(5),
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: hp(2),
  },
  avatar: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  companyName: {
    fontSize: wp(5),
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: hp(1),
  },
  username: {
    fontSize: wp(4.5),
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  role: {
    fontSize: wp(3.5),
    color: '#E3F2FD',
    textAlign: 'center',
    marginTop: hp(0.5),
  },
  divider: {
    backgroundColor: '#E0E0E0',
  },
  section: {
    paddingVertical: hp(1.5),
  },
  drawerItem: {
    backgroundColor: '#F8F9FA',
    marginHorizontal: wp(3),
    marginVertical: hp(0.8),
    borderRadius: wp(2),
  },
  drawerLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: hp(2),
    marginTop: 'auto',
    marginBottom: hp(2.5),
    marginHorizontal: wp(5),
    backgroundColor: '#F5F5F5',
    borderRadius: wp(2),
  },
  closeText: {
    fontSize: wp(4),
    color: '#666',
    marginLeft: wp(2.5),
    fontWeight: '500',
  },
});

export default CustomDrawer;
