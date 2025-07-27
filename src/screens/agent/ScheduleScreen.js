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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants';
import { ApiService } from '../../services/apiService';

const ScheduleScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'

  useEffect(() => {
    loadScheduleData();
  }, []);

  const loadScheduleData = async () => {
    try {
      setLoading(true);

      // Get agent's schedules
      const response = await ApiService.getAgentSchedules();
      if (response.success) {
        const allSchedules = response.data.schedules || [];

        // Process schedules
        const processedSchedules = allSchedules.map(schedule => ({
          ...schedule,
          isToday: isToday(schedule.date),
          dayOfWeek: getDayOfWeek(schedule.date),
          formattedDate: formatDate(schedule.date),
          formattedStartTime: formatTime(schedule.startTime),
          formattedEndTime: formatTime(schedule.endTime),
        }));

        // Sort by date (most recent first)
        processedSchedules.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Get latest 5 schedules
        const latestSchedules = processedSchedules.slice(0, 5);

        // Find today's schedule
        const todayScheduleItem = processedSchedules.find(schedule => schedule.isToday);

        setSchedules(latestSchedules);
        setTodaySchedule(todayScheduleItem);
      } else {
        console.error('Failed to load schedules:', response.message);
        Alert.alert('Error', 'Failed to load schedule data');
      }
    } catch (error) {
      console.error('Schedule loading error:', error);
      Alert.alert('Error', 'Failed to load schedule data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadScheduleData();
    setRefreshing(false);
  }, []);

  const isToday = (dateString) => {
    const today = new Date();
    const scheduleDate = new Date(dateString);
    return (
      today.getDate() === scheduleDate.getDate() &&
      today.getMonth() === scheduleDate.getMonth() &&
      today.getFullYear() === scheduleDate.getFullYear()
    );
  };

  const getDayOfWeek = (dateString) => {
    const date = new Date(dateString);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return timeString;
    }
  };

  const getScheduleStatusColor = (status) => {
    switch (status) {
      case 'completed': return COLORS.SUCCESS;
      case 'in-progress': return COLORS.PRIMARY;
      case 'pending': return COLORS.WARNING;
      case 'missed': return COLORS.ERROR;
      default: return COLORS.GRAY[400];
    }
  };

  const getScheduleStatusText = (status) => {
    switch (status) {
      case 'completed': return 'COMPLETED';
      case 'in-progress': return 'IN PROGRESS';
      case 'pending': return 'PENDING';
      case 'missed': return 'MISSED';
      default: return 'UNKNOWN';
    }
  };

  const handleSchedulePress = async (schedule) => {
    try {
      console.log('Schedule pressed:', schedule.id);

      // Get detailed schedule information
      const response = await ApiService.getAgentScheduleDetails(schedule.id);
      if (response.success) {
        navigation.navigate('ScheduleDetailsScreen', {
          schedule: response.data,
          onClockAction: loadScheduleData
        });
      } else {
        console.error('Failed to load schedule details:', response);
        Alert.alert('Error', 'Failed to load schedule details');
      }
    } catch (error) {
      console.error('Schedule details error:', error);
      Alert.alert('Error', 'Failed to load schedule details');
    }
  };

  const handleClockInPress = (schedule) => {
    Alert.alert(
      'Clock In Options',
      'Choose your preferred clock-in method:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'GPS Clock In',
          onPress: () => navigation.navigate('GPSClockIn', {
            scheduleId: schedule.id,
            action: 'clock-in',
            site: schedule.site
          })
        },
        {
          text: 'QR Code',
          onPress: () => navigation.navigate('QRClockIn', {
            scheduleId: schedule.id,
            action: 'clock-in',
            site: schedule.site
          })
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Loading schedules...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Schedule</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'list' && styles.activeViewMode]}
            onPress={() => setViewMode('list')}
          >
            <Ionicons name="list" size={20} color={viewMode === 'list' ? COLORS.WHITE : COLORS.PRIMARY} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'calendar' && styles.activeViewMode]}
            onPress={() => setViewMode('calendar')}
          >
            <Ionicons name="calendar" size={20} color={viewMode === 'calendar' ? COLORS.WHITE : COLORS.PRIMARY} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Today's Schedule */}
        {todaySchedule && (
          <View style={styles.todaySection}>
            <Text style={styles.sectionTitle}>Today's Schedule</Text>
            <TouchableOpacity
              style={[styles.todayScheduleCard, todaySchedule.isToday && styles.highlightedCard]}
              onPress={() => handleSchedulePress(todaySchedule)}
            >
              <View style={styles.scheduleHeader}>
                <View style={styles.siteInfo}>
                  <Text style={styles.siteName}>{todaySchedule.site?.name || 'Unknown Site'}</Text>
                  <Text style={styles.siteAddress}>{todaySchedule.site?.address || 'No address'}</Text>
                </View>
                <View style={[
                  styles.scheduleStatus,
                  { backgroundColor: getScheduleStatusColor(todaySchedule.status) }
                ]}>
                  <Text style={styles.scheduleStatusText}>
                    {getScheduleStatusText(todaySchedule.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.scheduleTime}>
                <Ionicons name="time" size={16} color={COLORS.GRAY[600]} />
                <Text style={styles.timeText}>
                  {todaySchedule.formattedStartTime} - {todaySchedule.formattedEndTime}
                </Text>
                <View style={styles.todayBadge}>
                  <Text style={styles.todayBadgeText}>TODAY</Text>
                </View>
              </View>

              {todaySchedule.status === 'pending' && (
                <TouchableOpacity
                  style={styles.clockInButton}
                  onPress={() => handleClockInPress(todaySchedule)}
                >
                  <Ionicons name="location" size={16} color={COLORS.WHITE} />
                  <Text style={styles.clockInButtonText}>Clock In</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Latest Schedules */}
        <View style={styles.schedulesSection}>
          <Text style={styles.sectionTitle}>Latest Schedules</Text>

          {schedules.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color={COLORS.GRAY[400]} />
              <Text style={styles.emptyStateText}>No schedules available</Text>
              <Text style={styles.emptyStateSubtext}>Your upcoming schedules will appear here</Text>
            </View>
          ) : (
            schedules.map((schedule) => (
              <TouchableOpacity
                key={schedule.id}
                style={[
                  styles.scheduleCard,
                  schedule.isToday && styles.highlightedCard,
                  schedule.status === 'completed' && styles.completedCard
                ]}
                onPress={() => handleSchedulePress(schedule)}
                disabled={schedule.status === 'completed'}
              >
                <View style={styles.scheduleHeader}>
                  <View style={styles.siteInfo}>
                    <Text style={[
                      styles.siteName,
                      schedule.isToday && styles.todayText
                    ]}>
                      {schedule.site?.name || 'Unknown Site'}
                    </Text>
                    <Text style={styles.siteAddress}>{schedule.site?.address || 'No address'}</Text>
                    <Text style={styles.scheduleDate}>
                      {schedule.dayOfWeek}, {schedule.formattedDate}
                    </Text>
                  </View>
                  <View style={[
                    styles.scheduleStatus,
                    { backgroundColor: getScheduleStatusColor(schedule.status) }
                  ]}>
                    <Text style={styles.scheduleStatusText}>
                      {getScheduleStatusText(schedule.status)}
                    </Text>
                  </View>
                </View>

                <View style={styles.scheduleTime}>
                  <Ionicons name="time" size={16} color={COLORS.GRAY[600]} />
                  <Text style={styles.timeText}>
                    {schedule.formattedStartTime} - {schedule.formattedEndTime}
                  </Text>
                  {schedule.isToday && (
                    <View style={styles.todayBadge}>
                      <Text style={styles.todayBadgeText}>TODAY</Text>
                    </View>
                  )}
                </View>

                {schedule.status === 'in-progress' && (
                  <View style={styles.activeIndicator}>
                    <Ionicons name="radio-button-on" size={12} color={COLORS.SUCCESS} />
                    <Text style={styles.activeText}>Currently Active</Text>
                  </View>
                )}

                {schedule.notes && (
                  <View style={styles.notesSection}>
                    <Text style={styles.notesText}>{schedule.notes}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

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
    gap: 10,
  },
  viewModeButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
  },
  activeViewMode: {
    backgroundColor: COLORS.PRIMARY,
  },
  scrollView: {
    flex: 1,
  },
  todaySection: {
    padding: 20,
    backgroundColor: COLORS.WHITE,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT,
    marginBottom: 15,
  },
  todayScheduleCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  highlightedCard: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: `${COLORS.PRIMARY}05`,
  },
  completedCard: {
    opacity: 0.7,
    backgroundColor: COLORS.GRAY[50],
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  siteInfo: {
    flex: 1,
    marginRight: 10,
  },
  siteName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT,
    marginBottom: 4,
  },
  todayText: {
    color: COLORS.PRIMARY,
  },
  siteAddress: {
    fontSize: 14,
    color: COLORS.GRAY[600],
    marginBottom: 4,
  },
  scheduleDate: {
    fontSize: 12,
    color: COLORS.GRAY[500],
  },
  scheduleStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  scheduleStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.WHITE,
  },
  scheduleTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeText: {
    fontSize: 14,
    color: COLORS.GRAY[700],
    marginLeft: 6,
    flex: 1,
  },
  todayBadge: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  todayBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.WHITE,
  },
  clockInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.SUCCESS,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  clockInButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.WHITE,
    marginLeft: 6,
  },
  schedulesSection: {
    padding: 20,
    backgroundColor: COLORS.WHITE,
  },
  scheduleCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.GRAY[200],
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  activeText: {
    fontSize: 12,
    color: COLORS.SUCCESS,
    marginLeft: 6,
    fontWeight: '500',
  },
  notesSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY[200],
  },
  notesText: {
    fontSize: 12,
    color: COLORS.GRAY[600],
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.GRAY[600],
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: COLORS.GRAY[500],
    marginTop: 4,
    textAlign: 'center',
  },
});

export default ScheduleScreen;
