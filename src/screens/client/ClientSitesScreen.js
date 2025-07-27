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
import ClientBottomNavbar from '../../components/ClientBottomNavbar';
import { useAuth } from '../../store/AuthContext';

const ClientSitesScreen = ({ navigation }) => {
  const { apiService } = useAuth();
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      if (!refreshing) setLoading(true);
      
      const response = await apiService.request('/client/sites');
      
      if (response.success) {
        setSites(response.data.sites || []);
      } else {
        Alert.alert('Error', 'Failed to load sites');
      }
    } catch (error) {
      console.error('Load sites error:', error);
      Alert.alert('Error', 'Failed to load sites');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSites();
  };

  const getSecurityStatusColor = (status) => {
    switch (status) {
      case 'secure': return COLORS.SUCCESS;
      case 'alert': return COLORS.SECONDARY;
      case 'warning': return COLORS.WARNING;
      default: return COLORS.GRAY[400];
    }
  };

  const getSecurityStatusIcon = (status) => {
    switch (status) {
      case 'secure': return 'shield-checkmark';
      case 'alert': return 'alert-circle';
      case 'warning': return 'warning';
      default: return 'help-circle';
    }
  };

  const renderSiteCard = (site) => (
    <TouchableOpacity
      key={site.id}
      style={styles.siteCard}
      onPress={() => navigation.navigate('ClientSiteDetails', { siteId: site.id })}
    >
      <View style={styles.siteHeader}>
        <View style={styles.siteInfo}>
          <View style={styles.siteIcon}>
            <Ionicons name="business" size={24} color={COLORS.PRIMARY} />
          </View>
          <View style={styles.siteDetails}>
            <Text style={styles.siteName}>{site.name}</Text>
            <Text style={styles.siteAddress}>{site.address}</Text>
            <Text style={styles.operatingHours}>
              Operating: {site.operatingHours}
            </Text>
          </View>
        </View>
        
        <View style={styles.statusContainer}>
          <View style={[styles.securityStatus, { 
            backgroundColor: getSecurityStatusColor(site.securityStatus) 
          }]}>
            <Ionicons 
              name={getSecurityStatusIcon(site.securityStatus)} 
              size={16} 
              color={COLORS.WHITE} 
            />
          </View>
          <Text style={[styles.statusText, { 
            color: getSecurityStatusColor(site.securityStatus) 
          }]}>
            {site.securityStatus?.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.siteMetrics}>
        <View style={styles.metric}>
          <Ionicons name="shield" size={16} color={COLORS.GRAY[500]} />
          <Text style={styles.metricText}>
            Security Level: {site.securityLevel?.toUpperCase()}
          </Text>
        </View>
        
        {site.currentAgent && (
          <View style={styles.metric}>
            <Ionicons name="person" size={16} color={COLORS.SUCCESS} />
            <Text style={styles.metricText}>
              Agent: {site.currentAgent.name}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.siteFooter}>
        <View style={styles.activityInfo}>
          <Text style={styles.activityLabel}>Recent Activity:</Text>
          <Text style={styles.activityValue}>
            {site.recentActivity} reports
          </Text>
        </View>
        
        {site.lastReport && (
          <Text style={styles.lastReport}>
            Last report: {new Date(site.lastReport).toLocaleDateString()}
          </Text>
        )}
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: COLORS.INFO }]}
          onPress={() => navigation.navigate('ClientSiteActivity', { siteId: site.id })}
        >
          <Ionicons name="pulse" size={16} color={COLORS.WHITE} />
          <Text style={styles.actionButtonText}>Live Activity</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: COLORS.PRIMARY }]}
          onPress={() => navigation.navigate('ClientReports', { siteId: site.id })}
        >
          <Ionicons name="document-text" size={16} color={COLORS.WHITE} />
          <Text style={styles.actionButtonText}>View Reports</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Loading your sites...</Text>
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
        <Text style={styles.headerTitle}>My Sites</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
        >
          <Ionicons name="refresh" size={24} color={COLORS.PRIMARY} />
        </TouchableOpacity>
      </View>

      {/* Sites Overview */}
      <View style={styles.overviewSection}>
        <View style={styles.overviewCard}>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewNumber}>{sites.length}</Text>
            <Text style={styles.overviewLabel}>Total Sites</Text>
          </View>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewNumber}>
              {sites.filter(s => s.securityStatus === 'secure').length}
            </Text>
            <Text style={styles.overviewLabel}>Secure</Text>
          </View>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewNumber}>
              {sites.filter(s => s.currentAgent).length}
            </Text>
            <Text style={styles.overviewLabel}>Agents On Duty</Text>
          </View>
        </View>
      </View>

      {/* Sites List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Your Security Sites</Text>
          <Text style={styles.listSubtitle}>
            {sites.length} sites under security management
          </Text>
        </View>

        {sites.length > 0 ? (
          sites.map(renderSiteCard)
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={48} color={COLORS.GRAY[400]} />
            <Text style={styles.emptyText}>No sites found</Text>
            <Text style={styles.emptySubtext}>
              Contact your security provider to add sites
            </Text>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      <ClientBottomNavbar />
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
  siteCard: {
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
  siteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  siteInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  siteIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${COLORS.PRIMARY}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  siteDetails: {
    flex: 1,
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
    marginBottom: 2,
  },
  operatingHours: {
    fontSize: 12,
    color: COLORS.GRAY[500],
  },
  statusContainer: {
    alignItems: 'center',
  },
  securityStatus: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  siteMetrics: {
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
  siteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY[200],
  },
  activityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityLabel: {
    fontSize: 12,
    color: COLORS.GRAY[600],
    marginRight: 4,
  },
  activityValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.DARK,
  },
  lastReport: {
    fontSize: 12,
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

export default ClientSitesScreen;
