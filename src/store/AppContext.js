import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { storage } from '../utils';
import ApiService from '../services/api';
import LocationService from '../services/location';
import NotificationService from '../services/notification';

// Initial state
const initialState = {
  // App state
  isOnline: true,
  isLocationEnabled: false,
  currentLocation: null,
  
  // Data state
  schedule: [],
  reports: [],
  alerts: [],
  notifications: [],
  sites: [],
  agents: [],
  
  // UI state
  loading: {
    schedule: false,
    reports: false,
    alerts: false,
    notifications: false,
  },
  
  // Error state
  errors: {},
};

// Action types
const APP_ACTIONS = {
  SET_ONLINE_STATUS: 'SET_ONLINE_STATUS',
  SET_LOCATION_STATUS: 'SET_LOCATION_STATUS',
  SET_CURRENT_LOCATION: 'SET_CURRENT_LOCATION',
  
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  
  SET_SCHEDULE: 'SET_SCHEDULE',
  ADD_SCHEDULE_ITEM: 'ADD_SCHEDULE_ITEM',
  UPDATE_SCHEDULE_ITEM: 'UPDATE_SCHEDULE_ITEM',
  REMOVE_SCHEDULE_ITEM: 'REMOVE_SCHEDULE_ITEM',
  
  SET_REPORTS: 'SET_REPORTS',
  ADD_REPORT: 'ADD_REPORT',
  UPDATE_REPORT: 'UPDATE_REPORT',
  
  SET_ALERTS: 'SET_ALERTS',
  ADD_ALERT: 'ADD_ALERT',
  UPDATE_ALERT: 'UPDATE_ALERT',
  
  SET_NOTIFICATIONS: 'SET_NOTIFICATIONS',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  MARK_NOTIFICATION_READ: 'MARK_NOTIFICATION_READ',
  
  SET_SITES: 'SET_SITES',
  SET_AGENTS: 'SET_AGENTS',
};

// Reducer
const appReducer = (state, action) => {
  switch (action.type) {
    case APP_ACTIONS.SET_ONLINE_STATUS:
      return { ...state, isOnline: action.payload };

    case APP_ACTIONS.SET_LOCATION_STATUS:
      return { ...state, isLocationEnabled: action.payload };

    case APP_ACTIONS.SET_CURRENT_LOCATION:
      return { ...state, currentLocation: action.payload };

    case APP_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: { ...state.loading, [action.payload.key]: action.payload.value },
      };

    case APP_ACTIONS.SET_ERROR:
      return {
        ...state,
        errors: { ...state.errors, [action.payload.key]: action.payload.error },
      };

    case APP_ACTIONS.CLEAR_ERROR:
      const { [action.payload]: removed, ...remainingErrors } = state.errors;
      return { ...state, errors: remainingErrors };

    case APP_ACTIONS.SET_SCHEDULE:
      return { ...state, schedule: action.payload };

    case APP_ACTIONS.ADD_SCHEDULE_ITEM:
      return { ...state, schedule: [...state.schedule, action.payload] };

    case APP_ACTIONS.UPDATE_SCHEDULE_ITEM:
      return {
        ...state,
        schedule: state.schedule.map(item =>
          item.id === action.payload.id ? { ...item, ...action.payload } : item
        ),
      };

    case APP_ACTIONS.REMOVE_SCHEDULE_ITEM:
      return {
        ...state,
        schedule: state.schedule.filter(item => item.id !== action.payload),
      };

    case APP_ACTIONS.SET_REPORTS:
      return { ...state, reports: action.payload };

    case APP_ACTIONS.ADD_REPORT:
      return { ...state, reports: [action.payload, ...state.reports] };

    case APP_ACTIONS.UPDATE_REPORT:
      return {
        ...state,
        reports: state.reports.map(report =>
          report.id === action.payload.id ? { ...report, ...action.payload } : report
        ),
      };

    case APP_ACTIONS.SET_ALERTS:
      return { ...state, alerts: action.payload };

    case APP_ACTIONS.ADD_ALERT:
      return { ...state, alerts: [action.payload, ...state.alerts] };

    case APP_ACTIONS.UPDATE_ALERT:
      return {
        ...state,
        alerts: state.alerts.map(alert =>
          alert.id === action.payload.id ? { ...alert, ...action.payload } : alert
        ),
      };

    case APP_ACTIONS.SET_NOTIFICATIONS:
      return { ...state, notifications: action.payload };

    case APP_ACTIONS.ADD_NOTIFICATION:
      return { ...state, notifications: [action.payload, ...state.notifications] };

    case APP_ACTIONS.MARK_NOTIFICATION_READ:
      return {
        ...state,
        notifications: state.notifications.map(notif =>
          notif.id === action.payload ? { ...notif, isRead: true } : notif
        ),
      };

    case APP_ACTIONS.SET_SITES:
      return { ...state, sites: action.payload };

    case APP_ACTIONS.SET_AGENTS:
      return { ...state, agents: action.payload };

    default:
      return state;
  }
};

// Create context
const AppContext = createContext();

// Provider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Initialize app services
  useEffect(() => {
    initializeServices();
  }, []);

  const initializeServices = async () => {
    try {
      // Initialize location service
      const locationPermissions = await LocationService.requestPermissions();
      dispatch({
        type: APP_ACTIONS.SET_LOCATION_STATUS,
        payload: locationPermissions.foreground,
      });

      // Initialize notification service
      await NotificationService.init();

      // Get current location if permitted
      if (locationPermissions.foreground) {
        try {
          const location = await LocationService.getCurrentLocation();
          dispatch({
            type: APP_ACTIONS.SET_CURRENT_LOCATION,
            payload: location,
          });
        } catch (error) {
          console.error('Error getting initial location:', error);
        }
      }
    } catch (error) {
      console.error('Error initializing services:', error);
    }
  };

  // Generic data fetching function
  const fetchData = async (key, apiCall, params = {}) => {
    try {
      dispatch({ type: APP_ACTIONS.SET_LOADING, payload: { key, value: true } });
      dispatch({ type: APP_ACTIONS.CLEAR_ERROR, payload: key });

      const data = await apiCall(params);
      
      switch (key) {
        case 'schedule':
          dispatch({ type: APP_ACTIONS.SET_SCHEDULE, payload: data });
          break;
        case 'reports':
          dispatch({ type: APP_ACTIONS.SET_REPORTS, payload: data });
          break;
        case 'alerts':
          dispatch({ type: APP_ACTIONS.SET_ALERTS, payload: data });
          break;
        case 'notifications':
          dispatch({ type: APP_ACTIONS.SET_NOTIFICATIONS, payload: data });
          break;
        case 'sites':
          dispatch({ type: APP_ACTIONS.SET_SITES, payload: data });
          break;
        case 'agents':
          dispatch({ type: APP_ACTIONS.SET_AGENTS, payload: data });
          break;
      }

      return { success: true, data };
    } catch (error) {
      const errorMessage = error.message || `Erreur lors du chargement des ${key}`;
      dispatch({
        type: APP_ACTIONS.SET_ERROR,
        payload: { key, error: errorMessage },
      });
      return { success: false, error: errorMessage };
    } finally {
      dispatch({ type: APP_ACTIONS.SET_LOADING, payload: { key, value: false } });
    }
  };

  // Schedule actions
  const loadSchedule = (filters = {}) => {
    return fetchData('schedule', ApiService.getSchedule, filters);
  };

  const createScheduleItem = async (scheduleData) => {
    try {
      const newItem = await ApiService.createSchedule(scheduleData);
      dispatch({ type: APP_ACTIONS.ADD_SCHEDULE_ITEM, payload: newItem });
      return { success: true, data: newItem };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Reports actions
  const loadReports = (filters = {}) => {
    return fetchData('reports', ApiService.getReports, filters);
  };

  const createReport = async (reportData) => {
    try {
      const newReport = await ApiService.createReport(reportData);
      dispatch({ type: APP_ACTIONS.ADD_REPORT, payload: newReport });
      return { success: true, data: newReport };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Alerts actions
  const loadAlerts = (filters = {}) => {
    return fetchData('alerts', ApiService.getAlerts, filters);
  };

  const createAlert = async (alertData) => {
    try {
      const newAlert = await ApiService.createAlert(alertData);
      dispatch({ type: APP_ACTIONS.ADD_ALERT, payload: newAlert });
      
      // Send local notification for emergency alerts
      if (alertData.type === 'emergency') {
        await NotificationService.sendLocalNotification(
          'Alerte d\'urgence',
          alertData.description,
          { type: 'emergency', alertId: newAlert.id }
        );
      }
      
      return { success: true, data: newAlert };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Location actions
  const updateCurrentLocation = async () => {
    try {
      const location = await LocationService.getCurrentLocation();
      dispatch({
        type: APP_ACTIONS.SET_CURRENT_LOCATION,
        payload: location,
      });
      return { success: true, data: location };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Notification actions
  const loadNotifications = async () => {
    try {
      const notifications = await NotificationService.getLocalNotifications();
      dispatch({ type: APP_ACTIONS.SET_NOTIFICATIONS, payload: notifications });
      return { success: true, data: notifications };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await NotificationService.markNotificationAsRead(notificationId);
      dispatch({ type: APP_ACTIONS.MARK_NOTIFICATION_READ, payload: notificationId });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    // State
    ...state,
    
    // Actions
    loadSchedule,
    createScheduleItem,
    loadReports,
    createReport,
    loadAlerts,
    createAlert,
    updateCurrentLocation,
    loadNotifications,
    markNotificationAsRead,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Hook to use app context
export const useApp = () => {
  const context = useContext(AppContext);
  
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  
  return context;
};

export default AppContext;
