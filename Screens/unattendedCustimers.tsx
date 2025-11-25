import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Card, TextInput } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { rootStackParamList } from '../navigation/AppNavigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CustomerAPI } from '../service/apiService';
import { useTranslator } from 'react-native-translator';

const { width, height } = Dimensions.get('window');
const wp = (percentage: number) => (width * percentage) / 100;
const hp = (percentage: number) => (height * percentage) / 100;

export type Payment = {
  id: string;
  date: string;
  amount: number;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  location: string;
  address: string;
  advance: number;
  budget: number;
  payments: Payment[];
  createdAt: string;
  description: string;
  noOfDaysVisited: string;
  status:
    | 'enquired'
    | 'in-progress'
    | 'completed'
    | 'INQUIRED'
    | 'PAID'
    | 'CANCELLED'
    | 'PENDING'
    | 'REJECTED';
  contactNo?: string;
  workDescription?: string;
  noOfDaysToVisit?: number;
  date?: string;
};

type Props = {
  navigation: NativeStackNavigationProp<rootStackParamList, 'CustomerList'>;
};

const enToTa: Record<string, string> = {
  'Search customers...': 'வாடிக்கையாளர்களைத் தேடு...',
  'No contact number': 'தொடர்பு எண் இல்லை',
  'No address provided': 'முகவரி வழங்கப்படவில்லை',
  'Visit in': 'பார்வையிட',
  day: 'நாள்',
  days: 'நாட்கள்',
  Date: 'தேதி',
  Paid: 'பணம் செலுத்தப்பட்டது',
  Inquired: 'விசாரிக்கப்பட்டது',
  Pending: 'நிலுவையில்',
  Cancelled: 'ரத்து செய்யப்பட்டது',
  Rejected: 'நிராகரிக்கப்பட்டது',
};

const UnattendedCustomers: React.FC<Props> = ({ navigation }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
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
    const getNotification = async () => {
      const notification = await AsyncStorage.getItem('notification');
    };
    getNotification();
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
          AsyncStorage.setItem('notificationNavigate', '');
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

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadCustomers();
    });
    return unsubscribe;
  }, [navigation]);

  const loadCustomers = async () => {
    try {
      const list = await CustomerAPI.getReminder();
      if (Array.isArray(list.data)) setCustomers(list.data);
      const storedRole = await AsyncStorage.getItem('role');
      if (storedRole) setRole(storedRole);
    } catch (e) {
      console.error('Failed to load customers', e);
    }
  };

  const filteredCustomers = customers.filter(
    c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.location.toLowerCase().includes(search.toLowerCase()),
  );

  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    const aTime = a.date ? new Date(a.date).getTime() : 0;
    const bTime = b.date ? new Date(b.date).getTime() : 0;
    return aTime - bTime;
  });

  const calculateTotalPaid = (customer: Customer) => {
    return (customer.payments || []).reduce(
      (sum, payment) => sum + payment.amount,
      0,
    );
  };

  const getStatusLabel = (status: string) => {
    const s = status.toUpperCase();
    switch (s) {
      case 'PAID':
        return t('Paid');
      case 'INQUIRED':
        return t('Enquired');
      case 'PENDING':
        return t('Pending');
      case 'CANCELLED':
        return t('Cancelled');
      case 'REJECTED':
        return t('Rejected');
      default:
        return status.charAt(0) + status.slice(1).toLowerCase();
    }
  };

  const renderItem = ({ item }: { item: Customer }) => {
    const totalPaid = calculateTotalPaid(item);
    const remaining = item.budget - totalPaid;
    const statusLabel = getStatusLabel(item.status);

    return (
      <Card style={styles.card}>
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('CustomerDetail', { customer: item });
          }}
          activeOpacity={0.8}
        >
          <Card.Content>
            <View style={styles.cardHeader}>
              <Text style={styles.name} numberOfLines={1}>
                {item.name}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      item.status === 'PAID'
                        ? '#27ae60'
                        : item.status === 'INQUIRED'
                        ? '#3498db'
                        : item.status === 'PENDING'
                        ? '#e6b518ff'
                        : item.status === 'CANCELLED'
                        ? '#e74c3c'
                        : '#95a5a6',
                  },
                ]}
              >
                <Text style={styles.statusText}>{statusLabel}</Text>
              </View>
            </View>

            <Text style={styles.phone}>
              {item.contactNo || t('No contact number')}
            </Text>

            <Text style={styles.location} numberOfLines={2}>
              {item.address || t('No address provided')}
            </Text>

            {item.workDescription ? (
              <Text style={styles.workDescription} numberOfLines={2}>
                {item.workDescription}
              </Text>
            ) : null}

            {item.noOfDaysToVisit && item.noOfDaysToVisit > 0 ? (
              <Text style={styles.visitInfo}>
                {t('Visit in')}: {item.noOfDaysToVisit}{' '}
                {item.noOfDaysToVisit > 1 ? t('days') : t('day')}
              </Text>
            ) : null}

            {item.date ? (
              <Text style={styles.date}>
                {t('Date')}: {new Date(item.date).toLocaleDateString('en-IN')}
              </Text>
            ) : null}
          </Card.Content>
        </TouchableOpacity>
      </Card>
    );
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <View style={styles.container}>
        <TextInput
          placeholder={t('Search customers...')}
          value={search}
          onChangeText={setSearch}
          mode="outlined"
          style={styles.search}
          theme={{ roundness: wp(2) }}
          left={<TextInput.Icon icon="magnify" size={wp(6)} />}
        />

        <FlatList
          data={sortedCustomers}
          renderItem={renderItem}
          keyExtractor={(_, index) => index.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="account-alert"
                size={wp(20)}
                color="#ccc"
              />
              <Text style={styles.emptyText}>No unattended customers</Text>
            </View>
          }
        />

        {/* Add Button (FAB) - Uncomment if needed */}
        {/* {role === 'Admin' && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddCustomer')}
          >
            <MaterialCommunityIcons name="plus" size={wp(7)} color="#fff" />
          </TouchableOpacity>
        )} */}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  container: {
    flex: 1,
    paddingHorizontal: wp(4),
    paddingTop: hp(1),
  },
  search: {
    marginBottom: hp(2),
    fontSize: wp(4),
  },
  listContent: {
    paddingBottom: hp(10),
  },
  card: {
    marginBottom: hp(2),
    borderRadius: wp(2.5),
    elevation: 3,
    padding: wp(3),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  name: {
    fontSize: wp(4.8),
    fontWeight: 'bold',
    flex: 1,
    marginRight: wp(2),
  },
  statusBadge: {
    paddingHorizontal: wp(2.5),
    paddingVertical: wp(1),
    borderRadius: wp(3),
  },
  statusText: {
    color: '#fff',
    fontSize: wp(3),
    fontWeight: '600',
  },
  phone: {
    color: '#666',
    marginBottom: hp(0.5),
    fontSize: wp(3.8),
  },
  location: {
    color: '#444',
    marginBottom: hp(0.5),
    fontWeight: '500',
    fontSize: wp(3.8),
  },
  workDescription: {
    fontSize: wp(3.5),
    color: '#7f8c8d',
    marginTop: hp(0.5),
  },
  visitInfo: {
    fontSize: wp(3.4),
    color: '#2980b9',
    marginTop: hp(0.5),
  },
  date: {
    fontSize: wp(3.2),
    color: '#95a5a6',
    marginTop: hp(0.5),
  },
  addButton: {
    position: 'absolute',
    bottom: hp(3),
    right: wp(6),
    backgroundColor: '#075E54',
    borderRadius: wp(14),
    width: wp(14),
    height: wp(14),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: hp(10),
  },
  emptyText: {
    fontSize: wp(5),
    color: '#999',
    marginTop: hp(2),
    fontWeight: '600',
  },
});

export default UnattendedCustomers;
