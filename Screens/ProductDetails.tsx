import React, { useState, useEffect, useCallback } from 'react';
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
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Card,
  Chip,
  Button,
  Modal,
  Portal,
  IconButton,
} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import dayjs from 'dayjs';
import { rootStackParamList } from '../navigation/AppNavigation';
import { ProjectAPI } from '../service/apiService';
import Sound, { PlayBackType } from 'react-native-nitro-sound';

const { width, height } = Dimensions.get('window');

// Responsive helpers
const wp = (percentage: number) => (width * percentage) / 100;
const hp = (percentage: number) => (height * percentage) / 100;

type ProjectDetailsRouteProp = RouteProp<rootStackParamList, 'ProjectDetails'>;
type ProjectDetailsNavProp = NativeStackNavigationProp<
  rootStackParamList,
  'ProjectDetails'
>;

type VoiceRecording = {
  id: number;
  projectId: number;
  name: string;
  url: string;
  createdAt: string;
};

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
    paymentMode?: string;
  }[];
  voiceRecordings?: VoiceRecording[];
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
  const initialProject: Project = route.params.project;
  const [project, setProject] = useState<Project>(initialProject);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playTime, setPlayTime] = useState('00:00:00');
  const [duration, setDuration] = useState('00:00:00');
  const [currentUrl, setCurrentUrl] = useState<string>('');

  const formatTime = (time: string) => dayjs(time, 'HH:mm:ss').format('h:mm A');
  const formatDate = (date: string) => dayjs(date).format('DD-MM-YYYY');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await ProjectAPI.getById(initialProject.id);
      if (res?.data) setProject(res.data);
    } catch (e) {
      console.error('Failed to refresh project', e);
    } finally {
      setRefreshing(false);
    }
  }, [initialProject.id]);

  // Reload project on focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      try {
        const res = await ProjectAPI.getById(initialProject.id);
        if (res?.data) setProject(res.data);
      } catch (e) {
        console.error('Failed to reload project', e);
      }
    });
    return unsubscribe;
  }, [navigation, initialProject.id]);

  // Audio listeners setup once
  useEffect(() => {
    const playbackListener = Sound.addPlayBackListener((e: PlayBackType) => {
      setPlayTime(Sound.mmssss(Math.floor(e.currentPosition)));
      if (e.duration > 0) {
        setDuration(Sound.mmssss(Math.floor(e.duration)));
      }
    });

    const endListener = Sound.addPlaybackEndListener(() => {
      setIsPlaying(false);
      setPlayTime('00:00:00');
      setCurrentUrl('');
    });

    return () => {
      playbackListener?.remove();
      endListener?.remove();
    };
  }, []);

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

  const togglePlayback = useCallback(
    async (recordingUrl: string) => {
      if (!recordingUrl) return;

      try {
        if (isPlaying && currentUrl === recordingUrl) {
          await Sound.stopPlayer();
          setIsPlaying(false);
        } else {
          await Sound.startPlayer(recordingUrl);
          setIsPlaying(true);
          setCurrentUrl(recordingUrl);
          setPlayTime('00:00:00');
          setDuration('00:00:00');
        }
      } catch (err) {
        Alert.alert('Playback Error', 'Could not play audio');
      }
    },
    [isPlaying, currentUrl],
  );

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
            console.log(project.id);
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

  const handleRecordVoice = () => {
    navigation.navigate('RecoredAudio', { project });
  };

  const handleAddPayment = () => {
    navigation.navigate('PaymentPage', { project });
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

  const parseTime = (time: string): number => {
    const [m, s] = time.split(':').map(Number);
    return m * 60 + s;
  };

  const sortedVoiceRecordings = project.voiceRecordings
    ? project.voiceRecordings
        .slice()
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
    : [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Header */}
          <Card style={styles.headerCard}>
            <View style={styles.headerRow}>
              <Text style={styles.name} numberOfLines={1}>
                {project.customerName}
              </Text>
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

          {/* Details */}
          <Card style={styles.detailsCard}>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="phone"
                size={wp(5)}
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
                activeOpacity={0.8}
              >
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons
                    name="map-marker"
                    size={wp(5)}
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
                  size={wp(5)}
                  color="#999"
                />
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>Not set</Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="calendar"
                size={wp(5)}
                color="#2874b8"
              />
              <Text style={styles.infoLabel}>Delivery</Text>
              <Text style={styles.infoValue}>
                {formatDate(project.deliveryDate)}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="timer"
                size={wp(5)}
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

          {/* Amount */}
          <Card style={styles.amountCard}>
            <View style={styles.amountRow}>
              <View style={styles.amountBlock}>
                <Text style={styles.amountLabel}>Total</Text>
                <Text style={styles.amountValue}>
                  ₹{project.grandTotal.toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.amountBlock}>
                <Text style={styles.amountLabel}>Paid</Text>
                <Text style={[styles.amountValue, { color: '#27ae60' }]}>
                  ₹
                  {(
                    project.grandTotal - project.remainingAmount
                  ).toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.amountBlock}>
                <Text style={styles.amountLabel}>Remaining</Text>
                <Text
                  style={[
                    styles.amountValue,
                    {
                      color:
                        project.remainingAmount > 0 ? '#e74c3c' : '#27ae60',
                    },
                  ]}
                >
                  ₹{project.remainingAmount.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
          </Card>

          {/* Description */}
          {project.projectDescription ? (
            <Card style={styles.descCard}>
              <Text style={styles.descTitle}>Project Description</Text>
              <Text style={styles.descText}>{project.projectDescription}</Text>
            </Card>
          ) : null}

          {/* Site Images */}
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
                    style={styles.thumbnailWrapper}
                  >
                    <Image
                      source={{ uri: img.imageUrl }}
                      style={styles.thumbnail}
                    />
                    <View style={styles.overlay}>
                      <MaterialCommunityIcons
                        name="magnify-plus"
                        size={wp(6)}
                        color="#fff"
                      />
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Card>
          )}

          {/* Items */}
          <Card style={styles.itemsCard}>
            <Text style={styles.sectionTitle}>
              Items ({project.projectItems.length})
            </Text>
            {project.projectItems.length === 0 ? (
              <Text style={styles.emptyText}>No items</Text>
            ) : (
              project.projectItems.map(item => (
                <View key={item.id} style={styles.itemRow}>
                  <Text style={styles.itemName}>{item.itemName}</Text>
                  <Text style={styles.itemDetails}>
                    {item.quantity} × ₹{item.rateMrp} = ₹
                    {item.totalCost.toLocaleString('en-IN')}
                  </Text>
                </View>
              ))
            )}
          </Card>

          {/* Payments */}
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
                    {pay.paymentMode || 'Cash'}
                  </Chip>
                </View>
              ))}
            </Card>
          )}

          {/* Voice Recordings */}
          {sortedVoiceRecordings.length > 0 && (
            <Card style={styles.voiceCard}>
              <View style={styles.voiceHeader}>
                <MaterialCommunityIcons
                  name="microphone"
                  size={wp(6)}
                  color="#2874b8"
                />
                <Text style={styles.voiceTitle}>
                  Voice Recordings ({sortedVoiceRecordings.length})
                </Text>
              </View>
              {sortedVoiceRecordings.map(recording => (
                <View key={recording.id} style={styles.recordingItem}>
                  <View style={styles.recordingHeader}>
                    <IconButton
                      icon={
                        isPlaying && currentUrl === recording.url
                          ? 'pause'
                          : 'play'
                      }
                      size={wp(7)}
                      onPress={() => togglePlayback(recording.url)}
                      style={styles.playButton}
                    />
                    <View style={styles.recordingInfo}>
                      <Text style={styles.recordingName} numberOfLines={1}>
                        {recording.name}
                      </Text>
                      <Text style={styles.recordingDate}>
                        {dayjs(recording.createdAt).format('DD-MM-YYYY HH:mm')}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => Linking.openURL(recording.url)}
                      style={styles.downloadLink}
                    >
                      <MaterialCommunityIcons
                        name="download"
                        size={wp(5)}
                        color="#2874b8"
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        Alert.alert(
                          'Delete Voice Recording',
                          'Are you sure you want to delete this voice recording?',
                          [
                            {
                              text: 'Cancel',
                              onPress: () => console.log('Cancel Pressed'),
                              style: 'cancel',
                            },
                            {
                              text: 'Delete',
                              onPress: async () => {
                                const deleteVoiceRecording =
                                  await ProjectAPI.deleteVoiceRecording(
                                    project.id,
                                    recording.id,
                                  );
                                setRefreshing(true);
                                onRefresh();
                                setRefreshing(false);
                              },
                            },
                          ],
                        );
                      }}
                      style={{ marginLeft: wp(2) }}
                    >
                      <MaterialCommunityIcons
                        name="delete"
                        size={wp(5)}
                        color="#d80000ff"
                      />
                    </TouchableOpacity>
                  </View>
                  {isPlaying && currentUrl === recording.url && (
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width:
                                duration !== '00:00:00' &&
                                playTime !== '00:00:00'
                                  ? `${
                                      (parseTime(playTime) /
                                        parseTime(duration)) *
                                      100
                                    }%`
                                  : '0%',
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.timeText}>
                        {playTime} / {duration}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </Card>
          )}

          <View style={{ height: hp(10) }} />
        </ScrollView>

        {/* Bottom Action Buttons */}
        <View style={styles.bottomBar}>
          <IconButton
            icon="pencil"
            size={wp(7)}
            onPress={handleEdit}
            iconColor="#2874b8"
            style={styles.actionButton}
          />
          <IconButton
            icon="delete"
            size={wp(7)}
            onPress={handleDelete}
            iconColor="#e74c3c"
            style={styles.actionButton}
          />
          <IconButton
            icon="microphone"
            size={wp(7)}
            onPress={handleRecordVoice}
            iconColor="#4CAF50"
            style={styles.actionButton}
          />
          <IconButton
            icon="cash"
            size={wp(7)}
            onPress={handleAddPayment}
            iconColor="#27ae60"
            style={styles.actionButton}
          />
        </View>

        {/* Image Modal */}
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
                  <MaterialCommunityIcons
                    name="close"
                    size={wp(7)}
                    color="#fff"
                  />
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
                getItemLayout={(_, index) => ({
                  length: width,
                  offset: width * index,
                  index,
                })}
              />
            </View>
          </Modal>
        </Portal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F5F5' },
  container: { flex: 1 },
  content: {
    paddingHorizontal: wp(4),
    paddingBottom: hp(15),
  },
  headerCard: {
    marginBottom: hp(2),
    padding: wp(4),
    backgroundColor: '#fff',
    borderRadius: wp(3),
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: wp(5.5),
    fontWeight: '700',
    color: '#1a1a1a',
    flex: 1,
    marginRight: wp(2),
  },
  statusChip: {
    height: hp(4.5),
    justifyContent: 'center',
    paddingHorizontal: wp(2.5),
  },
  statusText: {
    color: '#fff',
    fontSize: wp(3.2),
    fontWeight: '600',
  },
  detailsCard: {
    padding: wp(4),
    backgroundColor: '#fff',
    borderRadius: wp(3),
    elevation: 3,
    marginBottom: hp(2),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1.8),
    paddingBottom: hp(1.8),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    marginLeft: wp(3),
    width: wp(25),
    fontSize: wp(3.8),
    color: '#555',
    fontWeight: '500',
  },
  infoValue: {
    flex: 1,
    fontSize: wp(3.8),
    color: '#000',
  },
  amountCard: {
    padding: wp(4),
    backgroundColor: '#fff',
    borderRadius: wp(3),
    elevation: 3,
    marginBottom: hp(2),
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: hp(1.5),
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  amountBlock: { alignItems: 'center', flex: 1 },
  amountLabel: {
    fontSize: wp(3.2),
    color: '#888',
  },
  amountValue: {
    fontSize: wp(4.2),
    fontWeight: 'bold',
    color: '#333',
    marginTop: hp(0.3),
  },
  divider: {
    width: 1,
    backgroundColor: '#ddd',
    marginHorizontal: wp(2),
  },
  descCard: {
    padding: wp(4),
    backgroundColor: '#fff',
    borderRadius: wp(3),
    elevation: 3,
    marginBottom: hp(2),
  },
  descTitle: {
    fontSize: wp(4.2),
    fontWeight: '600',
    color: '#333',
    marginBottom: hp(1),
  },
  descText: {
    fontSize: wp(3.8),
    color: '#555',
    lineHeight: wp(5.5),
  },
  imagesCard: {
    padding: wp(4),
    backgroundColor: '#fff',
    borderRadius: wp(3),
    elevation: 3,
    marginBottom: hp(2),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1.5),
  },
  sectionTitle: {
    fontSize: wp(4.4),
    fontWeight: '600',
    color: '#333',
  },
  viewAllText: {
    fontSize: wp(3.4),
    color: '#2874b8',
    fontWeight: '600',
  },
  imageScroll: { marginTop: hp(1) },
  thumbnailWrapper: { marginRight: wp(3) },
  thumbnail: {
    width: wp(28),
    height: wp(28),
    borderRadius: wp(2),
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: wp(2),
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemsCard: {
    padding: wp(4),
    backgroundColor: '#fff',
    borderRadius: wp(3),
    elevation: 3,
    marginBottom: hp(2),
  },
  itemRow: {
    paddingVertical: hp(1.8),
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemName: {
    fontWeight: '600',
    fontSize: wp(4),
  },
  itemDetails: {
    color: '#666',
    fontSize: wp(3.6),
    marginTop: hp(0.3),
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    marginVertical: hp(2),
  },
  paymentsCard: {
    padding: wp(4),
    backgroundColor: '#fff',
    borderRadius: wp(3),
    elevation: 3,
    marginBottom: hp(2),
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp(1.8),
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  paymentAmount: {
    fontWeight: '600',
    fontSize: wp(4),
  },
  paymentDate: {
    color: '#666',
    fontSize: wp(3.4),
  },
  chipText: {
    fontSize: wp(3),
  },
  voiceCard: {
    padding: wp(4),
    backgroundColor: '#fff',
    borderRadius: wp(3),
    elevation: 3,
    marginBottom: hp(2),
  },
  voiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1.5),
  },
  voiceTitle: {
    fontSize: wp(4.2),
    fontWeight: '600',
    color: '#333',
    marginLeft: wp(2),
  },
  recordingItem: {
    paddingVertical: hp(1),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  recordingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingInfo: {
    flex: 1,
    marginLeft: wp(2),
  },
  recordingName: {
    fontSize: wp(3.8),
    fontWeight: '500',
    color: '#333',
  },
  recordingDate: {
    fontSize: wp(3.2),
    color: '#666',
    marginTop: hp(0.2),
  },
  playButton: {
    margin: 0,
    backgroundColor: '#E3F2FD',
    borderRadius: wp(10),
  },
  progressContainer: {
    marginTop: hp(1),
    marginLeft: wp(12),
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2874b8',
  },
  timeText: {
    fontSize: wp(3.2),
    color: '#666',
    marginTop: hp(0.5),
  },
  downloadLink: {
    padding: wp(1),
  },
  downloadText: {
    color: '#2874b8',
    fontSize: wp(3.8),
    marginLeft: wp(1.5),
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  modalContent: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    backgroundColor: 'rgba(40,116,184,0.9)',
  },
  modalTitle: {
    fontSize: wp(5),
    fontWeight: '700',
    color: '#fff',
  },
  carouselItem: {
    width,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselImage: {
    width: wp(90),
    height: hp(70),
  },
  imageCounter: {
    position: 'absolute',
    bottom: hp(5),
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: '#fff',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    borderRadius: 20,
    fontSize: wp(3.8),
    fontWeight: '600',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    elevation: 3,
  },
  actionButton: {
    margin: 0,
  },
});

export default ProjectDetails;
