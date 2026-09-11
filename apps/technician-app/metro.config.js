const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Ensure Metro can resolve TypeScript source files directly
config.resolver.sourceExts = ['js', 'jsx', 'ts', 'tsx', 'json'];

// IMPORTANT: Do NOT set disableHierarchicalLookup to true in a monorepo.
// It prevents Metro from finding transitive dependencies like expo-asset.
// config.resolver.disableHierarchicalLookup = true; // REMOVED

module.exports = config;