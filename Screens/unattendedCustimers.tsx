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
import { Customer } from './AdminCustomerList';

export type Payment = {
  id: string;
  date: string;
  amount: number;
};

type Props = {
  navigation: NativeStackNavigationProp<rootStackParamList, 'CustomerList'>;
};

const UnattendedCustomers: React.FC<Props> = ({ navigation }) => {
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
      const stored = await AsyncStorage.getItem('customers');
      const role = await AsyncStorage.getItem('role');
      if (stored) {
        const unattended_customers = JSON.parse(stored).filter(
          (c: Customer) => c.status === 'enquired',
        );
        setCustomers(unattended_customers);
      }
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
        >
          <Card.Content>
            <View style={styles.cardHeader}>
              <Text style={styles.name}>{item.name}</Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: status === 'Paid' ? '#27ae60' : '#f39c12',
                  },
                ]}
              >
                <Text style={styles.statusText}>{status}</Text>
              </View>
            </View>
            <Text style={styles.phone}>{item.phone}</Text>
            <Text style={styles.location}>{item.location}</Text>

            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Budget:</Text>
              <Text style={styles.amountValue}>
                ₹{Formatwithcomma(item.budget)}
              </Text>
            </View>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Paid:</Text>
              <Text style={styles.amountValue}>
                ₹{Formatwithcomma(totalPaid)}
              </Text>
            </View>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Remaining:</Text>
              <Text
                style={[
                  styles.amountValue,
                  { color: remaining > 0 ? '#e74c3c' : '#27ae60' },
                ]}
              >
                ₹{Formatwithcomma(Math.abs(remaining))}
              </Text>
            </View>
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
      {/* <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddCustomer')}
        disabled={role !== 'Admin'}
      >
        <MaterialCommunityIcons name="plus" size={24} color="#fff" />
      </TouchableOpacity> */}
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

export default UnattendedCustomers;
