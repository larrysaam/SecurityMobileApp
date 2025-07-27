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
import ClientBottomNavbar from '../../components/ClientBottomNavbar';
import { useAuth } from '../../store/AuthContext';

const { width } = Dimensions.get('window');

const ClientDashboardScreen = ({ navigation }) => {
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
      const response = await apiService.request('/client/dashboard');
      
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
    totalSites: 0,
    activeSites: 0,
    totalReports: 0,
    pendingReports: 0,
    unreadNotifications: 0,
    activeAgents: 0,
  };

  const quickActions = [
    {
      id: 'view-sites',
      title: 'View Sites',
      icon: 'business',
      color: COLORS.PRIMARY,
      onPress: () => navigation.navigate('ClientSites'),
    },
    {
      id: 'recent-reports',
      title: 'Recent Reports',
      icon: 'document-text',
      color: COLORS.INFO,
      onPress: () => navigation.navigate('ClientReports'),
    },
    {
      id: 'send-message',
      title: 'Contact Security',
      icon: 'chatbubbles',
      color: COLORS.SUCCESS,
      onPress: () => navigation.navigate('ClientCommunication'),
    },
    {
      id: 'view-analytics',
      title: 'View Analytics',
      icon: 'analytics',
      color: COLORS.WARNING,
      onPress: () => navigation.navigate('ClientAnalytics'),
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
              {getGreeting()}, {user?.firstName || 'Client'}!
            </Text>
            <Text style={styles.subtitle}>Security Service Overview</Text>
          </View>
          <View style={styles.profileSection}>
            <View style={styles.avatar}>
              <Ionicons name="business" size={24} color={COLORS.WHITE} />
            </View>
            <View style={styles.clientBadge}>
              <Text style={styles.clientText}>CLIENT</Text>
            </View>
          </View>
        </View>

        {/* Service Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: `${COLORS.PRIMARY}15` }]}>
                <Ionicons name="business" size={24} color={COLORS.PRIMARY} />
              </View>
              <Text style={styles.statNumber}>{stats.totalSites}</Text>
              <Text style={styles.statLabel}>Total Sites</Text>
              <Text style={styles.statSubtext}>{stats.activeSites} active</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: `${COLORS.SUCCESS}15` }]}>
                <Ionicons name="people" size={24} color={COLORS.SUCCESS} />
              </View>
              <Text style={styles.statNumber}>{stats.activeAgents}</Text>
              <Text style={styles.statLabel}>Active Agents</Text>
              <Text style={styles.statSubtext}>On duty now</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: `${COLORS.INFO}15` }]}>
                <Ionicons name="document-text" size={24} color={COLORS.INFO} />
              </View>
              <Text style={styles.statNumber}>{stats.totalReports}</Text>
              <Text style={styles.statLabel}>Reports</Text>
              <Text style={styles.statSubtext}>{stats.pendingReports} pending</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: `${COLORS.WARNING}15` }]}>
                <Ionicons name="notifications" size={24} color={COLORS.WARNING} />
              </View>
              <Text style={styles.statNumber}>{stats.unreadNotifications}</Text>
              <Text style={styles.statLabel}>Notifications</Text>
              <Text style={styles.statSubtext}>Unread</Text>
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
                <Ionicons name={action.icon} size={28} color={action.color} />
                <Text style={[styles.actionText, { color: action.color }]}>
                  {action.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Reports */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Reports</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ClientReports')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.reportsList}>
            {dashboardData?.recentReports?.slice(0, 3).map((report) => (
              <View key={report.id} style={styles.reportCard}>
                <View style={styles.reportHeader}>
                  <View style={styles.reportInfo}>
                    <Text style={styles.reportTitle}>{report.title}</Text>
                    <Text style={styles.reportSite}>{report.siteName}</Text>
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

        {/* Current Agents */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Agents on Duty</Text>
          <View style={styles.agentsList}>
            {dashboardData?.currentAgents?.map((agent, index) => (
              <View key={index} style={styles.agentCard}>
                <View style={styles.agentAvatar}>
                  <Ionicons name="person" size={20} color={COLORS.PRIMARY} />
                </View>
                <View style={styles.agentInfo}>
                  <Text style={styles.agentName}>{agent.agentName}</Text>
                  <Text style={styles.agentSite}>{agent.siteName}</Text>
                </View>
                <View style={styles.agentStatus}>
                  <View style={[styles.statusDot, { backgroundColor: COLORS.SUCCESS }]} />
                  <Text style={styles.statusText}>On Duty</Text>
                </View>
              </View>
            )) || (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color={COLORS.GRAY[400]} />
                <Text style={styles.emptyText}>No agents currently on duty</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <ClientBottomNavbar />
    </View>
  );
};

const getReportStatusColor = (status) => {
  switch (status) {
    case 'submitted': return COLORS.WARNING;
    case 'validated': return COLORS.SUCCESS;
    case 'pending': return COLORS.INFO;
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
  clientBadge: {
    backgroundColor: COLORS.SUCCESS,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  clientText: {
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
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
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
  reportSite: {
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
  agentsList: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.BORDER_RADIUS,
    padding: 16,
  },
  agentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY[200],
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
  agentInfo: {
    flex: 1,
  },
  agentName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.DARK,
    marginBottom: 2,
  },
  agentSite: {
    fontSize: 12,
    color: COLORS.GRAY[600],
  },
  agentStatus: {
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
    color: COLORS.SUCCESS,
    fontWeight: '500',
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
  bottomPadding: {
    height: 100,
  },
});

export default ClientDashboardScreen;
