import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants';
import { useAuth } from '../store/AuthContext';

const AgentAvailabilityChecker = ({ 
  visible, 
  onClose, 
  onAgentSelect, 
  selectedDate, 
  startTime, 
  endTime,
  excludeAgentId = null 
}) => {
  const { apiService } = useAuth();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [agentAvailability, setAgentAvailability] = useState({});

  useEffect(() => {
    if (visible) {
      loadAgentsAndAvailability();
    }
  }, [visible, selectedDate, startTime, endTime]);

  const loadAgentsAndAvailability = async () => {
    try {
      setLoading(true);
      
      // Load agents
      const agentsResponse = await apiService.request('/supervisor/agents');
      
      if (agentsResponse.success) {
        const agentsList = agentsResponse.data.agents || [];
        setAgents(agentsList);
        
        // Check availability for each agent
        const availabilityPromises = agentsList.map(agent => 
          checkAgentAvailability(agent.id)
        );
        
        const availabilityResults = await Promise.all(availabilityPromises);
        
        const availabilityMap = {};
        agentsList.forEach((agent, index) => {
          availabilityMap[agent.id] = availabilityResults[index];
        });
        
        setAgentAvailability(availabilityMap);
      }
    } catch (error) {
      console.error('Load agents availability error:', error);
      Alert.alert('Error', 'Failed to load agent availability');
    } finally {
      setLoading(false);
    }
  };

  const checkAgentAvailability = async (agentId) => {
    try {
      if (!selectedDate || !startTime || !endTime) {
        return { isAvailable: true, conflicts: [] };
      }

      const params = new URLSearchParams({
        agentId,
        date: selectedDate,
        startTime,
        endTime
      });

      const response = await apiService.request(`/supervisor/schedules/conflicts?${params.toString()}`);
      
      if (response.success) {
        return {
          isAvailable: !response.data.hasConflicts,
          conflicts: response.data.conflicts || []
        };
      }
      
      return { isAvailable: true, conflicts: [] };
    } catch (error) {
      console.error('Check agent availability error:', error);
      return { isAvailable: true, conflicts: [] };
    }
  };

  const getAvailabilityStatus = (agentId) => {
    const availability = agentAvailability[agentId];
    if (!availability) {
      return { status: 'checking', color: COLORS.GRAY[400], text: 'Checking...' };
    }
    
    if (availability.isAvailable) {
      return { status: 'available', color: COLORS.SUCCESS, text: 'Available' };
    } else {
      return { 
        status: 'unavailable', 
        color: COLORS.SECONDARY, 
        text: `${availability.conflicts.length} conflict(s)` 
      };
    }
  };

  const handleAgentSelect = (agent) => {
    const availability = agentAvailability[agent.id];
    
    if (!availability || !availability.isAvailable) {
      // Show conflict details
      const conflicts = availability?.conflicts || [];
      if (conflicts.length > 0) {
        const conflictMessages = conflicts.map(conflict => 
          `${conflict.startTime} - ${conflict.endTime} at ${conflict.siteName}`
        ).join('\n');
        
        Alert.alert(
          'Agent Unavailable',
          `${agent.firstName} ${agent.lastName} has conflicts:\n\n${conflictMessages}`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Select Anyway', 
              style: 'destructive',
              onPress: () => {
                onAgentSelect(agent);
                onClose();
              }
            }
          ]
        );
        return;
      }
    }
    
    onAgentSelect(agent);
    onClose();
  };

  const renderAgentCard = (agent) => {
    if (excludeAgentId && agent.id === excludeAgentId) {
      return null;
    }

    const availabilityStatus = getAvailabilityStatus(agent.id);
    const availability = agentAvailability[agent.id];

    return (
      <TouchableOpacity
        key={agent.id}
        style={[
          styles.agentCard,
          !availabilityStatus.status === 'available' && styles.unavailableCard
        ]}
        onPress={() => handleAgentSelect(agent)}
      >
        <View style={styles.agentHeader}>
          <View style={styles.agentInfo}>
            <View style={styles.agentAvatar}>
              <Ionicons name="person" size={20} color={COLORS.PRIMARY} />
            </View>
            <View style={styles.agentDetails}>
              <Text style={styles.agentName}>
                {agent.firstName} {agent.lastName}
              </Text>
              <Text style={styles.agentEmail}>{agent.email}</Text>
              <Text style={styles.agentPhone}>{agent.phone}</Text>
            </View>
          </View>
          
          <View style={styles.availabilityContainer}>
            <View style={[styles.availabilityDot, { 
              backgroundColor: availabilityStatus.color 
            }]} />
            <Text style={[styles.availabilityText, { 
              color: availabilityStatus.color 
            }]}>
              {availabilityStatus.text}
            </Text>
          </View>
        </View>

        {/* Show conflict details if unavailable */}
        {availability && !availability.isAvailable && availability.conflicts.length > 0 && (
          <View style={styles.conflictsContainer}>
            <Text style={styles.conflictsTitle}>Conflicts:</Text>
            {availability.conflicts.map((conflict, index) => (
              <View key={index} style={styles.conflictItem}>
                <Ionicons name="alert-circle" size={14} color={COLORS.SECONDARY} />
                <Text style={styles.conflictText}>
                  {conflict.startTime} - {conflict.endTime} at {conflict.siteName}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Current status */}
        <View style={styles.agentStatus}>
          <View style={styles.statusItem}>
            <Ionicons 
              name={agent.status === 'active' ? 'checkmark-circle' : 'time'} 
              size={16} 
              color={agent.status === 'active' ? COLORS.SUCCESS : COLORS.GRAY[500]} 
            />
            <Text style={styles.statusText}>
              {agent.status === 'active' ? 'On Duty' : 'Off Duty'}
            </Text>
          </View>
          
          {agent.isOnline !== undefined && (
            <View style={styles.statusItem}>
              <Ionicons 
                name={agent.isOnline ? 'radio-button-on' : 'radio-button-off'} 
                size={16} 
                color={agent.isOnline ? COLORS.SUCCESS : COLORS.GRAY[500]} 
              />
              <Text style={styles.statusText}>
                {agent.isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color={COLORS.DARK} />
          </TouchableOpacity>
          <Text style={styles.title}>Select Available Agent</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Schedule Info */}
        <View style={styles.scheduleInfo}>
          <Text style={styles.scheduleInfoTitle}>Requested Schedule:</Text>
          <Text style={styles.scheduleInfoText}>
            {selectedDate} from {startTime} to {endTime}
          </Text>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.SUCCESS }]} />
            <Text style={styles.legendText}>Available</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.SECONDARY }]} />
            <Text style={styles.legendText}>Has Conflicts</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.GRAY[400] }]} />
            <Text style={styles.legendText}>Checking...</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.PRIMARY} />
            <Text style={styles.loadingText}>Checking agent availability...</Text>
          </View>
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {agents.length > 0 ? (
              agents.map(renderAgentCard)
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={48} color={COLORS.GRAY[400]} />
                <Text style={styles.emptyText}>No agents found</Text>
              </View>
            )}
            
            <View style={styles.bottomPadding} />
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SIZES.PADDING,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY[200],
    paddingTop: 50,
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.DARK,
  },
  placeholder: {
    width: 40,
  },
  scheduleInfo: {
    backgroundColor: COLORS.GRAY[100],
    padding: SIZES.PADDING,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY[200],
  },
  scheduleInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.DARK,
    marginBottom: 4,
  },
  scheduleInfoText: {
    fontSize: 16,
    color: COLORS.PRIMARY,
    fontWeight: '500',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: SIZES.PADDING,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY[200],
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: COLORS.GRAY[600],
  },
  content: {
    flex: 1,
    padding: SIZES.PADDING,
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
    borderWidth: 2,
    borderColor: 'transparent',
  },
  unavailableCard: {
    borderColor: COLORS.SECONDARY,
    backgroundColor: `${COLORS.SECONDARY}05`,
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
  agentEmail: {
    fontSize: 12,
    color: COLORS.GRAY[600],
    marginBottom: 2,
  },
  agentPhone: {
    fontSize: 12,
    color: COLORS.GRAY[500],
  },
  availabilityContainer: {
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
    fontWeight: '600',
  },
  conflictsContainer: {
    backgroundColor: `${COLORS.SECONDARY}10`,
    padding: 8,
    borderRadius: SIZES.BORDER_RADIUS,
    marginBottom: 8,
  },
  conflictsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.SECONDARY,
    marginBottom: 4,
  },
  conflictItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  conflictText: {
    fontSize: 11,
    color: COLORS.SECONDARY,
    marginLeft: 4,
  },
  agentStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    color: COLORS.GRAY[600],
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.GRAY[600],
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: SIZES.PADDING * 2,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.GRAY[600],
    marginTop: 12,
  },
  bottomPadding: {
    height: 20,
  },
});

export default AgentAvailabilityChecker;
