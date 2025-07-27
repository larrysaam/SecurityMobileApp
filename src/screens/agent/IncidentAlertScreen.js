import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { COLORS, SIZES } from '../../constants';
import apiService from '../../services/apiService';

const IncidentAlertScreen = ({ route, navigation }) => {
  const { scheduleId, siteId } = route.params || {};
  
  const [loading, setLoading] = useState(false);
  const [alertData, setAlertData] = useState({
    title: '',
    description: '',
    type: 'security',
    severity: 'medium',
    location: null,
    timestamp: new Date().toISOString(),
    requiresResponse: true,
  });

  const alertTypes = [
    { id: 'security', label: 'Security Breach', icon: 'shield-outline', color: COLORS.SECONDARY },
    { id: 'fire', label: 'Fire Emergency', icon: 'flame-outline', color: '#FF4444' },
    { id: 'medical', label: 'Medical Emergency', icon: 'medical-outline', color: '#FF6B6B' },
    { id: 'theft', label: 'Theft/Vandalism', icon: 'warning-outline', color: '#FF8C00' },
    { id: 'suspicious', label: 'Suspicious Activity', icon: 'eye-outline', color: '#FFA500' },
    { id: 'maintenance', label: 'Safety Hazard', icon: 'construct-outline', color: '#FFD700' },
  ];

  const severityLevels = [
    { id: 'low', label: 'Low', color: COLORS.SUCCESS, description: 'Minor issue, no immediate action required' },
    { id: 'medium', label: 'Medium', color: COLORS.WARNING, description: 'Requires attention within normal hours' },
    { id: 'high', label: 'High', color: '#FF8C00', description: 'Urgent attention required' },
    { id: 'critical', label: 'Critical', color: COLORS.SECONDARY, description: 'Immediate emergency response needed' },
  ];

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        
        setAlertData(prev => ({
          ...prev,
          location: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
          },
        }));
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setAlertData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateAlert = () => {
    if (!alertData.title.trim()) {
      Alert.alert('Validation Error', 'Please enter an alert title');
      return false;
    }
    
    if (!alertData.description.trim()) {
      Alert.alert('Validation Error', 'Please enter a description of the incident');
      return false;
    }

    return true;
  };

  const submitAlert = async () => {
    if (!validateAlert()) return;

    // Show confirmation for critical alerts
    if (alertData.severity === 'critical') {
      Alert.alert(
        'Critical Alert',
        'This will trigger an immediate emergency response. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Send Alert', style: 'destructive', onPress: () => sendAlert() },
        ]
      );
      return;
    }

    sendAlert();
  };

  const sendAlert = async () => {
    try {
      setLoading(true);

      const requestData = {
        ...alertData,
        scheduleId,
        siteId,
        agentId: 'current-agent-id', // This should come from auth context
      };

      const response = await apiService.request('/agent/alerts', {
        method: 'POST',
        data: requestData,
      });

      if (response.success) {
        Alert.alert(
          'Alert Sent',
          `${alertData.severity === 'critical' ? 'Emergency alert' : 'Alert'} has been sent successfully!`,
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
        throw new Error(response.message || 'Failed to send alert');
      }
    } catch (error) {
      console.error('Error sending alert:', error);
      Alert.alert('Error', 'Failed to send alert. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getAlertTypeColor = (typeId) => {
    const type = alertTypes.find(t => t.id === typeId);
    return type ? type.color : COLORS.GRAY[400];
  };

  const getSeverityColor = (severityId) => {
    const severity = severityLevels.find(s => s.id === severityId);
    return severity ? severity.color : COLORS.GRAY[400];
  };

  const getCurrentSeverity = () => {
    return severityLevels.find(s => s.id === alertData.severity);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Send Alert</Text>
        <TouchableOpacity 
          style={[
            styles.sendButton, 
            loading && styles.sendButtonDisabled,
            alertData.severity === 'critical' && styles.criticalButton,
          ]}
          onPress={submitAlert}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.WHITE} />
          ) : (
            <Text style={styles.sendButtonText}>
              {alertData.severity === 'critical' ? 'EMERGENCY' : 'Send'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Alert Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alert Type</Text>
          <View style={styles.typeGrid}>
            {alertTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeCard,
                  alertData.type === type.id && { 
                    backgroundColor: type.color,
                    borderColor: type.color,
                  },
                ]}
                onPress={() => handleInputChange('type', type.id)}
              >
                <Ionicons
                  name={type.icon}
                  size={24}
                  color={alertData.type === type.id ? COLORS.WHITE : type.color}
                />
                <Text
                  style={[
                    styles.typeLabel,
                    alertData.type === type.id && { color: COLORS.WHITE },
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Severity Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Severity Level</Text>
          <View style={styles.severityContainer}>
            {severityLevels.map((severity) => (
              <TouchableOpacity
                key={severity.id}
                style={[
                  styles.severityCard,
                  { borderColor: severity.color },
                  alertData.severity === severity.id && { backgroundColor: severity.color },
                ]}
                onPress={() => handleInputChange('severity', severity.id)}
              >
                <View style={styles.severityHeader}>
                  <Text
                    style={[
                      styles.severityLabel,
                      { color: alertData.severity === severity.id ? COLORS.WHITE : severity.color },
                    ]}
                  >
                    {severity.label}
                  </Text>
                  {alertData.severity === severity.id && (
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.WHITE} />
                  )}
                </View>
                <Text
                  style={[
                    styles.severityDescription,
                    { color: alertData.severity === severity.id ? COLORS.WHITE : COLORS.GRAY[600] },
                  ]}
                >
                  {severity.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Alert Title */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alert Title</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Brief description of the incident"
            value={alertData.title}
            onChangeText={(text) => handleInputChange('title', text)}
            maxLength={100}
          />
        </View>

        {/* Alert Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detailed Description</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Provide detailed information about the incident, location within the site, people involved, etc."
            value={alertData.description}
            onChangeText={(text) => handleInputChange('description', text)}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        {/* Response Required Toggle */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => handleInputChange('requiresResponse', !alertData.requiresResponse)}
          >
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleTitle}>Requires Immediate Response</Text>
              <Text style={styles.toggleDescription}>
                Check this if the situation requires immediate attention from supervisors or emergency services
              </Text>
            </View>
            <View style={[
              styles.toggle,
              alertData.requiresResponse && styles.toggleActive,
            ]}>
              {alertData.requiresResponse && (
                <Ionicons name="checkmark" size={16} color={COLORS.WHITE} />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Location Information */}
        {alertData.location && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Location</Text>
            <View style={styles.locationCard}>
              <Ionicons name="location" size={20} color={COLORS.PRIMARY} />
              <View style={styles.locationInfo}>
                <Text style={styles.locationText}>
                  Latitude: {alertData.location.latitude.toFixed(6)}
                </Text>
                <Text style={styles.locationText}>
                  Longitude: {alertData.location.longitude.toFixed(6)}
                </Text>
                <Text style={styles.locationText}>
                  Accuracy: ±{Math.round(alertData.location.accuracy)}m
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Critical Alert Warning */}
        {alertData.severity === 'critical' && (
          <View style={styles.warningCard}>
            <Ionicons name="warning" size={24} color="#FF4444" />
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>Critical Alert Warning</Text>
              <Text style={styles.warningText}>
                This will immediately notify supervisors and may trigger emergency response protocols.
                Only use for genuine emergencies.
              </Text>
            </View>
          </View>
        )}
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
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.SUCCESS,
    borderRadius: 6,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.GRAY[400],
  },
  criticalButton: {
    backgroundColor: '#FF4444',
  },
  sendButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.GRAY[200],
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.GRAY[700],
    marginTop: 8,
    textAlign: 'center',
  },
  severityContainer: {
    gap: 12,
  },
  severityCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
  },
  severityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  severityLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  severityDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  textInput: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.GRAY[300],
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 16,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.GRAY[800],
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 14,
    color: COLORS.GRAY[600],
    lineHeight: 20,
  },
  toggle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.GRAY[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: COLORS.SUCCESS,
    borderColor: COLORS.SUCCESS,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    borderRadius: 8,
    padding: 12,
  },
  locationInfo: {
    marginLeft: 12,
  },
  locationText: {
    fontSize: 12,
    color: COLORS.GRAY[600],
    marginBottom: 2,
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFE5E5',
    marginBottom: 16,
  },
  warningContent: {
    flex: 1,
    marginLeft: 12,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF4444',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: '#CC3333',
    lineHeight: 20,
  },
});

export default IncidentAlertScreen;
