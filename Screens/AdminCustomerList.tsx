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
import { Card, TextInput } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { rootStackParamList } from '../navigation/AppNavigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type Customer = {
  name: string;
  phone: string;
  location: string;
  address: string;
  advance: number;
  total: number;
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
      const stored = await AsyncStorage.getItem('customers');
      const role = await AsyncStorage.getItem('role');
      if (stored) {
        setCustomers(JSON.parse(stored));
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

  const renderItem = ({ item }: { item: Customer }) => (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.location}>{item.location}</Text>
      </View>
      <View style={styles.infoRow}>
        <MaterialCommunityIcons name="phone" size={16} color="#2874b8" />
        <Text style={styles.phone}>{item.phone}</Text>
      </View>
      <View style={styles.infoRow}>
        <MaterialCommunityIcons name="map-marker" size={16} color="#2874b8" />
        <Text style={styles.address}>{item.address}</Text>
      </View>
    </Card>
  );

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
        disabled={role !== 'Admin'}
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
    marginBottom: 12,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  name: { fontSize: 18, fontWeight: '600', color: '#1a1a1a' },
  location: { fontSize: 16, color: '#888' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  phone: { marginLeft: 8, color: '#333' },
  address: { marginLeft: 8, color: '#333' },
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
