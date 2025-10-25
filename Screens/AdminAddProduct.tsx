// screens/AddProject.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { TextInput, Button, Menu, Provider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { rootStackParamList } from '../navigation/AppNavigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import dayjs from 'dayjs';
import DatePicker from 'react-native-date-picker';
import { RouteProp } from '@react-navigation/native';
import { Customer } from './AdminCustomerList';
import { getLocation } from '../utils/GeoLocation';

const { width, height } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<rootStackParamList, 'AddProject'>;
  route: RouteProp<rootStackParamList, 'AddProject'>;
};

export type Project = {
  customerName: string;
  contactNumber: string;
  location: string;
  deliveryDate: string;
  customerTime: string;
  siteStatus: 'In Progress' | 'Material Pending' | 'Completed';
  images: string[];
};

export const GetLocation = async () => {
  try {
    const location = await getLocation();
    return location;
  } catch (error) {
    console.error('Error getting location: ', error);
    return null;
  }
};

const AddProject: React.FC<Props> = ({ navigation, route }) => {
  const customer: Customer | undefined = route.params?.customer;
  const projectToEdit: Project | undefined = route.params?.projectToEdit;

  const isEditMode = !!projectToEdit;

  const [customerName, setCustomerName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [location, setLocation] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [customerTime, setCustomerTime] = useState('');
  const [siteStatus, setSiteStatus] = useState<
    'In Progress' | 'Material Pending' | 'Completed'
  >('In Progress');
  const [images, setImages] = useState<string[]>([]);

  const [menuVisible, setMenuVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);

  const [remainingDays, setRemainingDays] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<Date>(() => {
    const now = new Date();
    now.setHours(9, 0, 0, 0);
    return now;
  });

  // === Pre-fill logic ===
  useEffect(() => {
    if (projectToEdit) {
      // Edit mode: Fill from project
      setCustomerName(projectToEdit.customerName);
      setContactNumber(projectToEdit.contactNumber);
      setLocation(projectToEdit.location);
      setDeliveryDate(projectToEdit.deliveryDate);
      setCustomerTime(projectToEdit.customerTime);
      setSiteStatus(projectToEdit.siteStatus);
      setImages(projectToEdit.images);

      // Parse delivery date
      const [dd, mm, yyyy] = projectToEdit.deliveryDate.split('-').map(Number);
      const delivery = new Date(yyyy, mm - 1, dd);
      setSelectedDate(delivery);

      // Parse time
      const [time, ampm] = projectToEdit.customerTime.split(' ');
      const [h, m] = time.split(':');
      let hours = parseInt(h, 10);
      if (ampm === 'PM' && hours !== 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      const timeDate = new Date();
      timeDate.setHours(hours, parseInt(m, 10), 0, 0);
      setSelectedTime(timeDate);

      // Calculate remaining days
      const today = new Date();
      const diffTime = Math.abs(delivery.getTime() - today.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setRemainingDays(`${diffDays} days remaining`);
    } else if (customer) {
      // Add from customer
      setCustomerName(customer.name);
      setContactNumber(customer.phone);
      setLocation(customer.address || '');
    }
  }, [projectToEdit, customer]);

  // === Date & Time Handlers ===
  const formatDate = (date: Date): string => dayjs(date).format('DD-MM-YYYY');
  const formatTime = (date: Date): string => dayjs(date).format('h:mm A');

  const handleDateConfirm = (date: Date) => {
    setSelectedDate(date);
    setDeliveryDate(formatDate(date));
    setDatePickerVisible(false);

    const today = new Date();
    const diffTime = Math.abs(date.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setRemainingDays(`${diffDays} days remaining`);
  };

  const handleTimeConfirm = (time: Date) => {
    setSelectedTime(time);
    setCustomerTime(formatTime(time));
    setTimePickerVisible(false);
  };

  // === Image Picker ===
  const pickImage = () => {
    if (images.length >= 15) return;
    launchImageLibrary({ mediaType: 'photo', quality: 0.5 }, response => {
      if (response.didCancel || response.errorCode || !response.assets) return;
      const uri = response.assets[0].uri;
      if (uri) setImages(prev => [...prev, uri]);
    });
  };

  const openCamera = () => {
    if (images.length >= 15) return;
    launchCamera({ mediaType: 'photo', quality: 0.5 }, response => {
      if (response.didCancel || response.errorCode || !response.assets) return;
      const uri = response.assets[0].uri;
      if (uri) setImages(prev => [...prev, uri]);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // === Save / Update Logic ===
  const handleSave = async () => {
    if (
      !customerName ||
      !contactNumber ||
      !location ||
      !deliveryDate ||
      !customerTime
    ) {
      return;
    }

    const projectData: Project = {
      customerName,
      contactNumber,
      deliveryDate,
      customerTime,
      siteStatus,
    };

    try {
      const stored = await AsyncStorage.getItem('projects');
      let projects: Project[] = stored ? JSON.parse(stored) : [];

      if (isEditMode && projectToEdit) {
        // Remove old version
        projects = projects.filter(
          p =>
            !(
              p.customerName === projectToEdit.customerName &&
              p.contactNumber === projectToEdit.contactNumber &&
              p.deliveryDate === projectToEdit.deliveryDate
            ),
        );
      }

      projects.push(projectData);
      await AsyncStorage.setItem('projects', JSON.stringify(projects));
      navigation.goBack();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Provider>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -height * 0.1}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>
            {isEditMode ? 'Edit Project' : 'Add New Project'}
          </Text>

          <TextInput
            label="Customer Name *"
            value={customerName}
            onChangeText={setCustomerName}
            mode="outlined"
            style={styles.input}
            theme={theme}
          />

          <TextInput
            label="Contact Number *"
            value={contactNumber}
            onChangeText={setContactNumber}
            mode="outlined"
            style={styles.input}
            keyboardType="phone-pad"
            theme={theme}
            right={
              contactNumber.length === 10 && (
                <TextInput.Icon icon="check-circle" color="green" />
              )
            }
          />

          <TextInput
            label="Location *"
            value={location}
            onChangeText={setLocation}
            mode="outlined"
            style={styles.input}
            theme={theme}
            right={
              <TextInput.Icon
                icon="map-marker"
                onPress={async () => {
                  const loc = await GetLocation();
                  if (loc) setLocation(loc?.address);
                }}
              />
            }
          />

          {/* Date Picker */}
          <TouchableOpacity
            onPress={() => setDatePickerVisible(true)}
            style={styles.dateInputContainer}
          >
            <TextInput
              label="Date of Delivery *"
              value={deliveryDate}
              mode="outlined"
              style={styles.input}
              editable={false}
              pointerEvents="none"
              right={
                <TextInput.Icon
                  icon="calendar"
                  onPress={() => setDatePickerVisible(true)}
                />
              }
              theme={theme}
            />
          </TouchableOpacity>

          <TextInput
            label="Remaining Days"
            value={remainingDays}
            disabled
            mode="outlined"
            style={styles.input}
            theme={disabledTheme}
          />

          <DatePicker
            modal
            open={datePickerVisible}
            date={selectedDate}
            mode="date"
            onConfirm={handleDateConfirm}
            onCancel={() => setDatePickerVisible(false)}
          />

          {/* Time Picker */}
          <TouchableOpacity
            onPress={() => setTimePickerVisible(true)}
            style={styles.dateInputContainer}
          >
            <TextInput
              label="Customer Time *"
              value={customerTime}
              mode="outlined"
              style={styles.input}
              editable={false}
              pointerEvents="none"
              right={
                <TextInput.Icon
                  icon="clock-outline"
                  onPress={() => setTimePickerVisible(true)}
                />
              }
              theme={theme}
            />
          </TouchableOpacity>

          <DatePicker
            modal
            open={timePickerVisible}
            date={selectedTime}
            mode="time"
            onConfirm={handleTimeConfirm}
            onCancel={() => setTimePickerVisible(false)}
          />

          {/* Site Status Dropdown */}
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <TextInput
                label="Site Status"
                value={siteStatus}
                mode="outlined"
                style={styles.input}
                editable={false}
                onFocus={() => setMenuVisible(true)}
                theme={theme}
              />
            }
          >
            {(['In Progress', 'Material Pending', 'Completed'] as const).map(
              status => (
                <Menu.Item
                  key={status}
                  onPress={() => {
                    setSiteStatus(status);
                    setMenuVisible(false);
                  }}
                  title={status}
                />
              ),
            )}
          </Menu>

          {/* Images */}
          <Text style={styles.imageLabel}>Site Images (Max 15)</Text>
          <View style={styles.imageContainer}>
            {images.map((uri, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri }} style={styles.image} />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeImage(index)}
                >
                  <MaterialCommunityIcons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 15 && (
              <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                <MaterialCommunityIcons
                  name="upload"
                  size={width * 0.08}
                  color="#2874b8"
                />
                <Text style={styles.uploadText}>Upload</Text>
              </TouchableOpacity>
            )}
            {images.length < 15 && (
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={openCamera}
              >
                <MaterialCommunityIcons
                  name="camera"
                  size={width * 0.08}
                  color="#2874b8"
                />
                <Text style={styles.uploadText}>Camera</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Submit Button */}
          <Button
            mode="contained"
            onPress={handleSave}
            style={styles.button}
            buttonColor="#2874b8"
            textColor="white"
            disabled={
              !customerName ||
              !contactNumber ||
              !location ||
              !deliveryDate ||
              !customerTime
            }
          >
            {isEditMode ? 'Update Project' : 'Add Project'}
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </Provider>
  );
};

// === Shared Themes ===
const theme = {
  colors: {
    primary: 'black',
    onSurfaceVariant: 'black',
    background: 'white',
    onSurface: '#000',
  },
};

const disabledTheme = {
  colors: {
    ...theme.colors,
    onSurfaceDisabled: 'grey',
    disabled: 'black',
  },
};

// === Styles ===
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: width * 0.06 },
  title: {
    fontSize: width * 0.06,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: height * 0.03,
  },
  input: {
    marginBottom: height * 0.02,
  },
  dateInputContainer: {
    marginBottom: 16,
  },
  imageLabel: {
    fontSize: width * 0.04,
    color: '#333',
    marginBottom: height * 0.01,
    marginTop: height * 0.02,
  },
  imageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: width * 0.02,
    marginBottom: height * 0.02,
  },
  image: {
    width: width * 0.25,
    height: width * 0.25,
    borderRadius: width * 0.02,
  },
  removeButton: {
    position: 'absolute',
    top: -height * 0.01,
    right: -width * 0.01,
    backgroundColor: '#f00',
    borderRadius: width * 0.03,
    width: width * 0.06,
    height: width * 0.06,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButton: {
    width: width * 0.25,
    height: width * 0.25,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#2874b8',
    borderRadius: width * 0.02,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    color: '#2874b8',
    marginTop: height * 0.01,
    fontSize: width * 0.035,
  },
  button: {
    borderRadius: width * 0.02,
    paddingVertical: height * 0.01,
    marginTop: height * 0.03,
    marginBottom: height * 0.05,
  },
});

export default AddProject;
