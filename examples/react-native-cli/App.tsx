import InAppBrowser from 'react-native-inappbrowser-reborn';
import { Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import App from '../shared/src/App';
import { InAppBrowserAdapter } from '@deuna/react-native-sdk';
import type { StorageAdapter } from '../shared/src/explore/domain';
import type { IntegrationConfig } from '../shared/src/explore/domain';
import { defaultIntegrationConfig } from '../shared/src/explore/domain';
import { useEffect } from 'react';

class InAppBrowserRebornAdapter implements InAppBrowserAdapter {
  async openUrl(url: string): Promise<void> {
    if (!url || url.startsWith('about:')) {
      return;
    }

    const isWebUrl = /^https?:\/\//i.test(url);

    if (!isWebUrl) {
      return;
    }

    const isAvailable = await InAppBrowser.isAvailable();

    if (!isAvailable) {
      await Linking.openURL(url);
      return;
    }

    await InAppBrowser.open(url, {
      dismissButtonStyle: 'cancel',
      preferredBarTintColor: '#453AA4',
      preferredControlTintColor: '#FFFFFF',
      readerMode: false,
      animated: true,
      modalPresentationStyle: 'overFullScreen',
      modalTransitionStyle: 'coverVertical',
      modalEnabled: true,
      enableBarCollapsing: false,
      showTitle: false,
      toolbarColor: '#6200EE',
      secondaryToolbarColor: 'black',
      navigationBarColor: 'black',
      navigationBarDividerColor: 'white',
      enableUrlBarHiding: true,
      enableDefaultShare: true,
      forceCloseOnRedirection: false,
      hasBackButton: false,
      browserPackage: undefined,
      showInRecents: true,
    });
  }
}

const browserAdapter = new InAppBrowserRebornAdapter();

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

const ReactNativeCliApp = () => {
  useEffect(() => {
    Linking.addEventListener('url', (event) => {
      const { url } = event;
      // "deunarn" is the schema defined in your app's Info.plist on iOS
      if (url !== null && url.includes('deunarn://')) {
        console.log('DEUNA: Closing in-app browser', url);
        InAppBrowser.close(); // Close the in-app browser (SafariViewController on iOS), on Android this is not needed
      }
    });
  }, []);

  return <App runtimeLabel="RN CLI" inAppBrowserAdapter={browserAdapter} storageAdapter={asyncStorageAdapter} />;
};

export default ReactNativeCliApp;
