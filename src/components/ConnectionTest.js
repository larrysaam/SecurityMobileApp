import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants';

const ConnectionTest = () => {
  const [connectionStatus, setConnectionStatus] = useState('testing');
  const [apiStatus, setApiStatus] = useState('unknown');

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      setConnectionStatus('testing');

      // Test basic connectivity
      const healthUrl = 'http://localhost:3000/health';
      console.log('Testing connection to:', healthUrl);

      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('Health check response:', data);

      if (response.ok && data.status === 'OK') {
        setConnectionStatus('connected');
        setApiStatus('healthy');
      } else {
        setConnectionStatus('error');
        setApiStatus('unhealthy');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionStatus('error');
      setApiStatus('unreachable');
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return COLORS.SUCCESS;
      case 'error': return COLORS.SECONDARY;
      case 'testing': return COLORS.WARNING;
      default: return COLORS.GRAY[500];
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return 'checkmark-circle';
      case 'error': return 'close-circle';
      case 'testing': return 'time';
      default: return 'help-circle';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Backend Connected';
      case 'error': return 'Backend Disconnected';
      case 'testing': return 'Testing Connection...';
      default: return 'Unknown Status';
    }
  };

  const showDetails = () => {
    const currentUrl = typeof window !== 'undefined' && window.location
      ? window.location.origin
      : 'React Native';

    Alert.alert(
      'Connection Details',
      `Status: ${getStatusText()}\nAPI Health: ${apiStatus}\nFrontend: ${currentUrl}\nBackend: http://localhost:3000\n\nMake sure the backend server is running on port 3000.`,
      [
        { text: 'Retry', onPress: testConnection },
        { text: 'OK' }
      ]
    );
  };

  return (
    <TouchableOpacity style={styles.container} onPress={showDetails}>
      <View style={[styles.indicator, { backgroundColor: getStatusColor() }]}>
        <Ionicons name={getStatusIcon()} size={16} color={COLORS.WHITE} />
      </View>
      <Text style={[styles.statusText, { color: getStatusColor() }]}>
        {getStatusText()}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.BORDER_RADIUS,
    marginHorizontal: SIZES.PADDING,
    marginVertical: 4,
    elevation: 1,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  indicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default ConnectionTest;
