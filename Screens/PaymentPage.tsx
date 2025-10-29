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
} from 'react-native-paper';
import DatePicker from 'react-native-date-picker';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { rootStackParamList } from '../navigation/AppNavigation';
import { ProjectAPI } from '../service/apiService';
import Share from 'react-native-share';
import RNFS from 'react-native-fs';
import dayjs from 'dayjs';

const { width, height } = Dimensions.get('window');

// Responsive helpers
const wp = (percentage: number) => (width * percentage) / 100;
const hp = (percentage: number) => (height * percentage) / 100;

type Project = {
  id: number;
  customerName: string;
  totalAmount: number;
  remainingAmount?: number;
  projectItems: Array<{ totalCost: number }>;
  advancePayments: Array<{ amount: number }>;
  paymentsIn: Array<{ amount: number }>;
  paymentsOut: Array<{ amount: number }>;
};

type Payment = {
  id: number;
  amount: number;
  type: string;
  createdAt: string;
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
    project.totalAmount - (paidInTotal + advanceTotal) + paidOutTotal;

  const handleAddPayment = async () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid', 'Enter a valid amount');
      return;
    }

    const payload = {
      projectId: project.id,
      amount: amt,
      type: paymentType,
      paymentDate: dayjs(date).format('YYYY-MM-DD'),
      notes,
    };

    try {
      if (isPaymentIn) {
        await ProjectAPI.createPaymentIn(payload);
      } else {
        await ProjectAPI.createPaymentOut(payload);
      }

      setModalVisible(false);
      setAmount('');
      setNotes('');
      setPaymentType(isPaymentIn ? 'Cash' : 'Vendor');
      loadPayments();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save payment');
    }
  };

  const shareInvoice = async () => {
    try {
      setLoading(true);
      const blob = await ProjectAPI.getInvoicePdf(project.id);
      const dataUrl = await blobToBase64(blob);
      const base64 = dataUrl.split(',')[1];
      const fileName = `Invoice_${project.customerName.replace(/\s+/g, '_')}_${
        project.id
      }.pdf`;

      const filePath =
        Platform.OS === 'android'
          ? `${RNFS.DownloadDirectoryPath}/${fileName}`
          : `${RNFS.DocumentDirectoryPath}/${fileName}`;

      if (Platform.OS === 'android') {
        const dir = RNFS.DownloadDirectoryPath;
        const exists = await RNFS.exists(dir);
        if (!exists) await RNFS.mkdir(dir);
      }

      await RNFS.writeFile(filePath, base64, 'base64');

      await Share.open({
        title: `Invoice – ${project.customerName}`,
        message: `Invoice for project #${project.id}`,
        url: `file://${filePath}`,
        type: 'application/pdf',
      });
    } catch (e: any) {
      console.error('Share error:', e);
      Alert.alert('Error', e.message ?? 'Failed to generate/share PDF');
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
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
                    ₹{project.totalAmount.toLocaleString('en-IN')}
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

                <View style={styles.row}>
                  <Text style={styles.label}>Advance Received</Text>
                  <Text style={[styles.value, { color: '#27ae60' }]}>
                    ₹{advanceTotal.toLocaleString('en-IN')}
                  </Text>
                </View>
                <Divider style={styles.divider} />

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
                  setModalVisible(true);
                }}
                style={styles.addBtn}
                contentStyle={styles.addBtnContent}
                textColor="#e74c3c"
              >
                + Payment Out
              </Button>
            </View>

            {/* Payment History */}
            <Card style={styles.tableCard}>
              <Card.Content>
                <Text style={styles.title}>Payment History</Text>
                {paymentsIn.length === 0 && paymentsOut.length === 0 ? (
                  <Text style={styles.empty}>No payments recorded</Text>
                ) : (
                  <>
                    <View style={styles.tableHeader}>
                      <Text style={styles.colDate}>Date</Text>
                      <Text style={styles.colIn}>In</Text>
                      <Text style={styles.colOut}>Out</Text>
                      <Text style={styles.colType}>Type</Text>
                    </View>
                    <Divider style={styles.headerDivider} />

                    {[...paymentsIn, ...paymentsOut]
                      .sort(
                        (a, b) =>
                          new Date(b.createdAt).getTime() -
                          new Date(a.createdAt).getTime(),
                      )
                      .map(p => (
                        <View key={p.id} style={styles.tableRow}>
                          <Text style={styles.colDate}>
                            {formatDate(p.createdAt)}
                          </Text>
                          <Text
                            style={[
                              styles.colIn,
                              paymentsIn.some(x => x.id === p.id)
                                ? {}
                                : styles.muted,
                            ]}
                          >
                            {paymentsIn.some(x => x.id === p.id)
                              ? `₹${p.amount}`
                              : '—'}
                          </Text>
                          <Text
                            style={[
                              styles.colOut,
                              paymentsOut.some(x => x.id === p.id)
                                ? {}
                                : styles.muted,
                            ]}
                          >
                            {paymentsOut.some(x => x.id === p.id)
                              ? `₹${p.amount}`
                              : '—'}
                          </Text>
                          <Text style={styles.colType}>{p.type}</Text>
                        </View>
                      ))}
                  </>
                )}
              </Card.Content>
            </Card>

            {/* Share Invoice */}
            <Button
              mode="outlined"
              icon="share-variant"
              onPress={shareInvoice}
              style={styles.shareBtn}
              contentStyle={styles.shareBtnContent}
              disabled={loading}
            >
              Share Invoice PDF
            </Button>
          </>
        )}

        {/* Add Payment Modal */}
        <Portal>
          <Dialog
            visible={modalVisible}
            onDismiss={() => setModalVisible(false)}
            style={styles.dialog}
          >
            <Dialog.Title style={styles.dialogTitle}>
              {isPaymentIn ? 'Record Payment In' : 'Record Payment Out'}
            </Dialog.Title>
            <Dialog.Content>
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
                value={date.toLocaleDateString('en-IN')}
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
            </Dialog.Content>
            <Dialog.Actions style={styles.dialogActions}>
              <Button onPress={() => setModalVisible(false)}>Cancel</Button>
              <Button onPress={handleAddPayment} disabled={!amount.trim()}>
                Save
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
      </ScrollView>
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
  shareBtn: { marginTop: hp(1), borderRadius: wp(2), borderColor: '#2874b8' },
  shareBtnContent: { height: hp(6.5) },
  empty: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    marginVertical: hp(2.5),
    fontSize: wp(3.8),
  },

  // Table
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: hp(1.2),
    borderBottomWidth: 2,
    borderColor: '#2874b8',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: hp(1.2),
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  headerDivider: { backgroundColor: '#2874b8', height: 2 },
  colDate: { flex: 1.4, fontSize: wp(3.4), color: '#444', fontWeight: '500' },
  colIn: {
    flex: 1,
    fontSize: wp(3.4),
    textAlign: 'right',
    fontWeight: '600',
    color: '#27ae60',
  },
  colOut: {
    flex: 1,
    fontSize: wp(3.4),
    textAlign: 'right',
    fontWeight: '600',
    color: '#e74c3c',
  },
  colType: { flex: 1, fontSize: wp(3.4), textAlign: 'right', color: '#666' },
  muted: { color: '#ccc' },

  // Modal
  dialog: { maxWidth: wp(90), alignSelf: 'center' },
  dialogTitle: { fontSize: wp(5), fontWeight: '600' },
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
  dialogActions: { justifyContent: 'flex-end' },
});

export default PaymentPage;
