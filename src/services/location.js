// import * as Location from 'expo-location';
import { locationUtils } from '../utils';

class LocationService {
  constructor() {
    this.watchId = null;
    this.currentLocation = null;
    this.isTracking = false;
  }

  async requestPermissions() {
    try {
      // Mock implementation for development
      console.log('Mock: Requesting location permissions');
      return {
        foreground: true,
        background: false
      };

      // Real implementation (commented out for now):
      // const Location = require('expo-location');
      // const { status } = await Location.requestForegroundPermissionsAsync();
      // if (status !== 'granted') {
      //   throw new Error('Location permission denied');
      // }
      // const backgroundStatus = await Location.requestBackgroundPermissionsAsync();
      // return {
      //   foreground: status === 'granted',
      //   background: backgroundStatus.status === 'granted'
      // };
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      throw error;
    }
  }

  async getCurrentLocation() {
    try {
      // Mock implementation for development
      console.log('Mock: Getting current location');
      this.currentLocation = {
        latitude: 48.8566,
        longitude: 2.3522,
        accuracy: 10,
        timestamp: new Date().toISOString(),
        address: 'Mock Address, Paris, France'
      };

      return this.currentLocation;

      // Real implementation (commented out for now):
      // const Location = require('expo-location');
      // const location = await Location.getCurrentPositionAsync({
      //   accuracy: Location.Accuracy.High,
      //   timeout: 10000,
      //   maximumAge: 60000,
      // });
      // this.currentLocation = {
      //   latitude: location.coords.latitude,
      //   longitude: location.coords.longitude,
      //   accuracy: location.coords.accuracy,
      //   timestamp: new Date().toISOString(),
      //   address: await this.reverseGeocode(location.coords.latitude, location.coords.longitude)
      // };
      // return this.currentLocation;
    } catch (error) {
      console.error('Error getting current location:', error);
      throw error;
    }
  }

  async reverseGeocode(latitude, longitude) {
    try {
      const result = await Location.reverseGeocodeAsync({
        latitude,
        longitude
      });

      if (result.length > 0) {
        const address = result[0];
        return `${address.street || ''} ${address.streetNumber || ''}, ${address.city || ''}, ${address.postalCode || ''}`.trim();
      }

      return 'Unknown address';
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return 'Unknown address';
    }
  }

  startTracking(callback, options = {}) {
    const defaultOptions = {
      accuracy: Location.Accuracy.High,
      timeInterval: 30000, // 30 seconds
      distanceInterval: 10, // 10 meters
    };

    const trackingOptions = { ...defaultOptions, ...options };

    this.watchId = Location.watchPositionAsync(
      trackingOptions,
      (location) => {
        this.currentLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          timestamp: new Date().toISOString()
        };

        if (callback) {
          callback(this.currentLocation);
        }
      }
    );

    this.isTracking = true;
    return this.watchId;
  }

  stopTracking() {
    if (this.watchId) {
      this.watchId.then(subscription => {
        subscription.remove();
      });
      this.watchId = null;
    }
    this.isTracking = false;
  }

  async validateLocationForSite(siteLocation, radius = 100) {
    try {
      const currentLocation = await this.getCurrentLocation();
      
      const isWithinGeofence = locationUtils.isWithinGeofence(
        currentLocation.latitude,
        currentLocation.longitude,
        siteLocation.latitude,
        siteLocation.longitude,
        radius
      );

      const distance = locationUtils.calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        siteLocation.latitude,
        siteLocation.longitude
      );

      return {
        isValid: isWithinGeofence,
        distance: Math.round(distance),
        currentLocation,
        requiredRadius: radius
      };
    } catch (error) {
      console.error('Error validating location:', error);
      throw error;
    }
  }

  async getLocationAccuracy() {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      return location.coords.accuracy;
    } catch (error) {
      console.error('Error getting location accuracy:', error);
      return null;
    }
  }

  isLocationServiceEnabled() {
    return Location.hasServicesEnabledAsync();
  }

  async getLastKnownLocation() {
    try {
      const location = await Location.getLastKnownPositionAsync({
        maxAge: 300000, // 5 minutes
        requiredAccuracy: 100
      });

      if (location) {
        return {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          timestamp: new Date(location.timestamp).toISOString()
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting last known location:', error);
      return null;
    }
  }

  // Méthode pour créer une géofence virtuelle
  createGeofence(center, radius, identifier) {
    return {
      identifier,
      center,
      radius,
      isInside: (location) => {
        return locationUtils.isWithinGeofence(
          location.latitude,
          location.longitude,
          center.latitude,
          center.longitude,
          radius
        );
      }
    };
  }

  // Méthode pour calculer l'ETA (temps d'arrivée estimé)
  async calculateETA(destination, transportMode = 'walking') {
    try {
      const currentLocation = await this.getCurrentLocation();
      const distance = locationUtils.calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        destination.latitude,
        destination.longitude
      );

      // Vitesses approximatives en m/s
      const speeds = {
        walking: 1.4, // 5 km/h
        driving: 13.9, // 50 km/h
        cycling: 4.2   // 15 km/h
      };

      const speed = speeds[transportMode] || speeds.walking;
      const timeInSeconds = distance / speed;
      const timeInMinutes = Math.round(timeInSeconds / 60);

      return {
        distance: Math.round(distance),
        timeInMinutes,
        transportMode
      };
    } catch (error) {
      console.error('Error calculating ETA:', error);
      throw error;
    }
  }
}

export default new LocationService();
