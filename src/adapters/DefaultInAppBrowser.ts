import { Linking } from 'react-native';
import { InAppBrowserAdapter } from './InAppBrowserAdapter';

export class DefaultInAppBrowserAdapter implements InAppBrowserAdapter {
  /**
   * Open a given URL with any installed app via React Native Linking.
   * This will open the URL in the default browser of the device like Safari on iOS or Chrome on Android.
   * @param url
   */
  async openUrl(url: string): Promise<void> {
    await Linking.openURL(url);
  }
}
