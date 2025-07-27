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
  FlatList,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants';
import { ApiService } from '../../services/apiService';

const MessagingScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'supervisors', 'team', 'announcements'
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadMessagingData();
  }, [filter]);

  const loadMessagingData = async () => {
    try {
      setLoading(true);

      const [conversationsResponse, announcementsResponse] = await Promise.all([
        ApiService.getAgentConversations({ filter }),
        ApiService.getAnnouncements()
      ]);

      if (conversationsResponse.success) {
        const processedConversations = conversationsResponse.data.conversations.map(conv => ({
          ...conv,
          lastMessageTime: formatTime(conv.lastMessage?.createdAt),
          lastMessageDate: formatDate(conv.lastMessage?.createdAt),
          timeAgo: getTimeAgo(conv.lastMessage?.createdAt),
        }));

        // Sort by last message time
        processedConversations.sort((a, b) =>
          new Date(b.lastMessage?.createdAt || 0) - new Date(a.lastMessage?.createdAt || 0)
        );

        setConversations(processedConversations);

        // Calculate unread count
        const unread = processedConversations.reduce((count, conv) =>
          count + (conv.unreadCount || 0), 0
        );
        setUnreadCount(unread);
      }

      if (announcementsResponse.success) {
        const processedAnnouncements = announcementsResponse.data.announcements.map(ann => ({
          ...ann,
          formattedDate: formatDate(ann.createdAt),
          formattedTime: formatTime(ann.createdAt),
          timeAgo: getTimeAgo(ann.createdAt),
        }));

        setAnnouncements(processedAnnouncements);
      }
    } catch (error) {
      console.error('Messaging data loading error:', error);
      Alert.alert('Error', 'Failed to load messaging data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMessagingData();
    setRefreshing(false);
  }, [filter]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return '';
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;

    return formatDate(dateString);
  };

  const getParticipantType = (conversation) => {
    if (conversation.type === 'supervisor') return 'Supervisor';
    if (conversation.type === 'team') return 'Team Chat';
    if (conversation.type === 'support') return 'Support';
    return 'Chat';
  };

  const getConversationIcon = (conversation) => {
    switch (conversation.type) {
      case 'supervisor': return 'person-circle';
      case 'team': return 'people';
      case 'support': return 'help-circle';
      default: return 'chatbubble';
    }
  };

  const handleConversationPress = (conversation) => {
    navigation.navigate('ChatConversation', {
      conversationId: conversation.id,
      conversation: conversation,
      onUpdate: loadMessagingData
    });
  };

  const handleNewMessage = () => {
    Alert.alert(
      'New Message',
      'Who would you like to message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Supervisor',
          onPress: () => navigation.navigate('NewMessage', {
            type: 'supervisor',
            onSuccess: loadMessagingData
          })
        },
        {
          text: 'Team',
          onPress: () => navigation.navigate('NewMessage', {
            type: 'team',
            onSuccess: loadMessagingData
          })
        },
        {
          text: 'Support',
          onPress: () => navigation.navigate('NewMessage', {
            type: 'support',
            onSuccess: loadMessagingData
          })
        },
      ]
    );
  };

  const handleAnnouncementPress = (announcement) => {
    navigation.navigate('AnnouncementDetails', {
      announcementId: announcement.id,
      announcement: announcement
    });
  };

  const filterButtons = [
    { key: 'all', label: 'All', icon: 'list' },
    { key: 'supervisors', label: 'Supervisors', icon: 'person-circle' },
    { key: 'team', label: 'Team', icon: 'people' },
    { key: 'announcements', label: 'Announcements', icon: 'megaphone' },
  ];

  const renderConversationItem = ({ item: conversation }) => (
    <TouchableOpacity
      style={[
        styles.conversationCard,
        conversation.unreadCount > 0 && styles.unreadConversation
      ]}
      onPress={() => handleConversationPress(conversation)}
    >
      <View style={styles.conversationHeader}>
        <View style={styles.participantSection}>
          <View style={styles.avatarContainer}>
            <Ionicons
              name={getConversationIcon(conversation)}
              size={24}
              color={COLORS.PRIMARY}
            />
            {conversation.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.conversationInfo}>
            <Text style={styles.participantName}>
              {conversation.participantName || getParticipantType(conversation)}
            </Text>
            <Text style={styles.participantType}>
              {getParticipantType(conversation)}
            </Text>
          </View>
        </View>
        <View style={styles.timeInfo}>
          <Text style={styles.timeText}>{conversation.timeAgo}</Text>
          {conversation.unreadCount > 0 && (
            <View style={styles.unreadIndicator} />
          )}
        </View>
      </View>

      <Text style={[
        styles.lastMessage,
        conversation.unreadCount > 0 && styles.unreadMessage
      ]} numberOfLines={2}>
        {conversation.lastMessage?.content || 'No messages yet'}
      </Text>
    </TouchableOpacity>
  );

  const renderAnnouncementItem = ({ item: announcement }) => (
    <TouchableOpacity
      style={styles.announcementCard}
      onPress={() => handleAnnouncementPress(announcement)}
    >
      <View style={styles.announcementHeader}>
        <View style={styles.announcementIcon}>
          <Ionicons name="megaphone" size={20} color={COLORS.WHITE} />
        </View>
        <View style={styles.announcementInfo}>
          <Text style={styles.announcementTitle}>{announcement.title}</Text>
          <Text style={styles.announcementMeta}>
            From: {announcement.author?.name || 'Management'} • {announcement.timeAgo}
          </Text>
        </View>
        {!announcement.isRead && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NEW</Text>
          </View>
        )}
      </View>

      <Text style={styles.announcementPreview} numberOfLines={2}>
        {announcement.content}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

  const displayData = filter === 'announcements' ? announcements : conversations;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <View style={styles.headerUnreadBadge}>
              <Text style={styles.headerUnreadText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.newMessageButton}
            onPress={handleNewMessage}
          >
            <Ionicons name="add" size={20} color={COLORS.WHITE} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Buttons */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {filterButtons.map((button) => (
          <TouchableOpacity
            key={button.key}
            style={[
              styles.filterButton,
              filter === button.key && styles.activeFilterButton
            ]}
            onPress={() => setFilter(button.key)}
          >
            <Ionicons
              name={button.icon}
              size={16}
              color={filter === button.key ? COLORS.WHITE : COLORS.PRIMARY}
            />
            <Text style={[
              styles.filterButtonText,
              filter === button.key && styles.activeFilterButtonText
            ]}>
              {button.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Messages/Announcements List */}
      {displayData.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name={filter === 'announcements' ? 'megaphone-outline' : 'chatbubbles-outline'}
            size={64}
            color={COLORS.GRAY[400]}
          />
          <Text style={styles.emptyStateTitle}>
            {filter === 'announcements' ? 'No Announcements' : 'No Messages'}
          </Text>
          <Text style={styles.emptyStateText}>
            {filter === 'announcements'
              ? 'No announcements available at the moment'
              : 'Start a conversation with your team or supervisors'}
          </Text>
          {filter !== 'announcements' && (
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={handleNewMessage}
            >
              <Text style={styles.emptyStateButtonText}>Send Your First Message</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={displayData}
          renderItem={filter === 'announcements' ? renderAnnouncementItem : renderConversationItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );

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
    alignItems: 'center',
    gap: 8,
  },
  headerUnreadBadge: {
    backgroundColor: COLORS.ERROR,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  headerUnreadText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.WHITE,
  },
  newMessageButton: {
    backgroundColor: COLORS.PRIMARY,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY[200],
  },
  filterContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
    gap: 6,
  },
  activeFilterButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.PRIMARY,
  },
  activeFilterButtonText: {
    color: COLORS.WHITE,
  },
  messagesList: {
    padding: 16,
  },
  conversationCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadConversation: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.PRIMARY,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  participantSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.PRIMARY}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.ERROR,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.WHITE,
  },
  unreadBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.WHITE,
  },
  conversationInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT,
    marginBottom: 2,
  },
  participantType: {
    fontSize: 12,
    color: COLORS.GRAY[600],
  },
  timeInfo: {
    alignItems: 'flex-end',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: COLORS.GRAY[500],
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.PRIMARY,
  },
  lastMessage: {
    fontSize: 14,
    color: COLORS.GRAY[600],
    lineHeight: 20,
  },
  unreadMessage: {
    fontWeight: '500',
    color: COLORS.TEXT,
  },
  announcementCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.INFO,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  announcementHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 12,
  },
  announcementIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.INFO,
    justifyContent: 'center',
    alignItems: 'center',
  },
  announcementInfo: {
    flex: 1,
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT,
    marginBottom: 4,
  },
  announcementMeta: {
    fontSize: 12,
    color: COLORS.GRAY[600],
  },
  newBadge: {
    backgroundColor: COLORS.SUCCESS,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.WHITE,
  },
  announcementPreview: {
    fontSize: 14,
    color: COLORS.GRAY[700],
    lineHeight: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.GRAY[600],
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.GRAY[500],
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyStateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.WHITE,
  },
});

export default MessagingScreen;
