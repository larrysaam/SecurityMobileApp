import './src/setup'; // Import React setup first
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import SafeAreaWrapper from './src/components/SafeAreaWrapper';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens
import SimpleLoginScreen from './src/screens/SimpleLoginScreen';
import DemoScreen from './src/screens/DemoScreen';

// Import Agent screens
import SimpleAgentDashboardScreen from './src/screens/agent/SimpleAgentDashboardScreen';
import AgentReportsScreen from './src/screens/agent/AgentReportsScreen';
import AgentAlertsScreen from './src/screens/agent/AgentAlertsScreen';
import AgentChatScreen from './src/screens/agent/AgentChatScreen';
import ApiTestScreen from './src/screens/agent/ApiTestScreen';

// Import Admin Screens
import AdminDashboardScreen from './src/screens/admin/AdminDashboardScreen';
import AdminUsersScreen from './src/screens/admin/AdminUsersScreen';
import AdminSitesScreen from './src/screens/admin/AdminSitesScreen';
import AdminTrackingScreen from './src/screens/admin/AdminTrackingScreen';
import AdminSystemScreen from './src/screens/admin/AdminSystemScreen';

// Import Client Screens
import ClientDashboardScreen from './src/screens/client/ClientDashboardScreen';
import ClientSitesScreen from './src/screens/client/ClientSitesScreen';
import ClientReportsScreen from './src/screens/client/ClientReportsScreen';
import ClientCommunicationScreen from './src/screens/client/ClientCommunicationScreen';
import ClientAnalyticsScreen from './src/screens/client/ClientAnalyticsScreen';

// Import Supervisor Screens
import SupervisorDashboardScreen from './src/screens/supervisor/SupervisorDashboardScreen';
import SupervisorTrackingScreen from './src/screens/supervisor/SupervisorTrackingScreen';
import SupervisorReportsScreen from './src/screens/supervisor/SupervisorReportsScreen';
import SupervisorTeamScreen from './src/screens/supervisor/SupervisorTeamScreen';
import SupervisorAnalyticsScreen from './src/screens/supervisor/SupervisorAnalyticsScreen';
import SupervisorScheduleScreen from './src/screens/supervisor/SupervisorScheduleScreen';

// Import Auth Provider
import { AuthProvider } from './src/store/AuthContext';

const Stack = createStackNavigator();

export default function App() {
  return (
    <AuthProvider>
      <SafeAreaWrapper>
        <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="Login" component={SimpleLoginScreen} />

          {/* Admin Screens */}
          <Stack.Screen name="AdminDashboardMain" component={AdminDashboardScreen} />
          <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
          <Stack.Screen name="AdminSites" component={AdminSitesScreen} />
          <Stack.Screen name="AdminTracking" component={AdminTrackingScreen} />
          <Stack.Screen name="AdminSystem" component={AdminSystemScreen} />

          {/* Supervisor Screens */}
          <Stack.Screen name="SupervisorDashboard" component={SupervisorDashboardScreen} />
          <Stack.Screen name="SupervisorTracking" component={SupervisorTrackingScreen} />
          <Stack.Screen name="SupervisorReports" component={SupervisorReportsScreen} />
          <Stack.Screen name="SupervisorTeam" component={SupervisorTeamScreen} />
          <Stack.Screen name="SupervisorAnalytics" component={SupervisorAnalyticsScreen} />
          <Stack.Screen name="SupervisorSchedule" component={SupervisorScheduleScreen} />

          {/* Agent Screens */}
          <Stack.Screen name="AgentDashboard" component={SimpleAgentDashboardScreen} />
          <Stack.Screen name="AgentReports" component={AgentReportsScreen} />
          <Stack.Screen name="AgentAlerts" component={AgentAlertsScreen} />
          <Stack.Screen name="AgentChat" component={AgentChatScreen} />
          <Stack.Screen name="ApiTest" component={ApiTestScreen} />

          {/* Client Screens */}
          <Stack.Screen name="ClientDashboard" component={ClientDashboardScreen} />
          <Stack.Screen name="ClientSites" component={ClientSitesScreen} />
          <Stack.Screen name="ClientReports" component={ClientReportsScreen} />
          <Stack.Screen name="ClientCommunication" component={ClientCommunicationScreen} />
          <Stack.Screen name="ClientAnalytics" component={ClientAnalyticsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="auto" />
    </SafeAreaWrapper>
    </AuthProvider>
  );
}


