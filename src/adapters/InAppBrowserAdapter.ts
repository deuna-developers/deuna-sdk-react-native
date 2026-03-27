/**
 * Adapter to handle opening URLs in an in-app browser (Custom Tabs on Android, Safari View Controller on iOS).
 *
 * This allows you to customize the behavior of opening URLs in an in-app browser
 * using any package you want like `expo-web-browser`, `react-native-inappbrowser-reborn`, etc.
 */
export interface InAppBrowserAdapter {
  /**
   * Open a given URL using the adapter implementation.
   * Check the CHANGELOG.md related to v2.0.0 for more information.
   * @param url
   */
  openUrl(url: string): Promise<void>;
}
