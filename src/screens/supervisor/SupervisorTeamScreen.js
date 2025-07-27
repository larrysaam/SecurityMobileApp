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
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants';
import SupervisorBottomNavbar from '../../components/SupervisorBottomNavbar';
import { useAuth } from '../../store/AuthContext';

const SupervisorTeamScreen = ({ navigation }) => {
  const { apiService } = useAuth();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('agents'); // 'agents', 'schedules', 'performance'
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [messageText, setMessageText] = useState('');

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      if (!refreshing) setLoading(true);
      
      const response = await apiService.request('/supervisor/agents');
      
      if (response.success) {
        setAgents(response.data.agents || []);
      } else {
        Alert.alert('Error', 'Failed to load team data');
      }
    } catch (error) {
      console.error('Load agents error:', error);
      Alert.alert('Error', 'Failed to load team data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAgents();
  };

  const handleSendMessage = (agent) => {
    setSelectedAgent(agent);
    setMessageText('');
    setShowMessageModal(true);
  };

  const submitMessage = async () => {
    try {
      if (!messageText.trim()) {
        Alert.alert('Error', 'Please enter a message');
        return;
      }

      const response = await apiService.request('/supervisor/messages', {
        method: 'POST',
        body: JSON.stringify({
          recipientId: selectedAgent.id,
          message: messageText,
          priority: 'medium'
        }),
      });

      if (response.success) {
        Alert.alert('Success', 'Message sent successfully');
        setShowMessageModal(false);
        setSelectedAgent(null);
        setMessageText('');
      } else {
        Alert.alert('Error', 'Failed to send message');
      }
    } catch (error) {
      console.error('Send message error:', error);
      Alert.alert('Error', 'Failed to send message');
    }
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

  const renderAgentCard = (agent) => (
    <TouchableOpacity
      key={agent.id}
      style={styles.agentCard}
      onPress={() => navigation.navigate('SupervisorAgentDetails', { agentId: agent.id })}
    >
      <View style={styles.agentHeader}>
        <View style={styles.agentInfo}>
          <View style={styles.agentAvatar}>
            <Ionicons name="person" size={24} color={COLORS.PRIMARY} />
          </View>
          <View style={styles.agentDetails}>
            <Text style={styles.agentName}>{agent.firstName} {agent.lastName}</Text>
            <Text style={styles.agentEmail}>{agent.email}</Text>
            <Text style={styles.agentPhone}>{agent.phone}</Text>
          </View>
        </View>
        
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(agent.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(agent.status) }]}>
            {getStatusLabel(agent.status)}
          </Text>
        </View>
      </View>

      <View style={styles.agentMetrics}>
        <View style={styles.metric}>
          <Ionicons name="document-text" size={16} color={COLORS.GRAY[500]} />
          <Text style={styles.metricText}>
            {agent.recentReports} reports
          </Text>
        </View>
        
        {agent.currentLocation && (
          <View style={styles.metric}>
            <Ionicons 
              name={agent.isOnline ? "radio-button-on" : "radio-button-off"} 
              size={16} 
              color={agent.isOnline ? COLORS.SUCCESS : COLORS.GRAY[500]} 
            />
            <Text style={styles.metricText}>
              {agent.isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
        )}
        
        {agent.lastSeen && (
          <View style={styles.metric}>
            <Ionicons name="time" size={16} color={COLORS.GRAY[500]} />
            <Text style={styles.metricText}>
              Last seen: {new Date(agent.lastSeen).toLocaleTimeString()}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.agentActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: COLORS.INFO }]}
          onPress={() => handleSendMessage(agent)}
        >
          <Ionicons name="chatbubble" size={16} color={COLORS.WHITE} />
          <Text style={styles.actionButtonText}>Message</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: COLORS.PRIMARY }]}
          onPress={() => navigation.navigate('SupervisorAgentTracking', { agentId: agent.id })}
        >
          <Ionicons name="location" size={16} color={COLORS.WHITE} />
          <Text style={styles.actionButtonText}>Track</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: COLORS.WARNING }]}
          onPress={() => navigation.navigate('SupervisorSchedule', { agentId: agent.id })}
        >
          <Ionicons name="calendar" size={16} color={COLORS.WHITE} />
          <Text style={styles.actionButtonText}>Schedule</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderPerformanceCard = (agent) => (
    <View key={agent.id} style={styles.performanceCard}>
      <View style={styles.performanceHeader}>
        <Text style={styles.performanceName}>{agent.firstName} {agent.lastName}</Text>
        <View style={styles.performanceRating}>
          <Ionicons name="star" size={16} color={COLORS.WARNING} />
          <Text style={styles.ratingText}>4.5</Text>
        </View>
      </View>
      
      <View style={styles.performanceMetrics}>
        <View style={styles.performanceMetric}>
          <Text style={styles.performanceLabel}>Attendance</Text>
          <Text style={styles.performanceValue}>95%</Text>
        </View>
        <View style={styles.performanceMetric}>
          <Text style={styles.performanceLabel}>Reports</Text>
          <Text style={styles.performanceValue}>{agent.recentReports}</Text>
        </View>
        <View style={styles.performanceMetric}>
          <Text style={styles.performanceLabel}>Response Time</Text>
          <Text style={styles.performanceValue}>3.2m</Text>
        </View>
      </View>
    </View>
  );

  const tabs = [
    { id: 'agents', label: 'Team Members', icon: 'people' },
    { id: 'schedules', label: 'Schedules', icon: 'calendar' },
    { id: 'performance', label: 'Performance', icon: 'bar-chart' },
  ];

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Loading team data...</Text>
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
        <Text style={styles.headerTitle}>Team Management</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => Alert.alert('Feature', 'Add team member feature coming soon')}
        >
          <Ionicons name="add" size={24} color={COLORS.PRIMARY} />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              selectedTab === tab.id && styles.tabActive
            ]}
            onPress={() => setSelectedTab(tab.id)}
          >
            <Ionicons 
              name={tab.icon} 
              size={20} 
              color={selectedTab === tab.id ? COLORS.PRIMARY : COLORS.GRAY[500]} 
            />
            <Text style={[
              styles.tabText,
              selectedTab === tab.id && styles.tabTextActive
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Team Overview */}
      <View style={styles.overviewSection}>
        <View style={styles.overviewCard}>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewNumber}>{agents.length}</Text>
            <Text style={styles.overviewLabel}>Total Agents</Text>
          </View>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewNumber}>
              {agents.filter(a => a.status === 'active').length}
            </Text>
            <Text style={styles.overviewLabel}>On Duty</Text>
          </View>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewNumber}>
              {agents.filter(a => a.isOnline).length}
            </Text>
            <Text style={styles.overviewLabel}>Online</Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {selectedTab === 'agents' && (
          <View style={styles.agentsList}>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Team Members</Text>
              <Text style={styles.listSubtitle}>
                {agents.length} agents under your supervision
              </Text>
            </View>

            {agents.length > 0 ? (
              agents.map(renderAgentCard)
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={48} color={COLORS.GRAY[400]} />
                <Text style={styles.emptyText}>No team members found</Text>
                <Text style={styles.emptySubtext}>
                  Contact admin to assign agents to your team
                </Text>
              </View>
            )}
          </View>
        )}

        {selectedTab === 'schedules' && (
          <View style={styles.schedulesSection}>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Team Schedules</Text>
              <TouchableOpacity
                style={styles.createScheduleButton}
                onPress={() => navigation.navigate('SupervisorSchedule')}
              >
                <Ionicons name="add" size={16} color={COLORS.WHITE} />
                <Text style={styles.createScheduleText}>Create Schedule</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.scheduleQuickActions}>
              <TouchableOpacity
                style={[styles.quickActionCard, { backgroundColor: `${COLORS.PRIMARY}15` }]}
                onPress={() => navigation.navigate('SupervisorSchedule')}
              >
                <Ionicons name="calendar" size={24} color={COLORS.PRIMARY} />
                <Text style={[styles.quickActionTitle, { color: COLORS.PRIMARY }]}>
                  Schedule Agent
                </Text>
                <Text style={styles.quickActionDescription}>
                  Check availability and create schedules
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickActionCard, { backgroundColor: `${COLORS.INFO}15` }]}
                onPress={() => navigation.navigate('SupervisorSchedule')}
              >
                <Ionicons name="list" size={24} color={COLORS.INFO} />
                <Text style={[styles.quickActionTitle, { color: COLORS.INFO }]}>
                  View All Schedules
                </Text>
                <Text style={styles.quickActionDescription}>
                  See team schedule overview
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.scheduleFeatures}>
              <Text style={styles.featuresTitle}>Scheduling Features:</Text>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.SUCCESS} />
                <Text style={styles.featureText}>Real-time availability checking</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.SUCCESS} />
                <Text style={styles.featureText}>Conflict detection and prevention</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.SUCCESS} />
                <Text style={styles.featureText}>Agent timetable integration</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.SUCCESS} />
                <Text style={styles.featureText}>Site assignment management</Text>
              </View>
            </View>
          </View>
        )}

        {selectedTab === 'performance' && (
          <View style={styles.performanceSection}>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Team Performance</Text>
              <Text style={styles.listSubtitle}>
                Performance metrics for your team
              </Text>
            </View>

            {agents.length > 0 ? (
              agents.map(renderPerformanceCard)
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="bar-chart-outline" size={48} color={COLORS.GRAY[400]} />
                <Text style={styles.emptyText}>No performance data</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Message Modal */}
      <Modal
        visible={showMessageModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowMessageModal(false)}
            >
              <Ionicons name="close" size={24} color={COLORS.DARK} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Send Message</Text>
            <TouchableOpacity
              style={styles.modalSendButton}
              onPress={submitMessage}
            >
              <Text style={styles.modalSendText}>Send</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            {selectedAgent && (
              <>
                <View style={styles.recipientInfo}>
                  <Text style={styles.recipientLabel}>To:</Text>
                  <Text style={styles.recipientName}>
                    {selectedAgent.firstName} {selectedAgent.lastName}
                  </Text>
                </View>

                <View style={styles.messageInputContainer}>
                  <Text style={styles.messageLabel}>Message</Text>
                  <TextInput
                    style={styles.messageInput}
                    placeholder="Type your message here..."
                    value={messageText}
                    onChangeText={setMessageText}
                    multiline
                    numberOfLines={6}
                  />
                </View>
              </>
            )}
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY[200],
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.PRIMARY,
  },
  tabText: {
    fontSize: 12,
    color: COLORS.GRAY[500],
    marginLeft: 4,
    fontWeight: '500',
  },
  tabTextActive: {
    color: COLORS.PRIMARY,
    fontWeight: '600',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.DARK,
  },
  listSubtitle: {
    fontSize: 14,
    color: COLORS.GRAY[600],
    marginTop: 2,
  },
  createScheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: SIZES.BORDER_RADIUS,
  },
  createScheduleText: {
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
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
    width: 50,
    height: 50,
    borderRadius: 25,
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
  agentEmail: {
    fontSize: 14,
    color: COLORS.GRAY[600],
    marginBottom: 2,
  },
  agentPhone: {
    fontSize: 12,
    color: COLORS.GRAY[500],
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
  agentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: SIZES.BORDER_RADIUS,
    flex: 1,
    marginHorizontal: 2,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: COLORS.WHITE,
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  performanceCard: {
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
  performanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  performanceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.DARK,
  },
  performanceRating: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.DARK,
  },
  scheduleQuickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quickActionCard: {
    width: '48%',
    borderRadius: SIZES.BORDER_RADIUS,
    padding: 16,
    alignItems: 'center',
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  quickActionDescription: {
    fontSize: 12,
    color: COLORS.GRAY[600],
    textAlign: 'center',
  },
  scheduleFeatures: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.BORDER_RADIUS,
    padding: 16,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.DARK,
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: COLORS.GRAY[700],
    marginLeft: 8,
  },
  comingSoonContainer: {
    alignItems: 'center',
    padding: SIZES.PADDING * 2,
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.BORDER_RADIUS,
  },
  comingSoonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.GRAY[600],
    marginTop: 16,
    marginBottom: 8,
  },
  comingSoonSubtext: {
    fontSize: 14,
    color: COLORS.GRAY[500],
  },
  emptyContainer: {
    alignItems: 'center',
    padding: SIZES.PADDING * 2,
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.BORDER_RADIUS,
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
  modalSendButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: SIZES.BORDER_RADIUS,
  },
  modalSendText: {
    color: COLORS.WHITE,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: SIZES.PADDING,
  },
  recipientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  recipientLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.GRAY[600],
    marginRight: 8,
  },
  recipientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.DARK,
  },
  messageInputContainer: {
    flex: 1,
  },
  messageLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.DARK,
    marginBottom: 8,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: COLORS.GRAY[300],
    borderRadius: SIZES.BORDER_RADIUS,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.DARK,
    height: 120,
    textAlignVertical: 'top',
  },
});

export default SupervisorTeamScreen;
