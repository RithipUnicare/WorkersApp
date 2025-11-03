import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, TextInput, Chip, Switch } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { rootStackParamList } from '../navigation/AppNavigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProjectAPI } from '../service/apiService';
import dayjs from 'dayjs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslator } from 'react-native-translator';

const { width, height } = Dimensions.get('window');
const wp = (p: number) => (width * p) / 100;
const hp = (p: number) => (height * p) / 100;

const enToTa: Record<string, string> = {
  'Search by name, location or phone...':
    'பெயர், இடம் அல்லது தொலைபேசி எண்ணால் தேடு...',
  'No projects found': 'எந்த திட்டங்களும் இல்லை',
  'Try a different search term': 'வேறு தேடல் சொல்லை முயற்சிக்கவும்',
  'Start by adding a new project': 'புதிய திட்டத்தைச் சேர்த்து தொடங்கவும்',
  'Delivery:': 'விநியோகம்:',
  'days left': 'நாட்கள் மீதம்',
  Overdue: 'காலாவதியானது',
  'Time:': 'நேரம்:',
  'Not set': 'அமைக்கப்படவில்லை',
  Total: 'மொத்தம்',
  Paid: 'செலுத்தப்பட்டது',
  Remaining: 'மீதமுள்ளது',
  'No location': 'இடம் இல்லை',
  Language: 'மொழி',
  English: 'English',
  Tamil: 'தமிழ்',
};

export type Project = {
  id: number;
  customerId: number;
  customerName: string;
  customerContactNo: string;
  customerAddress: string;
  deliveryDate: string;
  remainingDays: number;
  projectDescription: string;
  customerTime: string;
  siteStatus: string;
  totalAmount: number;
  discount?: number;
  grandTotal: number;
  remainingAmount: number;
  status: string;
  totalBudget?: number;
  location: {
    id: number;
    address: string;
    latitude: number;
    longitude: number;
  } | null;
  siteImages: { id: number; imageUrl: string }[];
  projectItems: {
    id: number;
    itemName: string;
    quantity: number;
    rateMrp: number;
    totalCost: number;
  }[];
  advancePayments: {
    id: number;
    amount: number;
    paymentDate: string;
    paymentMode: string;
  }[];
};

type Props = {
  navigation: NativeStackNavigationProp<rootStackParamList, 'ProjectList'>;
};

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

const formatTime = (time: string) => {
  if (!time) return 'Not set';
  return dayjs(time, 'HH:mm:ss').format('h:mm A');
};

const ImagePreview = React.memo(
  ({ images }: { images: { id: number; imageUrl: string }[] }) => {
    if (images.length === 0) return null;
    return (
      <View style={styles.imagePreview}>
        {images.slice(0, 4).map(img => (
          <Image
            key={img.id}
            source={{ uri: img.imageUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ))}
        {images.length > 4 && (
          <View style={styles.moreImages}>
            <Text style={styles.moreText}>+{images.length - 4}</Text>
          </View>
        )}
      </View>
    );
  },
);

const ProjectCard = React.memo(
  ({
    item,
    onPress,
    t,
    role,
  }: {
    item: Project;
    onPress: (p: Project) => void;
    t: (en: string) => string;
    role: string | null;
  }) => {
    const handlePress = useCallback(() => onPress(item), [item, onPress]);
    const paidAmount = item.totalAmount - item.remainingAmount;
    return (
      <Card style={styles.card} elevation={3}>
        <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
          <View style={styles.cardHeader}>
            <Text style={styles.name} numberOfLines={1}>
              {item.customerName}
            </Text>
            <Chip
              style={[
                styles.statusChip,
                { backgroundColor: getStatusColor(item.status) },
              ]}
              textStyle={styles.statusText}
            >
              {item.status || item.siteStatus}
            </Chip>
          </View>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="map-marker"
              size={wp(4.5)}
              color="#0a411fff"
            />
            <Text style={styles.infoText} numberOfLines={1}>
              {item.location?.address || t('No location')}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="phone"
              size={wp(4.5)}
              color="#0a411fff"
            />
            <Text style={styles.infoText}>{item.customerContactNo}</Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="calendar"
              size={wp(4.5)}
              color="#0a411fff"
            />
            <Text style={styles.infoText}>
              {t('Delivery:')} {dayjs(item.deliveryDate).format('DD MMM YYYY')}
            </Text>
            <Text
              style={[
                styles.daysLeft,
                { color: item.remainingDays > 0 ? '#e67e22' : '#e74c3c' },
              ]}
            >
              {item.remainingDays > 0
                ? `${item.remainingDays} ${t('days left')}`
                : t('Overdue')}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="clock"
              size={wp(4.5)}
              color="#0a411fff"
            />
            <Text style={styles.infoText}>
              {t('Time:')} {formatTime(item.customerTime)}
            </Text>
          </View>

          {role !== 'worker' && (
            <View style={styles.amountRow}>
              <View style={styles.amountBlock}>
                <Text style={styles.amountLabel}>{t('Total')}</Text>
                <Text style={styles.amountValue}>
                  ₹{item.totalAmount.toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={styles.amountDivider} />
              <View style={styles.amountBlock}>
                <Text style={styles.amountLabel}>{t('Paid')}</Text>
                <Text style={[styles.amountValue, { color: '#27ae60' }]}>
                  ₹{paidAmount.toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={styles.amountDivider} />
              <View style={styles.amountBlock}>
                <Text style={styles.amountLabel}>{t('Remaining')}</Text>
                <Text
                  style={[
                    styles.amountValue,
                    {
                      color: item.remainingAmount > 0 ? '#e74c3c' : '#27ae60',
                    },
                  ]}
                >
                  ₹{item.remainingAmount.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
          )}

          <ImagePreview images={item.siteImages} />
        </TouchableOpacity>
      </Card>
    );
  },
  (prev, next) => {
    return (
      prev.item.id === next.item.id &&
      prev.item.status === next.item.status &&
      prev.item.remainingAmount === next.item.remainingAmount &&
      prev.item.remainingDays === next.item.remainingDays &&
      prev.item.siteImages.length === next.item.siteImages.length &&
      prev.item.customerName === next.item.customerName
    );
  },
);

const ProjectList: React.FC<Props> = ({ navigation }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isTamil, setIsTamil] = useState(false);
  const [translations, setTranslations] = useState<Record<string, string>>({});

  const { translate } = useTranslator();

  useEffect(() => {
    const init = async () => {
      const saved = await AsyncStorage.getItem('appLanguage');
      const tamil = saved === 'ta';
      setIsTamil(tamil);
    };
    init();
  }, []);

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

  const toggleLanguage = useCallback(async () => {
    const newLang = isTamil ? 'en' : 'ta';
    await AsyncStorage.setItem('appLanguage', newLang);
    setIsTamil(!isTamil);
  }, [isTamil]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadProjects);
    loadProjects();
    return unsubscribe;
  }, [navigation]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const res = await ProjectAPI.getAll();
      const userStr = await AsyncStorage.getItem('user');
      const parsed = userStr ? JSON.parse(userStr) : null;
      setRole(parsed?.role || '');
      if (res.success && Array.isArray(res.data)) {
        setProjects(res.data);
        setFilteredProjects(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProjects();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const q = search.toLowerCase().trim();
      const filtered = projects.filter(
        p =>
          p?.customerName?.toLowerCase()?.includes(q) ||
          (p.location?.address || '').toLowerCase()?.includes(q) ||
          p?.customerContactNo?.includes(q),
      );
      setFilteredProjects(filtered);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, projects]);

  const handleNavigate = useCallback(
    (project: Project) => {
      navigation.navigate('ProjectDetails', { project });
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: Project }) => (
      <ProjectCard item={item} onPress={handleNavigate} t={t} role={role} />
    ),
    [handleNavigate, t, role],
  );

  const keyExtractor = useCallback((item: Project) => item.id.toString(), []);

  const renderEmpty = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="folder-open" size={wp(20)} color="#ccc" />
        <Text style={styles.emptyText}>{t('No projects found')}</Text>
        <Text style={styles.emptySubtext}>
          {search
            ? t('Try a different search term')
            : t('Start by adding a new project')}
        </Text>
      </View>
    ),
    [search, t],
  );

  const handleAdd = useCallback(
    () => navigation.navigate('AddProject'),
    [navigation],
  );

  const clearSearch = useCallback(() => setSearch(''), []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View style={styles.searchRow}>
            <TextInput
              placeholder={t('Search by name, location or phone...')}
              value={search}
              onChangeText={setSearch}
              mode="outlined"
              style={styles.search}
              theme={{ roundness: wp(2.5) }}
              contentStyle={styles.searchContent}
              outlineColor="#ddd"
              activeOutlineColor="#0a411fff"
              left={<TextInput.Icon icon="magnify" size={wp(6)} />}
              right={
                search ? (
                  <TextInput.Icon
                    icon="close"
                    size={wp(6)}
                    onPress={clearSearch}
                    color="#999"
                  />
                ) : null
              }
            />
            <TouchableOpacity
              style={[
                styles.addButton,
                role === 'worker' && styles.addButtonDisabled,
              ]}
              onPress={handleAdd}
              disabled={role === 'worker'}
            >
              <MaterialCommunityIcons
                name="plus"
                size={wp(6)}
                color={role === 'worker' ? '#ccc' : '#fff'}
              />
            </TouchableOpacity>
          </View>

          {/*<View style={styles.langRow}>
            <Text style={styles.langLabel}>{t('Language')}</Text>
            <View style={styles.langToggle}>
              <Text style={[styles.langText, !isTamil && styles.activeLang]}>
                {t('English')}
              </Text>
              <Switch
                value={isTamil}
                onValueChange={toggleLanguage}
                color="#0a411fff"
              />
              <Text style={[styles.langText, isTamil && styles.activeLang]}>
                {t('Tamil')}
              </Text>
            </View>
          </View>*/}
        </View>

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#0a411fff" />
          </View>
        ) : (
          <FlatList
            data={filteredProjects}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={renderEmpty}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            updateCellsBatchingPeriod={50}
            initialNumToRender={10}
            windowSize={5}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F5F5' },
  container: { flex: 1 },
  headerRow: { paddingHorizontal: wp(4), paddingTop: hp(1) },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  search: {
    flex: 1,
    marginRight: wp(2),
    backgroundColor: '#fff',
  },
  searchContent: { fontSize: wp(4) },
  addButton: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    backgroundColor: '#0a411fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#f0f0f0',
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(0.5),
  },
  langLabel: {
    fontSize: wp(4),
    color: '#555',
  },
  langToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  langText: {
    fontSize: wp(3.8),
    color: '#888',
    marginHorizontal: wp(2),
  },
  activeLang: {
    color: '#0a411fff',
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: wp(4),
    paddingBottom: hp(15),
  },
  card: {
    marginBottom: hp(2),
    padding: wp(4),
    backgroundColor: '#fff',
    borderRadius: wp(3),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1.5),
  },
  name: {
    fontSize: wp(5),
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
    marginRight: wp(2),
  },
  statusChip: {
    height: hp(4.2),
    justifyContent: 'center',
    paddingHorizontal: wp(2.5),
  },
  statusText: {
    color: '#fff',
    fontSize: wp(3.2),
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(0.8),
  },
  infoText: {
    marginLeft: wp(2),
    color: '#333',
    fontSize: wp(3.8),
    flex: 1,
  },
  daysLeft: {
    marginLeft: 'auto',
    fontSize: wp(3.4),
    fontWeight: '600',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp(1.5),
    paddingTop: hp(1.5),
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  amountBlock: { alignItems: 'center', flex: 1 },
  amountLabel: {
    fontSize: wp(3.2),
    color: '#888',
  },
  amountValue: {
    fontSize: wp(4),
    fontWeight: 'bold',
    color: '#333',
    marginTop: hp(0.3),
  },
  amountDivider: {
    width: 1,
    backgroundColor: '#ddd',
    marginHorizontal: wp(2),
  },
  imagePreview: {
    flexDirection: 'row',
    marginTop: hp(1.5),
    flexWrap: 'wrap',
  },
  thumbnail: {
    width: wp(18),
    height: wp(18),
    borderRadius: wp(2),
    marginRight: wp(2),
    marginBottom: hp(1),
  },
  moreImages: {
    width: wp(18),
    height: wp(18),
    borderRadius: wp(2),
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(2),
    marginBottom: hp(1),
  },
  moreText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: wp(4),
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: hp(10),
  },
  emptyText: {
    fontSize: wp(5),
    color: '#999',
    marginTop: hp(2),
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: wp(3.8),
    color: '#bbb',
    marginTop: hp(1),
    textAlign: 'center',
    paddingHorizontal: wp(10),
  },
});

export default ProjectList;
