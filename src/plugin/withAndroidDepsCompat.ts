import {
  type ConfigPlugin,
  withAppBuildGradle,
} from 'expo/config-plugins';

const RESOLUTION_BLOCK = `
configurations.all {
    resolutionStrategy {
        // deuna-sdk-android pulls deps built with Kotlin 2.1 + compileSdk 36,
        // incompatible with RN 0.76.x (AGP 8.6.0 / Kotlin 1.9.x).
        force 'androidx.browser:browser:1.8.0'
        force 'org.jetbrains.kotlin:kotlin-stdlib:1.9.25'
        force 'org.jetbrains.kotlin:kotlin-stdlib-jdk7:1.9.25'
        force 'org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.9.25'
        force 'androidx.annotation:annotation:1.8.2'
        force 'androidx.annotation:annotation-jvm:1.8.2'
    }
}`;

const MARKER = 'configurations.all {';

export const withAndroidDepsCompat: ConfigPlugin = (config) =>
  withAppBuildGradle(config, (mod) => {
    if (mod.modResults.contents.includes(MARKER)) return mod;
    mod.modResults.contents =
      mod.modResults.contents + '\n' + RESOLUTION_BLOCK + '\n';
    return mod;
  });
