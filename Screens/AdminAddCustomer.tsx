// screens/AddCustomer.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { rootStackParamList } from '../navigation/AppNavigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Customer } from './AdminCustomerList';
import { Formatwithcomma, RemoveComma } from '../utils/formatewithcomma';
import { CustomerAPI } from '../service/apiService';
import DatePicker from 'react-native-date-picker';
import dayjs from 'dayjs';

type Props = {
  navigation: NativeStackNavigationProp<rootStackParamList, 'AddCustomer'>;
};

const { height } = Dimensions.get('window');

const AddCustomer: React.FC<Props> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [advance, setAdvance] = useState('');
  const [budget, setBudget] = useState('');
  const [description, setDescription] = useState('');
  const [noOfDaysVisited, setNoOfDaysVisited] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [open, setOpen] = useState(false);

  const handleAdd = async () => {
    const newCustomer: Customer & {
      id?: string;
      createdAt?: string;
      payments?: any[];
      date?: string;
      contactNo?: string;
      workDescription?: string;
    } = {
      name,
      contactNo: phone,
      workDescription: description,
      location,
      noOfDaysVisited,
      address,
      advance: parseFloat(advance) || 0,
      budget: parseFloat(budget) || 0,
      status: 'INQUIRED',
      date: dayjs(selectedDate).format('YYYY-MM-DD'), // Add formatted date here
    };

    try {
      await CustomerAPI.create(newCustomer as any);
      navigation.goBack();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 100}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.title}>Customer Details</Text>

        <TextInput
          label="Customer Name *"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
        />

        <TextInput
          label="Phone Number *"
          value={phone}
          onChangeText={setPhone}
          mode="outlined"
          style={styles.input}
          keyboardType="phone-pad"
          disabled={phone.length === 10}
          right={
            phone.length === 10 && (
              <TextInput.Icon icon="check-circle" color="green" />
            )
          }
        />

        <TextInput
          label="Address *"
          value={address}
          onChangeText={setAddress}
          mode="outlined"
          style={styles.input}
          multiline
        />

        <TextInput
          label="Description"
          value={description}
          onChangeText={setDescription}
          mode="outlined"
          style={[
            styles.input,
            { maxHeight: height * 0.4, minHeight: height * 0.15 },
          ]}
          multiline
        />

        <TextInput
          label="No. of Days Visited"
          value={noOfDaysVisited}
          onChangeText={setNoOfDaysVisited}
          mode="outlined"
          style={styles.input}
          keyboardType="numeric"
        />

        {/* Date Picker Section */}
        <View style={{ marginBottom: 16 }}>
          <Text style={styles.label}>Select Date</Text>
          <Button
            mode="outlined"
            onPress={() => setOpen(true)}
            style={{ borderRadius: 8, borderColor: '#2874b8' }}
            textColor="#2874b8"
          >
            {dayjs(selectedDate).format('DD-MM-YYYY')}
          </Button>
        </View>

        <DatePicker
          modal
          open={open}
          date={selectedDate}
          mode="date"
          onConfirm={date => {
            setOpen(false);
            setSelectedDate(date);
          }}
          onCancel={() => setOpen(false)}
        />

        <Button
          mode="contained"
          onPress={handleAdd}
          style={styles.button}
          buttonColor="#2874b8"
        >
          Add Customer
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24 },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 24,
  },
  input: { marginBottom: 16 },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  button: { borderRadius: 8, paddingVertical: 8 },
});

export default AddCustomer;
