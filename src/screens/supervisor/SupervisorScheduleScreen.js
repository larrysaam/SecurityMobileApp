import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants';
import SupervisorBottomNavbar from '../../components/SupervisorBottomNavbar';
import { useAuth } from '../../store/AuthContext';

const SupervisorScheduleScreen = ({ navigation, route }) => {
  const { apiService } = useAuth();
  const [agents, setAgents] = useState([]);
  const [sites, setSites] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [showSiteModal, setShowSiteModal] = useState(false);
  const [agentAvailability, setAgentAvailability] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [scheduleForm, setScheduleForm] = useState({
    agentId: route.params?.agentId || '',
    siteId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '16:00',
    notes: ''
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (scheduleForm.agentId) {
      checkAgentAvailability(scheduleForm.agentId, scheduleForm.date);
    }
  }, [scheduleForm.agentId, scheduleForm.date]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      
      const [agentsResponse, sitesResponse, schedulesResponse] = await Promise.all([
        apiService.request('/supervisor/agents'),
        apiService.request('/supervisor/sites'), // Supervisor sites endpoint
        apiService.request('/supervisor/schedules')
      ]);

      if (agentsResponse.success) {
        setAgents(agentsResponse.data.agents || []);
      }
      
      if (sitesResponse.success) {
        setSites(sitesResponse.data.sites || []);
      }
      
      if (schedulesResponse.success) {
        setSchedules(schedulesResponse.data.schedules || []);
      }

    } catch (error) {
      console.error('Load initial data error:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const checkAgentAvailability = async (agentId, date) => {
    try {
      const response = await apiService.request(`/supervisor/agents/${agentId}`);
      
      if (response.success && response.data.availability) {
        setAgentAvailability(response.data.availability);
      }
    } catch (error) {
      console.error('Check availability error:', error);
    }
  };

  const checkScheduleConflicts = async () => {
    try {
      const params = new URLSearchParams({
        agentId: scheduleForm.agentId,
        date: scheduleForm.date,
        startTime: scheduleForm.startTime,
        endTime: scheduleForm.endTime
      });

      const response = await apiService.request(`/supervisor/schedules/conflicts?${params.toString()}`);
      
      if (response.success) {
        return response.data;
      }
      
      return { hasConflicts: false, conflicts: [] };
    } catch (error) {
      console.error('Check conflicts error:', error);
      return { hasConflicts: false, conflicts: [] };
    }
  };

  const handleCreateSchedule = async () => {
    try {
      // Validate form
      if (!scheduleForm.agentId || !scheduleForm.siteId || !scheduleForm.date || 
          !scheduleForm.startTime || !scheduleForm.endTime) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      // Check for conflicts
      const conflictCheck = await checkScheduleConflicts();
      
      if (conflictCheck.hasConflicts) {
        const conflictMessages = conflictCheck.conflicts.map(conflict => 
          `${conflict.startTime} - ${conflict.endTime} at ${conflict.siteName}`
        ).join('\n');
        
        Alert.alert(
          'Scheduling Conflict',
          `Agent has existing assignments:\n${conflictMessages}`,
          [{ text: 'OK' }]
        );
        return;
      }

      // Create schedule
      const response = await apiService.request('/supervisor/schedules', {
        method: 'POST',
        body: JSON.stringify(scheduleForm),
      });

      if (response.success) {
        Alert.alert('Success', 'Schedule created successfully');
        setShowScheduleModal(false);
        setScheduleForm({
          agentId: '',
          siteId: '',
          date: new Date().toISOString().split('T')[0],
          startTime: '08:00',
          endTime: '16:00',
          notes: ''
        });
        loadInitialData();
      } else {
        Alert.alert('Error', response.message || 'Failed to create schedule');
      }

    } catch (error) {
      console.error('Create schedule error:', error);
      Alert.alert('Error', 'Failed to create schedule');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const getAvailabilityForDate = (date) => {
    const availability = agentAvailability.find(a => a.date === date);
    return availability || { isAvailable: true, schedules: [], totalHours: 0 };
  };

  const renderAgentCard = (agent) => {
    const todayAvailability = getAvailabilityForDate(new Date().toISOString().split('T')[0]);
    
    return (
      <TouchableOpacity
        key={agent.id}
        style={styles.agentCard}
        onPress={() => {
          setSelectedAgent(agent);
          setScheduleForm({ ...scheduleForm, agentId: agent.id });
          setShowScheduleModal(true);
        }}
      >
        <View style={styles.agentHeader}>
          <View style={styles.agentInfo}>
            <View style={styles.agentAvatar}>
              <Ionicons name="person" size={20} color={COLORS.PRIMARY} />
            </View>
            <View style={styles.agentDetails}>
              <Text style={styles.agentName}>{agent.firstName} {agent.lastName}</Text>
              <Text style={styles.agentStatus}>
                {agent.status === 'active' ? 'On Duty' : 'Off Duty'}
              </Text>
            </View>
          </View>
          
          <View style={styles.availabilityIndicator}>
            <View style={[styles.availabilityDot, { 
              backgroundColor: todayAvailability.isAvailable ? COLORS.SUCCESS : COLORS.WARNING 
            }]} />
            <Text style={styles.availabilityText}>
              {todayAvailability.isAvailable ? 'Available' : `${todayAvailability.totalHours}h scheduled`}
            </Text>
          </View>
        </View>

        <View style={styles.agentMetrics}>
          <View style={styles.metric}>
            <Ionicons name="calendar" size={16} color={COLORS.GRAY[500]} />
            <Text style={styles.metricText}>
              {schedules.filter(s => s.agentId === agent.id).length} schedules
            </Text>
          </View>
          
          <View style={styles.metric}>
            <Ionicons name="time" size={16} color={COLORS.GRAY[500]} />
            <Text style={styles.metricText}>
              {todayAvailability.totalHours}h today
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.scheduleButton}
          onPress={() => {
            setSelectedAgent(agent);
            setScheduleForm({ ...scheduleForm, agentId: agent.id });
            setShowScheduleModal(true);
          }}
        >
          <Ionicons name="add" size={16} color={COLORS.WHITE} />
          <Text style={styles.scheduleButtonText}>Schedule Agent</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderScheduleItem = (schedule) => (
    <View key={schedule.id} style={styles.scheduleItem}>
      <View style={styles.scheduleHeader}>
        <Text style={styles.scheduleAgent}>{schedule.agentName}</Text>
        <Text style={styles.scheduleTime}>
          {schedule.startTime} - {schedule.endTime}
        </Text>
      </View>
      <Text style={styles.scheduleSite}>{schedule.siteName}</Text>
      <Text style={styles.scheduleDate}>
        {new Date(schedule.date).toLocaleDateString()}
      </Text>
      {schedule.notes && (
        <Text style={styles.scheduleNotes}>{schedule.notes}</Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Loading scheduling data...</Text>
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
        <Text style={styles.headerTitle}>Agent Scheduling</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowScheduleModal(true)}
        >
          <Ionicons name="add" size={24} color={COLORS.PRIMARY} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Available Agents */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Agents</Text>
          <Text style={styles.sectionSubtitle}>
            Select an agent to create a schedule
          </Text>
          
          {agents.length > 0 ? (
            agents.map(renderAgentCard)
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color={COLORS.GRAY[400]} />
              <Text style={styles.emptyText}>No agents available</Text>
            </View>
          )}
        </View>

        {/* Recent Schedules */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Schedules</Text>
          
          {schedules.length > 0 ? (
            schedules.slice(0, 5).map(renderScheduleItem)
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={48} color={COLORS.GRAY[400]} />
              <Text style={styles.emptyText}>No schedules found</Text>
            </View>
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Schedule Creation Modal */}
      <Modal
        visible={showScheduleModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowScheduleModal(false)}
            >
              <Ionicons name="close" size={24} color={COLORS.DARK} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create Schedule</Text>
            <TouchableOpacity
              style={styles.modalSaveButton}
              onPress={handleCreateSchedule}
            >
              <Text style={styles.modalSaveText}>Create</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Agent Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Agent *</Text>
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerText}>
                  {selectedAgent ? `${selectedAgent.firstName} ${selectedAgent.lastName}` : 'Select Agent'}
                </Text>
              </View>
            </View>

            {/* Site Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Site *</Text>
              <TouchableOpacity
                style={styles.pickerContainer}
                onPress={() => setShowSiteModal(true)}
              >
                <Text style={styles.pickerText}>
                  {sites.find(s => s.id === scheduleForm.siteId)?.name || 'Select Site'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={COLORS.GRAY[500]} />
              </TouchableOpacity>
            </View>

            {/* Date */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Date *</Text>
              <TextInput
                style={styles.formInput}
                value={scheduleForm.date}
                onChangeText={(text) => setScheduleForm({ ...scheduleForm, date: text })}
                placeholder="YYYY-MM-DD"
              />
            </View>

            {/* Time Range */}
            <View style={styles.timeRow}>
              <View style={styles.timeGroup}>
                <Text style={styles.formLabel}>Start Time *</Text>
                <TextInput
                  style={styles.formInput}
                  value={scheduleForm.startTime}
                  onChangeText={(text) => setScheduleForm({ ...scheduleForm, startTime: text })}
                  placeholder="HH:mm"
                />
              </View>
              
              <View style={styles.timeGroup}>
                <Text style={styles.formLabel}>End Time *</Text>
                <TextInput
                  style={styles.formInput}
                  value={scheduleForm.endTime}
                  onChangeText={(text) => setScheduleForm({ ...scheduleForm, endTime: text })}
                  placeholder="HH:mm"
                />
              </View>
            </View>

            {/* Agent Availability Display */}
            {selectedAgent && agentAvailability.length > 0 && (
              <View style={styles.availabilitySection}>
                <Text style={styles.formLabel}>Agent Availability (Next 7 Days)</Text>
                {agentAvailability.map((day, index) => (
                  <View key={index} style={styles.availabilityDay}>
                    <Text style={styles.dayName}>{day.dayName}</Text>
                    <Text style={styles.dayDate}>{day.date}</Text>
                    <View style={[styles.availabilityStatus, {
                      backgroundColor: day.isAvailable ? COLORS.SUCCESS : COLORS.WARNING
                    }]}>
                      <Text style={styles.availabilityStatusText}>
                        {day.isAvailable ? 'Available' : `${day.totalHours}h scheduled`}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Notes */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Notes</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                value={scheduleForm.notes}
                onChangeText={(text) => setScheduleForm({ ...scheduleForm, notes: text })}
                placeholder="Additional notes for this schedule..."
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Site Selection Modal */}
      <Modal
        visible={showSiteModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSiteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.siteModalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowSiteModal(false)}
              >
                <Ionicons name="close" size={24} color={COLORS.DARK} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Select Site</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.siteList}>
              {sites.map((site) => (
                <TouchableOpacity
                  key={site.id}
                  style={[
                    styles.siteItem,
                    scheduleForm.siteId === site.id && styles.selectedSiteItem
                  ]}
                  onPress={() => {
                    setScheduleForm({ ...scheduleForm, siteId: site.id });
                    setShowSiteModal(false);
                  }}
                >
                  <View style={styles.siteInfo}>
                    <Text style={styles.siteName}>{site.name}</Text>
                    <Text style={styles.siteAddress}>{site.address}</Text>
                    {site.clientName && (
                      <Text style={styles.siteClient}>Client: {site.clientName}</Text>
                    )}
                  </View>
                  {scheduleForm.siteId === site.id && (
                    <Ionicons name="checkmark" size={24} color={COLORS.PRIMARY} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

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
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: SIZES.PADDING,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.DARK,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.GRAY[600],
    marginBottom: 16,
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
  agentStatus: {
    fontSize: 12,
    color: COLORS.GRAY[600],
  },
  availabilityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availabilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  availabilityText: {
    fontSize: 12,
    color: COLORS.GRAY[600],
    fontWeight: '500',
  },
  agentMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricText: {
    fontSize: 12,
    color: COLORS.GRAY[600],
    marginLeft: 4,
  },
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 8,
    borderRadius: SIZES.BORDER_RADIUS,
  },
  scheduleButtonText: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  scheduleItem: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.BORDER_RADIUS,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.PRIMARY,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  scheduleAgent: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.DARK,
  },
  scheduleTime: {
    fontSize: 12,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  scheduleSite: {
    fontSize: 12,
    color: COLORS.GRAY[600],
    marginBottom: 2,
  },
  scheduleDate: {
    fontSize: 10,
    color: COLORS.GRAY[500],
    marginBottom: 4,
  },
  scheduleNotes: {
    fontSize: 12,
    color: COLORS.GRAY[700],
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: SIZES.PADDING * 2,
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.BORDER_RADIUS,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.GRAY[600],
    marginTop: 12,
  },
  bottomPadding: {
    height: 100,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SIZES.PADDING,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY[200],
    paddingTop: 50,
  },
  modalCloseButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.DARK,
  },
  modalSaveButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: SIZES.BORDER_RADIUS,
  },
  modalSaveText: {
    color: COLORS.WHITE,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: SIZES.PADDING,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.DARK,
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: COLORS.GRAY[300],
    borderRadius: SIZES.BORDER_RADIUS,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.DARK,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: COLORS.GRAY[300],
    borderRadius: SIZES.BORDER_RADIUS,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerText: {
    fontSize: 16,
    color: COLORS.DARK,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeGroup: {
    flex: 1,
    marginHorizontal: 4,
  },
  availabilitySection: {
    marginBottom: 20,
    backgroundColor: COLORS.GRAY[100],
    padding: 12,
    borderRadius: SIZES.BORDER_RADIUS,
  },
  availabilityDay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY[200],
  },
  dayName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.DARK,
    flex: 1,
  },
  dayDate: {
    fontSize: 12,
    color: COLORS.GRAY[600],
    flex: 1,
  },
  availabilityStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  availabilityStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  siteModalContainer: {
    backgroundColor: COLORS.WHITE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '50%',
  },
  siteList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  siteItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY[200],
  },
  selectedSiteItem: {
    backgroundColor: COLORS.PRIMARY_LIGHT,
  },
  siteInfo: {
    flex: 1,
  },
  siteName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.DARK,
    marginBottom: 4,
  },
  siteAddress: {
    fontSize: 14,
    color: COLORS.GRAY[600],
    marginBottom: 2,
  },
  siteClient: {
    fontSize: 12,
    color: COLORS.GRAY[500],
  },
});

export default SupervisorScheduleScreen;
