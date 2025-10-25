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
import {
  Card,
  Chip,
  Button,
  Modal,
  Portal,
  FAB,
  Dialog,
  TextInput,
  IconButton,
} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import dayjs from 'dayjs';
import { rootStackParamList } from '../navigation/AppNavigation';
import { ProjectAPI } from '../service/apiService';

const { width, height } = Dimensions.get('window');

type ProjectDetailsRouteProp = RouteProp<rootStackParamList, 'ProjectDetails'>;
type ProjectDetailsNavProp = NativeStackNavigationProp<
  rootStackParamList,
  'ProjectDetails'
>;

type Project = {
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
  status: string;
  totalAmount: number;
  grandTotal: number;
  remainingAmount: number;
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

const openGoogleMaps = (
  latitude: number,
  longitude: number,
  label = 'Site',
) => {
  const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
  const latLng = `${latitude},${longitude}`;
  const url = Platform.select({
    ios: `${scheme}${label}@${latLng}`,
    android: `${scheme}${latLng}(${label})`,
  })!;
  Linking.openURL(url).catch(() => {});
};

const ProjectDetails: React.FC = () => {
  const route = useRoute<ProjectDetailsRouteProp>();
  const navigation = useNavigation<ProjectDetailsNavProp>();
  const project: Project = route.params.project;

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [open, setOpen] = useState(false);

  const formatTime = (time: string) => dayjs(time, 'HH:mm:ss').format('h:mm A');
  const formatDate = (date: string) => dayjs(date).format('DD-MM-YYYY');

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

  const displayStatus = project.siteStatus || project.status;

  const handleEdit = () => {
    navigation.navigate('AddProject', { projectToEdit: project });
  };

  const handleDelete = () => {
    Alert.alert('Delete Project', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await ProjectAPI.delete(project.id);
            console.log(res);
            navigation.goBack();
          } catch (e) {
            Alert.alert('Error', 'Failed to delete');
          }
        },
      },
    ]);
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
        {index + 1} / {project.siteImages.length}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.headerCard}>
          <View style={styles.headerRow}>
            <Text style={styles.name}>{project.customerName}</Text>
            <Chip
              style={[
                styles.statusChip,
                { backgroundColor: getStatusColor(project.status) },
              ]}
              textStyle={styles.statusText}
            >
              {displayStatus}
            </Chip>
          </View>
        </Card>

        <Card style={styles.detailsCard}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="phone"
              size={width * 0.05}
              color="#2874b8"
            />
            <Text style={styles.infoLabel}>Contact</Text>
            <Text style={styles.infoValue}>{project.customerContactNo}</Text>
          </View>

          {project.location ? (
            <TouchableOpacity
              onPress={() =>
                openGoogleMaps(
                  project?.location?.latitude || 0,
                  project?.location?.longitude || 0,
                  project?.location?.address || '',
                )
              }
            >
              <View style={styles.infoRow}>
                <MaterialCommunityIcons
                  name="map-marker"
                  size={width * 0.05}
                  color="#2874b8"
                />
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue} numberOfLines={1}>
                  {project.location.address}
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="map-marker-off"
                size={width * 0.05}
                color="#999"
              />
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>Not set</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="calendar"
              size={width * 0.05}
              color="#2874b8"
            />
            <Text style={styles.infoLabel}>Delivery</Text>
            <Text style={styles.infoValue}>
              {formatDate(project.deliveryDate)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={width * 0.05}
              color="#2874b8"
            />
            <Text style={styles.infoLabel}>Time</Text>
            <Text style={styles.infoValue}>
              {formatTime(project.customerTime)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="timer"
              size={width * 0.05}
              color="#2874b8"
            />
            <Text style={styles.infoLabel}>Days Left</Text>
            <Text
              style={[
                styles.infoValue,
                { color: project.remainingDays > 0 ? '#e67e22' : '#e74c3c' },
              ]}
            >
              {project.remainingDays > 0
                ? `${project.remainingDays} days left`
                : 'Overdue'}
            </Text>
          </View>
        </Card>

        <Card style={styles.amountCard}>
          <View style={styles.amountRow}>
            <View>
              <Text style={styles.amountLabel}>Total</Text>
              <Text style={styles.amountValue}>
                ₹{project.totalAmount.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.divider} />
            <View>
              <Text style={styles.amountLabel}>Paid</Text>
              <Text style={[styles.amountValue, { color: '#27ae60' }]}>
                ₹
                {(project.totalAmount - project.remainingAmount).toLocaleString(
                  'en-IN',
                )}
              </Text>
            </View>
            <View style={styles.divider} />
            <View>
              <Text style={styles.amountLabel}>Remaining</Text>
              <Text
                style={[
                  styles.amountValue,
                  {
                    color: project.remainingAmount > 0 ? '#e74c3c' : '#27ae60',
                  },
                ]}
              >
                ₹{project.remainingAmount.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </Card>

        {project.projectDescription ? (
          <Card style={styles.descCard}>
            <Text style={styles.descTitle}>Project Description</Text>
            <Text style={styles.descText}>{project.projectDescription}</Text>
          </Card>
        ) : null}

        {project.siteImages.length > 0 && (
          <Card style={styles.imagesCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Site Images ({project.siteImages.length})
              </Text>
              <Button
                mode="text"
                onPress={() => openImageModal(0)}
                labelStyle={styles.viewAllText}
              >
                View All
              </Button>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.imageScroll}
            >
              {project.siteImages.map((img, idx) => (
                <TouchableOpacity
                  key={img.id}
                  onPress={() => openImageModal(idx)}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: img.imageUrl }}
                    style={styles.thumbnail}
                  />
                  <View style={styles.overlay}>
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

        <Card style={styles.itemsCard}>
          <Text style={styles.sectionTitle}>
            Items ({project.projectItems.length})
          </Text>
          {project.projectItems.length === 0 ? (
            <Text style={styles.emptyText}>No items</Text>
          ) : (
            project.projectItems.map(item => (
              <View key={item.id} style={styles.itemRow}>
                <View>
                  <Text style={styles.itemName}>{item.itemName}</Text>
                  <Text style={styles.itemDetails}>
                    {item.quantity} × ₹{item.rateMrp} = ₹
                    {item.totalCost.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
            ))
          )}
        </Card>

        {project.advancePayments.length > 0 && (
          <Card style={styles.paymentsCard}>
            <Text style={styles.sectionTitle}>Advance Payments</Text>
            {project.advancePayments.map(pay => (
              <View key={pay.id} style={styles.paymentRow}>
                <View>
                  <Text style={styles.paymentAmount}>
                    ₹{pay.amount.toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.paymentDate}>
                    {formatDate(pay.paymentDate)}
                  </Text>
                </View>
                <Chip mode="outlined" textStyle={styles.chipText}>
                  {pay.paymentMode}
                </Chip>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Site Images</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={project.siteImages.map(img => img.imageUrl)}
              renderItem={renderCarouselItem}
              keyExtractor={(_, i) => i.toString()}
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

        <FAB.Group
          open={open}
          visible
          icon={open ? 'close' : 'menu'}
          onStateChange={({ open }) => setOpen(open)}
          actions={[
            { icon: 'pencil', label: 'Edit Project', onPress: handleEdit },
            { icon: 'delete', label: 'Delete Project', onPress: handleDelete },
            {
              icon: 'microphone',
              label: 'Voice',
              onPress: () => {
                navigation.navigate('RecoredAudio', { project: project });
              },
            },
          ]}
        />
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: width * 0.04, paddingBottom: height * 0.15 },
  headerCard: {
    marginBottom: height * 0.02,
    padding: width * 0.04,
    backgroundColor: '#fff',
    borderRadius: width * 0.03,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: width * 0.055,
    fontWeight: '700',
    color: '#1a1a1a',
    flex: 1,
  },
  statusChip: {
    height: height * 0.04,
    justifyContent: 'center',
    paddingHorizontal: width * 0.02,
  },
  statusText: { color: '#fff', fontSize: width * 0.032, fontWeight: '600' },
  detailsCard: {
    padding: width * 0.04,
    backgroundColor: '#fff',
    borderRadius: width * 0.03,
    elevation: 2,
    marginBottom: height * 0.02,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: height * 0.015,
    paddingBottom: height * 0.015,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    marginLeft: width * 0.03,
    width: width * 0.25,
    fontSize: width * 0.036,
    color: '#555',
    fontWeight: '500',
  },
  infoValue: { flex: 1, fontSize: width * 0.036, color: '#000' },
  amountCard: {
    padding: width * 0.04,
    backgroundColor: '#fff',
    borderRadius: width * 0.03,
    elevation: 2,
    marginBottom: height * 0.02,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: height * 0.015,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  amountLabel: { fontSize: width * 0.032, color: '#888', textAlign: 'center' },
  amountValue: {
    fontSize: width * 0.038,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginTop: 2,
  },
  divider: {
    width: 1,
    backgroundColor: '#ddd',
    marginHorizontal: width * 0.02,
  },
  descCard: {
    padding: width * 0.04,
    backgroundColor: '#fff',
    borderRadius: width * 0.03,
    elevation: 2,
    marginBottom: height * 0.02,
  },
  descTitle: {
    fontSize: width * 0.04,
    fontWeight: '600',
    color: '#333',
    marginBottom: height * 0.01,
  },
  descText: {
    fontSize: width * 0.036,
    color: '#555',
    lineHeight: width * 0.05,
  },
  imagesCard: {
    padding: width * 0.04,
    backgroundColor: '#fff',
    borderRadius: width * 0.03,
    elevation: 2,
    marginBottom: height * 0.02,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: height * 0.015,
  },
  sectionTitle: { fontSize: width * 0.042, fontWeight: '600', color: '#333' },
  viewAllText: { fontSize: width * 0.032, color: '#2874b8', fontWeight: '600' },
  imageScroll: { marginTop: height * 0.01 },
  thumbnail: {
    width: width * 0.28,
    height: width * 0.28,
    borderRadius: width * 0.02,
    marginRight: width * 0.03,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: width * 0.03,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: width * 0.02,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemsCard: {
    padding: width * 0.04,
    backgroundColor: '#fff',
    borderRadius: width * 0.03,
    elevation: 2,
    marginBottom: height * 0.02,
  },
  itemRow: {
    paddingVertical: height * 0.015,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemName: { fontWeight: '600', fontSize: width * 0.038 },
  itemDetails: { color: '#666', fontSize: width * 0.034, marginTop: 2 },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    marginVertical: height * 0.02,
  },
  paymentsCard: {
    padding: width * 0.04,
    backgroundColor: '#fff',
    borderRadius: width * 0.03,
    elevation: 2,
    marginBottom: height * 0.02,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: height * 0.015,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  paymentAmount: { fontWeight: '600', fontSize: width * 0.038 },
  paymentDate: { color: '#666', fontSize: width * 0.032 },
  chipText: { fontSize: width * 0.03 },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' },
  modalContent: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: width * 0.05,
    paddingVertical: height * 0.02,
    backgroundColor: 'rgba(40,116,184,0.9)',
  },
  modalTitle: { fontSize: width * 0.045, fontWeight: '700', color: '#fff' },
  carouselItem: { width, justifyContent: 'center', alignItems: 'center' },
  carouselImage: { width: width * 0.9, height: height * 0.7 },
  imageCounter: {
    position: 'absolute',
    bottom: height * 0.05,
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: '#fff',
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.01,
    borderRadius: 20,
    fontSize: width * 0.035,
    fontWeight: '600',
  },
});

export default ProjectDetails;
