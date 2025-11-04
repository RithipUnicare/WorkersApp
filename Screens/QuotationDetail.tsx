// screens/QuotationDetail.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Platform,
  Modal,
  Image,
  Linking,
  FlatList,
} from 'react-native';

import {
  Card,
  Chip,
  Button,
  IconButton,
  Portal,
  Dialog,
  ProgressBar,
  TextInput,
} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import dayjs from 'dayjs';
import { rootStackParamList } from '../navigation/AppNavigation';
import { QuotationAPI } from '../service/apiService';
import ItemDialog from './components/ItemDialog';
import { generatePDF } from 'react-native-html-to-pdf';
import { WebView } from 'react-native-webview';
import Share from 'react-native-share';
import RNFS from 'react-native-fs';
import generateHTML from '../utils/GenerateHTML';
import { Project } from './AdminProductList';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslator } from 'react-native-translator';
import Sound, { PlayBackType } from 'react-native-nitro-sound';
import {
  launchImageLibrary,
  launchCamera,
  ImagePickerResponse,
} from 'react-native-image-picker';
import { getLocation } from '../utils/GeoLocation';

const { width, height } = Dimensions.get('window');

type QuotationDetailsRouteProp = RouteProp<
  rootStackParamList,
  'QuotationDetail'
>;
type QuotationDetailsNavProp = NativeStackNavigationProp<
  rootStackParamList,
  'QuotationDetail'
>;

export type Quotation = {
  id: number;
  customerId: number;
  customerName: string;
  customerContactNo: string;
  customerAddress: string;
  projectDescription: string;
  deliveryDate: string;
  totalAmount: number;
  totalBudget: number;
  createdAt: string;
  updatedAt: string;
  discount: number;
  status?: string;
  address?: string;
  location?: {
    id: number;
    address: string;
    latitude: number;
    longitude: number;
  } | null;
  items: {
    id: number;
    quotationId: number | null;
    itemName: string;
    itemDescription: string | null;
    rateMrp: number;
    quantity: number;
    unit: {
      id: number;
      name: string;
      shortName: string;
    };
    taxPercentage: number;
    hsnSac: string;
    totalCost: number;
  }[];
  siteImages?: { id: number; imageUrl: string }[];
  voiceRecordings?: {
    id: number;
    name: string;
    url: string;
    createdAt: string;
  }[];
};

type PartialProject = {
  id: number;
  customerId: number;
  customerName: string;
  customerContactNo: string;
  customerAddress: string;
  deliveryDate: string;
  projectDescription: string;
  totalBudget: number;
  totalAmount: number;
  grandTotal: number;
  remainingAmount: number;
  discount?: number;
  projectItems: {
    id: number;
    itemName: string;
    quantity: number;
    rateMrp: number;
    totalCost: number;
    unitId?: number;
    taxPercentage?: number;
    hsnSac?: string;
  }[];
  status?: string;
  siteStatus?: string;
  customerTime?: string;
  remainingDays?: number;
  location?: null;
  siteImages?: [];
  advancePayments?: [];
};

const enToTa: Record<string, string> = {
  // Header & Status
  CREATED: 'உருவாக்கப்பட்டது',
  PENDING: 'நிலுவையில்',
  APPROVED: 'அனுமதிக்கப்பட்டது',
  REJECTED: 'நிராகரிக்கப்பட்டது',

  // Labels
  Contact: 'தொடர்பு',
  Address: 'முகவரி',
  'Delivery Date': 'விநியோக தேதி',
  Created: 'உருவாக்கப்பட்டது',
  'Total Amount': 'மொத்த தொகை',
  'Total Budget': 'மொத்த பட்ஜெட்',
  Description: 'விளக்கம்',
  'No description': 'விளக்கம் இல்லை',
  Items: 'பொருட்கள்',
  'No items': 'பொருட்கள் இல்லை',
  Qty: 'அளவு',
  Tax: 'வரி',
  'HSN/SAC': 'HSN/SAC',
  Total: 'மொத்தம்',

  // Buttons & Actions
  'Delete Quotation': 'மேற்கோளை நீக்கு',
  'Are you sure?': 'நிச்சயமா?',
  Cancel: 'ரத்து செய்',
  Delete: 'நீக்கு',
  Error: 'பிழை',
  'Failed to delete': 'நீக்க முடியவில்லை',
  'Quotation Preview': 'மேற்கோள் முன்னோட்டம்',
  Close: 'மூடு',
  'Generate & Share PDF': 'PDF உருவாக்கி பகிரவும்',

  // Tooltips (optional)
  Edit: 'திருத்து',
  Share: 'பகிரவும்',
  'Convert to Project': 'திட்டமாக மாற்று',
};

const QuotationDetail: React.FC = () => {
  const route = useRoute<QuotationDetailsRouteProp>();
  const navigation = useNavigation<QuotationDetailsNavProp>();
  const initialQuotation: Quotation = route.params.quotation;
  const [quotationData, setQuotationData] =
    useState<Quotation>(initialQuotation);
  const [pdfModalVisible, setPdfModalVisible] = useState(false);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [htmlContent, setHtmlContent] = useState('');

  const [imageUploading, setImageUploading] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [siteImagesViewerOpen, setSiteImagesViewerOpen] = useState(false);
  const [selectedSiteImageIndex, setSelectedSiteImageIndex] = useState(0);

  // Item images state
  const [itemImagesModalOpen, setItemImagesModalOpen] = useState(false);
  const [activeItemForImages, setActiveItemForImages] = useState<any | null>(
    null,
  );
  const [selectedItemImages, setSelectedItemImages] = useState<string[]>([]);
  const [itemImageUploading, setItemImageUploading] = useState(false);
  const [itemImagesViewerOpen, setItemImagesViewerOpen] = useState(false);
  const [selectedItemImageIndex, setSelectedItemImageIndex] = useState(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [playTime, setPlayTime] = useState('00:00:00');
  const [duration, setDuration] = useState('00:00:00');
  const [currentUrl, setCurrentUrl] = useState<string>('');

  const [isTamil, setIsTamil] = useState(false);
  const [translations, setTranslations] = useState<Record<string, string>>({});

  const { translate } = useTranslator();

  const openGoogleMaps = (
    latitude: number,
    longitude: number,
    label = 'Site',
  ) => {
    const scheme = Platform.select({
      ios: 'maps:0,0?q=',
      android: 'geo:0,0?q=',
    });
    const latLng = `${latitude},${longitude}`;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
    })!;
    Linking.openURL(url).catch(() => {});
  };

  // Initialize language
  useEffect(() => {
    const initLang = async () => {
      const saved = await AsyncStorage.getItem('appLanguage');
      const tamil = saved === 'ta';
      setIsTamil(tamil);
    };
    initLang();
  }, []);

  // Translate when Tamil is enabled
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

  const formatDate = (date: string) => dayjs(date).format('DD-MM-YYYY');

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      try {
        const res = await QuotationAPI.getById(quotationData.id);
        if (res?.data) {
          setQuotationData(res.data);
        }
      } catch (e) {
        console.warn('Failed to reload quotation', e);
      }
    });
    return unsubscribe;
  }, [navigation, quotationData.id]);

  const reloadQuotation = useCallback(async () => {
    try {
      const res = await QuotationAPI.getById(quotationData.id);
      if (res?.data) setQuotationData(res.data);
    } catch {}
  }, [quotationData.id]);

  useEffect(() => {
    const playbackListener = Sound.addPlayBackListener((e: PlayBackType) => {
      setPlayTime(Sound.mmssss(Math.floor(e.currentPosition)));
      if (e.duration > 0) setDuration(Sound.mmssss(Math.floor(e.duration)));
    });
    const endListener = Sound.addPlaybackEndListener(() => {
      setIsPlaying(false);
      setPlayTime('00:00:00');
      setCurrentUrl('');
    });
    return () => {
      (playbackListener as any)?.remove?.();
      (endListener as any)?.remove?.();
    };
  }, []);

  const handleRecordVoice = () => {
    navigation.navigate('RecoredAudio', { quotation: quotationData });
  };

  const [gpsModalVisible, setGpsModalVisible] = useState(false);
  const [gpsAddress, setGpsAddress] = useState('');

  const updateGPS = async () => {
    try {
      const loc: any = await getLocation();
      if (loc?.address && loc?.pos) {
        const newLocation = {
          address: gpsAddress || loc.address,
          latitude: loc.pos.coords.latitude,
          longitude: loc.pos.coords.longitude,
        };
        await QuotationAPI.updateLocation(quotationData.id, newLocation);
        setQuotationData(prev => ({
          ...prev,
          location: { id: Date.now(), ...newLocation },
        }));
        setGpsModalVisible(false);
        setGpsAddress('');
        Alert.alert('Success', 'Location updated');
        await reloadQuotation();
      } else {
        Alert.alert('Error', 'Could not fetch location');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to update location');
    }
  };

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
        Alert.alert('Error', 'Could not play audio');
      }
    },
    [isPlaying, currentUrl],
  );

  const pickImages = () => {
    launchImageLibrary(
      { mediaType: 'photo', quality: 0.7, selectionLimit: 10 },
      (response: ImagePickerResponse) => {
        if (response.didCancel) return;
        if (response.errorCode) {
          Alert.alert('Error', response.errorMessage || 'Image pick failed');
          return;
        }
        const uris = response.assets?.map(a => a.uri!).filter(Boolean) || [];
        setSelectedImages(prev => [...prev, ...uris]);
      },
    );
  };

  const takePhoto = () => {
    launchCamera(
      { mediaType: 'photo', quality: 0.7 },
      (response: ImagePickerResponse) => {
        if (response.didCancel) return;
        if (response.errorCode) {
          Alert.alert('Error', response.errorMessage || 'Camera failed');
          return;
        }
        const uri = response.assets?.[0]?.uri;
        if (uri) setSelectedImages(prev => [...prev, uri]);
      },
    );
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadSiteImages = async () => {
    if (selectedImages.length === 0) return;
    setImageUploading(true);
    try {
      const res = await QuotationAPI.addSiteImages(
        quotationData.id,
        selectedImages,
      );
      if (res?.data) {
        await reloadQuotation();
        setSelectedImages([]);
        Alert.alert('Success', `${res.data.length} image(s) uploaded`);
      }
    } catch (e: any) {
      Alert.alert('Upload Failed', e.message || 'Could not upload images');
    } finally {
      setImageUploading(false);
    }
  };

  // Item actions
  const openAddItem = () => {
    setEditingItem(null);
    setItemModalOpen(true);
  };
  const openEditItem = (item: any) => {
    setEditingItem(item);
    setItemModalOpen(true);
  };
  const confirmDeleteItem = (itemId: number) => {
    Alert.alert(t('Delete'), t('Are you sure?'), [
      { text: t('Cancel') },
      {
        text: t('Delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await QuotationAPI.deleteItem(itemId);
            await reloadQuotation();
          } catch (e) {
            Alert.alert(t('Error'), t('Failed to delete'));
          }
        },
      },
    ]);
  };

  // Item images helpers
  const openItemImages = (item: any) => {
    setActiveItemForImages(item);
    setSelectedItemImages([]);
    setItemImagesModalOpen(true);
  };
  const pickItemImages = () => {
    launchImageLibrary(
      { mediaType: 'photo', quality: 0.7, selectionLimit: 10 },
      (response: ImagePickerResponse) => {
        if (response.didCancel) return;
        if (response.errorCode) {
          Alert.alert('Error', response.errorMessage || 'Image pick failed');
          return;
        }
        const uris = response.assets?.map(a => a.uri!).filter(Boolean) || [];
        setSelectedItemImages(prev => [...prev, ...uris]);
      },
    );
  };
  const takeItemPhoto = () => {
    launchCamera(
      { mediaType: 'photo', quality: 0.7 },
      (response: ImagePickerResponse) => {
        if (response.didCancel) return;
        if (response.errorCode) {
          Alert.alert('Error', response.errorMessage || 'Camera failed');
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
      const res = await QuotationAPI.addItemImages(
        activeItemForImages.id,
        selectedItemImages,
      );
      if (res?.data) {
        await reloadQuotation();
        setSelectedItemImages([]);
        Alert.alert('Success', `${res.data.length} image(s) uploaded`);
      }
    } catch (e: any) {
      Alert.alert('Upload Failed', e.message || 'Could not upload images');
    } finally {
      setItemImageUploading(false);
    }
  };
  const deleteItemImage = async (itemId: number, imageId: number) => {
    try {
      await QuotationAPI.deleteItemImage(itemId, imageId);
      await reloadQuotation();
    } catch (e) {
      Alert.alert(t('Error'), t('Failed to delete'));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return '#FFC107';
      case 'APPROVED':
        return '#4CAF50';
      case 'REJECTED':
        return '#e74c3c';
      case 'CREATED':
      default:
        return '#9E9E9E';
    }
  };

  const getStatusText = (status: string) => {
    return t(status?.toUpperCase() || 'CREATED');
  };

  const handleEdit = () => {
    navigation.navigate('AddQuotation', { quotationToEdit: quotationData });
  };

  const handleDelete = () => {
    Alert.alert(t('Delete Quotation'), t('Are you sure?'), [
      { text: t('Cancel') },
      {
        text: t('Delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await QuotationAPI.delete(quotationData.id);
            navigation.goBack();
          } catch (e) {
            Alert.alert(t('Error'), t('Failed to delete'));
          }
        },
      },
    ]);
  };

  const handleConvertToProject = () => {
    const projectToEdit: Project = {
      id: quotationData.id,
      customerId: quotationData.customerId,
      customerName: quotationData.customerName,
      customerContactNo: quotationData.customerContactNo,
      customerAddress: quotationData.customerAddress,
      deliveryDate: quotationData.deliveryDate,
      projectDescription: quotationData.projectDescription,
      totalBudget: quotationData.totalBudget,
      totalAmount: quotationData.totalBudget - quotationData.discount,
      grandTotal: quotationData.totalAmount,
      remainingAmount: 0,
      discount: quotationData.discount,
      projectItems: quotationData.items.map(item => ({
        id: item.id,
        itemName: item.itemName,
        quantity: item.quantity,
        rateMrp: item.rateMrp,
        totalCost: item.totalCost,
        unitId: item.unit.id,
        taxPercentage: item.taxPercentage,
        hsnSac: item.hsnSac,
      })),
      status: 'CREATED',
      siteStatus: 'CREATED',
      customerTime: '',
      remainingDays: 0,
      location: quotationData.location || null,
      siteImages: [],
      advancePayments: [],
    };
    navigation.navigate('AddProject', { projectToEdit });
  };

  const shareQuotationPDF = async () => {
    const html = generateHTML(quotationData);
    setHtmlContent(html);
    setPdfModalVisible(true);
  };

  const generateAndSharePDF = async () => {
    try {
      const options = {
        html: htmlContent,
        fileName: `${quotationData.customerName}_Quotation`,
        directory: 'Documents',
      };
      const { filePath } = await generatePDF(options);

      const fileName = `${quotationData.customerName}_Quotation.pdf`;
      const downloadsPath =
        Platform.OS === 'android'
          ? `${RNFS.DownloadDirectoryPath}/${fileName}`
          : `${RNFS.DocumentDirectoryPath}/${fileName}`;

      await RNFS.copyFile(filePath, downloadsPath);

      await Share.open({
        title: `Quotation - ${quotationData.customerName}`,
        message: `Quotation for ${quotationData.customerName}`,
        url: `file://${downloadsPath}`,
      });

      await RNFS.unlink(filePath);
    } catch (error) {
      console.error('PDF/Share Error:', error);
      Alert.alert(t('Error'), 'Failed to generate or share PDF');
    } finally {
      setPdfModalVisible(false);
    }
  };

  const sortedVoiceRecordings = quotationData.voiceRecordings
    ? quotationData.voiceRecordings
        .slice()
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
    : [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <Card style={styles.headerCard}>
          <View style={styles.headerRow}>
            <Text style={styles.name}>{quotationData.customerName}</Text>
            <Chip
              style={[
                styles.statusChip,
                {
                  backgroundColor: getStatusColor(
                    quotationData.status || 'CREATED',
                  ),
                },
              ]}
              textStyle={styles.statusText}
            >
              {getStatusText(quotationData.status || 'CREATED')}
            </Chip>
          </View>
        </Card>

        {/* Details */}
        <Card style={styles.detailsCard}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="phone"
              size={width * 0.05}
              color="#0a411fff"
            />
            <Text style={styles.infoLabel}>{t('Contact')}</Text>
            <Text style={styles.infoValue}>
              {quotationData.customerContactNo || 'N/A'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="map-marker"
              size={width * 0.05}
              color="#0a411fff"
            />
            <Text style={styles.infoLabel}>{t('Address')}</Text>
            <Text style={styles.infoValue} numberOfLines={2}>
              {quotationData.customerAddress}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="map-marker"
              size={width * 0.05}
              color="#0a411fff"
            />
            <Text style={styles.infoLabel}>{t('Location')}</Text>
            <TouchableOpacity
              style={{ flex: 1 }}
              activeOpacity={0.7}
              onPress={() => {
                const loc = quotationData.location;
                if (loc?.latitude && loc?.longitude) {
                  openGoogleMaps(loc.latitude, loc.longitude, 'Site');
                }
              }}
            >
              <Text style={styles.infoValue} numberOfLines={2}>
                {quotationData.location?.address || 'Not set'}
              </Text>
            </TouchableOpacity>
            <IconButton
              icon="map-marker-plus"
              onPress={() => setGpsModalVisible(true)}
              iconColor="#0a411fff"
            />
          </View>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="calendar"
              size={width * 0.05}
              color="#0a411fff"
            />
            <Text style={styles.infoLabel}>{t('Delivery Date')}</Text>
            <Text style={styles.infoValue}>
              {formatDate(quotationData.deliveryDate)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="clock"
              size={width * 0.05}
              color="#0a411fff"
            />
            <Text style={styles.infoLabel}>{t('Created')}</Text>
            <Text style={styles.infoValue}>
              {dayjs(quotationData.createdAt).format('DD-MM-YYYY HH:mm')}
            </Text>
          </View>
        </Card>

        {/* Amounts */}
        <Card style={styles.amountCard}>
          <View style={styles.amountRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.amountLabel}>{t('Total Amount')}</Text>
              <Text style={styles.amountValue}>
                ₹
                {(
                  quotationData.totalBudget - quotationData.discount
                ).toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={{ flex: 1 }}>
              <Text style={styles.amountLabel}>{t('Total Budget')}</Text>
              <Text style={styles.amountValue}>
                ₹{quotationData.totalBudget?.toLocaleString('en-IN') || 0}
              </Text>
            </View>
          </View>
        </Card>

        {/* Description */}
        <Card style={styles.descCard}>
          <Text style={styles.descTitle}>{t('Description')}</Text>
          <Text style={styles.descText}>
            {quotationData.projectDescription || t('No description')}
          </Text>
        </Card>

        {/* Site Images */}
        {quotationData.siteImages && quotationData.siteImages.length > 0 ? (
          <Card style={styles.itemsCard}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text style={styles.sectionTitle}>
                Site Images ({quotationData.siteImages.length})
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Button
                  mode="text"
                  onPress={() => {
                    setSelectedSiteImageIndex(0);
                    setSiteImagesViewerOpen(true);
                  }}
                >
                  View All
                </Button>
                <IconButton
                  icon="plus"
                  onPress={() => setImageModalOpen(true)}
                  iconColor="#0a411fff"
                />
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {quotationData.siteImages.map((img, idx) => (
                <TouchableOpacity
                  key={img.id}
                  onPress={() => {
                    setSelectedSiteImageIndex(idx);
                    setSiteImagesViewerOpen(true);
                  }}
                >
                  <View style={{ marginRight: 10 }}>
                    <Image
                      source={{ uri: img.imageUrl }}
                      style={{
                        width: width * 0.35,
                        height: width * 0.35,
                        borderRadius: 8,
                      }}
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Card>
        ) : (
          <Card style={styles.itemsCard}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text style={styles.sectionTitle}>Site Images (0)</Text>
              <IconButton
                icon="plus"
                onPress={() => setImageModalOpen(true)}
                iconColor="#0a411fff"
              />
            </View>
            <Text style={styles.emptyText}>No site images available</Text>
          </Card>
        )}

        {/* Voice Recordings */}
        {sortedVoiceRecordings.length > 0 ? (
          <Card style={styles.itemsCard}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <MaterialCommunityIcons
                name="microphone"
                size={width * 0.06}
                color="#0a411fff"
              />
              <Text style={[styles.sectionTitle, { marginLeft: 8 }]}>
                Voice Recordings ({sortedVoiceRecordings.length})
              </Text>
              <IconButton
                icon="plus"
                onPress={handleRecordVoice}
                iconColor="#0a411fff"
              />
            </View>
            {sortedVoiceRecordings.map(recording => (
              <View
                key={recording.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 8,
                }}
              >
                <IconButton
                  icon={
                    isPlaying && currentUrl === recording.url ? 'pause' : 'play'
                  }
                  onPress={() => togglePlayback(recording.url)}
                />
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1}>{recording.name}</Text>
                  <Text>
                    {dayjs(recording.createdAt).format('DD-MM-YYYY HH:mm')}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => Linking.openURL(recording.url)}
                >
                  <MaterialCommunityIcons
                    name="download"
                    size={width * 0.05}
                    color="#0a411fff"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert(t('Delete'), t('Are you sure?'), [
                      { text: t('Cancel'), style: 'cancel' },
                      {
                        text: t('Delete'),
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            const res = await QuotationAPI.deleteVoiceRecording(
                              quotationData.id,
                              recording.id,
                            );
                            console.log(res);
                            await reloadQuotation();
                          } catch (e) {
                            Alert.alert(t('Error'), t('Failed to delete'));
                          }
                        },
                      },
                    ])
                  }
                  style={{ marginLeft: 8 }}
                >
                  <MaterialCommunityIcons
                    name="delete"
                    size={width * 0.05}
                    color="#e74c3c"
                  />
                </TouchableOpacity>
              </View>
            ))}
          </Card>
        ) : (
          <Card style={styles.itemsCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialCommunityIcons
                name="microphone"
                size={width * 0.06}
                color="#0a411fff"
              />
              <Text style={[styles.sectionTitle, { marginLeft: 8 }]}>
                Voice Recordings (0)
              </Text>
              <IconButton
                icon="plus"
                onPress={handleRecordVoice}
                iconColor="#0a411fff"
              />
            </View>
            <Text style={styles.emptyText}>No Voice Recording</Text>
          </Card>
        )}

        {/* Items */}
        <Card style={styles.itemsCard}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text style={styles.sectionTitle}>{t('Items')}</Text>
            <IconButton
              icon="plus"
              onPress={openAddItem}
              iconColor="#0a411fff"
            />
          </View>
          {quotationData.items.length === 0 ? (
            <Text style={styles.emptyText}>{t('No items')}</Text>
          ) : (
            quotationData.items.map(item => (
              <View key={item.id} style={styles.itemRow}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text style={styles.itemName}>{item.itemName}</Text>
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
                </View>
                {item.itemDescription && (
                  <Text style={styles.itemDesc}>{item.itemDescription}</Text>
                )}
                <Text style={styles.itemDetails}>
                  {t('Qty')}: {item.quantity} {item.unit.shortName} × ₹
                  {item.rateMrp} | {t('Tax')}: {item.taxPercentage}% |{' '}
                  {t('HSN/SAC')}: {item.hsnSac} | {t('Total')}: ₹
                  {item.totalCost.toLocaleString('en-IN')}
                </Text>
                {Array.isArray((item as any).images) &&
                  (item as any).images.length > 0 && (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={{ marginTop: 8 }}
                    >
                      {(item as any).images.map((img: any, imgIdx: number) => (
                        <View key={img.id} style={{ marginRight: 10 }}>
                          <TouchableOpacity
                            onPress={() => {
                              setActiveItemForImages(item);
                              setSelectedItemImageIndex(imgIdx);
                              setItemImagesViewerOpen(true);
                            }}
                          >
                            <Image
                              source={{ uri: img.imageUrl }}
                              style={{
                                width: width * 0.28,
                                height: width * 0.28,
                                borderRadius: 8,
                              }}
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => deleteItemImage(item.id, img.id)}
                            style={{ position: 'absolute', top: -6, right: -6 }}
                          >
                            <MaterialCommunityIcons
                              name="close-circle"
                              size={22}
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
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <IconButton
          icon="pencil"
          onPress={handleEdit}
          style={styles.actionButton}
          contentStyle={styles.actionButtonContent}
          iconColor="#0a411fff"
        />
        <IconButton
          icon="delete"
          onPress={handleDelete}
          style={styles.actionButton}
          contentStyle={styles.actionButtonContent}
          iconColor="#e74c3c"
        />
        <IconButton
          icon="share"
          onPress={shareQuotationPDF}
          style={styles.actionButton}
          contentStyle={styles.actionButtonContent}
          iconColor="#0a411fff"
        />
        <IconButton
          icon="plus"
          onPress={handleConvertToProject}
          style={styles.actionButton}
          contentStyle={styles.actionButtonContent}
          iconColor="#0a411fff"
        />
      </View>

      {/* Add Item Dialog */}
      <ItemDialog
        visible={itemModalOpen}
        onDismiss={() => {
          setItemModalOpen(false);
          setEditingItem(null);
        }}
        mode="quotation"
        quotationId={quotationData.id}
        item={editingItem || undefined}
        onSaved={() => {
          setItemModalOpen(false);
          setEditingItem(null);
          reloadQuotation();
        }}
        title={editingItem ? t('Edit') : t('Add Item')}
        t={t}
      />

      {/* PDF Preview Modal */}
      <Modal
        visible={pdfModalVisible}
        onDismiss={() => setPdfModalVisible(false)}
        animationType="slide"
      >
        <View style={styles.pdfModalContainer}>
          <View style={styles.pdfModalHeader}>
            <Text style={styles.pdfModalTitle}>{t('Quotation Preview')}</Text>
            <TouchableOpacity onPress={() => setPdfModalVisible(false)}>
              <MaterialCommunityIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <WebView
            source={{ html: htmlContent }}
            style={styles.webView}
            startInLoadingState={true}
          />
          <View style={styles.pdfModalActions}>
            <Button
              mode="outlined"
              onPress={() => setPdfModalVisible(false)}
              style={styles.pdfButton}
            >
              {t('Close')}
            </Button>
            <Button
              mode="contained"
              onPress={generateAndSharePDF}
              style={styles.pdfButton}
              buttonColor="#0a411fff"
            >
              {t('Generate & Share PDF')}
            </Button>
          </View>
        </View>
      </Modal>
      {/* Full-screen viewers using RN Modal */}
      <Modal
        visible={siteImagesViewerOpen}
        onRequestClose={() => setSiteImagesViewerOpen(false)}
        animationType="fade"
        transparent={false}
      >
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <View style={styles.modalHeaderLike}>
            <Text style={styles.modalTitleLike}>Site Images</Text>
            <TouchableOpacity onPress={() => setSiteImagesViewerOpen(false)}>
              <MaterialCommunityIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          {quotationData.siteImages && (
            <FlatList
              data={quotationData.siteImages.map(x => x.imageUrl)}
              renderItem={({
                item,
                index,
              }: {
                item: string;
                index: number;
              }) => (
                <View style={styles.carouselItemLike}>
                  <Image
                    source={{ uri: item }}
                    style={styles.carouselImageLike}
                    resizeMode="contain"
                  />
                  <Text style={styles.imageCounterLike}>
                    {index + 1} / {quotationData.siteImages!.length}
                  </Text>
                </View>
              )}
              keyExtractor={(_, i) => i.toString()}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              initialScrollIndex={selectedSiteImageIndex}
              getItemLayout={(_, index) => ({
                length: width,
                offset: width * index,
                index,
              })}
            />
          )}
        </View>
      </Modal>

      <Modal
        visible={itemImagesViewerOpen}
        onRequestClose={() => setItemImagesViewerOpen(false)}
        animationType="fade"
        transparent={false}
      >
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <View style={styles.modalHeaderLike}>
            <Text style={styles.modalTitleLike}>Item Images</Text>
            <TouchableOpacity onPress={() => setItemImagesViewerOpen(false)}>
              <MaterialCommunityIcons name="close" size={24} color="#fff" />
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
                <View style={styles.carouselItemLike}>
                  <Image
                    source={{ uri: item }}
                    style={styles.carouselImageLike}
                    resizeMode="contain"
                  />
                  <Text style={styles.imageCounterLike}>
                    {index + 1} / {(activeItemForImages as any).images.length}
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
      {/* Add Site Images Dialog */}
      <Portal>
        <Dialog
          visible={imageModalOpen}
          onDismiss={() => {
            setImageModalOpen(false);
            setSelectedImages([]);
          }}
        >
          <Dialog.Title>Add Site Images</Dialog.Title>
          <Dialog.Content>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <Button
                mode="contained"
                onPress={pickImages}
                style={{ flex: 1, marginRight: 8 }}
              >
                Gallery
              </Button>
              <Button mode="outlined" onPress={takePhoto} style={{ flex: 1 }}>
                Camera
              </Button>
            </View>

            {selectedImages.length > 0 && (
              <>
                <Text style={{ marginVertical: 8 }}>
                  Selected: {selectedImages.length} image(s)
                </Text>
                <ScrollView horizontal style={{ maxHeight: 180 }}>
                  {selectedImages.map((uri, idx) => (
                    <View
                      key={idx}
                      style={{ marginRight: 8, position: 'relative' }}
                    >
                      <Image
                        source={{ uri }}
                        style={{ width: 120, height: 120, borderRadius: 8 }}
                      />
                      <TouchableOpacity
                        style={{ position: 'absolute', top: -6, right: -6 }}
                        onPress={() => removeImage(idx)}
                      >
                        <MaterialCommunityIcons
                          name="close-circle"
                          size={22}
                          color="#e74c3c"
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>

                {imageUploading && (
                  <ProgressBar indeterminate style={{ marginVertical: 8 }} />
                )}

                <Button
                  mode="contained"
                  onPress={uploadSiteImages}
                  disabled={imageUploading}
                  style={{ marginTop: 8 }}
                  buttonColor="#27ae60"
                >
                  {imageUploading ? 'Uploading...' : 'Upload Images'}
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
              Cancel
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Add Item Images Dialog */}
      <Portal>
        <Dialog
          visible={itemImagesModalOpen}
          onDismiss={() => {
            setItemImagesModalOpen(false);
            setSelectedItemImages([]);
            setActiveItemForImages(null);
          }}
        >
          <Dialog.Title>Add Item Images</Dialog.Title>
          <Dialog.Content>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <Button
                mode="contained"
                onPress={pickItemImages}
                style={{ flex: 1, marginRight: 8 }}
              >
                Gallery
              </Button>
              <Button
                mode="outlined"
                onPress={takeItemPhoto}
                style={{ flex: 1 }}
              >
                Camera
              </Button>
            </View>

            {selectedItemImages.length > 0 && (
              <>
                <Text style={{ marginVertical: 8 }}>
                  Selected: {selectedItemImages.length} image(s)
                </Text>
                <ScrollView horizontal style={{ maxHeight: 180 }}>
                  {selectedItemImages.map((uri, idx) => (
                    <View
                      key={idx}
                      style={{ marginRight: 8, position: 'relative' }}
                    >
                      <Image
                        source={{ uri }}
                        style={{ width: 120, height: 120, borderRadius: 8 }}
                      />
                      <TouchableOpacity
                        style={{ position: 'absolute', top: -6, right: -6 }}
                        onPress={() => removeSelectedItemImage(idx)}
                      >
                        <MaterialCommunityIcons
                          name="close-circle"
                          size={22}
                          color="#e74c3c"
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>

                {itemImageUploading && (
                  <ProgressBar indeterminate style={{ marginVertical: 8 }} />
                )}

                <Button
                  mode="contained"
                  onPress={uploadItemImages}
                  disabled={itemImageUploading}
                  style={{ marginTop: 8 }}
                  buttonColor="#27ae60"
                >
                  {itemImageUploading ? 'Uploading...' : 'Upload Images'}
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
              Close
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      {/* GPS Update Dialog */}
      <Portal>
        <Dialog
          visible={gpsModalVisible}
          onDismiss={() => setGpsModalVisible(false)}
        >
          <Dialog.Title>Update GPS Location</Dialog.Title>
          <Dialog.Content>
            <TextInput
              mode="outlined"
              label="Address (Optional)"
              value={gpsAddress}
              onChangeText={setGpsAddress}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setGpsModalVisible(false)}>Cancel</Button>
            <Button onPress={updateGPS}>Fetch & Update GPS</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  itemsCard: {
    padding: width * 0.04,
    backgroundColor: '#fff',
    borderRadius: width * 0.03,
    elevation: 2,
    marginBottom: height * 0.02,
  },
  sectionTitle: {
    fontSize: width * 0.042,
    fontWeight: '600',
    color: '#333',
    marginBottom: height * 0.015,
  },
  itemRow: {
    paddingVertical: height * 0.015,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemName: { fontWeight: '600', fontSize: width * 0.038 },
  itemDesc: {
    fontSize: width * 0.034,
    color: '#666',
    marginTop: 2,
    fontStyle: 'italic',
  },
  itemDetails: { color: '#666', fontSize: width * 0.032, marginTop: 4 },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    marginVertical: height * 0.02,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    elevation: 3,
  },
  actionButton: { flex: 0.22 },
  actionButtonContent: { paddingVertical: 4 },
  pdfModalContainer: { flex: 1, backgroundColor: '#fff' },
  pdfModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#0a411fff',
  },
  pdfModalTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  webView: { flex: 1 },
  pdfModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  pdfButton: { flex: 1, marginHorizontal: 8 },
  modalHeaderLike: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0a411fff',
  },
  modalTitleLike: { fontSize: 18, fontWeight: '700', color: '#fff' },
  carouselItemLike: {
    width,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  carouselImageLike: { width: width * 0.9, height: height * 0.7 },
  imageCounterLike: {
    position: 'absolute',
    bottom: 30,
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    fontWeight: '600',
  },
});

export default QuotationDetail;
