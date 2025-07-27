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
import SupervisorBottomNavbar from '../../components/SupervisorBottomNavbar';
import { useAuth } from '../../store/AuthContext';

const { width } = Dimensions.get('window');

const SupervisorAnalyticsScreen = ({ navigation }) => {
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
      
      const response = await apiService.request(`/supervisor/overview?period=${selectedPeriod}`);
      
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

  const renderPerformanceCard = (agent) => (
    <View key={agent.agentId} style={styles.performanceCard}>
      <View style={styles.performanceHeader}>
        <Text style={styles.agentName}>{agent.agentName}</Text>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={16} color={COLORS.WARNING} />
          <Text style={styles.ratingText}>{agent.averageRating}</Text>
        </View>
      </View>
      
      <View style={styles.performanceMetrics}>
        <View style={styles.performanceMetric}>
          <Text style={styles.performanceLabel}>Attendance</Text>
          <Text style={[styles.performanceValue, { 
            color: agent.attendanceRate >= 90 ? COLORS.SUCCESS : COLORS.WARNING 
          }]}>
            {agent.attendanceRate}%
          </Text>
        </View>
        <View style={styles.performanceMetric}>
          <Text style={styles.performanceLabel}>Reports</Text>
          <Text style={styles.performanceValue}>{agent.reportsSubmitted}</Text>
        </View>
        <View style={styles.performanceMetric}>
          <Text style={styles.performanceLabel}>Last Active</Text>
          <Text style={styles.performanceValue}>
            {new Date(agent.lastActive).toLocaleDateString()}
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
        <Text style={styles.headerTitle}>Team Analytics</Text>
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
          <Text style={styles.sectionTitle}>Team Performance Metrics</Text>
          <View style={styles.metricsGrid}>
            {renderMetricCard(
              'Total Agents',
              analytics?.totalAgents || '0',
              'Team members',
              'people',
              COLORS.PRIMARY
            )}
            {renderMetricCard(
              'Active Today',
              analytics?.activeToday || '0',
              'Currently on duty',
              'checkmark-circle',
              COLORS.SUCCESS
            )}
            {renderMetricCard(
              'Avg Attendance',
              `${analytics?.averageAttendance || '0'}%`,
              'Team attendance rate',
              'calendar',
              COLORS.INFO
            )}
            {renderMetricCard(
              'Total Reports',
              analytics?.totalReports || '0',
              'Reports submitted',
              'document-text',
              COLORS.WARNING
            )}
          </View>
        </View>

        {/* Performance Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Overview</Text>
          <View style={styles.performanceOverview}>
            <View style={styles.performanceItem}>
              <Text style={styles.performanceItemLabel}>On-time Attendance</Text>
              <Text style={[styles.performanceItemValue, { color: COLORS.SUCCESS }]}>
                {analytics?.performanceMetrics?.onTimeAttendance || '0'}%
              </Text>
            </View>
            <View style={styles.performanceItem}>
              <Text style={styles.performanceItemLabel}>Report Quality</Text>
              <View style={styles.ratingContainer}>
                <Text style={[styles.performanceItemValue, { color: COLORS.WARNING }]}>
                  {analytics?.performanceMetrics?.reportQuality || '0'}
                </Text>
                <Ionicons name="star" size={16} color={COLORS.WARNING} />
              </View>
            </View>
            <View style={styles.performanceItem}>
              <Text style={styles.performanceItemLabel}>Response Time</Text>
              <Text style={[styles.performanceItemValue, { color: COLORS.INFO }]}>
                {analytics?.performanceMetrics?.responseTime || '0 min'}
              </Text>
            </View>
            <View style={styles.performanceItem}>
              <Text style={styles.performanceItemLabel}>Client Satisfaction</Text>
              <View style={styles.ratingContainer}>
                <Text style={[styles.performanceItemValue, { color: COLORS.SUCCESS }]}>
                  {analytics?.performanceMetrics?.clientSatisfaction || '0'}
                </Text>
                <Ionicons name="star" size={16} color={COLORS.SUCCESS} />
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
                    <Text style={styles.weekMetricValue}>{week.attendance}%</Text>
                    <Text style={styles.weekMetricLabel}>Attendance</Text>
                  </View>
                  <View style={styles.weekMetric}>
                    <Text style={styles.weekMetricValue}>{week.reports}</Text>
                    <Text style={styles.weekMetricLabel}>Reports</Text>
                  </View>
                  <View style={styles.weekMetric}>
                    <Text style={styles.weekMetricValue}>{week.incidents}</Text>
                    <Text style={styles.weekMetricLabel}>Incidents</Text>
                  </View>
                </View>
              </View>
            )) || (
              <Text style={styles.noDataText}>No trend data available</Text>
            )}
          </View>
        </View>

        {/* Individual Performance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Individual Performance</Text>
          <View style={styles.performanceList}>
            {analytics?.agentPerformance?.map(renderPerformanceCard) || (
              <Text style={styles.noDataText}>No performance data available</Text>
            )}
          </View>
        </View>

        {/* Incident Analysis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Incident Analysis</Text>
          <View style={styles.incidentCard}>
            <View style={styles.incidentStat}>
              <Ionicons name="alert-circle" size={24} color={COLORS.SECONDARY} />
              <View style={styles.incidentInfo}>
                <Text style={styles.incidentNumber}>{analytics?.incidentReports || 0}</Text>
                <Text style={styles.incidentLabel}>Total Incidents</Text>
              </View>
            </View>
            <View style={styles.incidentStat}>
              <Ionicons name="time" size={24} color={COLORS.INFO} />
              <View style={styles.incidentInfo}>
                <Text style={styles.incidentNumber}>
                  {analytics?.performanceMetrics?.responseTime || '0 min'}
                </Text>
                <Text style={styles.incidentLabel}>Avg Response Time</Text>
              </View>
            </View>
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
  performanceOverview: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.BORDER_RADIUS,
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  performanceItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  performanceItemLabel: {
    fontSize: 12,
    color: COLORS.GRAY[600],
    marginBottom: 8,
    textAlign: 'center',
  },
  performanceItemValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  agentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.DARK,
    flex: 1,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.WARNING,
    marginLeft: 4,
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
  incidentCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.BORDER_RADIUS,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  incidentStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  incidentInfo: {
    marginLeft: 12,
    alignItems: 'center',
  },
  incidentNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.DARK,
  },
  incidentLabel: {
    fontSize: 12,
    color: COLORS.GRAY[600],
    marginTop: 2,
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

export default SupervisorAnalyticsScreen;
