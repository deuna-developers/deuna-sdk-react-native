import { type ConfigPlugin, withPodfile } from 'expo/config-plugins';

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

export const withIosFmtFix: ConfigPlugin = (config) =>
  withPodfile(config, (mod) => {
    const lines = mod.modResults.contents.split('\n');

    if (lines.some((l) => l.includes(FMT_FIX_MARKER))) return mod;

    let depth = 0;
    let postInstallCloseIdx = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? '';
      if (line.includes('post_install do')) {
        depth = 1;
        continue;
      }
      if (depth > 0) {
        if (/\bdo\b/.test(line)) depth++;
        if (/^\s*end\b/.test(line)) {
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
      mod.modResults.contents = lines.join('\n');
    }

    return mod;
  });
