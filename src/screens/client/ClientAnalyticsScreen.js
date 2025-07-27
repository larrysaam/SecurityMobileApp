import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants';
import ClientBottomNavbar from '../../components/ClientBottomNavbar';
import { useAuth } from '../../store/AuthContext';

const { width } = Dimensions.get('window');

const ClientAnalyticsScreen = ({ navigation }) => {
  const { apiService } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    try {
      if (!refreshing) setLoading(true);
      
      const response = await apiService.request(`/client/overview?period=${selectedPeriod}`);
      
      if (response.success) {
        setAnalytics(response.data);
      } else {
        Alert.alert('Error', 'Failed to load analytics');
      }
    } catch (error) {
      console.error('Load analytics error:', error);
      Alert.alert('Error', 'Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
  };

  const periods = [
    { id: '7d', label: '7 Days' },
    { id: '30d', label: '30 Days' },
    { id: '90d', label: '90 Days' },
    { id: '1y', label: '1 Year' },
  ];

  const renderMetricCard = (title, value, subtitle, icon, color) => (
    <View style={[styles.metricCard, { borderLeftColor: color }]}>
      <View style={styles.metricHeader}>
        <View style={[styles.metricIcon, { backgroundColor: `${color}15` }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <Text style={styles.metricTitle}>{title}</Text>
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricSubtitle}>{subtitle}</Text>
    </View>
  );

  const renderPerformanceCard = (site) => (
    <View key={site.siteId} style={styles.performanceCard}>
      <View style={styles.performanceHeader}>
        <Text style={styles.siteName}>{site.siteName}</Text>
        <View style={[styles.statusIndicator, { 
          backgroundColor: site.status === 'secure' ? COLORS.SUCCESS : COLORS.WARNING 
        }]}>
          <Text style={styles.statusText}>{site.status.toUpperCase()}</Text>
        </View>
      </View>
      
      <View style={styles.performanceMetrics}>
        <View style={styles.performanceMetric}>
          <Text style={styles.performanceLabel}>Coverage Hours</Text>
          <Text style={styles.performanceValue}>{site.coverageHours}h</Text>
        </View>
        <View style={styles.performanceMetric}>
          <Text style={styles.performanceLabel}>Incidents</Text>
          <Text style={styles.performanceValue}>{site.incidentCount}</Text>
        </View>
        <View style={styles.performanceMetric}>
          <Text style={styles.performanceLabel}>Last Patrol</Text>
          <Text style={styles.performanceValue}>
            {new Date(site.lastPatrol).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Loading analytics...</Text>
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
        <Text style={styles.headerTitle}>Service Analytics</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
        >
          <Ionicons name="refresh" size={24} color={COLORS.PRIMARY} />
        </TouchableOpacity>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period.id}
              style={[
                styles.periodButton,
                selectedPeriod === period.id && styles.periodButtonActive
              ]}
              onPress={() => setSelectedPeriod(period.id)}
            >
              <Text style={[
                styles.periodText,
                selectedPeriod === period.id && styles.periodTextActive
              ]}>
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Key Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Performance Metrics</Text>
          <View style={styles.metricsGrid}>
            {renderMetricCard(
              'Service Hours',
              analytics?.totalServiceHours || '0',
              'Total coverage time',
              'time',
              COLORS.PRIMARY
            )}
            {renderMetricCard(
              'Incidents',
              analytics?.incidentCount || '0',
              'Security incidents',
              'alert-circle',
              COLORS.SECONDARY
            )}
            {renderMetricCard(
              'Reports',
              analytics?.reportCount || '0',
              'Security reports',
              'document-text',
              COLORS.INFO
            )}
            {renderMetricCard(
              'Response Time',
              analytics?.averageResponseTime || '0 min',
              'Average response',
              'speedometer',
              COLORS.SUCCESS
            )}
          </View>
        </View>

        {/* Service Quality */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Quality</Text>
          <View style={styles.qualityCard}>
            <View style={styles.qualityMetric}>
              <Text style={styles.qualityLabel}>Service Uptime</Text>
              <Text style={[styles.qualityValue, { color: COLORS.SUCCESS }]}>
                {analytics?.serviceUptime || '99.0%'}
              </Text>
            </View>
            <View style={styles.qualityMetric}>
              <Text style={styles.qualityLabel}>Client Satisfaction</Text>
              <View style={styles.ratingContainer}>
                <Text style={[styles.qualityValue, { color: COLORS.WARNING }]}>
                  {analytics?.clientSatisfaction || '4.5'}
                </Text>
                <View style={styles.stars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={star <= (analytics?.clientSatisfaction || 4.5) ? 'star' : 'star-outline'}
                      size={16}
                      color={COLORS.WARNING}
                    />
                  ))}
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Weekly Trends */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Trends</Text>
          <View style={styles.trendsCard}>
            {analytics?.weeklyStats?.map((week, index) => (
              <View key={index} style={styles.weekRow}>
                <Text style={styles.weekLabel}>{week.week}</Text>
                <View style={styles.weekMetrics}>
                  <View style={styles.weekMetric}>
                    <Text style={styles.weekMetricValue}>{week.serviceHours}h</Text>
                    <Text style={styles.weekMetricLabel}>Service</Text>
                  </View>
                  <View style={styles.weekMetric}>
                    <Text style={styles.weekMetricValue}>{week.incidents}</Text>
                    <Text style={styles.weekMetricLabel}>Incidents</Text>
                  </View>
                  <View style={styles.weekMetric}>
                    <Text style={styles.weekMetricValue}>{week.reports}</Text>
                    <Text style={styles.weekMetricLabel}>Reports</Text>
                  </View>
                </View>
              </View>
            )) || (
              <Text style={styles.noDataText}>No trend data available</Text>
            )}
          </View>
        </View>

        {/* Site Performance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Site Performance</Text>
          <View style={styles.performanceList}>
            {analytics?.sitePerformance?.map(renderPerformanceCard) || (
              <Text style={styles.noDataText}>No site performance data available</Text>
            )}
          </View>
        </View>

        {/* Export Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export Reports</Text>
          <View style={styles.exportOptions}>
            <TouchableOpacity
              style={[styles.exportButton, { backgroundColor: `${COLORS.INFO}15` }]}
              onPress={() => Alert.alert('Export', 'PDF export feature coming soon')}
            >
              <Ionicons name="document" size={24} color={COLORS.INFO} />
              <Text style={[styles.exportText, { color: COLORS.INFO }]}>Export PDF</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.exportButton, { backgroundColor: `${COLORS.SUCCESS}15` }]}
              onPress={() => Alert.alert('Export', 'Excel export feature coming soon')}
            >
              <Ionicons name="grid" size={24} color={COLORS.SUCCESS} />
              <Text style={[styles.exportText, { color: COLORS.SUCCESS }]}>Export Excel</Text>
            </TouchableOpacity>
          </View>
        </View>

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
  periodSection: {
    backgroundColor: COLORS.WHITE,
    paddingVertical: 12,
    paddingHorizontal: SIZES.PADDING,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY[200],
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.GRAY[200],
    marginRight: 8,
  },
  periodButtonActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  periodText: {
    fontSize: 14,
    color: COLORS.GRAY[600],
    fontWeight: '500',
  },
  periodTextActive: {
    color: COLORS.WHITE,
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
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.BORDER_RADIUS,
    padding: 16,
    width: (width - SIZES.PADDING * 3) / 2,
    marginBottom: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.DARK,
    flex: 1,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.DARK,
    marginBottom: 4,
  },
  metricSubtitle: {
    fontSize: 12,
    color: COLORS.GRAY[600],
  },
  qualityCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.BORDER_RADIUS,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  qualityMetric: {
    alignItems: 'center',
  },
  qualityLabel: {
    fontSize: 14,
    color: COLORS.GRAY[600],
    marginBottom: 8,
  },
  qualityValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  ratingContainer: {
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
    marginTop: 4,
  },
  trendsCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.BORDER_RADIUS,
    padding: 16,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY[200],
  },
  weekLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.DARK,
    width: 80,
  },
  weekMetrics: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-around',
  },
  weekMetric: {
    alignItems: 'center',
  },
  weekMetricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.DARK,
  },
  weekMetricLabel: {
    fontSize: 10,
    color: COLORS.GRAY[500],
    marginTop: 2,
  },
  performanceList: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.BORDER_RADIUS,
  },
  performanceCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY[200],
  },
  performanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  siteName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.DARK,
    flex: 1,
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  performanceMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  performanceMetric: {
    alignItems: 'center',
  },
  performanceLabel: {
    fontSize: 12,
    color: COLORS.GRAY[600],
    marginBottom: 4,
  },
  performanceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.DARK,
  },
  exportOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  exportButton: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    borderRadius: SIZES.BORDER_RADIUS,
    marginHorizontal: 8,
  },
  exportText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  noDataText: {
    fontSize: 14,
    color: COLORS.GRAY[500],
    textAlign: 'center',
    padding: 20,
  },
  bottomPadding: {
    height: 100,
  },
});

export default ClientAnalyticsScreen;
