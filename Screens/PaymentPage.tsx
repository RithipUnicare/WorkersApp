import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Share as RNShare,
  Platform,
  Dimensions,
  FlatList,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Card,
  Divider,
  Button,
  Dialog,
  Portal,
  TextInput,
  RadioButton,
  IconButton,
  DataTable,
} from 'react-native-paper';
import { WebView } from 'react-native-webview';
import DatePicker from 'react-native-date-picker';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { rootStackParamList } from '../navigation/AppNavigation';
import { ProjectAPI } from '../service/apiService';
import Share from 'react-native-share';
import RNFS from 'react-native-fs';
import { generatePDF } from 'react-native-html-to-pdf';
import dayjs from 'dayjs';
import generateInvoiceHTML from '../utils/InvoiceHTML';

const { width, height } = Dimensions.get('window');

// Responsive helpers
const wp = (percentage: number) => (width * percentage) / 100;
const hp = (percentage: number) => (height * percentage) / 100;

type PaymentTime = {
  hour: number;
  minute: number;
  second: number;
  nano: number;
};

type Payment = {
  id: number;
  amount: number;
  type: string;
  createdAt: string;
  paymentDate: string;
  paymentTime?: PaymentTime;
  notes?: string;
};

type Project = {
  id: number;
  customerName: string;
  grandTotal: number;
  remainingAmount?: number;
  projectItems: Array<{ totalCost: number }>;
  advancePayments: Array<{ amount: number }>;
  paymentsIn: Array<{ amount: number }>;
  paymentsOut: Array<{ amount: number }>;
};

type Props = {
  route: RouteProp<rootStackParamList, 'PaymentPage'>;
  navigation: NativeStackNavigationProp<rootStackParamList, 'PaymentPage'>;
};

export const blobToBase64 = (blob: any): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Blob read error'));
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
};

const PaymentPage: React.FC<Props> = ({ route, navigation }) => {
  const { project } = route.params;
  const [paymentsIn, setPaymentsIn] = useState<Payment[]>([]);
  const [paymentsOut, setPaymentsOut] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [isPaymentIn, setIsPaymentIn] = useState(true);
  const [amount, setAmount] = useState('');
  const [paymentType, setPaymentType] = useState('Cash');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  // Preview Modal State
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');

  useEffect(() => {
    navigation.setOptions({ title: `Payments - ${project.customerName}` });
  }, [project.customerName, navigation]);

  useEffect(() => {
    loadPayments();
  }, [project.id]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const [inRes, outRes] = await Promise.all([
        ProjectAPI.getPaymentsIn(project.id),
        ProjectAPI.getPaymentsOut(project.id),
      ]);

      setPaymentsIn(Array.isArray(inRes.data) ? inRes.data : []);
      setPaymentsOut(Array.isArray(outRes.data) ? outRes.data : []);
    } catch (e) {
      console.error('Failed to load payments', e);
      Alert.alert('Error', 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  // === Calculations ===
  const itemsTotal = project.projectItems.reduce(
    (sum, i) => sum + i.totalCost,
    0,
  );
  const advanceTotal = project.advancePayments.reduce(
    (sum, a) => sum + a.amount,
    0,
  );
  const paidInTotal = paymentsIn.reduce((sum, p) => sum + p.amount, 0);
  const paidOutTotal = paymentsOut.reduce((sum, p) => sum + p.amount, 0);
  const netRemaining =
    project.grandTotal - (paidInTotal + advanceTotal) + paidOutTotal;

  const handleAddPayment = async () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid', 'Enter a valid amount');
      return;
    }

    const payload = {
      projectId: project.id,
      amount: amt,
      paymentDate: dayjs(date).format('YYYY-MM-DD'),
      type: paymentType,
      notes,
    };

    try {
      if (editingId) {
        if (isPaymentIn) {
          await ProjectAPI.updatePaymentIn(editingId, payload);
        } else {
          await ProjectAPI.updatePaymentOut(editingId, payload);
        }
      } else {
        if (isPaymentIn) {
          const res = await ProjectAPI.createPaymentIn(payload);
          console.log(res);
        } else {
          const res = await ProjectAPI.createPaymentOut(payload);
          console.log(res);
        }
      }

      setModalVisible(false);
      setEditingId(null);
      setAmount('');
      setNotes('');
      setPaymentType(isPaymentIn ? 'Cash' : 'Vendor');
      loadPayments();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save payment');
    }
  };

  const handleEditPayment = (payment: Payment, isIn: boolean) => {
    setIsPaymentIn(isIn);
    setAmount(payment.amount.toString());
    setDate(new Date(payment.paymentDate));
    setPaymentType(payment.type);
    setNotes(payment.notes || '');
    setEditingId(payment.id);
    setModalVisible(true);
  };

  const handleDeletePayment = (payment: Payment, isIn: boolean) => {
    Alert.alert(
      'Delete Payment',
      'Are you sure you want to delete this payment?',
      [
        { text: 'Cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (isIn) {
                await ProjectAPI.deletePaymentIn(payment.id);
              } else {
                await ProjectAPI.deletePaymentOut(payment.id);
              }
              loadPayments();
            } catch (e) {
              Alert.alert('Error', 'Failed to delete payment');
            }
          },
        },
      ],
    );
  };

  const previewInvoice = () => {
    try {
      // Generate HTML content
      const html = generateInvoiceHTML({
        ...project,
        paymentsIn,
        paymentsOut,
      });

      setHtmlContent(html);
      setPreviewModalVisible(true);
    } catch (e: any) {
      console.error('Preview error:', e);
      Alert.alert('Error', 'Failed to generate invoice preview');
    }
  };

  const shareInvoice = async () => {
    try {
      setLoading(true);

      // Generate HTML content
      const htmlContent = generateInvoiceHTML({
        ...project,
        paymentsIn,
        paymentsOut,
      });

      // Convert HTML to PDF
      const options = {
        html: htmlContent,
        fileName: `${project.customerName}_Invoice`,
        directory: 'Documents',
      };

      const { filePath } = await generatePDF(options);
      console.log('PDF generated at:', filePath);

      if (!filePath) {
        throw new Error('Failed to generate PDF');
      }

      const fileName = `${project.customerName}_Invoice_${project.id}.pdf`;
      let downloadsPath;

      if (Platform.OS === 'android') {
        downloadsPath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
      } else {
        downloadsPath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      }

      // Copy to Downloads (or Documents for iOS)
      await RNFS.copyFile(filePath, downloadsPath);
      console.log('PDF copied to:', downloadsPath);

      // Share from Downloads path
      await Share.open({
        title: `Invoice - ${project.customerName}`,
        message: `Invoice for project #${project.id}`,
        url: `file://${downloadsPath}`,
        type: 'application/pdf',
      });

      // Unlink original after successful share
      await RNFS.unlink(filePath);
    } catch (e: any) {
      console.error('Share error:', e);
      if (e.message !== 'User did not share') {
        Alert.alert('Error', e.message ?? 'Failed to generate/share PDF');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const closeModal = () => {
    setModalVisible(false);
    if (!editingId) {
      setAmount('');
      setNotes('');
      setPaymentType(isPaymentIn ? 'Cash' : 'Vendor');
    }
    setEditingId(null);
  };

  const renderPaymentInItem = ({ item }: { item: Payment }) => (
    <DataTable.Row key={item.id}>
      <DataTable.Cell style={styles.dateCell}>
        <View>
          <Text style={styles.cellDate}>{formatDate(item.paymentDate)}</Text>
          <Text style={styles.cellType}>{item.type}</Text>
        </View>
      </DataTable.Cell>
      <DataTable.Cell numeric style={styles.amountCell}>
        <Text style={styles.amountIn}>
          ₹{item.amount.toLocaleString('en-IN')}
        </Text>
      </DataTable.Cell>
      <DataTable.Cell style={styles.notesCell}>
        <Text style={styles.cellNotes} numberOfLines={2}>
          {item.notes || '-'}
        </Text>
      </DataTable.Cell>
      <DataTable.Cell style={styles.actionsCell}>
        <View style={styles.actionButtons}>
          <IconButton
            icon="pencil"
            size={wp(4.5)}
            onPress={() => handleEditPayment(item, true)}
            iconColor="#2874b8"
            style={styles.iconBtn}
          />
          <IconButton
            icon="delete"
            size={wp(4.5)}
            onPress={() => handleDeletePayment(item, true)}
            iconColor="#e74c3c"
            style={styles.iconBtn}
          />
        </View>
      </DataTable.Cell>
    </DataTable.Row>
  );

  const renderPaymentOutItem = ({ item }: { item: Payment }) => (
    <DataTable.Row key={item.id}>
      <DataTable.Cell style={styles.dateCell}>
        <View>
          <Text style={styles.cellDate}>{formatDate(item.paymentDate)}</Text>
          <Text style={styles.cellType}>{item.type}</Text>
        </View>
      </DataTable.Cell>
      <DataTable.Cell numeric style={styles.amountCell}>
        <Text style={styles.amountOut}>
          ₹{item.amount.toLocaleString('en-IN')}
        </Text>
      </DataTable.Cell>
      <DataTable.Cell style={styles.notesCell}>
        <Text style={styles.cellNotes} numberOfLines={2}>
          {item.notes || '-'}
        </Text>
      </DataTable.Cell>
      <DataTable.Cell style={styles.actionsCell}>
        <View style={styles.actionButtons}>
          <IconButton
            icon="pencil"
            size={wp(4.5)}
            onPress={() => handleEditPayment(item, false)}
            iconColor="#2874b8"
            style={styles.iconBtn}
          />
          <IconButton
            icon="delete"
            size={wp(4.5)}
            onPress={() => handleDeletePayment(item, false)}
            iconColor="#e74c3c"
            style={styles.iconBtn}
          />
        </View>
      </DataTable.Cell>
    </DataTable.Row>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 100}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color="#2874b8" />
            </View>
          ) : (
            <>
              {/* Project Summary */}
              <Card style={styles.card}>
                <Card.Content>
                  <Text style={styles.title}>Project Financials</Text>

                  <View style={styles.row}>
                    <Text style={styles.label}>Project Total</Text>
                    <Text style={styles.value}>
                      ₹{project.grandTotal.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <Divider style={styles.divider} />

                  <View style={styles.row}>
                    <Text style={styles.label}>Items Cost</Text>
                    <Text style={styles.value}>
                      ₹{itemsTotal.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <Divider style={styles.divider} />

                  {/* <View style={styles.row}>
                  <Text style={styles.label}>Advance Received</Text>
                  <Text style={[styles.value, { color: '#27ae60' }]}>
                    ₹{advanceTotal.toLocaleString('en-IN')}
                  </Text>
                </View>
                <Divider style={styles.divider} /> */}

                  <View style={styles.row}>
                    <Text style={styles.label}>Payments In</Text>
                    <Text style={[styles.value, { color: '#27ae60' }]}>
                      ₹{paidInTotal.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <Divider style={styles.divider} />

                  <View style={styles.row}>
                    <Text style={styles.label}>Payments Out</Text>
                    <Text style={[styles.value, { color: '#e74c3c' }]}>
                      ₹{paidOutTotal.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <Divider style={styles.divider} />

                  <View style={styles.row}>
                    <Text style={styles.label}>Net Remaining</Text>
                    <Text
                      style={[
                        styles.value,
                        netRemaining <= 0
                          ? { color: '#27ae60' }
                          : { color: '#e74c3c' },
                      ]}
                    >
                      ₹{Math.abs(netRemaining).toLocaleString('en-IN')}{' '}
                      {netRemaining < 0 ? ' (Extra)' : ''}
                    </Text>
                  </View>
                </Card.Content>
              </Card>

              {/* Add Payment Buttons */}
              <View style={styles.buttonRow}>
                <Button
                  mode="contained"
                  onPress={() => {
                    setIsPaymentIn(true);
                    setEditingId(null);
                    setModalVisible(true);
                  }}
                  style={styles.addBtn}
                  contentStyle={styles.addBtnContent}
                  buttonColor="#27ae60"
                >
                  + Payment In
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setIsPaymentIn(false);
                    setEditingId(null);
                    setModalVisible(true);
                  }}
                  style={styles.addBtn}
                  contentStyle={styles.addBtnContent}
                  textColor="#e74c3c"
                >
                  + Payment Out
                </Button>
              </View>

              {/* Payments In Section */}
              <Card style={styles.tableCard}>
                <Card.Content>
                  <Text style={styles.sectionTitle}>Payments In</Text>
                  {paymentsIn.length === 0 ? (
                    <Text style={styles.empty}>No payments received</Text>
                  ) : (
                    <DataTable>
                      <DataTable.Header style={styles.tableHeaderIn}>
                        <DataTable.Title style={styles.dateCell}>
                          <Text style={styles.headerText}>Date & Type</Text>
                        </DataTable.Title>
                        <DataTable.Title numeric style={styles.amountCell}>
                          <Text style={styles.headerText}>Amount</Text>
                        </DataTable.Title>
                        <DataTable.Title style={styles.notesCell}>
                          <Text style={styles.headerText}>Notes</Text>
                        </DataTable.Title>
                        <DataTable.Title style={styles.actionsCell}>
                          <Text style={styles.headerText}>Actions</Text>
                        </DataTable.Title>
                      </DataTable.Header>
                      <FlatList
                        data={paymentsIn}
                        keyExtractor={item => item.id.toString()}
                        renderItem={renderPaymentInItem}
                        scrollEnabled={false}
                      />
                    </DataTable>
                  )}
                </Card.Content>
              </Card>

              {/* Payments Out Section */}
              <Card style={styles.tableCard}>
                <Card.Content>
                  <Text style={styles.sectionTitle}>Payments Out</Text>
                  {paymentsOut.length === 0 ? (
                    <Text style={styles.empty}>No payments made</Text>
                  ) : (
                    <DataTable>
                      <DataTable.Header style={styles.tableHeaderOut}>
                        <DataTable.Title style={styles.dateCell}>
                          <Text style={styles.headerText}>Date & Type</Text>
                        </DataTable.Title>
                        <DataTable.Title numeric style={styles.amountCell}>
                          <Text style={styles.headerText}>Amount</Text>
                        </DataTable.Title>
                        <DataTable.Title style={styles.notesCell}>
                          <Text style={styles.headerText}>Notes</Text>
                        </DataTable.Title>
                        <DataTable.Title style={styles.actionsCell}>
                          <Text style={styles.headerText}>Actions</Text>
                        </DataTable.Title>
                      </DataTable.Header>
                      <FlatList
                        data={paymentsOut}
                        keyExtractor={item => item.id.toString()}
                        renderItem={renderPaymentOutItem}
                        scrollEnabled={false}
                      />
                    </DataTable>
                  )}
                </Card.Content>
              </Card>

              {/* Share Invoice */}
              <View style={styles.buttonRow}>
                <Button
                  mode="outlined"
                  icon="eye"
                  onPress={previewInvoice}
                  style={styles.actionBtn}
                  contentStyle={styles.actionBtnContent}
                  textColor="#2874b8"
                >
                  Preview Invoice
                </Button>
                <Button
                  mode="outlined"
                  icon="share-variant"
                  onPress={shareInvoice}
                  style={styles.actionBtn}
                  contentStyle={styles.actionBtnContent}
                  disabled={loading}
                  textColor="#27ae60"
                >
                  Share Invoice
                </Button>
              </View>
            </>
          )}

          {/* Add Payment Modal */}
          <Portal>
            <Dialog
              visible={modalVisible}
              onDismiss={closeModal}
              style={styles.dialog}
            >
              <Dialog.Title style={styles.dialogTitle}>
                {editingId ? 'Edit' : 'Record'}{' '}
                {isPaymentIn ? 'Payment In' : 'Payment Out'}
              </Dialog.Title>
              <Dialog.ScrollArea style={styles.dialogScrollArea}>
                <ScrollView contentContainerStyle={styles.dialogContent}>
                  <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.container}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 100}
                  >
                    <TextInput
                      label="Amount"
                      value={amount}
                      onChangeText={setAmount}
                      mode="outlined"
                      keyboardType="numeric"
                      style={styles.input}
                      theme={{ roundness: wp(2) }}
                      left={<TextInput.Affix text="₹" />}
                    />

                    <Text style={styles.radioLabel}>Payment Type</Text>
                    <RadioButton.Group
                      onValueChange={setPaymentType}
                      value={paymentType}
                    >
                      {(isPaymentIn
                        ? ['Cash', 'UPI', 'Bank', 'Cheque']
                        : ['Vendor', 'Material', 'Labour', 'Transport']
                      ).map(t => (
                        <View key={t} style={styles.radioRow}>
                          <RadioButton value={t} />
                          <Text style={styles.radioText}>{t}</Text>
                        </View>
                      ))}
                    </RadioButton.Group>

                    <TextInput
                      label="Date"
                      value={dayjs(date).format('DD-MM-YYYY')}
                      mode="outlined"
                      style={styles.input}
                      editable={false}
                      right={
                        <TextInput.Icon
                          icon="calendar"
                          onPress={() => setShowDatePicker(true)}
                          size={wp(6)}
                        />
                      }
                    />

                    <TextInput
                      label="Notes (Optional)"
                      value={notes}
                      onChangeText={setNotes}
                      mode="outlined"
                      style={[styles.input, styles.multiline]}
                      multiline
                      numberOfLines={3}
                    />
                  </KeyboardAvoidingView>
                </ScrollView>
              </Dialog.ScrollArea>
              <Dialog.Actions>
                <Button onPress={closeModal}>Cancel</Button>
                <Button onPress={handleAddPayment} disabled={!amount.trim()}>
                  {editingId ? 'Update' : 'Save'}
                </Button>
              </Dialog.Actions>
            </Dialog>
          </Portal>

          <DatePicker
            modal
            open={showDatePicker}
            date={date}
            mode="date"
            maximumDate={new Date()}
            onConfirm={d => {
              setDate(d);
              setShowDatePicker(false);
            }}
            onCancel={() => setShowDatePicker(false)}
          />

          {/* Preview Modal */}
          <Modal
            visible={previewModalVisible}
            animationType="slide"
            onRequestClose={() => setPreviewModalVisible(false)}
          >
            <SafeAreaView style={styles.previewModalContainer}>
              <View style={styles.previewHeader}>
                <Text style={styles.previewTitle}>Invoice Preview</Text>
                <View style={styles.previewActions}>
                  <IconButton
                    icon="share-variant"
                    size={wp(6)}
                    onPress={() => {
                      setPreviewModalVisible(false);
                      shareInvoice();
                    }}
                    iconColor="#27ae60"
                  />
                  <IconButton
                    icon="close"
                    size={wp(6)}
                    onPress={() => setPreviewModalVisible(false)}
                    iconColor="#e74c3c"
                  />
                </View>
              </View>
              <WebView
                originWhitelist={['*']}
                source={{ html: htmlContent }}
                style={styles.webView}
                scalesPageToFit={true}
                startInLoadingState={true}
                renderLoading={() => (
                  <View style={styles.webViewLoader}>
                    <ActivityIndicator size="large" color="#2874b8" />
                    <Text style={styles.webViewLoaderText}>
                      Loading preview...
                    </Text>
                  </View>
                )}
              />
            </SafeAreaView>
          </Modal>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f5f5' },
  container: { flex: 1 },
  content: { padding: wp(4), paddingBottom: hp(12) },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp(5),
  },
  card: {
    marginBottom: hp(2),
    borderRadius: wp(3),
    backgroundColor: '#fff',
    elevation: 4,
  },
  tableCard: {
    marginBottom: hp(2),
    borderRadius: wp(3),
    backgroundColor: '#fff',
    elevation: 4,
  },
  title: {
    fontSize: wp(5),
    fontWeight: '600',
    marginBottom: hp(1.5),
    color: '#1a1a1a',
  },
  sectionTitle: {
    fontSize: wp(4.5),
    fontWeight: '600',
    marginBottom: hp(1.5),
    color: '#1a1a1a',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(1),
    alignItems: 'center',
  },
  label: { fontSize: wp(3.8), color: '#555', fontWeight: '500' },
  value: { fontSize: wp(4), fontWeight: '600', color: '#000' },
  divider: { marginVertical: hp(0.8), backgroundColor: '#eee' },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(2),
    gap: wp(3),
  },
  addBtn: { flex: 1, borderRadius: wp(2) },
  addBtnContent: { height: hp(6.5) },
  actionBtn: { flex: 1, borderRadius: wp(2), borderColor: '#2874b8' },
  actionBtnContent: { height: hp(6.5) },
  shareBtn: { marginTop: hp(1), borderRadius: wp(2), borderColor: '#2874b8' },
  shareBtnContent: { height: hp(6.5) },
  empty: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    marginVertical: hp(2.5),
    fontSize: wp(3.8),
  },

  // DataTable Styles
  tableHeaderIn: {
    backgroundColor: '#27ae60',
    borderRadius: wp(2),
  },
  tableHeaderOut: {
    backgroundColor: '#e74c3c',
    borderRadius: wp(2),
  },
  headerText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: wp(3.5),
  },
  dateCell: {
    flex: 2,
  },
  amountCell: {
    flex: 1.5,
    justifyContent: 'center',
  },
  notesCell: {
    flex: 2,
  },
  actionsCell: {
    flex: 1.5,
    justifyContent: 'center',
  },
  cellDate: {
    fontSize: wp(3.6),
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: hp(0.3),
  },
  cellType: {
    fontSize: wp(3),
    color: '#666',
    backgroundColor: '#e8f4f8',
    paddingHorizontal: wp(1.5),
    paddingVertical: hp(0.2),
    borderRadius: wp(1),
    alignSelf: 'flex-start',
  },
  cellNotes: {
    fontSize: wp(3.2),
    color: '#555',
    fontStyle: 'italic',
  },
  amountIn: {
    fontSize: wp(4),
    fontWeight: '700',
    color: '#27ae60',
  },
  amountOut: {
    fontSize: wp(4),
    fontWeight: '700',
    color: '#e74c3c',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  iconBtn: {
    margin: 0,
  },

  // Payment Card Styles (removed)
  separator: {
    height: hp(1.5),
  },

  // Modal
  dialog: {
    maxWidth: width * 0.95,
    alignSelf: 'center',
    maxHeight: height * 0.7,
    minWidth: width * 0.9,
  },
  dialogTitle: { fontSize: wp(5), fontWeight: '600', paddingBottom: 0 },
  dialogScrollArea: {
    maxHeight: height * 0.5,
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  dialogContent: {
    paddingHorizontal: wp(6),
    paddingBottom: 0,
  },
  input: { marginBottom: hp(2), backgroundColor: '#fff' },
  multiline: { minHeight: hp(10) },
  radioLabel: {
    fontSize: wp(4),
    marginBottom: hp(1),
    color: '#333',
    fontWeight: '500',
  },
  radioRow: { flexDirection: 'row', alignItems: 'center', marginLeft: wp(1) },
  radioText: { marginLeft: wp(2), fontSize: wp(3.8) },

  // Preview Modal Styles
  previewModalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    backgroundColor: '#2874b8',
    elevation: 4,
  },
  previewTitle: {
    fontSize: wp(5),
    fontWeight: '600',
    color: '#fff',
  },
  previewActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  webView: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  webViewLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  webViewLoaderText: {
    marginTop: hp(2),
    fontSize: wp(4),
    color: '#666',
  },
});

export default PaymentPage;
