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
  private static readonly IN_APP_BROWSER_REOPEN_GUARD_MS = 5000;

  private manager: ExternalUrlManager<ExternalUrlBrowser> | null = null;
  private completer: Completer<void> | null = null;
  private lastInAppBrowserSignature: string | null = null;
  private lastInAppBrowserClosedAt = 0;

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
        this.manager?.type === ExternalUrlBrowser.IN_APP_BROWSER
      ) {
        this.manager = null;
        this.lastInAppBrowserClosedAt = Date.now();
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

  canOpenInAppBrowserUrl(url: string): boolean {
    if (this.manager?.type === ExternalUrlBrowser.IN_APP_BROWSER) {
      return false;
    }

    const signature = this.getUrlSignature(url);
    const wasSameUrlOpenedRecently =
      this.lastInAppBrowserSignature === signature &&
      Date.now() - this.lastInAppBrowserClosedAt <
        ExternalUrlHelper.IN_APP_BROWSER_REOPEN_GUARD_MS;

    return !wasSameUrlOpenedRecently;
  }

  /**
   * Opens the webview or cross platform browser
   */
  async openUrl(params: OpenUrlParams) {
    const { url, browser, delegate } = params;

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
        this.lastInAppBrowserSignature = this.getUrlSignature(url);
        this.completer = new Completer<void>();
        this.manager = {
          type: ExternalUrlBrowser.IN_APP_BROWSER,
        };

        await this.inAppBrowserAdapter.openUrl(url);
        if (Platform.OS === 'ios') {
          this.completer?.complete();
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
  }
}
