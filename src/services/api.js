import { API_ENDPOINTS } from '../constants';
import { storage } from '../utils';

class ApiService {
  constructor() {
    this.baseURL = API_ENDPOINTS.BASE_URL;
    this.token = null;
  }

  async init() {
    try {
      this.token = await storage.getItem('authToken');
    } catch (error) {
      console.log('No stored token found');
    }
  }

  // Mock API methods for development
  async login(credentials) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock user data based on email
    const mockUsers = {
      'admin@bahin.com': {
        id: '1',
        email: 'admin@bahin.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        avatar: null,
        isActive: true,
      },
      'supervisor@bahin.com': {
        id: '2',
        email: 'supervisor@bahin.com',
        firstName: 'Supervisor',
        lastName: 'User',
        role: 'supervisor',
        avatar: null,
        isActive: true,
      },
      'agent@bahin.com': {
        id: '3',
        email: 'agent@bahin.com',
        firstName: 'Agent',
        lastName: 'User',
        role: 'agent',
        avatar: null,
        isActive: true,
      },
      'client@bahin.com': {
        id: '4',
        email: 'client@bahin.com',
        firstName: 'Client',
        lastName: 'User',
        role: 'client',
        avatar: null,
        isActive: true,
      },
    };

    const user = mockUsers[credentials.email];
    if (!user || credentials.password !== 'password123') {
      throw new Error('Invalid credentials');
    }

    // Store mock token
    const token = 'mock-jwt-token-' + Date.now();
    await storage.setItem('authToken', token);
    await storage.setItem('user', user);
    this.token = token;

    return { user, token };
  }

  async getProfile() {
    if (!this.token) {
      throw new Error('Not authenticated');
    }

    const user = await storage.getItem('user');
    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async logout() {
    await storage.removeItem('authToken');
    await storage.removeItem('user');
    this.token = null;
  }

  async updateProfile(userData) {
    const currentUser = await storage.getItem('user');
    const updatedUser = { ...currentUser, ...userData };
    await storage.setItem('user', updatedUser);
    return updatedUser;
  }

  async refreshToken() {
    // Mock refresh token
    const newToken = 'mock-jwt-token-' + Date.now();
    await storage.setItem('authToken', newToken);
    this.token = newToken;
    return { token: newToken };
  }

  // Mock data methods
  async getSchedule(params = {}) {
    return [
      {
        id: '1',
        agentId: params.agentId || '3',
        siteId: '1',
        siteName: 'Site Alpha',
        siteAddress: '123 Main Street',
        date: new Date().toISOString().split('T')[0],
        startTime: '08:00',
        endTime: '16:00',
        status: 'active',
      },
      {
        id: '2',
        agentId: params.agentId || '3',
        siteId: '2',
        siteName: 'Site Beta',
        siteAddress: '456 Oak Avenue',
        date: new Date().toISOString().split('T')[0],
        startTime: '18:00',
        endTime: '02:00',
        status: 'pending',
      },
    ];
  }

  async getReports(params = {}) {
    return [];
  }

  async getAlerts(params = {}) {
    return [];
  }

  async createReport(reportData) {
    return { id: Date.now().toString(), ...reportData };
  }

  async createAlert(alertData) {
    return { id: Date.now().toString(), ...alertData };
  }

  async createSchedule(scheduleData) {
    return { id: Date.now().toString(), ...scheduleData };
  }

  // Auth methods
  async login(credentials) {
    const response = await this.request(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.token) {
      this.token = response.token;
      await storage.setItem('authToken', response.token);
      await storage.setItem('user', response.user);
    }

    return response;
  }

  async logout() {
    try {
      await this.request(API_ENDPOINTS.AUTH.LOGOUT, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.token = null;
      await storage.removeItem('authToken');
      await storage.removeItem('user');
    }
  }

  async refreshToken() {
    const response = await this.request(API_ENDPOINTS.AUTH.REFRESH, {
      method: 'POST',
    });

    if (response.token) {
      this.token = response.token;
      await storage.setItem('authToken', response.token);
    }

    return response;
  }

  // User methods
  async getProfile() {
    return this.request(API_ENDPOINTS.USERS.PROFILE);
  }

  async updateProfile(userData) {
    return this.request(API_ENDPOINTS.USERS.UPDATE, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async getUsers(filters = {}) {
    const queryString = new URLSearchParams(filters).toString();
    return this.request(`${API_ENDPOINTS.USERS.LIST}?${queryString}`);
  }

  // Tracking methods
  async checkIn(data) {
    return this.request(API_ENDPOINTS.TRACKING.CHECKIN, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async checkOut(data) {
    return this.request(API_ENDPOINTS.TRACKING.CHECKOUT, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateLocation(locationData) {
    return this.request(API_ENDPOINTS.TRACKING.LOCATION, {
      method: 'POST',
      body: JSON.stringify(locationData),
    });
  }

  async getTrackingHistory(filters = {}) {
    const queryString = new URLSearchParams(filters).toString();
    return this.request(`${API_ENDPOINTS.TRACKING.HISTORY}?${queryString}`);
  }

  // Reports methods
  async createReport(reportData) {
    return this.request(API_ENDPOINTS.REPORTS.CREATE, {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  }

  async getReports(filters = {}) {
    const queryString = new URLSearchParams(filters).toString();
    return this.request(`${API_ENDPOINTS.REPORTS.LIST}?${queryString}`);
  }

  async updateReport(reportId, data) {
    return this.request(`${API_ENDPOINTS.REPORTS.UPDATE}/${reportId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async validateReport(reportId, validationData) {
    return this.request(`${API_ENDPOINTS.REPORTS.VALIDATE}/${reportId}`, {
      method: 'POST',
      body: JSON.stringify(validationData),
    });
  }

  // Schedule methods
  async getSchedule(filters = {}) {
    const queryString = new URLSearchParams(filters).toString();
    return this.request(`${API_ENDPOINTS.SCHEDULE.LIST}?${queryString}`);
  }

  async createSchedule(scheduleData) {
    return this.request(API_ENDPOINTS.SCHEDULE.CREATE, {
      method: 'POST',
      body: JSON.stringify(scheduleData),
    });
  }

  async updateSchedule(scheduleId, data) {
    return this.request(`${API_ENDPOINTS.SCHEDULE.UPDATE}/${scheduleId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSchedule(scheduleId) {
    return this.request(`${API_ENDPOINTS.SCHEDULE.DELETE}/${scheduleId}`, {
      method: 'DELETE',
    });
  }

  // Alerts methods
  async createAlert(alertData) {
    return this.request(API_ENDPOINTS.ALERTS.CREATE, {
      method: 'POST',
      body: JSON.stringify(alertData),
    });
  }

  async getAlerts(filters = {}) {
    const queryString = new URLSearchParams(filters).toString();
    return this.request(`${API_ENDPOINTS.ALERTS.LIST}?${queryString}`);
  }

  async updateAlert(alertId, data) {
    return this.request(`${API_ENDPOINTS.ALERTS.UPDATE}/${alertId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // File upload method
  async uploadFile(file, type = 'image') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return this.request('/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });
  }
}

export default new ApiService();
