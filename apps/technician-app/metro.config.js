// apps/technician-app/metro.config.js
const { getSentryExpoConfig } = require('@sentry/react-native/metro');
const path = require('path');

// Use getSentryExpoConfig instead of getDefaultConfig
// We also pass the includeWebReplay: false option to exclude the problematic package
const config = getSentryExpoConfig(__dirname, {
  includeWebReplay: false,
});

// Add your custom merge-options alias
config.resolver.extraNodeModules = {
  'merge-options': path.resolve(__dirname, 'node_modules/merge-options'),
};

module.exports = config;