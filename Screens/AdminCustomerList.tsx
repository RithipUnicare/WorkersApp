// screens/CustomerList.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Card, TextInput, Button } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { rootStackParamList } from '../navigation/AppNavigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Formatwithcomma } from '../utils/formatewithcomma';
import { CustomerAPI } from '../service/apiService';

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
  status: 'enquired' | 'in-progress' | 'completed' | 'INQUIRED';
};

type Props = {
  navigation: NativeStackNavigationProp<rootStackParamList, 'CustomerList'>;
};

const CustomerList: React.FC<Props> = ({ navigation }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
    navigation.addListener('focus', () => {
      loadCustomers();
    });
  }, []);

  const loadCustomers = async () => {
    try {
      const list = await CustomerAPI.getAll();
      console.log(list.data);
      if (Array.isArray(list.data)) setCustomers(list?.data);
      const role = await AsyncStorage.getItem('role');
      if (role) {
        setRole(role);
      }
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

  const renderItem = ({ item }: { item: any }) => {
    const totalPaid = calculateTotalPaid(item);
    const remaining = item.budget - totalPaid;
    const status = remaining <= 0 ? 'Paid' : 'Pending';

    return (
      <Card style={styles.card}>
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('CustomerDetail', { customer: item });
          }}
        >
          <Card.Content>
            <View style={styles.cardHeader}>
              <Text style={styles.name}>{item.name}</Text>
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
                        : '#95a5a6', // default
                  },
                ]}
              >
                <Text style={styles.statusText}>
                  {item.status.charAt(0) + item.status.slice(1).toLowerCase()}
                </Text>
              </View>
            </View>

            {/* Contact Number */}
            <Text style={styles.phone}>
              {item.contactNo ? item.contactNo : 'No contact number'}
            </Text>

            {/* Address */}
            <Text style={styles.location}>
              {item.address || 'No address provided'}
            </Text>

            {/* Optional: Show Work Description if available */}
            {item.workDescription && (
              <Text style={styles.workDescription}>{item.workDescription}</Text>
            )}

            {/* Optional: Show Visit Days */}
            {item.noOfDaysToVisit > 0 && (
              <Text style={styles.visitInfo}>
                Visit in: {item.noOfDaysToVisit} day
                {item.noOfDaysToVisit > 1 ? 's' : ''}
              </Text>
            )}

            {/* Optional: Show Date if available */}
            {item.date && (
              <Text style={styles.date}>
                Date: {new Date(item.date).toLocaleDateString()}
              </Text>
            )}
          </Card.Content>
        </TouchableOpacity>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Search customers..."
        value={search}
        onChangeText={setSearch}
        mode="outlined"
        style={styles.search}
      />
      <FlatList
        data={filteredCustomers}
        renderItem={renderItem}
        keyExtractor={(_, index) => index.toString()}
        showsVerticalScrollIndicator={false}
      />
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddCustomer')}
        //disabled={role !== 'Admin'}
      >
        <MaterialCommunityIcons name="plus" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 16 },
  search: { marginBottom: 16 },
  card: {
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  workDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 6,
  },
  visitInfo: {
    fontSize: 13,
    color: '#2980b9',
    marginTop: 4,
  },
  date: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  phone: {
    color: '#666',
    marginBottom: 4,
    fontSize: 14,
  },
  location: {
    color: '#444',
    marginBottom: 4,
    fontWeight: '500',
    fontSize: 14,
  },
  address: {
    color: '#666',
    marginBottom: 12,
    fontSize: 13,
    lineHeight: 18,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
    paddingVertical: 2,
  },
  amountLabel: {
    color: '#555',
    fontSize: 14,
  },
  amountValue: {
    fontWeight: '600',
    fontSize: 14,
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#2874b8',
    borderRadius: 28,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
});

export default CustomerList;
