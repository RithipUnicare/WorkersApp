// screens/ProjectList.tsx (updated with responsive design using width * and height *)
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Card, TextInput, Chip } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { rootStackParamList } from '../navigation/AppNavigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

const { width, height } = Dimensions.get('window');

export type Project = {
  customerName: string;
  contactNumber: string;
  location: string;
  deliveryDate: string; // DD-MM-YYYY
  customerTime: string;
  siteStatus: 'In Progress' | 'Material Pending' | 'Completed';
  images: string[]; // array of image URIs
};

type Props = {
  navigation: NativeStackNavigationProp<rootStackParamList, 'ProjectList'>;
};

const ProjectList: React.FC<Props> = ({ navigation }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    navigation.addListener('focus', () => {
      loadProjects();
    });
  }, []);

  const loadProjects = async () => {
    try {
      const stored = await AsyncStorage.getItem('projects');
      if (stored) {
        setProjects(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredProjects = projects.filter(
    p =>
      p.customerName.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase()),
  );

  const calculateDaysLeft = (deliveryDate: string) => {
    const [dd, mm, yyyy] = deliveryDate.split('-').map(Number);
    const delivery = new Date(yyyy, mm - 1, dd);
    const today = new Date();
    const diffTime = delivery.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 0) {
      return `${diffDays} days left`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else {
      return `Overdue by ${Math.abs(diffDays)} days`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Progress':
        return '#4CAF50'; // green
      case 'Material Pending':
        return '#FFC107'; // orange
      case 'Completed':
        return '#2196F3'; // blue
      default:
        return '#9E9E9E';
    }
  };

  const renderItem = ({ item }: { item: Project }) => (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.name}>{item.customerName}</Text>
        <Chip
          style={[
            styles.statusChip,
            { backgroundColor: getStatusColor(item.siteStatus) },
          ]}
          textStyle={styles.statusText}
        >
          {item.siteStatus}
        </Chip>
      </View>
      <View style={styles.infoRow}>
        <MaterialCommunityIcons
          name="map-marker"
          size={width * 0.04}
          color="#2874b8"
        />
        <Text style={styles.infoText}>{item.location}</Text>
      </View>
      <View style={styles.infoRow}>
        <MaterialCommunityIcons
          name="phone"
          size={width * 0.04}
          color="#2874b8"
        />
        <Text style={styles.infoText}>{item.contactNumber}</Text>
      </View>
      <View style={styles.infoRow}>
        <MaterialCommunityIcons
          name="calendar"
          size={width * 0.04}
          color="#2874b8"
        />
        <Text style={styles.infoText}>Delivery: {item.deliveryDate}</Text>
        <Text style={styles.daysLeft}>
          {calculateDaysLeft(item.deliveryDate)}
        </Text>
      </View>
      <View style={styles.infoRow}>
        <MaterialCommunityIcons
          name="clock"
          size={width * 0.04}
          color="#2874b8"
        />
        <Text style={styles.infoText}>Working Hours: {item.customerTime}</Text>
      </View>
      {/* Optionally show thumbnails */}
      {item.images.length > 0 && (
        <View style={styles.imagePreview}>
          {item.images.slice(0, 3).map((uri, index) => (
            <Image key={index} source={{ uri }} style={styles.thumbnail} />
          ))}
        </View>
      )}
    </Card>
  );

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Search projects..."
        value={search}
        onChangeText={setSearch}
        mode="outlined"
        style={styles.search}
      />
      <FlatList
        data={filteredProjects}
        renderItem={renderItem}
        keyExtractor={(_, index) => index.toString()}
        showsVerticalScrollIndicator={false}
      />
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddProject')}
      >
        <MaterialCommunityIcons name="plus" size={width * 0.06} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: width * 0.04 },
  search: { marginBottom: height * 0.02 },
  card: {
    marginBottom: height * 0.03,
    padding: width * 0.04,
    backgroundColor: '#fff',
    borderRadius: width * 0.02,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: height * 0.02,
  },
  imagePreview: { flexDirection: 'row', marginTop: height * 0.02 },
  thumbnail: {
    width: width * 0.1,
    height: width * 0.1,
    borderRadius: width * 0.01,
    marginRight: width * 0.01,
  },
  name: {
    fontSize: width * 0.045,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  statusChip: {
    height: height * 0.04,
    justifyContent: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: width * 0.03,
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: height * 0.01,
  },
  infoText: {
    marginLeft: width * 0.02,
    color: '#333',
    fontSize: width * 0.035,
  },
  daysLeft: {
    marginLeft: 'auto',
    color: '#888',
    fontSize: width * 0.03,
  },
  addButton: {
    position: 'absolute',
    bottom: height * 0.06,
    right: width * 0.06,
    backgroundColor: '#2874b8',
    borderRadius: width * 0.07,
    width: width * 0.14,
    height: width * 0.14,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
});

export default ProjectList;
