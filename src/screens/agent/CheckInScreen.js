import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { COLORS, SIZES } from '../../constants';
import { ApiService } from '../../services/apiService';

const CheckInScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState(null);
  const [shiftStatus, setShiftStatus] = useState('off-duty');
  const [location, setLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState(false);

  useEffect(() => {
    loadTrackingData();
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');

      if (status === 'granted') {
        getCurrentLocation();
      } else {
        Alert.alert(
          'Location Permission Required',
          'Please enable location access to use clock-in functionality.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Location.requestForegroundPermissionsAsync() }
          ]
        );
      }
    } catch (error) {
      console.error('Location permission error:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(location);
    } catch (error) {
      console.error('Get location error:', error);
      Alert.alert('Error', 'Failed to get current location');
    }
  };

  const loadTrackingData = async () => {
    try {
      setLoading(true);

      // Get current schedule and shift status
      const [scheduleResponse, statusResponse] = await Promise.all([
        ApiService.getTodaySchedule(),
        ApiService.getAgentShiftStatus()
      ]);

      if (scheduleResponse.success) {
        setCurrentSchedule(scheduleResponse.data);
      }

      if (statusResponse.success) {
        setShiftStatus(statusResponse.data.status || 'off-duty');
      }
    } catch (error) {
      console.error('Tracking data loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTrackingData();
    await getCurrentLocation();
    setRefreshing(false);
  };

  const handleGPSClockIn = () => {
    if (!locationPermission) {
      Alert.alert('Location Required', 'Please enable location access first.');
      return;
    }

    if (!currentSchedule) {
      Alert.alert('No Schedule', 'You have no scheduled shift for today.');
      return;
    }

    navigation.navigate('GPSClockIn', {
      scheduleId: currentSchedule.id,
      action: 'clock-in',
      site: currentSchedule.site,
      onSuccess: loadTrackingData
    });
  };

  const handleQRClockIn = () => {
    if (!currentSchedule) {
      Alert.alert('No Schedule', 'You have no scheduled shift for today.');
      return;
    }

    navigation.navigate('QRClockIn', {
      scheduleId: currentSchedule.id,
      action: 'clock-in',
      site: currentSchedule.site,
      onSuccess: loadTrackingData
    });
  };

  const handleClockOut = () => {
    if (!currentSchedule) {
      Alert.alert('No Active Shift', 'You are not currently clocked in.');
      return;
    }

    Alert.alert(
      'Clock Out',
      'Are you sure you want to clock out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clock Out', onPress: performClockOut }
      ]
    );
  };

  const performClockOut = async () => {
    try {
      setLoading(true);

      const response = await ApiService.clockOut({
        scheduleId: currentSchedule.id,
        location: location?.coords,
        timestamp: new Date().toISOString()
      });

      if (response.success) {
        Alert.alert('Success', 'Successfully clocked out!');
        await loadTrackingData();
      } else {
        Alert.alert('Error', response.message || 'Failed to clock out');
      }
    } catch (error) {
      console.error('Clock out error:', error);
      Alert.alert('Error', 'Failed to clock out');
    } finally {
      setLoading(false);
    }
  };

  const getShiftStatusInfo = () => {
    switch (shiftStatus) {
      case 'on-duty':
        return {
          status: 'On Duty',
          color: COLORS.SUCCESS,
          icon: 'checkmark-circle',
          description: 'You are currently on duty'
        };
      case 'break':
        return {
          status: 'On Break',
          color: COLORS.WARNING,
          icon: 'pause-circle',
          description: 'You are currently on break'
        };
      case 'off-duty':
      default:
        return {
          status: 'Off Duty',
          color: COLORS.GRAY[500],
          icon: 'time',
          description: 'You are currently off duty'
        };
    }
  };

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

  const statusInfo = getShiftStatusInfo();

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Loading tracking data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>Current Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
              <Ionicons name={statusInfo.icon} size={16} color={COLORS.WHITE} />
              <Text style={styles.statusBadgeText}>{statusInfo.status}</Text>
            </View>
          </View>
          <Text style={styles.statusDescription}>{statusInfo.description}</Text>

          {shiftStatus === 'on-duty' && (
            <View style={styles.activeShiftInfo}>
              <Ionicons name="time" size={16} color={COLORS.PRIMARY} />
              <Text style={styles.activeShiftText}>
                Active since {currentSchedule?.clockInTime ? formatTime(currentSchedule.clockInTime) : 'Unknown'}
              </Text>
            </View>
          )}
        </View>

        {/* Current Schedule */}
        {currentSchedule ? (
          <View style={styles.scheduleCard}>
            <Text style={styles.cardTitle}>Today's Schedule</Text>
            <View style={styles.scheduleInfo}>
              <View style={styles.siteInfo}>
                <Text style={styles.siteName}>{currentSchedule.site?.name || 'Unknown Site'}</Text>
                <Text style={styles.siteAddress}>{currentSchedule.site?.address || 'No address'}</Text>
              </View>
              <View style={styles.timeInfo}>
                <View style={styles.timeRow}>
                  <Ionicons name="time-outline" size={16} color={COLORS.GRAY[600]} />
                  <Text style={styles.timeLabel}>Start:</Text>
                  <Text style={styles.timeValue}>{formatTime(currentSchedule.startTime)}</Text>
                </View>
                <View style={styles.timeRow}>
                  <Ionicons name="time-outline" size={16} color={COLORS.GRAY[600]} />
                  <Text style={styles.timeLabel}>End:</Text>
                  <Text style={styles.timeValue}>{formatTime(currentSchedule.endTime)}</Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.noScheduleCard}>
            <Ionicons name="calendar-outline" size={48} color={COLORS.GRAY[400]} />
            <Text style={styles.noScheduleTitle}>No Schedule Today</Text>
            <Text style={styles.noScheduleText}>You don't have any scheduled shifts for today</Text>
          </View>
        )}

        {/* Clock In/Out Actions */}
        <View style={styles.actionsCard}>
          <Text style={styles.cardTitle}>Clock In/Out Options</Text>

          {shiftStatus === 'off-duty' ? (
            <View style={styles.clockInOptions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.gpsButton]}
                onPress={handleGPSClockIn}
                disabled={!currentSchedule}
              >
                <Ionicons name="location" size={24} color={COLORS.WHITE} />
                <Text style={styles.actionButtonText}>GPS Clock In</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.qrButton]}
                onPress={handleQRClockIn}
                disabled={!currentSchedule}
              >
                <Ionicons name="qr-code" size={24} color={COLORS.WHITE} />
                <Text style={styles.actionButtonText}>QR Code Clock In</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.clockOutButton]}
              onPress={handleClockOut}
            >
              <Ionicons name="exit" size={24} color={COLORS.WHITE} />
              <Text style={styles.actionButtonText}>Clock Out</Text>
            </TouchableOpacity>
          )}

          {!locationPermission && (
            <View style={styles.permissionWarning}>
              <Ionicons name="warning" size={20} color={COLORS.WARNING} />
              <Text style={styles.permissionWarningText}>
                Location permission is required for clock-in functionality
              </Text>
            </View>
          )}
        </View>

        {/* Location Info */}
        {location && (
          <View style={styles.locationCard}>
            <Text style={styles.cardTitle}>Current Location</Text>
            <View style={styles.locationInfo}>
              <Ionicons name="location" size={20} color={COLORS.PRIMARY} />
              <Text style={styles.locationText}>
                Lat: {location.coords.latitude.toFixed(6)}, Long: {location.coords.longitude.toFixed(6)}
              </Text>
            </View>
            <Text style={styles.locationAccuracy}>
              Accuracy: ±{location.coords.accuracy.toFixed(0)}m
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.GRAY[600],
  },
  scrollView: {
    flex: 1,
  },
  statusCard: {
    backgroundColor: COLORS.WHITE,
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.WHITE,
    marginLeft: 4,
  },
  statusDescription: {
    fontSize: 14,
    color: COLORS.GRAY[600],
    marginBottom: 8,
  },
  activeShiftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.PRIMARY}10`,
    padding: 8,
    borderRadius: 8,
  },
  activeShiftText: {
    fontSize: 12,
    color: COLORS.PRIMARY,
    marginLeft: 6,
    fontWeight: '500',
  },
  scheduleCard: {
    backgroundColor: COLORS.WHITE,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT,
    marginBottom: 16,
  },
  scheduleInfo: {
    gap: 12,
  },
  siteInfo: {
    marginBottom: 8,
  },
  siteName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT,
    marginBottom: 4,
  },
  siteAddress: {
    fontSize: 14,
    color: COLORS.GRAY[600],
  },
  timeInfo: {
    gap: 8,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeLabel: {
    fontSize: 14,
    color: COLORS.GRAY[600],
    minWidth: 40,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.TEXT,
  },
  noScheduleCard: {
    backgroundColor: COLORS.WHITE,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noScheduleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.GRAY[600],
    marginTop: 12,
    marginBottom: 8,
  },
  noScheduleText: {
    fontSize: 14,
    color: COLORS.GRAY[500],
    textAlign: 'center',
  },
  actionsCard: {
    backgroundColor: COLORS.WHITE,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  clockInOptions: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  gpsButton: {
    backgroundColor: COLORS.SUCCESS,
  },
  qrButton: {
    backgroundColor: COLORS.INFO,
  },
  clockOutButton: {
    backgroundColor: COLORS.ERROR,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.WHITE,
  },
  permissionWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.WARNING}15`,
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  permissionWarningText: {
    fontSize: 12,
    color: COLORS.WARNING,
    flex: 1,
  },
  locationCard: {
    backgroundColor: COLORS.WHITE,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    color: COLORS.TEXT,
    fontFamily: 'monospace',
  },
  locationAccuracy: {
    fontSize: 11,
    color: COLORS.GRAY[500],
  },
});

export default CheckInScreen;
