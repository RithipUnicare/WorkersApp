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
} from 'react-native';
import { Card, Chip, Button, IconButton } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import dayjs from 'dayjs';
import { rootStackParamList } from '../navigation/AppNavigation';
import { QuotationAPI } from '../service/apiService';
import { generatePDF } from 'react-native-html-to-pdf';
import { WebView } from 'react-native-webview';
import Share from 'react-native-share';
import RNFS from 'react-native-fs';
import generateHTML from '../utils/GenerateHTML';
import { Project } from './AdminProductList';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslator } from 'react-native-translator';

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
  const [htmlContent, setHtmlContent] = useState('');

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
      location: null,
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

        {/* Items */}
        <Card style={styles.itemsCard}>
          <Text style={styles.sectionTitle}>{t('Items')}</Text>
          {quotationData.items.length === 0 ? (
            <Text style={styles.emptyText}>{t('No items')}</Text>
          ) : (
            quotationData.items.map(item => (
              <View key={item.id} style={styles.itemRow}>
                <Text style={styles.itemName}>{item.itemName}</Text>
                {item.itemDescription && (
                  <Text style={styles.itemDesc}>{item.itemDescription}</Text>
                )}
                <Text style={styles.itemDetails}>
                  {t('Qty')}: {item.quantity} {item.unit.shortName} × ₹
                  {item.rateMrp} | {t('Tax')}: {item.taxPercentage}% |{' '}
                  {t('HSN/SAC')}: {item.hsnSac} | {t('Total')}: ₹
                  {item.totalCost.toLocaleString('en-IN')}
                </Text>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
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
});

export default QuotationDetail;
