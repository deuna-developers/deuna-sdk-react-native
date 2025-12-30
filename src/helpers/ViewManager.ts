import {
  BaseWebViewController,
  WebViewDelegate,
} from '../controllers/BaseWebViewController';
import { Mode } from '../interfaces';

export class WebViewManager<
  T extends BaseWebViewController = BaseWebViewController,
> {
  private _controller: T | null = null;
  private _mode: Mode | null = null;

  initialize = (params: {
    controller: T;
    delegate: WebViewDelegate;
    mode: Mode;
  }): void => {
    this._controller = params.controller;
    this._controller.delegate = params.delegate;
    this._mode = params.mode;
  };

  get isInitialized(): boolean {
    return !!this._controller;
  }

  get mode(): Mode | null {
    return this._mode;
  }

  get controller(): T {
    if (!this._controller) {
      throw new Error('WebView not initialized');
    }
    return this._controller;
  }

  /**
   * Destroy the webview and the modal (if it exists)
   */
  destroy = () => {
    this._controller?.dispose();
    this._controller = null;
  };
}
