import React, { useState, useEffect, useCallback } from 'react';
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
import { Table, Row, Rows } from 'react-native-table-component';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslator } from 'react-native-translator';

const { width, height } = Dimensions.get('window');
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

const enToTa: Record<string, string> = {
  // Titles & Sections
  'Project Financials': 'திட்ட நிதி',
  'Payments In': 'பணம் பெறப்பட்டது',
  'Payments Out': 'பணம் செலுத்தப்பட்டது',
  'No payments received': 'பணம் பெறப்படவில்லை',
  'No payments made': 'பணம் செலுத்தப்படவில்லை',

  // Labels
  'Project Total': 'மொத்த தொகை',
  'Items Cost': 'பொருட்கள் செலவு',
  // 'Payments In': 'பணம் பெறப்பட்டது',
  // 'Payments Out': 'பணம் செலுத்தப்பட்டது',
  'Net Remaining': 'நிகர மீதி',
  Extra: 'கூடுதல்',

  // Buttons
  '+ Payment In': '+ பணம் பெறு',
  '+ Payment Out': '+ பணம் செலுத்து',
  'Preview Invoice': 'விலைப்பட்டியல் முன்னோட்டம்',
  'Share Invoice': 'விலைப்பட்டியல் பகிர்',

  // Modal
  Record: 'பதிவு',
  Edit: 'திருத்து',
  'Payment In': 'பணம் பெறு',
  'Payment Out': 'பணம் செலுத்து',
  Amount: 'தொகை',
  'Payment Type': 'பணம் வகை',
  Date: 'தேதி',
  'Notes (Optional)': 'குறிப்புகள் (விருப்ப)',
  Cancel: 'ரத்து',
  Save: 'சேமி',
  Update: 'புதுப்பி',

  // Payment Types
  Cash: 'பணம்',
  UPI: 'யூ.பி.ஐ',
  Bank: 'வங்கி',
  Cheque: 'காசோலை',
  Vendor: 'விற்பனையாளர்',
  Material: 'பொருள்',
  Labour: 'தொழிலாளி',
  Transport: 'போக்குவரத்து',

  // Alerts
  Invalid: 'தவறு',
  'Enter a valid amount': 'சரியான தொகையை உள்ளிடுக',
  Error: 'பிழை',
  'Failed to load payments': 'பணம் ஏற்ற முடியவில்லை',
  'Failed to save payment': 'பணம் சேமிக்க முடியவில்லை',
  'Failed to delete payment': 'பணம் நீக்க முடியவில்லை',
  'Failed to generate invoice preview':
    'விலைப்பட்டியல் முன்னோட்டம் உருவாக்க முடியவில்லை',
  'Failed to generate/share PDF': 'PDF உருவாக்க/பகிர முடியவில்லை',
  'Delete Payment': 'பணம் நீக்கு',
  'Are you sure you want to delete this payment?':
    'இந்த பணத்தை நிச்சயமாக நீக்க வேண்டுமா?',
  Delete: 'நீக்கு',

  // Preview
  'Invoice Preview': 'விலைப்பட்டியல் முன்னோட்டம்',
  'Loading preview...': 'முன்னோட்டம் ஏற்றுகிறது...',
};

const PaymentPage: React.FC<Props> = ({ route, navigation }) => {
  const project = route.params?.project;
  const [paymentsIn, setPaymentsIn] = useState<Payment[]>([]);
  const [paymentsOut, setPaymentsOut] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const [isTamil, setIsTamil] = useState(false);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const { translate } = useTranslator();

  // Font size reducer for Tamil
  const getFontSize = useCallback(
    (enSize: number) => (isTamil ? enSize * 0.85 : enSize),
    [isTamil],
  );

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

  useEffect(() => {
    navigation.setOptions({
      title: `${t('Payments In')} - ${project.customerName}`,
    });
  }, [project.customerName, navigation, isTamil]);

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
      Alert.alert(t('Error'), t('Failed to load payments'));
    } finally {
      setLoading(false);
    }
  };

  const itemsTotal = project.projectItems.reduce(
    (sum: any, i: any) => sum + i.totalCost,
    0,
  );
  const advanceTotal = project.advancePayments.reduce(
    (sum: any, a: any) => sum + a.amount,
    0,
  );
  const paidInTotal = paymentsIn.reduce((sum, p) => sum + p.amount, 0);
  const paidOutTotal = paymentsOut.reduce((sum, p) => sum + p.amount, 0);
  const netRemaining =
    project.grandTotal - (paidInTotal + advanceTotal) + paidOutTotal;

  const [modalVisible, setModalVisible] = useState(false);
  const [isPaymentIn, setIsPaymentIn] = useState(true);
  const [amount, setAmount] = useState('');
  const [paymentType, setPaymentType] = useState('Cash');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');

  const handleAddPayment = async () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert(t('Invalid'), t('Enter a valid amount'));
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
        if (isPaymentIn) await ProjectAPI.updatePaymentIn(editingId, payload);
        else await ProjectAPI.updatePaymentOut(editingId, payload);
      } else {
        if (isPaymentIn) await ProjectAPI.createPaymentIn(payload);
        else await ProjectAPI.createPaymentOut(payload);
      }

      closeModal();
      loadPayments();
    } catch (e: any) {
      Alert.alert(t('Error'), e.message || t('Failed to save payment'));
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
      t('Delete Payment'),
      t('Are you sure you want to delete this payment?'),
      [
        { text: t('Cancel') },
        {
          text: t('Delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              if (isIn) await ProjectAPI.deletePaymentIn(payment.id);
              else await ProjectAPI.deletePaymentOut(payment.id);
              loadPayments();
            } catch {
              Alert.alert(t('Error'), t('Failed to delete payment'));
            }
          },
        },
      ],
    );
  };

  const previewInvoice = () => {
    try {
      const html = generateInvoiceHTML({ ...project, paymentsIn, paymentsOut });
      setHtmlContent(html);
      setPreviewModalVisible(true);
    } catch {
      Alert.alert(t('Error'), t('Failed to generate invoice preview'));
    }
  };

  const shareInvoice = async () => {
    try {
      setLoading(true);
      const htmlContent = generateInvoiceHTML({
        ...project,
        paymentsIn,
        paymentsOut,
      });
      const { filePath } = await generatePDF({
        html: htmlContent,
        fileName: `${project.customerName}_Invoice`,
        directory: 'Documents',
      });

      const fileName = `${project.customerName}_Invoice_${project.id}.pdf`;
      const downloadsPath =
        Platform.OS === 'android'
          ? `${RNFS.DownloadDirectoryPath}/${fileName}`
          : `${RNFS.DocumentDirectoryPath}/${fileName}`;

      await RNFS.copyFile(filePath, downloadsPath);
      await Share.open({
        title: `Invoice - ${project.customerName}`,
        message: `Invoice for project #${project.id}`,
        url: `file://${downloadsPath}`,
        type: 'application/pdf',
      });
      await RNFS.unlink(filePath);
    } catch (e: any) {
      if (e.message !== 'User did not share') {
        Alert.alert(t('Error'), e.message ?? t('Failed to generate/share PDF'));
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
    setEditingId(null);
    setAmount('');
    setNotes('');
    setPaymentType(isPaymentIn ? 'Cash' : 'Vendor');
  };

  const paymentsInTableHead = [
    t('Date & Type'),
    t('Amount'),
    t('Notes'),
    t('Actions'),
  ];
  const paymentsInTableData = paymentsIn.map(item => [
    <View key={`in-date-${item.id}`} style={styles.dateTypeContainer}>
      <Text style={[styles.cellDate, { fontSize: getFontSize(wp(3.6)) }]}>
        {formatDate(item.paymentDate)}
      </Text>
      <Text style={[styles.cellType, { fontSize: getFontSize(wp(3)) }]}>
        {t(item.type)}
      </Text>
    </View>,
    <Text
      key={`in-amount-${item.id}`}
      style={[styles.amountIn, { fontSize: getFontSize(wp(4)) }]}
    >
      ₹{item.amount.toLocaleString('en-IN')}
    </Text>,
    <Text
      key={`in-notes-${item.id}`}
      style={[styles.cellNotes, { fontSize: getFontSize(wp(3.2)) }]}
      numberOfLines={2}
    >
      {item.notes || '-'}
    </Text>,
    <View key={`in-actions-${item.id}`} style={styles.actionButtons}>
      <IconButton
        icon="pencil"
        size={wp(4.5)}
        onPress={() => handleEditPayment(item, true)}
        iconColor="#0a411fff"
        style={styles.iconBtn}
      />
      <IconButton
        icon="delete"
        size={wp(4.5)}
        onPress={() => handleDeletePayment(item, true)}
        iconColor="#e74c3c"
        style={styles.iconBtn}
      />
    </View>,
  ]);

  const paymentsOutTableHead = [
    t('Date & Type'),
    t('Amount'),
    t('Notes'),
    t('Actions'),
  ];
  const paymentsOutTableData = paymentsOut.map(item => [
    <View key={`out-date-${item.id}`} style={styles.dateTypeContainer}>
      <Text style={[styles.cellDate, { fontSize: getFontSize(wp(3.6)) }]}>
        {formatDate(item.paymentDate)}
      </Text>
      <Text style={[styles.cellType, { fontSize: getFontSize(wp(3)) }]}>
        {t(item.type)}
      </Text>
    </View>,
    <Text
      key={`out-amount-${item.id}`}
      style={[styles.amountOut, { fontSize: getFontSize(wp(4)) }]}
    >
      ₹{item.amount.toLocaleString('en-IN')}
    </Text>,
    <Text
      key={`out-notes-${item.id}`}
      style={[styles.cellNotes, { fontSize: getFontSize(wp(3.2)) }]}
      numberOfLines={2}
    >
      {item.notes || '-'}
    </Text>,
    <View key={`out-actions-${item.id}`} style={styles.actionButtons}>
      <IconButton
        icon="pencil"
        size={wp(4.5)}
        onPress={() => handleEditPayment(item, false)}
        iconColor="#0a411fff"
        style={styles.iconBtn}
      />
      <IconButton
        icon="delete"
        size={wp(4.5)}
        onPress={() => handleDeletePayment(item, false)}
        iconColor="#e74c3c"
        style={styles.iconBtn}
      />
    </View>,
  ]);

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color="#0a411fff" />
            </View>
          ) : (
            <>
              <Card style={styles.card}>
                <Card.Content>
                  <Text
                    style={[styles.title, { fontSize: getFontSize(wp(5)) }]}
                  >
                    {t('Project Financials')}
                  </Text>

                  <View style={styles.row}>
                    <Text
                      style={[styles.label, { fontSize: getFontSize(wp(3.8)) }]}
                    >
                      {t('Project Total')}
                    </Text>
                    <Text
                      style={[styles.value, { fontSize: getFontSize(wp(4)) }]}
                    >
                      ₹{project.grandTotal.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <Divider style={styles.divider} />

                  <View style={styles.row}>
                    <Text
                      style={[styles.label, { fontSize: getFontSize(wp(3.8)) }]}
                    >
                      {t('Items Cost')}
                    </Text>
                    <Text
                      style={[styles.value, { fontSize: getFontSize(wp(4)) }]}
                    >
                      ₹{itemsTotal.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <Divider style={styles.divider} />

                  <View style={styles.row}>
                    <Text
                      style={[styles.label, { fontSize: getFontSize(wp(3.8)) }]}
                    >
                      {t('Payments In')}
                    </Text>
                    <Text
                      style={[
                        styles.value,
                        { fontSize: getFontSize(wp(4)), color: '#27ae60' },
                      ]}
                    >
                      ₹{paidInTotal.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <Divider style={styles.divider} />

                  <View style={styles.row}>
                    <Text
                      style={[styles.label, { fontSize: getFontSize(wp(3.8)) }]}
                    >
                      {t('Payments Out')}
                    </Text>
                    <Text
                      style={[
                        styles.value,
                        { fontSize: getFontSize(wp(4)), color: '#e74c3c' },
                      ]}
                    >
                      ₹{paidOutTotal.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <Divider style={styles.divider} />

                  <View style={styles.row}>
                    <Text
                      style={[styles.label, { fontSize: getFontSize(wp(3.8)) }]}
                    >
                      {t('Net Remaining')}
                    </Text>
                    <Text
                      style={[
                        styles.value,
                        {
                          fontSize: getFontSize(wp(4)),
                          color: netRemaining <= 0 ? '#27ae60' : '#e74c3c',
                        },
                      ]}
                    >
                      ₹{Math.abs(netRemaining).toLocaleString('en-IN')}{' '}
                      {netRemaining < 0 ? t('Extra') : ''}
                    </Text>
                  </View>
                </Card.Content>
              </Card>

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
                  {t('+ Payment In')}
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
                  {t('+ Payment Out')}
                </Button>
              </View>

              <Card style={styles.tableCard}>
                <Card.Content>
                  <Text
                    style={[
                      styles.sectionTitle,
                      { fontSize: getFontSize(wp(4.5)) },
                    ]}
                  >
                    {t('Payments In')}
                  </Text>
                  {paymentsIn.length === 0 ? (
                    <Text
                      style={[styles.empty, { fontSize: getFontSize(wp(3.8)) }]}
                    >
                      {t('No payments received')}
                    </Text>
                  ) : (
                    <Table
                      borderStyle={{ borderWidth: 1, borderColor: '#ddd' }}
                    >
                      <Row
                        data={paymentsInTableHead}
                        flexArr={[2, 1.5, 2, 1.5]}
                        style={styles.tableHeaderIn}
                        textStyle={[
                          styles.headerText,
                          { fontSize: getFontSize(wp(3.5)) },
                        ]}
                      />
                      <Rows
                        data={paymentsInTableData}
                        flexArr={[2, 1.5, 2, 1.5]}
                        style={styles.tableRow}
                      />
                    </Table>
                  )}
                </Card.Content>
              </Card>

              <Card style={styles.tableCard}>
                <Card.Content>
                  <Text
                    style={[
                      styles.sectionTitle,
                      { fontSize: getFontSize(wp(4.5)) },
                    ]}
                  >
                    {t('Payments Out')}
                  </Text>
                  {paymentsOut.length === 0 ? (
                    <Text
                      style={[styles.empty, { fontSize: getFontSize(wp(3.8)) }]}
                    >
                      {t('No payments made')}
                    </Text>
                  ) : (
                    <Table
                      borderStyle={{ borderWidth: 1, borderColor: '#ddd' }}
                    >
                      <Row
                        data={paymentsOutTableHead}
                        flexArr={[2, 1.5, 2, 1.5]}
                        style={styles.tableHeaderOut}
                        textStyle={[
                          styles.headerText,
                          { fontSize: getFontSize(wp(3.5)) },
                        ]}
                      />
                      <Rows
                        data={paymentsOutTableData}
                        flexArr={[2, 1.5, 2, 1.5]}
                        style={styles.tableRow}
                      />
                    </Table>
                  )}
                </Card.Content>
              </Card>

              <View style={styles.buttonRow}>
                <Button
                  mode="outlined"
                  icon="eye"
                  onPress={previewInvoice}
                  style={styles.actionBtn}
                  contentStyle={styles.actionBtnContent}
                  textColor="#0a411fff"
                >
                  {t('Preview Invoice')}
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
                  {t('Share Invoice')}
                </Button>
              </View>
            </>
          )}

          {/* Add/Edit Modal */}
          <Portal>
            <Dialog
              visible={modalVisible}
              onDismiss={closeModal}
              style={styles.dialog}
            >
              <Dialog.Title
                style={[styles.dialogTitle, { fontSize: getFontSize(wp(5)) }]}
              >
                {editingId ? t('Edit') : t('Record')}{' '}
                {isPaymentIn ? t('Payment In') : t('Payment Out')}
              </Dialog.Title>
              <Dialog.ScrollArea style={styles.dialogScrollArea}>
                <ScrollView contentContainerStyle={styles.dialogContent}>
                  <TextInput
                    label={t('Amount')}
                    value={amount}
                    onChangeText={setAmount}
                    mode="outlined"
                    keyboardType="numeric"
                    style={styles.input}
                    theme={{ roundness: wp(2) }}
                    left={<TextInput.Affix text="₹" />}
                  />
                  <Text
                    style={[
                      styles.radioLabel,
                      { fontSize: getFontSize(wp(4)) },
                    ]}
                  >
                    {t('Payment Type')}
                  </Text>
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
                        <Text
                          style={[
                            styles.radioText,
                            { fontSize: getFontSize(wp(3.8)) },
                          ]}
                        >
                          {t === paymentType ? t(paymentType) : t(t)}
                        </Text>
                      </View>
                    ))}
                  </RadioButton.Group>
                  <TextInput
                    label={t('Date')}
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
                    label={t('Notes (Optional)')}
                    value={notes}
                    onChangeText={setNotes}
                    mode="outlined"
                    style={[styles.input, styles.multiline]}
                    multiline
                    numberOfLines={3}
                  />
                </ScrollView>
              </Dialog.ScrollArea>
              <Dialog.Actions>
                <Button onPress={closeModal}>{t('Cancel')}</Button>
                <Button onPress={handleAddPayment} disabled={!amount.trim()}>
                  {editingId ? t('Update') : t('Save')}
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
                <Text
                  style={[
                    styles.previewTitle,
                    { fontSize: getFontSize(wp(5)) },
                  ]}
                >
                  {t('Invoice Preview')}
                </Text>
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
                    <ActivityIndicator size="large" color="#0a411fff" />
                    <Text
                      style={[
                        styles.webViewLoaderText,
                        { fontSize: getFontSize(wp(4)) },
                      ]}
                    >
                      {t('Loading preview...')}
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
  title: { fontWeight: '600', marginBottom: hp(1.5), color: '#1a1a1a' },
  sectionTitle: { fontWeight: '600', marginBottom: hp(1.5), color: '#1a1a1a' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(1),
    alignItems: 'center',
  },
  label: { color: '#555', fontWeight: '500' },
  value: { fontWeight: '600', color: '#000' },
  divider: { marginVertical: hp(0.8), backgroundColor: '#eee' },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(2),
    gap: wp(3),
  },
  addBtn: { flex: 1, borderRadius: wp(2) },
  addBtnContent: { height: hp(6.5) },
  actionBtn: { flex: 1, borderRadius: wp(2), borderColor: '#0a411fff' },
  actionBtnContent: { height: hp(6.5) },
  empty: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    marginVertical: hp(2.5),
  },
  tableHeaderIn: { height: hp(6), backgroundColor: '#27ae60' },
  tableHeaderOut: { height: hp(6), backgroundColor: '#e74c3c' },
  headerText: { color: '#fff', fontWeight: '600', textAlign: 'center' },
  tableRow: { height: hp(8), borderBottomWidth: 1, borderColor: '#eee' },
  dateTypeContainer: { padding: wp(2) },
  cellDate: { fontWeight: '600', color: '#1a1a1a', marginBottom: hp(0.3) },
  cellType: {
    color: '#666',
    backgroundColor: '#e8f4f8',
    paddingHorizontal: wp(1.5),
    paddingVertical: hp(0.2),
    borderRadius: wp(1),
    alignSelf: 'flex-start',
  },
  cellNotes: { color: '#555', fontStyle: 'italic', padding: wp(2) },
  amountIn: {
    fontWeight: '700',
    color: '#27ae60',
    textAlign: 'right',
    padding: wp(2),
  },
  amountOut: {
    fontWeight: '700',
    color: '#e74c3c',
    textAlign: 'right',
    padding: wp(2),
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: wp(2),
  },
  iconBtn: { margin: 0 },
  dialog: {
    maxWidth: width * 0.95,
    alignSelf: 'center',
    maxHeight: height * 0.7,
    minWidth: width * 0.9,
  },
  dialogTitle: { fontWeight: '600', paddingBottom: 0 },
  dialogScrollArea: {
    maxHeight: height * 0.5,
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  dialogContent: { paddingHorizontal: wp(6), paddingBottom: 0 },
  input: { marginBottom: hp(2), backgroundColor: '#fff' },
  multiline: { minHeight: hp(10) },
  radioLabel: { marginBottom: hp(1), color: '#333', fontWeight: '500' },
  radioRow: { flexDirection: 'row', alignItems: 'center', marginLeft: wp(1) },
  radioText: { marginLeft: wp(2) },
  previewModalContainer: { flex: 1, backgroundColor: '#fff' },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    backgroundColor: '#0a411fff',
    elevation: 4,
  },
  previewTitle: { fontWeight: '600', color: '#fff' },
  previewActions: { flexDirection: 'row', alignItems: 'center' },
  webView: { flex: 1, backgroundColor: '#f5f5f5' },
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
  webViewLoaderText: { marginTop: hp(2), color: '#666' },
});

export default PaymentPage;
