import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../store/AuthContext';
import { useApp } from '../../store/AppContext';
import { COLORS, SIZES } from '../../constants';
import { dateUtils } from '../../utils';

const AgentDashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { 
    schedule, 
    currentLocation, 
    loadSchedule, 
    updateCurrentLocation,
    loading 
  } = useApp();
  
  const [refreshing, setRefreshing] = useState(false);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [currentShift, setCurrentShift] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    // Filter today's schedule
    const today = new Date().toDateString();
    const todayItems = schedule.filter(item => 
      new Date(item.date).toDateString() === today
    );
    setTodaySchedule(todayItems);

    // Find current shift
    const now = new Date();
    const current = todayItems.find(item => {
      const startTime = new Date(`${item.date} ${item.startTime}`);
      const endTime = new Date(`${item.date} ${item.endTime}`);
      return now >= startTime && now <= endTime;
    });
    setCurrentShift(current);
  }, [schedule]);

  const loadDashboardData = async () => {
    try {
      await Promise.all([
        loadSchedule({ agentId: user.id }),
        updateCurrentLocation(),
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'checkin':
        if (currentShift) {
          navigation.navigate('Tracking', { screen: 'CheckInOut' });
        } else {
          Alert.alert('No Service', 'You have no scheduled service currently.');
        }
        break;
      case 'report':
        navigation.navigate('Reports', { screen: 'CreateReport' });
        break;
      case 'alert':
        navigation.navigate('Alerts', { screen: 'CreateAlert' });
        break;
      case 'schedule':
        navigation.navigate('Schedule');
        break;
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getShiftStatus = () => {
    if (currentShift) {
      return {
        status: 'On Duty',
        color: COLORS.SUCCESS,
        icon: 'checkmark-circle',
        site: currentShift.siteName,
      };
    }

    const nextShift = todaySchedule.find(item => {
      const startTime = new Date(`${item.date} ${item.startTime}`);
      return startTime > new Date();
    });

    if (nextShift) {
      return {
        status: 'Next Service',
        color: COLORS.WARNING,
        icon: 'time',
        site: nextShift.siteName,
        time: nextShift.startTime,
      };
    }

    return {
      status: 'No Service',
      color: COLORS.GRAY[500],
      icon: 'calendar-outline',
      site: 'Off Duty',
    };
  };

  const shiftStatus = getShiftStatus();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            {getGreeting()}, {user?.firstName}
          </Text>
          <Text style={styles.date}>
            {dateUtils.formatDate(new Date(), 'DD/MM/YYYY')}
          </Text>
        </View>
        <TouchableOpacity style={styles.profileButton}>
          <Ionicons name="person-circle-outline" size={40} color={COLORS.PRIMARY} />
        </TouchableOpacity>
      </View>

      {/* Current Status Card */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Ionicons name={shiftStatus.icon} size={24} color={shiftStatus.color} />
          <Text style={[styles.statusTitle, { color: shiftStatus.color }]}>
            {shiftStatus.status}
          </Text>
        </View>
        <Text style={styles.statusSite}>{shiftStatus.site}</Text>
        {shiftStatus.time && (
          <Text style={styles.statusTime}>
            Start: {shiftStatus.time}
          </Text>
        )}
        {currentLocation && (
          <Text style={styles.locationText}>
            📍 {currentLocation.address}
          </Text>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: COLORS.SUCCESS }]}
            onPress={() => handleQuickAction('checkin')}
          >
            <Ionicons name="location" size={24} color={COLORS.WHITE} />
            <Text style={styles.actionText}>Check In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: COLORS.INFO }]}
            onPress={() => handleQuickAction('report')}
          >
            <Ionicons name="document-text" size={24} color={COLORS.WHITE} />
            <Text style={styles.actionText}>Report</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: COLORS.SECONDARY }]}
            onPress={() => handleQuickAction('alert')}
          >
            <Ionicons name="alert-circle" size={24} color={COLORS.WHITE} />
            <Text style={styles.actionText}>Alert</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: COLORS.PRIMARY }]}
            onPress={() => handleQuickAction('schedule')}
          >
            <Ionicons name="calendar" size={24} color={COLORS.WHITE} />
            <Text style={styles.actionText}>Schedule</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Today's Schedule */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Schedule</Text>
        {todaySchedule.length > 0 ? (
          todaySchedule.map((item, index) => (
            <View key={index} style={styles.scheduleItem}>
              <View style={styles.scheduleTime}>
                <Text style={styles.timeText}>{item.startTime}</Text>
                <Text style={styles.timeText}>-</Text>
                <Text style={styles.timeText}>{item.endTime}</Text>
              </View>
              <View style={styles.scheduleDetails}>
                <Text style={styles.siteName}>{item.siteName}</Text>
                <Text style={styles.siteAddress}>{item.siteAddress}</Text>
              </View>
              <View style={styles.scheduleStatus}>
                <Ionicons
                  name={item.status === 'completed' ? 'checkmark-circle' : 'time-outline'}
                  size={20}
                  color={item.status === 'completed' ? COLORS.SUCCESS : COLORS.WARNING}
                />
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color={COLORS.GRAY[400]} />
            <Text style={styles.emptyText}>No service scheduled today</Text>
          </View>
        )}
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityItem}>
          <Ionicons name="checkmark-circle" size={20} color={COLORS.SUCCESS} />
          <Text style={styles.activityText}>Check-in completed - Site Alpha</Text>
          <Text style={styles.activityTime}>2h ago</Text>
        </View>
        <View style={styles.activityItem}>
          <Ionicons name="document-text" size={20} color={COLORS.INFO} />
          <Text style={styles.activityText}>Patrol report created</Text>
          <Text style={styles.activityTime}>Yesterday 22:30</Text>
        </View>
      </View>
    </ScrollView>
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
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.DARK,
  },
  date: {
    fontSize: 14,
    color: COLORS.GRAY[600],
    marginTop: 2,
  },
  profileButton: {
    padding: 4,
  },
  statusCard: {
    backgroundColor: COLORS.WHITE,
    margin: SIZES.MARGIN,
    padding: SIZES.PADDING,
    borderRadius: SIZES.BORDER_RADIUS,
    elevation: 2,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  statusSite: {
    fontSize: 16,
    color: COLORS.DARK,
    marginBottom: 4,
  },
  statusTime: {
    fontSize: 14,
    color: COLORS.GRAY[600],
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.GRAY[600],
  },
  section: {
    margin: SIZES.MARGIN,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.DARK,
    marginBottom: 12,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: SIZES.BORDER_RADIUS,
    marginHorizontal: 4,
  },
  actionText: {
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  scheduleItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.WHITE,
    padding: SIZES.PADDING,
    borderRadius: SIZES.BORDER_RADIUS,
    marginBottom: 8,
    elevation: 1,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  scheduleTime: {
    alignItems: 'center',
    marginRight: 12,
  },
  timeText: {
    fontSize: 12,
    color: COLORS.GRAY[600],
    fontWeight: '500',
  },
  scheduleDetails: {
    flex: 1,
  },
  siteName: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.DARK,
  },
  siteAddress: {
    fontSize: 14,
    color: COLORS.GRAY[600],
    marginTop: 2,
  },
  scheduleStatus: {
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.BORDER_RADIUS,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.GRAY[500],
    marginTop: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    padding: SIZES.PADDING,
    borderRadius: SIZES.BORDER_RADIUS,
    marginBottom: 8,
  },
  activityText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.DARK,
    marginLeft: 8,
  },
  activityTime: {
    fontSize: 12,
    color: COLORS.GRAY[500],
  },
});

export default AgentDashboardScreen;
