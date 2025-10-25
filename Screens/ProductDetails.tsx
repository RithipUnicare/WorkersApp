// screens/ProjectDetails.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
  Platform,
  FlatList,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Card, Chip, Button, Modal, Portal } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import dayjs from 'dayjs';
import { rootStackParamList } from '../navigation/AppNavigation';
import { Project } from './AdminProductList';

const { width, height } = Dimensions.get('window');

type ProjectDetailsRouteProp = RouteProp<rootStackParamList, 'ProjectDetails'>;
type ProjectDetailsNavProp = NativeStackNavigationProp<
  rootStackParamList,
  'ProjectDetails'
>;
const openGoogleMaps = (
  latitude: number,
  longitude: number,
  label = 'Location',
) => {
  const scheme = Platform.select({
    ios: 'maps:0,0?q=', // For iOS, uses Apple Maps by default but can be configured for Google Maps
    android: 'geo:0,0?q=', // For Android, uses default map app (often Google Maps)
  });

  const latLng = `${latitude},${longitude}`;
  const url: string = Platform.select({
    ios: `${scheme}${label}@${latLng}`,
    android: `${scheme}${latLng}(${label})`,
  })!;

  Linking.openURL(url).catch(err => console.error('An error occurred', err));
};
const ProjectDetails: React.FC = () => {
  const route = useRoute<ProjectDetailsRouteProp>();
  const navigation = useNavigation<ProjectDetailsNavProp>();
  const project: Project = route.params.project;

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const calculateDaysLeft = (deliveryDate: string) => {
    const [dd, mm, yyyy] = deliveryDate.split('-').map(Number);
    const delivery = new Date(yyyy, mm - 1, dd);
    const today = new Date();
    const diffTime = delivery.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) return `${diffDays} days left`;
    if (diffDays === 0) return 'Due today';
    return `Overdue by ${Math.abs(diffDays)} days`;
  };

  useEffect(() => {
    navigation.addListener('focus', () => {
      // Any additional actions on focus can be added here
    });
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Progress':
        return '#4CAF50';
      case 'Material Pending':
        return '#FFC107';
      case 'Completed':
        return '#2196F3';
      default:
        return '#9E9E9E';
    }
  };

  const handleEdit = () => {
    navigation.navigate('AddProject', { projectToEdit: project });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Project',
      'Are you sure you want to delete this project?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const stored = await AsyncStorage.getItem('projects');
              if (stored) {
                const projects: Project[] = JSON.parse(stored);
                const updated = projects.filter(
                  p =>
                    p.customerName !== project.customerName ||
                    p.contactNumber !== project.contactNumber ||
                    p.deliveryDate !== project.deliveryDate,
                );
                await AsyncStorage.setItem('projects', JSON.stringify(updated));
                navigation.goBack();
              }
            } catch (e) {
              console.error(e);
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  const openImageModal = (index: number) => {
    setSelectedImageIndex(index);
    setModalVisible(true);
  };

  const renderCarouselItem = ({
    item,
    index,
  }: {
    item: string;
    index: number;
  }) => (
    <View style={styles.carouselItem}>
      <Image
        source={{ uri: item }}
        style={styles.carouselImage}
        resizeMode="contain"
      />
      <Text style={styles.imageCounter}>
        {index + 1} / {project.images.length}
      </Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Card */}
      <Card style={styles.headerCard}>
        <View style={styles.headerRow}>
          <Text style={styles.name}>{project.customerName}</Text>
          <Chip
            style={[
              styles.statusChip,
              { backgroundColor: getStatusColor(project.siteStatus) },
            ]}
            textStyle={styles.statusText}
          >
            {project.siteStatus}
          </Chip>
        </View>
      </Card>

      {/* Details */}
      <Card style={styles.detailsCard}>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="phone" size={20} color="#2874b8" />
          <Text style={styles.infoLabel}>Contact</Text>
          <Text style={styles.infoValue}>{project.contactNumber}</Text>
        </View>
        <TouchableOpacity
          onPress={async () => {
            await openGoogleMaps(project.latitude, project.longitude);
          }}
        >
          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="map-marker"
              size={20}
              color="#2874b8"
            />
            <Text style={styles.infoLabel}>Location</Text>
            <Text style={styles.infoValue}>{project.location}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="calendar" size={20} color="#2874b8" />
          <Text style={styles.infoLabel}>Delivery Date</Text>
          <Text style={styles.infoValue}>{project.deliveryDate}</Text>
        </View>

        <View style={styles.infoRow}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={20}
            color="#2874b8"
          />
          <Text style={styles.infoLabel}>Working Hours</Text>
          <Text style={styles.infoValue}>{project.customerTime}</Text>
        </View>

        <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
          <MaterialCommunityIcons name="timer" size={20} color="#2874b8" />
          <Text style={styles.infoLabel}>Status</Text>
          <Text
            style={[styles.infoValue, { color: '#d32f2f', fontWeight: '600' }]}
          >
            {calculateDaysLeft(project.deliveryDate)}
          </Text>
        </View>
      </Card>

      {/* Images */}
      {project.images.length > 0 && (
        <Card style={styles.imagesCard}>
          <View style={styles.imageHeader}>
            <Text style={styles.sectionTitle}>
              Site Images ({project.images.length})
            </Text>
            <Button
              mode="text"
              onPress={() => openImageModal(0)}
              labelStyle={styles.viewAllText}
              icon="image-multiple"
            >
              View All
            </Button>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.imageScroll}
          >
            {project.images.map((uri, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => openImageModal(idx)}
                activeOpacity={0.8}
              >
                <Image source={{ uri }} style={styles.thumbnailImage} />
                <View style={styles.imageOverlay}>
                  <MaterialCommunityIcons
                    name="magnify-plus"
                    size={24}
                    color="#fff"
                  />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Card>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        <Button
          mode="contained"
          onPress={handleEdit}
          style={styles.editButton}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
          icon="pencil"
        >
          Edit Project
        </Button>
        <Button
          mode="outlined"
          onPress={handleDelete}
          style={styles.deleteButton}
          contentStyle={styles.buttonContent}
          labelStyle={[styles.buttonLabel, { color: '#d32f2f' }]}
          icon="delete"
        >
          Delete
        </Button>
      </View>

      {/* Image Carousel Modal */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Site Images</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <MaterialCommunityIcons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={project.images}
              renderItem={renderCarouselItem}
              keyExtractor={(_, index) => index.toString()}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              initialScrollIndex={selectedImageIndex}
              getItemLayout={(data, index) => ({
                length: width,
                offset: width * index,
                index,
              })}
            />
          </View>
        </Modal>
      </Portal>
    </ScrollView>
  );
};

/* -------------------------- Styles -------------------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },

  headerCard: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    flex: 1,
  },
  statusChip: {
    height: 32,
    justifyContent: 'center',
    marginLeft: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  detailsCard: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    marginLeft: 12,
    width: 110,
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: '#000',
  },

  imagesCard: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  imageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  viewAllText: {
    fontSize: 13,
    color: '#2874b8',
    fontWeight: '600',
  },

  imageScroll: {
    marginTop: 8,
  },
  thumbnailImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginRight: 12,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 12,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 12,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#2874b8',
    borderRadius: 8,
  },
  deleteButton: {
    flex: 1,
    borderColor: '#d32f2f',
    borderWidth: 1.5,
    borderRadius: 8,
  },
  buttonContent: {
    height: 48,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(40, 116, 184, 0.9)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  carouselItem: {
    width: width,
    height: height - 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselImage: {
    width: width - 32,
    height: height - 150,
  },
  imageCounter: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ProjectDetails;
