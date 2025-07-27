import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { SCREENS, COLORS } from '../constants';

// Import Supervisor Screens
import SupervisorDashboardScreen from '../screens/supervisor/SupervisorDashboardScreen';
import SupervisorScheduleScreen from '../screens/supervisor/SupervisorScheduleScreen';
import SupervisorTeamScreen from '../screens/supervisor/SupervisorTeamScreen';
import MessagingScreen from '../screens/messaging/MessagingScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import PlaceholderScreen from '../screens/PlaceholderScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack Navigator for team management
const TrackingStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="SupervisorTeam"
      component={SupervisorTeamScreen}
      options={{
        title: 'Team Management',
        headerShown: false
      }}
    />
    <Stack.Screen
      name="SupervisorSchedule"
      component={SupervisorScheduleScreen}
      options={{
        title: 'All Schedules',
        headerShown: false
      }}
    />
  </Stack.Navigator>
);

// Stack Navigator for report validation
const ReportsStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="ReportsList"
      component={PlaceholderScreen}
      options={{ title: 'Report Validation' }}
    />
    <Stack.Screen
      name="ReportDetail"
      component={PlaceholderScreen}
      options={{ title: 'Report Details' }}
    />
  </Stack.Navigator>
);

// Stack Navigator for site management
const SitesStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="SitesList"
      component={PlaceholderScreen}
      options={{ title: 'Site Management' }}
    />
    <Stack.Screen
      name="SiteDetail"
      component={PlaceholderScreen}
      options={{ title: 'Site Details' }}
    />
  </Stack.Navigator>
);

// Stack Navigator for inspections
const InspectionStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="InspectionsList"
      component={PlaceholderScreen}
      options={{ title: 'Inspections' }}
    />
    <Stack.Screen
      name="CreateInspection"
      component={PlaceholderScreen}
      options={{ title: 'New Inspection' }}
    />
  </Stack.Navigator>
);

// Stack Navigator for dashboard
const DashboardStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="SupervisorDashboard"
      component={SupervisorDashboardScreen}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

const SupervisorNavigator = () => {
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
              iconName = focused ? 'people' : 'people-outline';
              break;
            case 'Reports':
              iconName = focused ? 'document-text' : 'document-text-outline';
              break;
            case 'Sites':
              iconName = focused ? 'location' : 'location-outline';
              break;
            case 'Inspections':
              iconName = focused ? 'checkmark-circle' : 'checkmark-circle-outline';
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
        component={DashboardStack}
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Home',
          headerShown: false,
        }}
      />

      <Tab.Screen
        name="Tracking"
        component={TrackingStack}
        options={{
          title: 'Team Management',
          tabBarLabel: 'Team',
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
          tabBarBadge: null, // Will be updated with pending reports count
        }}
      />

      <Tab.Screen
        name="Sites"
        component={SitesStack}
        options={{
          title: 'Sites',
          tabBarLabel: 'Sites',
          headerShown: false,
        }}
      />

      <Tab.Screen
        name="Inspections"
        component={InspectionStack}
        options={{
          title: 'Inspections',
          tabBarLabel: 'Inspections',
          headerShown: false,
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

export default SupervisorNavigator;
