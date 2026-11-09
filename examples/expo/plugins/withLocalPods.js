const { withPodfile, withProjectBuildGradle } = require('@expo/config-plugins');

const LOCAL_PODS_MARKER = 'deuna-local-pods';

const LOCAL_PODS_LINES = [
  '',
  `  # ${LOCAL_PODS_MARKER}: local DeunaSDK path override for monorepo development.`,
  `  # DeunaWalletsModule is auto-linked via expo-module.config.json + symlink.`,
  `  pod 'DeunaSDK', :path => '../../../../deuna-sdk-ios'`,
  `  pod 'DeunaSDK/Riskified', :path => '../../../../deuna-sdk-ios'`,
];

/** @type {import('@expo/config-plugins').ConfigPlugin} */
const withLocalPods = (config) => {
  config = withPodfile(config, (mod) => {
    let lines = mod.modResults.contents.split('\n');

    // Replace any existing DeunaSDK lines with local path version
    lines = lines.map((line) => {
      if (line.includes("pod 'DeunaSDK/Riskified'") && !line.includes(':path')) {
        return "  pod 'DeunaSDK/Riskified', :path => '../../../../deuna-sdk-ios'";
      }
      if (line.includes("pod 'DeunaSDK/Accertify'") && !line.includes(':path')) {
        return "  pod 'DeunaSDK/Accertify', :path => '../../../../deuna-sdk-ios'";
      }
      if (line.includes("pod 'DeunaSDK/MercadoPago'") && !line.includes(':path')) {
        return "  pod 'DeunaSDK/MercadoPago', :path => '../../../../deuna-sdk-ios'";
      }
      if (line.includes("pod 'DeunaSDK'") && !line.includes(':path')) {
        return "  pod 'DeunaSDK', :path => '../../../../deuna-sdk-ios'";
      }
      return line;
    });

    if (!lines.some((l) => l.includes("pod 'DeunaSDK'"))) {
      const useExpoIdx = lines.findIndex((l) => l.includes('use_expo_modules!'));
      if (useExpoIdx >= 0) {
        lines.splice(useExpoIdx + 1, 0,
          `  # ${LOCAL_PODS_MARKER}: local DeunaSDK path override for monorepo development.`,
          `  pod 'DeunaSDK', :path => '../../../../deuna-sdk-ios'`
        );
      }
    }

    mod.modResults.contents = lines.join('\n');
    return mod;
  });

  config = withProjectBuildGradle(config, (mod) => {
    if (!mod.modResults.contents.includes('mavenLocal()')) {
      mod.modResults.contents = mod.modResults.contents.replace(
        /allprojects\s*\{\s*repositories\s*\{/,
        'allprojects {\n    repositories {\n        mavenLocal()'
      );
    }
    return mod;
  });

  return config;
};

module.exports = withLocalPods;
