import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../store/AuthContext';
import { useApp } from '../../store/AppContext';
import { COLORS, SIZES } from '../../constants';
import AgentBottomNavbar from '../../components/AgentBottomNavbar';

const ClockInGPSScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { currentLocation, updateCurrentLocation } = useApp();
  const [loading, setLoading] = useState(false);
  const [clockedIn, setClockedIn] = useState(false);
  const [currentShift, setCurrentShift] = useState(null);

  useEffect(() => {
    loadLocationData();
    // Mock current shift data
    setCurrentShift({
      siteName: 'Site Alpha',
      siteAddress: '123 Main Street, Downtown',
      startTime: '08:00',
      endTime: '16:00',
      siteCoordinates: {
        latitude: 48.8566,
        longitude: 2.3522,
      }
    });
  }, []);

  const loadLocationData = async () => {
    try {
      await updateCurrentLocation();
    } catch (error) {
      console.error('Error loading location:', error);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const isWithinRange = () => {
    if (!currentLocation || !currentShift) return false;
    
    const distance = calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      currentShift.siteCoordinates.latitude,
      currentShift.siteCoordinates.longitude
    );
    
    return distance <= 100; // 100 meters range
  };

  const handleClockAction = async () => {
    if (!currentShift) {
      Alert.alert('No Shift', 'You have no scheduled shift currently.');
      return;
    }

    if (!isWithinRange()) {
      Alert.alert(
        'Location Error',
        'You must be within 100 meters of the site to clock in/out.',
        [
          { text: 'Refresh Location', onPress: loadLocationData },
          { text: 'OK' }
        ]
      );
      return;
    }

    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setClockedIn(!clockedIn);
      
      Alert.alert(
        'Success',
        `Successfully ${clockedIn ? 'clocked out' : 'clocked in'} at ${currentShift.siteName}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to process clock action. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getLocationStatus = () => {
    if (!currentLocation) {
      return {
        status: 'Getting location...',
        color: COLORS.WARNING,
        icon: 'location-outline',
      };
    }

    if (isWithinRange()) {
      return {
        status: 'Within range',
        color: COLORS.SUCCESS,
        icon: 'checkmark-circle',
      };
    }

    return {
      status: 'Too far from site',
      color: COLORS.SECONDARY,
      icon: 'warning',
    };
  };

  const locationStatus = getLocationStatus();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.DARK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>GPS Clock In/Out</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Current Location Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="location" size={24} color={COLORS.PRIMARY} />
            <Text style={styles.cardTitle}>Current Location</Text>
          </View>
          
          {currentLocation ? (
            <>
              <Text style={styles.locationText}>
                📍 {currentLocation.address}
              </Text>
              <Text style={styles.coordinatesText}>
                {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
              </Text>
            </>
          ) : (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={COLORS.PRIMARY} />
              <Text style={styles.loadingText}>Getting your location...</Text>
            </View>
          )}
        </View>

        {/* Site Information Card */}
        {currentShift && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="business" size={24} color={COLORS.INFO} />
              <Text style={styles.cardTitle}>Assigned Site</Text>
            </View>
            
            <Text style={styles.siteName}>{currentShift.siteName}</Text>
            <Text style={styles.siteAddress}>{currentShift.siteAddress}</Text>
            <Text style={styles.shiftTime}>
              Shift: {currentShift.startTime} - {currentShift.endTime}
            </Text>
          </View>
        )}

        {/* Location Status */}
        <View style={[styles.statusCard, { borderColor: locationStatus.color }]}>
          <Ionicons name={locationStatus.icon} size={32} color={locationStatus.color} />
          <Text style={[styles.statusText, { color: locationStatus.color }]}>
            {locationStatus.status}
          </Text>
        </View>

        {/* Clock Action Button */}
        <TouchableOpacity
          style={[
            styles.clockButton,
            {
              backgroundColor: clockedIn ? COLORS.SECONDARY : COLORS.SUCCESS,
              opacity: (!isWithinRange() || loading) ? 0.6 : 1,
            }
          ]}
          onPress={handleClockAction}
          disabled={!isWithinRange() || loading}
        >
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.WHITE} />
          ) : (
            <>
              <Ionicons
                name={clockedIn ? 'log-out' : 'log-in'}
                size={32}
                color={COLORS.WHITE}
              />
              <Text style={styles.clockButtonText}>
                {clockedIn ? 'Clock Out' : 'Clock In'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionTitle}>Instructions:</Text>
          <Text style={styles.instructionText}>
            • You must be within 100 meters of the assigned site
          </Text>
          <Text style={styles.instructionText}>
            • Ensure GPS is enabled on your device
          </Text>
          <Text style={styles.instructionText}>
            • Clock in at the start of your shift
          </Text>
          <Text style={styles.instructionText}>
            • Clock out when your shift ends
          </Text>
        </View>
      </View>

      <AgentBottomNavbar navigation={navigation} currentRoute="ClockInGPS" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.GRAY[100],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SIZES.PADDING,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY[200],
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.DARK,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: SIZES.PADDING,
  },
  card: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.BORDER_RADIUS,
    padding: SIZES.PADDING,
    marginBottom: SIZES.MARGIN,
    elevation: 2,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.DARK,
    marginLeft: 8,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.DARK,
    marginBottom: 4,
  },
  coordinatesText: {
    fontSize: 12,
    color: COLORS.GRAY[600],
    fontFamily: 'monospace',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.GRAY[600],
    marginLeft: 8,
  },
  siteName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.DARK,
    marginBottom: 4,
  },
  siteAddress: {
    fontSize: 14,
    color: COLORS.GRAY[600],
    marginBottom: 8,
  },
  shiftTime: {
    fontSize: 14,
    color: COLORS.INFO,
    fontWeight: '500',
  },
  statusCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.BORDER_RADIUS,
    padding: SIZES.PADDING * 1.5,
    marginBottom: SIZES.MARGIN,
    alignItems: 'center',
    borderWidth: 2,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  clockButton: {
    borderRadius: SIZES.BORDER_RADIUS,
    padding: SIZES.PADDING * 1.5,
    alignItems: 'center',
    marginBottom: SIZES.MARGIN,
  },
  clockButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    marginTop: 8,
  },
  instructions: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.BORDER_RADIUS,
    padding: SIZES.PADDING,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.DARK,
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: COLORS.GRAY[600],
    marginBottom: 4,
  },
});

export default ClockInGPSScreen;
