import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

/**
 * This class is used to open a browser in a SafariView Controller (iOS) or
 * a Chrome Custom Tab (Android) depending on the platform.
 *
 * It is used to open the external URLs in the DEUNA widget.
 */
class CrossPlatformBrowser {
  private initialized = false;
  /**
   * Initialize the browser
   */
  async initialize() {
    if (this.initialized) return;
    await WebBrowser.maybeCompleteAuthSession();
    this.initialized = true;
  }

  /**
   * Open an URL in a SafariView Controller (iOS) or a Chrome Custom Tab (Android) depending on the platform
   * @param url - The URL to open
   */
  async openBrowser(url: string) {
    try {
      await this.initialize();
      await WebBrowser.openBrowserAsync(url);
    } catch (error) {
      console.error('Error opening browser', error);
    }
  }

  /**
   * Close the browser
   */
  async closeBrowser() {
    if (Platform.OS !== 'ios') {
      return;
    }
    try {
      await WebBrowser.dismissBrowser();
    } catch (error) {
      console.error('Error closing browser', error);
    }
  }
}

export const crossPlatformBrowser = new CrossPlatformBrowser();
