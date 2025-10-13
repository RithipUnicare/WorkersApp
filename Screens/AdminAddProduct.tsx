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

  const pickImage = () => {
    if (images.length >= 3) return;
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
          <TextInput
            label="Date of Delivery * (dd-mm-yyyy)"
            value={deliveryDate}
            onChangeText={setDeliveryDate}
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
          <TextInput
            label="Remaining Days"
            value=""
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
          <TextInput
            label="Customer Time (e.g. 9:00 AM - 5:00 PM)"
            value={customerTime}
            onChangeText={setCustomerTime}
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
          <Text style={styles.imageLabel}>Site Images (Max 3)</Text>
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
            {images.length < 3 && (
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
    marginBottom: height * 0.03,
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
