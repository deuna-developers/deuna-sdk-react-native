import type WebView from 'react-native-webview';
import { DeunaLogs } from '../DeunaLogs';
import { WebViewMessageEvent } from 'react-native-webview';
import {
  ClosedAction,
  CustomStyles,
  Json,
  State,
  SubmitResult,
} from '../types';
import { submitError, WidgetConfig } from '../interfaces';
import { Platform } from 'react-native';
import { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';

export interface WebViewDelegate {
  onOpenExternalUrl?: (url: string) => void;
  onCloseButtonPressed?: () => void;
  onFileDownload?: (url: string) => void;
  onCloseExternalUrl?: () => void;
}

export enum WebViewEventType {
  consoleLog = 'consoleLog',
  eventDispatch = 'eventDispatch',
  jsExecutor = 'jsExecutor',
  openExternalUrl = 'openExternalUrl',
  redirect = 'redirect',
  closeExternalUrl = 'closeExternalUrl',
}

const DOWNLOAD_FILE_REGEX =
  /\.(pdf|doc|docx|xls|xlsx|zip|rar|txt|mp3|mp4|jpg|jpeg|png|gif)$/i;

export abstract class BaseWebViewController {
  initialized = false;
  webView: WebView | null = null;
  url: string | null = null;

  delegate: WebViewDelegate | null = null;
  jsExecutor = new JsExecutor();

  setWebView = (webView: WebView) => {
    this.webView = webView;
    this.jsExecutor.webView = webView;
  };

  abstract onMessage: (event: WebViewMessageEvent) => void;

  /**
   * Called when the web view url is loaded successfully
   */
  abstract onLoad: () => void;

  /**
   * Called when the web view fails to load a URL
   */
  abstract onError: (event: any) => void;

  /**
   * Called when the web view should load a URL in the same web view
   */
  abstract urlMustBeLoadedInTheSameWebView: (url: string) => boolean;

  /**
   * Checks if the URL is a download URL
   * @param url - The URL to check
   * @returns True if the URL is a download URL, false otherwise
   */
  isDownloadUrl = (url: string) => {
    return DOWNLOAD_FILE_REGEX.test(url);
  };

  /**
   * Determines if a URL should be loaded in the current WebView or opened in a new tab
   * @param request The navigation request details
   * @returns boolean indicating if the URL should be loaded in current WebView
   */
  onShouldStartLoadWithRequest = (request: ShouldStartLoadRequest) => {
    if (this.url === request.url) {
      return true;
    }

    const isAndroid = Platform.OS === 'android';

    const isNewNavigation = isAndroid
      ? request.url.startsWith('https://')
      : request.navigationType === 'click';

    const shouldOpenExternally = !this.urlMustBeLoadedInTheSameWebView(
      request.url
    );

    if (isNewNavigation && shouldOpenExternally) {
      this.delegate?.onOpenExternalUrl?.(request.url);
      return false;
    }

    return true;
  };

  /**
   * Release the web view resources
   */
  dispose() {
    this.webView?.stopLoading();
    this.webView = null;
  }
}

export abstract class DeunaWebViewController extends BaseWebViewController {
  hidePayButton = false;
  redirectUrl: string | null = null;
  closedAction: ClosedAction = 'systemAction';

  constructor(readonly widgetConfig: WidgetConfig) {
    super();
  }

  abstract onEventDispatch: (event: Record<string, any>) => void;

  onLoad = () => {
    this.setXprops();
  };

  urlMustBeLoadedInTheSameWebView = (url: string) => {
    if (this.isDownloadUrl(url)) {
      this.delegate?.onFileDownload?.(url);
    } else {
      this.redirectUrl = url;
    }
    return false;
  };

  onMessage = (event: WebViewMessageEvent) => {
    const eventData = JSON.parse(event.nativeEvent.data);

    const mapper = {
      [WebViewEventType.consoleLog]: () => {
        DeunaLogs.info(
          `CONSOLE LOG`,
          JSON.stringify(eventData.message, null, 2)
        );
      },
      [WebViewEventType.eventDispatch]: () => {
        this.onEventDispatch(eventData.event);
      },
      [WebViewEventType.jsExecutor]: () => {
        const { data, requestId } = eventData as {
          requestId: number;
          data: Record<string, any> | null;
        };
        this.jsExecutor.requests.get(requestId)?.(data);
        this.jsExecutor.requests.delete(requestId);
      },
      [WebViewEventType.openExternalUrl]: () => {
        this.delegate?.onOpenExternalUrl?.(eventData.url);
      },
      [WebViewEventType.redirect]: () => {
        if (this.redirectUrl) {
          return;
        }
        this.redirectUrl = eventData.url;
        this.delegate?.onOpenExternalUrl?.(eventData.url);
      },
      [WebViewEventType.closeExternalUrl]: () => {
        this.delegate?.onCloseExternalUrl?.();
      },
    };

    mapper[eventData.type as WebViewEventType]?.();
  };

  setXprops = () => {
    this.webView?.injectJavaScript(
      `
    window.open = function(url, target, features) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: '${WebViewEventType.openExternalUrl}', url }));
    };
    console.log = function(message) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: '${WebViewEventType.consoleLog}', message }));
    };
    window.xprops = {
      hidePayButton: ${this.hidePayButton},
      onEventDispatch: function (event) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: '${WebViewEventType.eventDispatch}', event }));
      },  
      onCustomStyleSubscribe: function (fn)  {
        window.setCustomStyle = fn;
      },
      onRefetchOrderSubscribe: function (fn) {
        window.deunaRefetchOrder = fn;
      },
      onGetStateSubscribe: function (state){
        window.deunaWidgetState = state;
      },
      isValid: function(fn){
        window.isValid = fn;
      },
      onSubmit: function (fn) {
        window.submit = fn;
      },
    }
     `
    );
  };

  /**
   * Gets the current widget state
   * @returns The widget state
   */
  getWidgetState = async (): Promise<State> => {
    const result = await this.jsExecutor.execute(`
      if(!window.deunaWidgetState){
        sendResult({ deunaWidgetState: null });
        return;
      }
      sendResult({ deunaWidgetState: window.deunaWidgetState });
    `);
    return result?.deunaWidgetState;
  };

  /**
   * Refetches the order
   * @returns The order data | returns null if the order is not found or an error occurs
   */
  refetchOrder = async (): Promise<Json | null> => {
    const result = await this.jsExecutor
      .execute(`      if(typeof window.deunaRefetchOrder !== 'function'){
        sendResult({order: null});
        return;
      }
      window.deunaRefetchOrder()
        .then((order) => {
          sendResult({order});
        })
        .catch(() => {
          sendResult({data: null});
        });
    `);
    return result?.order ?? null;
  };

  /**
   * Sets the custom style for the widget
   * @param style - The custom style to set
   */
  setCustomStyle = async (style: Partial<CustomStyles>): Promise<void> => {
    await this.jsExecutor.execute(`
      window.setCustomStyle(${JSON.stringify(style)});
    `);
  };

  /**
   * Checks if the widget form data is valid
   */
  isValid = async (): Promise<boolean> => {
    const data = await this.jsExecutor.execute(`
      if(typeof window.isValid !== 'function'){
        console.log('❌ window.isValid is not a function');
        sendResult({isValid:false});
        return;
      }
      sendResult( {isValid: window.isValid() });
    `);
    return data?.isValid ?? false;
  };

  /**
   * Submits the form data to the server
   * @returns The result of the submission
   */
  submit = async (): Promise<SubmitResult> => {
    const data = await this.jsExecutor.execute(`
      if(typeof window.submit !== 'function'){
        console.log('❌ window.submit is not a function');
        sendResult({status:"${submitError.status}", code:"${submitError.code}", message:"${submitError.message}" });
        return;
      }
      window.submit()
        .then((data) => {
          sendResult(data);
        })
        .catch((error) => {
          sendResult({status:"${submitError.status}", code:"${submitError.code}", message: error.message ?? "${submitError.message}" });
        });
    `);
    return data as SubmitResult;
  };

  takeScreenshot = async (): Promise<string> => {
    const data = await this.jsExecutor.execute(`
       function takeScreenshot() {
         html2canvas(document.body, { allowTaint: true, useCORS: true })
           .then((canvas) => {
             // Convert the canvas to a base64 image
             var imgData = canvas.toDataURL("image/png");
             sendResult({imgData: imgData});
           })
           .catch((error) => {
             sendResult({imgData: null});
           });
       }

       // If html2canvas is not added
       if (typeof html2canvas === "undefined") {
         var script = document.createElement("script");
         script.src = "https://html2canvas.hertzen.com/dist/html2canvas.min.js";
         script.onload = function() {
           takeScreenshot();
         };
         document.head.appendChild(script);
       } else {
         takeScreenshot();
       }
    `);
    return data?.imgData ?? null;
  };
}

class JsExecutor {
  requestId = 0;
  webView: WebView | null = null;
  requests: Map<number, (data: Record<string, any> | null) => void> = new Map();

  /**
   * Executes javascript code in the web view
   * @param jsCode - The javascript code to execute
   * @returns The result of the javascript code
   */

  execute = (jsCode: string): Promise<Record<string, any> | null> => {
    this.requestId++;
    this.webView?.injectJavaScript(
      `
       (function() {
          function sendResult(data){
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: '${WebViewEventType.jsExecutor}', data: data, requestId: ${this.requestId} }));
          }
          ${jsCode}
       })();
      `
    );
    return new Promise((resolve) => {
      this.requests.set(this.requestId, resolve);
    });
  };
}
