import { WebViewMessageEvent } from 'react-native-webview';
import {
  BaseWebViewController,
  WebViewEventType,
} from './BaseWebViewController';
import { Completer } from '../helpers/Completer';
import { Environment } from '../types';
import { DeunaLogs } from '../DeunaLogs';

export class DeviceFingerprintController extends BaseWebViewController {
  constructor(
    private readonly publicApiKey: string,
    private readonly environment: Environment
  ) {
    super();
  }

  private completer = new Completer<boolean>();

  onMessage = (event: WebViewMessageEvent) => {
    const eventData = JSON.parse(event.nativeEvent.data);

    const mapper = {
      [WebViewEventType.consoleLog]: () => {
        DeunaLogs.info(
          `CONSOLE LOG`,
          JSON.stringify(eventData.message, null, 2)
        );
      },
      [WebViewEventType.jsExecutor]: () => {
        const { data, requestId } = eventData as {
          requestId: number;
          data: Record<string, any> | null;
        };
        this.jsExecutor.requests.get(requestId)?.(data);
        this.jsExecutor.requests.delete(requestId);
      },
    };
    mapper[eventData.type as keyof typeof mapper]?.();
  };

  onLoad = () => {
    this.webView?.injectJavaScript(`
        console.log = function(message) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: '${WebViewEventType.consoleLog}', message:message }));
        };
    `);
    this.completer.complete(true);
  };

  onError = (_: any) => {
    this.completer.complete(false);
  };

  urlMustBeLoadedInTheSameWebView = (_: string) => true;

  generateDeviceFingerprint = async (
    params: Record<string, any>
  ): Promise<string | null> => {
    const isLoaded = await this.completer.wait;
    if (!isLoaded) {
      return null;
    }

    const data = await this.jsExecutor.execute(`
        if (typeof window.generateFraudId !== 'function') {
          console.log('❌ window.generateFraudId is not a function');
          sendResult({fraudId: null});
          return;
        }

        window.generateFraudId({
          publicApiKey: "${this.publicApiKey}",
          env: "${this.environment}", 
          params: ${JSON.stringify(params)}
        })
        .then((fraudId) => {
          sendResult({ fraudId: fraudId });
        })
        .catch((error) => {
          sendResult({ fraudId: null });
        });
      `);
    return data?.fraudId ?? null;
  };
}
