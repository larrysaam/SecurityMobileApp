// Global React setup for JSX compatibility
import React from 'react';

// Make React available globally for JSX
if (typeof global !== 'undefined') {
  global.React = React;
}

// For web environments
if (typeof window !== 'undefined') {
  window.React = React;
}

export default React;
