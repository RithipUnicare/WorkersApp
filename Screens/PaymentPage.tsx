// screens/PaymentPage.tsx
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
} from 'react-native';
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
    reader.onload = () => resolve(reader.result as string); // data:application/pdf;base64,....
    reader.readAsDataURL(blob);
  });
};

const PaymentPage: React.FC<Props> = ({ route, navigation }) => {
  const { project } = route.params;
  const [paymentsIn, setPaymentsIn] = useState<Payment[]>([]);
  const [paymentsOut, setPaymentsOut] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [isPaymentIn, setIsPaymentIn] = useState(true);
  const [amount, setAmount] = useState('');
  const [paymentType, setPaymentType] = useState('Cash');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    navigation.setOptions({ title: `Payments - ${project.customerName}` });
    loadPayments();
  }, [project.id]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const inRes = await ProjectAPI.getPaymentsIn(project.id);
      const outRes = await ProjectAPI.getPaymentsOut(project.id);
      console.log(inRes, outRes);
      setPaymentsIn(Array.isArray(inRes.data) ? inRes : []);
      setPaymentsOut(Array.isArray(outRes.data) ? outRes : []);
    } catch (e) {
      //console.error('Failed to load payments', e);
      //Alert.alert('Error', 'Failed to load payments');
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
      Alert.alert('Invalid', 'Enter valid amount');
      return;
    }

    const payload = {
      projectId: project.id,
      amount: amt,
      type: paymentType,
      paymentDate: dayjs(date).format('YYYY-MM-DD'),
      notes,
    };
    console.log('Payment Payload:', payload);
    try {
      if (isPaymentIn) {
        const res = await ProjectAPI.createPaymentIn(payload);
        console.log('Payment In Response:', res);
      } else {
        await ProjectAPI.createPaymentOut(payload);
      }
      setModalVisible(false);
      setAmount('');
      loadPayments();
    } catch (e: any) {
      //Alert.alert('Error', e.message || 'Failed to save');
    }
  };

  const shareInvoice = async () => {
    try {
      setLoading(true);

      const blob = await ProjectAPI.getInvoicePdf(project.id);
      const dataUrl = await blobToBase64(blob);
      const base64 = dataUrl.split(',')[1];

      const fileName = `Invoice_${project.customerName}_${project.id}.pdf`;

      const downloadsPath =
        Platform.OS === 'android'
          ? `${RNFS.ExternalStorageDirectoryPath}/Download/${fileName}`
          : `${RNFS.DocumentDirectoryPath}/${fileName}`;

      if (Platform.OS === 'android') {
        const dir = `${RNFS.ExternalStorageDirectoryPath}/Download`;
        const exists = await RNFS.exists(dir);
        if (!exists) await RNFS.mkdir(dir);
      }

      await RNFS.writeFile(downloadsPath, base64, 'base64');
      console.log('PDF saved to:', downloadsPath);

      await Share.open({
        title: `Invoice – ${project.customerName}`,
        message: `Invoice for project #${project.id}`,
        url: `file://${downloadsPath}`,
      });
    } catch (e: any) {
      console.error('Share error:', e);
      Alert.alert('Error', e.message ?? 'Failed to save/share PDF');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#2874b8"
          style={{ marginTop: 50 }}
        />
      ) : (
        <>
          {/* Project Summary */}
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.title}>Project Financials</Text>

              <View style={styles.row}>
                <Text style={styles.label}>Project Total</Text>
                <Text style={styles.value}>
                  ₹{project.totalAmount.toFixed(2)}
                </Text>
              </View>
              <Divider style={styles.divider} />

              <View style={styles.row}>
                <Text style={styles.label}>Items Cost</Text>
                <Text style={styles.value}>₹{itemsTotal.toFixed(2)}</Text>
              </View>
              <Divider style={styles.divider} />

              <View style={styles.row}>
                <Text style={styles.label}>Advance Received</Text>
                <Text style={[styles.value, { color: '#27ae60' }]}>
                  ₹{advanceTotal.toFixed(2)}
                </Text>
              </View>
              <Divider style={styles.divider} />

              <View style={styles.row}>
                <Text style={styles.label}>Payments In</Text>
                <Text style={[styles.value, { color: '#27ae60' }]}>
                  ₹{paidInTotal.toFixed(2)}
                </Text>
              </View>
              <Divider style={styles.divider} />

              <View style={styles.row}>
                <Text style={styles.label}>Payments Out</Text>
                <Text style={[styles.value, { color: '#e74c3c' }]}>
                  ₹{paidOutTotal.toFixed(2)}
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
                  ₹{Math.abs(netRemaining).toFixed(2)}{' '}
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
              textColor="#e74c3c"
            >
              + Payment Out
            </Button>
          </View>

          {/* Payment History Table */}
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
                  <Divider />

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
                              : { color: '#ccc' },
                          ]}
                        >
                          {paymentsIn.some(x => x.id === p.id)
                            ? `₹${p.amount}`
                            : '-'}
                        </Text>
                        <Text
                          style={[
                            styles.colOut,
                            paymentsOut.some(x => x.id === p.id)
                              ? {}
                              : { color: '#ccc' },
                          ]}
                        >
                          {paymentsOut.some(x => x.id === p.id)
                            ? `₹${p.amount}`
                            : '-'}
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
          >
            Share Invoice PDF
          </Button>
        </>
      )}

      {/* Add Payment Modal */}
      <Portal>
        <Dialog visible={modalVisible} onDismiss={() => setModalVisible(false)}>
          <Dialog.Title>
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
              left={<TextInput.Affix text="₹" />}
            />

            <Text style={styles.radioLabel}>Type</Text>
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
                  <Text style={styles.radioLabel}>{t}</Text>
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
                />
              }
            />
            <TextInput
              label="Notes"
              value={notes}
              onChangeText={setNotes}
              mode="outlined"
              style={styles.input}
              multiline
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setModalVisible(false)}>Cancel</Button>
            <Button onPress={handleAddPayment} disabled={!amount}>
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
        onConfirm={d => {
          setDate(d);
          setShowDatePicker(false);
        }}
        onCancel={() => setShowDatePicker(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 100 },
  card: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    elevation: 3,
  },
  tableCard: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1a1a1a',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    alignItems: 'center',
  },
  label: { fontSize: 15, color: '#555', fontWeight: '500' },
  value: { fontSize: 15, fontWeight: '600', color: '#000' },
  divider: { marginVertical: 6, backgroundColor: '#eee' },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  addBtn: { flex: 1, borderRadius: 8, paddingVertical: 4 },
  shareBtn: { marginTop: 8, borderRadius: 8, borderColor: '#2874b8' },
  empty: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    marginVertical: 16,
  },

  // Table
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1.5,
    borderColor: '#2874b8',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  colDate: { flex: 1.3, fontSize: 13, color: '#444' },
  colIn: {
    flex: 1,
    fontSize: 13,
    textAlign: 'right',
    fontWeight: '600',
    color: '#27ae60',
  },
  colOut: {
    flex: 1,
    fontSize: 13,
    textAlign: 'right',
    fontWeight: '600',
    color: '#e74c3c',
  },
  colType: { flex: 1, fontSize: 13, textAlign: 'right', color: '#666' },

  // Modal
  input: { marginBottom: 16, backgroundColor: '#fff' },
  radioRow: { flexDirection: 'row', alignItems: 'center' },
  radioLabel: { marginLeft: 8, fontSize: 15 },
});

export default PaymentPage;
