const path = require('path');
const { getDefaultConfig } = require('@react-native/metro-config');
const { getConfig } = require('react-native-builder-bob/metro-config');
const pkg = require('../../package.json');

const root = path.resolve(__dirname, '../..');
const shared = path.resolve(__dirname, '../shared');
const rootNodeModules = path.resolve(__dirname, '../../node_modules');
const projectNodeModules = path.resolve(__dirname, 'node_modules');

const config = getConfig(getDefaultConfig(__dirname), {
  root,
  pkg,
  project: __dirname,
});

config.watchFolders = [...new Set([...(config.watchFolders || []), shared])];
config.resolver = {
  ...(config.resolver || {}),
  nodeModulesPaths: [projectNodeModules, rootNodeModules],
};

module.exports = config;
