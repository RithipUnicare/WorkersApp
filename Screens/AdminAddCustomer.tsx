import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  TextInput,
  Button,
  Portal,
  Snackbar,
  FAB,
  HelperText,
} from 'react-native-paper';
import { rootStackParamList } from '../navigation/AppNavigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CustomerAPI } from '../service/apiService';
import DatePicker from 'react-native-date-picker';
import dayjs from 'dayjs';
import { RouteProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslator } from 'react-native-translator';

const { width, height } = Dimensions.get('window');
const wp = (percentage: number) => (width * percentage) / 100;
const hp = (percentage: number) => (height * percentage) / 100;

type Props = {
  navigation: NativeStackNavigationProp<rootStackParamList, 'AddCustomer'>;
  route: RouteProp<rootStackParamList, 'AddCustomer'>;
};

const enToTa: Record<string, string> = {
  // Titles
  'Add New Customer': 'புதிய வாடிக்கையாளரைச் சேர்',
  'Edit Customer': 'வாடிக்கையாளரைத் திருத்து',

  // Labels
  'Customer Name *': 'வாடிக்கையாளர் பெயர் *',
  'Phone Number *': 'தொலைபேசி எண் *',
  'Address *': 'முகவரி *',
  'Work Description': 'பணி விளக்கம்',
  'No. of Days to Visit': 'பார்க்க வேண்டிய நாட்கள்',
  'Visit Date': 'பார்வையிடும் தேதி',

  // Errors
  'Name is required': 'பெயர் தேவை',
  'Enter a valid 10-digit number': 'சரியான 10 இலக்க எண்ணை உள்ளிடு',
  'Address is required': 'முகவரி தேவை',
  'Please fill all required fields correctly':
    'அனைத்து தேவையான புலங்களையும் சரியாக நிரப்பு',

  // Buttons
  'Save Customer': 'வாடிக்கையாளரைச் சேமி',
  'Update Customer': 'வாடிக்கையாளரைப் புதுப்பி',

  // Messages
  'Customer added successfully!': 'வாடிக்கையாளர் வெற்றிகரமாக சேர்க்கப்பட்டார்!',
  'Customer updated successfully!':
    'வாடிக்கையாளர் வெற்றிகரமாக புதுப்பிக்கப்பட்டார்!',
  'Operation failed': 'செயல்பாடு தோல்வியடைந்தது',
};

const AddCustomer: React.FC<Props> = ({ navigation, route }) => {
  const existingCustomer = route.params?.customer;
  const isEditMode = !!existingCustomer;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [noOfDaysVisited, setNoOfDaysVisited] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

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

  // Form validation
  const isValidPhone =
    phone.split(' ')[1].length === 10 && /^\d+$/.test(phone.split(' ')[1]);
  console.log(phone.split(' ')[1]);
  const isFormValid =
    name.trim().length > 0 && isValidPhone && address.trim().length > 0;

  useEffect(() => {
    if (existingCustomer) {
      setName(existingCustomer.name || '');
      setPhone(existingCustomer.contactNo || '');
      setAddress(existingCustomer.address || '');
      setDescription(existingCustomer.workDescription || '');
      setNoOfDaysVisited(String(existingCustomer.noOfDaysToVisit || ''));
      setSelectedDate(
        existingCustomer.date ? new Date(existingCustomer.date) : new Date(),
      );
    }
  }, [existingCustomer]);

  const handleSave = async () => {
    if (!isFormValid) {
      setSnackbar({
        visible: true,
        message: t('Please fill all required fields correctly'),
      });
      return;
    }

    setLoading(true);
    const customerData: any = {
      name: name.trim(),
      contactNo: phone,
      address: address.trim(),
      workDescription: description.trim(),
      noOfDaysToVisit: Number(noOfDaysVisited) || 0,
      date: dayjs(selectedDate).format('YYYY-MM-DD'),
      status: isEditMode ? existingCustomer?.status : 'INQUIRED',
    };

    try {
      if (isEditMode && existingCustomer?.id) {
        await CustomerAPI.update(existingCustomer.id, customerData);
        setSnackbar({
          visible: true,
          message: t('Customer updated successfully!'),
        });
      } else {
        await CustomerAPI.create(customerData);
        setSnackbar({
          visible: true,
          message: t('Customer added successfully!'),
        });
      }
      setTimeout(() => navigation.goBack(), 800);
    } catch (e: any) {
      setSnackbar({
        visible: true,
        message: e?.message || t('Operation failed'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : hp(10)}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>
            {isEditMode ? t('Edit Customer') : t('Add New Customer')}
          </Text>

          {/* Name */}
          <TextInput
            label={t('Customer Name *')}
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
            theme={{ roundness: wp(2.5) }}
            contentStyle={styles.inputContent}
            outlineColor="#ddd"
            activeOutlineColor="#0a411fff"
            left={<TextInput.Icon icon="account" size={wp(6)} />}
            error={name.trim().length === 0}
          />
          {name.trim().length === 0 && (
            <HelperText type="error">{t('Name is required')}</HelperText>
          )}

          {/* Phone */}
          <TextInput
            label={t('Phone Number *')}
            value={phone}
            onChangeText={text =>
              setPhone(text.replace(/[^0-9+ ]/g, '').slice(0, 14))
            }
            mode="outlined"
            style={styles.input}
            theme={{ roundness: wp(2.5) }}
            keyboardType="phone-pad"
            maxLength={14}
            contentStyle={styles.inputContent}
            outlineColor="#ddd"
            activeOutlineColor={isValidPhone ? '#27ae60' : '#0a411fff'}
            left={<TextInput.Icon icon="phone" size={wp(6)} />}
            right={
              phone.length > 0 && (
                <TextInput.Icon
                  icon={isValidPhone ? 'check-circle' : 'alert-circle'}
                  color={isValidPhone ? '#27ae60' : '#e74c3c'}
                  size={wp(6)}
                />
              )
            }
            error={phone.length > 0 && !isValidPhone}
          />
          {phone.length > 0 && !isValidPhone && (
            <HelperText type="error">
              {t('Enter a valid 10-digit number')}
            </HelperText>
          )}

          {/* Address */}
          <TextInput
            label={t('Address *')}
            value={address}
            onChangeText={setAddress}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={[styles.input, styles.textArea]}
            theme={{ roundness: wp(2.5) }}
            contentStyle={styles.inputContent}
            outlineColor="#ddd"
            activeOutlineColor="#0a411fff"
            left={<TextInput.Icon icon="map-marker" size={wp(6)} />}
            error={address.trim().length === 0}
          />
          {address.trim().length === 0 && (
            <HelperText type="error">{t('Address is required')}</HelperText>
          )}

          {/* Description */}
          <TextInput
            label={t('Work Description')}
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            multiline
            numberOfLines={4}
            style={[styles.input, styles.textArea]}
            theme={{ roundness: wp(2.5) }}
            contentStyle={styles.inputContent}
            outlineColor="#ddd"
            activeOutlineColor="#0a411fff"
            left={<TextInput.Icon icon="text" size={wp(6)} />}
          />

          {/* Days Visited */}
          <TextInput
            label={t('No. of Days to Visit')}
            value={noOfDaysVisited}
            onChangeText={text =>
              setNoOfDaysVisited(text.replace(/[^0-9]/g, ''))
            }
            mode="outlined"
            style={styles.input}
            theme={{ roundness: wp(2.5) }}
            keyboardType="numeric"
            contentStyle={styles.inputContent}
            outlineColor="#ddd"
            activeOutlineColor="#0a411fff"
            left={<TextInput.Icon icon="calendar-clock" size={wp(6)} />}
          />

          {/* Date Picker */}
          <View style={styles.dateSection}>
            <Text style={styles.dateLabel}>{t('Visit Date')}</Text>
            <Button
              mode="outlined"
              onPress={() => setDatePickerOpen(true)}
              style={styles.dateButton}
              contentStyle={styles.dateButtonContent}
              theme={{ roundness: wp(2.5) }}
              icon="calendar"
            >
              {dayjs(selectedDate).format('DD MMM YYYY')}
            </Button>
          </View>

          {/* Save Button */}
          <Button
            mode="contained"
            onPress={handleSave}
            style={styles.saveButton}
            contentStyle={styles.saveButtonContent}
            buttonColor="#0a411fff"
            loading={loading}
            disabled={loading || !isFormValid}
            icon="content-save"
          >
            {isEditMode ? t('Update Customer') : t('Save Customer')}
          </Button>
        </ScrollView>

        {/* FAB */}
        <Portal>
          <FAB
            icon="check"
            style={styles.fab}
            onPress={handleSave}
            color="#fff"
            visible={isFormValid}
          />
        </Portal>

        {/* Date Picker Modal */}
        <DatePicker
          modal
          open={datePickerOpen}
          date={selectedDate}
          mode="date"
          onConfirm={date => {
            setSelectedDate(date);
            setDatePickerOpen(false);
          }}
          onCancel={() => setDatePickerOpen(false)}
        />

        {/* Snackbar */}
        <Snackbar
          visible={snackbar.visible}
          onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
          duration={3000}
          style={[
            styles.snackbar,
            snackbar.message.includes('success') ||
            snackbar.message.includes('வெற்றி')
              ? styles.snackbarSuccess
              : styles.snackbarError,
          ]}
        >
          {snackbar.message}
        </Snackbar>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1 },
  content: {
    padding: wp(5),
    paddingBottom: hp(20),
  },
  title: {
    fontSize: wp(6.5),
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: hp(3),
    textAlign: 'center',
  },
  input: {
    marginBottom: hp(1),
    backgroundColor: '#fff',
  },
  inputContent: { fontSize: wp(4) },
  textArea: {
    minHeight: hp(12),
  },
  dateSection: {
    marginBottom: hp(2),
  },
  dateLabel: {
    fontSize: wp(4),
    fontWeight: '600',
    color: '#333',
    marginBottom: hp(1),
    marginLeft: wp(1),
  },
  dateButton: {
    borderColor: '#0a411fff',
    borderWidth: 1.5,
  },
  dateButtonContent: {
    height: hp(7),
    justifyContent: 'flex-start',
  },
  saveButton: {
    marginTop: hp(3),
    borderRadius: wp(3),
  },
  saveButtonContent: {
    height: hp(7),
  },
  fab: {
    position: 'absolute',
    right: wp(5),
    bottom: hp(10),
    backgroundColor: '#27ae60',
  },
  snackbar: {
    margin: wp(4),
    borderRadius: wp(2),
  },
  snackbarSuccess: {
    backgroundColor: '#27ae60',
  },
  snackbarError: {
    backgroundColor: '#e74c3c',
  },
});

export default AddCustomer;
