import { type ConfigPlugin, withAndroidManifest } from 'expo/config-plugins';

export const withAndroidGooglePay: ConfigPlugin = (config) =>
  withAndroidManifest(config, (mod) => {
    const mainApp = mod.modResults.manifest.application?.[0];
    if (!mainApp) return mod;

    const metaData = mainApp['meta-data'] ?? [];
    const KEY = 'com.google.android.gms.wallet.api.enabled';
    if (!metaData.some((m: any) => m.$?.['android:name'] === KEY)) {
      metaData.push({ $: { 'android:name': KEY, 'android:value': '1' } });
    }
    mainApp['meta-data'] = metaData;
    return mod;
  });
