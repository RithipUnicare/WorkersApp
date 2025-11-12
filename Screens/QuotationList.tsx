// screens/QuotationList.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Card, TextInput, Chip, Button } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { rootStackParamList } from '../navigation/AppNavigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import dayjs from 'dayjs';
import { QuotationAPI } from '../service/apiService';
import { Quotation } from './QuotationDetail';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslator } from 'react-native-translator';

const { width, height } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<rootStackParamList, 'QuotationList'>;
};

const enToTa: Record<string, string> = {
  'Search by name, mobile, or description...':
    'பெயர், மொபைல், அல்லது விளக்கத்தால் தேடு...',
  'No quotations found': 'மேற்கோள்கள் எதுவும் கிடைக்கவில்லை',
  'Add Quotation': 'மேற்கோள் சேர்க்க',
  Delivery: 'விநியோகம்',
  Budget: 'பட்ஜெட்',
  items: 'பொருட்கள்',
  'No address': 'முகவரி இல்லை',
};

const QuotationList: React.FC<Props> = ({ navigation }) => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [sortAsc, setSortAsc] = useState(true);
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

  // Translate when language changes
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

  // Load quotations
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadQuotations);
    loadQuotations();
    return unsubscribe;
  }, [navigation]);

  const loadQuotations = async () => {
    try {
      setRefreshing(true);
      const res = await QuotationAPI.getAll();
      if (res.success && Array.isArray(res.data)) {
        setQuotations(res.data);
      }
    } catch (e) {
      console.log('Failed to load quotations', e);
    } finally {
      setRefreshing(false);
    }
  };

  const filteredQuotations = quotations
    .filter(
      q =>
        q.customerName.toLowerCase().includes(search.toLowerCase()) ||
        q.customerContactNo.includes(search) ||
        q.projectDescription.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => {
      const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortAsc ? ta - tb : tb - ta;
    });

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return '#FFC107';
      case 'APPROVED':
        return '#4CAF50';
      case 'REJECTED':
        return '#e74c3c';
      case 'DRAFT':
        return '#9E9E9E';
      default:
        return '#075E54';
    }
  };

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      PENDING: 'நிலுவையில்',
      APPROVED: 'அனுமதிக்கப்பட்டது',
      REJECTED: 'நிராகரிக்கப்பட்டது',
      DRAFT: 'வரைவு',
    };
    return isTamil ? map[status?.toUpperCase()] || status : status || 'DRAFT';
  };

  const renderItem = ({ item }: { item: Quotation }) => (
    <Card style={styles.card}>
      <TouchableOpacity
        onPress={() =>
          navigation.navigate('QuotationDetail', { quotation: item })
        }
      >
        <View style={styles.cardHeader}>
          <Text style={styles.name}>{item.customerName}</Text>
          <Chip
            style={[
              styles.statusChip,
              { backgroundColor: getStatusColor(item.status || 'PENDING') },
            ]}
            textStyle={styles.statusText}
          >
            {getStatusText(item.status || 'DRAFT')}
          </Chip>
        </View>

        <View style={styles.infoRow}>
          <MaterialCommunityIcons
            name="phone"
            size={width * 0.045}
            color="#075E54"
          />
          <Text style={styles.infoText}>{item.customerContactNo}</Text>
        </View>

        <View style={styles.infoRow}>
          <MaterialCommunityIcons
            name="map-marker"
            size={width * 0.045}
            color="#075E54"
          />
          <Text style={styles.infoText} numberOfLines={1}>
            {item.address || t('No address')}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <MaterialCommunityIcons
            name="calendar"
            size={width * 0.045}
            color="#075E54"
          />
          <Text style={styles.infoText}>
            {t('Delivery')}: {dayjs(item.deliveryDate).format('DD-MM-YYYY')}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <MaterialCommunityIcons
            name="text-box"
            size={width * 0.045}
            color="#075E54"
          />
          <Text style={styles.infoText} numberOfLines={2}>
            {item.projectDescription}
          </Text>
        </View>

        <View style={styles.amountRow}>
          <View>
            <Text style={styles.amountLabel}>{t('Budget')}</Text>
            <Text style={styles.amountValue}>
              ₹{item.totalBudget?.toLocaleString('en-IN') || 0}
            </Text>
          </View>
          <View style={styles.itemCount}>
            <Text style={styles.itemCountText}>
              {item.items?.length || 0} {t('items')}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Card>
  );

  const toggleSort = useCallback(() => setSortAsc(prev => !prev), []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TextInput
          placeholder={t('Search by name, mobile, or description...')}
          value={search}
          onChangeText={setSearch}
          mode="outlined"
          style={[styles.search, { flex: 1, marginRight: width * 0.02 }]}
          left={<TextInput.Icon icon="magnify" />}
        />
        <TouchableOpacity onPress={toggleSort} style={styles.sortButton}>
          <MaterialCommunityIcons
            name={sortAsc ? 'sort-ascending' : 'sort-descending'}
            size={width * 0.065}
            color="#075E54"
          />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredQuotations}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadQuotations} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="file-document-outline"
              size={64}
              color="#ccc"
            />
            <Text style={styles.emptyText}>{t('No quotations found')}</Text>
          </View>
        }
      />

      {/* Add Quotation Button */}
      <View style={styles.addButtonContainer}>
        <Button
          mode="contained"
          icon="plus"
          onPress={() => navigation.navigate('AddQuotation')}
          style={styles.addButton}
          contentStyle={styles.addButtonContent}
          labelStyle={styles.addButtonLabel}
          buttonColor="#075E54"
        >
          {t('Add Quotation')}
        </Button>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: width * 0.04,
  },
  search: {
    marginTop: height * 0.02,
    marginBottom: height * 0.015,
  },
  listContent: {
    paddingBottom: height * 0.12,
  },
  card: {
    marginBottom: height * 0.025,
    padding: width * 0.04,
    backgroundColor: '#fff',
    borderRadius: width * 0.03,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: height * 0.015,
  },
  name: {
    fontSize: width * 0.048,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  statusChip: {
    height: height * 0.038,
    justifyContent: 'center',
    paddingHorizontal: width * 0.02,
  },
  statusText: {
    color: '#fff',
    fontSize: width * 0.032,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: height * 0.01,
  },
  infoText: {
    marginLeft: width * 0.02,
    color: '#333',
    fontSize: width * 0.036,
    flex: 1,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: height * 0.015,
    paddingTop: height * 0.015,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  amountLabel: {
    fontSize: width * 0.032,
    color: '#888',
    textAlign: 'left',
  },
  amountValue: {
    fontSize: width * 0.042,
    fontWeight: 'bold',
    color: '#075E54',
    textAlign: 'left',
  },
  itemCount: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  itemCountText: {
    color: '#075E54',
    fontSize: width * 0.032,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: height * 0.2,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
  },
  addButtonContainer: {
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  addButton: {
    borderRadius: 12,
    paddingVertical: 6,
  },
  addButtonContent: {
    height: 56,
  },
  addButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  sortButton: {
    width: width * 0.12,
    height: width * 0.12,
    borderRadius: (width * 0.12) / 2,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
});

export default QuotationList;
