// screens/CustomerDetail.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ScrollView,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { rootStackParamList } from '../navigation/AppNavigation';
import { Formatwithcomma } from '../utils/formatewithcomma';

type Props = {
  navigation: NativeStackNavigationProp<rootStackParamList, 'CustomerDetail'>;
  route: RouteProp<rootStackParamList, 'CustomerDetail'>;
};

const CustomerDetail: React.FC<Props> = ({ navigation, route }) => {
  const { customer } = route.params as { customer: any }; // Using `any` as requested

  // Safely extract values with fallbacks
  const name = customer.name || 'Unknown Customer';
  const contactNo = customer.contactNo;
  const address = customer.address || 'No address provided';
  const workDescription = customer.workDescription || 'No work description';
  const noOfDaysToVisit = customer.noOfDaysToVisit || 0;
  const date = customer.date
    ? new Date(customer.date).toLocaleDateString()
    : null;
  const status = customer.status || 'UNKNOWN';
  const createdAt = customer.createdAt
    ? new Date(customer.createdAt).toLocaleDateString()
    : 'N/A';

  // Format status for display
  const formattedStatus = status
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l: string) => l.toUpperCase());

  // Status color logic
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PAID':
        return '#27ae60';
      case 'INQUIRED':
        return '#3498db';
      case 'PENDING':
        return '#f39c12';
      case 'CANCELLED':
        return '#e74c3c';
      default:
        return '#95a5a6';
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <Text style={styles.customerName}>{name}</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(status) },
              ]}
            >
              <Text style={styles.statusText}>{formattedStatus}</Text>
            </View>
          </View>
          <Text style={styles.location}>
            <MaterialCommunityIcons name="map-marker" size={16} color="#666" />
            {'  '}
            {address}
          </Text>
        </View>

        {/* Contact Information Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact Information</Text>

          {/* Phone Number */}
          {contactNo ? (
            <TouchableOpacity
              style={styles.infoRow}
              onPress={async () => {
                const url = `tel:${contactNo}`;
                const supported = await Linking.canOpenURL(url);
                if (supported) {
                  await Linking.openURL(url);
                } else {
                  Alert.alert('Error', 'Cannot open phone dialer');
                }
              }}
            >
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                  name="phone"
                  size={22}
                  color="#2874b8"
                />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Phone Number</Text>
                <Text style={styles.infoValue}>{contactNo}</Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color="#ccc"
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                  name="phone"
                  size={22}
                  color="#95a5a6"
                />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Phone Number</Text>
                <Text style={[styles.infoValue, { color: '#95a5a6' }]}>
                  Not provided
                </Text>
              </View>
            </View>
          )}

          <View style={styles.divider} />

          {/* Address */}
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="home" size={22} color="#2874b8" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>{address}</Text>
            </View>
          </View>
        </View>

        {/* Inquiry Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Inquiry Details</Text>

          {/* Work Description */}
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name="text-box"
                size={22}
                color="#2874b8"
              />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Work Description</Text>
              <Text style={styles.infoValue}>{workDescription}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Days to Visit */}
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name="calendar-clock"
                size={22}
                color="#2874b8"
              />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Follow-up In</Text>
              <Text style={styles.infoValue}>
                {noOfDaysToVisit > 0
                  ? `${noOfDaysToVisit} day${noOfDaysToVisit > 1 ? 's' : ''}`
                  : 'No follow-up scheduled'}
              </Text>
            </View>
          </View>

          {date && (
            <>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons
                    name="calendar"
                    size={22}
                    color="#2874b8"
                  />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Inquiry Date</Text>
                  <Text style={styles.infoValue}>{date}</Text>
                </View>
              </View>
            </>
          )}

          <View style={styles.divider} />

          {/* Created At */}
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={22}
                color="#2874b8"
              />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Created On</Text>
              <Text style={styles.infoValue}>{createdAt}</Text>
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
            navigation.navigate('AddProject', { customer });
          }}
        >
          <MaterialCommunityIcons name="plus-circle" size={24} color="#fff" />
          <Text style={styles.addProjectButtonText}>Convert to Project</Text>
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
