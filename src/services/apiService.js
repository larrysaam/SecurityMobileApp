import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
const getApiBaseUrl = () => {
  if (__DEV__) {
    // For development, try to detect the correct localhost URL
    if (typeof window !== 'undefined' && window.location) {
      // Web environment - use same host as the web app
      return `http://localhost:3000/api`;
    }
    // React Native environment
    return 'http://localhost:3000/api';
  }
  return 'https://your-production-api.com/api';
};

const API_BASE_URL = getApiBaseUrl();

// Storage keys
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_data';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = null;
    this.refreshToken = null;
  }

  // Initialize service with stored tokens
  async initialize() {
    try {
      this.token = await AsyncStorage.getItem(TOKEN_KEY);
      this.refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error initializing API service:', error);
    }
  }

  // Set authentication tokens
  async setTokens(token, refreshToken) {
    this.token = token;
    this.refreshToken = refreshToken;
    
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
      if (refreshToken) {
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }
    } catch (error) {
      console.error('Error storing tokens:', error);
    }
  }

  // Clear authentication tokens
  async clearTokens() {
    this.token = null;
    this.refreshToken = null;
    
    try {
      await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  // Get stored user data
  async getStoredUser() {
    try {
      const userData = await AsyncStorage.getItem(USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting stored user:', error);
      return null;
    }
  }

  // Store user data
  async storeUser(user) {
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Error storing user:', error);
    }
  }

  // Make HTTP request with automatic token handling
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add authorization header if token exists
    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      console.log(`🌐 API Request: ${config.method || 'GET'} ${url}`);

      const response = await fetch(url, config);
      const data = await response.json();

      console.log(`📡 API Response: ${response.status}`, data);

      // Handle token expiration
      if (response.status === 401 && data.message?.includes('expired')) {
        console.log('🔄 Token expired, attempting refresh...');
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Retry the original request with new token
          config.headers.Authorization = `Bearer ${this.token}`;
          const retryResponse = await fetch(url, config);
          return await retryResponse.json();
        } else {
          // Refresh failed, clear tokens and throw error
          await this.clearTokens();
          throw new Error('Session expired. Please login again.');
        }
      }

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`❌ API request failed for ${endpoint}:`, error);

      // Handle network errors
      if (error.message === 'Network request failed' || error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection and ensure the backend server is running.');
      }

      throw error;
    }
  }

  // Refresh access token
  async refreshAccessToken() {
    if (!this.refreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        this.token = data.data.token;
        await AsyncStorage.setItem(TOKEN_KEY, this.token);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  // Authentication methods
  async login(email, password) {
    console.log('🔐 API Service login called with:', { email, password: password.substring(0, 3) + '***' });
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (data.success) {
      await this.setTokens(data.data.token, data.data.refreshToken);
      await this.storeUser(data.data.user);
    }

    return data;
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      await this.clearTokens();
    }
  }

  async getCurrentUser() {
    return await this.request('/auth/me');
  }

  // Agent Dashboard methods
  async getAgentDashboard() {
    return await this.request('/agent/dashboard');
  }

  async getAgentStats() {
    return await this.request('/agent/stats');
  }

  // Schedule methods
  async getAgentSchedule(startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return await this.request(`/agent/schedule${query}`);
  }

  async getTodaySchedule() {
    return await this.request('/agent/schedule/today');
  }

  async getAgentSchedules() {
    return await this.request('/agent/schedules');
  }

  async getAgentScheduleDetails(scheduleId) {
    return await this.request(`/agent/schedule/${scheduleId}`);
  }

  async getAgentShiftStatus() {
    return await this.request('/agent/shift-status');
  }

  async clockIn(data) {
    return await this.request('/agent/clock-in', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async clockOut(data) {
    return await this.request('/agent/clock-out', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Reports methods
  async getAgentReports(params = {}) {
    const query = new URLSearchParams(params).toString();
    return await this.request(`/agent/reports${query ? `?${query}` : ''}`);
  }

  async createReport(data) {
    return await this.request('/agent/reports', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getReportDetails(reportId) {
    return await this.request(`/agent/reports/${reportId}`);
  }

  // Alerts methods
  async getAgentAlerts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return await this.request(`/agent/alerts${query ? `?${query}` : ''}`);
  }

  async createAlert(data) {
    return await this.request('/agent/alerts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAlertDetails(alertId) {
    return await this.request(`/agent/alerts/${alertId}`);
  }

  // Messaging methods
  async getAgentConversations(params = {}) {
    const query = new URLSearchParams(params).toString();
    return await this.request(`/agent/conversations${query ? `?${query}` : ''}`);
  }

  async getAnnouncements() {
    return await this.request('/agent/announcements');
  }

  async sendMessage(data) {
    return await this.request('/agent/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getScheduleByDate(date) {
    return await this.request(`/agent/schedule/${date}`);
  }

  // Clock In/Out methods
  async clockIn(siteId, method, location, qrCode) {
    return await this.request('/agent/clock-in', {
      method: 'POST',
      body: JSON.stringify({ siteId, method, location, qrCode }),
    });
  }

  async clockOut(siteId, method, location, qrCode) {
    return await this.request('/agent/clock-out', {
      method: 'POST',
      body: JSON.stringify({ siteId, method, location, qrCode }),
    });
  }

  async getClockStatus() {
    return await this.request('/agent/clock-status');
  }

  async getTimesheet(startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return await this.request(`/agent/timesheet${query}`);
  }

  // Reports methods
  async getReports(filters = {}) {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return await this.request(`/agent/reports${query}`);
  }

  async createReport(reportData) {
    return await this.request('/agent/reports', {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  }

  async getReport(id) {
    return await this.request(`/agent/reports/${id}`);
  }

  async updateReport(id, updates) {
    return await this.request(`/agent/reports/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteReport(id) {
    return await this.request(`/agent/reports/${id}`, {
      method: 'DELETE',
    });
  }

  async getReportTemplates() {
    return await this.request('/agent/reports/templates');
  }

  // Alerts methods
  async getAlerts(filters = {}) {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined) params.append(key, filters[key]);
    });
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return await this.request(`/agent/alerts${query}`);
  }

  async createAlert(alertData) {
    return await this.request('/agent/alerts', {
      method: 'POST',
      body: JSON.stringify(alertData),
    });
  }

  async markAlertAsRead(id) {
    return await this.request(`/agent/alerts/${id}/read`, {
      method: 'PUT',
    });
  }

  async sendEmergencyAlert(message, location) {
    return await this.request('/agent/alerts/emergency', {
      method: 'POST',
      body: JSON.stringify({ message, location }),
    });
  }

  // Chat methods
  async getChats() {
    return await this.request('/agent/chats');
  }

  async getChatMessages(chatId, page = 1, limit = 50) {
    return await this.request(`/agent/chats/${chatId}/messages?page=${page}&limit=${limit}`);
  }

  async sendMessage(chatId, message) {
    return await this.request(`/agent/chats/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  async markChatAsRead(chatId) {
    return await this.request(`/agent/chats/${chatId}/read`, {
      method: 'PUT',
    });
  }

  // Location methods
  async updateLocation(latitude, longitude, accuracy, address) {
    return await this.request('/agent/location', {
      method: 'POST',
      body: JSON.stringify({ latitude, longitude, accuracy, address }),
    });
  }

  async getLocationHistory(startDate, endDate, limit) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (limit) params.append('limit', limit);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return await this.request(`/agent/location/history${query}`);
  }

  // Profile methods
  async getProfile() {
    return await this.request('/agent/profile');
  }

  async updateProfile(updates) {
    return await this.request('/agent/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async uploadAvatar(formData) {
    return await this.request('/agent/profile/avatar', {
      method: 'POST',
      headers: {
        // Don't set Content-Type for FormData, let browser set it
        Authorization: `Bearer ${this.token}`,
      },
      body: formData,
    });
  }

  // Chat/Messaging methods
  async getMessages(chatId) {
    return await this.request(`/agent/messages/${chatId}`);
  }

  async sendMessage(chatId, text, type = 'text') {
    return await this.request('/agent/messages', {
      method: 'POST',
      body: JSON.stringify({ chatId, text, type }),
    });
  }

  async markMessageAsRead(messageId) {
    return await this.request(`/agent/messages/${messageId}/read`, {
      method: 'PUT',
    });
  }

  // Emergency alert methods
  async sendEmergencyAlert(location, description) {
    return await this.request('/agent/emergency', {
      method: 'POST',
      body: JSON.stringify({ location, description, timestamp: new Date().toISOString() }),
    });
  }

  // File upload methods
  async uploadFile(formData) {
    return await this.request('/agent/upload', {
      method: 'POST',
      headers: {
        // Don't set Content-Type for FormData, let browser set it
        Authorization: `Bearer ${this.token}`,
      },
      body: formData,
    });
  }

  // Site information methods
  async getSiteDetails(siteId) {
    return await this.request(`/sites/${siteId}`);
  }

  async getSiteQRCode(siteId) {
    return await this.request(`/sites/${siteId}/qr-code`);
  }

  // Offline sync methods
  async syncOfflineData(data) {
    return await this.request('/agent/sync', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getLastSyncTimestamp() {
    return await this.request('/agent/sync/timestamp');
  }
}

// Create and export a singleton instance
const apiService = new ApiService();

export default apiService;
