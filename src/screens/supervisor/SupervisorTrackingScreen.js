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
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants';
import SupervisorBottomNavbar from '../../components/SupervisorBottomNavbar';
import { useAuth } from '../../store/AuthContext';

const SupervisorTrackingScreen = ({ navigation }) => {
  const { apiService } = useAuth();
  const [agentLocations, setAgentLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [selectedView, setSelectedView] = useState('list'); // 'list' or 'map'

  useEffect(() => {
    loadAgentLocations();
    
    // Set up real-time updates
    let interval;
    if (realTimeEnabled) {
      interval = setInterval(loadAgentLocations, 30000); // Update every 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [realTimeEnabled]);

  const loadAgentLocations = async () => {
    try {
      if (!refreshing) setLoading(true);
      
      const response = await apiService.request('/supervisor/tracking/agents');
      
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

  const getLocationStatus = (location) => {
    const lastUpdate = new Date(location.timestamp);
    const now = new Date();
    const minutesAgo = Math.floor((now - lastUpdate) / (1000 * 60));
    
    if (minutesAgo < 5) return { status: 'online', text: 'Online', color: COLORS.SUCCESS };
    if (minutesAgo < 15) return { status: 'recent', text: `${minutesAgo}m ago`, color: COLORS.WARNING };
    return { status: 'offline', text: 'Offline', color: COLORS.GRAY[500] };
  };

  const getBatteryColor = (battery) => {
    if (battery > 50) return COLORS.SUCCESS;
    if (battery > 20) return COLORS.WARNING;
    return COLORS.SECONDARY;
  };

  const getDistanceFromSite = (agentLat, agentLng, siteLat, siteLng) => {
    // Convert Decimal types to numbers
    const lat1 = Number(agentLat);
    const lng1 = Number(agentLng);
    const lat2 = Number(siteLat);
    const lng2 = Number(siteLng);

    // Simple distance calculation (in meters)
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lng2-lng1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return Math.round(R * c);
  };

  const renderAgentCard = (location) => {
    const locationStatus = getLocationStatus(location);
    const distance = location.siteLocation ? 
      getDistanceFromSite(
        location.latitude, 
        location.longitude, 
        location.siteLocation.latitude, 
        location.siteLocation.longitude
      ) : null;

    return (
      <TouchableOpacity
        key={location.agentId}
        style={styles.agentCard}
        onPress={() => navigation.navigate('SupervisorAgentDetails', { agentId: location.agentId })}
      >
        <View style={styles.agentHeader}>
          <View style={styles.agentInfo}>
            <View style={styles.agentAvatar}>
              <Ionicons name="person" size={20} color={COLORS.PRIMARY} />
            </View>
            <View style={styles.agentDetails}>
              <Text style={styles.agentName}>{location.agentName}</Text>
              <Text style={styles.assignedSite}>{location.assignedSite}</Text>
            </View>
          </View>
          
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: locationStatus.color }]} />
            <Text style={[styles.statusText, { color: locationStatus.color }]}>
              {locationStatus.text}
            </Text>
          </View>
        </View>

        <View style={styles.locationMetrics}>
          <View style={styles.metric}>
            <Ionicons name="location" size={16} color={COLORS.GRAY[500]} />
            <Text style={styles.metricText}>
              {location.latitude ? Number(location.latitude).toFixed(4) : '0.0000'}, {location.longitude ? Number(location.longitude).toFixed(4) : '0.0000'}
            </Text>
          </View>
          
          {distance !== null && (
            <View style={styles.metric}>
              <Ionicons name="navigate" size={16} color={COLORS.GRAY[500]} />
              <Text style={styles.metricText}>
                {distance < 1000 ? `${distance}m` : `${(distance/1000).toFixed(1)}km`} from site
              </Text>
            </View>
          )}
          
          <View style={styles.metric}>
            <Ionicons name="speedometer" size={16} color={COLORS.GRAY[500]} />
            <Text style={styles.metricText}>
              {location.speed ? `${location.speed} km/h` : 'Stationary'}
            </Text>
          </View>
        </View>

        <View style={styles.agentFooter}>
          <View style={styles.batteryInfo}>
            <Ionicons 
              name="battery-half" 
              size={16} 
              color={getBatteryColor(location.battery)} 
            />
            <Text style={[styles.batteryText, { color: getBatteryColor(location.battery) }]}>
              {location.battery}%
            </Text>
          </View>
          
          <View style={styles.accuracyInfo}>
            <Ionicons name="radio" size={16} color={COLORS.GRAY[500]} />
            <Text style={styles.accuracyText}>±{location.accuracy}m</Text>
          </View>
          
          <Text style={styles.lastUpdate}>
            Updated: {new Date(location.timestamp).toLocaleTimeString()}
          </Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: COLORS.INFO }]}
            onPress={() => Alert.alert('Feature', 'View location history feature coming soon')}
          >
            <Ionicons name="time" size={16} color={COLORS.WHITE} />
            <Text style={styles.actionButtonText}>History</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: COLORS.PRIMARY }]}
            onPress={() => Alert.alert('Feature', 'Send message feature coming soon')}
          >
            <Ionicons name="chatbubble" size={16} color={COLORS.WHITE} />
            <Text style={styles.actionButtonText}>Message</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

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

      {/* Controls */}
      <View style={styles.controlsSection}>
        <View style={styles.realTimeToggle}>
          <Text style={styles.toggleLabel}>Real-time Updates</Text>
          <Switch
            value={realTimeEnabled}
            onValueChange={setRealTimeEnabled}
            trackColor={{ false: COLORS.GRAY[300], true: COLORS.PRIMARY }}
            thumbColor={realTimeEnabled ? COLORS.WHITE : COLORS.GRAY[500]}
          />
        </View>
        
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[
              styles.viewButton,
              selectedView === 'list' && styles.viewButtonActive
            ]}
            onPress={() => setSelectedView('list')}
          >
            <Ionicons 
              name="list" 
              size={20} 
              color={selectedView === 'list' ? COLORS.WHITE : COLORS.GRAY[600]} 
            />
            <Text style={[
              styles.viewButtonText,
              selectedView === 'list' && styles.viewButtonTextActive
            ]}>
              List
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.viewButton,
              selectedView === 'map' && styles.viewButtonActive
            ]}
            onPress={() => {
              setSelectedView('map');
              Alert.alert('Feature', 'Map view feature coming soon');
            }}
          >
            <Ionicons 
              name="map" 
              size={20} 
              color={selectedView === 'map' ? COLORS.WHITE : COLORS.GRAY[600]} 
            />
            <Text style={[
              styles.viewButtonText,
              selectedView === 'map' && styles.viewButtonTextActive
            ]}>
              Map
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Overview Stats */}
      <View style={styles.overviewSection}>
        <View style={styles.overviewCard}>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewNumber}>{agentLocations.length}</Text>
            <Text style={styles.overviewLabel}>Total Agents</Text>
          </View>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewNumber}>
              {agentLocations.filter(loc => getLocationStatus(loc).status === 'online').length}
            </Text>
            <Text style={styles.overviewLabel}>Online</Text>
          </View>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewNumber}>
              {agentLocations.filter(loc => loc.assignedSite !== 'No assignment').length}
            </Text>
            <Text style={styles.overviewLabel}>On Duty</Text>
          </View>
        </View>
      </View>

      {/* Agent List */}
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
            Real-time tracking {realTimeEnabled ? 'enabled' : 'disabled'}
          </Text>
        </View>

        {agentLocations.length > 0 ? (
          agentLocations.map(renderAgentCard)
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={48} color={COLORS.GRAY[400]} />
            <Text style={styles.emptyText}>No agent locations found</Text>
            <Text style={styles.emptySubtext}>
              Agents need to enable location sharing
            </Text>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      <SupervisorBottomNavbar />
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
  controlsSection: {
    backgroundColor: COLORS.WHITE,
    padding: SIZES.PADDING,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY[200],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  realTimeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 14,
    color: COLORS.DARK,
    marginRight: 12,
    fontWeight: '500',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.GRAY[100],
    borderRadius: 20,
    padding: 2,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
  },
  viewButtonActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  viewButtonText: {
    fontSize: 12,
    color: COLORS.GRAY[600],
    marginLeft: 4,
    fontWeight: '500',
  },
  viewButtonTextActive: {
    color: COLORS.WHITE,
  },
  overviewSection: {
    backgroundColor: COLORS.WHITE,
    padding: SIZES.PADDING,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY[200],
  },
  overviewCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  overviewItem: {
    alignItems: 'center',
  },
  overviewNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: 4,
  },
  overviewLabel: {
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
    marginBottom: 16,
    elevation: 2,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  assignedSite: {
    fontSize: 14,
    color: COLORS.GRAY[600],
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  locationMetrics: {
    marginBottom: 12,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metricText: {
    fontSize: 12,
    color: COLORS.GRAY[600],
    marginLeft: 8,
  },
  agentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY[200],
  },
  batteryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  batteryText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  accuracyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accuracyText: {
    fontSize: 12,
    color: COLORS.GRAY[500],
    marginLeft: 4,
  },
  lastUpdate: {
    fontSize: 10,
    color: COLORS.GRAY[500],
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
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

export default SupervisorTrackingScreen;
