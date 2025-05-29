import { WebViewMessageEvent } from 'react-native-webview';
import {
  BaseWebViewController,
  WebViewEventType,
} from './BaseWebViewController';
import { DeunaLogs } from '../DeunaLogs';

export class OpenInNewTabController extends BaseWebViewController {
  constructor(readonly url: string) {
    super();
    this.url = url;
  }

  onLoad = () => {
    this.setXprops();
  };

  onError = (event: any) => {
    console.warn(event);
  };

  urlMustBeLoadedInTheSameWebView = (url: string) => {
    if (this.isDownloadUrl(url)) {
      this.delegate?.onFileDownload?.(url);
      return false;
    }
    return true;
  };

  onMessage = (event: WebViewMessageEvent) => {
    const eventData = JSON.parse(event.nativeEvent.data);
    if (eventData.type === 'console_log') {
      DeunaLogs.info(`CONSOLE LOG`, eventData.message);
    }
  };

  setXprops = () => {
    // Hide the print button on the Efecty page
    this.webView?.injectJavaScript(`
      console.log = function(message) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: '${WebViewEventType.consoleLog}', message }));
      };
      window.close = function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: '${WebViewEventType.newTabWindowClose}', data: '' }));
      };
      (function() {
           setTimeout(function() {
               var button = document.getElementById("cash_efecty_button_print");
               if (button) {
                   button.style.display = "none";
               }
           }, 500); // time out 500 ms
      })();
    `);
  };
}
