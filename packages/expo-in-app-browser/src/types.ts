export interface InAppBrowserAdapter {
  openUrl(url: string): Promise<void>;
}
