import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { COLORS, SIZES } from '../../constants';
import { ApiService } from '../../services/apiService';

const AlertsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'open', 'resolved', 'high', 'medium', 'low'
  const [location, setLocation] = useState(null);

  useEffect(() => {
    loadAlerts();
    getCurrentLocation();
  }, [filter]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setLocation(location);
      }
    } catch (error) {
      console.error('Location error:', error);
    }
  };

  const loadAlerts = async () => {
    try {
      setLoading(true);

      const response = await ApiService.getAgentAlerts({ filter });
      if (response.success) {
        const processedAlerts = response.data.alerts.map(alert => ({
          ...alert,
          formattedDate: formatDate(alert.createdAt),
          formattedTime: formatTime(alert.createdAt),
          timeAgo: getTimeAgo(alert.createdAt),
        }));

        // Sort by priority and date
        processedAlerts.sort((a, b) => {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
          if (priorityDiff !== 0) return priorityDiff;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });

        setAlerts(processedAlerts);
      } else {
        console.error('Failed to load alerts:', response.message);
        Alert.alert('Error', 'Failed to load alerts');
      }
    } catch (error) {
      console.error('Alerts loading error:', error);
      Alert.alert('Error', 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAlerts();
    setRefreshing(false);
  }, [filter]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getAlertTypeIcon = (type) => {
    switch (type) {
      case 'security': return 'shield';
      case 'emergency': return 'warning';
      case 'maintenance': return 'construct';
      case 'incident': return 'alert-circle';
      case 'system': return 'settings';
      default: return 'notifications';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return COLORS.ERROR;
      case 'medium': return COLORS.WARNING;
      case 'low': return COLORS.INFO;
      default: return COLORS.GRAY[500];
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return COLORS.ERROR;
      case 'in_progress': return COLORS.WARNING;
      case 'resolved': return COLORS.SUCCESS;
      default: return COLORS.GRAY[400];
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'open': return 'OPEN';
      case 'in_progress': return 'IN PROGRESS';
      case 'resolved': return 'RESOLVED';
      default: return 'UNKNOWN';
    }
  };

  const handleEmergencyAlert = () => {
    Alert.alert(
      'Emergency Alert',
      'This will send an immediate emergency alert with your location to all supervisors. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Emergency Alert',
          style: 'destructive',
          onPress: sendEmergencyAlert
        },
      ]
    );
  };

  const sendEmergencyAlert = async () => {
    try {
      setLoading(true);

      const alertData = {
        type: 'emergency',
        priority: 'high',
        title: 'Emergency Alert',
        description: 'Agent has triggered an emergency alert',
        location: location?.coords,
        timestamp: new Date().toISOString(),
      };

      const response = await ApiService.createAlert(alertData);
      if (response.success) {
        Alert.alert('Emergency Alert Sent', 'Your emergency alert has been sent to all supervisors.');
        await loadAlerts();
      } else {
        Alert.alert('Error', 'Failed to send emergency alert');
      }
    } catch (error) {
      console.error('Emergency alert error:', error);
      Alert.alert('Error', 'Failed to send emergency alert');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlert = () => {
    navigation.navigate('CreateAlert', {
      location: location?.coords,
      onSuccess: loadAlerts
    });
  };

  const handleAlertPress = (alert) => {
    navigation.navigate('AlertDetails', {
      alertId: alert.id,
      alert: alert,
      onUpdate: loadAlerts
    });
  };

  const filterButtons = [
    { key: 'all', label: 'All', icon: 'list' },
    { key: 'open', label: 'Open', icon: 'alert-circle' },
    { key: 'resolved', label: 'Resolved', icon: 'checkmark-circle' },
    { key: 'high', label: 'High Priority', icon: 'warning' },
  ];

  const renderAlertItem = ({ item: alert }) => (
    <TouchableOpacity
      style={[
        styles.alertCard,
        alert.priority === 'high' && styles.highPriorityCard
      ]}
      onPress={() => handleAlertPress(alert)}
    >
      <View style={styles.alertHeader}>
        <View style={styles.alertTypeSection}>
          <View style={[
            styles.alertTypeIcon,
            { backgroundColor: getPriorityColor(alert.priority) }
          ]}>
            <Ionicons
              name={getAlertTypeIcon(alert.type)}
              size={20}
              color={COLORS.WHITE}
            />
          </View>
          <View style={styles.alertInfo}>
            <Text style={styles.alertTitle}>{alert.title}</Text>
            <Text style={styles.alertType}>{alert.type.toUpperCase()}</Text>
          </View>
        </View>
        <View style={styles.alertMeta}>
          <View style={[
            styles.priorityBadge,
            { backgroundColor: getPriorityColor(alert.priority) }
          ]}>
            <Text style={styles.priorityText}>{alert.priority.toUpperCase()}</Text>
          </View>
          <Text style={styles.timeAgo}>{alert.timeAgo}</Text>
        </View>
      </View>

      <Text style={styles.alertDescription} numberOfLines={2}>
        {alert.description || 'No description provided'}
      </Text>

      <View style={styles.alertFooter}>
        <View style={styles.statusSection}>
          <View style={[
            styles.statusIndicator,
            { backgroundColor: getStatusColor(alert.status) }
          ]} />
          <Text style={styles.statusText}>{getStatusText(alert.status)}</Text>
        </View>

        <View style={styles.dateTimeInfo}>
          <Ionicons name="time" size={14} color={COLORS.GRAY[500]} />
          <Text style={styles.dateTimeText}>
            {alert.formattedDate} at {alert.formattedTime}
          </Text>
        </View>
      </View>

      {alert.site && (
        <View style={styles.siteInfo}>
          <Ionicons name="location" size={14} color={COLORS.GRAY[500]} />
          <Text style={styles.siteText}>{alert.site.name}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Loading alerts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Alerts</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.emergencyButton}
            onPress={handleEmergencyAlert}
          >
            <Ionicons name="warning" size={18} color={COLORS.WHITE} />
            <Text style={styles.emergencyButtonText}>SOS</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateAlert}
          >
            <Ionicons name="add" size={18} color={COLORS.WHITE} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Buttons */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {filterButtons.map((button) => (
          <TouchableOpacity
            key={button.key}
            style={[
              styles.filterButton,
              filter === button.key && styles.activeFilterButton
            ]}
            onPress={() => setFilter(button.key)}
          >
            <Ionicons
              name={button.icon}
              size={16}
              color={filter === button.key ? COLORS.WHITE : COLORS.PRIMARY}
            />
            <Text style={[
              styles.filterButtonText,
              filter === button.key && styles.activeFilterButtonText
            ]}>
              {button.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-outline" size={64} color={COLORS.GRAY[400]} />
          <Text style={styles.emptyStateTitle}>No Alerts Found</Text>
          <Text style={styles.emptyStateText}>
            {filter === 'all'
              ? "You have no alerts at the moment"
              : `No ${filter} alerts found`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={alerts}
          renderItem={renderAlertItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.alertsList}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY[200],
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.ERROR,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  emergencyButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.WHITE,
  },
  createButton: {
    backgroundColor: COLORS.PRIMARY,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY[200],
  },
  filterContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
    gap: 6,
  },
  activeFilterButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.PRIMARY,
  },
  activeFilterButtonText: {
    color: COLORS.WHITE,
  },
  alertsList: {
    padding: 16,
  },
  alertCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  highPriorityCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.ERROR,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  alertTypeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  alertTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertInfo: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT,
    marginBottom: 2,
  },
  alertType: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.GRAY[600],
  },
  alertMeta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.WHITE,
  },
  timeAgo: {
    fontSize: 11,
    color: COLORS.GRAY[500],
  },
  alertDescription: {
    fontSize: 14,
    color: COLORS.GRAY[700],
    lineHeight: 20,
    marginBottom: 12,
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.GRAY[600],
  },
  dateTimeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateTimeText: {
    fontSize: 11,
    color: COLORS.GRAY[500],
  },
  siteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY[200],
  },
  siteText: {
    fontSize: 12,
    color: COLORS.GRAY[600],
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.GRAY[600],
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.GRAY[500],
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default AlertsScreen;
