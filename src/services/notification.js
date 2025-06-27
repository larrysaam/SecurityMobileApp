// import * as Notifications from 'expo-notifications';
// import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { storage } from '../utils';

// Configuration des notifications (commented out for development)
// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowAlert: true,
//     shouldPlaySound: true,
//     shouldSetBadge: true,
//   }),
// });

class NotificationService {
  constructor() {
    this.expoPushToken = null;
    this.notificationListener = null;
    this.responseListener = null;
  }

  async init() {
    try {
      // Mock implementation for development
      console.log('Mock: Initializing notification service');
      return true;

      // Real implementation (commented out for now):
      // await this.requestPermissions();
      // await this.getExpoPushToken();
      // this.setupListeners();
      // return true;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  }

  async requestPermissions() {
    if (!Device.isDevice) {
      throw new Error('Push notifications only work on physical devices');
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      throw new Error('Notification permission denied');
    }

    // Configuration pour Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'BahinLink',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
      });

      // Channel for emergency alerts
      await Notifications.setNotificationChannelAsync('emergency', {
        name: 'Emergency Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: '#FF0000',
        sound: 'default',
      });
    }

    return finalStatus;
  }

  async getExpoPushToken() {
    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-expo-project-id', // À remplacer par votre project ID
      });

      this.expoPushToken = token.data;
      await storage.setItem('expoPushToken', this.expoPushToken);
      
      return this.expoPushToken;
    } catch (error) {
      console.error('Error getting Expo push token:', error);
      throw error;
    }
  }

  setupListeners() {
    // Listener pour les notifications reçues
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
        this.handleNotificationReceived(notification);
      }
    );

    // Listener pour les interactions avec les notifications
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification response:', response);
        this.handleNotificationResponse(response);
      }
    );
  }

  handleNotificationReceived(notification) {
    // Traitement personnalisé des notifications reçues
    const { data, request } = notification;
    
    // Sauvegarder la notification localement
    this.saveNotificationLocally(notification);
    
    // Traitement spécifique selon le type
    switch (data?.type) {
      case 'emergency':
        this.handleEmergencyNotification(notification);
        break;
      case 'schedule':
        this.handleScheduleNotification(notification);
        break;
      case 'message':
        this.handleMessageNotification(notification);
        break;
      default:
        break;
    }
  }

  handleNotificationResponse(response) {
    const { notification, actionIdentifier } = response;
    const { data } = notification.request.content;

    // Navigation basée sur le type de notification
    switch (data?.type) {
      case 'emergency':
        // Naviguer vers l'écran d'alerte
        break;
      case 'schedule':
        // Naviguer vers le planning
        break;
      case 'message':
        // Naviguer vers la messagerie
        break;
      default:
        break;
    }
  }

  async saveNotificationLocally(notification) {
    try {
      const notifications = await storage.getItem('notifications') || [];
      notifications.unshift({
        id: notification.request.identifier,
        title: notification.request.content.title,
        body: notification.request.content.body,
        data: notification.request.content.data,
        timestamp: new Date().toISOString(),
        isRead: false
      });

      // Garder seulement les 100 dernières notifications
      if (notifications.length > 100) {
        notifications.splice(100);
      }

      await storage.setItem('notifications', notifications);
    } catch (error) {
      console.error('Error saving notification locally:', error);
    }
  }

  // Envoyer une notification locale
  async sendLocalNotification(title, body, data = {}, options = {}) {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: options.sound || 'default',
          priority: options.priority || Notifications.AndroidImportance.HIGH,
        },
        trigger: options.trigger || null, // null = immédiat
      });

      return notificationId;
    } catch (error) {
      console.error('Error sending local notification:', error);
      throw error;
    }
  }

  // Programmer une notification
  async scheduleNotification(title, body, triggerDate, data = {}) {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: {
          date: triggerDate,
        },
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  }

  // Annuler une notification programmée
  async cancelNotification(notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  // Annuler toutes les notifications programmées
  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  // Obtenir les notifications locales
  async getLocalNotifications() {
    try {
      return await storage.getItem('notifications') || [];
    } catch (error) {
      console.error('Error getting local notifications:', error);
      return [];
    }
  }

  // Marquer une notification comme lue
  async markNotificationAsRead(notificationId) {
    try {
      const notifications = await this.getLocalNotifications();
      const updatedNotifications = notifications.map(notif => 
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      );
      
      await storage.setItem('notifications', updatedNotifications);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Gestion spécifique des notifications d'urgence
  handleEmergencyNotification(notification) {
    // Vibration d'urgence
    if (Platform.OS === 'android') {
      // Pattern de vibration d'urgence
      // Cette fonctionnalité nécessiterait expo-haptics
    }
    
    // Son d'urgence personnalisé si nécessaire
    // Affichage d'une alerte système si l'app est ouverte
  }

  handleScheduleNotification(notification) {
    // Traitement des notifications de planning
  }

  handleMessageNotification(notification) {
    // Traitement des notifications de message
  }

  // Nettoyer les listeners
  cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }

  // Obtenir le badge count
  async getBadgeCount() {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Error getting badge count:', error);
      return 0;
    }
  }

  // Définir le badge count
  async setBadgeCount(count) {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }
}

export default new NotificationService();
