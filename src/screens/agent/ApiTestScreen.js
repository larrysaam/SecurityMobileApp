import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants';
import { useAuth } from '../../store/AuthContext';

const ApiTestScreen = ({ navigation }) => {
  const { apiService } = useAuth();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({});

  const testEndpoints = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      description: 'Get agent dashboard data',
      endpoint: '/agent/dashboard',
      method: 'GET',
    },
    {
      id: 'schedule',
      name: 'Today Schedule',
      description: 'Get today\'s schedule',
      endpoint: '/agent/schedule/today',
      method: 'GET',
    },
    {
      id: 'reports',
      name: 'Reports',
      description: 'Get agent reports',
      endpoint: '/agent/reports',
      method: 'GET',
    },
    {
      id: 'alerts',
      name: 'Alerts',
      description: 'Get agent alerts',
      endpoint: '/agent/alerts',
      method: 'GET',
    },
    {
      id: 'chats',
      name: 'Chats',
      description: 'Get chat conversations',
      endpoint: '/agent/chats',
      method: 'GET',
    },
    {
      id: 'clockStatus',
      name: 'Clock Status',
      description: 'Get current clock status',
      endpoint: '/agent/clock-status',
      method: 'GET',
    },
    {
      id: 'profile',
      name: 'Profile',
      description: 'Get agent profile',
      endpoint: '/agent/profile',
      method: 'GET',
    },
  ];

  const runTest = async (test) => {
    setLoading(true);
    setResults(prev => ({ ...prev, [test.id]: { status: 'testing' } }));

    try {
      let response;
      
      switch (test.id) {
        case 'dashboard':
          response = await apiService.getAgentDashboard();
          break;
        case 'schedule':
          response = await apiService.getTodaySchedule();
          break;
        case 'reports':
          response = await apiService.getReports();
          break;
        case 'alerts':
          response = await apiService.getAlerts();
          break;
        case 'chats':
          response = await apiService.getChats();
          break;
        case 'clockStatus':
          response = await apiService.getClockStatus();
          break;
        case 'profile':
          response = await apiService.getProfile();
          break;
        default:
          throw new Error('Unknown test');
      }

      setResults(prev => ({
        ...prev,
        [test.id]: {
          status: response.success ? 'success' : 'error',
          data: response,
          timestamp: new Date().toLocaleTimeString(),
        }
      }));

    } catch (error) {
      setResults(prev => ({
        ...prev,
        [test.id]: {
          status: 'error',
          error: error.message,
          timestamp: new Date().toLocaleTimeString(),
        }
      }));
    } finally {
      setLoading(false);
    }
  };

  const runAllTests = async () => {
    setLoading(true);
    setResults({});

    for (const test of testEndpoints) {
      await runTest(test);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setLoading(false);
    Alert.alert('Tests Complete', 'All API tests have been executed.');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return 'checkmark-circle';
      case 'error': return 'close-circle';
      case 'testing': return 'time';
      default: return 'help-circle';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return COLORS.SUCCESS;
      case 'error': return COLORS.SECONDARY;
      case 'testing': return COLORS.WARNING;
      default: return COLORS.GRAY[500];
    }
  };

  const showTestDetails = (test) => {
    const result = results[test.id];
    if (!result) return;

    const details = result.error 
      ? `Error: ${result.error}`
      : `Success: ${JSON.stringify(result.data, null, 2)}`;

    Alert.alert(
      `${test.name} Test Result`,
      `Status: ${result.status}\nTime: ${result.timestamp}\n\n${details}`,
      [{ text: 'OK' }],
      { cancelable: true }
    );
  };

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
        <Text style={styles.headerTitle}>API Test Suite</Text>
        <TouchableOpacity
          style={styles.runAllButton}
          onPress={runAllTests}
          disabled={loading}
        >
          <Text style={styles.runAllText}>Run All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.description}>
          Test all agent API endpoints to verify backend connectivity and functionality.
        </Text>

        {testEndpoints.map((test) => {
          const result = results[test.id];
          const status = result?.status || 'idle';

          return (
            <TouchableOpacity
              key={test.id}
              style={styles.testCard}
              onPress={() => result ? showTestDetails(test) : runTest(test)}
              disabled={loading}
            >
              <View style={styles.testHeader}>
                <View style={styles.testInfo}>
                  <Text style={styles.testName}>{test.name}</Text>
                  <Text style={styles.testDescription}>{test.description}</Text>
                  <Text style={styles.testEndpoint}>
                    {test.method} {test.endpoint}
                  </Text>
                </View>
                <View style={styles.testStatus}>
                  <Ionicons
                    name={getStatusIcon(status)}
                    size={24}
                    color={getStatusColor(status)}
                  />
                  {result?.timestamp && (
                    <Text style={styles.timestamp}>{result.timestamp}</Text>
                  )}
                </View>
              </View>
              
              {status === 'testing' && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={COLORS.PRIMARY} />
                  <Text style={styles.loadingText}>Testing...</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Backend URL: http://localhost:3000/api
          </Text>
          <Text style={styles.footerText}>
            Total Tests: {testEndpoints.length}
          </Text>
        </View>
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SIZES.PADDING,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY[200],
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.DARK,
  },
  runAllButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: SIZES.BORDER_RADIUS,
  },
  runAllText: {
    color: COLORS.WHITE,
    fontWeight: 'bold',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: SIZES.PADDING,
  },
  description: {
    fontSize: 14,
    color: COLORS.GRAY[600],
    marginBottom: 20,
    textAlign: 'center',
  },
  testCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.BORDER_RADIUS,
    padding: SIZES.PADDING,
    marginBottom: 12,
    elevation: 2,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  testInfo: {
    flex: 1,
  },
  testName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.DARK,
    marginBottom: 4,
  },
  testDescription: {
    fontSize: 14,
    color: COLORS.GRAY[600],
    marginBottom: 4,
  },
  testEndpoint: {
    fontSize: 12,
    color: COLORS.PRIMARY,
    fontFamily: 'monospace',
  },
  testStatus: {
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 10,
    color: COLORS.GRAY[500],
    marginTop: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY[200],
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.PRIMARY,
    marginLeft: 8,
  },
  footer: {
    marginTop: 20,
    padding: SIZES.PADDING,
    backgroundColor: COLORS.WHITE,
    borderRadius: SIZES.BORDER_RADIUS,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: COLORS.GRAY[500],
    marginBottom: 4,
  },
});

export default ApiTestScreen;
