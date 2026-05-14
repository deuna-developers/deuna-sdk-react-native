import { useEffect } from 'react';
import { registerRootComponent } from 'expo';
import { AppState, Linking, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { InAppBrowserAdapter } from '@deuna/react-native-sdk';
import type { StorageAdapter } from '../shared/src/explore/domain';
import type { IntegrationConfig } from '../shared/src/explore/domain';
import { defaultIntegrationConfig } from '../shared/src/explore/domain';

import App from '../shared/src/App';

/**
 * Creates a custom implementation of the InAppBrowserAdapter interface for Expo.
 * This is needed if you want to use mercadopago as a payment method.
 */
class ExpoWebBrowserAdapter implements InAppBrowserAdapter {
  async openUrl(url: string): Promise<void> {
    console.log('DEUNA: ExpoWebBrowserAdapter openUrl', url);
    await WebBrowser.openBrowserAsync(url, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      dismissButtonStyle: 'close',
    });
  }
}

const browserAdapter = new ExpoWebBrowserAdapter();
WebBrowser.maybeCompleteAuthSession();

const CONFIG_STORAGE_KEY = 'deuna_explore_config';

const asyncStorageAdapter: StorageAdapter = {
  async load(): Promise<IntegrationConfig | null> {
    try {
      const json = await AsyncStorage.getItem(CONFIG_STORAGE_KEY);
      if (!json) return null;
      return { ...defaultIntegrationConfig, ...JSON.parse(json) } as IntegrationConfig;
    } catch {
      return null;
    }
  },
  async save(config: IntegrationConfig): Promise<void> {
    try {
      await AsyncStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
    } catch {
      // ignore
    }
  },
};

const ExpoApp = () => {
  useEffect(() => {
    const appStateSubscription = AppState.addEventListener(
      'change',
      (nextState) => {
        console.log(
          `[DEUNA DEBUG][ExpoApp][${new Date().toISOString()}] AppState`,
          nextState
        );
      }
    );

    const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
      console.log('DEUNA: Expo deep link received', url);

      if (url && url.includes('deunaexpo://') && Platform.OS === 'ios') {
        // Dismiss auth/browser session after deep link callback.
        WebBrowser.dismissBrowser();
      }
    });

    return () => {
      appStateSubscription.remove();
      linkingSubscription.remove();
    };
  }, []);

  return <App runtimeLabel="Expo" inAppBrowserAdapter={browserAdapter} storageAdapter={asyncStorageAdapter} />;
};

registerRootComponent(ExpoApp);
