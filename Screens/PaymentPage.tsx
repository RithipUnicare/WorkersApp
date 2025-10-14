import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Card, Divider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { rootStackParamList } from '../navigation/AppNavigation';
import { Customer, Payment } from './AdminCustomerList';
import DatePicker from 'react-native-date-picker';
import { Formatwithcomma, RemoveComma } from '../utils/formatewithcomma';

type Props = {
  route: {
    params: {
      customer: Customer;
    };
  };
  navigation: NativeStackNavigationProp<rootStackParamList, 'PaymentPage'>;
};

const PaymentPage: React.FC<Props> = ({ route, navigation }) => {
  const { customer } = route.params;
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customerData, setCustomerData] = useState<Customer>(customer);

  useEffect(() => {
    navigation.setOptions({
      title: `Payments - ${customer.name}`,
    });
  }, [customer.name, navigation]);

  const calculateTotalPaid = (payments: Payment[]) => {
    return payments.reduce((sum, payment) => sum + payment.amount, 0);
  };

  const handleAddPayment = async () => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const payment: Payment = {
      id: Date.now().toString(),
      date: date.toISOString(),
      amount: parseFloat(amount),
    };

    try {
      const updatedCustomer = {
        ...customerData,
        payments: [...(customerData.payments || []), payment],
      };

      setCustomerData(updatedCustomer);
      setAmount('');

      const storedCustomers = await AsyncStorage.getItem('customers');
      if (storedCustomers) {
        const customers: Customer[] = JSON.parse(storedCustomers);
        const customerIndex = customers.findIndex(c => c.id === customer.id);
        if (customerIndex !== -1) {
          customers[customerIndex] = updatedCustomer;
          await AsyncStorage.setItem('customers', JSON.stringify(customers));
        }
      }
    } catch (error) {
      console.error('Error adding payment:', error);
      Alert.alert('Error', 'Failed to add payment');
    }
  };

  const totalPaid = calculateTotalPaid(customerData.payments || []);
  const remainingAmount = customerData.budget - totalPaid;
  const paymentStatus = remainingAmount <= 0 ? 'Paid' : 'In Progress';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Payment Summary Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Payment Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Budget:</Text>
            <Text style={styles.summaryValue}>
              ₹{Formatwithcomma(customerData.budget)}
            </Text>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Paid:</Text>
            <Text style={styles.summaryValue}>
              ₹{Formatwithcomma(totalPaid)}
            </Text>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Remaining:</Text>
            <Text
              style={[
                styles.summaryValue,
                { color: remainingAmount > 0 ? '#e74c3c' : '#27ae60' },
              ]}
            >
              ₹{Formatwithcomma(Math.abs(remainingAmount))}
            </Text>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Status:</Text>
            <Text
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    paymentStatus === 'Paid' ? '#27ae60' : '#f39c12',
                },
              ]}
            >
              {paymentStatus}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Add Payment Form */}
      <Text style={styles.sectionTitle}>Add New Payment</Text>
      <TextInput
        label="Amount"
        value={Formatwithcomma(amount)}
        onChangeText={text => setAmount(RemoveComma(text))}
        mode="outlined"
        style={styles.input}
        keyboardType="numeric"
        left={<TextInput.Affix text="₹" />}
      />

      <TextInput
        label="Date"
        value={date.toLocaleDateString()}
        mode="outlined"
        style={styles.input}
        right={
          <TextInput.Icon
            icon="calendar"
            onPress={() => setShowDatePicker(true)}
          />
        }
        editable={false}
      />

      <DatePicker
        modal
        open={showDatePicker}
        date={date}
        mode="date"
        onConfirm={selectedDate => {
          setShowDatePicker(false);
          setDate(selectedDate);
        }}
        onCancel={() => setShowDatePicker(false)}
      />

      <Button
        mode="contained"
        onPress={handleAddPayment}
        style={styles.button}
        buttonColor="#2874b8"
      >
        Record Payment
      </Button>

      {/* Payment History */}
      <Text style={[styles.sectionTitle, { marginTop: 32 }]}>
        Payment History
      </Text>
      {customerData.payments?.length ? (
        customerData.payments.map(payment => (
          <Card key={payment.id} style={styles.paymentCard}>
            <Card.Content style={styles.paymentCardContent}>
              <View>
                <Text style={styles.paymentDate}>
                  {new Date(payment.date).toLocaleDateString()}
                </Text>
                <Text style={styles.paymentId}>ID: {payment.id.slice(-6)}</Text>
              </View>
              <Text style={styles.paymentAmount}>
                ₹{Formatwithcomma(payment.amount)}
              </Text>
            </Card.Content>
          </Card>
        ))
      ) : (
        <Text style={styles.noPayments}>No payment history found</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 16 },
  card: {
    marginBottom: 24,
    borderRadius: 8,
    backgroundColor: '#fff',
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 16,
    color: '#555',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  statusBadge: {
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 14,
    fontWeight: '500',
    overflow: 'hidden',
  },
  divider: {
    marginVertical: 8,
    backgroundColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  button: {
    borderRadius: 8,
    paddingVertical: 8,
    marginTop: 8,
  },
  paymentCard: {
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    elevation: 1,
  },
  paymentCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  paymentDate: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  paymentId: {
    fontSize: 12,
    color: '#777',
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2874b8',
  },
  noPayments: {
    textAlign: 'center',
    color: '#777',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default PaymentPage;
