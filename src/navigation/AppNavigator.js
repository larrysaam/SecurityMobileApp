import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';

// Import navigators
import AuthNavigator from './AuthNavigator';
import AdminNavigator from './AdminNavigator';
import SupervisorNavigator from './SupervisorNavigator';
import AgentNavigator from './AgentNavigator';
import ClientNavigator from './ClientNavigator';

// Import context
import { useAuth } from '../store/AuthContext';
import { USER_ROLES, COLORS } from '../constants';

// Loading Screen Component
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={COLORS.PRIMARY} />
    <Text style={styles.loadingText}>Loading BahinLink...</Text>
  </View>
);

const AppNavigator = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return (
      <NavigationContainer>
        <AuthNavigator />
      </NavigationContainer>
    );
  }

  // Navigation basée sur le rôle utilisateur
  const getRoleBasedNavigator = () => {
    switch (user?.role) {
      case USER_ROLES.ADMIN:
        return <AdminNavigator />;
      case USER_ROLES.SUPERVISOR:
        return <SupervisorNavigator />;
      case USER_ROLES.AGENT:
        return <AgentNavigator />;
      case USER_ROLES.CLIENT:
        return <ClientNavigator />;
      default:
        return <AuthNavigator />;
    }
  };

  return (
    <NavigationContainer>
      {getRoleBasedNavigator()}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.GRAY[600],
  },
});

export default AppNavigator;
