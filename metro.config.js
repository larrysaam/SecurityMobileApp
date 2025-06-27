const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable Fast Refresh and Hot Reloading
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;
