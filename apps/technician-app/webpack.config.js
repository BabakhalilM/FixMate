const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  
  // This replaces react-native-maps with web version on web
  config.resolve.alias['react-native-maps'] = '@teovilla/react-native-web-maps';
  
  return config;
};