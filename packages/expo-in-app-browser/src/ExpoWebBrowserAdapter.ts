import * as WebBrowser from 'expo-web-browser';
import type { InAppBrowserAdapter } from './types';

export class ExpoWebBrowserAdapter implements InAppBrowserAdapter {
  private initialized = false;

  private async initialize() {
    if (this.initialized) return;
    await WebBrowser.maybeCompleteAuthSession();
    this.initialized = true;
  }

  async openUrl(url: string): Promise<void> {
    try {
      await this.initialize();
      await WebBrowser.openBrowserAsync(url);
    } catch (error) {
      console.error('Error opening browser:', error);
      throw error;
    }
  }
}
