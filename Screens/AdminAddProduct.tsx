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
import { rootStackParamList } from '../navigation/AppNavigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import dayjs from 'dayjs';
import DatePicker from 'react-native-date-picker';
import { RouteProp } from '@react-navigation/native';
import { getLocation } from '../utils/GeoLocation';
import { Dropdown } from 'react-native-element-dropdown';
import { ProjectAPI, CustomerAPI, UnitAPI } from '../service/apiService';
import { useNavigationState } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

// Responsive helpers
const wp = (percentage: number) => (width * percentage) / 100;
const hp = (percentage: number) => (height * percentage) / 100;

type Props = {
  navigation: NativeStackNavigationProp<rootStackParamList, 'AddProject'>;
  route: RouteProp<rootStackParamList, 'AddProject'>;
};

export type ProjectItem = {
  id?: number;
  itemName: string;
  itemDescription?: string;
  rateMrp: number;
  quantity: number;
  amount?: number;
  unitId: number;
  taxPercentage: number;
  hsnSac: string;
};

export type Unit = {
  id: number;
  name: string;
  shortName: string;
};

const AddProject: React.FC<Props> = ({ navigation, route }) => {
  const rawCustomer: any = route.params?.customer;
  const rawProject: any =
    route.params?.projectToEdit || route.params?.productEdit; // Handle both names
  const routeLength = useNavigationState(state => state.routes.length);
  let previousScreenName = '';
  if (routeLength > 1) {
    previousScreenName = useNavigationState(
      state => state.routes[state.index - 1].name,
    );
    console.log('Previous Screen Name:', previousScreenName);
  }
  const isFromQuotationDetail = previousScreenName === 'QuotationDetail';
  const isEditMode = !!rawProject && !isFromQuotationDetail; // If from quotationDetail, treat as create even if data present
  const isFromInquiry = !!rawCustomer && !isEditMode && !isFromQuotationDetail;

  const [customerId, setCustomerId] = useState<number | null>(null);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [images, setImages] = useState<string[]>([]);
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
  const [siteStatus, setSiteStatus] = useState('');
  const [advanceModalOpen, setAdvanceModalOpen] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [createdProjectId, setCreatedProjectId] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  // Load customers and units
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
      setSnackbar({ visible: true, message: 'Failed to load data' });
    } finally {
      setRefreshing(false);
    }
  }, []);

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
      setTotalAmount(String(rawProject.totalAmount || ''));
      setStatus(rawProject.status || 'CREATED');
      setSiteStatus(rawProject.siteStatus || '');

      // Handle time object
      if (rawProject.customerTime) {
        const { hour, minute } = rawProject.customerTime;
        setTime(dayjs().hour(hour).minute(minute).toISOString());
      }

      setFullLocation({
        address: rawProject.location?.address || '',
        latitude: rawProject.location?.latitude || 0,
        longitude: rawProject.location?.longitude || 0,
      });

      if (rawProject.siteImages?.length) {
        setImages(
          rawProject.siteImages.map((img: any) => img.imageUrl).filter(Boolean),
        );
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
            unitId: it.unitId || 0,
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
        setSnackbar({ visible: true, message: 'Location captured!' });
      }
    } catch (e) {
      setSnackbar({ visible: true, message: 'Failed to get location' });
    }
  };

  // Image handlers
  const pickImage = () => {
    if (images.length >= 15) {
      setSnackbar({ visible: true, message: 'Max 15 images allowed' });
      return;
    }
    launchImageLibrary({ mediaType: 'photo', quality: 0.6 }, res => {
      if (res.assets?.[0]?.uri) {
        setImages(p => [...p, res.assets![0].uri!]);
      }
    });
  };

  const openCamera = () => {
    if (images.length >= 15) {
      setSnackbar({ visible: true, message: 'Max 15 images allowed' });
      return;
    }
    launchCamera({ mediaType: 'photo', quality: 0.6 }, res => {
      if (res.assets?.[0]?.uri) {
        setImages(p => [...p, res.assets![0].uri!]);
      }
    });
  };

  const removeImage = (i: number) =>
    setImages(p => p.filter((_, idx) => idx !== i));

  // Unit handlers
  const addNewUnit = async () => {
    if (!newUnitName || !newUnitShortName) {
      setSnackbar({ visible: true, message: 'Fill unit name and short name' });
      return;
    }
    try {
      const res = await UnitAPI.create({
        name: newUnitName,
        shortName: newUnitShortName,
      });
      if (res.data) {
        setUnits(prev => [...prev, res.data]);
        setSnackbar({ visible: true, message: 'Unit added!' });
        setUnitModalOpen(false);
        setNewUnitName('');
        setNewUnitShortName('');
      }
    } catch (e) {
      setSnackbar({ visible: true, message: 'Failed to add unit' });
    }
  };

  // Item modal - Updated to match quotation style (assuming similar modal with additional fields)
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

  const saveItemLocally = () => {
    const qty = Number(itemQty) || 0;
    const rate = Number(itemRate) || 0;
    const unitId = selectedItemUnitId || 0;
    const taxPercentage = Number(itemTaxPercentage) || 0;
    if (!itemName || qty <= 0 || rate <= 0 || unitId <= 0) {
      setSnackbar({
        visible: true,
        message: 'Fill all required fields (including Unit)',
      });
      return;
    }

    const newItem: ProjectItem = {
      id: editingItem?.id,
      itemName,
      itemDescription: itemDesc,
      rateMrp: rate,
      quantity: qty,
      amount: qty * rate,
      unitId,
      taxPercentage,
      hsnSac: itemHsnSac,
    };

    setItems(prev =>
      editingItem?.id
        ? prev.map(i => (i.id === editingItem.id ? newItem : i))
        : [...prev, newItem],
    );
    setItemModalOpen(false);
  };

  const deleteItemLocal = (idx: number) => {
    Alert.alert('Delete Item', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => setItems(p => p.filter((_, i) => i !== idx)),
      },
    ]);
  };

  // Auto-calculate total
  const itemsTotal = useMemo(
    () => items.reduce((s, it) => s + (it.amount || 0), 0),
    [items],
  );
  useEffect(() => {
    if (!isEditMode && itemsTotal > 0) setTotalAmount(String(itemsTotal));
  }, [itemsTotal, isEditMode]);

  // Save project - Updated payload
  const handleSave = async () => {
    if (!customerId || !deliveryDate || !projectDescription || !totalAmount) {
      setSnackbar({ visible: true, message: 'Fill all required fields' });
      return;
    }

    // Get customer details
    const selectedCustomer = customers.find(
      (c, idx) => idx === selectedCustomerIdx,
    );
    if (!selectedCustomer) {
      setSnackbar({ visible: true, message: 'Select a valid customer' });
      return;
    }

    // Construct time object
    const timeObj = time
      ? {
          hour: dayjs(time).hour(),
          minute: dayjs(time).minute(),
          second: dayjs(time).second(),
          nano: 0,
        }
      : { hour: 0, minute: 0, second: 0, nano: 0 };

    setLoading(true);
    let payload: any;

    if (isEditMode) {
      payload = {
        customerId,
        customerName: selectedCustomer.name,
        customerContactNo:
          selectedCustomer.contactNo || selectedCustomer.phone || '',
        customerAddress: selectedCustomer.address || '',
        deliveryDate: dayjs(deliveryDate, 'DD-MM-YYYY').format('YYYY-MM-DD'),
        projectDescription,
        customerTime: timeObj,
        siteStatus: siteStatus || '',
        totalAmount: Number(totalAmount),
        status,
        items: items.map(i => ({
          projectId: rawProject.id,
          itemName: i.itemName,
          itemDescription: i.itemDescription || '',
          rateMrp: i.rateMrp,
          quantity: i.quantity,
          unitId: i.unitId,
          taxPercentage: i.taxPercentage,
          hsnSac: i.hsnSac || '',
        })),
      };
    } else {
      payload = {
        customerId,
        deliveryDate: dayjs(deliveryDate, 'DD-MM-YYYY').format('YYYY-MM-DD'),
        projectDescription,
        totalAmount: Number(totalAmount),
        items: items.map(i => ({
          itemName: i.itemName,
          rateMrp: i.rateMrp,
          quantity: i.quantity,
          unitId: i.unitId,
          taxPercentage: i.taxPercentage,
          hsnSac: i.hsnSac || '',
        })),
      };
    }

    try {
      let projectId: number;

      if (isEditMode) {
        await ProjectAPI.update(rawProject.id, payload);
        projectId = rawProject.id;

        if (images.length) await uploadImages(projectId);
        if (fullLocation.address) {
          await ProjectAPI.updateGps(projectId, {
            address: fullLocation.address,
            latitude: fullLocation.latitude,
            longitude: fullLocation.longitude,
          });
        }
        if (status) await ProjectAPI.updateStatus(projectId, status);

        setSnackbar({ visible: true, message: 'Project updated!' });
        navigation.goBack();
      } else {
        const created: any = await ProjectAPI.create(payload);
        projectId = created.data.id || created.data.projectId;
        setCreatedProjectId(projectId);

        if (isEditMode || images.length) await uploadImages(projectId);
        setAdvanceModalOpen(true);
      }
    } catch (e: any) {
      setSnackbar({ visible: true, message: e?.message || 'Save failed' });
    } finally {
      setLoading(false);
    }
  };

  const uploadImages = async (projectId: number) => {
    const localImages = images.filter(
      uri => uri.startsWith('file://') || uri.includes('cache'),
    );
    if (localImages.length === 0) return;
    await ProjectAPI.addSiteImages(projectId, localImages);
  };

  const saveAdvance = async () => {
    if (!createdProjectId || !advanceAmount) return;
    await ProjectAPI.createAdvance({
      projectId: createdProjectId,
      amount: Number(advanceAmount),
      paymentDate: dayjs().format('YYYY-MM-DD'),
    });
    setAdvanceModalOpen(false);
    navigation.goBack();
  };

  const statuses = ['CREATED', 'IN_PROGRESS', 'DISCONTINUED', 'COMPLETED'];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
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
            {isEditMode ? 'Edit Project' : 'Create New Project'}
          </Text>

          {/* Customer */}
          {isFromInquiry ? (
            <TextInput
              label="Customer"
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
              placeholder="Select Customer *"
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
              label="Delivery Date *"
              value={deliveryDate}
              mode="outlined"
              editable={false}
              right={<TextInput.Icon icon="calendar" size={wp(6)} />}
              style={styles.input}
              theme={{ roundness: wp(2.5) }}
            />
          </TouchableOpacity>

          {/* Description */}
          <TextInput
            label="Project Description *"
            value={projectDescription}
            onChangeText={setProjectDescription}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={[styles.input, styles.textArea]}
            theme={{ roundness: wp(2.5) }}
          />

          {/* Total Amount */}
          <TextInput
            label="Total Amount *"
            value={totalAmount}
            onChangeText={setTotalAmount}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
            theme={{ roundness: wp(2.5) }}
            right={<TextInput.Affix text="₹" />}
          />

          {/* Site Status - Only show in edit mode */}
          {isEditMode && (
            <TextInput
              label="Site Status"
              value={siteStatus}
              onChangeText={setSiteStatus}
              mode="outlined"
              style={styles.input}
              theme={{ roundness: wp(2.5) }}
            />
          )}

          {/* Location - Only show in edit mode */}
          {isEditMode && (
            <TextInput
              label="Site Location"
              value={fullLocation.address}
              mode="outlined"
              editable={false}
              style={styles.input}
              theme={{ roundness: wp(2.5) }}
              right={
                <TextInput.Icon
                  icon="map-marker"
                  size={wp(6)}
                  onPress={fetchLocation}
                  color="#2874b8"
                />
              }
            />
          )}

          {/* Time - Only show in edit mode */}
          {isEditMode && (
            <TouchableOpacity onPress={() => setTimePickerOpen(true)}>
              <TextInput
                label="Preferred Time"
                value={time ? dayjs(time).format('h:mm A') : ''}
                mode="outlined"
                editable={false}
                style={styles.input}
                theme={{ roundness: wp(2.5) }}
                right={<TextInput.Icon icon="clock-outline" size={wp(6)} />}
              />
            </TouchableOpacity>
          )}

          {/* Status - Only show in edit mode */}
          {isEditMode && (
            <Dropdown
              style={styles.dropdown}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              data={statuses.map(s => ({
                label: s.replace(/_/g, ' '),
                value: s,
              }))}
              maxHeight={hp(40)}
              labelField="label"
              valueField="value"
              placeholder="Select Status"
              value={status}
              onChange={item => setStatus(item.value)}
            />
          )}

          {/* Images - Only show in edit mode */}
          {isEditMode && (
            <>
              <Text style={styles.sectionTitle}>
                Site Images ({images.length}/15)
              </Text>
              <View style={styles.imageContainer}>
                {images.map((uri, i) => (
                  <View key={i} style={styles.imageWrapper}>
                    <Image
                      source={{ uri }}
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
                        color="#2874b8"
                      />
                      <Text style={styles.uploadText}>Gallery</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.uploadBtn}
                      onPress={openCamera}
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

          {/* Items */}
          <View style={styles.itemsHeader}>
            <Text style={styles.sectionTitle}>Project Items</Text>
            <Chip icon="calculator" compact style={styles.totalChip}>
              Total: ₹{itemsTotal.toLocaleString('en-IN')}
            </Chip>
          </View>

          {items.length === 0 ? (
            <Text style={styles.emptyText}>No items added yet</Text>
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
            buttonColor="#2874b8"
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
            {isEditMode ? 'Update Project' : 'Save Project'}
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

        {/* Item Dialog - Updated with new fields, styled like quotation modal */}
        <Portal>
          <Dialog
            visible={itemModalOpen}
            onDismiss={() => setItemModalOpen(false)}
          >
            <Dialog.Title>{editingItem ? 'Edit' : 'Add'} Item</Dialog.Title>
            <Dialog.ScrollArea>
              <ScrollView style={{ maxHeight: hp(50) }}>
                <TextInput
                  label="Item Name *"
                  value={itemName}
                  onChangeText={setItemName}
                  mode="outlined"
                  style={styles.dialogInput}
                />
                <TextInput
                  label="Description"
                  value={itemDesc}
                  onChangeText={setItemDesc}
                  mode="outlined"
                  style={styles.dialogInput}
                  multiline
                  numberOfLines={2}
                />
                <TextInput
                  label="Quantity *"
                  value={itemQty}
                  onChangeText={setItemQty}
                  mode="outlined"
                  keyboardType="numeric"
                  style={styles.dialogInput}
                />
                <TextInput
                  label="Rate (MRP) *"
                  value={itemRate}
                  onChangeText={setItemRate}
                  mode="outlined"
                  keyboardType="numeric"
                  style={styles.dialogInput}
                  right={<TextInput.Affix text="₹" />}
                />
                <View style={styles.unitRow}>
                  <View style={{ flex: 1 }}>
                    <Dropdown
                      style={styles.unitDropdown}
                      placeholderStyle={styles.placeholderStyle}
                      selectedTextStyle={styles.selectedTextStyle}
                      data={unitDropdown}
                      labelField="label"
                      valueField="value"
                      placeholder="Unit *"
                      value={selectedItemUnitId}
                      onChange={item => setSelectedItemUnitId(item.value)}
                    />
                  </View>
                  <IconButton
                    icon="plus"
                    size={wp(6)}
                    onPress={() => setUnitModalOpen(true)}
                    style={styles.addUnitBtn}
                  />
                </View>
                <TextInput
                  label="Tax Percentage *"
                  value={itemTaxPercentage}
                  onChangeText={setItemTaxPercentage}
                  mode="outlined"
                  keyboardType="numeric"
                  style={styles.dialogInput}
                  right={<TextInput.Affix text="%" />}
                />
                <TextInput
                  label="HSN/SAC Code"
                  value={itemHsnSac}
                  onChangeText={setItemHsnSac}
                  mode="outlined"
                  style={styles.dialogInput}
                />
              </ScrollView>
            </Dialog.ScrollArea>
            <Dialog.Actions>
              <Button onPress={() => setItemModalOpen(false)}>Cancel</Button>
              <Button
                onPress={saveItemLocally}
                disabled={
                  !itemName || !itemQty || !itemRate || !selectedItemUnitId
                }
              >
                Save
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        {/* Unit Dialog */}
        <Portal>
          <Dialog
            visible={unitModalOpen}
            onDismiss={() => setUnitModalOpen(false)}
          >
            <Dialog.Title>Add New Unit</Dialog.Title>
            <Dialog.Content>
              <TextInput
                label="Unit Name"
                value={newUnitName}
                onChangeText={setNewUnitName}
                mode="outlined"
                style={styles.dialogInput}
              />
              <TextInput
                label="Short Name"
                value={newUnitShortName}
                onChangeText={setNewUnitShortName}
                mode="outlined"
                style={styles.dialogInput}
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setUnitModalOpen(false)}>Cancel</Button>
              <Button onPress={addNewUnit}>Add</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        {/* Advance Dialog */}
        <Portal>
          <Dialog
            visible={advanceModalOpen}
            onDismiss={() => setAdvanceModalOpen(false)}
          >
            <Dialog.Title>Add Advance Payment</Dialog.Title>
            <Dialog.Content>
              <TextInput
                label="Advance Amount"
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
                Skip
              </Button>
              <Button onPress={saveAdvance} disabled={!advanceAmount}>
                Save
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        {/* Date Picker */}
        <DatePicker
          modal
          open={datePickerOpen}
          date={selectedDateObj}
          mode="date"
          minimumDate={new Date()}
          onConfirm={d => {
            setSelectedDateObj(d);
            setDeliveryDate(dayjs(d).format('DD-MM-YYYY'));
            setDatePickerOpen(false);
          }}
          onCancel={() => setDatePickerOpen(false)}
        />

        {/* Time Picker */}
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
  container: { flex: 1, marginTop: hp(-4) },
  content: { padding: wp(5), paddingBottom: hp(20) },
  title: {
    fontSize: wp(6.5),
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: hp(2),
  },
  input: {
    marginBottom: hp(2),
    backgroundColor: '#fff',
  },
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
  thumbnail: {
    width: wp(25),
    height: wp(25),
    borderRadius: wp(2),
  },
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
    borderColor: '#2874b8',
    borderRadius: wp(2),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(2),
    marginBottom: hp(1),
  },
  uploadText: {
    color: '#2874b8',
    marginTop: hp(0.5),
    fontSize: wp(3.2),
    fontWeight: '500',
  },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalChip: {
    backgroundColor: '#e8f5e8',
  },
  itemCard: {
    marginBottom: hp(1.5),
    backgroundColor: '#fff',
  },
  itemName: {
    fontSize: wp(4.2),
    fontWeight: '600',
    color: '#1a1a1a',
  },
  itemCalc: {
    fontSize: wp(3.8),
    color: '#2874b8',
    marginTop: hp(0.3),
    fontWeight: '500',
  },
  itemDesc: {
    fontSize: wp(3.4),
    color: '#666',
    marginTop: hp(0.5),
  },
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
  saveButton: {
    marginTop: hp(3),
    borderRadius: wp(3),
  },
  saveButtonContent: { height: hp(7) },
  fab: {
    position: 'absolute',
    right: wp(5),
    bottom: hp(10),
    backgroundColor: '#2874b8',
  },
  dialogInput: {
    marginBottom: hp(2),
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
  snackbar: {
    margin: wp(4),
    borderRadius: wp(2),
  },
});

export default AddProject;
