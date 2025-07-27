import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { COLORS, SIZES } from '../../constants';
import apiService from '../../services/apiService';

const { width, height } = Dimensions.get('window');

const QRClockInScreen = ({ route, navigation }) => {
  const { scheduleId, action = 'clock-in', siteCode, siteName } = route.params || {};

  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [flashOn, setFlashOn] = useState(false);
  const [schedule, setSchedule] = useState(null);

  useEffect(() => {
    getCameraPermissions();
    getCurrentLocation();
    fetchScheduleDetails();
  }, []);

  const fetchScheduleDetails = async () => {
    try {
      if (scheduleId) {
        const response = await apiService.request(`/agent/schedule/${scheduleId}`);
        if (response.success) {
          setSchedule(response.data);
          console.log('Schedule details loaded:', response.data);
        }
      }
    } catch (error) {
      console.error('Error fetching schedule details:', error);
    }
  };

  const getCameraPermissions = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for clock-in verification.');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        accuracy: currentLocation.coords.accuracy,
      });
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Location Error', 'Unable to get current location. Please try again.');
    }
  };

  const handleBarcodeScanned = async ({ type, data }) => {
    if (scanned) return;

    setScanned(true);
    setLoading(true);

    try {
      console.log('QR Code scanned:', data);
      console.log('Expected site QR code:', schedule?.site?.qrCode);

      // Validate QR code against the site's QR code
      if (!schedule || !schedule.site) {
        Alert.alert('Error', 'Schedule information not available. Please try again.');
        resetScanner();
        return;
      }

      // Check if the scanned QR code matches the site's QR code exactly
      if (data !== schedule.site.qrCode) {
        Alert.alert(
          'Invalid QR Code',
          `This QR code does not match the site code for ${schedule.site.name}.\n\nExpected: ${schedule.site.qrCode}\nScanned: ${data}`,
          [
            { text: 'Try Again', onPress: resetScanner },
            { text: 'Cancel', onPress: () => navigation.goBack() }
          ]
        );
        return;
      }

      // QR code is valid, perform clock-in/clock-out action
      await performClockAction(data);

    } catch (error) {
      console.error('Clock action error:', error);
      Alert.alert('Error', 'Failed to process clock action. Please try again.');
      resetScanner();
    } finally {
      setLoading(false);
    }
  };



  const performClockAction = async (qrCodeData) => {
    try {
      const endpoint = action === 'clock-in' ? '/agent/clock-in' : '/agent/clock-out';

      const requestData = {
        scheduleId: scheduleId,
        siteId: schedule.site.id,
        method: 'qr',
        qrCode: qrCodeData,
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
        Alert.alert(
          'Success!',
          `Successfully ${actionText} ${schedule.site.name}!\n\nTime: ${new Date().toLocaleTimeString()}\nLocation: ${location ? 'GPS verified' : 'Location pending'}`,
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
      console.error('Clock action API error:', error);

      // Show more detailed error message
      let errorMessage = 'Failed to process clock action. Please try again.';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      Alert.alert('Clock Action Failed', errorMessage, [
        { text: 'Try Again', onPress: resetScanner },
        { text: 'Cancel', onPress: () => navigation.goBack() }
      ]);

      throw error;
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setLoading(false);
  };

  const toggleFlash = () => {
    setFlashOn(!flashOn);
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Requesting camera permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="camera-off" size={64} color={COLORS.GRAY[400]} />
          <Text style={styles.errorText}>Camera permission denied</Text>
          <Text style={styles.errorSubText}>
            Please enable camera access in your device settings to scan QR codes.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={getCameraPermissions}>
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
          {action === 'clock-in' ? 'Clock In' : 'Clock Out'} - QR Code
        </Text>
        <TouchableOpacity style={styles.flashButton} onPress={toggleFlash}>
          <Ionicons 
            name={flashOn ? "flash" : "flash-off"} 
            size={24} 
            color={COLORS.WHITE} 
          />
        </TouchableOpacity>
      </View>

      {/* Camera Scanner */}
      <View style={styles.scannerContainer}>
        <CameraView
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          style={styles.scanner}
          enableTorch={flashOn}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        />
        
        {/* Scanner Overlay */}
        <View style={styles.overlay}>
          <View style={styles.scanArea}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        </View>

        {/* Loading Overlay */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.WHITE} />
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        )}
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>Scan QR Code</Text>
        {schedule?.site ? (
          <View style={styles.siteInfo}>
            <Text style={styles.siteNameText}>{schedule.site.name}</Text>
            <Text style={styles.instructionsText}>
              Position the site QR code within the frame to {action === 'clock-in' ? 'clock in' : 'clock out'}
            </Text>
            <Text style={styles.qrCodeText}>Expected QR: {schedule.site.qrCode}</Text>
          </View>
        ) : (
          <Text style={styles.instructionsText}>
            Loading site information...
          </Text>
        )}

        {scanned && !loading && (
          <TouchableOpacity style={styles.rescanButton} onPress={resetScanner}>
            <Ionicons name="refresh" size={20} color={COLORS.PRIMARY} />
            <Text style={styles.rescanButtonText}>Scan Again</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BLACK,
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
  flashButton: {
    padding: 8,
  },
  scannerContainer: {
    flex: 1,
    position: 'relative',
  },
  scanner: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: COLORS.WHITE,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionsContainer: {
    backgroundColor: COLORS.WHITE,
    padding: 20,
    alignItems: 'center',
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.GRAY[800],
    marginBottom: 8,
  },
  siteInfo: {
    alignItems: 'center',
  },
  siteNameText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.PRIMARY,
    marginBottom: 8,
    textAlign: 'center',
  },
  instructionsText: {
    fontSize: 14,
    color: COLORS.GRAY[600],
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  qrCodeText: {
    fontSize: 12,
    color: COLORS.GRAY[500],
    textAlign: 'center',
    fontFamily: 'monospace',
    backgroundColor: COLORS.GRAY[100],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  rescanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.GRAY[100],
    borderRadius: 8,
  },
  rescanButtonText: {
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
  loadingText: {
    fontSize: 16,
    color: COLORS.WHITE,
    marginTop: 12,
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

export default QRClockInScreen;
