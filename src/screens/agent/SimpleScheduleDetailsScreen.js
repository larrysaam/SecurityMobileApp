import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { COLORS, SIZES } from '../../constants';
import { useAuth } from '../../store/AuthContext';

const SimpleScheduleDetailsScreen = ({ route, navigation }) => {
  console.log('SimpleScheduleDetailsScreen loaded with route:', route);
  const { schedule } = route.params || {};
  const { apiService } = useAuth();
  console.log('Schedule data:', schedule);

  // Clock-in/out functionality
  const handleClockAction = (action) => {
    console.log('handleClockAction called with action:', action);

    // Add a small delay to prevent navigation interference
    setTimeout(() => {
      try {
        // Validate schedule and site information
        if (!schedule || !schedule.site) {
          console.log('Schedule or site information missing:', { schedule: !!schedule, site: !!schedule?.site });
          Alert.alert('Error', 'Schedule information is not available. Please try again.');
          return;
        }

        // Use Alert-based approach for clock-in/out
        const actionText = action === 'in' ? 'Clock Inn' : 'Clock Out';

        console.log('Showing alert for:', actionText);

        Alert.alert(
          actionText,
          `Choose your ${actionText.toLowerCase()} method for ${schedule.site.name}:`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'QR Code Scanner',
              onPress: () => {
                console.log('QR Code Scanner selected');
                handleQRCodeClockIn(action === 'in' ? 'clock-in' : 'clock-out');
              }
            },
            {
              text: 'GPS Location',
              onPress: () => {
                console.log('GPS Location selected');
                Alert.alert(
                  'GPS Clock-In',
                  'GPS clock-in will be available soon. Please use QR code for now.',
                  [{ text: 'OK' }]
                );
              }
            }
          ],
          { cancelable: true }
        );
      } catch (error) {
        console.error('Error in handleClockAction:', error);
        Alert.alert('Error', 'Unable to process clock action. Please try again.');
      }
    }, 100); // Small delay to prevent navigation conflicts
  };

  const handleQRCodeClockIn = async (action) => {
    console.log('QR Code clock-in started for action:', action);

    try {
      // For now, simulate QR code scanning with a simple input
      Alert.alert(
        'QR Code Scanner',
        `Ready to scan QR code for ${schedule.site.name}\n\nExpected QR Code: ${schedule.site.qrCode}`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Simulate Successful Scan',
            onPress: () => simulateQRScan(action)
          },
          {
            text: 'Simulate Wrong QR Code',
            onPress: () => {
              Alert.alert(
                'Invalid QR Code',
                `This QR code does not match the site code for ${schedule.site.name}.\n\nExpected: ${schedule.site.qrCode}\nScanned: WRONG_CODE`,
                [{ text: 'OK' }]
              );
            }
          }
        ]
      );

    } catch (error) {
      console.error('QR Code error:', error);
      Alert.alert('Error', 'Unable to process QR code. Please try again.');
    }
  };

  const simulateQRScan = async (action) => {
    console.log('Simulating QR scan for site:', schedule.site.qrCode, 'action:', action);

    try {
      // Get current location
      const location = await getCurrentLocation();

      const endpoint = action === 'clock-in' ? '/agent/clock-in' : '/agent/clock-out';

      const requestData = {
        scheduleId: schedule.id,
        siteId: schedule.site.id,
        method: 'qr',
        qrCode: schedule.site.qrCode, // Use the site's QR code
        location: location,
        timestamp: new Date().toISOString(),
      };

      console.log('Sending clock action request:', requestData);

      const response = await apiService.request(endpoint, {
        method: 'POST',
        data: requestData,
      });

      if (response.success) {
        const actionText = action === 'clock-in' ? 'clocked in at' : 'clocked out from';

        // Show success message
        Alert.alert(
          'Success!',
          `Successfully ${actionText} ${schedule.site.name}!\n\nTime: ${new Date().toLocaleTimeString()}\nLocation: ${location ? 'GPS verified' : 'Location pending'}`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate back to dashboard to refresh data
                navigation.goBack();
              },
            },
          ]
        );
      } else {
        throw new Error(response.message || 'Clock action failed');
      }
    } catch (error) {
      console.error('Clock action API error:', error);
      Alert.alert('Clock Action Failed', 'Failed to process clock action. Please try again.');
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
        return null;
      }

      const location = await Location.getCurrentPositionAsync({});
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
      };
    } catch (error) {
      console.error('Location error:', error);
      return null;
    }
  };

  if (!schedule) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.WHITE} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Schedule Details</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No schedule data available</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Schedule Details</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Schedule Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Date:</Text>
              <Text style={styles.value}>{schedule.formattedDate || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Time:</Text>
              <Text style={styles.value}>
                {schedule.startTime || 'N/A'} - {schedule.endTime || 'N/A'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Status:</Text>
              <Text style={[styles.value, styles.status]}>
                {schedule.scheduleStatus || 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* Site Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Site Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Site Name:</Text>
              <Text style={styles.value}>{schedule.site?.name || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Address:</Text>
              <Text style={styles.value}>{schedule.site?.address || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Contact:</Text>
              <Text style={styles.value}>{schedule.site?.contactPhone || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Clock Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.clockInButton]}
              onPress={() => {
                console.log('Clock Inn button pressed');

                // First show a simple test alert to verify button works
                Alert.alert(
                  'Button Test',
                  'Clock Inn button was pressed! Do you want to proceed with clock-in?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Yes, Clock Inn',
                      onPress: () => {
                        console.log('Proceeding with clock action');
                        handleClockAction('in');
                      }
                    }
                  ]
                );
              }}
            >
              <Ionicons name="log-in" size={20} color={COLORS.WHITE} />
              <Text style={styles.actionButtonText}>Clock Inn</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.clockOutButton]}
              onPress={() => {
                console.log('Clock Out button pressed');
                handleClockAction('out');
              }}
            >
              <Ionicons name="log-out" size={20} color={COLORS.WHITE} />
              <Text style={styles.actionButtonText}>Clock Outt</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.GRAY[50],
  },
  header: {
    backgroundColor: COLORS.PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.GRAY[800],
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 8,
    padding: 16,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY[200],
  },
  label: {
    fontSize: 14,
    color: COLORS.GRAY[600],
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: COLORS.GRAY[800],
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  status: {
    textTransform: 'capitalize',
    color: COLORS.PRIMARY,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  clockInButton: {
    backgroundColor: COLORS.SUCCESS,
  },
  clockOutButton: {
    backgroundColor: COLORS.SECONDARY,
  },
  actionButtonText: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: COLORS.GRAY[600],
  },
});

export default SimpleScheduleDetailsScreen;
