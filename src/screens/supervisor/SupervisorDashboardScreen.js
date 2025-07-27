import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants';
import SupervisorBottomNavbar from '../../components/SupervisorBottomNavbar';
import { useAuth } from '../../store/AuthContext';

const { width } = Dimensions.get('window');

const SupervisorDashboardScreen = ({ navigation }) => {
  const { user, apiService } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await apiService.request('/supervisor/dashboard');
      
      if (response.success) {
        setDashboardData(response.data);
      } else {
        Alert.alert('Error', 'Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Dashboard load error:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const stats = dashboardData?.stats || {
    totalAgents: 0,
    activeAgents: 0,
    pendingReports: 0,
    activeAlerts: 0,
    todaySchedules: 0,
    completedShifts: 0,
  };

  const quickActions = [
    {
      id: 'track-agents',
      title: 'Track Agents',
      icon: 'location',
      color: COLORS.PRIMARY,
      onPress: () => navigation.navigate('SupervisorTracking'),
    },
    {
      id: 'validate-reports',
      title: 'Validate Reports',
      icon: 'checkmark-circle',
      color: COLORS.SUCCESS,
      badge: stats.pendingReports > 0 ? stats.pendingReports : null,
      onPress: () => navigation.navigate('SupervisorReports'),
    },
    {
      id: 'manage-team',
      title: 'Manage Team',
      icon: 'people',
      color: COLORS.INFO,
      onPress: () => navigation.navigate('SupervisorTeam'),
    },
    {
      id: 'view-analytics',
      title: 'View Analytics',
      icon: 'bar-chart',
      color: COLORS.WARNING,
      onPress: () => navigation.navigate('SupervisorAnalytics'),
    },
  ];

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.greeting}>
              {getGreeting()}, {user?.firstName || 'Supervisor'}!
            </Text>
            <Text style={styles.subtitle}>Team Management Overview</Text>
          </View>
          <View style={styles.profileSection}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={24} color={COLORS.WHITE} />
            </View>
            <View style={styles.supervisorBadge}>
              <Text style={styles.supervisorText}>SUPERVISOR</Text>
            </View>
          </View>
        </View>

        {/* Team Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Team Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: `${COLORS.PRIMARY}15` }]}>
                <Ionicons name="people" size={24} color={COLORS.PRIMARY} />
              </View>
              <Text style={styles.statNumber}>{stats.totalAgents}</Text>
              <Text style={styles.statLabel}>Total Agents</Text>
              <Text style={styles.statSubtext}>{stats.activeAgents} active</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: `${COLORS.SUCCESS}15` }]}>
                <Ionicons name="checkmark-circle" size={24} color={COLORS.SUCCESS} />
              </View>
              <Text style={styles.statNumber}>{stats.completedShifts}</Text>
              <Text style={styles.statLabel}>Completed Shifts</Text>
              <Text style={styles.statSubtext}>Today</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: `${COLORS.WARNING}15` }]}>
                <Ionicons name="document-text" size={24} color={COLORS.WARNING} />
              </View>
              <Text style={styles.statNumber}>{stats.pendingReports}</Text>
              <Text style={styles.statLabel}>Pending Reports</Text>
              <Text style={styles.statSubtext}>Need validation</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: `${COLORS.SECONDARY}15` }]}>
                <Ionicons name="alert-circle" size={24} color={COLORS.SECONDARY} />
              </View>
              <Text style={styles.statNumber}>{stats.activeAlerts}</Text>
              <Text style={styles.statLabel}>Active Alerts</Text>
              <Text style={styles.statSubtext}>Require attention</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[styles.actionCard, { backgroundColor: `${action.color}15` }]}
                onPress={action.onPress}
              >
                <View style={styles.actionIconContainer}>
                  <Ionicons name={action.icon} size={28} color={action.color} />
                  {action.badge && (
                    <View style={styles.actionBadge}>
                      <Text style={styles.actionBadgeText}>{action.badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.actionText, { color: action.color }]}>
                  {action.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Team Status */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Team Status</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SupervisorTeam')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.teamList}>
            {dashboardData?.teamStatus?.map((member) => (
              <View key={member.agentId} style={styles.teamCard}>
                <View style={styles.teamMemberInfo}>
                  <View style={styles.teamAvatar}>
                    <Ionicons name="person" size={20} color={COLORS.PRIMARY} />
                  </View>
                  <View style={styles.teamDetails}>
                    <Text style={styles.teamName}>{member.agentName}</Text>
                    <Text style={styles.teamLocation}>
                      {member.schedule?.siteName || 'No assignment'}
                    </Text>
                  </View>
                </View>
                <View style={styles.teamStatus}>
                  <View style={[styles.statusDot, { 
                    backgroundColor: getStatusColor(member.status) 
                  }]} />
                  <Text style={[styles.statusText, { 
                    color: getStatusColor(member.status) 
                  }]}>
                    {getStatusLabel(member.status)}
                  </Text>
                </View>
              </View>
            )) || (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color={COLORS.GRAY[400]} />
                <Text style={styles.emptyText}>No team members found</Text>
              </View>
            )}
          </View>
        </View>

        {/* Recent Reports */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Reports</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SupervisorReports')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.reportsList}>
            {dashboardData?.recentReports?.slice(0, 3).map((report) => (
              <View key={report.id} style={styles.reportCard}>
                <View style={styles.reportHeader}>
                  <View style={styles.reportInfo}>
                    <Text style={styles.reportTitle}>{report.title}</Text>
                    <Text style={styles.reportAgent}>By: {report.agentName}</Text>
                  </View>
                  <View style={[styles.reportStatus, { 
                    backgroundColor: getReportStatusColor(report.status) 
                  }]}>
                    <Text style={styles.reportStatusText}>
                      {report.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.reportTime}>
                  {new Date(report.createdAt).toLocaleDateString()}
                </Text>
              </View>
            )) || (
              <View style={styles.emptyState}>
                <Ionicons name="document-outline" size={48} color={COLORS.GRAY[400]} />
                <Text style={styles.emptyText}>No recent reports</Text>
              </View>
            )}
          </View>
        </View>

        {/* Active Alerts */}
        {dashboardData?.activeAlerts && dashboardData.activeAlerts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Alerts</Text>
            <View style={styles.alertsList}>
              {dashboardData.activeAlerts.map((alert) => (
                <View key={alert.id} style={styles.alertCard}>
                  <View style={styles.alertIcon}>
                    <Ionicons 
                      name="alert-circle" 
                      size={20} 
                      color={getAlertColor(alert.severity)} 
                    />
                  </View>
                  <View style={styles.alertContent}>
                    <Text style={styles.alertTitle}>{alert.title}</Text>
                    <Text style={styles.alertMessage}>{alert.message}</Text>
                    <Text style={styles.alertTime}>
                      {new Date(alert.createdAt).toLocaleTimeString()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      <SupervisorBottomNavbar />
    </View>
  );
};

const getStatusColor = (status) => {
  switch (status) {
    case 'active': return COLORS.SUCCESS;
    case 'off_duty': return COLORS.GRAY[400];
    case 'break': return COLORS.WARNING;
    default: return COLORS.GRAY[400];
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case 'active': return 'On Duty';
    case 'off_duty': return 'Off Duty';
    case 'break': return 'On Break';
    default: return 'Unknown';
  }
};

const getReportStatusColor = (status) => {
  switch (status) {
    case 'submitted': return COLORS.WARNING;
    case 'validated': return COLORS.SUCCESS;
    case 'rejected': return COLORS.SECONDARY;
    default: return COLORS.GRAY[400];
  }
};

const getAlertColor = (severity) => {
  switch (severity) {
    case 'high': return COLORS.SECONDARY;
    case 'medium': return COLORS.WARNING;
    case 'low': return COLORS.INFO;
    default: return COLORS.GRAY[400];
  }
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
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: COLORS.PRIMARY,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: SIZES.PADDING,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  profileSection: {
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  supervisorBadge: {
    backgroundColor: COLORS.WARNING,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  supervisorText: {
    color: COLORS.WHITE,
    fontSize: 10,
    fontWeight: 'bold',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.BORDER_RADIUS,
    padding: 16,
    width: (width - SIZES.PADDING * 3) / 2,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.DARK,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.GRAY[600],
    marginBottom: 2,
  },
  statSubtext: {
    fontSize: 12,
    color: COLORS.GRAY[500],
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: (width - SIZES.PADDING * 3) / 2,
    borderRadius: SIZES.BORDER_RADIUS,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionIconContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  actionBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.SECONDARY,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  actionBadgeText: {
    color: COLORS.WHITE,
    fontSize: 10,
    fontWeight: 'bold',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  teamList: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.BORDER_RADIUS,
    padding: 16,
  },
  teamCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY[200],
  },
  teamMemberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  teamAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.PRIMARY}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  teamDetails: {
    flex: 1,
  },
  teamName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.DARK,
    marginBottom: 2,
  },
  teamLocation: {
    fontSize: 12,
    color: COLORS.GRAY[600],
  },
  teamStatus: {
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
  reportsList: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.BORDER_RADIUS,
    padding: 16,
  },
  reportCard: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY[200],
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.DARK,
    marginBottom: 2,
  },
  reportAgent: {
    fontSize: 12,
    color: COLORS.GRAY[600],
  },
  reportStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  reportStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  reportTime: {
    fontSize: 12,
    color: COLORS.GRAY[500],
  },
  alertsList: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.BORDER_RADIUS,
    padding: 16,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY[200],
  },
  alertIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.DARK,
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 12,
    color: COLORS.GRAY[600],
    marginBottom: 4,
  },
  alertTime: {
    fontSize: 10,
    color: COLORS.GRAY[500],
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.GRAY[600],
    marginTop: 8,
  },
  schedulesList: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.BORDER_RADIUS,
    padding: 16,
  },
  scheduleCard: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY[200],
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleAgent: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.DARK,
    marginBottom: 2,
  },
  scheduleSite: {
    fontSize: 12,
    color: COLORS.GRAY[600],
  },
  scheduleTime: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 12,
    color: COLORS.PRIMARY,
    fontWeight: '500',
  },
  scheduleStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomPadding: {
    height: 100,
  },
});

export default SupervisorDashboardScreen;
