import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Wrapper component to ensure React is in scope for SafeAreaProvider
const SafeAreaWrapper = ({ children }) => {
  // Explicitly use React.createElement to ensure React is in scope
  return React.createElement(
    SafeAreaProvider,
    null,
    children
  );
};

export default SafeAreaWrapper;
