import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { SCREENS, COLORS } from '../constants';

// Import Client Screens
import ProfileScreen from '../screens/profile/ProfileScreen';
import PlaceholderScreen from '../screens/PlaceholderScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack Navigator for site status
const SitesStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="SitesList"
      component={PlaceholderScreen}
      options={{ title: 'My Sites' }}
    />
    <Stack.Screen
      name="SiteDetail"
      component={PlaceholderScreen}
      options={{ title: 'Site Details' }}
    />
  </Stack.Navigator>
);

// Stack Navigator for service requests
const ServiceStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="ServiceList"
      component={PlaceholderScreen}
      options={{ title: 'Service Requests' }}
    />
    <Stack.Screen
      name="CreateService"
      component={PlaceholderScreen}
      options={{ title: 'New Request' }}
    />
  </Stack.Navigator>
);

// Stack Navigator for reports
const ReportsStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="ReportsList"
      component={PlaceholderScreen}
      options={{ title: 'Reports' }}
    />
    <Stack.Screen
      name="ReportDetail"
      component={PlaceholderScreen}
      options={{ title: 'Report Details' }}
    />
  </Stack.Navigator>
);

const ClientNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Sites':
              iconName = focused ? 'location' : 'location-outline';
              break;
            case 'Reports':
              iconName = focused ? 'document-text' : 'document-text-outline';
              break;
            case 'Services':
              iconName = focused ? 'construct' : 'construct-outline';
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
        component={PlaceholderScreen}
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Home',
        }}
      />

      <Tab.Screen
        name="Sites"
        component={SitesStack}
        options={{
          title: 'My Sites',
          tabBarLabel: 'Sites',
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
        name="Services"
        component={ServiceStack}
        options={{
          title: 'Services',
          tabBarLabel: 'Services',
          headerShown: false,
          tabBarBadge: null, // Will be updated with pending requests count
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

export default ClientNavigator;
