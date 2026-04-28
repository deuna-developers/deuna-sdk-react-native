import { useEffect } from 'react';
import { registerRootComponent } from 'expo';
import { AppState, Linking, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { InAppBrowserAdapter } from '@deuna/react-native-sdk';

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

  return <App runtimeLabel="Expo" inAppBrowserAdapter={browserAdapter} />;
};

registerRootComponent(ExpoApp);
