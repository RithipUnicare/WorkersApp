import React, { useState, useEffect } from 'react';
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

const { width, height } = Dimensions.get('window');

// Responsive helpers
const wp = (percentage: number) => (width * percentage) / 100;
const hp = (percentage: number) => (height * percentage) / 100;

type Props = {
  navigation: NativeStackNavigationProp<rootStackParamList, 'AddCustomer'>;
  route: RouteProp<rootStackParamList, 'AddCustomer'>;
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

  // Form validation
  const isValidPhone = phone.length === 10 && /^\d+$/.test(phone);
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
        message: 'Please fill all required fields correctly',
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
          message: 'Customer updated successfully!',
        });
      } else {
        await CustomerAPI.create(customerData);
        setSnackbar({ visible: true, message: 'Customer added successfully!' });
      }
      setTimeout(() => navigation.goBack(), 800);
    } catch (e: any) {
      setSnackbar({ visible: true, message: e?.message || 'Operation failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
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
            {isEditMode ? 'Edit Customer' : 'Add New Customer'}
          </Text>

          {/* Name */}
          <TextInput
            label="Customer Name *"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
            theme={{ roundness: wp(2.5) }}
            contentStyle={styles.inputContent}
            outlineColor="#ddd"
            activeOutlineColor="#2874b8"
            left={<TextInput.Icon icon="account" size={wp(6)} />}
            error={name.trim().length === 0}
          />
          {name.trim().length === 0 && (
            <HelperText type="error">Name is required</HelperText>
          )}

          {/* Phone */}
          <TextInput
            label="Phone Number *"
            value={phone}
            onChangeText={text =>
              setPhone(text.replace(/[^0-9]/g, '').slice(0, 10))
            }
            mode="outlined"
            style={styles.input}
            theme={{ roundness: wp(2.5) }}
            keyboardType="numeric"
            maxLength={10}
            contentStyle={styles.inputContent}
            outlineColor="#ddd"
            activeOutlineColor={isValidPhone ? '#27ae60' : '#2874b8'}
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
            <HelperText type="error">Enter a valid 10-digit number</HelperText>
          )}

          {/* Address */}
          <TextInput
            label="Address *"
            value={address}
            onChangeText={setAddress}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={[styles.input, styles.textArea]}
            theme={{ roundness: wp(2.5) }}
            contentStyle={styles.inputContent}
            outlineColor="#ddd"
            activeOutlineColor="#2874b8"
            left={<TextInput.Icon icon="map-marker" size={wp(6)} />}
            error={address.trim().length === 0}
          />
          {address.trim().length === 0 && (
            <HelperText type="error">Address is required</HelperText>
          )}

          {/* Description */}
          <TextInput
            label="Work Description"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            multiline
            numberOfLines={4}
            style={[styles.input, styles.textArea]}
            theme={{ roundness: wp(2.5) }}
            contentStyle={styles.inputContent}
            outlineColor="#ddd"
            activeOutlineColor="#2874b8"
            left={<TextInput.Icon icon="text" size={wp(6)} />}
            error={description.trim().length === 0}
          />

          {/* Days Visited */}
          <TextInput
            label="No. of Days to Visit"
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
            activeOutlineColor="#2874b8"
            left={<TextInput.Icon icon="calendar-clock" size={wp(6)} />}
          />

          {/* Date Picker */}
          <View style={styles.dateSection}>
            <Text style={styles.dateLabel}>Visit Date</Text>
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
            buttonColor="#2874b8"
            loading={loading}
            disabled={loading || !isFormValid}
            icon="content-save"
          >
            {isEditMode ? 'Update Customer' : 'Save Customer'}
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
            snackbar.message.includes('success')
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
    borderColor: '#2874b8',
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
