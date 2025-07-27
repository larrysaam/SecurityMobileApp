import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { SCREENS, COLORS } from '../constants';

// Import Agent Screens
import SimpleAgentDashboardScreen from '../screens/agent/SimpleAgentDashboardScreen';
import AgentDashboardScreen from '../screens/agent/AgentDashboardScreen';
import ScheduleDetailsScreen from '../screens/agent/ScheduleDetailsScreen';
import SimpleScheduleDetailsScreen from '../screens/agent/SimpleScheduleDetailsScreen';
import QRClockInScreen from '../screens/agent/QRClockInScreen';
import GPSClockInScreen from '../screens/agent/GPSClockInScreen';
import PatrolReportScreen from '../screens/agent/PatrolReportScreen';
import IncidentAlertScreen from '../screens/agent/IncidentAlertScreen';
import ChatScreen from '../screens/agent/ChatScreen';
import CheckInScreen from '../screens/agent/CheckInScreen';
import CheckOutScreen from '../screens/agent/CheckOutScreen';
import ReportsScreen from '../screens/agent/ReportsScreen';
import CreateReportScreen from '../screens/agent/CreateReportScreen';
import ScheduleScreen from '../screens/agent/ScheduleScreen';
import AlertsScreen from '../screens/agent/AlertsScreen';
import CreateAlertScreen from '../screens/agent/CreateAlertScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import MessagingScreen from '../screens/messaging/MessagingScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();



// Stack Navigator pour les rapports
const ReportsStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="ReportsList" 
      component={ReportsScreen}
      options={{ title: 'My Reports' }}
    />
    <Stack.Screen
      name="CreateReport"
      component={CreateReportScreen}
      options={{ title: 'New Report' }}
    />
  </Stack.Navigator>
);

// Stack Navigator pour les alertes
const AlertsStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="AlertsList" 
      component={AlertsScreen}
      options={{ title: 'Alerts' }}
    />
    <Stack.Screen
      name="CreateAlert"
      component={CreateAlertScreen}
      options={{ title: 'New Alert' }}
    />
  </Stack.Navigator>
);

// Stack Navigator for Dashboard
const DashboardStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="DashboardHome"
      component={SimpleAgentDashboardScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="ScheduleDetailsScreen"
      component={ScheduleDetailsScreen}
      options={{
        title: 'Schedule Details',
        headerStyle: {
          backgroundColor: COLORS.PRIMARY,
        },
        headerTintColor: COLORS.WHITE,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    />
  </Stack.Navigator>
);

// Stack Navigator pour le pointage
const TrackingStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="CheckInOut"
      component={CheckInScreen}
      options={{ title: 'Check In/Out' }}
    />
    <Stack.Screen
      name={SCREENS.CHECKOUT}
      component={CheckOutScreen}
      options={{ title: 'End of Service' }}
    />
  </Stack.Navigator>
);

const AgentNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />

      <Stack.Screen
        name="Schedule"
        component={ScheduleScreen}
        options={{
          presentation: 'modal',
          headerShown: true,
          title: 'My Schedule',
          headerStyle: {
            backgroundColor: COLORS.PRIMARY,
          },
          headerTintColor: COLORS.WHITE,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <Stack.Screen
        name="QRClockIn"
        component={QRClockInScreen}
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="GPSClockIn"
        component={GPSClockInScreen}
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="PatrolReport"
        component={PatrolReportScreen}
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="IncidentAlert"
        component={IncidentAlertScreen}
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'grid' : 'grid-outline';
              break;
            case 'Tracking':
              iconName = focused ? 'time' : 'time-outline';
              break;
            case 'Reports':
              iconName = focused ? 'document-text' : 'document-text-outline';
              break;
            case 'Alerts':
              iconName = focused ? 'alert-circle' : 'alert-circle-outline';
              break;
            case 'Chat':
              iconName = focused ? 'chatbubble' : 'chatbubble-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.PRIMARY,
        tabBarInactiveTintColor: COLORS.GRAY[400],
        tabBarStyle: {
          backgroundColor: COLORS.WHITE,
          borderTopColor: COLORS.GRAY[200],
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: COLORS.PRIMARY,
        },
        headerTintColor: COLORS.WHITE,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardStack}
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
          headerShown: false,
        }}
      />

      <Tab.Screen
        name="Tracking"
        component={TrackingStack}
        options={{
          title: 'Clock In/Out',
          tabBarLabel: 'Clock In/Out',
          headerShown: false,
        }}
      />

      <Tab.Screen
        name="Reports"
        component={ReportsStack}
        options={{
          title: 'Reports',
          tabBarLabel: 'Reports',
          headerShown: false,
        }}
      />

      <Tab.Screen
        name="Alerts"
        component={AlertsStack}
        options={{
          title: 'Alerts',
          tabBarLabel: 'Alerts',
          headerShown: false,
          tabBarBadge: null, // Will be updated dynamically
        }}
      />

      <Tab.Screen
        name="Chat"
        component={MessagingScreen}
        options={{
          title: 'Chat',
          tabBarLabel: 'Chat',
          tabBarBadge: null, // Will be updated dynamically
        }}
      />
    </Tab.Navigator>
  );
};

export default AgentNavigator;
