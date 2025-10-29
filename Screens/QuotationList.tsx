// screens/QuotationList.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Card, TextInput, Chip, Button } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { rootStackParamList } from '../navigation/AppNavigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import dayjs from 'dayjs';
import { QuotationAPI } from '../service/apiService'; // Replace with your actual API

const { width, height } = Dimensions.get('window');

export type Quotation = {
  id: number;
  customerName: string;
  customerContactNo: string;
  address: string;
  projectDescription: string;
  deliveryDate: string;
  budget: number;
  status: string;
  items: {
    id: number;
    name: string;
    qty: number;
    unit: string;
    mrp: number;
    tax: number;
    amount: number;
  }[];
};

type Props = {
  navigation: NativeStackNavigationProp<rootStackParamList, 'QuotationList'>;
};

const QuotationList: React.FC<Props> = ({ navigation }) => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadQuotations);
    loadQuotations();
    return unsubscribe;
  }, [navigation]);

  const loadQuotations = async () => {
    try {
      setRefreshing(true);
      const res = await QuotationAPI.getAll();
      console.log(res);
      if (res.success && Array.isArray(res.data)) {
        setQuotations(res.data);
      }
    } catch (e) {
      console.error('Failed to load quotations', e);
    } finally {
      setRefreshing(false);
    }
  };

  const filteredQuotations = quotations.filter(
    q =>
      q.customerName.toLowerCase().includes(search.toLowerCase()) ||
      q.customerContactNo.includes(search) ||
      q.projectDescription.toLowerCase().includes(search.toLowerCase()),
  );

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return '#FFC107';
      case 'APPROVED':
        return '#4CAF50';
      case 'REJECTED':
        return '#e74c3c';
      case 'DRAFT':
        return '#9E9E9E';
      default:
        return '#2874b8';
    }
  };

  const renderItem = ({ item }: { item: Quotation }) => (
    <Card style={styles.card}>
      <TouchableOpacity
        onPress={() =>
          navigation.navigate('QuotationDetails', { quotation: item })
        }
      >
        <View style={styles.cardHeader}>
          <Text style={styles.name}>{item.customerName}</Text>
          <Chip
            style={[
              styles.statusChip,
              { backgroundColor: getStatusColor(item.status) },
            ]}
            textStyle={styles.statusText}
          >
            {item.status || 'DRAFT'}
          </Chip>
        </View>

        <View style={styles.infoRow}>
          <MaterialCommunityIcons
            name="phone"
            size={width * 0.045}
            color="#2874b8"
          />
          <Text style={styles.infoText}>{item.customerContactNo}</Text>
        </View>

        <View style={styles.infoRow}>
          <MaterialCommunityIcons
            name="map-marker"
            size={width * 0.045}
            color="#2874b8"
          />
          <Text style={styles.infoText} numberOfLines={1}>
            {item.address || 'No address'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <MaterialCommunityIcons
            name="calendar"
            size={width * 0.045}
            color="#2874b8"
          />
          <Text style={styles.infoText}>
            Delivery: {dayjs(item.deliveryDate).format('DD-MM-YYYY')}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <MaterialCommunityIcons
            name="text-box"
            size={width * 0.045}
            color="#2874b8"
          />
          <Text style={styles.infoText} numberOfLines={2}>
            {item.projectDescription}
          </Text>
        </View>

        <View style={styles.amountRow}>
          <View>
            <Text style={styles.amountLabel}>Budget</Text>
            <Text style={styles.amountValue}>
              ₹{item.budget.toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.itemCount}>
            <Text style={styles.itemCountText}>
              {item.items?.length || 0} items
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Card>
  );

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Search by name, mobile, or description..."
        value={search}
        onChangeText={setSearch}
        mode="outlined"
        style={styles.search}
        left={<TextInput.Icon icon="magnify" />}
      />

      <FlatList
        data={filteredQuotations}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadQuotations} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="file-document-outline"
              size={64}
              color="#ccc"
            />
            <Text style={styles.emptyText}>No quotations found</Text>
          </View>
        }
      />

      {/* Add Quotation Button - Fixed at Bottom */}
      <View style={styles.addButtonContainer}>
        <Button
          mode="contained"
          icon="plus"
          onPress={() => navigation.navigate('AddQuotation')}
          style={styles.addButton}
          contentStyle={styles.addButtonContent}
          labelStyle={styles.addButtonLabel}
          buttonColor="#2874b8"
        >
          Add Quotation
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: width * 0.04,
  },
  search: {
    marginTop: height * 0.02,
    marginBottom: height * 0.015,
  },
  listContent: {
    paddingBottom: height * 0.12,
  },
  card: {
    marginBottom: height * 0.025,
    padding: width * 0.04,
    backgroundColor: '#fff',
    borderRadius: width * 0.03,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: height * 0.015,
  },
  name: {
    fontSize: width * 0.048,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  statusChip: {
    height: height * 0.038,
    justifyContent: 'center',
    paddingHorizontal: width * 0.02,
  },
  statusText: {
    color: '#fff',
    fontSize: width * 0.032,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: height * 0.01,
  },
  infoText: {
    marginLeft: width * 0.02,
    color: '#333',
    fontSize: width * 0.036,
    flex: 1,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: height * 0.015,
    paddingTop: height * 0.015,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  amountLabel: {
    fontSize: width * 0.032,
    color: '#888',
    textAlign: 'left',
  },
  amountValue: {
    fontSize: width * 0.042,
    fontWeight: 'bold',
    color: '#2874b8',
    textAlign: 'left',
  },
  itemCount: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  itemCountText: {
    color: '#2874b8',
    fontSize: width * 0.032,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: height * 0.2,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
  },
  addButtonContainer: {
    position: 'absolute',
    bottom: 20,
    left: width * 0.04,
    right: width * 0.04,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  addButton: {
    borderRadius: 12,
    paddingVertical: 6,
  },
  addButtonContent: {
    height: 56,
  },
  addButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default QuotationList;
