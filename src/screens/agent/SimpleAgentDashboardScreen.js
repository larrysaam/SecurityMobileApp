import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CommonActions } from '@react-navigation/native';
import { COLORS, SIZES } from '../../constants';
import AgentBottomNavbar from '../../components/AgentBottomNavbar';
import { useAuth } from '../../store/AuthContext';

const SimpleAgentDashboardScreen = ({ navigation }) => {
  const { user, apiService } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAgentDashboard();

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

  // Use real data from API or fallback to defaults
  const stats = dashboardData?.stats || {
    hoursWorked: 0,
    completedSchedules: 0,
    totalSchedules: 0,
    reportsSubmitted: 0,
    unreadAlerts: 0,
  };

  const latestSchedules = dashboardData?.latestSchedules || [];
  const todaySchedule = dashboardData?.todaySchedule || null;
  const shiftStatus = dashboardData?.shiftStatus || {
    status: 'Off Duty',
    color: COLORS.GRAY[500],
    icon: 'time'
  };

  // Get user info from dashboard data
  const userInfo = dashboardData?.user || user;

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

  const handleSchedulePress = async (schedule) => {
    try {
      console.log('Navigating to ScheduleDetails with schedule:', schedule.id);
      console.log('Navigation object:', navigation);

      const response = await apiService.request(`/agent/schedule/${schedule.id}`);
      if (response.success) {
        console.log('Schedule details loaded successfully, navigating...');
        console.log('Navigation object:', navigation);
        console.log('Available routes:', navigation.getState?.());

        // Show schedule details in modal
        console.log('Showing schedule details in modal...');
        console.log('Schedule data:', response.data);

        setSelectedSchedule(response.data);
        setScheduleModalVisible(true);
        console.log('Navigation completed successfully');
      } else {
        console.error('Failed to load schedule details:', response);
        Alert.alert('Error', 'Failed to load schedule details');
      }
    } catch (error) {
      console.error('Schedule details error:', error);
      Alert.alert('Error', 'Failed to load schedule details');
    }
  };

  const getScheduleStatusText = (status) => {
    switch (status) {
      case 'completed': return 'DONE';
      case 'in-progress': return 'IN PROGRESS';
      case 'pending': return 'PENDING';
      case 'missed': return 'MISSED';
      default: return 'UNKNOWN';
    }
  };

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
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.greeting}>
              {getGreeting()}, {userInfo?.firstName || 'Agent'}!
            </Text>
            <Text style={styles.subtitle}>Ready for your security duties</Text>
          </View>
          <View style={styles.profileSection}>
            <TouchableOpacity
              style={styles.testButton}
              onPress={() => {
                // Test all navigation routes
                console.log('Testing navigation routes...');
                console.log('Available routes:', navigation.getState());

                // Test modal navigation
                Alert.alert(
                  'Navigation Test',
                  'Choose a screen to test navigation:',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Patrol Report', onPress: () => navigation.navigate('PatrolReport', { scheduleId: 'test', siteId: 'test' }) },
                    { text: 'Incident Alert', onPress: () => navigation.navigate('IncidentAlert', { scheduleId: 'test', siteId: 'test' }) },
                    { text: 'Chat', onPress: () => navigation.navigate('Chat', { chatId: 'test' }) },
                    { text: 'QR Clock In', onPress: () => navigation.navigate('QRClockIn', { scheduleId: 'test', action: 'clock-in' }) },
                    { text: 'GPS Clock In', onPress: () => navigation.navigate('GPSClockIn', { scheduleId: 'test', action: 'clock-in' }) },
                  ]
                );
              }}
            >
              <Ionicons name="bug" size={16} color={COLORS.PRIMARY} />
            </TouchableOpacity>
            <View style={styles.avatar}>
              <Ionicons name="person" size={24} color={COLORS.WHITE} />
            </View>
            <View style={[styles.statusBadge, { backgroundColor: shiftStatus.color }]}>
              <Ionicons name={shiftStatus.icon} size={12} color={COLORS.WHITE} />
              <Text style={styles.statusText}>{shiftStatus.status}</Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="time" size={24} color={COLORS.PRIMARY} />
              <Text style={styles.statNumber}>{stats.hoursWorked}h</Text>
              <Text style={styles.statLabel}>Hours Worked</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.SUCCESS} />
              <Text style={styles.statNumber}>{stats.completedSchedules}/{stats.totalSchedules}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="document-text" size={24} color={COLORS.INFO} />
              <Text style={styles.statNumber}>{stats.reportsSubmitted}</Text>
              <Text style={styles.statLabel}>Reports</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="alert-circle" size={24} color={COLORS.SECONDARY} />
              <Text style={styles.statNumber}>{stats.unreadAlerts}</Text>
              <Text style={styles.statLabel}>Alerts</Text>
            </View>
          </View>
        </View>

        {/* Latest Schedules */}
        <View style={styles.scheduleContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Latest Schedules
            </Text>
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => {
                console.log('View All button pressed');
                try {
                  // Navigate to the Schedule modal screen
                  navigation.navigate('Schedule');
                } catch (error) {
                  console.error('Navigation error:', error);
                  Alert.alert('Navigation Error', 'Unable to navigate to Schedule screen');
                }
              }}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {latestSchedules.length === 0 ? (
            <View style={styles.emptySchedule}>
              <Ionicons name="calendar-outline" size={48} color={COLORS.GRAY[400]} />
              <Text style={styles.emptyScheduleText}>No schedules available</Text>
            </View>
          ) : (
            latestSchedules.map((schedule) => (
              <TouchableOpacity
                key={schedule.id}
                style={[
                  styles.scheduleCard,
                  schedule.scheduleStatus === 'completed' && styles.completedScheduleCard
                ]}
                onPress={() => handleSchedulePress(schedule)}
                disabled={schedule.scheduleStatus === 'completed'}
              >
                <View style={styles.scheduleHeader}>
                  <View style={styles.siteInfo}>
                    <Text style={[
                      styles.siteName,
                      schedule.isToday && styles.todayText
                    ]}>
                      {schedule.site.name}
                    </Text>
                    <Text style={styles.siteAddress}>{schedule.site.address}</Text>
                    <Text style={styles.scheduleDate}>
                      {schedule.dayOfWeek}, {schedule.formattedDate}
                    </Text>
                  </View>
                  <View style={[
                    styles.scheduleStatus,
                    { backgroundColor: getScheduleStatusColor(schedule.scheduleStatus) }
                  ]}>
                    <Text style={styles.scheduleStatusText}>
                      {getScheduleStatusText(schedule.scheduleStatus)}
                    </Text>
                  </View>
                </View>
                <View style={styles.scheduleTime}>
                  <Ionicons name="time" size={16} color={COLORS.GRAY[600]} />
                  <Text style={styles.timeText}>
                    {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                  </Text>
                  {schedule.isToday && (
                    <View style={styles.todayBadge}>
                      <Text style={styles.todayBadgeText}>TODAY</Text>
                    </View>
                  )}
                </View>
                {schedule.scheduleStatus === 'in-progress' && (
                  <View style={styles.activeIndicator}>
                    <Ionicons name="radio-button-on" size={12} color={COLORS.SUCCESS} />
                    <Text style={styles.activeText}>Currently Active</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: COLORS.SUCCESS }]}
              onPress={() => {
                console.log('Clock In button pressed');
                try {
                  // Navigate to the Tracking tab for clock in/out
                  navigation.navigate('Tracking');
                } catch (error) {
                  console.error('Navigation error:', error);
                  // Fallback: Show clock-in options in alert
                  Alert.alert(
                    'Clock In Options',
                    'Choose your preferred clock-in method:',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'GPS Clock In',
                        onPress: () => {
                          console.log('GPS Clock In selected');
                          // You can add GPS clock-in logic here
                        }
                      },
                      {
                        text: 'QR Code',
                        onPress: () => {
                          console.log('QR Code Clock In selected');
                          // You can add QR code clock-in logic here
                        }
                      },
                    ]
                  );
                }
              }}
            >
              <Ionicons name="location" size={28} color={COLORS.WHITE} />
              <Text style={styles.actionText}>Clock In</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: COLORS.INFO }]}
              onPress={() => {
                console.log('Reports button pressed');
                // Show reports options directly without navigation
                Alert.alert(
                  'Reports',
                  'Choose a report action:',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'View My Reports',
                      onPress: () => {
                        console.log('View Reports selected');
                        Alert.alert(
                          'My Reports',
                          'Reports feature will be available soon. You will be able to view and manage all your submitted reports here.',
                          [{ text: 'OK' }]
                        );
                      }
                    },
                    {
                      text: 'Create New Report',
                      onPress: () => {
                        console.log('Create Report selected');
                        Alert.alert(
                          'Create Report',
                          'Report creation feature will be available soon. You will be able to create incident reports, patrol reports, and maintenance reports.',
                          [{ text: 'OK' }]
                        );
                      }
                    },
                    {
                      text: 'Emergency Report',
                      onPress: () => {
                        console.log('Emergency Report selected');
                        Alert.alert(
                          'Emergency Report',
                          'For immediate emergencies, please call 911 first, then contact your supervisor.\n\nSupervisor: +1-800-BAHIN-SUP',
                          [{ text: 'OK' }]
                        );
                      }
                    },
                  ]
                );
              }}
            >
              <Ionicons name="document-text" size={28} color={COLORS.WHITE} />
              <Text style={styles.actionText}>New Report</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: COLORS.SECONDARY }]}
              onPress={() => {
                console.log('Emergency Alert button pressed');
                // Show emergency alert options directly
                Alert.alert(
                  'Emergency Alert',
                  'Choose an emergency action:',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Call 911',
                      style: 'destructive',
                      onPress: () => {
                        console.log('Call 911 selected');
                        Alert.alert(
                          'Emergency Services',
                          'For life-threatening emergencies, call 911 immediately.\n\nAfter calling 911, please notify your supervisor.',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Call 911', style: 'destructive', onPress: () => console.log('Calling 911...') }
                          ]
                        );
                      }
                    },
                    {
                      text: 'Security Alert',
                      onPress: () => {
                        console.log('Security Alert selected');
                        Alert.alert(
                          'Security Alert',
                          'Security alert feature will be available soon. You will be able to report security incidents and suspicious activities.',
                          [{ text: 'OK' }]
                        );
                      }
                    },
                    {
                      text: 'Call Supervisor',
                      onPress: () => {
                        console.log('Call Supervisor selected');
                        Alert.alert(
                          'Contact Supervisor',
                          'Supervisor Contact:\n+1-800-BAHIN-SUP\n\nAvailable 24/7 for emergencies',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Call Now', onPress: () => console.log('Calling supervisor...') }
                          ]
                        );
                      }
                    },
                  ]
                );
              }}
            >
              <Ionicons name="warning" size={28} color={COLORS.WHITE} />
              <Text style={styles.actionText}>Emergency</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: COLORS.WARNING }]}
              onPress={() => {
                console.log('Contact button pressed');
                // Show contact options directly without navigation
                Alert.alert(
                  'Contact Support',
                  'Choose how you would like to get help:',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Live Chat',
                      onPress: () => {
                        console.log('Live Chat selected');
                        Alert.alert(
                          'Live Chat',
                          'Chat feature will be available soon. For immediate assistance, please call support.',
                          [{ text: 'OK' }]
                        );
                      }
                    },
                    {
                      text: 'Call Support',
                      onPress: () => {
                        console.log('Call Support selected');
                        Alert.alert(
                          'Support Contact',
                          'Call +1-800-BAHIN-LINK for immediate assistance\n\nSupport Hours:\nMonday - Friday: 8AM - 6PM\nSaturday: 9AM - 3PM',
                          [{ text: 'OK' }]
                        );
                      }
                    },
                    {
                      text: 'Email Support',
                      onPress: () => {
                        console.log('Email Support selected');
                        Alert.alert(
                          'Email Support',
                          'Send your questions to:\nsupport@bahinlink.com\n\nWe typically respond within 2-4 hours during business hours.',
                          [{ text: 'OK' }]
                        );
                      }
                    },
                  ]
                );
              }}
            >
              <Ionicons name="chatbubble" size={28} color={COLORS.WHITE} />
              <Text style={styles.actionText}>Contact</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.activityContainer}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.SUCCESS} />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Patrol completed at Site Alpha</Text>
              <Text style={styles.activityTime}>2 hours ago</Text>
            </View>
          </View>
          
          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Ionicons name="document-text" size={20} color={COLORS.INFO} />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Incident report submitted</Text>
              <Text style={styles.activityTime}>4 hours ago</Text>
            </View>
          </View>
          
          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Ionicons name="log-in" size={20} color={COLORS.PRIMARY} />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Clocked in at Site Alpha</Text>
              <Text style={styles.activityTime}>6 hours ago</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <AgentBottomNavbar navigation={navigation} currentRoute="AgentDashboard" />

      {/* Schedule Details Modal */}
      <Modal
        visible={scheduleModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setScheduleModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Schedule Details</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setScheduleModalVisible(false)}
            >
              <Ionicons name="close" size={24} color={COLORS.GRAY[600]} />
            </TouchableOpacity>
          </View>

          {selectedSchedule && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.scheduleDetailCard}>
                <View style={styles.scheduleDetailHeader}>
                  <Ionicons name="location" size={24} color={COLORS.PRIMARY} />
                  <Text style={styles.scheduleDetailTitle}>
                    {selectedSchedule.site?.name || 'Unknown Site'}
                  </Text>
                </View>

                <View style={styles.scheduleDetailItem}>
                  <Text style={styles.scheduleDetailLabel}>Address:</Text>
                  <Text style={styles.scheduleDetailValue}>
                    {selectedSchedule.site?.address || 'No address'}
                  </Text>
                </View>

                <View style={styles.scheduleDetailItem}>
                  <Text style={styles.scheduleDetailLabel}>Date:</Text>
                  <Text style={styles.scheduleDetailValue}>
                    {new Date(selectedSchedule.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Text>
                </View>

                <View style={styles.scheduleDetailItem}>
                  <Text style={styles.scheduleDetailLabel}>Time:</Text>
                  <Text style={styles.scheduleDetailValue}>
                    {formatTime(selectedSchedule.startTime)} - {formatTime(selectedSchedule.endTime)}
                  </Text>
                </View>

                <View style={styles.scheduleDetailItem}>
                  <Text style={styles.scheduleDetailLabel}>Status:</Text>
                  <Text style={[
                    styles.scheduleDetailValue,
                    { color: getScheduleStatusColor(selectedSchedule.status) }
                  ]}>
                    {selectedSchedule.status.toUpperCase()}
                  </Text>
                </View>

                {selectedSchedule.notes && (
                  <View style={styles.scheduleDetailItem}>
                    <Text style={styles.scheduleDetailLabel}>Notes:</Text>
                    <Text style={styles.scheduleDetailValue}>
                      {selectedSchedule.notes}
                    </Text>
                  </View>
                )}

                {selectedSchedule.site?.qrCode && (
                  <View style={styles.scheduleDetailItem}>
                    <Text style={styles.scheduleDetailLabel}>QR Code:</Text>
                    <Text style={styles.scheduleDetailValue}>
                      {selectedSchedule.site.qrCode}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.clockInButton}
                  onPress={() => {
                    console.log('Clock In button pressed');
                    Alert.alert(
                      'Clock In Options',
                      `Choose your preferred clock-in method for ${selectedSchedule.site?.name}:`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'QR Code Scanner',
                          onPress: () => {
                            console.log('QR Code Scanner selected');
                            Alert.alert(
                              'QR Code Scanner',
                              `Ready to scan QR code for ${selectedSchedule.site?.name}\n\nExpected QR Code: ${selectedSchedule.site?.qrCode}`,
                              [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                  text: 'Simulate Successful Scan',
                                  onPress: () => {
                                    Alert.alert(
                                      'Success!',
                                      `Successfully clocked in at ${selectedSchedule.site?.name}!\n\nTime: ${new Date().toLocaleTimeString()}`,
                                      [{ text: 'OK', onPress: () => setScheduleModalVisible(false) }]
                                    );
                                  }
                                },
                                {
                                  text: 'Simulate Wrong QR Code',
                                  onPress: () => {
                                    Alert.alert(
                                      'Invalid QR Code',
                                      `This QR code does not match the site code for ${selectedSchedule.site?.name}.\n\nExpected: ${selectedSchedule.site?.qrCode}\nScanned: WRONG_CODE`,
                                      [{ text: 'OK' }]
                                    );
                                  }
                                }
                              ]
                            );
                          }
                        },
                        {
                          text: 'GPS Location',
                          onPress: () => {
                            Alert.alert(
                              'GPS Clock-In',
                              'GPS clock-in will be available soon. Please use QR code for now.',
                              [{ text: 'OK' }]
                            );
                          }
                        },
                      ]
                    );
                  }}
                >
                  <Ionicons name="log-in" size={20} color={COLORS.WHITE} />
                  <Text style={styles.clockInButtonText}>Clock Iin</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
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
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: COLORS.PRIMARY,
    padding: SIZES.PADDING,
    paddingTop: 50,
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
    fontSize: 16,
    color: COLORS.WHITE,
    opacity: 0.9,
  },
  profileSection: {
    alignItems: 'center',
  },
  testButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: COLORS.WHITE,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    marginLeft: 4,
  },
  statsContainer: {
    padding: SIZES.PADDING,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.DARK,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.BORDER_RADIUS,
    padding: SIZES.PADDING,
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
    elevation: 2,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.DARK,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.GRAY[600],
    textAlign: 'center',
  },
  scheduleContainer: {
    padding: SIZES.PADDING,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  viewAllText: {
    fontSize: 14,
    color: COLORS.PRIMARY,
    fontWeight: '500',
  },
  scheduleCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.BORDER_RADIUS,
    padding: SIZES.PADDING,
    marginBottom: 12,
    elevation: 2,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  siteInfo: {
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
  },
  shiftStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  shiftStatusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  scheduleTime: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 14,
    color: COLORS.GRAY[600],
    marginLeft: 6,
  },
  emptySchedule: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyScheduleText: {
    fontSize: 16,
    color: COLORS.GRAY[500],
    marginTop: 12,
  },
  completedScheduleCard: {
    opacity: 0.6,
    backgroundColor: COLORS.GRAY[100],
  },
  scheduleStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  scheduleStatusText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  scheduleDate: {
    fontSize: 12,
    color: COLORS.GRAY[500],
    marginTop: 2,
  },
  todayText: {
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
  },
  todayBadge: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  todayBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY[200],
  },
  activeText: {
    fontSize: 12,
    color: COLORS.SUCCESS,
    marginLeft: 4,
    fontWeight: '500',
  },
  quickActionsContainer: {
    padding: SIZES.PADDING,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    borderRadius: SIZES.BORDER_RADIUS,
    padding: SIZES.PADDING,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    marginTop: 8,
  },
  activityContainer: {
    padding: SIZES.PADDING,
    paddingBottom: 100, // Extra padding for bottom navbar
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.BORDER_RADIUS,
    padding: SIZES.PADDING,
    marginBottom: 8,
    elevation: 1,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.GRAY[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.DARK,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: COLORS.GRAY[500],
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY[200],
    backgroundColor: COLORS.PRIMARY,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  scheduleDetailCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scheduleDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  scheduleDetailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT,
    marginLeft: 12,
  },
  scheduleDetailItem: {
    marginBottom: 16,
  },
  scheduleDetailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.GRAY[600],
    marginBottom: 4,
  },
  scheduleDetailValue: {
    fontSize: 16,
    color: COLORS.TEXT,
    lineHeight: 22,
  },
  modalActions: {
    padding: 20,
  },
  clockInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.SUCCESS,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  clockInButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.WHITE,
  },
});

export default SimpleAgentDashboardScreen;
