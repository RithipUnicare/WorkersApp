// screens/CustomerDetail.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ScrollView,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { rootStackParamList } from '../navigation/AppNavigation';
import { Customer } from './AdminCustomerList';
import { Formatwithcomma } from '../utils/formatewithcomma';

type Props = {
  navigation: NativeStackNavigationProp<rootStackParamList, 'CustomerDetail'>;
  route: RouteProp<rootStackParamList, 'CustomerDetail'>;
};

const CustomerDetail: React.FC<Props> = ({ navigation, route }) => {
  const { customer } = route.params;

  const calculateTotalPaid = (customer: Customer) => {
    return (customer.payments || []).reduce(
      (sum, payment) => sum + payment.amount,
      0,
    );
  };

  const totalPaid = calculateTotalPaid(customer);
  const remaining = customer.budget - totalPaid;
  const status = remaining <= 0 ? 'Paid' : 'Pending';

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <Text style={styles.customerName}>{customer.name}</Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: status === 'Paid' ? '#27ae60' : '#f39c12',
                },
              ]}
            >
              <Text style={styles.statusText}>{status}</Text>
            </View>
          </View>
          <Text style={styles.location}>
            <MaterialCommunityIcons name="map-marker" size={16} color="#666" />
            {'  '}
            {customer.location || customer.address}
          </Text>
        </View>

        {/* Budget Summary Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Budget Summary</Text>
          <View style={styles.budgetRow}>
            <View style={styles.budgetItem}>
              <Text style={styles.budgetLabel}>Total Budget</Text>
              <Text style={styles.budgetValue}>
                ₹{Formatwithcomma(customer.budget)}
              </Text>
            </View>
            <View style={styles.budgetDivider} />
            <View style={styles.budgetItem}>
              <Text style={styles.budgetLabel}>Paid</Text>
              <Text style={[styles.budgetValue, { color: '#27ae60' }]}>
                ₹{Formatwithcomma(totalPaid)}
              </Text>
            </View>
            <View style={styles.budgetDivider} />
            <View style={styles.budgetItem}>
              <Text style={styles.budgetLabel}>Remaining</Text>
              <Text
                style={[
                  styles.budgetValue,
                  { color: remaining > 0 ? '#e74c3c' : '#27ae60' },
                ]}
              >
                ₹{Formatwithcomma(Math.abs(remaining))}
              </Text>
            </View>
          </View>
        </View>

        {/* Contact Information Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact Information</Text>

          <TouchableOpacity
            style={styles.infoRow}
            onPress={async () => {
              const url = `tel:${customer.phone}`;
              await Linking.openURL(url);
            }}
          >
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="phone" size={22} color="#2874b8" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Phone Number</Text>
              <Text style={styles.infoValue}>{customer.phone}</Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color="#ccc"
            />
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="home" size={22} color="#2874b8" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>{customer.address}</Text>
            </View>
          </View>
        </View>

        {/* Project Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Project Details</Text>

          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name="text-box"
                size={22}
                color="#2874b8"
              />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Description</Text>
              <Text style={styles.infoValue}>
                {customer.description || 'No description available'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name="calendar-check"
                size={22}
                color="#2874b8"
              />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Days Visited</Text>
              <Text style={styles.infoValue}>
                {customer.noOfDaysVisited || '0'} days
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="cash" size={22} color="#2874b8" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Advance Payment</Text>
              <Text style={styles.infoValue}>
                ₹{Formatwithcomma(customer.advance)}
              </Text>
            </View>
          </View>
        </View>

        {/* Spacer for bottom button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity
          style={styles.addProjectButton}
          onPress={() => {
            // Navigate to add project screen
            navigation.navigate('AddProject', { customer });
            //console.log('Add project for customer:', customer.name);
          }}
        >
          <MaterialCommunityIcons name="plus-circle" size={24} color="#fff" />
          <Text style={styles.addProjectButtonText}>Add Project</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  headerCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  location: {
    fontSize: 15,
    color: '#666',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    marginTop: 16,
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetItem: {
    flex: 1,
    alignItems: 'center',
  },
  budgetDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 8,
  },
  budgetLabel: {
    fontSize: 13,
    color: '#888',
    marginBottom: 8,
  },
  budgetValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: '#888',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    color: '#333',
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 8,
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addProjectButton: {
    backgroundColor: '#2874b8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 2,
  },
  addProjectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default CustomerDetail;
