import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants';
import AgentBottomNavbar from '../../components/AgentBottomNavbar';
import { useAuth } from '../../store/AuthContext';

const AgentChatScreen = ({ navigation }) => {
  const { apiService } = useAuth();
  const [activeChat, setActiveChat] = useState(null);
  const [message, setMessage] = useState('');
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    if (activeChat) {
      loadMessages(activeChat.id);
    }
  }, [activeChat]);

  const loadChats = async () => {
    try {
      setLoading(true);
      const response = await apiService.getChats();

      if (response.success) {
        setChats(response.data || []);
      } else {
        Alert.alert('Error', 'Failed to load chats');
      }
    } catch (error) {
      console.error('Load chats error:', error);
      Alert.alert('Error', 'Failed to load chats');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (chatId) => {
    try {
      const response = await apiService.getChatMessages(chatId);

      if (response.success) {
        setMessages(response.data.messages || []);
      } else {
        Alert.alert('Error', 'Failed to load messages');
      }
    } catch (error) {
      console.error('Load messages error:', error);
      Alert.alert('Error', 'Failed to load messages');
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'control': return 'radio';
      case 'supervisor': return 'person-circle';
      case 'agent': return 'people';
      case 'maintenance': return 'construct';
      default: return 'chatbubble';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'control': return COLORS.SECONDARY;
      case 'supervisor': return COLORS.PRIMARY;
      case 'agent': return COLORS.INFO;
      case 'maintenance': return COLORS.WARNING;
      default: return COLORS.GRAY[500];
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !activeChat || sendingMessage) return;

    try {
      setSendingMessage(true);
      const response = await apiService.sendMessage(activeChat.id, message.trim());

      if (response.success) {
        setMessage('');
        // Add the new message to the local state immediately
        const newMessage = {
          id: response.data.id,
          message: response.data.message,
          senderId: response.data.senderId,
          senderName: response.data.senderName,
          timestamp: response.data.timestamp
        };
        setMessages(prev => [...prev, newMessage]);

        // Mark chat as read
        await apiService.markChatAsRead(activeChat.id);
      } else {
        Alert.alert('Error', 'Failed to send message');
      }
    } catch (error) {
      console.error('Send message error:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const renderChatList = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Loading chats...</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.chatList}>
        <Text style={styles.sectionTitle}>Messages</Text>
        {chats.length > 0 ? (
          chats.map((chat) => {
            const timeAgo = getTimeAgo(new Date(chat.lastMessageTime));
            return (
              <TouchableOpacity
                key={chat.id}
                style={styles.chatItem}
                onPress={() => setActiveChat(chat)}
              >
                <View style={[styles.chatAvatar, { backgroundColor: `${getTypeColor(chat.type)}15` }]}>
                  <Ionicons name={getTypeIcon(chat.type)} size={24} color={getTypeColor(chat.type)} />
                  <View style={styles.onlineIndicator} />
                </View>
                <View style={styles.chatInfo}>
                  <View style={styles.chatHeader}>
                    <Text style={styles.chatName}>{chat.name}</Text>
                    <Text style={styles.chatTime}>{timeAgo}</Text>
                  </View>
                  <Text style={styles.lastMessage} numberOfLines={1}>
                    {chat.lastMessage}
                  </Text>
                </View>
                {chat.unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{chat.unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-outline" size={48} color={COLORS.GRAY[400]} />
            <Text style={styles.emptyText}>No conversations</Text>
            <Text style={styles.emptySubtext}>Start a conversation with your team</Text>
          </View>
        )}
      </ScrollView>
    );
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  };

  const renderChatView = () => (
    <View style={styles.chatView}>
      {/* Chat Header */}
      <View style={styles.chatHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setActiveChat(null)}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.DARK} />
        </TouchableOpacity>
        <View style={[styles.chatAvatar, { backgroundColor: `${getTypeColor(activeChat.type)}15` }]}>
          <Ionicons name={getTypeIcon(activeChat.type)} size={20} color={getTypeColor(activeChat.type)} />
          {activeChat.online && <View style={styles.onlineIndicator} />}
        </View>
        <View style={styles.chatTitleInfo}>
          <Text style={styles.chatTitle}>{activeChat.name}</Text>
          <Text style={styles.chatStatus}>
            {activeChat.online ? 'Online' : 'Offline'}
          </Text>
        </View>
        <TouchableOpacity style={styles.callButton}>
          <Ionicons name="call" size={20} color={COLORS.PRIMARY} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView style={styles.messagesContainer}>
        {messages.map((msg) => {
          const isMe = msg.senderId === 'agent' || msg.senderName?.includes('Agent');
          const messageTime = new Date(msg.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          });

          return (
            <View
              key={msg.id}
              style={[
                styles.messageItem,
                isMe ? styles.myMessage : styles.theirMessage,
              ]}
            >
              <Text style={[
                styles.messageText,
                { color: isMe ? COLORS.WHITE : COLORS.DARK }
              ]}>
                {msg.message}
              </Text>
              <Text style={[
                styles.messageTime,
                { color: isMe ? COLORS.WHITE : COLORS.GRAY[500] }
              ]}>
                {messageTime}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Message Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <TextInput
          style={styles.messageInput}
          placeholder="Type a message..."
          value={message}
          onChangeText={setMessage}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, { opacity: message.trim() && !sendingMessage ? 1 : 0.5 }]}
          onPress={handleSendMessage}
          disabled={!message.trim() || sendingMessage}
        >
          {sendingMessage ? (
            <ActivityIndicator size="small" color={COLORS.WHITE} />
          ) : (
            <Ionicons name="send" size={20} color={COLORS.WHITE} />
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );

  return (
    <View style={styles.container}>
      {activeChat ? renderChatView() : (
        <>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Chat</Text>
            <TouchableOpacity style={styles.newChatButton}>
              <Ionicons name="add" size={24} color={COLORS.PRIMARY} />
            </TouchableOpacity>
          </View>
          {renderChatList()}
        </>
      )}

      {!activeChat && <AgentBottomNavbar navigation={navigation} currentRoute="AgentChat" />}
    </View>
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY[200],
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.DARK,
  },
  newChatButton: {
    padding: 8,
  },
  chatList: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.DARK,
    margin: SIZES.PADDING,
    marginBottom: 12,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.PADDING,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY[100],
  },
  chatAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.SUCCESS,
    borderWidth: 2,
    borderColor: COLORS.WHITE,
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.DARK,
  },
  chatTime: {
    fontSize: 12,
    color: COLORS.GRAY[500],
  },
  lastMessage: {
    fontSize: 14,
    color: COLORS.GRAY[600],
  },
  unreadBadge: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  chatView: {
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  chatTitleInfo: {
    flex: 1,
    marginLeft: 8,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.DARK,
  },
  chatStatus: {
    fontSize: 12,
    color: COLORS.GRAY[600],
  },
  callButton: {
    padding: 8,
  },
  messagesContainer: {
    flex: 1,
    padding: SIZES.PADDING,
  },
  messageItem: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.PRIMARY,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.WHITE,
  },
  messageText: {
    fontSize: 16,
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 11,
    opacity: 0.7,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: SIZES.PADDING,
    backgroundColor: COLORS.WHITE,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY[200],
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.GRAY[300],
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.PADDING * 2,
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
});

export default AgentChatScreen;
