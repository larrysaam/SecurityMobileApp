import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { SCREENS, COLORS } from '../constants';

// Import Admin Screens
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import UserManagementScreen from '../screens/admin/UserManagementScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import PlaceholderScreen from '../screens/PlaceholderScreen';

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

// Stack Navigator pour la gestion des utilisateurs
const UserManagementStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="UsersList" 
      component={UserManagementScreen}
      options={{ title: 'User Management' }}
    />
    <Stack.Screen
      name="CreateUser"
      component={PlaceholderScreen}
      options={{ title: 'New User' }}
    />
    <Stack.Screen
      name="EditUser"
      component={PlaceholderScreen}
      options={{ title: 'Edit User' }}
    />
  </Stack.Navigator>
);

// Stack Navigator pour la gestion des plannings
const ScheduleManagementStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="SchedulesList"
      component={PlaceholderScreen}
      options={{ title: 'Schedule Management' }}
    />
    <Stack.Screen
      name="CreateSchedule"
      component={PlaceholderScreen}
      options={{ title: 'New Schedule' }}
    />
  </Stack.Navigator>
);

// Stack Navigator for site management
const SiteManagementStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="SitesList"
      component={PlaceholderScreen}
      options={{ title: 'Site Management' }}
    />
    <Stack.Screen
      name="CreateSite"
      component={PlaceholderScreen}
      options={{ title: 'New Site' }}
    />
  </Stack.Navigator>
);

const AdminNavigator = () => {
  return (
    <Drawer.Navigator
      screenOptions={{
        drawerStyle: {
          backgroundColor: COLORS.WHITE,
          width: 280,
        },
        drawerActiveTintColor: COLORS.PRIMARY,
        drawerInactiveTintColor: COLORS.GRAY[600],
        drawerLabelStyle: {
          fontSize: 16,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: COLORS.PRIMARY,
        },
        headerTintColor: COLORS.WHITE,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Drawer.Screen 
        name={SCREENS.ADMIN_DASHBOARD}
        component={AdminDashboardScreen}
        options={{
          title: 'Dashboard',
          drawerLabel: 'Home',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="UserManagement"
        component={UserManagementStack}
        options={{
          title: 'Users',
          drawerLabel: 'User Management',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />

      <Drawer.Screen
        name="ScheduleManagement"
        component={ScheduleManagementStack}
        options={{
          title: 'Schedules',
          drawerLabel: 'Schedule Management',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />

      <Drawer.Screen
        name="SiteManagement"
        component={SiteManagementStack}
        options={{
          title: 'Sites',
          drawerLabel: 'Site Management',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="location-outline" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />

      <Drawer.Screen
        name="ReportsManagement"
        component={PlaceholderScreen}
        options={{
          title: 'Reports',
          drawerLabel: 'Report Management',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="Statistics"
        component={PlaceholderScreen}
        options={{
          title: 'Statistics',
          drawerLabel: 'Statistics',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          drawerLabel: 'My Profile',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="Settings"
        component={PlaceholderScreen}
        options={{
          title: 'Settings',
          drawerLabel: 'Settings',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
};

export default AdminNavigator;
