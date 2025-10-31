// screens/QuotationDetail.tsx
import React, { useEffect, useState } from 'react';
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
import { QuotationAPI } from '../service/apiService'; // Assume a similar API service for Quotations
import { generatePDF } from 'react-native-html-to-pdf';
import { WebView } from 'react-native-webview';
import Share from 'react-native-share';
import RNFS from 'react-native-fs';
import generateHTML from '../utils/GenerateHTML';
import { Project } from './AdminProductList';

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

// Partial Project type for mapping (based on earlier docs; extend as needed)
type PartialProject = {
  id: number;
  customerId: number;
  customerName: string;
  customerContactNo: string;
  customerAddress: string;
  deliveryDate: string;
  projectDescription: string;
  totalAmount: number;
  grandTotal: number;
  remainingAmount: number;
  projectItems: {
    id: number;
    itemName: string;
    quantity: number;
    rateMrp: number;
    totalCost: number;
  }[];
  // Add other required fields with defaults if needed
  status?: string;
  siteStatus?: string;
  customerTime?: string;
  remainingDays?: number;
  location?: null;
  siteImages?: [];
  advancePayments?: [];
};

const QuotationDetail: React.FC = () => {
  const route = useRoute<QuotationDetailsRouteProp>();
  const navigation = useNavigation<QuotationDetailsNavProp>();
  const quotation: Quotation = route.params.quotation;
  console.log('QuotationDetail route params', route.params);
  const [quotationData, setQuotationData] = useState<Quotation>(quotation);
  console.log('quotationData', quotationData);
  // PDF Modal State
  const [pdfModalVisible, setPdfModalVisible] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');

  const formatDate = (date: string) => dayjs(date).format('DD-MM-YYYY');

  useEffect(() => {
    navigation.addListener('focus', () => {
      // Reload or refresh if needed
      const loadQuotation = async () => {
        try {
          const res = await QuotationAPI.getById(quotationData.id);
          if (res && res.data) {
            setQuotationData(res.data);
          }
        } catch (e) {}
      };
      loadQuotation();
    });
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return '#4CAF50';
      case 'CREATED':
        return '#FFC107';
      case 'COMPLETED':
        return '#2196F3';
      default:
        return '#9E9E9E';
    }
  };

  const handleEdit = () => {
    navigation.navigate('AddQuotation', { quotationToEdit: quotationData });
  };

  const handleDelete = () => {
    Alert.alert('Delete Quotation', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await QuotationAPI.delete(quotationData.id);
            navigation.goBack();
          } catch (e) {
            Alert.alert('Error', 'Failed to delete');
          }
        },
      },
    ]);
  };

  const handleConvertToProject = () => {
    // Map Quotation to Partial Project
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
      grandTotal: quotationData.totalAmount, // Assume grandTotal = totalAmount
      remainingAmount: quotationData.totalBudget - quotationData.totalBudget, // Example mapping
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
      customerTime: '', // Default
      remainingDays: 0, // Default
      location: null,
      siteImages: [],
      advancePayments: [],
    };
    navigation.navigate('AddProject', { projectToEdit: projectToEdit });
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
        fileName: `${quotation.customerName}_Quotation`,
        directory: 'Documents',
      };
      const { filePath } = await generatePDF(options);
      console.log('PDF generated at:', filePath);

      const fileName = `${quotation.customerName}_Quotation.pdf`;
      let downloadsPath;
      if (Platform.OS === 'android') {
        downloadsPath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
      } else {
        downloadsPath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      }

      // Copy to Downloads (or Documents for iOS)
      await RNFS.copyFile(filePath, downloadsPath);

      // Share from Downloads path
      await Share.open({
        title: `Quotation - ${quotationData.customerName}`,
        message: `Quotation for ${quotationData.customerName}`,
        url: `file://${downloadsPath}`,
      });

      // Unlink original after successful share
      await RNFS.unlink(filePath);
    } catch (error) {
      console.error('PDF/Share Error:', error);
      Alert.alert('Error', 'Failed to generate or share PDF');
    }
    setPdfModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Top Action Buttons */}

      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <Card style={styles.headerCard}>
          <View style={styles.headerRow}>
            <Text style={styles.name}>{quotationData.customerName}</Text>
            <Chip
              style={[
                styles.statusChip,
                { backgroundColor: getStatusColor('CREATED') }, // Default status
              ]}
              textStyle={styles.statusText}
            >
              {quotationData?.status?.toLowerCase() || 'CREATED'}
            </Chip>
          </View>
        </Card>

        {/* Details */}
        <Card style={styles.detailsCard}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="phone"
              size={width * 0.05}
              color="#2874b8"
            />
            <Text style={styles.infoLabel}>Contact</Text>
            <Text style={styles.infoValue}>
              {quotationData.customerContactNo || 'N/A'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="map-marker"
              size={width * 0.05}
              color="#2874b8"
            />
            <Text style={styles.infoLabel}>Address</Text>
            <Text style={styles.infoValue} numberOfLines={2}>
              {quotationData.customerAddress}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="calendar"
              size={width * 0.05}
              color="#2874b8"
            />
            <Text style={styles.infoLabel}>Delivery Date</Text>
            <Text style={styles.infoValue}>
              {formatDate(quotationData.deliveryDate)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="clock"
              size={width * 0.05}
              color="#2874b8"
            />
            <Text style={styles.infoLabel}>Created</Text>
            <Text style={styles.infoValue}>
              {dayjs(quotationData.createdAt).format('DD-MM-YYYY HH:mm')}
            </Text>
          </View>
        </Card>

        {/* Amounts */}
        <Card style={styles.amountCard}>
          <View style={styles.amountRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.amountLabel}>Total Amount</Text>
              <Text style={styles.amountValue}>
                ₹
                {Number(
                  quotationData.totalBudget - quotationData.discount,
                ).toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={{ flex: 1 }}>
              <Text style={styles.amountLabel}>Total Budget</Text>
              <Text style={styles.amountValue}>
                ₹{quotationData.totalBudget?.toLocaleString('en-IN') || 0}
              </Text>
            </View>
          </View>
        </Card>

        {/* Description */}
        <Card style={styles.descCard}>
          <Text style={styles.descTitle}>Description</Text>
          <Text style={styles.descText}>
            {quotationData.projectDescription || 'No description'}
          </Text>
        </Card>

        {/* Items */}
        <Card style={styles.itemsCard}>
          <Text style={styles.sectionTitle}>Items</Text>
          {quotationData.items.length === 0 ? (
            <Text style={styles.emptyText}>No items</Text>
          ) : (
            quotationData.items.map(item => (
              <View key={item.id} style={styles.itemRow}>
                <Text style={styles.itemName}>{item.itemName}</Text>
                {item.itemDescription && (
                  <Text style={styles.itemDesc}>{item.itemDescription}</Text>
                )}
                <Text style={styles.itemDetails}>
                  Qty: {item.quantity} {item.unit.shortName} × ₹{item.rateMrp} |
                  Tax: {item.taxPercentage}% | HSN/SAC: {item.hsnSac} | Total: ₹
                  {item.totalCost.toLocaleString('en-IN')}
                </Text>
              </View>
            ))
          )}
        </Card>
      </ScrollView>
      <View style={styles.actionButtonsContainer}>
        <IconButton
          icon="pencil"
          onPress={handleEdit}
          style={styles.actionButton}
          contentStyle={styles.actionButtonContent}
          iconColor="#2874b8"
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
          iconColor="#2874b8"
        />
        <IconButton
          icon="plus"
          onPress={handleConvertToProject}
          style={styles.actionButton}
          contentStyle={styles.actionButtonContent}
          iconColor="#2874b8"
        />
      </View>
      {/* PDF Preview Modal */}
      <Modal
        visible={pdfModalVisible}
        onDismiss={() => setPdfModalVisible(false)}
        animationType="slide"
        //contentContainerStyle={{ flex: 1 }}
        style={{ maxHeight: height * 0.6 }}
      >
        <View style={styles.pdfModalContainer}>
          <View style={styles.pdfModalHeader}>
            <Text style={styles.pdfModalTitle}>Quotation Preview</Text>
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
              Close
            </Button>
            <Button
              mode="contained"
              onPress={generateAndSharePDF}
              style={styles.pdfButton}
              buttonColor="#2874b8"
            >
              Generate & Share PDF
            </Button>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    elevation: 3,
    marginBottom: 10,
  },
  actionButton: {
    flex: 0.22,
  },
  actionButtonContent: {
    paddingVertical: 4,
  },
  actionButtonLabel: {
    fontSize: 12,
  },
  content: {
    padding: width * 0.04,
    paddingBottom: height * 0.15,
  },
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
  statusText: {
    color: '#fff',
    fontSize: width * 0.032,
    fontWeight: '600',
  },
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
  infoValue: {
    flex: 1,
    fontSize: width * 0.036,
    color: '#000',
  },
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
  amountLabel: {
    fontSize: width * 0.032,
    color: '#888',
    textAlign: 'center',
  },
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
  itemName: {
    fontWeight: '600',
    fontSize: width * 0.038,
  },
  itemDesc: {
    fontSize: width * 0.034,
    color: '#666',
    marginTop: 2,
    fontStyle: 'italic',
  },
  itemDetails: {
    color: '#666',
    fontSize: width * 0.032,
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    marginVertical: height * 0.02,
  },

  // PDF Modal
  pdfModalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  pdfModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#2874b8',
  },
  pdfModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  webView: {
    flex: 1,
  },
  pdfModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  pdfButton: {
    flex: 1,
    marginHorizontal: 8,
  },
});

export default QuotationDetail;
