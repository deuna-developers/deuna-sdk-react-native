const { withPodfile } = require('@expo/config-plugins');

const DEUNA_SDK_VERSION = '~> 2.11.2';
const COCOAPODS_GIT_SOURCE = 'https://github.com/CocoaPods/Specs.git';

const SOURCE_MARKER = 'deuna-cocoapods-source';
const SDK_MARKER = 'deuna-sdk-pod';
const FMT_FIX_MARKER = 'deuna-fmt-fix';

const FMT_FIX_LINES = [
  '    # deuna-fmt-fix: fixes consteval build error with Xcode 16 / Clang 16+',
  '    installer.pods_project.targets.each do |target|',
  "      if target.name == 'fmt'",
  '        target.build_configurations.each do |config|',
  "          config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17'",
  '        end',
  '      end',
  '    end',
];

/** @type {import('@expo/config-plugins').ConfigPlugin} */
const withPublishedPods = (config) =>
  withPodfile(config, (mod) => {
    let lines = mod.modResults.contents.split('\n');

    // 1. Inject CocoaPods git source at the top (needed until trunk CDN has DeunaSDK 2.11.x)
    if (!lines.some((l) => l.includes(SOURCE_MARKER))) {
      lines.unshift(`source '${COCOAPODS_GIT_SOURCE}' # ${SOURCE_MARKER}`);
    }

    // 2. Inject published DeunaSDK pod after 'use_expo_modules!'
    if (!lines.some((l) => l.includes(SDK_MARKER))) {
      const useExpoIdx = lines.findIndex((l) => l.includes('use_expo_modules!'));
      if (useExpoIdx >= 0) {
        lines.splice(useExpoIdx + 1, 0,
          '',
          `  pod 'DeunaSDK', '${DEUNA_SDK_VERSION}' # ${SDK_MARKER}`
        );
      }
    }

    // 3. Inject fmt fix before closing 'end' of post_install block
    if (!lines.some((l) => l.includes(FMT_FIX_MARKER))) {
      let depth = 0;
      let postInstallCloseIdx = -1;

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('post_install do')) {
          depth = 1;
          continue;
        }
        if (depth > 0) {
          if (/\bdo\b/.test(lines[i])) depth++;
          if (/^\s*end\b/.test(lines[i])) {
            depth--;
            if (depth === 0) {
              postInstallCloseIdx = i;
              break;
            }
          }
        }
      }

      if (postInstallCloseIdx >= 0) {
        lines.splice(postInstallCloseIdx, 0, ...FMT_FIX_LINES);
      }
    }

    mod.modResults.contents = lines.join('\n');
    return mod;
  });

module.exports = withPublishedPods;
