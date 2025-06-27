import { useState, useEffect, useCallback } from 'react';
import LocationService from '../services/location';
import { useApp } from '../store/AppContext';

const useLocation = (options = {}) => {
  const { updateCurrentLocation } = useApp();
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [watching, setWatching] = useState(false);
  const [permissions, setPermissions] = useState({
    foreground: false,
    background: false,
  });

  // Initialize location permissions
  useEffect(() => {
    initializePermissions();
  }, []);

  const initializePermissions = async () => {
    try {
      const perms = await LocationService.requestPermissions();
      setPermissions(perms);
    } catch (err) {
      setError(err.message);
    }
  };

  // Get current location
  const getCurrentLocation = useCallback(async () => {
    if (!permissions.foreground) {
      setError('Location permission required');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const currentLocation = await LocationService.getCurrentLocation();
      setLocation(currentLocation);
      
      // Update global app state
      await updateCurrentLocation();
      
      return currentLocation;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [permissions.foreground, updateCurrentLocation]);

  // Start watching location
  const startWatching = useCallback((watchOptions = {}) => {
    if (!permissions.foreground) {
      setError('Location permission required');
      return;
    }

    if (watching) {
      return; // Already watching
    }

    const defaultOptions = {
      accuracy: 'high',
      timeInterval: 30000, // 30 seconds
      distanceInterval: 10, // 10 meters
      ...options,
      ...watchOptions,
    };

    LocationService.startTracking((newLocation) => {
      setLocation(newLocation);
    }, defaultOptions);

    setWatching(true);
  }, [permissions.foreground, watching, options]);

  // Stop watching location
  const stopWatching = useCallback(() => {
    if (!watching) return;

    LocationService.stopTracking();
    setWatching(false);
  }, [watching]);

  // Validate location for a specific site
  const validateLocationForSite = useCallback(async (siteLocation, radius = 100) => {
    try {
      const validation = await LocationService.validateLocationForSite(siteLocation, radius);
      return validation;
    } catch (err) {
      setError(err.message);
      return {
        isValid: false,
        distance: null,
        currentLocation: null,
        requiredRadius: radius,
        error: err.message,
      };
    }
  }, []);

  // Calculate ETA to destination
  const calculateETA = useCallback(async (destination, transportMode = 'walking') => {
    try {
      const eta = await LocationService.calculateETA(destination, transportMode);
      return eta;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  // Check if location services are enabled
  const checkLocationServices = useCallback(async () => {
    try {
      const enabled = await LocationService.isLocationServiceEnabled();
      return enabled;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, []);

  // Get location accuracy
  const getLocationAccuracy = useCallback(async () => {
    try {
      const accuracy = await LocationService.getLocationAccuracy();
      return accuracy;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  // Get last known location
  const getLastKnownLocation = useCallback(async () => {
    try {
      const lastLocation = await LocationService.getLastKnownLocation();
      if (lastLocation) {
        setLocation(lastLocation);
      }
      return lastLocation;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  // Create geofence
  const createGeofence = useCallback((center, radius, identifier) => {
    return LocationService.createGeofence(center, radius, identifier);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watching) {
        stopWatching();
      }
    };
  }, [watching, stopWatching]);

  return {
    // State
    location,
    error,
    loading,
    watching,
    permissions,
    
    // Actions
    getCurrentLocation,
    startWatching,
    stopWatching,
    validateLocationForSite,
    calculateETA,
    checkLocationServices,
    getLocationAccuracy,
    getLastKnownLocation,
    createGeofence,
    clearError,
    
    // Utilities
    isLocationEnabled: permissions.foreground,
    hasBackgroundPermission: permissions.background,
  };
};

export default useLocation;
