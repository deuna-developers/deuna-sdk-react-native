import {
  type ConfigPlugin,
  withAppBuildGradle,
  withPodfile,
} from 'expo/config-plugins';

export type SupportedFraudProvider =
  | 'mercadopago'
  | 'cybersource'
  | 'riskified'
  | 'kount'
  | 'sift'
  | 'signifyd'
  | 'accertify';

export interface FraudPluginOptions {
  fraudProviders?: SupportedFraudProvider[];
}

const ANDROID_PROVIDER_DEPS: Record<SupportedFraudProvider, string[]> = {
  mercadopago: [
    "implementation 'com.mercadolibre.android.device:sdk:4.0.1'",
  ],
  riskified: [
    "implementation 'com.riskified:android-sdk:1.11.0:nogoogle@aar'",
  ],
  cybersource: [
    "implementation fileTree(dir: 'libs/cybersource', include: ['*.aar'])",
  ],
  signifyd: [
    "implementation fileTree(dir: 'libs/signifyd', include: ['*.aar'])",
  ],
  accertify: [
    "implementation fileTree(dir: 'libs/accertify', include: ['*.aar'])",
    "implementation 'io.insert-koin:koin-core:3.5.6'",
    "implementation 'androidx.biometric:biometric:1.1.0'",
    "implementation 'org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.3'",
  ],
  kount: ["implementation 'com.kount:kount-data-collector:4.1.0'"],
  sift: ["implementation 'sift-android:sift-android:0.14.0'"],
};

const IOS_PROVIDER_PODS: Partial<Record<SupportedFraudProvider, string[]>> = {
  mercadopago: ["pod 'DeunaSDK/MercadoPago'"],
  riskified: ["pod 'DeunaSDK/Riskified'"],
  cybersource: ["pod 'DeunaSDK/Cybersource'"],
  signifyd: ["pod 'DeunaSDK/Signifyd'"],
  kount: ["pod 'DeunaSDK/Kount'"],
  sift: ["pod 'DeunaSDK/Sift'"],
  accertify: ["pod 'DeunaSDK/Accertify'"],
};

const ANDROID_MARKER = '// deuna-fraud-providers-start';
const IOS_MARKER = '# deuna-fraud-providers-start';

export const withAndroidFraudProviders: ConfigPlugin<FraudPluginOptions> = (
  config,
  { fraudProviders = [] }
) =>
  withAppBuildGradle(config, (mod) => {
    if (mod.modResults.contents.includes(ANDROID_MARKER)) {
      return mod;
    }

    const depsToAdd: string[] = [];
    for (const provider of fraudProviders) {
      const deps = ANDROID_PROVIDER_DEPS[provider];
      if (deps) {
        depsToAdd.push(...deps);
      }
    }

    if (depsToAdd.length === 0) {
      return mod;
    }

    const block = `
${ANDROID_MARKER}
dependencies {
${depsToAdd.map((d) => `    ${d}`).join('\n')}
}
// deuna-fraud-providers-end
`;
    mod.modResults.contents = mod.modResults.contents + '\n' + block;
    return mod;
  });

export const withIosFraudProviders: ConfigPlugin<FraudPluginOptions> = (
  config,
  { fraudProviders = [] }
) =>
  withPodfile(config, (mod) => {
    if (mod.modResults.contents.includes(IOS_MARKER)) {
      return mod;
    }

    const podsToAdd: string[] = [];
    for (const provider of fraudProviders) {
      const pods = IOS_PROVIDER_PODS[provider];
      if (pods) {
        podsToAdd.push(...pods);
      }
    }

    if (podsToAdd.length === 0) {
      return mod;
    }

    const lines = mod.modResults.contents.split('\n');

    // Ensure CocoaPods git source is present
    if (!lines.some((l) => l.includes('CocoaPods/Specs.git'))) {
      lines.unshift("source 'https://github.com/CocoaPods/Specs.git'");
    }

    const podInsertionIndex = lines.findIndex((l) =>
      l.includes('use_expo_modules!')
    );

    const podBlockLines = [
      `  ${IOS_MARKER}`,
      ...podsToAdd.map((p) => `  ${p}`),
      `  # deuna-fraud-providers-end`,
    ];

    if (podInsertionIndex !== -1) {
      lines.splice(podInsertionIndex + 1, 0, ...podBlockLines);
      mod.modResults.contents = lines.join('\n');
    } else {
      const targetIndex = lines.findIndex((l) =>
        /target\s+['"][^'"]+['"]\s+do/.test(l)
      );
      if (targetIndex !== -1) {
        lines.splice(targetIndex + 1, 0, ...podBlockLines);
        mod.modResults.contents = lines.join('\n');
      } else {
        mod.modResults.contents += '\n' + podBlockLines.join('\n') + '\n';
      }
    }

    return mod;
  });

export const withFraudProviders: ConfigPlugin<FraudPluginOptions> = (
  config,
  options = {}
) => {
  if (!options.fraudProviders || options.fraudProviders.length === 0) {
    return config;
  }
  config = withAndroidFraudProviders(config, options);
  config = withIosFraudProviders(config, options);
  return config;
};
