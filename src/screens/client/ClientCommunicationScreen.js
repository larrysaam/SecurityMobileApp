import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants';
import ClientBottomNavbar from '../../components/ClientBottomNavbar';
import { useAuth } from '../../store/AuthContext';

const ClientCommunicationScreen = ({ navigation }) => {
  const { user, apiService } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [newMessage, setNewMessage] = useState({
    subject: '',
    message: '',
    priority: 'medium',
    recipient: 'security_team',
  });

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      if (!refreshing) setLoading(true);
      
      const response = await apiService.request('/client/messages');
      
      if (response.success) {
        setMessages(response.data || []);
      } else {
        Alert.alert('Error', 'Failed to load messages');
      }
    } catch (error) {
      console.error('Load messages error:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMessages();
  };

  const handleSendMessage = async () => {
    try {
      if (!newMessage.subject || !newMessage.message) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      const response = await apiService.request('/client/messages', {
        method: 'POST',
        body: JSON.stringify(newMessage),
      });

      if (response.success) {
        Alert.alert('Success', 'Message sent successfully');
        setShowComposeModal(false);
        setNewMessage({
          subject: '',
          message: '',
          priority: 'medium',
          recipient: 'security_team',
        });
        loadMessages();
      } else {
        Alert.alert('Error', 'Failed to send message');
      }
    } catch (error) {
      console.error('Send message error:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return COLORS.SECONDARY;
      case 'high': return COLORS.WARNING;
      case 'medium': return COLORS.INFO;
      case 'low': return COLORS.SUCCESS;
      default: return COLORS.GRAY[400];
    }
  };

  const renderMessageCard = (message) => (
    <TouchableOpacity
      key={message.id}
      style={[styles.messageCard, !message.isRead && styles.unreadMessage]}
      onPress={() => navigation.navigate('ClientConversation', { conversationId: message.conversationId })}
    >
      <View style={styles.messageHeader}>
        <View style={styles.messageInfo}>
          <View style={styles.senderAvatar}>
            <Ionicons 
              name={message.senderId === user.id ? "send" : "person"} 
              size={20} 
              color={COLORS.PRIMARY} 
            />
          </View>
          <View style={styles.messageDetails}>
            <Text style={styles.senderName}>
              {message.senderId === user.id ? 'You' : 'Security Team'}
            </Text>
            <Text style={styles.messageTime}>
              {new Date(message.timestamp).toLocaleDateString()} at{' '}
              {new Date(message.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
          </View>
        </View>
        
        <View style={styles.messageStatus}>
          {!message.isRead && (
            <View style={styles.unreadDot} />
          )}
          <Ionicons 
            name="chevron-forward" 
            size={16} 
            color={COLORS.GRAY[400]} 
          />
        </View>
      </View>

      <Text style={styles.messagePreview} numberOfLines={2}>
        {message.message}
      </Text>
    </TouchableOpacity>
  );

  const quickActions = [
    {
      id: 'emergency',
      title: 'Emergency Contact',
      icon: 'alert-circle',
      color: COLORS.SECONDARY,
      description: 'Immediate security assistance',
      onPress: () => {
        setNewMessage({
          ...newMessage,
          subject: 'Emergency Assistance Required',
          priority: 'urgent',
        });
        setShowComposeModal(true);
      },
    },
    {
      id: 'schedule',
      title: 'Schedule Request',
      icon: 'calendar',
      color: COLORS.INFO,
      description: 'Request schedule changes',
      onPress: () => {
        setNewMessage({
          ...newMessage,
          subject: 'Schedule Change Request',
          priority: 'medium',
        });
        setShowComposeModal(true);
      },
    },
    {
      id: 'feedback',
      title: 'Service Feedback',
      icon: 'star',
      color: COLORS.WARNING,
      description: 'Provide service feedback',
      onPress: () => {
        setNewMessage({
          ...newMessage,
          subject: 'Service Feedback',
          priority: 'low',
        });
        setShowComposeModal(true);
      },
    },
    {
      id: 'general',
      title: 'General Inquiry',
      icon: 'help-circle',
      color: COLORS.SUCCESS,
      description: 'General questions or concerns',
      onPress: () => {
        setNewMessage({
          ...newMessage,
          subject: 'General Inquiry',
          priority: 'medium',
        });
        setShowComposeModal(true);
      },
    },
  ];

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Loading messages...</Text>
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
        <Text style={styles.headerTitle}>Communication</Text>
        <TouchableOpacity
          style={styles.composeButton}
          onPress={() => setShowComposeModal(true)}
        >
          <Ionicons name="create" size={24} color={COLORS.PRIMARY} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[styles.quickActionCard, { backgroundColor: `${action.color}15` }]}
                onPress={action.onPress}
              >
                <Ionicons name={action.icon} size={24} color={action.color} />
                <Text style={[styles.quickActionTitle, { color: action.color }]}>
                  {action.title}
                </Text>
                <Text style={styles.quickActionDescription}>
                  {action.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Messages */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Messages</Text>
            <Text style={styles.messageCount}>
              {messages.filter(m => !m.isRead).length} unread
            </Text>
          </View>

          {messages.length > 0 ? (
            <View style={styles.messagesList}>
              {messages.map(renderMessageCard)}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={48} color={COLORS.GRAY[400]} />
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>
                Start a conversation with your security team
              </Text>
              <TouchableOpacity
                style={styles.startChatButton}
                onPress={() => setShowComposeModal(true)}
              >
                <Text style={styles.startChatText}>Send First Message</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Compose Message Modal */}
      <Modal
        visible={showComposeModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowComposeModal(false)}
            >
              <Ionicons name="close" size={24} color={COLORS.DARK} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Message</Text>
            <TouchableOpacity
              style={styles.modalSendButton}
              onPress={handleSendMessage}
            >
              <Text style={styles.modalSendText}>Send</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Subject *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter message subject"
                value={newMessage.subject}
                onChangeText={(text) => setNewMessage({ ...newMessage, subject: text })}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Priority</Text>
              <View style={styles.prioritySelector}>
                {['low', 'medium', 'high', 'urgent'].map((priority) => (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.priorityOption,
                      newMessage.priority === priority && styles.priorityOptionActive,
                      { borderColor: getPriorityColor(priority) }
                    ]}
                    onPress={() => setNewMessage({ ...newMessage, priority })}
                  >
                    <Text style={[
                      styles.priorityOptionText,
                      newMessage.priority === priority && { color: COLORS.WHITE }
                    ]}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Message *</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                placeholder="Type your message here..."
                value={newMessage.message}
                onChangeText={(text) => setNewMessage({ ...newMessage, message: text })}
                multiline
                numberOfLines={6}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>

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
  composeButton: {
    padding: 8,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  messageCount: {
    fontSize: 14,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: '48%',
    borderRadius: SIZES.BORDER_RADIUS,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
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
  messagesList: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.BORDER_RADIUS,
  },
  messageCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY[200],
  },
  unreadMessage: {
    backgroundColor: `${COLORS.PRIMARY}05`,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  senderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.PRIMARY}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  messageDetails: {
    flex: 1,
  },
  senderName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.DARK,
    marginBottom: 2,
  },
  messageTime: {
    fontSize: 12,
    color: COLORS.GRAY[500],
  },
  messageStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.PRIMARY,
    marginRight: 8,
  },
  messagePreview: {
    fontSize: 14,
    color: COLORS.GRAY[700],
    lineHeight: 20,
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
    marginBottom: 16,
  },
  startChatButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: SIZES.BORDER_RADIUS,
  },
  startChatText: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: '600',
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
    height: 120,
    textAlignVertical: 'top',
  },
  prioritySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  priorityOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: SIZES.BORDER_RADIUS,
    borderWidth: 1,
    backgroundColor: COLORS.WHITE,
  },
  priorityOptionActive: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  priorityOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.DARK,
  },
});

export default ClientCommunicationScreen;
