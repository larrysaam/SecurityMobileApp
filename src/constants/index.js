// Application Constants
export const APP_CONFIG = {
  NAME: 'BahinLink',
  VERSION: '1.0.0',
  COMPANY: 'BAHIN SARL',
  DESCRIPTION: 'Mobile security management application'
};

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  SUPERVISOR: 'supervisor', 
  AGENT: 'agent',
  CLIENT: 'client'
};

// Screen Names
export const SCREENS = {
  // Auth
  LOGIN: 'Login',
  REGISTER: 'Register',
  FORGOT_PASSWORD: 'ForgotPassword',
  
  // Main Navigation
  DASHBOARD: 'Dashboard',
  PROFILE: 'Profile',
  SETTINGS: 'Settings',
  
  // Agent Screens
  AGENT_DASHBOARD: 'AgentDashboard',
  CHECKIN: 'CheckIn',
  CHECKOUT: 'CheckOut',
  REPORTS: 'Reports',
  SCHEDULE: 'Schedule',
  ALERTS: 'Alerts',
  
  // Supervisor Screens
  SUPERVISOR_DASHBOARD: 'SupervisorDashboard',
  AGENT_TRACKING: 'AgentTracking',
  REPORT_VALIDATION: 'ReportValidation',
  SITE_MANAGEMENT: 'SiteManagement',
  
  // Admin Screens
  ADMIN_DASHBOARD: 'AdminDashboard',
  USER_MANAGEMENT: 'UserManagement',
  SCHEDULE_MANAGEMENT: 'ScheduleManagement',
  STATISTICS: 'Statistics',
  
  // Client Screens
  CLIENT_DASHBOARD: 'ClientDashboard',
  SITE_STATUS: 'SiteStatus',
  SERVICE_REQUESTS: 'ServiceRequests'
};

// API Endpoints
export const API_ENDPOINTS = {
  BASE_URL: __DEV__ ? 'http://localhost:3000/api' : 'https://api.bahinlink.com',
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout'
  },
  USERS: {
    PROFILE: '/users/profile',
    UPDATE: '/users/update',
    LIST: '/users/list'
  },
  TRACKING: {
    CHECKIN: '/tracking/checkin',
    CHECKOUT: '/tracking/checkout',
    LOCATION: '/tracking/location',
    HISTORY: '/tracking/history'
  },
  REPORTS: {
    CREATE: '/reports/create',
    LIST: '/reports/list',
    UPDATE: '/reports/update',
    VALIDATE: '/reports/validate'
  },
  SCHEDULE: {
    LIST: '/schedule/list',
    CREATE: '/schedule/create',
    UPDATE: '/schedule/update',
    DELETE: '/schedule/delete'
  },
  ALERTS: {
    CREATE: '/alerts/create',
    LIST: '/alerts/list',
    UPDATE: '/alerts/update'
  }
};

// Colors
export const COLORS = {
  PRIMARY: '#1E3A8A',      // Professional blue
  SECONDARY: '#DC2626',     // Alert red
  SUCCESS: '#059669',       // Success green
  WARNING: '#D97706',       // Warning orange
  INFO: '#0284C7',         // Information blue
  LIGHT: '#F8FAFC',        // Very light gray
  DARK: '#1F2937',         // Dark gray
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  GRAY: {
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827'
  }
};

// Sizes
export const SIZES = {
  PADDING: 16,
  MARGIN: 16,
  BORDER_RADIUS: 8,
  ICON_SIZE: 24,
  BUTTON_HEIGHT: 48,
  INPUT_HEIGHT: 48
};

// Status Types
export const STATUS_TYPES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// Alert Types
export const ALERT_TYPES = {
  EMERGENCY: 'emergency',
  INCIDENT: 'incident',
  MAINTENANCE: 'maintenance',
  INFO: 'info'
};

// Report Types
export const REPORT_TYPES = {
  DAILY: 'daily',
  INCIDENT: 'incident',
  MAINTENANCE: 'maintenance',
  INSPECTION: 'inspection'
};
