// screens/AddProject.tsx
import React, { useState, useEffect, useMemo } from 'react';
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
} from 'react-native';
import {
  TextInput,
  Button,
  Portal,
  Dialog,
  FAB,
  IconButton,
  Card,
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
import { ProjectAPI, CustomerAPI } from '../service/apiService';

const { width, height } = Dimensions.get('window');

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
};

const AddProject: React.FC<Props> = ({ navigation, route }) => {
  const rawCustomer: any = route.params?.customer;
  const rawProject: any = route.params?.projectToEdit;

  const isEditMode = !!rawProject;
  const isFromInquiry = !!rawCustomer && !isEditMode;

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

  const [items, setItems] = useState<ProjectItem[]>([]);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProjectItem | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemQty, setItemQty] = useState('');
  const [itemRate, setItemRate] = useState('');

  const [advanceModalOpen, setAdvanceModalOpen] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [createdProjectId, setCreatedProjectId] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const list = await CustomerAPI.getAll();
        if (Array.isArray(list.data)) setCustomers(list.data);
      } catch (e) {}
    };
    load();
  }, []);

  const customerDropdown = useMemo(
    () =>
      customers.map((c, i) => ({
        label: `${c.name} - ${c.contactNo || c.phone || '—'}`,
        value: i,
      })),
    [customers],
  );

  useEffect(() => {
    if (isEditMode && rawProject) {
      const idx = customers.findIndex(c => c.id === rawProject.customerId);
      if (idx > -1) {
        setSelectedCustomerIdx(idx);
        setCustomerId(customers[idx].id);
      }

      setDeliveryDate(dayjs(rawProject.deliveryDate).format('DD-MM-YYYY'));
      setSelectedDateObj(new Date(rawProject.deliveryDate));
      setProjectDescription(rawProject.projectDescription || '');
      setTotalAmount(String(rawProject.totalAmount || ''));

      if (rawProject.siteImages && Array.isArray(rawProject.siteImages)) {
        setImages(
          rawProject.siteImages.map((img: any) => img.imageUrl).filter(Boolean),
        );
      }

      if (rawProject.projectItems && Array.isArray(rawProject.projectItems)) {
        setItems(
          rawProject.projectItems.map((it: any) => ({
            id: it.id,
            itemName: it.itemName,
            itemDescription: it.itemDescription,
            rateMrp: it.rateMrp,
            quantity: it.quantity,
            amount: it.rateMrp * it.quantity,
          })),
        );
      }
    } else if (isFromInquiry && rawCustomer) {
      const idx = customers.findIndex(c => c.id === rawCustomer.id);
      if (idx > -1) {
        setSelectedCustomerIdx(idx);
        setCustomerId(customers[idx].id);
      }
    }
  }, [rawProject, rawCustomer, customers, isEditMode, isFromInquiry]);

  const fetchLocation = async () => {
    try {
      const loc: any = await getLocation();
      if (loc?.address && loc?.pos) {
        setFullLocation({
          address: loc.address,
          latitude: loc.pos.coords.latitude,
          longitude: loc.pos.coords.longitude,
        });
      }
    } catch (e) {}
  };

  const pickImage = () => {
    if (images.length >= 15) return;
    launchImageLibrary({ mediaType: 'photo', quality: 0.5 }, res => {
      if (res.assets?.[0]?.uri) setImages(p => [...p, res.assets![0].uri!]);
    });
  };

  const openCamera = () => {
    if (images.length >= 15) return;
    launchCamera({ mediaType: 'photo', quality: 0.5 }, res => {
      if (res.assets?.[0]?.uri) setImages(p => [...p, res.assets![0].uri!]);
    });
  };

  const removeImage = (i: number) =>
    setImages(p => p.filter((_, idx) => idx !== i));

  const openItemModal = (item?: ProjectItem) => {
    if (item) {
      setEditingItem(item);
      setItemName(item.itemName);
      setItemDesc(item.itemDescription || '');
      setItemQty(String(item.quantity));
      setItemRate(String(item.rateMrp));
    } else {
      setEditingItem(null);
      setItemName('');
      setItemDesc('');
      setItemQty('');
      setItemRate('');
    }
    setItemModalOpen(true);
  };

  const saveItemLocally = () => {
    const qty = Number(itemQty) || 0;
    const rate = Number(itemRate) || 0;
    const amount = qty * rate;

    const newItem: ProjectItem = {
      id: editingItem?.id,
      itemName,
      itemDescription: itemDesc,
      rateMrp: rate,
      quantity: qty,
      amount,
    };

    setItems(prev =>
      editingItem?.id
        ? prev.map(i => (i.id === editingItem.id ? newItem : i))
        : [...prev, newItem],
    );
    setItemModalOpen(false);
  };

  const deleteItemLocal = (idx: number) => {
    Alert.alert('Delete Item', 'Sure?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => setItems(p => p.filter((_, i) => i !== idx)),
      },
    ]);
  };

  const itemsTotal = items.reduce((s, it) => s + (it.amount || 0), 0);
  useEffect(() => {
    if (!isEditMode && itemsTotal > 0) setTotalAmount(String(itemsTotal));
  }, [itemsTotal, isEditMode]);

  const handleSave = async () => {
    if (!customerId || !deliveryDate || !projectDescription || !totalAmount) {
      Alert.alert('Missing fields', 'Please fill all required fields.');
      return;
    }

    const payload: any = {
      customerId,
      deliveryDate: dayjs(deliveryDate, 'DD-MM-YYYY').format('YYYY-MM-DD'),
      projectDescription,
      totalAmount: Number(totalAmount),
      items: items.map(i => ({
        itemName: i.itemName,
        itemDescription: i.itemDescription,
        rateMrp: i.rateMrp,
        quantity: i.quantity,
      })),
    };

    try {
      let projectId: number;

      if (isEditMode && rawProject?.id) {
        const updated: any = await ProjectAPI.update(rawProject.id, payload);
        console.log(updated);
        projectId = rawProject.id;

        if (images.length) await uploadImages(projectId);
      } else {
        console.log('new');
        const created: any = await ProjectAPI.create(payload);
        projectId = created.data.id || created.data.projectId;
        setCreatedProjectId(projectId);
        if (images.length) await uploadImages(projectId);
        setAdvanceModalOpen(true);
        return;
      }

      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Operation failed');
    }
  };

  const uploadImages = async (projectId: number) => {
    if (!images.length) return;

    // Filter only new images (local URIs), skip remote URLs
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>
          {isEditMode ? 'Edit Project' : 'Add New Project'}
        </Text>

        {isFromInquiry ? (
          <TextInput
            label="Customer *"
            value={customers.find(c => c.id === customerId)?.name || ''}
            mode="outlined"
            disabled
            style={styles.input}
          />
        ) : (
          <Dropdown
            style={styles.dropdown}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            data={customerDropdown}
            search
            maxHeight={height * 0.4}
            labelField="label"
            valueField="value"
            placeholder="Select customer *"
            value={selectedCustomerIdx}
            onChange={item => {
              const cust = customers[item.value];
              setCustomerId(cust.id);
              setSelectedCustomerIdx(item.value);
            }}
          />
        )}

        <TouchableOpacity onPress={() => setDatePickerOpen(true)}>
          <TextInput
            label="Delivery Date *"
            value={deliveryDate}
            mode="outlined"
            editable={false}
            right={<TextInput.Icon icon="calendar" />}
            style={styles.input}
          />
        </TouchableOpacity>

        <TextInput
          label="Project Description *"
          value={projectDescription}
          onChangeText={setProjectDescription}
          mode="outlined"
          multiline
          style={[styles.input, { minHeight: height * 0.1 }]}
        />

        <TextInput
          label="Total Amount *"
          value={totalAmount}
          onChangeText={setTotalAmount}
          mode="outlined"
          keyboardType="numeric"
          style={styles.input}
        />

        <TextInput
          label="Location"
          value={fullLocation.address}
          mode="outlined"
          editable={false}
          style={styles.input}
          right={<TextInput.Icon icon="map-marker" onPress={fetchLocation} />}
        />

        <Text style={styles.imageLabel}>Site Images (max 15)</Text>
        <View style={styles.imageContainer}>
          {images.map((uri, i) => (
            <View key={i} style={styles.imageWrapper}>
              <Image source={{ uri }} style={styles.image} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeImage(i)}
              >
                <MaterialCommunityIcons name="close" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
          {images.length < 15 && (
            <>
              <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                <MaterialCommunityIcons
                  name="upload"
                  size={width * 0.08}
                  color="#2874b8"
                />
                <Text style={styles.uploadText}>Upload</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={openCamera}
              >
                <MaterialCommunityIcons
                  name="camera"
                  size={width * 0.08}
                  color="#2874b8"
                />
                <Text style={styles.uploadText}>Camera</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <Text style={styles.imageLabel}>Items</Text>
        {items.length === 0 ? (
          <Text style={styles.emptyText}>No items added</Text>
        ) : (
          items.map((item, index) => (
            <Card key={index} style={styles.itemCard}>
              <Card.Content>
                <Text style={styles.itemName}>{item.itemName}</Text>
                <Text>
                  {item.quantity} × ₹{item.rateMrp} = ₹{item.amount}
                </Text>
                {item.itemDescription && (
                  <Text style={{ color: '#666', fontSize: 12 }}>
                    {item.itemDescription}
                  </Text>
                )}
              </Card.Content>
              <Card.Actions>
                <IconButton
                  icon="pencil"
                  size={20}
                  onPress={() => openItemModal(item)}
                />
                <IconButton
                  icon="delete"
                  size={20}
                  onPress={() => deleteItemLocal(index)}
                />
              </Card.Actions>
            </Card>
          ))
        )}

        <Button
          mode="contained"
          onPress={handleSave}
          style={styles.button}
          buttonColor="#2874b8"
          disabled={
            !customerId || !deliveryDate || !projectDescription || !totalAmount
          }
        >
          {isEditMode ? 'Update Project' : 'Save Project'}
        </Button>
      </ScrollView>

      <FAB icon="plus" style={styles.fab} onPress={() => openItemModal()} />

      <Portal>
        <Dialog
          visible={itemModalOpen}
          onDismiss={() => setItemModalOpen(false)}
        >
          <Dialog.Title>{editingItem ? 'Edit' : 'Add'} Item</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Item Name *"
              value={itemName}
              onChangeText={setItemName}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Description"
              value={itemDesc}
              onChangeText={setItemDesc}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Quantity *"
              value={itemQty}
              onChangeText={setItemQty}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
            />
            <TextInput
              label="Rate (MRP) *"
              value={itemRate}
              onChangeText={setItemRate}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setItemModalOpen(false)}>Cancel</Button>
            <Button
              onPress={saveItemLocally}
              disabled={!itemName || !itemQty || !itemRate}
            >
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Portal>
        <Dialog
          visible={advanceModalOpen}
          onDismiss={() => setAdvanceModalOpen(false)}
        >
          <Dialog.Title>Add Advance Payment</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Amount"
              value={advanceAmount}
              onChangeText={setAdvanceAmount}
              mode="outlined"
              keyboardType="numeric"
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
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: width * 0.06, paddingBottom: height * 0.15 },
  title: {
    fontSize: width * 0.06,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: height * 0.03,
  },
  input: { marginBottom: height * 0.02 },
  dropdown: {
    height: 56,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginBottom: height * 0.02,
  },
  placeholderStyle: { fontSize: 16, color: '#888' },
  selectedTextStyle: { fontSize: 16, color: '#000' },
  imageLabel: {
    fontSize: width * 0.04,
    color: '#333',
    marginVertical: height * 0.015,
    fontWeight: '600',
  },
  imageContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  imageWrapper: {
    position: 'relative',
    marginRight: width * 0.02,
    marginBottom: height * 0.02,
  },
  image: { width: width * 0.25, height: width * 0.25, borderRadius: 8 },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#e74c3c',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButton: {
    width: width * 0.25,
    height: width * 0.25,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#2874b8',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: width * 0.02,
    marginBottom: height * 0.02,
  },
  uploadText: { color: '#2874b8', marginTop: 6, fontSize: width * 0.035 },
  button: { marginTop: height * 0.03, borderRadius: 12, paddingVertical: 8 },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#2874b8',
  },
  itemCard: { marginBottom: height * 0.015 },
  itemName: { fontWeight: '600', fontSize: width * 0.04 },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginVertical: height * 0.02,
    fontStyle: 'italic',
  },
});

export default AddProject;
