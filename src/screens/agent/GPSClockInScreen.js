import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { COLORS, SIZES } from '../../constants';
import apiService from '../../services/apiService';

const GPSClockInScreen = ({ route, navigation }) => {
  const { scheduleId, siteLocation, action = 'clock-in' } = route.params || {};
  
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState(null);
  const [distance, setDistance] = useState(null);

  useEffect(() => {
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
          'Permission Required',
          'Location permission is required for GPS clock-in verification.',
          [
            { text: 'Cancel', onPress: () => navigation.goBack() },
            { text: 'Retry', onPress: requestLocationPermission },
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      Alert.alert('Error', 'Failed to request location permission.');
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 15000,
      });

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
      };

      setCurrentLocation(coords);

      // Calculate distance to site if site location is provided
      if (siteLocation) {
        const calculatedDistance = calculateDistance(
          coords.latitude,
          coords.longitude,
          siteLocation.latitude,
          siteLocation.longitude
        );
        setDistance(calculatedDistance);
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Please ensure GPS is enabled and try again.',
        [
          { text: 'Cancel', onPress: () => navigation.goBack() },
          { text: 'Retry', onPress: getCurrentLocation },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const isWithinGeofence = () => {
    if (!distance || !siteLocation?.geofenceRadius) return false;
    return distance <= siteLocation.geofenceRadius;
  };

  const handleClockAction = async () => {
    if (!currentLocation) {
      Alert.alert('Error', 'Current location not available. Please try again.');
      return;
    }

    // Check geofence if site location is provided
    if (siteLocation && !isWithinGeofence()) {
      Alert.alert(
        'Location Verification Failed',
        `You must be within ${siteLocation.geofenceRadius}m of the site to ${action}. Current distance: ${Math.round(distance)}m`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Try Anyway', onPress: () => performClockAction() },
        ]
      );
      return;
    }

    performClockAction();
  };

  const performClockAction = async () => {
    try {
      setLoading(true);

      const endpoint = action === 'clock-in' ? '/agent/clock-in' : '/agent/clock-out';
      
      const requestData = {
        scheduleId: scheduleId,
        siteId: siteLocation?.id,
        method: 'gps',
        location: currentLocation,
        timestamp: new Date().toISOString(),
        distance: distance,
      };

      const response = await apiService.request(endpoint, {
        method: 'POST',
        data: requestData,
      });

      if (response.success) {
        Alert.alert(
          'Success',
          `Successfully ${action === 'clock-in' ? 'clocked in' : 'clocked out'}!`,
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.goBack();
                // Call refresh callback if provided
                if (route.params?.onSuccess) {
                  route.params.onSuccess();
                }
              },
            },
          ]
        );
      } else {
        throw new Error(response.message || 'Clock action failed');
      }
    } catch (error) {
      console.error('Clock action error:', error);
      Alert.alert('Error', 'Failed to process clock action. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getLocationStatusColor = () => {
    if (!distance || !siteLocation) return COLORS.GRAY[400];
    return isWithinGeofence() ? COLORS.SUCCESS : COLORS.SECONDARY;
  };

  const getLocationStatusText = () => {
    if (!distance || !siteLocation) return 'Location acquired';
    return isWithinGeofence() ? 'Within site area' : 'Outside site area';
  };

  if (locationPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Requesting location permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (locationPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="location-off" size={64} color={COLORS.GRAY[400]} />
          <Text style={styles.errorText}>Location permission denied</Text>
          <Text style={styles.errorSubText}>
            Please enable location access in your device settings for GPS clock-in.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={requestLocationPermission}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {action === 'clock-in' ? 'Clock In' : 'Clock Out'} - GPS
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Location Status */}
        <View style={styles.locationCard}>
          <View style={styles.locationHeader}>
            <Ionicons 
              name="location" 
              size={24} 
              color={getLocationStatusColor()} 
            />
            <Text style={[styles.locationStatus, { color: getLocationStatusColor() }]}>
              {getLocationStatusText()}
            </Text>
          </View>

          {currentLocation && (
            <View style={styles.locationDetails}>
              <Text style={styles.locationText}>
                Latitude: {currentLocation.latitude.toFixed(6)}
              </Text>
              <Text style={styles.locationText}>
                Longitude: {currentLocation.longitude.toFixed(6)}
              </Text>
              <Text style={styles.locationText}>
                Accuracy: ±{Math.round(currentLocation.accuracy)}m
              </Text>
              {distance !== null && (
                <Text style={styles.locationText}>
                  Distance to site: {Math.round(distance)}m
                </Text>
              )}
            </View>
          )}

          {loading && !currentLocation && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={COLORS.PRIMARY} />
              <Text style={styles.loadingText}>Getting your location...</Text>
            </View>
          )}
        </View>

        {/* Site Information */}
        {siteLocation && (
          <View style={styles.siteCard}>
            <Text style={styles.siteTitle}>Site Information</Text>
            <Text style={styles.siteText}>Name: {siteLocation.name}</Text>
            <Text style={styles.siteText}>Address: {siteLocation.address}</Text>
            <Text style={styles.siteText}>
              Geofence Radius: {siteLocation.geofenceRadius}m
            </Text>
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>GPS Verification</Text>
          <Text style={styles.instructionsText}>
            Your location will be verified using GPS coordinates. 
            {siteLocation && ` You must be within ${siteLocation.geofenceRadius}m of the site to ${action}.`}
          </Text>
        </View>
      </View>

      {/* Action Button */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            (!currentLocation || loading) && styles.actionButtonDisabled,
          ]}
          onPress={handleClockAction}
          disabled={!currentLocation || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.WHITE} />
          ) : (
            <>
              <Ionicons 
                name={action === 'clock-in' ? 'time' : 'checkmark-circle'} 
                size={20} 
                color={COLORS.WHITE} 
              />
              <Text style={styles.actionButtonText}>
                {action === 'clock-in' ? 'Clock In' : 'Clock Out'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.refreshButton} onPress={getCurrentLocation}>
          <Ionicons name="refresh" size={20} color={COLORS.PRIMARY} />
          <Text style={styles.refreshButtonText}>Refresh Location</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.GRAY[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.PRIMARY,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  locationCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationStatus: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  locationDetails: {
    paddingLeft: 32,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.GRAY[600],
    marginBottom: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 32,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.GRAY[600],
    marginLeft: 8,
  },
  siteCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  siteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.GRAY[800],
    marginBottom: 8,
  },
  siteText: {
    fontSize: 14,
    color: COLORS.GRAY[600],
    marginBottom: 4,
  },
  instructionsCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.GRAY[800],
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: COLORS.GRAY[600],
    lineHeight: 20,
  },
  actionContainer: {
    padding: 16,
    backgroundColor: COLORS.WHITE,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY[200],
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionButtonDisabled: {
    backgroundColor: COLORS.GRAY[400],
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.WHITE,
    marginLeft: 8,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  refreshButtonText: {
    fontSize: 14,
    color: COLORS.PRIMARY,
    fontWeight: '600',
    marginLeft: 8,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.GRAY[800],
    marginTop: 16,
    textAlign: 'center',
  },
  errorSubText: {
    fontSize: 14,
    color: COLORS.GRAY[600],
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    color: COLORS.WHITE,
    fontWeight: '600',
  },
});

export default GPSClockInScreen;
