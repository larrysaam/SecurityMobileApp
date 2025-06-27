import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { SCREENS, COLORS } from '../constants';

// Import Agent Screens
import AgentDashboardScreen from '../screens/agent/AgentDashboardScreen';
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
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Tracking':
              iconName = focused ? 'location' : 'location-outline';
              break;
            case 'Reports':
              iconName = focused ? 'document-text' : 'document-text-outline';
              break;
            case 'Schedule':
              iconName = focused ? 'calendar' : 'calendar-outline';
              break;
            case 'Alerts':
              iconName = focused ? 'alert-circle' : 'alert-circle-outline';
              break;
            case 'Messages':
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
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
        component={AgentDashboardScreen}
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
        }}
      />

      <Tab.Screen
        name="Tracking"
        component={TrackingStack}
        options={{
          title: 'Check In/Out',
          tabBarLabel: 'Check In/Out',
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
        name="Schedule"
        component={ScheduleScreen}
        options={{
          title: 'Schedule',
          tabBarLabel: 'Schedule',
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
        name="Messages"
        component={MessagingScreen}
        options={{
          title: 'Messages',
          tabBarLabel: 'Messages',
          tabBarBadge: null, // Will be updated dynamically
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

export default AgentNavigator;
