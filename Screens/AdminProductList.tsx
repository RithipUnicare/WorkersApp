// screens/ProjectList.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Card, TextInput, Chip } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { rootStackParamList } from '../navigation/AppNavigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProjectAPI } from '../service/apiService';
import dayjs from 'dayjs';

const { width, height } = Dimensions.get('window');

export type Project = {
  id: number;
  customerId: number;
  customerName: string;
  customerContactNo: string;
  customerAddress: string;
  deliveryDate: string;
  remainingDays: number;
  projectDescription: string;
  customerTime: string;
  siteStatus: string;
  totalAmount: number;
  grandTotal: number;
  remainingAmount: number;
  status: string;
  location: {
    id: number;
    address: string;
    latitude: number;
    longitude: number;
  } | null;
  siteImages: { id: number; imageUrl: string }[];
  projectItems: {
    id: number;
    itemName: string;
    quantity: number;
    rateMrp: number;
    totalCost: number;
  }[];
  advancePayments: {
    id: number;
    amount: number;
    paymentDate: string;
    paymentMode: string;
  }[];
};

type Props = {
  navigation: NativeStackNavigationProp<rootStackParamList, 'ProjectList'>;
};

const ProjectList: React.FC<Props> = ({ navigation }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadProjects);
    loadProjects();
    return unsubscribe;
  }, [navigation]);

  const loadProjects = async () => {
    try {
      const res = await ProjectAPI.getAll();
      if (res.success && Array.isArray(res.data)) {
        setProjects(res.data);
      }
    } catch (e) {}
  };

  const filteredProjects = projects.filter(
    p =>
      p.customerName.toLowerCase().includes(search.toLowerCase()) ||
      (p.location?.address || '').toLowerCase().includes(search.toLowerCase()),
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return '#4CAF50';
      case 'CREATED':
        return '#FFC107';
      case 'COMPLETED':
        return '#2196F3';
      default:
        return '#9E9E9E';
    }
  };

  const formatTime = (time: string) => {
    return dayjs(time, 'HH:mm:ss').format('h:mm A');
  };

  const renderItem = ({ item }: { item: Project }) => (
    console.log(item),
    (
      <Card style={styles.card}>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('ProjectDetails', { project: item })
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
              {item.siteStatus || item.status}
            </Chip>
          </View>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="map-marker"
              size={width * 0.04}
              color="#2874b8"
            />
            <Text style={styles.infoText} numberOfLines={1}>
              {item.location?.address || 'No location'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="phone"
              size={width * 0.04}
              color="#2874b8"
            />
            <Text style={styles.infoText}>{item.customerContactNo}</Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="calendar"
              size={width * 0.04}
              color="#2874b8"
            />
            <Text style={styles.infoText}>
              Delivery: {dayjs(item.deliveryDate).format('DD-MM-YYYY')}
            </Text>
            <Text style={styles.daysLeft}>
              {item.remainingDays > 0
                ? `${item.remainingDays} days left`
                : 'Overdue'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="clock"
              size={width * 0.04}
              color="#2874b8"
            />
            <Text style={styles.infoText}>
              Time: {formatTime(item.customerTime)}
            </Text>
          </View>

          <View style={styles.amountRow}>
            <View>
              <Text style={styles.amountLabel}>Total</Text>
              <Text style={styles.amountValue}>
                ₹{item.totalAmount.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.amountDivider} />
            <View>
              <Text style={styles.amountLabel}>Paid</Text>
              <Text style={[styles.amountValue, { color: '#27ae60' }]}>
                ₹
                {(item.totalAmount - item.remainingAmount).toLocaleString(
                  'en-IN',
                )}
              </Text>
            </View>
            <View style={styles.amountDivider} />
            <View>
              <Text style={styles.amountLabel}>Remaining</Text>
              <Text
                style={[
                  styles.amountValue,
                  { color: item.remainingAmount > 0 ? '#e74c3c' : '#27ae60' },
                ]}
              >
                ₹{item.remainingAmount.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>

          {item.siteImages.length > 0 && (
            <View style={styles.imagePreview}>
              {item.siteImages.slice(0, 4).map(img => (
                <Image
                  key={img.id}
                  source={{ uri: img.imageUrl }}
                  style={styles.thumbnail}
                />
              ))}
              {item.siteImages.length > 4 && (
                <View style={styles.moreImages}>
                  <Text style={styles.moreText}>
                    +{item.siteImages.length - 4}
                  </Text>
                </View>
              )}
            </View>
          )}
        </TouchableOpacity>
      </Card>
    )
  );

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Search by name or location..."
        value={search}
        onChangeText={setSearch}
        mode="outlined"
        style={styles.search}
        left={<TextInput.Icon icon="magnify" />}
      />
      <FlatList
        data={filteredProjects}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: height * 0.1 }}
      />
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddProject')}
      >
        <MaterialCommunityIcons name="plus" size={width * 0.07} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: width * 0.04 },
  search: { marginBottom: height * 0.02 },
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
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: height * 0.008,
  },
  infoText: {
    marginLeft: width * 0.02,
    color: '#333',
    fontSize: width * 0.036,
    flex: 1,
  },
  daysLeft: {
    marginLeft: 'auto',
    color: '#e67e22',
    fontSize: width * 0.032,
    fontWeight: '500',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: height * 0.015,
    paddingTop: height * 0.015,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  amountLabel: {
    fontSize: width * 0.032,
    color: '#888',
    textAlign: 'center',
  },
  amountValue: {
    fontSize: width * 0.038,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginTop: 2,
  },
  amountDivider: {
    width: 1,
    backgroundColor: '#ddd',
    marginHorizontal: width * 0.02,
  },
  imagePreview: {
    flexDirection: 'row',
    marginTop: height * 0.015,
    flexWrap: 'wrap',
  },
  thumbnail: {
    width: width * 0.16,
    height: width * 0.16,
    borderRadius: width * 0.02,
    marginRight: width * 0.015,
    marginBottom: height * 0.008,
  },
  moreImages: {
    width: width * 0.16,
    height: width * 0.16,
    borderRadius: width * 0.02,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: width * 0.015,
    marginBottom: height * 0.008,
  },
  moreText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: width * 0.04,
  },
  addButton: {
    position: 'absolute',
    bottom: height * 0.06,
    right: width * 0.06,
    backgroundColor: '#2874b8',
    borderRadius: width * 0.08,
    width: width * 0.16,
    height: width * 0.16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },
});

export default ProjectList;
