// screens/AddProject.tsx (updated with KeyboardAvoidingView)
import React, { useState } from 'react';
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
import { launchImageLibrary } from 'react-native-image-picker';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import dayjs from 'dayjs';
import DatePicker from 'react-native-date-picker';

const { width, height } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<rootStackParamList, 'AddProject'>;
};

type Project = {
  customerName: string;
  contactNumber: string;
  location: string;
  deliveryDate: string;
  customerTime: string;
  siteStatus: 'In Progress' | 'Material Pending' | 'Completed';
  images: string[];
};

const AddProject: React.FC<Props> = ({ navigation }) => {
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

  const [remainingDays, setRemainingDays] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [selectedTime, setSelectedTime] = useState<Date>(() => {
    const now = new Date();
    now.setHours(9, 0, 0, 0); // Default to 9:00 AM
    return now;
  });

  const formatDate = (date: Date): string => {
    return dayjs(date).format('DD-MM-YYYY');
  };

  const formatTime = (date: Date): string => {
    return dayjs(date).format('h:mm A');
  };

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

  const pickImage = () => {
    if (images.length >= 5) return;
    launchImageLibrary({ mediaType: 'photo', quality: 1 }, response => {
      if (response.didCancel || response.errorCode || !response.assets) return;
      const uri = response.assets[0].uri;
      if (uri) setImages(prev => [...prev, uri]);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleAdd = async () => {
    if (
      !customerName ||
      !contactNumber ||
      !location ||
      !deliveryDate ||
      !customerTime
    )
      return;
    const newProject: Project = {
      customerName,
      contactNumber,
      location,
      deliveryDate,
      customerTime,
      siteStatus,
      images,
    };
    try {
      const stored = await AsyncStorage.getItem('projects');
      const projects = stored ? JSON.parse(stored) : [];
      projects.push(newProject);
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
          <Text style={styles.title}>Project Details</Text>
          <TextInput
            label="Customer Name *"
            value={customerName}
            onChangeText={setCustomerName}
            mode="outlined"
            style={styles.input}
            theme={{
              colors: {
                primary: 'black',
                onSurfaceVariant: 'black',
                background: 'white',
                onSurface: '#000',
              },
            }}
          />
          <TextInput
            label="Contact Number *"
            value={contactNumber}
            onChangeText={setContactNumber}
            mode="outlined"
            style={styles.input}
            keyboardType="phone-pad"
            theme={{
              colors: {
                primary: 'black',
                onSurfaceVariant: 'black',
                onSurface: '#000',
                background: 'white',
              },
            }}
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
            theme={{
              colors: {
                primary: 'black',
                onSurfaceVariant: 'black',
                onSurface: '#000',
                background: 'white',
              },
            }}
          />
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
              theme={{
                colors: {
                  primary: 'black',
                  onSurfaceVariant: 'black',
                  onSurface: '#000',
                  background: 'white',
                },
              }}
            />
          </TouchableOpacity>

          <TextInput
            label="Remaining Days"
            value={remainingDays}
            disabled
            mode="outlined"
            style={styles.input}
            theme={{
              colors: {
                primary: 'black',
                onSurfaceVariant: 'black',
                onSurface: '#000',
                background: 'white',
                onSurfaceDisabled: 'grey',
                disabled: 'black',
              },
            }}
          />

          <DatePicker
            modal
            open={datePickerVisible}
            date={selectedDate}
            mode="date"
            onConfirm={handleDateConfirm}
            onCancel={() => setDatePickerVisible(false)}
          />
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
              theme={{
                colors: {
                  primary: 'black',
                  onSurfaceVariant: 'black',
                  onSurface: '#000',
                  background: 'white',
                },
              }}
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
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <TextInput
                label="Site Status"
                value={siteStatus}
                onFocus={() => setMenuVisible(true)}
                mode="outlined"
                style={styles.input}
                editable={false}
                theme={{
                  colors: {
                    primary: 'black',
                    onSurfaceVariant: 'black',
                    onSurface: '#000',
                    background: 'white',
                    disabled: 'black',
                  },
                }}
              />
            }
          >
            <Menu.Item
              onPress={() => {
                setSiteStatus('In Progress');
                setMenuVisible(false);
              }}
              title="In Progress"
            />
            <Menu.Item
              onPress={() => {
                setSiteStatus('Material Pending');
                setMenuVisible(false);
              }}
              title="Material Pending"
            />
            <Menu.Item
              onPress={() => {
                setSiteStatus('Completed');
                setMenuVisible(false);
              }}
              title="Completed"
            />
          </Menu>
          <Text style={styles.imageLabel}>Site Images (Max 5)</Text>
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
            {images.length < 5 && (
              <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                <MaterialCommunityIcons
                  name="upload"
                  size={width * 0.08}
                  color="#2874b8"
                />
                <Text style={styles.uploadText}>Upload</Text>
              </TouchableOpacity>
            )}
          </View>
          <Button
            mode="contained"
            onPress={handleAdd}
            style={styles.button}
            buttonColor="#2874b8"
            textColor="white"
          >
            Add Project
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </Provider>
  );
};

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
    // backgroundColor: '#FFFFFF',
    // color: '#000',
  },
  imageLabel: {
    fontSize: width * 0.04,
    color: '#333',
    marginBottom: height * 0.01,
  },
  imageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  dateInputContainer: {
    marginBottom: 16,
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
    marginTop: height * 0.02,
  },
});

export default AddProject;
