import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { rootStackParamList } from '../navigation/AppNavigation';
import { FAB, IconButton, Portal } from 'react-native-paper';
import { CustomerAPI } from '../service/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslator } from 'react-native-translator';

const { width, height } = Dimensions.get('window');
const wp = (percentage: number) => (width * percentage) / 100;
const hp = (percentage: number) => (height * percentage) / 100;

type Props = {
  navigation: NativeStackNavigationProp<rootStackParamList, 'CustomerDetail'>;
  route: RouteProp<rootStackParamList, 'CustomerDetail'>;
};

const enToTa: Record<string, string> = {
  // General
  'Unknown Customer': 'தெரியாத வாடிக்கையாளர்',
  'No address provided': 'முகவரி கிடைக்கவில்லை',
  'No work description': 'பணி விளக்கம் இல்லை',
  'No follow-up scheduled': 'பின்தொடர்வு திட்டமிடப்படவில்லை',
  'Not provided': 'வழங்கப்படவில்லை',

  // Sections
  'Contact Information': 'தொடர்பு தகவல்',
  'Inquiry Details': 'விசாரணை விவரங்கள்',

  // Labels
  'Phone Number': 'தொலைபேசி எண்',
  Address: 'முகவரி',
  'Work Description': 'பணி விளக்கம்',
  'Follow-up In': 'பின்தொடர்வு',
  'Inquiry Date': 'விசாரணை தேதி',
  'Created On': 'உருவாக்கப்பட்டது',

  // Status
  Paid: 'பணம் செலுத்தப்பட்டது',
  Inquired: 'விசாரிக்கப்பட்டது',
  Pending: 'நிலுவையில்',
  Cancelled: 'ரத்து செய்யப்பட்டது',
  'Project Created': 'திட்டம் உருவாக்கப்பட்டது',

  // Buttons & Alerts
  'Delete Customer': 'வாடிக்கையாளரை நீக்கு',
  'Are you sure you want to delete': 'நிச்சயமாக நீக்க வேண்டுமா',
  'has been removed.': 'நீக்கப்பட்டது.',
  Error: 'பிழை',
  'Cannot open phone dialer': 'தொலைபேசி டயலரை திறக்க முடியவில்லை',
  'Convert to Quotation': 'மேற்கோளுக்கு மாற்று',

  // FAB Group (if enabled)
  'Edit Customer': 'வாடிக்கையாளரைத் திருத்து',
  //'Delete Customer': 'வாடிக்கையாளரை நீக்கு',
};

const CustomerDetail: React.FC<Props> = ({ navigation, route }) => {
  const customer1 = route.params as { customer: any };
  const [customer, setCustomer] = useState(customer1.customer);
  const [fabOpen, setFabOpen] = useState(false);
  const [fabVisible, setFabVisible] = useState(true);

  const [isTamil, setIsTamil] = useState(false);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const { translate } = useTranslator();

  // Initialize language
  useEffect(() => {
    const initLang = async () => {
      const saved = await AsyncStorage.getItem('appLanguage');
      const tamil = saved === 'ta';
      setIsTamil(tamil);
    };
    initLang();
  }, []);

  // Translate all strings
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
          result[en] = enToTa[en] ?? en;
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

  // Safely extract values
  const name = customer.name || t('Unknown Customer');
  const contactNo = customer.contactNo;
  const address = customer.address || t('No address provided');
  const workDescription = customer.workDescription || t('No work description');
  const noOfDaysToVisit = customer.noOfDaysToVisit || 0;
  const date = customer.date
    ? new Date(customer.date).toLocaleDateString('en-IN')
    : null;
  const status = customer.status || 'UNKNOWN';
  const createdAt = customer.createdAt
    ? new Date(customer.createdAt).toLocaleDateString('en-IN')
    : 'N/A';

  const formattedStatus = status
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l: string) => l.toUpperCase());

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const loadCustomer = async () => {
        try {
          const res = await CustomerAPI.getById(customer.id);
          if (res && res.data) {
            setCustomer(res.data);
          }
        } catch (e) {
          console.error('Error loading customer:', e);
        }
      };
      loadCustomer();
    });
    return unsubscribe;
  }, [navigation, customer.id]);

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PAID':
        return '#27ae60';
      case 'INQUIRED':
        return '#3498db';
      case 'PENDING':
        return '#f39c12';
      case 'CANCELLED':
        return '#e74c3c';
      case 'PROJECT_CREATED':
        return '#01612cff';
      default:
        return '#95a5a6';
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setFabVisible(true);
    });
    return unsubscribe;
  }, [navigation]);

  const handleDelete = () => {
    Alert.alert(
      t('Delete Customer'),
      `${t('Are you sure you want to delete')} ${name}?`,
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('Delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await CustomerAPI.updateStatus(customer.id, {
                status: 'DELETED',
              });
              console.log('Customer deleted:', res, customer.id);
              Alert.alert(t('Deleted'), `${name} ${t('has been removed.')}`);
              navigation.goBack();
            } catch (e) {
              //console.log('Error deleting customer:', e, customer.id);
              Alert.alert(t('Error'), `${t('Error deleting customer')}`);
            }
          },
        },
      ],
      { cancelable: true },
    );
    setFabOpen(false);
  };

  const handleEdit = () => {
    navigation.navigate('AddCustomer' as any, { customer });
    setFabOpen(false);
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header Card */}
          <View style={styles.headerCard}>
            <View style={styles.headerTop}>
              <Text style={styles.customerName} numberOfLines={1}>
                {name}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(status) },
                ]}
              >
                <Text style={styles.statusText}>
                  {t(formattedStatus) || formattedStatus}
                </Text>
              </View>
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text style={styles.location}>
                <MaterialCommunityIcons
                  name="map-marker"
                  size={wp(4)}
                  color="#666"
                />
                {'  '}
                {address}
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-end',
                  justifyContent: 'flex-end',
                }}
              >
                <IconButton
                  icon="pencil"
                  size={wp(6)}
                  iconColor="#075E54"
                  onPress={handleEdit}
                />
                <IconButton
                  icon="delete"
                  size={wp(6)}
                  iconColor="#e74c3c"
                  onPress={handleDelete}
                />
              </View>
            </View>
          </View>

          {/* Contact Information */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('Contact Information')}</Text>

            {contactNo ? (
              <TouchableOpacity
                style={styles.infoRow}
                onPress={async () => {
                  const url = `tel:${contactNo}`;
                  const supported = await Linking.canOpenURL(url);
                  if (supported) {
                    await Linking.openURL(url);
                  } else {
                    Alert.alert(t('Error'), t('Cannot open phone dialer'));
                  }
                }}
                activeOpacity={0.8}
              >
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons
                    name="phone"
                    size={wp(5.5)}
                    color="#075E54"
                  />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>{t('Phone Number')}</Text>
                  <Text style={styles.infoValue}>{contactNo}</Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={wp(6)}
                  color="#ccc"
                />
              </TouchableOpacity>
            ) : (
              <View style={styles.infoRow}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons
                    name="phone"
                    size={wp(5.5)}
                    color="#95a5a6"
                  />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>{t('Phone Number')}</Text>
                  <Text style={[styles.infoValue, { color: '#95a5a6' }]}>
                    {t('Not provided')}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                  name="home"
                  size={wp(5.5)}
                  color="#075E54"
                />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>{t('Address')}</Text>
                <Text style={styles.infoValue}>{address}</Text>
              </View>
            </View>
          </View>

          {/* Inquiry Details */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('Inquiry Details')}</Text>

            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                  name="text-box"
                  size={wp(5.5)}
                  color="#075E54"
                />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>{t('Work Description')}</Text>
                <Text style={styles.infoValue}>{workDescription}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                  name="calendar-clock"
                  size={wp(5.5)}
                  color="#075E54"
                />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>{t('Follow-up In')}</Text>
                <Text style={styles.infoValue}>
                  {noOfDaysToVisit > 0
                    ? `${noOfDaysToVisit} day${noOfDaysToVisit > 1 ? 's' : ''}`
                    : t('No follow-up scheduled')}
                </Text>
              </View>
            </View>

            {date && (
              <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <View style={styles.iconContainer}>
                    <MaterialCommunityIcons
                      name="calendar"
                      size={wp(5.5)}
                      color="#075E54"
                    />
                  </View>
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>{t('Inquiry Date')}</Text>
                    <Text style={styles.infoValue}>{date}</Text>
                  </View>
                </View>
              </>
            )}

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={wp(5.5)}
                  color="#075E54"
                />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>{t('Created On')}</Text>
                <Text style={styles.infoValue}>{createdAt}</Text>
              </View>
            </View>
          </View>

          {/* Bottom Spacer */}
          <View style={{ height: hp(20) }} />
        </ScrollView>

        {/* Bottom Convert Button */}
        <View style={styles.bottomButtonContainer}>
          <TouchableOpacity
            style={styles.addProjectButton}
            onPress={() => {
              navigation.navigate('AddQuotation', { customer });
              setFabOpen(false);
            }}
            activeOpacity={0.9}
          >
            <MaterialCommunityIcons
              name="plus-circle"
              size={wp(6)}
              color="#fff"
            />
            <Text style={styles.addProjectButtonText}>
              {t('Convert to Quotation')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* FAB Group (Uncomment to enable) */}
        {/* <Portal>
          <FAB.Group
            open={fabOpen}
            visible={fabVisible}
            icon={fabOpen ? 'close' : 'pencil'}
            actions={[
              {
                icon: 'pencil',
                label: t('Edit Customer'),
                onPress: () => {
                  setFabVisible(false);
                  handleEdit();
                },
                style: { backgroundColor: '#075E54' },
              },
              {
                icon: 'delete',
                label: t('Delete Customer'),
                onPress: handleDelete,
                style: { backgroundColor: '#e74c3c' },
              },
            ]}
            onStateChange={({ open }) => setFabOpen(open)}
            fabStyle={styles.fabStyle}
            style={styles.fabGroup}
          />
        </Portal> */}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F5F5' },
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: hp(15) },
  headerCard: {
    backgroundColor: '#fff',
    padding: wp(5),
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: hp(1),
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  customerName: {
    fontSize: wp(6),
    fontWeight: '700',
    color: '#333',
    flex: 1,
    marginRight: wp(2),
  },
  statusBadge: {
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.8),
    borderRadius: wp(4),
    minWidth: wp(20),
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: wp(3.2),
    fontWeight: '600',
  },
  location: {
    fontSize: wp(3.8),
    color: '#666',
    marginTop: hp(0.5),
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: wp(4),
    marginTop: hp(2),
    padding: wp(5),
    borderRadius: wp(3),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  cardTitle: {
    fontSize: wp(4.8),
    fontWeight: '700',
    color: '#333',
    marginBottom: hp(2),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1.5),
    minHeight: hp(7),
  },
  iconContainer: {
    width: wp(11),
    height: wp(11),
    borderRadius: wp(5.5),
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(3),
  },
  infoTextContainer: { flex: 1 },
  infoLabel: {
    fontSize: wp(3.4),
    color: '#888',
    marginBottom: hp(0.3),
  },
  infoValue: {
    fontSize: wp(4),
    color: '#333',
    lineHeight: wp(5.5),
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: hp(1),
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  addProjectButton: {
    backgroundColor: '#075E54',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(2),
    borderRadius: wp(3),
    elevation: 4,
  },
  addProjectButtonText: {
    color: '#fff',
    fontSize: wp(4.2),
    fontWeight: '600',
    marginLeft: wp(2),
  },
  fabStyle: {
    backgroundColor: '#075E54',
  },
  fabGroup: {
    paddingBottom: hp(12),
  },
});

export default CustomerDetail;
