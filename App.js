import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens
import SimpleLoginScreen from './src/screens/SimpleLoginScreen';
import DemoScreen from './src/screens/DemoScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="Login" component={SimpleLoginScreen} />
          <Stack.Screen name="AdminDashboard">
            {(props) => <DemoScreen {...props} route={{ params: { userRole: 'admin' } }} />}
          </Stack.Screen>
          <Stack.Screen name="SupervisorDashboard">
            {(props) => <DemoScreen {...props} route={{ params: { userRole: 'supervisor' } }} />}
          </Stack.Screen>
          <Stack.Screen name="AgentDashboard">
            {(props) => <DemoScreen {...props} route={{ params: { userRole: 'agent' } }} />}
          </Stack.Screen>
          <Stack.Screen name="ClientDashboard">
            {(props) => <DemoScreen {...props} route={{ params: { userRole: 'client' } }} />}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}


