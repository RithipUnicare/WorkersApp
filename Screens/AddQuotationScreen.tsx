// screens/AddQuotation.tsx
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
import { rootStackParamList } from '../navigation/AppNavigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import dayjs from 'dayjs';
import DatePicker from 'react-native-date-picker';
import { RouteProp } from '@react-navigation/native';
import { Dropdown } from 'react-native-element-dropdown';
import { CustomerAPI, QuotationAPI, UnitAPI } from '../service/apiService';
import { yellowA700 } from 'react-native-paper/lib/typescript/styles/themes/v2/colors';

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

  // Load Customers & Units
  const loadData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [custRes, unitRes] = await Promise.all([
        CustomerAPI.getAll(),
        UnitAPI.getAll(),
      ]);

      if (Array.isArray(custRes.data)) setCustomers(custRes.data);
      if (Array.isArray(unitRes.data)) setUnits(unitRes.data);
    } catch (e) {
      ToastAndroid.show('Failed to load data', ToastAndroid.SHORT);
    } finally {
      setRefreshing(false);
    }
  }, []);

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
            setMobileNo(cust.customerContactNo || cust.phone || '');
            setAddress(cust.customerAddress || cust.address || '');
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
        } catch (e) {
          ToastAndroid.show('Failed to load quotation', ToastAndroid.SHORT);
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
        setMobileNo(cust.contactNo || cust.phone || '');
        setAddress(cust.address || '');
      }
    }
  }, [rawQuotation, rawCustomer, customers, isEditMode, isFromInquiry]);

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
    if (!isEditMode && grandTotal > 0) {
      setTotalBudget(grandTotal.toFixed(2));
      setActualAmount(grandTotal);
    }
  }, [grandTotal, isEditMode]);

  const openItemModal = (item?: QuotationItem) => {
    if (item) {
      setEditingItem(item);
      setItemName(item.itemName);
      setItemDesc(item.itemDescription || '');
      setItemQty(String(item.quantity));
      setSelectedUnitId(item.unitId);
      setItemMrp(String(item.rateMrp));
      setItemTax(String(item.taxPercentage));
      setHsnSac(item.hsnSac || '');
    } else {
      setEditingItem(null);
      setItemName('');
      setItemDesc('');
      setItemQty('');
      setSelectedUnitId(null);
      setItemMrp('');
      setItemTax('');
      setHsnSac('');
    }
    setItemModalOpen(true);
  };

  const saveItemLocally = () => {
    if (!itemName || !itemQty || selectedUnitId === null || !itemMrp) {
      ToastAndroid.show('Name, Qty, Unit, MRP required', ToastAndroid.SHORT);
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
        onPress: async () => {
          const item = items[idx];
          if (item.id) {
            try {
              await QuotationAPI.deleteItem(item.id);
            } catch (e) {
              ToastAndroid.show('Delete failed', ToastAndroid.SHORT);
            }
          }
          setItems(p => p.filter((_, i) => i !== idx));
        },
      },
    ]);
  };

  const addNewUnit = async () => {
    if (!newUnitName || !newUnitShortName) {
      ToastAndroid.show('Both fields required', ToastAndroid.SHORT);
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
      ToastAndroid.show('Unit added', ToastAndroid.SHORT);
    } catch (e) {
      ToastAndroid.show('Failed to add unit', ToastAndroid.SHORT);
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
      if (!customerId) {
        ToastAndroid.show('Customer is required', ToastAndroid.SHORT);
      }
      if (!deliveryDate) {
        ToastAndroid.show('Delivery Date is required', ToastAndroid.SHORT);
      }
      if (!description) {
        ToastAndroid.show('Description is required', ToastAndroid.SHORT);
      }
      if (!totalBudget) {
        ToastAndroid.show('Total Budget is required', ToastAndroid.SHORT);
      }
      if (!items.length) {
        ToastAndroid.show('At least one item is required', ToastAndroid.SHORT);
      }
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        customerId,
        projectDescription: description,
        deliveryDate: dayjs(deliveryDate, 'DD-MM-YYYY').format('YYYY-MM-DD'),
        totalBudget: Number(actualAmount),
        discount: Number(discount),
        items: items.map(i => ({
          quotationId: rawQuotation?.id || 0,
          itemName: i.itemName,
          itemDescription: i.itemDescription,
          rateMrp: i.rateMrp,
          quantity: i.quantity,
          unitId: i.unitId,
          taxPercentage: i.taxPercentage,
          hsnSac: i.hsnSac,
        })),
      };

      if (isEditMode && rawQuotation?.id) {
        await QuotationAPI.update(rawQuotation.id, payload);
        ToastAndroid.show('Quotation updated!', ToastAndroid.SHORT);
      } else {
        const res = await QuotationAPI.create(payload);
        ToastAndroid.show('Quotation created!', ToastAndroid.SHORT);
      }

      setTimeout(() => navigation.goBack(), 800);
    } catch (e: any) {
      ToastAndroid.show(e?.message || 'Save failed', ToastAndroid.SHORT);
    } finally {
      setLoading(false);
    }
  };

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
            {isEditMode ? 'Edit Quotation' : 'Create Quotation'}
          </Text>

          {isFromInquiry ? (
            <TextInput
              label="Customer"
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
              placeholder="Select Customer *"
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

          {/* <TextInput
            label="Customer Name"
            value={customerName}
            mode="outlined"
            style={styles.input}
          /> */}
          <TextInput
            label="Mobile No"
            value={mobileNo}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Address"
            value={address}
            mode="outlined"
            multiline
            style={[styles.input, styles.textArea]}
          />

          <TextInput
            label="Project Description *"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={[styles.input, styles.textArea]}
          />

          <TouchableOpacity onPress={() => setDatePickerOpen(true)}>
            <TextInput
              label="Delivery Date *"
              value={deliveryDate}
              mode="outlined"
              editable={false}
              style={styles.input}
              right={<TextInput.Icon icon="calendar" size={wp(6)} />}
            />
          </TouchableOpacity>
          <TextInput
            label="Total Budget *"
            value={actualAmount.toString()}
            onChangeText={text => {
              setActualAmount(Number(text));
              setTotalBudget(text);
            }}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
            editable={!isEditMode}
            left={<TextInput.Affix text="₹" />}
          />
          <TextInput
            label="Total Amount *"
            value={totalBudget}
            onChangeText={setTotalBudget}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
            editable={!isEditMode}
            left={<TextInput.Affix text="₹" />}
          />
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
                label="Discount"
                value={discount === 0 ? '' : String(discount)}
                onChangeText={text => {
                  const discountValue = text === '' ? 0 : Number(text);
                  setDiscount(discountValue);

                  if (discountValue === 0 || text === '') {
                    setTotalBudget(String(actualAmount));
                    setDiscountPercent(0);
                  } else {
                    // Calculate percentage based on actualAmount (original total)
                    const percentage = (discountValue / actualAmount) * 100;
                    setDiscountPercent(percentage);

                    // Update totalAmount by subtracting from actualAmount
                    setTotalBudget(String(actualAmount - discountValue));
                  }
                }}
                mode="outlined"
                keyboardType="numeric"
                style={[styles.input, { width: wp(60) }]}
                theme={{ roundness: wp(2.5) }}
                disabled={false}
              />
              <TextInput
                label="Percentage"
                value={
                  discountPercent === 0 ? '0.00' : discountPercent.toFixed(2)
                }
                mode="outlined"
                keyboardType="numeric"
                style={[styles.input, { width: wp(30) }]}
                theme={{ roundness: wp(2.5) }}
                editable={false}
                right={
                  <TextInput.Icon icon="percent" size={wp(6)} color="#2874b8" />
                }
              />
            </View>
          )}

          <View style={styles.itemsHeader}>
            <Text style={styles.sectionTitle}>Items</Text>
            <Chip icon="calculator" style={styles.totalChip}>
              ₹{grandTotal.toFixed(2)}
            </Chip>
          </View>

          {items.length === 0 ? (
            <Text style={styles.emptyText}>No items added yet</Text>
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
                      onPress={() => openItemModal(item)}
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
            {isEditMode ? 'Update Quotation' : 'Save Quotation'}
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
        <Portal>
          <Dialog
            visible={itemModalOpen}
            onDismiss={() => setItemModalOpen(false)}
          >
            <Dialog.Title>{editingItem ? 'Edit' : 'Add'} Item</Dialog.Title>
            <Dialog.ScrollArea>
              <ScrollView style={{ maxHeight: hp(55) }}>
                <TextInput
                  label="Name *"
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
                />
                <TextInput
                  label="Quantity *"
                  value={itemQty}
                  onChangeText={setItemQty}
                  mode="outlined"
                  keyboardType="numeric"
                  style={styles.dialogInput}
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
                      value={selectedUnitId}
                      onChange={item => setSelectedUnitId(item.value)}
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
                  label="MRP *"
                  value={itemMrp}
                  onChangeText={setItemMrp}
                  mode="outlined"
                  keyboardType="numeric"
                  style={styles.dialogInput}
                  left={<TextInput.Affix text="₹" />}
                />
                <TextInput
                  label="HSN/SAC"
                  value={hsnSac}
                  onChangeText={setHsnSac}
                  mode="outlined"
                  style={styles.dialogInput}
                />
                <TextInput
                  label="Tax (%)"
                  value={itemTax}
                  onChangeText={setItemTax}
                  mode="outlined"
                  keyboardType="numeric"
                  style={styles.dialogInput}
                  right={<TextInput.Affix text="%" />}
                />
                <Text style={styles.amountPreview}>
                  Total: ₹{calculateItemTotal().toFixed(2)}
                </Text>
              </ScrollView>
            </Dialog.ScrollArea>
            <Dialog.Actions>
              <Button onPress={() => setItemModalOpen(false)}>Cancel</Button>
              <Button onPress={saveItemLocally}>Save</Button>
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
});

export default AddQuotation;
