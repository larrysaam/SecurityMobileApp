import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants';
import apiService from '../../services/apiService';

const ChatScreen = ({ route, navigation }) => {
  const { chatId, chatTitle = 'Support Chat' } = route.params || {};
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    loadMessages();
    // Set up real-time message updates (WebSocket or polling)
    const interval = setInterval(loadMessages, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadMessages = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockMessages = [
        {
          id: '1',
          text: 'Hello! How can I assist you today?',
          sender: 'supervisor',
          senderName: 'John Supervisor',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          type: 'text',
        },
        {
          id: '2',
          text: 'I need to report an issue with the main entrance lock.',
          sender: 'agent',
          senderName: 'You',
          timestamp: new Date(Date.now() - 3000000).toISOString(),
          type: 'text',
        },
        {
          id: '3',
          text: 'Thanks for reporting this. Can you provide more details about the lock issue?',
          sender: 'supervisor',
          senderName: 'John Supervisor',
          timestamp: new Date(Date.now() - 2400000).toISOString(),
          type: 'text',
        },
        {
          id: '4',
          text: 'The electronic lock is not responding to key card access. I had to use the manual override.',
          sender: 'agent',
          senderName: 'You',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          type: 'text',
        },
        {
          id: '5',
          text: 'I\'ve contacted maintenance. They should arrive within the next hour. Please continue using manual override until then.',
          sender: 'supervisor',
          senderName: 'John Supervisor',
          timestamp: new Date(Date.now() - 600000).toISOString(),
          type: 'text',
        },
      ];
      
      setMessages(mockMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setLoading(true);

    try {
      const tempMessage = {
        id: Date.now().toString(),
        text: messageText,
        sender: 'agent',
        senderName: 'You',
        timestamp: new Date().toISOString(),
        type: 'text',
        sending: true,
      };

      // Add message optimistically
      setMessages(prev => [...prev, tempMessage]);

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      // Send to API
      const response = await apiService.request('/agent/messages', {
        method: 'POST',
        data: {
          chatId: chatId || 'default',
          text: messageText,
          type: 'text',
        },
      });

      if (response.success) {
        // Update message with server response
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempMessage.id 
              ? { ...msg, id: response.data.id, sending: false }
              : msg
          )
        );
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
      
      // Remove failed message
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      setNewMessage(messageText); // Restore message text
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const renderMessage = ({ item, index }) => {
    const isAgent = item.sender === 'agent';
    const showSender = index === 0 || messages[index - 1].sender !== item.sender;

    return (
      <View style={[
        styles.messageContainer,
        isAgent ? styles.agentMessage : styles.supervisorMessage,
      ]}>
        {showSender && !isAgent && (
          <Text style={styles.senderName}>{item.senderName}</Text>
        )}
        <View style={[
          styles.messageBubble,
          isAgent ? styles.agentBubble : styles.supervisorBubble,
          item.sending && styles.sendingBubble,
        ]}>
          <Text style={[
            styles.messageText,
            isAgent ? styles.agentText : styles.supervisorText,
          ]}>
            {item.text}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[
              styles.messageTime,
              isAgent ? styles.agentTime : styles.supervisorTime,
            ]}>
              {formatTime(item.timestamp)}
            </Text>
            {item.sending && (
              <Ionicons name="time-outline" size={12} color={COLORS.GRAY[400]} />
            )}
          </View>
        </View>
      </View>
    );
  };

  const handleQuickReply = (text) => {
    setNewMessage(text);
  };

  const quickReplies = [
    'All clear',
    'Need assistance',
    'Issue resolved',
    'On my way',
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.WHITE} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{chatTitle}</Text>
          <Text style={styles.headerSubtitle}>
            {isTyping ? 'Typing...' : 'Online'}
          </Text>
        </View>
        <TouchableOpacity style={styles.headerAction}>
          <Ionicons name="call" size={24} color={COLORS.WHITE} />
        </TouchableOpacity>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Quick Replies */}
      <View style={styles.quickRepliesContainer}>
        <FlatList
          data={quickReplies}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.quickReplyButton}
              onPress={() => handleQuickReply(item)}
            >
              <Text style={styles.quickReplyText}>{item}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.quickRepliesList}
        />
      </View>

      {/* Message Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <View style={styles.inputRow}>
          <TouchableOpacity style={styles.attachButton}>
            <Ionicons name="attach" size={24} color={COLORS.GRAY[600]} />
          </TouchableOpacity>
          
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={500}
            onSubmitEditing={sendMessage}
            blurOnSubmit={false}
          />
          
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!newMessage.trim() || loading) && styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            disabled={!newMessage.trim() || loading}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={newMessage.trim() && !loading ? COLORS.WHITE : COLORS.GRAY[400]} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.GRAY[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.PRIMARY,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.WHITE,
    opacity: 0.8,
  },
  headerAction: {
    padding: 8,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
  },
  agentMessage: {
    alignItems: 'flex-end',
  },
  supervisorMessage: {
    alignItems: 'flex-start',
  },
  senderName: {
    fontSize: 12,
    color: COLORS.GRAY[600],
    marginBottom: 4,
    marginLeft: 12,
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  agentBubble: {
    backgroundColor: COLORS.PRIMARY,
    borderBottomRightRadius: 4,
  },
  supervisorBubble: {
    backgroundColor: COLORS.WHITE,
    borderBottomLeftRadius: 4,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sendingBubble: {
    opacity: 0.7,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  agentText: {
    color: COLORS.WHITE,
  },
  supervisorText: {
    color: COLORS.GRAY[800],
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    justifyContent: 'flex-end',
  },
  messageTime: {
    fontSize: 11,
    marginRight: 4,
  },
  agentTime: {
    color: COLORS.WHITE,
    opacity: 0.7,
  },
  supervisorTime: {
    color: COLORS.GRAY[500],
  },
  quickRepliesContainer: {
    backgroundColor: COLORS.WHITE,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY[200],
    paddingVertical: 8,
  },
  quickRepliesList: {
    paddingHorizontal: 16,
  },
  quickReplyButton: {
    backgroundColor: COLORS.GRAY[100],
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  quickReplyText: {
    fontSize: 14,
    color: COLORS.GRAY[700],
  },
  inputContainer: {
    backgroundColor: COLORS.WHITE,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY[200],
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  attachButton: {
    padding: 8,
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.GRAY[300],
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.GRAY[300],
  },
});

export default ChatScreen;
