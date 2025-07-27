import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants';
import AdminBottomNavbar from '../../components/AdminBottomNavbar';
import { useAuth } from '../../store/AuthContext';

const AdminTrackingScreen = ({ navigation }) => {
  const { apiService } = useAuth();
  const [agentLocations, setAgentLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);

  useEffect(() => {
    loadAgentLocations();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(loadAgentLocations, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadAgentLocations = async () => {
    try {
      if (!refreshing) setLoading(true);
      
      const response = await apiService.request('/admin/tracking/agents');
      
      if (response.success) {
        setAgentLocations(response.data || []);
      } else {
        Alert.alert('Error', 'Failed to load agent locations');
      }
    } catch (error) {
      console.error('Load agent locations error:', error);
      Alert.alert('Error', 'Failed to load agent locations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAgentLocations();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return COLORS.SUCCESS;
      case 'inactive': return COLORS.GRAY[400];
      case 'offline': return COLORS.SECONDARY;
      default: return COLORS.GRAY[400];
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return 'radio-button-on';
      case 'inactive': return 'radio-button-off';
      case 'offline': return 'close-circle';
      default: return 'help-circle';
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const renderAgentCard = (agent) => (
    <TouchableOpacity
      key={agent.agentId}
      style={[
        styles.agentCard,
        selectedAgent?.agentId === agent.agentId && styles.agentCardSelected
      ]}
      onPress={() => setSelectedAgent(selectedAgent?.agentId === agent.agentId ? null : agent)}
    >
      <View style={styles.agentHeader}>
        <View style={styles.agentInfo}>
          <View style={styles.agentAvatar}>
            <Ionicons name="person" size={24} color={COLORS.PRIMARY} />
          </View>
          <View style={styles.agentDetails}>
            <Text style={styles.agentName}>{agent.agentName}</Text>
            <Text style={styles.agentId}>ID: {agent.agentId}</Text>
          </View>
        </View>
        
        <View style={styles.statusContainer}>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(agent.status) }]}>
            <Ionicons name={getStatusIcon(agent.status)} size={16} color={COLORS.WHITE} />
          </View>
          <Text style={[styles.statusText, { color: getStatusColor(agent.status) }]}>
            {agent.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.locationInfo}>
        <View style={styles.locationRow}>
          <Ionicons name="location" size={16} color={COLORS.GRAY[500]} />
          <Text style={styles.locationText}>
            {agent.latitude.toFixed(6)}, {agent.longitude.toFixed(6)}
          </Text>
        </View>
        
        <View style={styles.locationRow}>
          <Ionicons name="time" size={16} color={COLORS.GRAY[500]} />
          <Text style={styles.locationText}>
            Last update: {getTimeAgo(agent.lastUpdate)}
          </Text>
        </View>
      </View>

      {selectedAgent?.agentId === agent.agentId && (
        <View style={styles.expandedInfo}>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: COLORS.INFO }]}
              onPress={() => Alert.alert('Map View', 'Map view feature coming soon')}
            >
              <Ionicons name="map" size={16} color={COLORS.WHITE} />
              <Text style={styles.actionButtonText}>View on Map</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: COLORS.WARNING }]}
              onPress={() => Alert.alert('Location History', 'Location history feature coming soon')}
            >
              <Ionicons name="time" size={16} color={COLORS.WHITE} />
              <Text style={styles.actionButtonText}>History</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.detailsSection}>
            <Text style={styles.detailsTitle}>Location Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Latitude:</Text>
              <Text style={styles.detailValue}>{agent.latitude}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Longitude:</Text>
              <Text style={styles.detailValue}>{agent.longitude}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Last Update:</Text>
              <Text style={styles.detailValue}>
                {new Date(agent.lastUpdate).toLocaleString()}
              </Text>
            </View>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  const activeAgents = agentLocations.filter(agent => agent.status === 'active').length;
  const inactiveAgents = agentLocations.filter(agent => agent.status === 'inactive').length;
  const offlineAgents = agentLocations.filter(agent => agent.status === 'offline').length;

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Loading agent locations...</Text>
      </View>
    );
  }

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
        <Text style={styles.headerTitle}>Agent Tracking</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
        >
          <Ionicons name="refresh" size={24} color={COLORS.PRIMARY} />
        </TouchableOpacity>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: `${COLORS.SUCCESS}15` }]}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.SUCCESS} />
          </View>
          <Text style={styles.statNumber}>{activeAgents}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: `${COLORS.GRAY[400]}15` }]}>
            <Ionicons name="pause-circle" size={20} color={COLORS.GRAY[400]} />
          </View>
          <Text style={styles.statNumber}>{inactiveAgents}</Text>
          <Text style={styles.statLabel}>Inactive</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: `${COLORS.SECONDARY}15` }]}>
            <Ionicons name="close-circle" size={20} color={COLORS.SECONDARY} />
          </View>
          <Text style={styles.statNumber}>{offlineAgents}</Text>
          <Text style={styles.statLabel}>Offline</Text>
        </View>
      </View>

      {/* Agents List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Agent Locations</Text>
          <Text style={styles.listSubtitle}>
            {agentLocations.length} agents • Auto-refresh every 30s
          </Text>
        </View>

        {agentLocations.length > 0 ? (
          agentLocations.map(renderAgentCard)
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={48} color={COLORS.GRAY[400]} />
            <Text style={styles.emptyText}>No agent locations available</Text>
            <Text style={styles.emptySubtext}>
              Agents will appear here when they start tracking
            </Text>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      <AdminBottomNavbar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.GRAY[100],
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.GRAY[600],
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SIZES.PADDING,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY[200],
    paddingTop: 50,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.DARK,
  },
  refreshButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.WHITE,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY[200],
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.DARK,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.GRAY[600],
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: SIZES.PADDING,
  },
  listHeader: {
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.DARK,
    marginBottom: 4,
  },
  listSubtitle: {
    fontSize: 14,
    color: COLORS.GRAY[600],
  },
  agentCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.BORDER_RADIUS,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  agentCardSelected: {
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
  },
  agentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  agentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  agentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.PRIMARY}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  agentDetails: {
    flex: 1,
  },
  agentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.DARK,
    marginBottom: 2,
  },
  agentId: {
    fontSize: 12,
    color: COLORS.GRAY[500],
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  locationInfo: {
    paddingLeft: 52,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 12,
    color: COLORS.GRAY[600],
    marginLeft: 8,
  },
  expandedInfo: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY[200],
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: SIZES.BORDER_RADIUS,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  detailsSection: {
    backgroundColor: COLORS.GRAY[100],
    borderRadius: SIZES.BORDER_RADIUS,
    padding: 12,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.DARK,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.GRAY[600],
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 12,
    color: COLORS.DARK,
    fontFamily: 'monospace',
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
  bottomPadding: {
    height: 100,
  },
});

export default AdminTrackingScreen;
