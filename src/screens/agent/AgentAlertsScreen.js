import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants';
import AgentBottomNavbar from '../../components/AgentBottomNavbar';
import { useAuth } from '../../store/AuthContext';

const AgentAlertsScreen = ({ navigation }) => {
  const { apiService } = useAuth();
  const [activeTab, setActiveTab] = useState('received');
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAlerts();

      if (response.success) {
        setAlerts(response.data.alerts || []);
      } else {
        Alert.alert('Error', 'Failed to load alerts');
      }
    } catch (error) {
      console.error('Load alerts error:', error);
      Alert.alert('Error', 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return COLORS.SECONDARY;
      case 'medium': return COLORS.WARNING;
      case 'low': return COLORS.INFO;
      default: return COLORS.GRAY[500];
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'emergency': return 'warning';
      case 'schedule': return 'calendar';
      case 'weather': return 'cloud';
      case 'maintenance': return 'construct';
      case 'patrol': return 'walk';
      default: return 'alert-circle';
    }
  };

  const handleAlertPress = async (alert) => {
    if (!alert.read) {
      try {
        await apiService.markAlertAsRead(alert.id);
        loadAlerts(); // Refresh alerts
      } catch (error) {
        console.error('Mark alert as read error:', error);
      }
    }

    Alert.alert(
      alert.title,
      alert.message,
      [
        { text: 'Close', style: 'cancel' },
        { text: 'Reply', style: 'default' },
      ]
    );
  };

  const handleEmergencyAlert = async () => {
    Alert.alert(
      'Send Emergency Alert',
      'This will immediately notify all supervisors and control center.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Alert',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiService.sendEmergencyAlert(
                'Emergency assistance required immediately',
                null // Location can be added here
              );

              if (response.success) {
                Alert.alert('Alert Sent', 'Emergency alert has been sent successfully.');
              } else {
                Alert.alert('Error', 'Failed to send emergency alert');
              }
            } catch (error) {
              console.error('Emergency alert error:', error);
              Alert.alert('Error', 'Failed to send emergency alert');
            }
          }
        },
      ]
    );
  };

  const renderAlert = (alert, isSent = false) => {
    const createdDate = new Date(alert.createdAt);
    const timeAgo = getTimeAgo(createdDate);

    return (
      <TouchableOpacity
        key={alert.id}
        style={[styles.alertCard, !alert.read && !isSent && styles.unreadAlert]}
        onPress={() => handleAlertPress(alert)}
      >
        <View style={styles.alertHeader}>
          <View style={[styles.alertIcon, { backgroundColor: `${getPriorityColor(alert.priority)}15` }]}>
            <Ionicons
              name={getTypeIcon(alert.type)}
              size={20}
              color={getPriorityColor(alert.priority)}
            />
          </View>
          <View style={styles.alertInfo}>
            <Text style={styles.alertTitle}>{alert.title}</Text>
            <Text style={styles.alertFrom}>
              {isSent ? `To: ${alert.to || 'Recipients'}` : `From: ${alert.from}`}
            </Text>
          </View>
          <View style={styles.alertMeta}>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(alert.priority) }]}>
              <Text style={styles.priorityText}>{alert.priority}</Text>
            </View>
            <Text style={styles.alertTime}>{timeAgo}</Text>
          </View>
        </View>
        <Text style={styles.alertMessage} numberOfLines={2}>
          {alert.message}
        </Text>
        {!alert.read && !isSent && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Alerts</Text>
        <TouchableOpacity 
          style={styles.emergencyButton}
          onPress={handleEmergencyAlert}
        >
          <Ionicons name="warning" size={20} color={COLORS.WHITE} />
          <Text style={styles.emergencyText}>SOS</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'received' && styles.activeTab]}
          onPress={() => setActiveTab('received')}
        >
          <Text style={[styles.tabText, activeTab === 'received' && styles.activeTabText]}>
            Received ({alerts.filter(a => !a.read).length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sent' && styles.activeTab]}
          onPress={() => setActiveTab('sent')}
        >
          <Text style={[styles.tabText, activeTab === 'sent' && styles.activeTabText]}>
            Sent (0)
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.PRIMARY} />
            <Text style={styles.loadingText}>Loading alerts...</Text>
          </View>
        ) : (
          <View style={styles.section}>
            {activeTab === 'received' ? (
              <>
                <Text style={styles.sectionTitle}>Recent Alerts</Text>
                {alerts.length > 0 ? (
                  alerts.map(alert => renderAlert(alert, false))
                ) : (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="alert-circle-outline" size={48} color={COLORS.GRAY[400]} />
                    <Text style={styles.emptyText}>No alerts found</Text>
                    <Text style={styles.emptySubtext}>You're all caught up!</Text>
                  </View>
                )}
              </>
            ) : (
              <>
                <Text style={styles.sectionTitle}>Sent Alerts</Text>
                <View style={styles.emptyContainer}>
                  <Ionicons name="send-outline" size={48} color={COLORS.GRAY[400]} />
                  <Text style={styles.emptyText}>No sent alerts</Text>
                  <Text style={styles.emptySubtext}>Alerts you send will appear here</Text>
                </View>
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* Quick Alert Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={[styles.quickButton, { backgroundColor: COLORS.SECONDARY }]}>
          <Ionicons name="warning" size={20} color={COLORS.WHITE} />
          <Text style={styles.quickButtonText}>Emergency</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.quickButton, { backgroundColor: COLORS.INFO }]}>
          <Ionicons name="information-circle" size={20} color={COLORS.WHITE} />
          <Text style={styles.quickButtonText}>Info</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.quickButton, { backgroundColor: COLORS.SUCCESS }]}>
          <Ionicons name="checkmark-circle" size={20} color={COLORS.WHITE} />
          <Text style={styles.quickButtonText}>All Clear</Text>
        </TouchableOpacity>
      </View>

      <AgentBottomNavbar navigation={navigation} currentRoute="AgentAlerts" />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.PADDING,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY[200],
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.DARK,
  },
  emergencyButton: {
    backgroundColor: COLORS.SECONDARY,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  emergencyText: {
    color: COLORS.WHITE,
    fontWeight: 'bold',
    marginLeft: 4,
    fontSize: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY[200],
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.PRIMARY,
  },
  tabText: {
    fontSize: 16,
    color: COLORS.GRAY[600],
    fontWeight: '500',
  },
  activeTabText: {
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: SIZES.PADDING,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.DARK,
    marginBottom: 16,
  },
  alertCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.BORDER_RADIUS,
    padding: SIZES.PADDING,
    marginBottom: 12,
    elevation: 2,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
  },
  unreadAlert: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.PRIMARY,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertInfo: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.DARK,
    marginBottom: 2,
  },
  alertFrom: {
    fontSize: 12,
    color: COLORS.GRAY[600],
  },
  alertMeta: {
    alignItems: 'flex-end',
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    textTransform: 'uppercase',
  },
  alertTime: {
    fontSize: 11,
    color: COLORS.GRAY[500],
  },
  alertMessage: {
    fontSize: 14,
    color: COLORS.GRAY[700],
    lineHeight: 20,
  },
  unreadDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.PRIMARY,
  },
  quickActions: {
    flexDirection: 'row',
    padding: SIZES.PADDING,
    backgroundColor: COLORS.WHITE,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY[200],
  },
  quickButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: SIZES.BORDER_RADIUS,
    marginHorizontal: 4,
  },
  quickButtonText: {
    color: COLORS.WHITE,
    fontWeight: '600',
    marginLeft: 4,
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.PADDING * 2,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.GRAY[600],
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: SIZES.PADDING * 2,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.GRAY[600],
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.GRAY[500],
    textAlign: 'center',
  },
});

export default AgentAlertsScreen;
