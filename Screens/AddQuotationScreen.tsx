import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Alert,
  RefreshControl,
  TouchableOpacity,
  ToastAndroid,
  Image,
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
  Chip,
} from 'react-native-paper';
import ItemDialog from './components/ItemDialog';
import { rootStackParamList } from '../navigation/AppNavigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import dayjs from 'dayjs';
import DatePicker from 'react-native-date-picker';
import { RouteProp } from '@react-navigation/native';
import { Dropdown } from 'react-native-element-dropdown';
import { CustomerAPI, QuotationAPI, UnitAPI } from '../service/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslator } from 'react-native-translator';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { addTextWatermark } from '../utils/Watermarker';
import { Customer } from './AdminCustomerList';

const { width, height } = Dimensions.get('window');
const wp = (p: number) => (width * p) / 100;
const hp = (p: number) => (height * p) / 100;

type Props = {
  navigation: NativeStackNavigationProp<rootStackParamList, 'AddQuotation'>;
  route: RouteProp<rootStackParamList, 'AddQuotation'>;
};

export type QuotationItem = {
  id?: number;
  itemName: string;
  itemDescription?: string;
  quantity: number;
  unitId: number;
  rateMrp: number;
  taxPercentage: number;
  hsnSac?: string;
  totalCost: number;
};

export type Unit = {
  id: number;
  name: string;
  shortName: string;
};

const enToTa: Record<string, string> = {
  // Titles
  'Create Quotation': 'மேற்கோள் உருவாக்கு',
  'Edit Quotation': 'மேற்கோளைத் திருத்து',

  // Labels
  Customer: 'வாடிக்கையாளர்',
  'Select Customer *': 'வாடிக்கையாளரைத் தேர்ந்தெடு *',
  'Mobile No': 'கைப்பேசி எண்',
  Address: 'முகவரி',
  'Project Description *': 'திட்ட விளக்கம் *',
  'Delivery Date *': 'விநியோக தேதி *',
  'Total Budget *': 'மொத்த பட்ஜெட் *',
  'Total Amount *': 'மொத்த தொகை *',
  Discount: 'தள்ளுபடி',
  Percentage: 'விழுக்காடு',
  Items: 'பொருட்கள்',
  'No items added yet': 'இதுவரை பொருட்கள் சேர்க்கப்படவில்லை',

  // Item Dialog
  'Add Item': 'பொருளைச் சேர்',
  'Edit Item': 'பொருளைத் திருத்து',
  'Name *': 'பெயர் *',
  Description: 'விளக்கம்',
  'Quantity *': 'அளவு *',
  'Unit *': 'அலகு *',
  'MRP *': 'MRP *',
  'HSN/SAC': 'HSN/SAC',
  'Tax (%)': 'வரி (%)',
  Total: 'மொத்தம்',
  Cancel: 'ரத்து செய்',
  Save: 'சேமி',

  // Unit Dialog
  'Add New Unit': 'புதிய அலகு சேர்',
  'Unit Name': 'அலகு பெயர்',
  'Short Name': 'குறுகிய பெயர்',
  Add: 'சேர்',

  // Messages
  'Customer is required': 'வாடிக்கையாளர் தேவை',
  'Delivery Date is required': 'விநியோக தேதி தேவை',
  'Description is required': 'விளக்கம் தேவை',
  'Total Budget is required': 'மொத்த பட்ஜெட் தேவை',
  'At least one item is required': 'குறைந்தது ஒரு பொருள் தேவை',
  'Name, Qty, Unit, MRP required': 'பெயர், அளவு, அலகு, MRP தேவை',
  'Both fields required': 'இரு புலங்களும் தேவை',
  'Failed to load data': 'தரவை ஏற்ற முடியவில்லை',
  'Failed to load quotation': 'மேற்கோளை ஏற்ற முடியவில்லை',
  'Unit added': 'அலகு சேர்க்கப்பட்டது',
  'Failed to add unit': 'அலகு சேர்க்க முடியவில்லை',
  'Delete failed': 'நீக்க முடியவில்லை',
  'Quotation updated!': 'மேற்கோள் புதுப்பிக்கப்பட்டது!',
  'Quotation created!': 'மேற்கோள் உருவாக்கப்பட்டது!',
  'Save failed': 'சேமிப்பு தோல்வியடைந்தது',

  // Buttons
  'Update Quotation': 'மேற்கோளைப் புதுப்பி',
  'Save Quotation': 'மேற்கோளைச் சேமி',
};

const AddQuotation: React.FC<Props> = ({ navigation, route }) => {
  const rawCustomer: any = route.params?.customer;
  const rawQuotation: any = route.params?.quotationToEdit;

  const isEditMode = !!rawQuotation;
  const isFromInquiry = !!rawCustomer && !isEditMode;

  const [customerId, setCustomerId] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [totalBudget, setTotalBudget] = useState('');
  const [selectedDateObj, setSelectedDateObj] = useState<Date>(new Date());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerIdx, setSelectedCustomerIdx] = useState<number | null>(
    null,
  );

  const [items, setItems] = useState<QuotationItem[]>([]);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<QuotationItem | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemQty, setItemQty] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [itemMrp, setItemMrp] = useState('');
  const [itemTax, setItemTax] = useState('');
  const [hsnSac, setHsnSac] = useState('');

  const [units, setUnits] = useState<Unit[]>([]);
  const [unitModalOpen, setUnitModalOpen] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitShortName, setNewUnitShortName] = useState('');
  const [discount, setDiscount] = useState<number>(0);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [actualAmount, setActualAmount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [images, setImages] = useState<
    { uri: string; id?: number; isLocal: boolean }[]
  >([]);

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

  // Load Customers & Units
  const loadData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [custRes, unitRes] = await Promise.all([
        CustomerAPI.getAll(),
        UnitAPI.getAll(),
      ]);

      if (Array.isArray(custRes.data)) {
        const filtered = custRes.data.filter(
          (c: Customer) =>
            c.status.toLocaleUpperCase() !== 'DELETED' &&
            c.status.toLocaleUpperCase() !== 'REJECTED',
        );
        setCustomers(filtered);
      }
      if (Array.isArray(unitRes.data)) setUnits(unitRes.data);
    } catch (e) {
      ToastAndroid.show(t('Failed to load data'), ToastAndroid.SHORT);
    } finally {
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Edit Mode: Load Quotation + Items
  useEffect(() => {
    if (isEditMode && rawQuotation?.id && customers.length > 0) {
      const loadEditData = async () => {
        try {
          setLoading(true);
          const [quotRes, itemsRes] = await Promise.all([
            QuotationAPI.getById(rawQuotation.id),
            QuotationAPI.getItems(rawQuotation.id),
          ]);

          const quot = quotRes.data;
          const loadedItems = Array.isArray(itemsRes.data) ? itemsRes.data : [];
          const custIdx = customers.findIndex(c => c.id === quot.customerId);
          if (custIdx > -1) {
            const cust = customers[custIdx];
            setSelectedCustomerIdx(custIdx);
            setCustomerId(cust.id);
            setCustomerName(cust.customerName || cust.name);
            setMobileNo(
              cust.customerContactNo ||
                cust.phone ||
                rawQuotation.customerContactNo ||
                '',
            );
            setAddress(
              cust.customerAddress ||
                cust.address ||
                rawQuotation.customerAddress ||
                '',
            );
          }

          setDeliveryDate(dayjs(quot.deliveryDate).format('DD-MM-YYYY'));
          setSelectedDateObj(new Date(quot.deliveryDate));
          setDescription(quot.projectDescription || '');
          setTotalBudget(String(quot.totalBudget - quot.discount || ''));
          setActualAmount(quot.totalBudget || 0);
          setDiscount(quot.discount || 0);
          setDiscountPercent(
            (quot.discount / (quot.totalBudget - quot.discount)) * 100,
          );
          setItems(
            loadedItems.map((it: any) => ({
              id: it.id,
              itemName: it.itemName,
              itemDescription: it.itemDescription,
              quantity: it.quantity,
              unitId: it.unit.id,
              rateMrp: it.rateMrp,
              taxPercentage: it.taxPercentage,
              hsnSac: it.hsnSac,
              totalCost: it.totalCost,
            })),
          );

          // Load quotation site images
          try {
            const imgRes = await QuotationAPI.getSiteImages(rawQuotation.id);
            if (Array.isArray(imgRes.data) && imgRes.data.length) {
              setImages(
                imgRes.data.map((img: any) => ({
                  uri: img.imageUrl,
                  id: img.id,
                  isLocal: false,
                })),
              );
            }
          } catch {}
        } catch (e) {
          ToastAndroid.show(t('Failed to load quotation'), ToastAndroid.SHORT);
        } finally {
          setLoading(false);
        }
      };
      loadEditData();
    } else if (isFromInquiry && rawCustomer && customers.length > 0) {
      const idx = customers.findIndex(c => c.id === rawCustomer.id);
      if (idx > -1) {
        const cust = customers[idx];
        setSelectedCustomerIdx(idx);
        setCustomerId(cust.id);
        setCustomerName(cust.name);
        setMobileNo(
          cust.contactNo || cust.phone || rawCustomer.contactNo || '',
        );
        setAddress(cust.address || rawCustomer.address || '');
      }
    }
    if (isFromInquiry) {
      setDescription(rawCustomer.workDescription);
    }
  }, [rawQuotation, rawCustomer, customers, isEditMode, isFromInquiry, t]);

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

  const calculateItemTotal = useCallback(() => {
    const qty = Number(itemQty) || 0;
    const mrp = Number(itemMrp) || 0;
    const tax = Number(itemTax) || 0;
    const subtotal = qty * mrp;
    return subtotal + (subtotal * tax) / 100;
  }, [itemQty, itemMrp, itemTax]);

  const grandTotal = useMemo(
    () => items.reduce((sum, item) => sum + item.totalCost, 0),
    [items],
  );

  useEffect(() => {
    if (grandTotal > 0) {
      setTotalBudget(grandTotal.toFixed(2));
      if (actualAmount === 0 || grandTotal > actualAmount)
        setActualAmount(grandTotal);
    }
  }, [grandTotal]);

  const openItemModal = (item?: QuotationItem, index?: number) => {
    if (item) {
      setEditingItem(item);
      setItemName(item.itemName);
      setItemDesc(item.itemDescription || '');
      setItemQty(String(item.quantity));
      setSelectedUnitId(item.unitId);
      setItemMrp(String(item.rateMrp));
      setItemTax(String(item.taxPercentage));
      setHsnSac(item.hsnSac || '');
      setEditingIndex(
        typeof index === 'number' ? index : items.findIndex(i => i === item),
      );
    } else {
      setEditingItem(null);
      setItemName('');
      setItemDesc('');
      setItemQty('');
      setEditingIndex(null);
      setSelectedUnitId(null);
      setItemMrp('');
      setItemTax('');
      setHsnSac('');
    }
    setItemModalOpen(true);
  };

  const saveItemLocally = async () => {
    if (!itemName || !itemQty || selectedUnitId === null || !itemMrp) {
      ToastAndroid.show(t('Name, Qty, Unit, MRP required'), ToastAndroid.SHORT);
      return;
    }

    const totalCost = calculateItemTotal();

    const newItem: QuotationItem = {
      id: editingItem?.id,
      itemName,
      itemDescription: itemDesc,
      quantity: Number(itemQty),
      unitId: selectedUnitId,
      rateMrp: Number(itemMrp),
      taxPercentage: Number(itemTax),
      hsnSac,
      totalCost,
    };
    try {
      if (editingItem?.id)
        await QuotationAPI.updateItem(editingItem.id, newItem);
      else await QuotationAPI.createItem(newItem);
    } catch (e) {
      ToastAndroid.show(t('Failed to add item'), ToastAndroid.SHORT);
    }
    setItems(prev =>
      editingItem?.id
        ? prev.map(i =>
            i.id === editingItem.id || i.itemName === editingItem.itemName
              ? newItem
              : i,
          )
        : [...prev, newItem],
    );
    setItemModalOpen(false);
  };

  const deleteItemLocal = (idx: number) => {
    Alert.alert(t('Delete Item'), t('Sure?'), [
      { text: t('Cancel') },
      {
        text: t('Delete'),
        style: 'destructive',
        onPress: async () => {
          const item = items[idx];
          if (item.id) {
            try {
              await QuotationAPI.deleteItem(item.id);
            } catch (e) {
              ToastAndroid.show(t('Delete failed'), ToastAndroid.SHORT);
            }
          }
          setItems(p => p.filter((_, i) => i !== idx));
        },
      },
    ]);
  };

  const addNewUnit = async () => {
    if (!newUnitName || !newUnitShortName) {
      ToastAndroid.show(t('Both fields required'), ToastAndroid.SHORT);
      return;
    }
    try {
      const res = await UnitAPI.create({
        name: newUnitName,
        shortName: newUnitShortName,
      });
      setUnits(prev => [...prev, res.data]);
      setNewUnitName('');
      setNewUnitShortName('');
      setUnitModalOpen(false);
      ToastAndroid.show(t('Unit added'), ToastAndroid.SHORT);
    } catch (e) {
      ToastAndroid.show(t('Failed to add unit'), ToastAndroid.SHORT);
    }
  };

  const handleSave = async () => {
    if (
      !customerId ||
      !deliveryDate ||
      !description ||
      !totalBudget ||
      !items.length
    ) {
      if (!customerId)
        ToastAndroid.show(t('Customer is required'), ToastAndroid.SHORT);
      if (!deliveryDate)
        ToastAndroid.show(t('Delivery Date is required'), ToastAndroid.SHORT);
      if (!description)
        ToastAndroid.show(t('Description is required'), ToastAndroid.SHORT);
      if (!totalBudget)
        ToastAndroid.show(t('Total Budget is required'), ToastAndroid.SHORT);
      if (!items.length)
        ToastAndroid.show(
          t('At least one item is required'),
          ToastAndroid.SHORT,
        );
      return;
    }

    setLoading(true);
    try {
      let currentQuotation = null;
      if (isEditMode && rawQuotation?.id) {
        const payload: any = {
          customerId,
          projectDescription: description,
          deliveryDate: dayjs(deliveryDate, 'DD-MM-YYYY').format('YYYY-MM-DD'),
          totalBudget: Number(actualAmount),
          discount: Number(discount),
        };
        await QuotationAPI.update(rawQuotation.id, payload);
        // Upload any newly added local images
        const localUris = images.filter(img => img.isLocal).map(img => img.uri);
        if (localUris.length) {
          await QuotationAPI.addSiteImages(rawQuotation.id, localUris);
        }
        if (items.length) {
          items.forEach(async item => {
            if (item.id) {
              const payload = {
                quotationId: rawQuotation.id,
                itemName: item.itemName,
                itemDescription: item.itemDescription,
                rateMrp: item.rateMrp,
                quantity: item.quantity,
                unitId: item.unitId,
                taxPercentage: item.taxPercentage,
                hsnSac: item.hsnSac,
              };
              const res = await QuotationAPI.updateItem(item.id, payload);
            }
          });
        }
        currentQuotation = rawQuotation;
        ToastAndroid.show(t('Quotation updated!'), ToastAndroid.SHORT);
      } else {
        const payload: any = {
          customerId,
          projectDescription: description,
          deliveryDate: dayjs(deliveryDate, 'DD-MM-YYYY').format('YYYY-MM-DD'),
          totalBudget: Number(actualAmount),
          discount: Number(discount),
          items: items.map(item => ({
            itemName: item.itemName,
            itemDescription: item.itemDescription,
            rateMrp: item.rateMrp,
            quantity: item.quantity,
            unitId: item.unitId,
            taxPercentage: item.taxPercentage,
            hsnSac: item.hsnSac,
          })),
        };
        const res = await QuotationAPI.create(payload);
        currentQuotation = res.data;
        ToastAndroid.show(t('Quotation created!'), ToastAndroid.SHORT);
      }

      setTimeout(
        () =>
          navigation.replace('QuotationDetail', {
            quotation: currentQuotation,
          }),
        800,
      );
    } catch (e: any) {
      ToastAndroid.show(e?.message || t('Save failed'), ToastAndroid.SHORT);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['left', 'right', 'bottom', 'top']}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 100}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadData} />
          }
        >
          <Text style={styles.title}>
            {isEditMode ? t('Edit Quotation') : t('Create Quotation')}
          </Text>

          {isFromInquiry ? (
            <TextInput
              label={t('Customer')}
              value={customerName}
              mode="outlined"
              style={styles.input}
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
                setSelectedCustomerIdx(item.value);
                setCustomerId(cust.id);
                setCustomerName(cust.name);
                setMobileNo(cust.contactNo || cust.phone || '');
                setAddress(cust.address || '');
              }}
            />
          )}

          <TextInput
            label={t('Mobile No')}
            value={mobileNo}
            mode="outlined"
            style={styles.input}
            onChangeText={setMobileNo}
          />
          <TextInput
            label={t('Address')}
            value={address}
            mode="outlined"
            multiline
            style={[styles.input, styles.textArea]}
            onChangeText={setAddress}
          />

          <TextInput
            label={t('Project Description *')}
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={[styles.input, styles.textArea]}
          />

          <TextInput
            label={t('Total Budget *')}
            value={actualAmount.toString()}
            onChangeText={text => {
              setActualAmount(Number(text));
              //setTotalBudget(text);
            }}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
            editable={false}
            left={<TextInput.Affix text="₹" />}
          />
          {/* <TextInput
            label={t('Total Amount *')}
            value={totalBudget}
            onChangeText={setTotalBudget}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
            editable={!isEditMode}
            left={<TextInput.Affix text="₹" />}
          /> */}

          {/* Site Images (Edit mode) */}
          {isEditMode && (
            <>
              <Text style={styles.sectionTitle}>
                Site Images ({images.length}/15)
              </Text>
              <View style={styles.imageContainer}>
                {images.map((img, i) => (
                  <View key={i} style={styles.imageWrapper}>
                    <Image
                      source={{ uri: img.uri }}
                      style={styles.thumbnail}
                      resizeMode="cover"
                    />
                    {img.isLocal && (
                      <TouchableOpacity
                        style={styles.removeBtn}
                        onPress={() =>
                          setImages(prev => prev.filter((_, idx) => idx !== i))
                        }
                      >
                        <MaterialCommunityIcons
                          name="close"
                          size={wp(4)}
                          color="#fff"
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                {images.length < 15 && (
                  <>
                    <TouchableOpacity
                      style={styles.uploadBtn}
                      onPress={() => {
                        if (images.length >= 15) return;

                        launchImageLibrary(
                          { mediaType: 'photo', quality: 0.6 },
                          r => {
                            const uri = r.assets?.[0]?.uri;
                            if (!uri) return;

                            // Apply watermark
                            addTextWatermark(uri)
                              .then(wmUri => {
                                setImages(prev => [
                                  ...prev,
                                  { uri: wmUri, isLocal: true },
                                ]);
                              })
                              .catch(err => {
                                // fallback: add original image
                                setImages(prev => [
                                  ...prev,
                                  { uri, isLocal: true },
                                ]);
                              });
                          },
                        );
                      }}
                    >
                      <MaterialCommunityIcons
                        name="image"
                        size={wp(8)}
                        color="#2874b8"
                      />
                      <Text style={styles.uploadText}>Gallery</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.uploadBtn}
                      onPress={() => {
                        if (images.length >= 15) return;

                        launchCamera(
                          { mediaType: 'photo', quality: 0.6 },
                          r => {
                            const uri = r.assets?.[0]?.uri;
                            if (!uri) return;

                            // Apply watermark
                            addTextWatermark(uri)
                              .then(wmUri => {
                                setImages(prev => [
                                  ...prev,
                                  { uri: wmUri, isLocal: true },
                                ]);
                              })
                              .catch(err => {
                                // fallback to original photo
                                setImages(prev => [
                                  ...prev,
                                  { uri, isLocal: true },
                                ]);
                              });
                          },
                        );
                      }}
                    >
                      <MaterialCommunityIcons
                        name="camera"
                        size={wp(8)}
                        color="#2874b8"
                      />
                      <Text style={styles.uploadText}>Camera</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </>
          )}

          <View style={styles.itemsHeader}>
            <Text style={styles.sectionTitle}>{t('Items')}</Text>
            <Chip icon="calculator" style={styles.totalChip}>
              ₹{grandTotal.toFixed(2)}
            </Chip>
          </View>

          {items.length === 0 ? (
            <Text style={styles.emptyText}>{t('No items added yet')}</Text>
          ) : (
            items.map((item, index) => {
              const unit = units.find(u => u.id === item.unitId);
              return (
                <Card key={index} style={styles.itemCard} elevation={2}>
                  <Card.Content>
                    <Text style={styles.itemName}>{item.itemName}</Text>
                    <Text style={styles.itemCalc}>
                      {item.quantity} {unit?.shortName} × ₹
                      {item.rateMrp.toLocaleString('en-IN')} +{' '}
                      {item.taxPercentage}% = ₹{item.totalCost.toFixed(2)}
                    </Text>
                    {item.itemDescription && (
                      <Text style={styles.itemDesc}>
                        {item.itemDescription}
                      </Text>
                    )}
                    {item.hsnSac && (
                      <Text style={styles.hsnText}>HSN/SAC: {item.hsnSac}</Text>
                    )}
                  </Card.Content>
                  <Card.Actions>
                    <IconButton
                      icon="pencil"
                      size={wp(5)}
                      onPress={() => openItemModal(item, index)}
                    />
                    <IconButton
                      icon="delete"
                      size={wp(5)}
                      onPress={() => deleteItemLocal(index)}
                    />
                  </Card.Actions>
                </Card>
              );
            })
          )}

          <View style={{ marginTop: 16, marginBottom: 8 }}>
            <Text
              style={{ fontSize: wp(5), fontWeight: 'bold', color: '#2874b8' }}
            >{`Total Amount* : ${totalBudget}`}</Text>
          </View>

          {Number(totalBudget) > 0 && (
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
                    setTotalBudget(grandTotal.toFixed(2));
                    setDiscountPercent(0);
                  } else {
                    const percentage =
                      (discountValue / Number(grandTotal)) * 100;
                    setDiscountPercent(percentage);
                    setTotalBudget(String(grandTotal - discountValue));
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
                  discountPercent === 0 ? '0.00' : discountPercent.toFixed(2)
                }
                onChangeText={text => {
                  const percentValue = text === '' ? 0 : Number(text);
                  setDiscountPercent(percentValue);
                  if (percentValue === 0 || text === '') {
                    setDiscount(0);
                    setTotalBudget(grandTotal.toFixed(2));
                  } else {
                    const discountValue =
                      (Number(grandTotal) * percentValue) / 100;
                    setDiscount(discountValue);
                    setTotalBudget(String(Number(grandTotal) - discountValue));
                  }
                }}
                mode="outlined"
                keyboardType="numeric"
                style={[styles.input, { width: wp(30) }]}
                theme={{ roundness: wp(2.5) }}
                editable={true}
                right={
                  <TextInput.Icon icon="percent" size={wp(6)} color="#2874b8" />
                }
              />
            </View>
          )}

          <TouchableOpacity onPress={() => setDatePickerOpen(true)}>
            <TextInput
              label={t('Delivery Date *')}
              value={deliveryDate}
              mode="outlined"
              editable={false}
              style={styles.input}
              right={
                <TextInput.Icon
                  icon="calendar"
                  size={wp(6)}
                  onPress={() => setDatePickerOpen(true)}
                />
              }
            />
          </TouchableOpacity>

          <Button
            mode="contained"
            onPress={handleSave}
            style={styles.saveButton}
            contentStyle={styles.saveButtonContent}
            buttonColor="#2874b8"
            loading={loading}
            disabled={
              loading ||
              !customerId ||
              !deliveryDate ||
              !description ||
              !totalBudget
            }
            icon="content-save"
          >
            {isEditMode ? t('Update Quotation') : t('Save Quotation')}
          </Button>
        </ScrollView>

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
          mode="quotation"
          quotationId={rawQuotation?.id || 0}
          item={editingItem}
          onSaved={(saved: any) => {
            setItems(prev => {
              if (editingItem?.id) {
                return prev.map(i =>
                  i.id === editingItem.id ? { ...saved } : i,
                );
              }
              if (
                editingIndex !== null &&
                editingIndex >= 0 &&
                editingIndex < prev.length
              ) {
                const next = [...prev];
                next[editingIndex] = { ...saved };
                return next;
              }
              return [...prev, { ...saved }];
            });
            setEditingItem(null);
            setEditingIndex(null);
          }}
          title={editingItem ? t('Edit Item') : t('Add Item')}
          maxHeight={hp(55)}
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
    color: '#2874b8',
    marginTop: hp(0.3),
    fontWeight: '500',
  },
  itemDesc: { fontSize: wp(3.4), color: '#666', marginTop: hp(0.5) },
  hsnText: { fontSize: wp(3.2), color: '#999', marginTop: hp(0.3) },
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
    backgroundColor: '#2874b8',
  },
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
  amountPreview: {
    marginTop: hp(1),
    fontSize: wp(4.5),
    fontWeight: '600',
    color: '#2874b8',
    textAlign: 'right',
  },
  dialogInput: { marginBottom: hp(2) },
  imageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(3),
    alignItems: 'center',
  },
  imageWrapper: {
    position: 'relative',
  },
  thumbnail: {
    width: wp(26),
    height: wp(26),
    borderRadius: wp(2),
    backgroundColor: '#f2f2f2',
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 2,
  },
  uploadBtn: {
    width: wp(26),
    height: wp(26),
    borderWidth: 1,
    borderColor: '#2874b8',
    borderStyle: 'dashed',
    borderRadius: wp(2),
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: { marginTop: 4, color: '#2874b8', fontSize: wp(3) },
});

export default AddQuotation;
