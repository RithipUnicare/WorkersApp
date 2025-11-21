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
  ToastAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Card,
  Chip,
  Button,
  Modal,
  Portal,
  IconButton,
  Dialog,
  TextInput,
  ProgressBar,
  RadioButton,
} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import dayjs from 'dayjs';
import { rootStackParamList } from '../navigation/AppNavigation';
import { ProjectAPI, UnitAPI } from '../service/apiService';
import Sound, { PlayBackType } from 'react-native-nitro-sound';
import { Dropdown } from 'react-native-element-dropdown';
import {
  launchImageLibrary,
  launchCamera,
  ImagePickerResponse,
} from 'react-native-image-picker';
import { getLocation } from '../utils/GeoLocation';
import { Unit } from './AdminAddProduct';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslator } from 'react-native-translator';
import ItemDialog from './components/ItemDialog';
import { addTextWatermark } from '../utils/Watermarker';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import { sendPushNotification } from '../utils/pushNofication';
const { width, height } = Dimensions.get('window');
const wp = (percentage: number) => (width * percentage) / 100;
const hp = (percentage: number) => (height * percentage) / 100;
const enToTa: Record<string, string> = {
  Contact: 'தொடர்பு',
  Location: 'இடம்',
  'Not set': 'அமைக்கப்படவில்லை',
  Delivery: 'விநியோகம்',
  'Days Left': 'மீதமுள்ள நாட்கள்',
  'days left': 'நாட்கள் மீதம்',
  Overdue: 'காலாவதியானது',
  Budget: 'பட்ஜெட்',
  'Total Amount': 'மொத்த தொகை',
  Paid: 'செலுத்தப்பட்டது',
  'Project Description': 'திட்ட விளக்கம்',
  'Site Images': 'தள புகைப்படங்கள்',
  'View All': 'பார்க்க',
  'No site images available': 'தள புகைப்படங்கள் இல்லை',
  Items: 'பொருட்கள்',
  'No items': 'பொருட்கள் இல்லை',
  'Advance Payments': 'முன்பணம்',
  Cash: 'பணம்',
  'Voice Recordings': 'குரல் பதிவுகள்',
  'No Voice Recording': 'குரல் பதிவு இல்லை',
  'Update GPS Location': 'GPS இடத்தை புதுப்பிக்கவும்',
  'Address (Optional)': 'முகவரி (விரும்பினால்)',
  'Fetch & Update GPS': 'GPS ஐ பெறு & புதுப்பி',
  Cancel: 'ரத்து செய்',
  'Add Item': 'பொருள் சேர்க்க',
  'Item Name *': 'பொருள் பெயர் *',
  Description: 'விளக்கம்',
  'Quantity *': 'அளவு *',
  'Rate (MRP) *': 'விலை (MRP) *',
  'Select Unit *': 'அலகு தேர்ந்தெடு *',
  'Tax (%)': 'வரி (%)',
  'HSN/SAC': 'HSN/SAC',
  Save: 'சேமி',
  'Add Site Images': 'தள புகைப்படங்கள் சேர்க்க',
  Gallery: 'கேலரி',
  Camera: 'கேமரா',
  'Selected:': 'தேர்ந்தெடுக்கப்பட்டவை:',
  'image(s)': 'புகைப்படங்கள்',
  'Uploading...': 'பதிவேற்றுகிறது...',
  'Upload Images': 'புகைப்படங்களை பதிவேற்று',
  'Delete Project': 'திட்டத்தை நீக்கு',
  'Are you sure?': 'நிச்சயமா?',
  Delete: 'நீக்கு',
  Error: 'பிழை',
  'Failed to delete': 'நீக்க முடியவில்லை',
  Success: 'வெற்றி',
  'Update Status': 'நிலையைப் புதுப்பிக்கவும்',
  'Status updated': 'நிலை புதுப்பிக்கப்பட்டது',
  'Failed to update status': 'நிலையை புதுப்பிக்க முடியவில்லை',
  'Location updated': 'இடம் புதுப்பிக்கப்பட்டது',
  'Could not fetch location': 'இடத்தை பெற முடியவில்லை',
  'Failed to update location': 'இடத்தை புதுப்பிக்க முடியவில்லை',
  'Please fill all required fields including Unit':
    'அனைத்து தேவையான புலங்களையும் நிரப்பவும், அலகு உட்பட',
  'Item added': 'பொருள் சேர்க்கப்பட்டது',
  'Failed to add item': 'பொருளை சேர்க்க முடியவில்லை',
  'Image pick failed': 'புகைப்படம் தேர்வு தோல்வி',
  'Camera failed': 'கேமரா தோல்வி',
  'Upload Failed': 'பதிவேற்றம் தோல்வி',
  'Could not upload images': 'புகைப்படங்களை பதிவேற்ற முடியவில்லை',
  'image(s) uploaded': 'புகைப்படங்கள் பதிவேற்றப்பட்டன',
  'Playback Error': 'பிளேபேக் பிழை',
  'Could not play audio': 'ஆடியோவை இயக்க முடியவில்லை',
  'Delete Voice Recording': 'குரல் பதிவை நீக்கு',
  'Payment Out': 'செலுத்துதல்',
  CREATED: 'உருவாக்கப்பட்டது',
  IN_PROGRESS: 'செயல்பாட்டில்',
  DISCONTINUED: 'நிறுத்தப்பட்டது',
  COMPLETED: 'முடிக்கப்பட்டது',
};
const STATUS_OPTIONS = ['CREATED', 'IN_PROGRESS', 'DISCONTINUED', 'COMPLETED'];
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
  discount?: number;
  totalBudget?: number;
  totalPaymentOut?: number;
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
    unit?: { id: number; name: string; shortName: string };
  }[];
  advancePayments: {
    id: number;
    amount: number;
    paymentDate: string;
    paymentMode?: string;
  }[];
  voiceRecordings?: VoiceRecording[];
};
export type ProjectItem = {
  id?: number;
  projectId: number;
  itemName: string;
  itemDescription?: string;
  rateMrp: number;
  quantity: number;
  amount: number;
  unitId?: number;
  taxPercentage?: number;
  hsnSac?: string;
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
const openMobileDialer = (phoneNumber: string) => {
  const url = `tel:${phoneNumber}`;
  Linking.openURL(url).catch(() => {});
};
const downloadImageToDevice = async (imageUrl: string, filename: string) => {
  const basePath =
    Platform.OS === 'android'
      ? RNFS.DownloadDirectoryPath
      : RNFS.DocumentDirectoryPath;
  const destPath = `${basePath}/${filename}`;
  const { promise } = RNFS.downloadFile({
    fromUrl: imageUrl,
    toFile: destPath,
  });
  const result = await promise;
  if (result.statusCode === 200) {
    if (Platform.OS === 'android') {
      ToastAndroid.show('Image downloaded', ToastAndroid.SHORT);
    } else {
      Alert.alert('Success', 'Image downloaded');
    }
  } else {
    throw new Error('Download failed');
  }
};
const shareSingleImage = async (imageUrl: string, filename: string) => {
  const destPath = `${RNFS.CachesDirectoryPath}/${filename}`;
  const { promise } = RNFS.downloadFile({
    fromUrl: imageUrl,
    toFile: destPath,
  });
  const result = await promise;
  if (result.statusCode !== 200) {
    throw new Error('Download failed');
  }
  await Share.open({
    url: `file://${destPath}`,
    type: 'image/jpeg',
  });
};
const ProjectDetails: React.FC = () => {
  const route = useRoute<ProjectDetailsRouteProp>();
  const navigation = useNavigation<ProjectDetailsNavProp>();
  const initialProject: Project | any = route?.params?.project;
  const [project, setProject] = useState<Project>(initialProject);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playTime, setPlayTime] = useState('00:00:00');
  const [duration, setDuration] = useState('00:00:00');
  const [currentUrl, setCurrentUrl] = useState<string>('');
  // Section-specific modals
  const [gpsModalVisible, setGpsModalVisible] = useState(false);
  const [gpsAddress, setGpsAddress] = useState('');
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemQty, setItemQty] = useState('');
  const [itemRate, setItemRate] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [taxPercentage, setTaxPercentage] = useState('');
  const [itemHsnSac, setItemHsnSac] = useState('');
  const [role, setRole] = useState<string | null>('');
  const [isTamil, setIsTamil] = useState(false);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  // Image upload state
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);
  // Item images state (project items)
  const [itemImagesModalOpen, setItemImagesModalOpen] = useState(false);
  const [activeItemForImages, setActiveItemForImages] = useState<any | null>(
    null,
  );
  const [selectedItemImages, setSelectedItemImages] = useState<string[]>([]);
  const [itemImageUploading, setItemImageUploading] = useState(false);
  const [itemImagesViewerOpen, setItemImagesViewerOpen] = useState(false);
  const [selectedItemImageIndex, setSelectedItemImageIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [username, setUsername] = useState('');
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(
    project.status || 'CREATED',
  );
  const [statusUpdating, setStatusUpdating] = useState(false);
  // Selection state for site images
  const [selectedImageIds, setSelectedImageIds] = useState(new Set<number>());
  const { translate } = useTranslator();
  // Initialize language from AsyncStorage
  useEffect(() => {
    const initLang = async () => {
      const saved = await AsyncStorage.getItem('appLanguage');
      const tamil = saved === 'ta';
      setIsTamil(tamil);
    };
    const initUsername = async () => {
      const saved = await AsyncStorage.getItem('user');
      const user = JSON.parse(saved || '{}');
      setUsername(user.name || '');
    };
    initLang();
    initUsername();
  }, []);
  // Item images helpers
  const openItemImages = (item: any) => {
    setActiveItemForImages(item);
    setSelectedItemImages([]);
    setItemImagesModalOpen(true);
  };
  const openItemImageViewer = (item: any, index: number) => {
    setActiveItemForImages(item);
    setSelectedItemImageIndex(index);
    setItemImagesViewerOpen(true);
  };
  const pickProjectItemImages = () => {
    launchImageLibrary(
      { mediaType: 'photo', quality: 0.7, selectionLimit: 10 },
      (response: ImagePickerResponse) => {
        if (response.didCancel) return;
        if (response.errorCode) {
          Alert.alert(
            t('Error'),
            response.errorMessage || t('Image pick failed'),
          );
          return;
        }
        const uris = response.assets?.map(a => a.uri!).filter(Boolean) || [];
        setSelectedItemImages(prev => [...prev, ...uris]);
      },
    );
  };
  const takeProjectItemPhoto = () => {
    launchCamera(
      { mediaType: 'photo', quality: 0.7 },
      (response: ImagePickerResponse) => {
        if (response.didCancel) return;
        if (response.errorCode) {
          Alert.alert(t('Error'), response.errorMessage || t('Camera failed'));
          return;
        }
        const uri = response.assets?.[0]?.uri;
        if (uri) setSelectedItemImages(prev => [...prev, uri]);
      },
    );
  };
  const removeSelectedItemImage = (index: number) => {
    setSelectedItemImages(prev => prev.filter((_, i) => i !== index));
  };
  const uploadItemImages = async () => {
    if (!activeItemForImages?.id || selectedItemImages.length === 0) return;
    setItemImageUploading(true);
    try {
      const res = await ProjectAPI.addItemImages(
        activeItemForImages.id,
        selectedItemImages,
      );
      if (res?.data) {
        await onRefresh();
        setSelectedItemImages([]);
        Alert.alert(
          t('Success'),
          `${res.data.length} ${t('image(s) uploaded')}`,
        );
      }
    } catch (e: any) {
      Alert.alert(
        t('Upload Failed'),
        e.message || t('Could not upload images'),
      );
    } finally {
      setItemImageUploading(false);
    }
  };
  const deleteItemImage = async (itemId: number, imageId: number) => {
    try {
      await ProjectAPI.deleteItemImage(itemId, imageId);
      await onRefresh();
    } catch (e) {
      Alert.alert(t('Error'), t('Failed to delete'));
    }
  };
  const deleteSiteImage = async (imageId: number) => {
    try {
      await ProjectAPI.deleteSiteImage(imageId);
      await onRefresh();
    } catch (e) {
      Alert.alert(t('Error'), t('Failed to delete'));
    }
  };
  // Toggle image selection
  const toggleImageSelection = useCallback((id: number) => {
    setSelectedImageIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);
  const handleDownloadSiteImage = useCallback(
    async (imageUrl: string, imageId: number) => {
      try {
        const filename = `site_image_${imageId}_${Date.now()}.jpg`;
        await downloadImageToDevice(imageUrl, filename);
      } catch (e) {
        Alert.alert('Error', 'Failed to download image');
      }
    },
    [],
  );
  // Handle sharing selected images
  const handleShareSelectedImages = useCallback(async () => {
    if (selectedImageIds.size === 0) return;
    const downloadPromises = Array.from(selectedImageIds).map(async id => {
      const img = project.siteImages.find(i => i.id === id);
      if (!img) return null;
      const filename = `site_image_${id}_${Date.now()}.jpg`;
      const destPath = `${RNFS.CachesDirectoryPath}/${filename}`;
      const { promise } = RNFS.downloadFile({
        fromUrl: img.imageUrl,
        toFile: destPath,
      });
      try {
        const downloadResult = await promise;
        if (downloadResult.statusCode === 200) {
          return `file://${destPath}`;
        } else {
          return null;
        }
      } catch (e) {
        console.error('Download error:', e);
        return null;
      }
    });
    try {
      const urls = (await Promise.all(downloadPromises)).filter(
        (url): url is string => Boolean(url),
      );
      if (urls.length === 0) {
        Alert.alert('Error', 'No images could be downloaded for sharing');
        return;
      }
      await Share.open({
        urls,
        type: 'image/jpeg',
      });
    } catch (e) {
      Alert.alert('Share Error', 'Failed to share images');
    } finally {
      setSelectedImageIds(new Set());
    }
  }, [selectedImageIds, project.siteImages]);
  const handleShareItemImage = useCallback(
    async (imageUrl: string, imageId: number) => {
      try {
        const filename = `item_image_${imageId}_${Date.now()}.jpg`;
        await shareSingleImage(imageUrl, filename);
      } catch (e) {
        Alert.alert('Share Error', 'Failed to share image');
      }
    },
    [],
  );
  const handleDownloadItemImage = useCallback(
    async (imageUrl: string, imageId: number) => {
      try {
        const filename = `item_image_${imageId}_${Date.now()}.jpg`;
        await downloadImageToDevice(imageUrl, filename);
      } catch (e) {
        Alert.alert('Error', 'Failed to download image');
      }
    },
    [],
  );
  // Item edit/delete
  const openAddItem = () => {
    setEditingItem(null);
    setItemModalOpen(true);
  };
  const openEditItem = (item: any) => {
    setEditingItem(item);
    setItemModalOpen(true);
  };
  const confirmDeleteItem = (itemId: number) => {
    if (project.projectItems.length === 1) {
      ToastAndroid.show('Atleast one item needed', ToastAndroid.LONG);
      return;
    }
    Alert.alert(t('Delete'), t('Are you sure?'), [
      { text: t('Cancel') },
      {
        text: t('Delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await ProjectAPI.deleteItem(itemId);
            await onRefresh();
          } catch (e) {
            Alert.alert(t('Error'), t('Failed to delete'));
          }
        },
      },
    ]);
  };
  // Translate strings when language changes
  useEffect(() => {
    if (!isTamil) {
      setTranslations({});
      return;
    }
    const translateAll = async () => {
      const result: Record<string, string> = {};
      for (const en of Object.keys(enToTa)) {
        try {
          const ta = await translate('en', 'ta', en, { type: 'google' });
          result[en] = ta;
        } catch {
          result[en] = enToTa[en] ?? en;
        }
      }
      setTranslations(result);
    };
    translateAll();
  }, [isTamil, translate]);
  const t = useCallback(
    (english: string): string => {
      if (!isTamil) return english;
      return translations[english] ?? enToTa[english] ?? english;
    },
    [isTamil, translations],
  );
  const formatTime = (time: string) => dayjs(time, 'HH:mm:ss').format('h:mm A');
  const formatDate = (date: string) => dayjs(date).format('DD-MM-YYYY');
  // Load units when Add Item modal opens
  useEffect(() => {
    if (itemModalOpen) {
      (async () => {
        try {
          const res = await UnitAPI.getAll();
          if (res?.data) setUnits(res.data);
        } catch (e) {
          console.warn('Failed to load units', e);
        }
      })();
    } else {
      setUnits([]);
      setSelectedUnitId('');
    }
  }, [itemModalOpen]);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await ProjectAPI.getById(initialProject.id);
      if (res?.data) setProject(res.data);
      const currentUser = await AsyncStorage.getItem('user');
      const parsedUser = currentUser ? JSON.parse(currentUser) : null;
      setRole(parsedUser?.role || 'worker');
    } catch (e) {
      console.error('Failed to refresh project', e);
    } finally {
      setRefreshing(false);
    }
  }, [initialProject.id]);
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      try {
        onRefresh();
      } catch (e) {
        console.error('Failed to reload project', e);
      }
    });
    return unsubscribe;
  }, [navigation, initialProject.id]);
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
      // playbackListener?.remove();
      // endListener?.remove();
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
      case 'DISCONTINUED':
        return '#FF7043';
      default:
        return '#9E9E9E';
    }
  };
  const displayStatusRaw = project.status || project.siteStatus || 'CREATED';
  const displayStatus = t(displayStatusRaw);
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
        Alert.alert(t('Playback Error'), t('Could not play audio'));
      }
    },
    [isPlaying, currentUrl, t],
  );
  const handleEdit = () => {
    navigation.navigate('AddProject', { projectToEdit: project });
  };
  const handleDelete = () => {
    Alert.alert(t('Delete Project'), t('Are you sure?'), [
      { text: t('Cancel') },
      {
        text: t('Delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await ProjectAPI.updateStatus(project.id, 'DELETED');
            navigation.goBack();
          } catch (e) {
            Alert.alert(t('Error'), t('Failed to delete'));
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
  const openStatusDialog = () => {
    setSelectedStatus(project.status || 'CREATED');
    setStatusModalVisible(true);
  };
  const handleStatusUpdate = async () => {
    if (statusUpdating || !selectedStatus) return;
    setStatusUpdating(true);
    try {
      await ProjectAPI.updateStatus(project.id, selectedStatus);
      setProject(prev => ({ ...prev, status: selectedStatus }));
      setStatusModalVisible(false);
      Alert.alert(t('Success'), t('Status updated'));
    } catch (e: any) {
      Alert.alert(t('Error'), e.message || t('Failed to update status'));
    } finally {
      setStatusUpdating(false);
    }
  };
  const updateGPS = async () => {
    try {
      const loc: any = await getLocation();
      if (loc?.address && loc?.pos) {
        const newLocation = {
          address: gpsAddress || loc.address,
          latitude: loc.pos.coords.latitude,
          longitude: loc.pos.coords.longitude,
        };
        await ProjectAPI.updateGps(project.id, newLocation);
        setProject(prev => ({
          ...prev,
          location: { id: Date.now(), ...newLocation },
        }));
        setGpsModalVisible(false);
        setGpsAddress('');
        Alert.alert(t('Success'), t('Location updated'));
        onRefresh();
      } else {
        Alert.alert(t('Error'), t('Could not fetch location'));
      }
    } catch (e) {
      Alert.alert(t('Error'), t('Failed to update location'));
    }
  };
  // Add Item - Save
  const saveItem = async () => {
    const qty = Number(itemQty) || 0;
    const rate = Number(itemRate) || 0;
    const uId = Number(selectedUnitId) || 0;
    const tax = Number(taxPercentage) || 0;
    if (!itemName || qty <= 0 || rate <= 0 || uId <= 0) {
      Alert.alert(
        t('Error'),
        t('Please fill all required fields including Unit'),
      );
      return;
    }
    const newItem: ProjectItem = {
      projectId: project?.id || 0,
      itemName,
      itemDescription: itemDesc,
      rateMrp: rate,
      quantity: qty,
      amount: qty * rate,
      unitId: uId,
      taxPercentage: tax,
      hsnSac: itemHsnSac,
    };
    try {
      await ProjectAPI.createItem(newItem);
      setProject(prev => ({
        ...prev,
        projectItems: [
          ...prev.projectItems,
          {
            ...newItem,
            id: Date.now(),
            totalCost: newItem.amount + (newItem.amount * tax) / 100,
          },
        ],
        totalAmount:
          prev.totalAmount + newItem.amount + (newItem.amount * tax) / 100,
      }));
      setItemModalOpen(false);
      resetItemForm();
      Alert.alert(t('Success'), t('Item added'));
      onRefresh();
    } catch (e) {
      Alert.alert(t('Error'), t('Failed to add item'));
    }
  };
  const resetItemForm = () => {
    setItemName('');
    setItemDesc('');
    setItemQty('');
    setItemRate('');
    setSelectedUnitId('');
    setTaxPercentage('');
    setItemHsnSac('');
  };
  // Image Picker
  const pickImages = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.7,
        selectionLimit: 10,
      },
      (response: ImagePickerResponse) => {
        if (response.didCancel) return;
        if (response.errorCode) {
          Alert.alert(
            t('Error'),
            response.errorMessage || t('Image pick failed'),
          );
          return;
        }
        const processed: string[] = [];
        const promises: Promise<void>[] = [];
        for (const asset of response.assets || []) {
          if (!asset.uri) continue;
          const p = addTextWatermark(asset.uri)
            .then(wmUri => {
              processed.push(wmUri);
            })
            .catch(err => {
              console.log('Watermark failed:', err);
            });
          promises.push(p);
        }
        // When all watermark jobs finish
        Promise.all(promises).then(() => {
          setSelectedImages(prev => [...prev, ...processed]);
        });
      },
    );
  };
  const takePhoto = () => {
    launchCamera(
      {
        mediaType: 'photo',
        quality: 0.7,
      },
      (response: ImagePickerResponse) => {
        if (response.didCancel) return;
        if (response.errorCode) {
          Alert.alert(t('Error'), response.errorMessage || t('Camera failed'));
          return;
        }
        if (response.assets?.[0]?.uri) {
          const processed: string[] = [];
          const promises: Promise<void>[] = [];
          for (const asset of response.assets || []) {
            if (!asset.uri) continue;
            const p = addTextWatermark(asset.uri)
              .then(wmUri => {
                processed.push(wmUri);
              })
              .catch(err => {
                console.log('Watermark failed:', err);
              });
            promises.push(p);
          }
          // When all watermark jobs finish
          Promise.all(promises).then(() => {
            setSelectedImages(prev => [...prev, ...processed]);
          });
        }
      },
    );
  };
  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };
  const uploadSiteImages = async () => {
    if (selectedImages.length === 0) return;
    setUploading(true);
    try {
      const res = await ProjectAPI.addSiteImages(project.id, selectedImages);
      if (res?.data) {
        setProject(prev => ({
          ...prev,
          siteImages: [...prev.siteImages, ...res.data],
        }));
        sendPushNotification(
          'Image uploaded',
          `New image uploaded to project by ${username}`,
          'ProjectList',
          project.id,
        );
        Alert.alert(
          t('Success'),
          `${selectedImages.length} ${t('image(s) uploaded')}`,
        );
      }
      setSelectedImages([]);
      setImageModalOpen(false);
      onRefresh();
    } catch (e: any) {
      Alert.alert(
        t('Upload Failed'),
        e.message || t('Could not upload images'),
      );
    } finally {
      setUploading(false);
    }
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
    <SafeAreaView style={styles.safeArea}>
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
              <TouchableOpacity
                onPress={openStatusDialog}
                disabled={role !== 'superadmin'}
              >
                <Chip
                  style={[
                    styles.statusChip,
                    { backgroundColor: getStatusColor(project.status) },
                  ]}
                  textStyle={styles.statusText}
                >
                  {displayStatus}
                </Chip>
              </TouchableOpacity>
            </View>
          </Card>
          {/* Details */}
          <Card style={styles.detailsCard}>
            <TouchableOpacity
              style={styles.infoRow}
              onPress={() => openMobileDialer(project.customerContactNo)}
            >
              <MaterialCommunityIcons
                name="phone"
                size={wp(5)}
                color="#2874b8"
              />
              <Text style={styles.infoLabel}>{t('Contact')}</Text>
              <Text style={styles.infoValue}>{project.customerContactNo}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.infoRow}
              onPress={() =>
                openGoogleMaps(
                  project.location?.latitude || 0,
                  project.location?.longitude || 0,
                )
              }
            >
              <MaterialCommunityIcons
                name="map-marker"
                size={wp(5)}
                color="#2874b8"
              />
              <Text style={styles.infoLabel}>{t('Location')}</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {project.location?.address || t('Not set')}
              </Text>
              <IconButton
                icon="map-marker-plus"
                size={wp(6)}
                onPress={() => setGpsModalVisible(true)}
                iconColor="#2874b8"
                disabled={role === 'worker'}
              />
            </TouchableOpacity>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="calendar"
                size={wp(5)}
                color="#2874b8"
              />
              <Text style={styles.infoLabel}>{t('Delivery')}</Text>
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
              <Text style={styles.infoLabel}>{t('Days Left')}</Text>
              <Text
                style={[
                  styles.infoValue,
                  { color: project.remainingDays > 0 ? '#e67e22' : '#e74c3c' },
                ]}
              >
                {project.remainingDays > 0
                  ? `${project.remainingDays} ${t('days left')}`
                  : t('Overdue')}
              </Text>
            </View>
          </Card>
          {/* Amount */}
          {role !== 'worker' && (
            <Card style={styles.amountCard}>
              <View style={styles.amountRow}>
                <View style={styles.amountBlock}>
                  <Text style={styles.amountLabel}>{t('Budget')}</Text>
                  <Text style={styles.amountValue}>
                    ₹{project.grandTotal?.toLocaleString('en-IN') || '0'}
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.amountBlock}>
                  <Text style={styles.amountLabel}>{t('Total Amount')}</Text>
                  <Text style={[styles.amountValue, { color: '#27ae60' }]}>
                    ₹{project.totalAmount.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.amountBlock}>
                  <Text style={styles.amountLabel}>{t('Paid')}</Text>
                  <Text style={[styles.amountValue, { color: '#27ae60' }]}>
                    ₹
                    {(
                      project.totalAmount - project.remainingAmount
                    ).toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.amountBlock}>
                  <Text style={styles.amountLabel}>{t('Payment Out')}</Text>
                  <Text style={[styles.amountValue, { color: '#e71d1dff' }]}>
                    ₹
                    {Number(project.totalPaymentOut || 0).toLocaleString(
                      'en-IN',
                    )}
                  </Text>
                </View>
              </View>
            </Card>
          )}
          {/* Description */}
          {project.projectDescription ? (
            <Card style={styles.descCard}>
              <Text style={styles.descTitle}>{t('Project Description')}</Text>
              <Text style={styles.descText}>{project.projectDescription}</Text>
            </Card>
          ) : null}
          {/* Site Images */}
          {project.siteImages.length > 0 ? (
            <Card style={styles.imagesCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {t('Site Images')} ({project.siteImages.length})
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Button
                    mode="text"
                    onPress={() => openImageModal(0)}
                    labelStyle={styles.viewAllText}
                  >
                    {t('View All')}
                  </Button>
                  <IconButton
                    icon="plus"
                    size={wp(6)}
                    onPress={() => setImageModalOpen(true)}
                    iconColor="#2874b8"
                  />
                  {selectedImageIds.size > 0 && (
                    <IconButton
                      icon="share-variant"
                      size={wp(6)}
                      onPress={handleShareSelectedImages}
                      iconColor="#2874b8"
                    />
                  )}
                </View>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.imageScroll}
              >
                {project.siteImages.map((img, idx) => (
                  <View key={img.id} style={styles.thumbnailWrapper}>
                    <TouchableOpacity
                      onPress={() => openImageModal(idx)}
                      onLongPress={() => toggleImageSelection(img.id)}
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
                    <TouchableOpacity
                      style={{ position: 'absolute', bottom: 4, right: 4 }}
                      onPress={() =>
                        handleDownloadSiteImage(img.imageUrl, img.id)
                      }
                    >
                      <MaterialCommunityIcons
                        name="download"
                        size={wp(5)}
                        color="#083486ff"
                      />
                    </TouchableOpacity>
                    {selectedImageIds.has(img.id) && (
                      <View style={styles.selectionOverlay}>
                        <MaterialCommunityIcons
                          name="check"
                          size={24}
                          color="#fff"
                        />
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
            </Card>
          ) : (
            <Card style={styles.imagesCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t('Site Images')} (0)</Text>
                <IconButton
                  icon="plus"
                  size={wp(6)}
                  onPress={() => setImageModalOpen(true)}
                  iconColor="#2874b8"
                />
              </View>
              <Text style={styles.emptyText}>
                {t('No site images available')}
              </Text>
            </Card>
          )}
          {/* Items */}
          <Card style={styles.itemsCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {t('Items')} ({project.projectItems.length})
              </Text>
              <IconButton
                icon="plus"
                size={wp(6)}
                onPress={openAddItem}
                iconColor="#2874b8"
                disabled={role === 'worker'}
              />
            </View>
            {project.projectItems.length === 0 ? (
              <Text style={styles.emptyText}>{t('No items')}</Text>
            ) : (
              project.projectItems.map(item => (
                <View key={item.id} style={styles.itemRow}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text style={styles.itemName}>{item.itemName}</Text>
                    {role !== 'worker' && (
                      <View style={{ flexDirection: 'row' }}>
                        <IconButton
                          icon="image-plus"
                          onPress={() => openItemImages(item)}
                        />
                        <IconButton
                          icon="pencil"
                          onPress={() => openEditItem(item)}
                        />
                        <IconButton
                          icon="delete"
                          onPress={() => confirmDeleteItem(item.id)}
                        />
                      </View>
                    )}
                  </View>
                  <Text style={styles.itemDetails}>
                    {role !== 'worker'
                      ? `${item.quantity} ${item.unit?.shortName} × ₹${
                          item.rateMrp
                        } = ₹${item.totalCost.toLocaleString('en-IN')}`
                      : `${item.quantity} ${item.unit?.shortName}`}
                  </Text>
                  {Array.isArray((item as any).images) &&
                    (item as any).images.length > 0 && (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={{ marginTop: 8 }}
                      >
                        {(item as any).images.map((img: any) => (
                          <View key={img.id} style={{ marginRight: 10 }}>
                            <TouchableOpacity
                              onPress={() =>
                                openItemImageViewer(
                                  item,
                                  (item as any).images.findIndex(
                                    (x: any) => x.id === img.id,
                                  ),
                                )
                              }
                            >
                              <Image
                                source={{ uri: img.imageUrl }}
                                style={{
                                  width: wp(25),
                                  height: wp(25),
                                  borderRadius: 8,
                                }}
                              />
                            </TouchableOpacity>
                            <View
                              style={{
                                position: 'absolute',
                                bottom: 2,
                                left: 2,
                                flexDirection: 'row',
                              }}
                            >
                              <TouchableOpacity
                                onPress={() =>
                                  handleShareItemImage(img.imageUrl, img.id)
                                }
                                style={{ marginRight: 6 }}
                              >
                                <MaterialCommunityIcons
                                  name="share-variant"
                                  size={wp(4.5)}
                                  color="#425cecff"
                                />
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() =>
                                  handleDownloadItemImage(img.imageUrl, img.id)
                                }
                              >
                                <MaterialCommunityIcons
                                  name="download"
                                  size={wp(4.5)}
                                  color="#0616a3ff"
                                />
                              </TouchableOpacity>
                            </View>
                            <TouchableOpacity
                              onPress={() => deleteItemImage(item.id, img.id)}
                              style={{
                                position: 'absolute',
                                top: -6,
                                right: -6,
                              }}
                              disabled={role === 'worker'}
                            >
                              <MaterialCommunityIcons
                                name="close-circle"
                                size={wp(5)}
                                color="#e74c3c"
                              />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </ScrollView>
                    )}
                </View>
              ))
            )}
          </Card>
          {/* Payments */}
          {project.advancePayments.length > 0 && (
            <Card style={styles.paymentsCard}>
              <Text style={styles.sectionTitle}>{t('Advance Payments')}</Text>
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
                    {pay.paymentMode || t('Cash')}
                  </Chip>
                </View>
              ))}
            </Card>
          )}
          {/* Voice Recordings */}
          {sortedVoiceRecordings.length > 0 ? (
            <Card style={styles.voiceCard}>
              <View style={styles.voiceHeader}>
                <MaterialCommunityIcons
                  name="microphone"
                  size={wp(6)}
                  color="#2874b8"
                />
                <Text style={styles.voiceTitle}>
                  {t('Voice Recordings')} ({sortedVoiceRecordings.length})
                </Text>
                <IconButton
                  icon="plus"
                  size={wp(6)}
                  onPress={handleRecordVoice}
                  iconColor="#2874b8"
                />
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
                          t('Delete Voice Recording'),
                          t('Are you sure?'),
                          [
                            { text: t('Cancel'), style: 'cancel' },
                            {
                              text: t('Delete'),
                              onPress: async () => {
                                await ProjectAPI.deleteVoiceRecording(
                                  project.id,
                                  recording.id,
                                );
                                onRefresh();
                              },
                            },
                          ],
                        );
                      }}
                      style={{ marginLeft: wp(2) }}
                      disabled={role === 'worker'}
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
          ) : (
            <Card style={styles.voiceCard}>
              <View style={styles.voiceHeader}>
                <MaterialCommunityIcons
                  name="microphone"
                  size={wp(6)}
                  color="#2874b8"
                />
                <Text style={styles.voiceTitle}>
                  {t('Voice Recordings')} ({sortedVoiceRecordings.length})
                </Text>
                <IconButton
                  icon="plus"
                  size={wp(6)}
                  onPress={handleRecordVoice}
                  iconColor="#2874b8"
                />
              </View>
              <View>
                <Text style={styles.recordingName}>
                  {t('No Voice Recording')}
                </Text>
              </View>
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
            disabled={role === 'worker'}
          />
          <IconButton
            icon="delete"
            size={wp(7)}
            onPress={handleDelete}
            iconColor="#e74c3c"
            style={styles.actionButton}
            disabled={role !== 'superadmin'}
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
            disabled={role !== 'superadmin'}
          />
        </View>
        {/* Image Full View Modal */}
        <Portal>
          <Modal
            visible={modalVisible}
            onDismiss={() => setModalVisible(false)}
            contentContainerStyle={styles.modalContainer}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('Site Images')}</Text>
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
          {/* Status Update Dialog */}
          <Dialog
            visible={statusModalVisible}
            onDismiss={() => setStatusModalVisible(false)}
          >
            <Dialog.Title>{t('Update Status')}</Dialog.Title>
            <Dialog.Content>
              <Text style={styles.statusDialogLabel}>{t('Select Status')}</Text>
              <RadioButton.Group
                onValueChange={value => setSelectedStatus(value)}
                value={selectedStatus}
              >
                {STATUS_OPTIONS.map(option => (
                  <View
                    key={option}
                    // value={option}
                    // label={t(option)}
                    // position="leading"
                    // style={styles.statusOption}
                    style={styles.statusOption}
                  >
                    <RadioButton.Android value={option} />
                    <Text style={styles.statusOptionLabel}>{t(option)}</Text>
                  </View>
                ))}
              </RadioButton.Group>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setStatusModalVisible(false)}>
                {t('Cancel')}
              </Button>
              <Button
                mode="contained"
                onPress={handleStatusUpdate}
                loading={statusUpdating}
                disabled={statusUpdating}
                style={{ paddingHorizontal: wp(2) }}
              >
                {t('Update Status')}
              </Button>
            </Dialog.Actions>
          </Dialog>
          {/* GPS Update Dialog */}
          <Dialog
            visible={gpsModalVisible}
            onDismiss={() => setGpsModalVisible(false)}
          >
            <Dialog.Title>{t('Update GPS Location')}</Dialog.Title>
            <Dialog.Content>
              <TextInput
                label={t('Address (Optional)')}
                value={gpsAddress}
                onChangeText={setGpsAddress}
                mode="outlined"
                style={styles.input}
              />
              <Button
                mode="contained"
                onPress={updateGPS}
                style={styles.button}
                buttonColor="#2874b8"
              >
                {t('Fetch & Update GPS')}
              </Button>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setGpsModalVisible(false)}>
                {t('Cancel')}
              </Button>
            </Dialog.Actions>
          </Dialog>
          {/* Add Item Dialog */}
          <ItemDialog
            visible={itemModalOpen}
            onDismiss={() => {
              setItemModalOpen(false);
              setEditingItem(null);
            }}
            mode="project"
            projectId={project.id}
            item={editingItem || undefined}
            onSaved={(saved: any) => {
              const tax = Number(saved.taxPercentage) || 0;
              const amount =
                saved.amount || (saved.quantity || 0) * (saved.rateMrp || 0);
              if (editingItem?.id) {
                setProject(prev => ({
                  ...prev,
                  projectItems: prev.projectItems.map(pi =>
                    pi.id === editingItem.id
                      ? {
                          id: saved.id || editingItem.id,
                          itemName: saved.itemName,
                          quantity: saved.quantity,
                          rateMrp: saved.rateMrp,
                          totalCost: amount + (amount * tax) / 100,
                        }
                      : pi,
                  ),
                }));
              } else {
                setProject(prev => ({
                  ...prev,
                  projectItems: [
                    ...prev.projectItems,
                    {
                      id: saved.id || Date.now(),
                      itemName: saved.itemName,
                      quantity: saved.quantity,
                      rateMrp: saved.rateMrp,
                      totalCost: amount + (amount * tax) / 100,
                    },
                  ],
                  totalAmount: prev.totalAmount + amount + (amount * tax) / 100,
                }));
                Alert.alert(t('Success'), t('Item added'));
              }
              setItemModalOpen(false);
              setEditingItem(null);
              resetItemForm();
              onRefresh();
            }}
            title={editingItem ? t('Edit Item') : t('Add Item')}
            t={t}
          />
          {/* Add Site Images Dialog */}
          <Dialog
            visible={imageModalOpen}
            onDismiss={() => {
              setImageModalOpen(false);
              setSelectedImages([]);
            }}
          >
            <Dialog.Title>{t('Add Site Images')}</Dialog.Title>
            <Dialog.Content>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginBottom: hp(2),
                }}
              >
                <Button
                  mode="contained"
                  onPress={pickImages}
                  style={{ flex: 1, marginRight: wp(2) }}
                >
                  {t('Gallery')}
                </Button>
                <Button mode="outlined" onPress={takePhoto} style={{ flex: 1 }}>
                  {t('Camera')}
                </Button>
              </View>
              {selectedImages.length > 0 && (
                <>
                  <Text style={{ marginVertical: hp(1) }}>
                    {t('Selected:')} {selectedImages.length} {t('image(s)')}
                  </Text>
                  <ScrollView horizontal style={{ maxHeight: hp(20) }}>
                    {selectedImages.map((uri, idx) => (
                      <View key={idx} style={styles.previewWrapper}>
                        <Image source={{ uri }} style={styles.previewImage} />
                        <TouchableOpacity
                          style={styles.removeBtn}
                          onPress={() => removeImage(idx)}
                        >
                          <MaterialCommunityIcons
                            name="close-circle"
                            size={wp(6)}
                            color="#e74c3c"
                          />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                  {uploading && (
                    <ProgressBar
                      indeterminate
                      style={{ marginVertical: hp(1) }}
                    />
                  )}
                  <Button
                    mode="contained"
                    onPress={uploadSiteImages}
                    disabled={uploading}
                    style={styles.uploadBtn}
                    buttonColor="#27ae60"
                  >
                    {uploading ? t('Uploading...') : t('Upload Images')}
                  </Button>
                </>
              )}
            </Dialog.Content>
            <Dialog.Actions>
              <Button
                onPress={() => {
                  setImageModalOpen(false);
                  setSelectedImages([]);
                }}
              >
                {t('Cancel')}
              </Button>
            </Dialog.Actions>
          </Dialog>
          {/* Add Item Images Dialog */}
          <Dialog
            visible={itemImagesModalOpen}
            onDismiss={() => {
              setItemImagesModalOpen(false);
              setSelectedItemImages([]);
              setActiveItemForImages(null);
            }}
          >
            <Dialog.Title>{t('Add Item Images')}</Dialog.Title>
            <Dialog.Content>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginBottom: hp(2),
                }}
              >
                <Button
                  mode="contained"
                  onPress={pickProjectItemImages}
                  style={{ flex: 1, marginRight: wp(2) }}
                >
                  {t('Gallery')}
                </Button>
                <Button
                  mode="outlined"
                  onPress={takeProjectItemPhoto}
                  style={{ flex: 1 }}
                >
                  {t('Camera')}
                </Button>
              </View>
              {selectedItemImages.length > 0 && (
                <>
                  <Text style={{ marginVertical: hp(1) }}>
                    {t('Selected:')} {selectedItemImages.length} {t('image(s)')}
                  </Text>
                  <ScrollView horizontal style={{ maxHeight: hp(20) }}>
                    {selectedItemImages.map((uri, idx) => (
                      <View key={idx} style={styles.previewWrapper}>
                        <Image source={{ uri }} style={styles.previewImage} />
                        <TouchableOpacity
                          style={styles.removeBtn}
                          onPress={() => removeSelectedItemImage(idx)}
                        >
                          <MaterialCommunityIcons
                            name="close-circle"
                            size={wp(6)}
                            color="#e74c3c"
                          />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                  {itemImageUploading && (
                    <ProgressBar
                      indeterminate
                      style={{ marginVertical: hp(1) }}
                    />
                  )}
                  <Button
                    mode="contained"
                    onPress={uploadItemImages}
                    disabled={itemImageUploading}
                    style={styles.uploadBtn}
                    buttonColor="#27ae60"
                  >
                    {itemImageUploading
                      ? t('Uploading...')
                      : t('Upload Images')}
                  </Button>
                </>
              )}
            </Dialog.Content>
            <Dialog.Actions>
              <Button
                onPress={() => {
                  setItemImagesModalOpen(false);
                  setSelectedItemImages([]);
                  setActiveItemForImages(null);
                }}
              >
                {t('Cancel')}
              </Button>
            </Dialog.Actions>
          </Dialog>
          {/* Item Images Full View Modal */}
          <Modal
            visible={itemImagesViewerOpen}
            onDismiss={() => setItemImagesViewerOpen(false)}
            contentContainerStyle={styles.modalContainer}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('Items')}</Text>
                <TouchableOpacity
                  onPress={() => setItemImagesViewerOpen(false)}
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={wp(7)}
                    color="#fff"
                  />
                </TouchableOpacity>
              </View>
              {Array.isArray((activeItemForImages as any)?.images) && (
                <FlatList
                  data={(activeItemForImages as any).images.map(
                    (x: any) => x.imageUrl,
                  )}
                  renderItem={({
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
                        {index + 1} /{' '}
                        {(activeItemForImages as any).images.length}
                      </Text>
                    </View>
                  )}
                  keyExtractor={(_, i) => i.toString()}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  initialScrollIndex={selectedItemImageIndex}
                  getItemLayout={(_, index) => ({
                    length: width,
                    offset: width * index,
                    index,
                  })}
                />
              )}
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
  content: { paddingHorizontal: wp(4), paddingBottom: hp(15) },
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
  statusText: { color: '#fff', fontSize: wp(3.2), fontWeight: '600' },
  statusDialogLabel: {
    fontSize: wp(3.6),
    marginBottom: hp(1),
    color: '#555',
    fontWeight: '500',
  },
  statusOption: {
    borderRadius: wp(2),
    paddingHorizontal: wp(1),
    flexDirection: 'row',
    alignItems: 'center',
    //justifyContent: 'center',
  },
  statusOptionLabel: {
    //fontSize: wp(3.6),
    color: '#333',
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
  infoValue: { flex: 1, fontSize: wp(3.8), color: '#000' },
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
  amountLabel: { fontSize: wp(3.2), color: '#888' },
  amountValue: {
    fontSize: wp(4.2),
    fontWeight: 'bold',
    color: '#333',
    marginTop: hp(0.3),
  },
  divider: { width: 1, backgroundColor: '#ddd', marginHorizontal: wp(2) },
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
  descText: { fontSize: wp(3.8), color: '#555', lineHeight: wp(5.5) },
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
  sectionTitle: { fontSize: wp(4.4), fontWeight: '600', color: '#333' },
  viewAllText: { fontSize: wp(3.4), color: '#2874b8', fontWeight: '600' },
  imageScroll: { marginTop: hp(1) },
  thumbnailWrapper: { marginRight: wp(3) },
  thumbnail: { width: wp(28), height: wp(28), borderRadius: wp(2) },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: wp(2),
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    width: 24,
    height: 24,
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
  itemName: { fontWeight: '600', fontSize: wp(4) },
  itemDetails: { color: '#666', fontSize: wp(3.6), marginTop: hp(0.3) },
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
  paymentAmount: { fontWeight: '600', fontSize: wp(4) },
  paymentDate: { color: '#666', fontSize: wp(3.4) },
  chipText: { fontSize: wp(3) },
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
    justifyContent: 'space-between',
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
  recordingHeader: { flexDirection: 'row', alignItems: 'center' },
  recordingInfo: { flex: 1, marginLeft: wp(2) },
  recordingName: { fontSize: wp(3.8), fontWeight: '500', color: '#333' },
  recordingDate: { fontSize: wp(3.2), color: '#666', marginTop: hp(0.2) },
  playButton: { margin: 0, backgroundColor: '#E3F2FD', borderRadius: wp(10) },
  progressContainer: { marginTop: hp(1), marginLeft: wp(12) },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#2874b8' },
  timeText: { fontSize: wp(3.2), color: '#666', marginTop: hp(0.5) },
  downloadLink: { padding: wp(1) },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' },
  modalContent: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    backgroundColor: 'rgba(40,116,184,0.9)',
  },
  modalTitle: { fontSize: wp(5), fontWeight: '700', color: '#fff' },
  carouselItem: { width, justifyContent: 'center', alignItems: 'center' },
  carouselImage: { width: wp(90), height: hp(70) },
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
  actionButton: { margin: 0 },
  input: { marginBottom: hp(2) },
  button: { marginVertical: hp(1) },
  dropdown: {
    height: hp(7),
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: wp(2.5),
    paddingHorizontal: wp(3),
    backgroundColor: '#fff',
    marginBottom: hp(2),
  },
  dropdownPlaceholder: { fontSize: wp(4), color: '#999' },
  dropdownSelected: { fontSize: wp(4), color: '#000' },
  dropdownItem: { padding: wp(3) },
  dropdownItemText: { fontSize: wp(4) },
  previewWrapper: { marginRight: wp(2), position: 'relative' },
  previewImage: { width: wp(25), height: wp(25), borderRadius: wp(2) },
  removeBtn: { position: 'absolute', top: -wp(2), right: -wp(2) },
  uploadBtn: { marginTop: hp(2) },
});
export default ProjectDetails;
