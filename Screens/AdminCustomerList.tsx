import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, TextInput, FAB, Portal, Chip } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { rootStackParamList } from '../navigation/AppNavigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CustomerAPI } from '../service/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

// Responsive helpers
const wp = (percentage: number) => (width * percentage) / 100;
const hp = (percentage: number) => (height * percentage) / 100;

export type Customer = {
  id: string;
  name: string;
  contactNo?: string;
  address?: string;
  workDescription?: string;
  noOfDaysToVisit?: number;
  date?: string;
  status:
    | 'enquired'
    | 'in-progress'
    | 'completed'
    | 'INQUIRED'
    | 'PAID'
    | 'PENDING'
    | 'CANCELLED'
    | 'REJECTED';
  createdAt?: string;
};

type Props = {
  navigation: NativeStackNavigationProp<rootStackParamList, 'CustomerList'>;
};

const CustomerList: React.FC<Props> = ({ navigation }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [fabVisible, setFabVisible] = useState(false);

  // Load on focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadCustomers();
      setFabVisible(true);
    });
    return unsubscribe;
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const [res, storedRole] = await Promise.all([
        CustomerAPI.getAll(),
        AsyncStorage.getItem('role'),
      ]);

      if (res.success && Array.isArray(res.data)) {
        setCustomers(res.data);
        setFilteredCustomers(res.data);
      }

      setRole(storedRole);
    } catch (e) {
      console.error('Failed to load customers', e);
    } finally {
      setLoading(false);
    }
  };

  // Pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCustomers();
    setRefreshing(false);
  }, []);

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      const query = search.toLowerCase().trim();
      const filtered = customers.filter(
        c =>
          c.name.toLowerCase().includes(query) ||
          (c.contactNo || '').toLowerCase().includes(query) ||
          (c.address || '').toLowerCase().includes(query),
      );
      setFilteredCustomers(filtered);
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, customers]);

  // Status color & label
  const getStatusInfo = (status: string) => {
    const s = status.toUpperCase();
    switch (s) {
      case 'PAID':
        return { color: '#27ae60', label: 'Paid' };
      case 'INQUIRED':
        return { color: '#3498db', label: 'Inquired' };
      case 'PENDING':
        return { color: '#f39c12', label: 'Pending' };
      case 'CANCELLED':
        return { color: '#e74c3c', label: 'Cancelled' };
      case 'REJECTED':
        return { color: '#95a5a6', label: 'Rejected' };
      case 'PROJECT_CREATED':
        return { color: '#01612cff', label: 'Project Created' };
      default:
        return {
          color: '#95a5a6',
          label: status.charAt(0) + status.slice(1).toLowerCase(),
        };
    }
  };

  const renderItem = ({ item }: { item: Customer }) => {
    const statusInfo = getStatusInfo(item.status);

    return (
      <Card style={styles.card} elevation={3}>
        <TouchableOpacity
          onPress={() => {
            setFabVisible(false);
            navigation.navigate('CustomerDetail', { customer: item });
          }}
          activeOpacity={0.8}
        >
          <View style={styles.cardContent}>
            <View style={styles.headerRow}>
              <Text style={styles.name} numberOfLines={1}>
                {item.name}
              </Text>
              <Chip
                style={[
                  styles.statusChip,
                  { backgroundColor: statusInfo.color },
                ]}
                textStyle={styles.statusText}
              >
                {statusInfo.label}
              </Chip>
            </View>

            {item.contactNo && (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons
                  name="phone"
                  size={wp(4.5)}
                  color="#0a411fff"
                />
                <Text style={styles.infoText}>{item.contactNo}</Text>
              </View>
            )}

            {item.address && (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons
                  name="map-marker"
                  size={wp(4.5)}
                  color="#0a411fff"
                />
                <Text style={styles.infoText} numberOfLines={1}>
                  {item.address}
                </Text>
              </View>
            )}

            {item.workDescription && (
              <Text style={styles.description} numberOfLines={2}>
                {item.workDescription}
              </Text>
            )}

            {item.noOfDaysToVisit !== undefined && item.noOfDaysToVisit > 0 && (
              <Text style={styles.visitInfo}>
                Follow-up in {item.noOfDaysToVisit} day
                {item.noOfDaysToVisit > 1 ? 's' : ''}
              </Text>
            )}

            {item.date && (
              <Text style={styles.date}>
                {new Date(item.date).toLocaleDateString('en-IN')}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </Card>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="account-off" size={wp(20)} color="#ccc" />
      <Text style={styles.emptyText}>No customers found</Text>
      <Text style={styles.emptySubtext}>
        {search ? 'Try a different search term' : 'Add your first customer'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Search Bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <TextInput
            placeholder="Search by name, phone or address..."
            value={search}
            onChangeText={setSearch}
            mode="outlined"
            style={styles.search}
            theme={{ roundness: wp(2.5) }}
            contentStyle={styles.searchContent}
            outlineColor="#ddd"
            activeOutlineColor="#0a411fff"
            left={<TextInput.Icon icon="magnify" size={wp(6)} />}
            right={
              search ? (
                <TextInput.Icon
                  icon="close"
                  size={wp(6)}
                  onPress={() => setSearch('')}
                  color="#999"
                />
              ) : null
            }
          />
          <TouchableOpacity
            onPress={() => navigation.navigate('AddCustomer')}
            style={{
              backgroundColor: '#0a411fff',
              padding: wp(2),
              borderRadius: wp(3.5),
            }}
          >
            <MaterialCommunityIcons name="plus" size={wp(6)} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Customer List */}
        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#0a411fff" />
          </View>
        ) : (
          <FlatList
            data={filteredCustomers}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={renderEmpty}
          />
        )}

        {/* FAB */}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F5F5' },
  container: { flex: 1 },
  search: {
    marginHorizontal: wp(4),
    marginTop: hp(1),
    marginBottom: hp(1),
    backgroundColor: '#fff',
    width: width * 0.8,
  },
  searchContent: { fontSize: wp(4) },
  listContent: {
    paddingHorizontal: wp(4),
    paddingBottom: hp(15),
  },
  card: {
    marginBottom: hp(2),
    backgroundColor: '#fff',
    borderRadius: wp(3),
  },
  cardContent: {
    padding: wp(4),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  name: {
    fontSize: wp(5),
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
    marginRight: wp(2),
  },
  statusChip: {
    height: hp(4),
    justifyContent: 'center',
    paddingHorizontal: wp(2.5),
  },
  statusText: {
    color: '#fff',
    fontSize: wp(3),
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(0.8),
  },
  infoText: {
    marginLeft: wp(2),
    color: '#444',
    fontSize: wp(3.8),
    flex: 1,
  },
  description: {
    fontSize: wp(3.6),
    color: '#666',
    marginTop: hp(1),
    lineHeight: wp(5),
  },
  visitInfo: {
    fontSize: wp(3.4),
    color: '#0a411fff',
    marginTop: hp(0.8),
    fontWeight: '500',
  },
  date: {
    fontSize: wp(3.2),
    color: '#999',
    marginTop: hp(0.5),
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  emptySubtext: {
    fontSize: wp(3.8),
    color: '#bbb',
    marginTop: hp(1),
    textAlign: 'center',
    paddingHorizontal: wp(10),
  },
  fab: {
    backgroundColor: '#0a411fff',
  },
});

export default CustomerList;
