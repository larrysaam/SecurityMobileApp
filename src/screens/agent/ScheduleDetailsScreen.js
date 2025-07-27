import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, Camera } from 'expo-camera';
import * as Location from 'expo-location';
import { COLORS, SIZES } from '../../constants';
import { useAuth } from '../../store/AuthContext';

const ScheduleDetailsScreen = ({ route, navigation }) => {
  const { schedule: initialSchedule, onClockAction } = route.params;
  const { apiService } = useAuth();
  const [schedule, setSchedule] = useState(initialSchedule);



  useEffect(() => {
    // Refresh schedule details when screen loads
    refreshScheduleDetails();
  }, []);

  const refreshScheduleDetails = async () => {
    try {
      const response = await apiService.request(`/agent/schedule/${schedule.id}`);
      if (response.success) {
        setSchedule(response.data);
      }
    } catch (error) {
      console.error('Refresh schedule error:', error);
    }
  };

  const handleClockAction = (action) => {
    console.log('handleClockAction called with action:', action);

    // Validate schedule and site information
    if (!schedule || !schedule.site) {
      console.log('Schedule or site information missing:', { schedule: !!schedule, site: !!schedule?.site });
      Alert.alert('Error', 'Schedule information is not available. Please try again.');
      return;
    }

    // Use Alert-based approach for clock-in/out
    const actionText = action === 'in' ? 'Clock In' : 'Clock Out';

    Alert.alert(
      actionText,
      `Choose your ${actionText.toLowerCase()} method for ${schedule.site.name}:`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'QR Code Scanner',
          onPress: () => handleQRCodeClockIn(action === 'in' ? 'clock-in' : 'clock-out')
        },
        {
          text: 'GPS Location',
          onPress: () => {
            Alert.alert(
              'GPS Clock-In',
              'GPS clock-in will be available soon. Please use QR code for now.',
              [{ text: 'OK' }]
            );
          }
        }
      ]
    );
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
                // Refresh schedule details
                refreshScheduleDetails();
                if (onClockAction) onClockAction();
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





  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return COLORS.SUCCESS;
      case 'in-progress': return COLORS.PRIMARY;
      case 'pending': return COLORS.WARNING;
      case 'missed': return COLORS.ERROR;
      default: return COLORS.GRAY[400];
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'COMPLETED';
      case 'in-progress': return 'IN PROGRESS';
      case 'pending': return 'PENDING';
      case 'missed': return 'MISSED';
      case 'scheduled': return 'SCHEDULED';
      default: return 'UNKNOWN';
    }
  };

  // Calculate if agent can clock in
  const canClockIn = () => {
    if (!schedule) {
      console.log('canClockIn: No schedule');
      return false;
    }

    // Can clock in if:
    // 1. Schedule is scheduled or pending
    // 2. No clock-in time recorded yet
    // 3. Current time is within reasonable range of start time
    const hasClockInTime = schedule.clockInTime || schedule.clockedIn;
    const status = schedule.status;

    console.log('canClockIn debug:', {
      status: status,
      hasClockInTime: hasClockInTime,
      clockInTime: schedule.clockInTime,
      clockedIn: schedule.clockedIn,
      canClock: (status === 'scheduled' || status === 'pending') && !hasClockInTime
    });

    return (status === 'scheduled' || status === 'pending') && !hasClockInTime;
  };

  // Calculate if agent can clock out
  const canClockOut = () => {
    if (!schedule) return false;

    // Can clock out if:
    // 1. Already clocked in
    // 2. No clock-out time recorded yet
    // 3. Schedule is in progress
    const hasClockInTime = schedule.clockInTime || schedule.clockedIn;
    const hasClockOutTime = schedule.clockOutTime || schedule.clockedOut;
    const status = schedule.status;

    return hasClockInTime && !hasClockOutTime && (status === 'in-progress' || status === 'scheduled');
  };

  // Format time for display
  const formatTime = (timeString) => {
    if (!timeString) return '';
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return timeString;
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Calculate duration between two times
  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 'N/A';
    try {
      const start = new Date(startTime);
      const end = new Date(endTime);
      const diffMs = end - start;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      if (diffHours > 0) {
        return `${diffHours}h ${diffMinutes}m`;
      } else {
        return `${diffMinutes}m`;
      }
    } catch (error) {
      return 'N/A';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Schedule Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Schedule Status */}
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(schedule.scheduleStatus) }
          ]}>
            <Text style={styles.statusText}>{getStatusText(schedule.scheduleStatus)}</Text>
          </View>
          <Text style={styles.scheduleDate}>{schedule.formattedDate}</Text>
          <Text style={styles.scheduleTime}>
            {schedule.startTime} - {schedule.endTime}
          </Text>
        </View>

        {/* Site Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Site Information</Text>
          <View style={styles.siteCard}>
            <Text style={styles.siteName}>{schedule.site.name}</Text>
            <Text style={styles.siteAddress}>{schedule.site.address}</Text>
            
            {schedule.site.description && (
              <Text style={styles.siteDescription}>{schedule.site.description}</Text>
            )}

            <View style={styles.contactRow}>
              <Ionicons name="person" size={16} color={COLORS.GRAY[600]} />
              <Text style={styles.contactText}>
                {schedule.site.contactPerson || 'No contact person'}
              </Text>
            </View>

            {schedule.site.contactPhone && (
              <View style={styles.contactRow}>
                <Ionicons name="call" size={16} color={COLORS.GRAY[600]} />
                <Text style={styles.contactText}>{schedule.site.contactPhone}</Text>
              </View>
            )}

            {schedule.site.accessInstructions && (
              <View style={styles.instructionsContainer}>
                <Text style={styles.instructionsTitle}>Access Instructions:</Text>
                <Text style={styles.instructionsText}>{schedule.site.accessInstructions}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Clock Information */}
        {(schedule.clockInTime || schedule.clockOutTime) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Clock Records</Text>
            <View style={styles.clockCard}>
              {(schedule.clockInTime || schedule.clockedIn) && (
                <View style={styles.clockRow}>
                  <Ionicons name="log-in" size={20} color={COLORS.SUCCESS} />
                  <View style={styles.clockInfo}>
                    <Text style={styles.clockLabel}>Clocked In</Text>
                    <Text style={styles.clockTime}>
                      {formatTime(schedule.clockInTime || schedule.clockedIn)}
                    </Text>
                    <Text style={styles.clockDate}>
                      {formatDate(schedule.clockInTime || schedule.clockedIn)}
                    </Text>
                  </View>
                </View>
              )}

              {(schedule.clockOutTime || schedule.clockedOut) && (
                <View style={styles.clockRow}>
                  <Ionicons name="log-out" size={20} color={COLORS.ERROR} />
                  <View style={styles.clockInfo}>
                    <Text style={styles.clockLabel}>Clocked Out</Text>
                    <Text style={styles.clockTime}>
                      {formatTime(schedule.clockOutTime || schedule.clockedOut)}
                    </Text>
                    <Text style={styles.clockDate}>
                      {formatDate(schedule.clockOutTime || schedule.clockedOut)}
                    </Text>
                  </View>
                </View>
              )}

              {(schedule.clockInTime || schedule.clockedIn) && (schedule.clockOutTime || schedule.clockedOut) && (
                <View style={styles.durationRow}>
                  <Ionicons name="time" size={16} color={COLORS.PRIMARY} />
                  <Text style={styles.durationText}>
                    Duration: {calculateDuration(
                      schedule.clockInTime || schedule.clockedIn,
                      schedule.clockOutTime || schedule.clockedOut
                    )}
                  </Text>
                </View>
              )}

              {schedule.workedHours && (
                <View style={styles.hoursWorked}>
                  <Text style={styles.hoursText}>
                    Total Hours: {schedule.workedHours}h
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        
      </ScrollView>



    </View>
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
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: SIZES.PADDING,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  scrollView: {
    flex: 1,
  },
  statusContainer: {
    backgroundColor: COLORS.WHITE,
    padding: SIZES.PADDING,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY[200],
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  scheduleDate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.DARK,
    marginBottom: 4,
  },
  scheduleTime: {
    fontSize: 16,
    color: COLORS.GRAY[600],
  },
  section: {
    backgroundColor: COLORS.WHITE,
    marginTop: 12,
    padding: SIZES.PADDING,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.DARK,
    marginBottom: 12,
  },
  siteCard: {
    backgroundColor: COLORS.GRAY[50],
    borderRadius: SIZES.BORDER_RADIUS,
    padding: SIZES.PADDING,
  },
  siteName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.DARK,
    marginBottom: 4,
  },
  siteAddress: {
    fontSize: 16,
    color: COLORS.GRAY[600],
    marginBottom: 12,
  },
  siteDescription: {
    fontSize: 14,
    color: COLORS.GRAY[700],
    marginBottom: 12,
    lineHeight: 20,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: COLORS.GRAY[700],
    marginLeft: 8,
  },
  instructionsContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: COLORS.INFO_LIGHT,
    borderRadius: SIZES.BORDER_RADIUS,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.INFO,
    marginBottom: 4,
  },
  instructionsText: {
    fontSize: 14,
    color: COLORS.GRAY[700],
    lineHeight: 18,
  },
  clockCard: {
    backgroundColor: COLORS.GRAY[50],
    borderRadius: SIZES.BORDER_RADIUS,
    padding: SIZES.PADDING,
  },
  clockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  clockInfo: {
    marginLeft: 12,
  },
  clockLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.DARK,
  },
  clockTime: {
    fontSize: 16,
    color: COLORS.GRAY[600],
  },
  hoursWorked: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY[200],
    alignItems: 'center',
  },
  hoursText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  actionsContainer: {
    padding: SIZES.PADDING,
    paddingBottom: 100,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: SIZES.BORDER_RADIUS,
    marginBottom: 12,
  },
  clockInButton: {
    backgroundColor: COLORS.SUCCESS,
  },
  clockOutButton: {
    backgroundColor: COLORS.ERROR,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.BORDER_RADIUS,
    padding: SIZES.PADDING,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.DARK,
    textAlign: 'center',
    marginBottom: 20,
  },
  methodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.GRAY[300],
    borderRadius: SIZES.BORDER_RADIUS,
    marginBottom: 12,
  },
  methodText: {
    fontSize: 16,
    color: COLORS.DARK,
    marginLeft: 12,
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: COLORS.GRAY[600],
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.GRAY[600],
    marginTop: 8,
  },
  // New styles for enhanced clock functionality
  clockDate: {
    fontSize: 12,
    color: COLORS.GRAY[500],
    marginTop: 2,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY[200],
  },
  durationText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.PRIMARY,
    marginLeft: 8,
  },
  statusMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: COLORS.GRAY[50],
    borderRadius: SIZES.BORDER_RADIUS,
    marginTop: 10,
  },
  statusMessageText: {
    fontSize: 14,
    color: COLORS.GRAY[600],
    marginLeft: 12,
    textAlign: 'center',
    flex: 1,
  },
  // QR Code Modal Styles
  qrModalContainer: {
    flex: 1,
    backgroundColor: COLORS.BLACK,
  },
  qrModalHeader: {
    backgroundColor: COLORS.PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  qrCloseButton: {
    padding: 8,
  },
  qrModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  qrLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BLACK,
  },
  qrLoadingText: {
    fontSize: 16,
    color: COLORS.WHITE,
    marginTop: 16,
  },
  qrErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BLACK,
    padding: 20,
  },
  qrErrorText: {
    fontSize: 16,
    color: COLORS.WHITE,
    marginTop: 16,
    textAlign: 'center',
  },
  qrRetryButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  qrRetryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.WHITE,
  },
  qrScannerContainer: {
    flex: 1,
  },
  qrCamera: {
    flex: 1,
  },
  qrOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrScanArea: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  qrCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: COLORS.WHITE,
  },
  qrCornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  qrCornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  qrCornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  qrCornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  qrLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrProcessingText: {
    fontSize: 16,
    color: COLORS.WHITE,
    marginTop: 16,
  },
  qrInstructions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.WHITE,
    padding: 20,
    alignItems: 'center',
  },
  qrInstructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.GRAY[800],
    marginBottom: 8,
  },
  qrInstructionsText: {
    fontSize: 14,
    color: COLORS.GRAY[600],
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  qrExpectedCode: {
    fontSize: 12,
    color: COLORS.GRAY[500],
    textAlign: 'center',
    fontFamily: 'monospace',
    backgroundColor: COLORS.GRAY[100],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 16,
  },
  qrRescanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.GRAY[100],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  qrRescanButtonText: {
    fontSize: 14,
    color: COLORS.PRIMARY,
    marginLeft: 8,
    fontWeight: '600',
  },
  // Clock-In Overlay Styles
  clockInOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  clockInModal: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    margin: 20,
    maxWidth: 400,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  clockInHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY[200],
  },
  clockInTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.GRAY[800],
  },
  closeButton: {
    padding: 4,
  },
  clockInContent: {
    padding: 20,
  },
  siteNameText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.PRIMARY,
    textAlign: 'center',
    marginBottom: 8,
  },
  siteAddressText: {
    fontSize: 14,
    color: COLORS.GRAY[600],
    textAlign: 'center',
    marginBottom: 24,
  },
  methodsContainer: {
    gap: 16,
  },
  methodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  qrMethodButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  gpsMethodButton: {
    backgroundColor: COLORS.SUCCESS,
  },
  methodButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.WHITE,
    marginLeft: 16,
    flex: 1,
  },
  methodSubText: {
    fontSize: 12,
    color: COLORS.WHITE,
    opacity: 0.8,
    marginLeft: 16,
  },
});

export default ScheduleDetailsScreen;
