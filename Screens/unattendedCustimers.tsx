import React, { useState, useEffect } from 'react';
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

const { width, height } = Dimensions.get('window');

// Responsive helpers
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

const UnattendedCustomers: React.FC<Props> = ({ navigation }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadCustomers();
    });
    return unsubscribe;
  }, [navigation]);

  const loadCustomers = async () => {
    try {
      const list = await CustomerAPI.getReminder();
      console.log(list.data);
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

  const calculateTotalPaid = (customer: Customer) => {
    return (customer.payments || []).reduce(
      (sum, payment) => sum + payment.amount,
      0,
    );
  };

  const renderItem = ({ item }: { item: Customer }) => {
    const totalPaid = calculateTotalPaid(item);
    const remaining = item.budget - totalPaid;
    const status = remaining <= 0 ? 'Paid' : 'Pending';

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
                        ? '#f39c12'
                        : item.status === 'CANCELLED'
                        ? '#e74c3c'
                        : '#95a5a6',
                  },
                ]}
              >
                <Text style={styles.statusText}>
                  {item.status.charAt(0) + item.status.slice(1).toLowerCase()}
                </Text>
              </View>
            </View>

            <Text style={styles.phone}>
              {item.contactNo || 'No contact number'}
            </Text>

            <Text style={styles.location} numberOfLines={2}>
              {item.address || 'No address provided'}
            </Text>

            {item.workDescription ? (
              <Text style={styles.workDescription} numberOfLines={2}>
                {item.workDescription}
              </Text>
            ) : null}

            {item.noOfDaysToVisit && item.noOfDaysToVisit > 0 ? (
              <Text style={styles.visitInfo}>
                Visit in: {item.noOfDaysToVisit} day
                {item.noOfDaysToVisit > 1 ? 's' : ''}
              </Text>
            ) : null}

            {item.date ? (
              <Text style={styles.date}>
                Date: {new Date(item.date).toLocaleDateString()}
              </Text>
            ) : null}
          </Card.Content>
        </TouchableOpacity>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <TextInput
          placeholder="Search customers..."
          value={search}
          onChangeText={setSearch}
          mode="outlined"
          style={styles.search}
          theme={{ roundness: wp(2) }}
        />

        <FlatList
          data={filteredCustomers}
          renderItem={renderItem}
          keyExtractor={(_, index) => index.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />

        {/* Uncomment if needed */}
        {/* <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddCustomer')}
          disabled={role !== 'Admin'}
        >
          <MaterialCommunityIcons name="plus" size={wp(7)} color="#fff" />
        </TouchableOpacity> */}
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
    backgroundColor: '#2874b8',
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
});

export default UnattendedCustomers;
