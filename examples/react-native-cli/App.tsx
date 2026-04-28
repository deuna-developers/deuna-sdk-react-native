import InAppBrowser from 'react-native-inappbrowser-reborn';
import { Linking } from 'react-native';
import App from '../shared/src/App';
import { InAppBrowserAdapter } from '@deuna/react-native-sdk';
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

  return <App runtimeLabel="RN CLI" inAppBrowserAdapter={browserAdapter} />;
};

export default ReactNativeCliApp;
