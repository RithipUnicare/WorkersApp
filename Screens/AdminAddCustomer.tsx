// screens/AddCustomer.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { rootStackParamList } from '../navigation/AppNavigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Customer } from './AdminCustomerList';
import { Formatwithcomma, RemoveComma } from '../utils/formatewithcomma';

type Props = {
  navigation: NativeStackNavigationProp<rootStackParamList, 'AddCustomer'>;
};

const AddCustomer: React.FC<Props> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [advance, setAdvance] = useState('');
  const [budget, setBudget] = useState('');
  const [description, setDescription] = useState('');

  const handleAdd = async () => {
    if (!name || !phone || !location || !address) return;
    const newCustomer: Omit<Customer, 'id' | 'createdAt' | 'payments'> & {
      id?: string;
      createdAt?: string;
      payments?: any[];
    } = {
      id: Date.now().toString(),
      name,
      phone,
      location,
      address,
      advance: parseFloat(advance) || 0,
      budget: parseFloat(budget) || 0,
      payments: [],
      createdAt: new Date().toISOString(),
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
        //disabled={phone.length === 10}
        right={
          phone.length === 10 && (
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
          value={Formatwithcomma(advance)}
          onChangeText={text => setAdvance(RemoveComma(text))}
          mode="outlined"
          style={styles.amountInput}
          keyboardType="numeric"
          left={<TextInput.Affix text="₹" />}
        />
        <TextInput
          label="Budget"
          value={Formatwithcomma(budget)}
          onChangeText={text => setBudget(RemoveComma(text))}
          mode="outlined"
          style={styles.amountInput}
          keyboardType="numeric"
          left={<TextInput.Affix text="₹" />}
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
