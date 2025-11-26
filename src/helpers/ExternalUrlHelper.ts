import { AppState, Platform } from 'react-native';
import { WebViewDelegate } from '../controllers/BaseWebViewController';
import { ExternalUrlController } from '../controllers/ExternalUrlController';
import { Completer } from './Completer';
import { crossPlatformBrowser } from './CrossPlatformBrowser';

export enum ExternalUrlBrowser {
  WEB_VIEW = 'web_view',
  CROSS_PLATFORM_BROWSER = 'cross_platform_browser',
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

export interface CrossPlatformBrowserManager
  extends ExternalUrlManager<ExternalUrlBrowser.CROSS_PLATFORM_BROWSER> {
  type: ExternalUrlBrowser.CROSS_PLATFORM_BROWSER;
}

export class ExternalUrlHelper {
  private manager: ExternalUrlManager<ExternalUrlBrowser> | null = null;
  private completer: Completer<void> | null = null;

  constructor() {
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
        this.manager?.type === ExternalUrlBrowser.CROSS_PLATFORM_BROWSER
      ) {
        this.manager = null;
        this.completeClose();
      }
    });
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
      [ExternalUrlBrowser.CROSS_PLATFORM_BROWSER]: async () => {
        this.completer = new Completer<void>();
        this.manager = {
          type: ExternalUrlBrowser.CROSS_PLATFORM_BROWSER,
        };

        await crossPlatformBrowser.openBrowser(url);
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
