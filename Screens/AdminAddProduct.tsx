import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  RefreshControl,
  ToastAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  TextInput,
  Button,
  Portal,
  Dialog,
  FAB,
  IconButton,
  Card,
  Snackbar,
  Chip,
} from 'react-native-paper';
import ItemDialog from './components/ItemDialog';
import { rootStackParamList } from '../navigation/AppNavigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import dayjs from 'dayjs';
import DatePicker from 'react-native-date-picker';
import { RouteProp } from '@react-navigation/native';
import { getLocation } from '../utils/GeoLocation';
import { Dropdown } from 'react-native-element-dropdown';
import {
  ProjectAPI,
  CustomerAPI,
  UnitAPI,
  QuotationAPI,
} from '../service/apiService';
import { useNavigationState } from '@react-navigation/native';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslator } from 'react-native-translator';
import { Project } from './AdminProductList';

dayjs.extend(customParseFormat);

const { width, height } = Dimensions.get('window');
const wp = (percentage: number) => (width * percentage) / 100;
const hp = (percentage: number) => (height * percentage) / 100;

type Props = {
  navigation: NativeStackNavigationProp<rootStackParamList, 'AddProject'>;
  route: RouteProp<rootStackParamList, 'AddProject'>;
};

export type ProjectItem = {
  id?: number;
  projectId: number;
  itemName: string;
  itemDescription?: string;
  rateMrp: number;
  quantity: number;
  amount?: number;
  unitId: number;
  taxPercentage: number;
  hsnSac: string;
  images?: any[];
};

export type Unit = {
  id: number;
  name: string;
  shortName: string;
};

const enToTa: Record<string, string> = {
  // Titles
  'Create New Project': 'புதிய திட்டத்தை உருவாக்கு',
  'Edit Project': 'திட்டத்தைத் திருத்து',

  // Labels
  Customer: 'வாடிக்கையாளர்',
  'Select Customer *': 'வாடிக்கையாளரைத் தேர்ந்தெடு *',
  'Delivery Date *': 'விநியோக தேதி *',
  'Project Description *': 'திட்ட விளக்கம் *',
  'Total Budjet *': 'மொத்த பட்ஜெட் *',
  'Total Amount *': 'மொத்த தொகை *',
  Discount: 'தள்ளுபடி',
  Percentage: 'விழுக்காடு',
  'Site Location': 'தள இடம்',
  'Preferred Time': 'விருப்பமான நேரம்',
  'Select Status': 'நிலையைத் தேர்ந்தெடு',
  'Site Images': 'தள படங்கள்',
  Gallery: 'கேலரி',
  Camera: 'கேமரா',
  'Project Items': 'திட்டப் பொருட்கள்',
  Total: 'மொத்தம்',
  'No items added yet': 'இதுவரை பொருட்கள் சேர்க்கப்படவில்லை',
  'Update Project': 'திட்டத்தைப் புதுப்பி',
  'Save Project': 'திட்டத்தைச் சேமி',

  // Item Dialog
  'Add Item': 'பொருளைச் சேர்',
  'Edit Item': 'பொருளைத் திருத்து',
  'Item Name *': 'பொருள் பெயர் *',
  Description: 'விளக்கம்',
  'Quantity *': 'அளவு *',
  'Rate (MRP) *': 'விலை (MRP) *',
  'Unit *': 'அலகு *',
  'Tax Percentage *': 'வரி விழுக்காடு *',
  'HSN/SAC Code': 'HSN/SAC குறியீடு',
  Save: 'சேமி',
  Cancel: 'ரத்து செய்',

  // Unit Dialog
  'Add New Unit': 'புதிய அலகு சேர்',
  'Unit Name': 'அலகு பெயர்',
  'Short Name': 'குறுகிய பெயர்',
  Add: 'சேர்',

  // Advance Dialog
  'Add Advance Payment': 'முன்பணம் சேர்',
  'Advance Amount': 'முன்பண தொகை',
  Skip: 'தவிர்',

  // Messages
  'Fill all required fields': 'அனைத்து தேவையான புலங்களையும் நிரப்பு',
  'Select a valid customer': 'சரியான வாடிக்கையாளரைத் தேர்ந்தெடு',
  'Enter at least one item': 'குறைந்தது ஒரு பொருளை உள்ளிடு',
  'Project updated!': 'திட்டம் புதுப்பிக்கப்பட்டது!',
  'Project Created Successfully': 'திட்டம் வெற்றிகரமாக உருவாக்கப்பட்டது',
  'Save failed': 'சேமிப்பு தோல்வியடைந்தது',
  'Location captured!': 'இடம் பிடிக்கப்பட்டது!',
  'Failed to get location': 'இடத்தைப் பெற முடியவில்லை',
  'Max 15 images allowed': 'அதிகபட்சம் 15 படங்கள் மட்டுமே அனுமதி',
  'Fill unit name and short name': 'அலகு பெயர் மற்றும் குறுகிய பெயரை நிரப்பு',
  'Unit added!': 'அலகு சேர்க்கப்பட்டது!',
  'Failed to add unit': 'அலகு சேர்க்க முடியவில்லை',
  'Failed to add item': 'பொருள் சேர்க்க முடியவில்லை',
  'Failed to delete image': 'படத்தை நீக்க முடியவில்லை',
  'Failed to save advance': 'முன்பணத்தைச் சேமிக்க முடியவில்லை',

  // Status
  CREATED: 'உருவாக்கப்பட்டது',
  IN_PROGRESS: 'செயல்பாட்டில்',
  DISCONTINUED: 'நிறுத்தப்பட்டது',
  COMPLETED: 'முடிக்கப்பட்டது',
};

const AddProject: React.FC<Props> = ({ navigation, route }) => {
  const rawCustomer: any = route.params?.customer || null;
  const rawProject: any =
    route.params?.projectToEdit || route.params?.productEdit;
  //const routeLength = useNavigationState(state => state.routes.length);
  let previousScreenName = '';
  // if (routeLength > 1) {
  //   previousScreenName = useNavigationState(state => state.routes[state.index - 1].name);
  // }
  previousScreenName = useNavigationState(
    state => state.routes[state.index - 1].name,
  );

  const isFromQuotationDetail = previousScreenName === 'QuotationDetail';
  const isEditMode = !!rawProject && !isFromQuotationDetail;
  const isFromInquiry = !!rawCustomer && !isEditMode && !isFromQuotationDetail;

  const [customerId, setCustomerId] = useState<number | null>(null);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [images, setImages] = useState<
    { uri: string; id?: number; isLocal: boolean }[]
  >([]);
  const [fullLocation, setFullLocation] = useState<{
    address: string;
    latitude: number;
    longitude: number;
  }>({ address: '', latitude: 0, longitude: 0 });

  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerIdx, setSelectedCustomerIdx] = useState<number | null>(
    null,
  );
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [selectedDateObj, setSelectedDateObj] = useState<Date>(new Date());
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [time, setTime] = useState('');

  const [items, setItems] = useState<ProjectItem[]>([]);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProjectItem | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemQty, setItemQty] = useState('');
  const [itemRate, setItemRate] = useState('');
  const [selectedItemUnitId, setSelectedItemUnitId] = useState<number | null>(
    null,
  );
  const [itemTaxPercentage, setItemTaxPercentage] = useState('');
  const [itemHsnSac, setItemHsnSac] = useState('');

  const [units, setUnits] = useState<Unit[]>([]);
  const [unitModalOpen, setUnitModalOpen] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitShortName, setNewUnitShortName] = useState('');

  const [status, setStatus] = useState('CREATED');
  const [advanceModalOpen, setAdvanceModalOpen] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [createdProjectId, setCreatedProjectId] = useState<number | null>(null);
  const [discount, setDiscount] = useState<number>(0);
  const [discountPercentage, setDisCountPercentage] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });
  const [actualAmount, setActualAmount] = useState<number>(0);

  const [isTamil, setIsTamil] = useState(false);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const { translate } = useTranslator();
  // Initialize language
  useEffect(() => {
    const initLang = async () => {
      const saved = await AsyncStorage.getItem('appLanguage');
      const tamil = saved === 'ta';
      setIsTamil(tamil);
    };
    initLang();
  }, []);
  // Translate all strings
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

  // Load data
  const loadData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [customerRes, unitRes] = await Promise.all([
        CustomerAPI.getAll(),
        UnitAPI.getAll(),
      ]);
      if (Array.isArray(customerRes.data)) setCustomers(customerRes.data);
      if (Array.isArray(unitRes.data)) setUnits(unitRes.data);
    } catch (e) {
      setSnackbar({ visible: true, message: t('Failed to load data') });
    } finally {
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Dropdown data
  const customerDropdown = useMemo(
    () =>
      customers.map((c, i) => ({
        label: `${c.name} - ${c.contactNo || c.phone || '—'}`,
        value: i,
      })),
    [customers],
  );
  const unitDropdown = useMemo(
    () =>
      units.map(u => ({
        label: `${u.name} (${u.shortName})`,
        value: u.id,
      })),
    [units],
  );

  // Populate from edit/inquiry/quotation
  useEffect(() => {
    if (
      (isEditMode || isFromQuotationDetail) &&
      rawProject &&
      customers.length > 0
    ) {
      const idx = customers.findIndex(c => c.id === rawProject.customerId);
      if (idx > -1) {
        setSelectedCustomerIdx(idx);
        setCustomerId(customers[idx].id);
      }
      setDeliveryDate(dayjs(rawProject.deliveryDate).format('DD-MM-YYYY'));
      setSelectedDateObj(new Date(rawProject.deliveryDate));
      setProjectDescription(rawProject.projectDescription || '');
      setTotalAmount(
        String(rawProject.totalBudget - rawProject.discount || ''),
      );
      setActualAmount(rawProject?.totalBudget || 0);
      setStatus(rawProject.status || 'CREATED');
      setDiscount(rawProject.discount || 0);
      setDisCountPercentage(
        (Number(rawProject.discount) /
          (rawProject.totalBudget - rawProject.discount)) *
          100,
      );

      if (rawProject.customerTime) {
        const { hour, minute } = rawProject.customerTime;
        setTime(dayjs().hour(hour).minute(minute).toISOString());
      }

      setFullLocation({
        address: rawProject.location?.address || '',
        latitude: rawProject.location?.latitude || 0,
        longitude: rawProject.location?.longitude || 0,
      });

      if (rawProject.id) {
        if (isEditMode) {
          ProjectAPI.getSiteImages(rawProject.id)
            .then(res => {
              if (res.data?.length) {
                setImages(
                  res.data.map((img: any) => ({
                    uri: img.imageUrl,
                    id: img.id,
                    isLocal: false,
                  })),
                );
              }
            })
            .catch(() => {});
        } else if (isFromQuotationDetail) {
          // Coming from quotation: load quotation site images for preview
          QuotationAPI.getSiteImages(rawProject.id)
            .then(res => {
              if (Array.isArray(res.data) && res.data.length) {
                setImages(
                  res.data.map((img: any) => ({
                    uri: img.imageUrl,
                    id: img.id,
                    isLocal: false,
                  })),
                );
              }
            })
            .catch(() => {});
        }
      }

      const projectItems = rawProject.projectItems || rawProject.items || [];
      if (projectItems.length) {
        setItems(
          projectItems.map((it: any) => ({
            id: it.id,
            itemName: it.itemName,
            itemDescription: it.itemDescription,
            rateMrp: it.rateMrp,
            quantity: it.quantity,
            amount: it.rateMrp * it.quantity,
            unitId: it?.unit?.id || it?.unitId || 0,
            taxPercentage: it.taxPercentage || 0,
            hsnSac: it.hsnSac || '',
          })),
        );
      }
    } else if (isFromInquiry && rawCustomer && customers.length > 0) {
      const idx = customers.findIndex(c => c.id === rawCustomer.id);
      if (idx > -1) {
        setSelectedCustomerIdx(idx);
        setCustomerId(customers[idx].id);
      }
    }
  }, [
    rawProject,
    rawCustomer,
    customers,
    isEditMode,
    isFromQuotationDetail,
    isFromInquiry,
  ]);

  // Fetch location
  const fetchLocation = async () => {
    try {
      const loc: any = await getLocation();
      if (loc?.address && loc?.pos) {
        setFullLocation({
          address: loc.address,
          latitude: loc.pos.coords.latitude,
          longitude: loc.pos.coords.longitude,
        });
        setSnackbar({ visible: true, message: t('Location captured!') });
      }
    } catch (e) {
      setSnackbar({ visible: true, message: t('Failed to get location') });
    }
  };

  // Image handlers
  const pickImage = () => {
    if (images.length >= 15) {
      setSnackbar({ visible: true, message: t('Max 15 images allowed') });
      return;
    }
    launchImageLibrary({ mediaType: 'photo', quality: 0.6 }, res => {
      if (res.assets?.[0]?.uri) {
        setImages(p => [...p, { uri: res.assets![0].uri!, isLocal: true }]);
      }
    });
  };

  const openCamera = () => {
    if (images.length >= 15) {
      setSnackbar({ visible: true, message: t('Max 15 images allowed') });
      return;
    }
    launchCamera({ mediaType: 'photo', quality: 0.6 }, res => {
      if (res.assets?.[0]?.uri) {
        setImages(p => [...p, { uri: res.assets![0].uri!, isLocal: true }]);
      }
    });
  };

  const removeImage = async (index: number) => {
    const image = images[index];
    if (image.id && isEditMode && rawProject?.id) {
      try {
        await ProjectAPI.deleteSiteImage(image.id);
      } catch (e) {
        setSnackbar({ visible: true, message: t('Failed to delete image') });
      }
    }
    setImages(p => p.filter((_, i) => i !== index));
  };

  // Unit handlers
  const addNewUnit = async () => {
    if (!newUnitName || !newUnitShortName) {
      setSnackbar({
        visible: true,
        message: t('Fill unit name and short name'),
      });
      return;
    }
    try {
      const res = await UnitAPI.create({
        name: newUnitName,
        shortName: newUnitShortName,
      });
      if (res.data) {
        setUnits(prev => [...prev, res.data]);
        setSnackbar({ visible: true, message: t('Unit added!') });
        setUnitModalOpen(false);
        setNewUnitName('');
        setNewUnitShortName('');
      }
    } catch (e) {
      setSnackbar({ visible: true, message: t('Failed to add unit') });
    }
  };

  // Item modal
  const openItemModal = (item?: ProjectItem) => {
    if (item) {
      setEditingItem(item);
      setItemName(item.itemName);
      setItemDesc(item.itemDescription || '');
      setItemQty(String(item.quantity));
      setItemRate(String(item.rateMrp));
      setSelectedItemUnitId(item.unitId);
      setItemTaxPercentage(String(item.taxPercentage));
      setItemHsnSac(item.hsnSac);
    } else {
      setEditingItem(null);
      setItemName('');
      setItemDesc('');
      setItemQty('');
      setItemRate('');
      setSelectedItemUnitId(null);
      setItemTaxPercentage('');
      setItemHsnSac('');
    }
    setItemModalOpen(true);
  };

  const saveItemLocally = async () => {
    const qty = Number(itemQty) || 0;
    const rate = Number(itemRate) || 0;
    const unitId = selectedItemUnitId || 0;
    const taxPercentage = Number(itemTaxPercentage) || 0;

    if (!itemName || qty <= 0 || rate <= 0 || unitId <= 0) {
      setSnackbar({
        visible: true,
        message: t('Fill all required fields (including Unit)'),
      });
      return;
    }

    const newItem: ProjectItem = {
      projectId: rawProject?.id || 0,
      itemName,
      itemDescription: itemDesc,
      rateMrp: rate,
      quantity: qty,
      amount: qty * rate,
      unitId,
      taxPercentage,
      hsnSac: itemHsnSac,
    };

    try {
      if (editingItem?.id) await ProjectAPI.updateItem(editingItem.id, newItem);
      else await ProjectAPI.createItem(newItem);
    } catch (e) {
      setSnackbar({ visible: true, message: t('Failed to add item') });
    }

    setItems(prev =>
      editingItem?.id
        ? prev.map(i => (i.id === editingItem.id ? newItem : i))
        : [...prev, newItem],
    );
    setItemModalOpen(false);
  };

  const deleteItemLocal = async (idx: number) => {
    Alert.alert(t('Delete Item'), t('Are you sure?'), [
      { text: t('Cancel') },
      {
        text: t('Delete'),
        style: 'destructive',
        onPress: () => {
          setItems(p => p.filter((_, i) => i !== idx));
          ProjectAPI.deleteItem(items[idx].id);
        },
      },
    ]);
  };

  // Auto-calculate total
  const itemsTotal = useMemo(
    () => items.reduce((s, it) => s + (it.amount || 0), 0),
    [items],
  );

  useEffect(() => {
    if (!isEditMode && itemsTotal > 0 && !isFromQuotationDetail) {
      setTotalAmount(String(itemsTotal));
      //setActualAmount(itemsTotal);
    }
  }, [itemsTotal, isEditMode]);

  // Upload images (local: third arg false, online URLs: third arg true)
  const uploadImages = async (projectId: number) => {
    const localImages = images
      .filter(img => img.isLocal)
      .map(img => img.uri)
      .filter(Boolean);
    const remoteImages = images
      .filter(img => !img.isLocal)
      .map(img => img.uri)
      .filter(Boolean);

    if (localImages.length > 0) {
      await ProjectAPI.addSiteImages(projectId, localImages, false);
    }
    if (remoteImages.length > 0) {
      await ProjectAPI.addSiteImages(projectId, remoteImages, true);
    }
  };

  // Save project
  const handleSave = async () => {
    if (!customerId || !deliveryDate || !projectDescription || !totalAmount) {
      setSnackbar({ visible: true, message: t('Fill all required fields') });
      return;
    }

    const selectedCustomer = customers.find(
      (c, idx) => idx === selectedCustomerIdx,
    );
    if (!selectedCustomer) {
      setSnackbar({ visible: true, message: t('Select a valid customer') });
      return;
    }

    setLoading(true);
    let projectId: number;

    try {
      if (isEditMode) {
        const payload = {
          deliveryDate: dayjs(deliveryDate, 'DD-MM-YYYY').format('YYYY-MM-DD'),
          projectDescription,
          siteStatus: status,
          status,
          discount,
          totalBudget: actualAmount,
        };
        await ProjectAPI.update(rawProject.id, payload);
        projectId = rawProject.id;

        if (images.some(img => img.uri)) {
          await uploadImages(projectId);
        }

        if (fullLocation.address) {
          await ProjectAPI.updateGps(projectId, {
            address: fullLocation.address,
            latitude: fullLocation.latitude,
            longitude: fullLocation.longitude,
          });
        }

        await ProjectAPI.updateStatus(projectId, status);
        try {
          await QuotationAPI.updateQuotationStatus(projectId, { status });
        } catch (error) {
          console.log(error);
        }
        setSnackbar({ visible: true, message: t('Project updated!') });
        navigation.replace('ProjectDetails', { project: rawProject });
      } else {
        const payload = {
          customerId,
          deliveryDate: dayjs(deliveryDate, 'DD-MM-YYYY').format('YYYY-MM-DD'),
          projectDescription,
          totalAmount: Number(totalAmount),
          siteStatus: status,
          status,
          discount,
          totalBudget: actualAmount,
          items: items.map(i => ({
            itemName: i.itemName,
            rateMrp: i.rateMrp,
            quantity: i.quantity,
            unitId: i.unitId,
            taxPercentage: i.taxPercentage,
            hsnSac: i.hsnSac || '',
          })),
        };

        if (!items.length) {
          setSnackbar({ visible: true, message: t('Enter at least one item') });
          return;
        }
        const created: any = await ProjectAPI.create(payload);
        projectId = created.data.id || created.data.projectId;
        setCreatedProjectId(projectId);
        if (images.some(img => img.uri)) {
          await uploadImages(projectId);
        }
        const currentProjectForItem = created.data;
        const voiceExist =
          rawProject.voiceRecordings && rawProject.voiceRecordings.length > 0;
        if (voiceExist) {
          rawProject.voiceRecordings?.map(async (voice: any) => {
            const res = await ProjectAPI.updateVoice(
              projectId,
              voice.recordingUrl,
              true,
            );
          });
        }
        console.log('projectItems', currentProjectForItem);

        if (
          Array.isArray(rawProject.projectItems) &&
          Array.isArray(currentProjectForItem.projectItems)
        ) {
          await Promise.all(
            rawProject.projectItems.map(
              async (projectItem: any, index: number) => {
                const newItem = currentProjectForItem.projectItems[index];
                let itemImages: any[] = [];

                console.log(
                  'Processing item:',
                  projectItem.id,
                  '->',
                  newItem.id,
                );

                if (
                  Array.isArray(projectItem.images) &&
                  projectItem.images.length > 0
                ) {
                  console.log('Images exist for item:', projectItem.images);
                  itemImages.push(...projectItem.images);
                }

                if (itemImages.length > 0) {
                  const imageUris = itemImages.flatMap((img: any) => {
                    if (Array.isArray(img.imageUrl)) return img.imageUrl;
                    if (typeof img.imageUrl === 'string') return [img.imageUrl];
                    return [];
                  });

                  try {
                    const res = await ProjectAPI.addItemImages(
                      newItem.id,
                      imageUris,
                      true,
                    );
                    console.log('Uploaded images for item:', newItem.id, res);
                  } catch (err) {
                    console.log(
                      'Failed to upload images for item:',
                      newItem.id,
                      err,
                    );
                  }
                } else {
                  console.log('No images found for item:', projectItem.id);
                }
              },
            ),
          );
        } else {
          console.log(
            'Project items and current items are not aligned in size or format.',
          );
        }

        // If created from a quotation and a location is available, update GPS for the new project
        if (isFromQuotationDetail && fullLocation.address) {
          await ProjectAPI.updateGps(projectId, {
            address: fullLocation.address,
            latitude: fullLocation.latitude,
            longitude: fullLocation.longitude,
          });
        }

        if (isFromQuotationDetail) {
          await QuotationAPI.updateQuotationStatus(rawProject.id, {
            status: 'IN PROGRESS',
          });
        }
        ToastAndroid.show(
          t('Project Created Successfully'),
          ToastAndroid.SHORT,
        );
        const currentProject: Project = created?.data;
        navigation.replace('ProjectDetails', { project: currentProject });
        setAdvanceModalOpen(true);
      }
    } catch (e: any) {
      setSnackbar({ visible: true, message: e?.message || t('Save failed') });
    } finally {
      setLoading(false);
    }
  };

  const saveAdvance = async () => {
    if (!createdProjectId || !advanceAmount) return;
    try {
      await ProjectAPI.createAdvance({
        projectId: createdProjectId,
        amount: Number(advanceAmount),
        paymentDate: dayjs().format('YYYY-MM-DD'),
      });
      navigation.goBack();
    } catch (e) {
      setSnackbar({ visible: true, message: t('Failed to save advance') });
    } finally {
      setAdvanceModalOpen(false);
    }
  };

  const statuses = ['CREATED', 'IN_PROGRESS', 'DISCONTINUED', 'COMPLETED'];

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadData} />
          }
        >
          <Text style={styles.title}>
            {isEditMode ? t('Edit Project') : t('Create New Project')}
          </Text>

          {/* Customer */}
          {isFromInquiry ? (
            <TextInput
              label={t('Customer')}
              value={customers.find(c => c.id === customerId)?.name || ''}
              mode="outlined"
              disabled
              style={styles.input}
              theme={{ roundness: wp(2.5) }}
            />
          ) : (
            <Dropdown
              style={styles.dropdown}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              data={customerDropdown}
              search
              maxHeight={hp(40)}
              labelField="label"
              valueField="value"
              placeholder={t('Select Customer *')}
              value={selectedCustomerIdx}
              onChange={item => {
                const cust = customers[item.value];
                setCustomerId(cust.id);
                setSelectedCustomerIdx(item.value);
              }}
            />
          )}

          {/* Delivery Date */}
          <TouchableOpacity onPress={() => setDatePickerOpen(true)}>
            <TextInput
              label={t('Delivery Date *')}
              value={deliveryDate}
              mode="outlined"
              editable={false}
              right={<TextInput.Icon icon="calendar" size={wp(6)} />}
              style={styles.input}
              theme={{ roundness: wp(2.5) }}
            />
          </TouchableOpacity>

          <TextInput
            label={t('Project Description *')}
            value={projectDescription}
            onChangeText={setProjectDescription}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={[styles.input, styles.textArea]}
            theme={{ roundness: wp(2.5) }}
          />

          <TextInput
            label={t('Total Budjet *')}
            value={actualAmount.toString()}
            onChangeText={text => {
              setActualAmount(Number(text));
              if (Number(text) > Number(totalAmount)) {
                setTotalAmount(text);
              }
            }}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
            theme={{ roundness: wp(2.5) }}
            right={<TextInput.Affix text="₹" />}
            disabled={false}
          />

          <TextInput
            label={t('Total Amount *')}
            value={totalAmount}
            onChangeText={setTotalAmount}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
            theme={{ roundness: wp(2.5) }}
            right={<TextInput.Affix text="₹" />}
            disabled={false}
          />

          {Number(totalAmount) > 0 && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: wp(2),
              }}
            >
              <TextInput
                label={t('Discount')}
                value={discount === 0 ? '' : String(discount)}
                onChangeText={text => {
                  const discountValue = text === '' ? 0 : Number(text);
                  setDiscount(discountValue);
                  if (discountValue === 0 || text === '') {
                    setTotalAmount(String(actualAmount));
                    setDisCountPercentage(0);
                  } else {
                    const percentage = (discountValue / actualAmount) * 100;
                    setDisCountPercentage(percentage);
                    setTotalAmount(String(actualAmount - discountValue));
                  }
                }}
                mode="outlined"
                keyboardType="numeric"
                style={[styles.input, { width: wp(60) }]}
                theme={{ roundness: wp(2.5) }}
                disabled={false}
              />
              <TextInput
                label={t('Percentage')}
                value={
                  discountPercentage === 0
                    ? '0.00'
                    : discountPercentage.toFixed(2)
                }
                mode="outlined"
                keyboardType="numeric"
                style={[styles.input, { width: wp(30) }]}
                theme={{ roundness: wp(2.5) }}
                editable={false}
                right={
                  <TextInput.Icon
                    icon="percent"
                    size={wp(6)}
                    color="#0a411fff"
                  />
                }
              />
            </View>
          )}

          {/* Location */}
          {isEditMode && (
            <TextInput
              label={t('Site Location')}
              value={fullLocation.address}
              mode="outlined"
              editable={true}
              style={styles.input}
              theme={{ roundness: wp(2.5) }}
              right={
                <TextInput.Icon
                  icon="map-marker"
                  size={wp(6)}
                  onPress={fetchLocation}
                  color="#0a411fff"
                />
              }
            />
          )}

          {/* Status */}
          {isEditMode && (
            <Dropdown
              style={styles.dropdown}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              data={statuses.map(s => ({
                label: t(s),
                value: s,
              }))}
              maxHeight={hp(40)}
              labelField="label"
              valueField="value"
              placeholder={t('Select Status')}
              value={status}
              onChange={item => setStatus(item.value)}
            />
          )}

          {/* Images */}
          {(isEditMode || isFromQuotationDetail) && (
            <>
              <Text style={styles.sectionTitle}>
                {t('Site Images')} ({images.length}/15)
              </Text>
              <View style={styles.imageContainer}>
                {images.map((img, i) => (
                  <View key={i} style={styles.imageWrapper}>
                    <Image
                      source={{ uri: img.uri }}
                      style={styles.thumbnail}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => removeImage(i)}
                    >
                      <MaterialCommunityIcons
                        name="close"
                        size={wp(4)}
                        color="#fff"
                      />
                    </TouchableOpacity>
                  </View>
                ))}
                {images.length < 15 && (
                  <>
                    <TouchableOpacity
                      style={styles.uploadBtn}
                      onPress={pickImage}
                    >
                      <MaterialCommunityIcons
                        name="image-plus"
                        size={wp(8)}
                        color="#0a411fff"
                      />
                      <Text style={styles.uploadText}>{t('Gallery')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.uploadBtn}
                      onPress={openCamera}
                    >
                      <MaterialCommunityIcons
                        name="camera"
                        size={wp(8)}
                        color="#0a411fff"
                      />
                      <Text style={styles.uploadText}>{t('Camera')}</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </>
          )}

          {/* Items */}
          <View style={styles.itemsHeader}>
            <Text style={styles.sectionTitle}>{t('Project Items')}</Text>
            <Chip icon="calculator" compact style={styles.totalChip}>
              {t('Total')}: ₹{itemsTotal.toLocaleString('en-IN')}
            </Chip>
          </View>
          {items.length === 0 ? (
            <Text style={styles.emptyText}>{t('No items added yet')}</Text>
          ) : (
            items.map((item, index) => (
              <Card key={index} style={styles.itemCard} elevation={2}>
                <Card.Content>
                  <Text style={styles.itemName}>{item.itemName}</Text>
                  <Text style={styles.itemCalc}>
                    {item.quantity} × ₹{item.rateMrp.toLocaleString('en-IN')} =
                    ₹{(item.amount || 0).toLocaleString('en-IN')}
                  </Text>
                  {item.itemDescription && (
                    <Text style={styles.itemDesc}>{item.itemDescription}</Text>
                  )}
                  <Text style={styles.itemExtra}>
                    Unit ID: {item.unitId} | Tax: {item.taxPercentage}% |
                    HSN/SAC: {item.hsnSac}
                  </Text>
                </Card.Content>
                <Card.Actions>
                  <IconButton
                    icon="pencil"
                    size={wp(5)}
                    onPress={() => openItemModal(item)}
                  />
                  <IconButton
                    icon="delete"
                    size={wp(5)}
                    onPress={() => deleteItemLocal(index)}
                  />
                </Card.Actions>
              </Card>
            ))
          )}

          {/* Save Button */}
          <Button
            mode="contained"
            onPress={handleSave}
            style={styles.saveButton}
            contentStyle={styles.saveButtonContent}
            buttonColor="#0a411fff"
            loading={loading}
            disabled={
              loading ||
              !customerId ||
              !deliveryDate ||
              !projectDescription ||
              !totalAmount
            }
            icon="content-save"
          >
            {isEditMode ? t('Update Project') : t('Save Project')}
          </Button>
        </ScrollView>

        {/* FAB */}
        <Portal>
          <FAB
            icon="plus"
            style={styles.fab}
            onPress={() => openItemModal()}
            color="#fff"
          />
        </Portal>

        {/* Item Dialog */}
        <ItemDialog
          visible={itemModalOpen}
          onDismiss={() => setItemModalOpen(false)}
          mode="project"
          projectId={rawProject?.id || createdProjectId || 0}
          item={editingItem}
          onSaved={(saved: any) => {
            setItems(prev =>
              editingItem?.id
                ? prev.map(i => (i.id === editingItem.id ? { ...saved } : i))
                : [...prev, { ...saved }],
            );
          }}
          title={editingItem ? t('Edit Item') : t('Add Item')}
          maxHeight={hp(50)}
          t={t}
        />

        {/* Unit Dialog */}
        <Portal>
          <Dialog
            visible={unitModalOpen}
            onDismiss={() => setUnitModalOpen(false)}
          >
            <Dialog.Title>{t('Add New Unit')}</Dialog.Title>
            <Dialog.Content>
              <TextInput
                label={t('Unit Name')}
                value={newUnitName}
                onChangeText={setNewUnitName}
                mode="outlined"
                style={styles.dialogInput}
              />
              <TextInput
                label={t('Short Name')}
                value={newUnitShortName}
                onChangeText={setNewUnitShortName}
                mode="outlined"
                style={styles.dialogInput}
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setUnitModalOpen(false)}>
                {t('Cancel')}
              </Button>
              <Button onPress={addNewUnit}>{t('Add')}</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        {/* Advance Dialog */}
        <Portal>
          <Dialog
            visible={advanceModalOpen}
            onDismiss={() => setAdvanceModalOpen(false)}
          >
            <Dialog.Title>{t('Add Advance Payment')}</Dialog.Title>
            <Dialog.Content>
              <TextInput
                label={t('Advance Amount')}
                value={advanceAmount}
                onChangeText={setAdvanceAmount}
                mode="outlined"
                keyboardType="numeric"
                style={styles.dialogInput}
                left={<TextInput.Affix text="₹" />}
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button
                onPress={() => {
                  setAdvanceModalOpen(false);
                  navigation.goBack();
                }}
              >
                {t('Skip')}
              </Button>
              <Button onPress={saveAdvance} disabled={!advanceAmount}>
                {t('Save')}
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        {/* Date & Time Pickers */}
        <DatePicker
          modal
          open={datePickerOpen}
          date={selectedDateObj}
          mode="date"
          onConfirm={d => {
            setSelectedDateObj(d);
            setDeliveryDate(dayjs(d).format('DD-MM-YYYY'));
            setDatePickerOpen(false);
          }}
          onCancel={() => setDatePickerOpen(false)}
        />
        <DatePicker
          modal
          open={timePickerOpen}
          date={time ? dayjs(time).toDate() : new Date()}
          mode="time"
          onConfirm={d => {
            setTime(dayjs(d).toISOString());
            setTimePickerOpen(false);
          }}
          onCancel={() => setTimePickerOpen(false)}
        />

        {/* Snackbar */}
        <Snackbar
          visible={snackbar.visible}
          onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
          duration={3000}
          style={styles.snackbar}
        >
          {snackbar.message}
        </Snackbar>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1 },
  content: { padding: wp(5), paddingBottom: hp(20) },
  title: {
    fontSize: wp(6.5),
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: hp(2),
  },
  input: { marginBottom: hp(2), backgroundColor: '#fff' },
  textArea: { minHeight: hp(12) },
  dropdown: {
    height: hp(7),
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: wp(2.5),
    paddingHorizontal: wp(3),
    backgroundColor: '#fff',
    marginBottom: hp(2),
  },
  placeholderStyle: { fontSize: wp(4), color: '#999' },
  selectedTextStyle: { fontSize: wp(4), color: '#000' },
  sectionTitle: {
    fontSize: wp(4.5),
    fontWeight: '600',
    color: '#333',
    marginTop: hp(2),
    marginBottom: hp(1),
  },
  imageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: hp(2),
  },
  imageWrapper: {
    position: 'relative',
    marginRight: wp(2),
    marginBottom: hp(1),
  },
  thumbnail: { width: wp(25), height: wp(25), borderRadius: wp(2) },
  removeBtn: {
    position: 'absolute',
    top: -wp(2),
    right: -wp(2),
    backgroundColor: '#e74c3c',
    borderRadius: wp(4),
    width: wp(6),
    height: wp(6),
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadBtn: {
    width: wp(25),
    height: wp(25),
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#0a411fff',
    borderRadius: wp(2),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(2),
    marginBottom: hp(1),
  },
  uploadText: {
    color: '#0a411fff',
    marginTop: hp(0.5),
    fontSize: wp(3.2),
    fontWeight: '500',
  },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalChip: { backgroundColor: '#e8f5e8' },
  itemCard: { marginBottom: hp(1.5), backgroundColor: '#fff' },
  itemName: { fontSize: wp(4.2), fontWeight: '600', color: '#1a1a1a' },
  itemCalc: {
    fontSize: wp(3.8),
    color: '#0a411fff',
    marginTop: hp(0.3),
    fontWeight: '500',
  },
  itemDesc: { fontSize: wp(3.4), color: '#666', marginTop: hp(0.5) },
  itemExtra: {
    fontSize: wp(3.2),
    color: '#888',
    marginTop: hp(0.3),
    fontStyle: 'italic',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    marginVertical: hp(2),
  },
  saveButton: { marginTop: hp(3), borderRadius: wp(3) },
  saveButtonContent: { height: hp(7) },
  fab: {
    position: 'absolute',
    right: wp(5),
    bottom: hp(10),
    backgroundColor: '#0a411fff',
  },
  dialogInput: { marginBottom: hp(2) },
  unitRow: { flexDirection: 'row', alignItems: 'center', marginBottom: hp(2) },
  unitDropdown: {
    height: hp(7),
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: wp(2.5),
    paddingHorizontal: wp(3),
    backgroundColor: '#fff',
  },
  addUnitBtn: { marginLeft: wp(2) },
  snackbar: { margin: wp(4), borderRadius: wp(2) },
});

export default AddProject;
