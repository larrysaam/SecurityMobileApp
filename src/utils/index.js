import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage utilities with proper AsyncStorage implementation
export const storage = {
  async setItem(key, value) {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
      console.log('Storage setItem:', key);
    } catch (error) {
      console.error('Error storing data:', error);
    }
  },

  async getItem(key) {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      console.log('Storage getItem:', key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Error retrieving data:', error);
      return null;
    }
  },

  async removeItem(key) {
    try {
      await AsyncStorage.removeItem(key);
      console.log('Storage removeItem:', key);
    } catch (error) {
      console.error('Error removing data:', error);
    }
  },

  async clear() {
    try {
      await AsyncStorage.clear();
      console.log('Storage clear');
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }
};

// Date utilities
export const dateUtils = {
  formatDate(date, format = 'DD/MM/YYYY') {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    switch (format) {
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'DD/MM/YYYY HH:mm':
        return `${day}/${month}/${year} ${hours}:${minutes}`;
      case 'HH:mm':
        return `${hours}:${minutes}`;
      default:
        return d.toLocaleDateString('fr-FR');
    }
  },

  isToday(date) {
    const today = new Date();
    const checkDate = new Date(date);
    return today.toDateString() === checkDate.toDateString();
  },

  getDaysDifference(date1, date2) {
    const diffTime = Math.abs(new Date(date2) - new Date(date1));
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },

  getTimeFromNow(date) {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }
};

// Validation utilities
export const validation = {
  isEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isPhone(phone) {
    const phoneRegex = /^(\+33|0)[1-9](\d{8})$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  },

  isStrongPassword(password) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 digit
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  },

  isEmpty(value) {
    return !value || value.trim().length === 0;
  }
};

// Location utilities
export const locationUtils = {
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  },

  isWithinGeofence(userLat, userLon, siteLat, siteLon, radius = 100) {
    const distance = this.calculateDistance(userLat, userLon, siteLat, siteLon);
    return distance <= radius;
  },

  formatCoordinates(lat, lon) {
    return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
  }
};

// String utilities
export const stringUtils = {
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },

  truncate(str, length = 50) {
    return str.length > length ? str.substring(0, length) + '...' : str;
  },

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  formatPhone(phone) {
    // Format: 06 12 34 56 78
    return phone.replace(/(\d{2})(?=\d)/g, '$1 ');
  }
};

// Permission utilities
export const permissions = {
  canAccess(userRole, requiredRole) {
    const roleHierarchy = {
      'admin': 4,
      'supervisor': 3,
      'agent': 2,
      'client': 1
    };
    
    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  },

  hasPermission(userRole, action) {
    const permissions = {
      'admin': ['*'],
      'supervisor': ['view_agents', 'validate_reports', 'manage_sites', 'send_messages'],
      'agent': ['checkin', 'checkout', 'create_reports', 'view_schedule', 'send_alerts'],
      'client': ['view_sites', 'view_reports', 'create_requests']
    };

    return permissions[userRole]?.includes('*') || permissions[userRole]?.includes(action);
  }
};

// Error handling utilities
export const errorHandler = {
  getErrorMessage(error) {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
    return 'An unexpected error occurred';
  },

  logError(error, context = '') {
    console.error(`[${context}] Error:`, error);
    // Here we could send the error to a monitoring service
  }
};
