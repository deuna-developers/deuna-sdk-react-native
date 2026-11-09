import { AppState, Platform } from 'react-native';
import { WebViewDelegate } from '../controllers/BaseWebViewController';
import { ExternalUrlController } from '../controllers/ExternalUrlController';
import { Completer } from './Completer';
import { InAppBrowserAdapter } from '../adapters/InAppBrowserAdapter';

export enum ExternalUrlBrowser {
  WEB_VIEW = 'web_view',
  IN_APP_BROWSER = 'in_app_browser',
}

interface OpenUrlParams {
  url: string;
  browser: ExternalUrlBrowser;
  delegate: WebViewDelegate;
}

interface ExternalUrlManager<T extends ExternalUrlBrowser> {
  type: T;
}

export interface WebViewManager
  extends ExternalUrlManager<ExternalUrlBrowser.WEB_VIEW> {
  controller: ExternalUrlController;
}

export interface InAppBrowserManager
  extends ExternalUrlManager<ExternalUrlBrowser.IN_APP_BROWSER> {
  type: ExternalUrlBrowser.IN_APP_BROWSER;
}

export class ExternalUrlHelper {
  private static readonly REOPEN_GUARD_MS = 5000;

  // Process-wide mutex: only one external URL (modal or browser) may be active at any time.
  // Prevents duplicate opens, stacking modals, race conditions, and tapjacking regardless of elapsed time.
  private static isExternalUrlOpen = false;
  private static activeUrl: string | null = null;
  private static lastUrlSignature: string | null = null;
  private static lastClosedAt = 0;

  static get currentActiveUrl(): string | null {
    return ExternalUrlHelper.activeUrl;
  }

  static get isAnyExternalUrlActive(): boolean {
    return ExternalUrlHelper.isExternalUrlOpen;
  }

  private manager: ExternalUrlManager<ExternalUrlBrowser> | null = null;
  private completer: Completer<void> | null = null;
  private isBrowserActive = false;

  constructor(readonly inAppBrowserAdapter: InAppBrowserAdapter) {
    this.startCloseChecker();
  }

  get externalUrlWebViewController() {
    if (this.manager?.type === ExternalUrlBrowser.WEB_VIEW) {
      return (this.manager as WebViewManager).controller;
    }
    return null;
  }

  /**
   * Wait until the webview or cross platform browser is closed
   */
  async waitForClose() {
    if (this.completer) {
      await this.completer.wait;
      this.completer = null;
    }
  }

  /**
   * Listen when the app is brought back to the foreground
   */
  private startCloseChecker() {
    AppState.addEventListener('change', (state) => {
      if (
        state === 'active' &&
        this.manager?.type === ExternalUrlBrowser.IN_APP_BROWSER &&
        !this.isBrowserActive
      ) {
        this.manager = null;
        ExternalUrlHelper.isExternalUrlOpen = false;
        ExternalUrlHelper.activeUrl = null;
        ExternalUrlHelper.lastClosedAt = Date.now();
        this.completeClose();
      }
    });
  }

  private getUrlSignature(url: string): string {
    try {
      const parsed = new URL(url);
      return `${parsed.host}${parsed.pathname}`;
    } catch {
      return url;
    }
  }

  canOpenUrl(
    url: string,
    _browser: ExternalUrlBrowser,
    options?: { bypassReopenGuard?: boolean }
  ): boolean {
    // If an external URL is already open in the app, strictly block opening another
    // until the current view is dismissed.
    if (ExternalUrlHelper.isExternalUrlOpen) {
      return false;
    }

    if (this.manager !== null) {
      return false;
    }

    const signature = this.getUrlSignature(url);
    const wasSameUrlClosedRecently =
      ExternalUrlHelper.lastUrlSignature === signature &&
      Date.now() - ExternalUrlHelper.lastClosedAt < ExternalUrlHelper.REOPEN_GUARD_MS;

    if (wasSameUrlClosedRecently && !options?.bypassReopenGuard) {
      return false;
    }

    return true;
  }

  canOpenInAppBrowserUrl(
    url: string,
    options?: { bypassReopenGuard?: boolean }
  ): boolean {
    return this.canOpenUrl(url, ExternalUrlBrowser.IN_APP_BROWSER, options);
  }

  resetInAppBrowserReopenGuard(): void {
    this.resetReopenGuard();
  }

  resetReopenGuard(): void {
    if (this.manager) {
      if (this.manager.type === ExternalUrlBrowser.WEB_VIEW) {
        (this.manager as WebViewManager).controller?.dispose();
      }
      this.manager = null;
      this.completeClose();
    }
    this.completer = null;
    ExternalUrlHelper.isExternalUrlOpen = false;
    ExternalUrlHelper.activeUrl = null;
    ExternalUrlHelper.lastUrlSignature = null;
    ExternalUrlHelper.lastClosedAt = 0;
  }

  /**
   * Opens the webview or cross platform browser
   */
  async openUrl(params: OpenUrlParams) {
    const { url, browser, delegate } = params;
    ExternalUrlHelper.isExternalUrlOpen = true;
    ExternalUrlHelper.activeUrl = url;
    ExternalUrlHelper.lastUrlSignature = this.getUrlSignature(url);

    const mapper = {
      [ExternalUrlBrowser.WEB_VIEW]: async () => {
        const controller = new ExternalUrlController(url);
        controller.delegate = delegate;
        this.manager = {
          type: ExternalUrlBrowser.WEB_VIEW,
          controller,
        } as WebViewManager;
      },
      [ExternalUrlBrowser.IN_APP_BROWSER]: async () => {
        this.completer = new Completer<void>();
        this.manager = {
          type: ExternalUrlBrowser.IN_APP_BROWSER,
        };

        this.isBrowserActive = true;
        await this.inAppBrowserAdapter.openUrl(url);
        this.isBrowserActive = false;
        if (Platform.OS === 'ios') {
          ExternalUrlHelper.isExternalUrlOpen = false;
          ExternalUrlHelper.activeUrl = null;
          ExternalUrlHelper.lastClosedAt = Date.now();
          this.manager = null;
          this.completeClose();
        }
      },
    };
    await mapper[browser]();
  }

  /**
   * Notify that the browser has been closed
   */
  private completeClose() {
    this.completer?.complete();
  }

  /**
   * Closes the web view
   */
  async closeWebView() {
    if (this.manager?.type === ExternalUrlBrowser.WEB_VIEW) {
      (this.manager as WebViewManager).controller?.dispose();
      this.manager = null;
    }
    ExternalUrlHelper.isExternalUrlOpen = false;
    ExternalUrlHelper.activeUrl = null;
    ExternalUrlHelper.lastClosedAt = Date.now();
  }
}
