// screens/AddCustomer.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { rootStackParamList } from '../navigation/AppNavigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Customer } from './AdminCustomerList';

type Props = {
  navigation: NativeStackNavigationProp<rootStackParamList, 'AddCustomer'>;
};

const AddCustomer: React.FC<Props> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [advance, setAdvance] = useState('0');
  const [total, setTotal] = useState('0');

  const handleAdd = async () => {
    if (!name || !phone || !location || !address) return;
    const newCustomer: Customer = {
      name,
      phone,
      location,
      address,
      advance: parseFloat(advance),
      total: parseFloat(total),
    };
    try {
      const stored = await AsyncStorage.getItem('customers');
      const customers = stored ? JSON.parse(stored) : [];
      customers.push(newCustomer);
      await AsyncStorage.setItem('customers', JSON.stringify(customers));
      navigation.goBack();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
      />
      <TextInput
        label="Location *"
        value={location}
        onChangeText={setLocation}
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label="Address *"
        value={address}
        onChangeText={setAddress}
        mode="outlined"
        style={styles.input}
        multiline
      />
      <View style={styles.amountRow}>
        <TextInput
          label="Advance Amount"
          value={advance}
          onChangeText={setAdvance}
          mode="outlined"
          style={styles.amountInput}
          keyboardType="numeric"
        />
        <TextInput
          label="Total Amount"
          value={total}
          onChangeText={setTotal}
          mode="outlined"
          style={styles.amountInput}
          keyboardType="numeric"
        />
      </View>
      <Button
        mode="contained"
        onPress={handleAdd}
        style={styles.button}
        buttonColor="#2874b8"
      >
        Add Customer
      </Button>
    </ScrollView>
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
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  amountInput: { flex: 0.48 },
  button: { borderRadius: 8, paddingVertical: 8 },
});

export default AddCustomer;
