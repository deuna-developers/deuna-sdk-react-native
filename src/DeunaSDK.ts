import {
  BaseDeuna,
  ClosedAction,
  CustomStyles,
  GetStateFn,
  InitElementsWidgetParams,
  InitializeParams,
  InitNextActionWidgetParams,
  InitPaymentWidgetParams,
  InitVoucherWidgetParams,
  IsValid,
  Json,
  PaymentWidgetCallbacks,
  RefetchOrder,
  SetCustomStyle,
  State,
  Submit,
  SubmitResult,
  VoucherWidgetCallbacks,
} from './types';
import {
  DeunaWebViewController,
  WebViewDelegate,
} from './controllers/BaseWebViewController';
import { PaymentWidgetController } from './controllers/PaymentWidgetController';
import { buildDeunaWidgetController } from './helpers/buildDeunaWidgetController';
import { ElementsWidgetController } from './controllers/ElementsWidgetController';
import { DownloadType, Mode, OnDownloadFile } from './interfaces/types';
import { DeviceFingerprintController } from './controllers/DeviceFingerprintController';
import {
  DEVICE_FINGERPRINT_URL,
  DOMAINS_MUST_BE_USE_CROSS_PLATFORM_BROWSER,
} from './interfaces/constants';
import { SubmitStrategy } from './helpers/SubmitStrategy';
import { getSubmitStrategy } from './helpers/getSubmitStrategy';
import { WebViewManager } from './helpers/ViewManager';
import {
  ExternalUrlBrowser,
  ExternalUrlHelper,
} from './helpers/ExternalUrlHelper';

export class DeunaSDK extends BaseDeuna {
  constructor(
    readonly config: InitializeParams,
    readonly onDestroyed?: () => void
  ) {
    super();
  }

  setCustomStyleFn?: SetCustomStyle | undefined;
  refetchOrderFn?: RefetchOrder | undefined;
  getStateFn?: GetStateFn | undefined;
  onSubmitFn?: Submit | undefined;
  isValidFn?: IsValid | undefined;
  closeFn?: (() => void) | undefined;

  private listeners: Set<() => void> = new Set();

  deunaWidgetManager = new WebViewManager<DeunaWebViewController>();
  externalUrlHelper = new ExternalUrlHelper();

  deviceFingerprintController: DeviceFingerprintController | null = null;
  submitStrategy: SubmitStrategy | null = null;

  /**
   * Generates a device fingerprint, creates a invisible webview to get the device fingerprint
   * and returns the device fingerprint
   * @returns The device fingerprint
   */
  getSessionId = async (params?: Record<string, any>): Promise<string> => {
    this.deviceFingerprintController = new DeviceFingerprintController(
      this.config.publicApiKey,
      this.config.environment ?? 'production'
    );
    this.deviceFingerprintController.url = DEVICE_FINGERPRINT_URL;
    this.notifyListeners();

    const deviceFingerprint =
      await this.deviceFingerprintController.generateDeviceFingerprint(
        params ?? {}
      );
    this.deviceFingerprintController?.dispose();
    this.deviceFingerprintController = null;
    this.notifyListeners();
    return deviceFingerprint ?? '';
  };

  static initialize(config: InitializeParams): DeunaSDK {
    return new DeunaSDK(config);
  }

  /**
   * Sets the DEUNA widget controller
   * @param params - The parameters for the widget controller
   * @param params.controller - The controller for the widget
   * @param params.mode - The mode for the widget
   */
  private setWidgetController = (params: {
    controller: DeunaWebViewController;
    mode?: Mode;
  }): void => {
    const { controller, mode } = params;
    this.deunaWidgetManager.initialize({
      controller,
      mode: mode ?? Mode.MODAL,
      delegate: this.buildDelegate(),
    });
    this.notifyListeners();
  };

  /**
   * Shows the payment widget
   * @param props - The parameters for the payment widget controller
   * @param props.mode - The mode for the widget
   */
  async initPaymentWidget(
    props: Omit<InitPaymentWidgetParams, 'callbacks'> & {
      mode?: Mode;
      callbacks: PaymentWidgetCallbacks & OnDownloadFile;
    }
  ) {
    this.setWidgetController({
      controller: buildDeunaWidgetController(this.config, {
        widget: 'payment',
        ...props,
      }),
      mode: props.mode,
    });
  }

  /**
   * Shows the elements widget
   * @param props - The parameters for the elements widget controller
   * @param props.mode - The mode for the widget
   */
  async initElements(
    props: InitElementsWidgetParams & { mode?: Mode; sessionId?: string }
  ) {
    this.setWidgetController({
      controller: buildDeunaWidgetController(this.config, {
        widget: 'elements',
        ...props,
      }),
      mode: props.mode,
    });
  }

  /**
   * Shows the next action widget
   * @param props - The parameters for the next action widget controller
   * @param props.mode - The mode for the widget
   */
  async initNextAction(props: InitNextActionWidgetParams & { mode: Mode }) {
    this.setWidgetController({
      controller: buildDeunaWidgetController(this.config, {
        widget: 'nextAction',
        ...props,
      }),
      mode: props.mode,
    });
  }

  /**
   * Shows the voucher widget
   * @param props - The parameters for the voucher widget controller
   * @param props.mode - The mode for the widget
   */
  async initVoucherWidget(
    props: Omit<InitVoucherWidgetParams, 'callbacks'> & {
      mode: Mode;
      callbacks: VoucherWidgetCallbacks & OnDownloadFile;
    }
  ) {
    this.setWidgetController({
      controller: buildDeunaWidgetController(this.config, {
        widget: 'voucher',
        ...props,
      }),
      mode: props.mode,
    });
  }

  isValid = async (): Promise<boolean> => {
    return this.deunaWidgetManager.controller.isValid();
  };

  submit = async (): Promise<SubmitResult> => {
    this.getStateFn = () => this.getWidgetState();
    const submitStrategy = await getSubmitStrategy(this);

    if (!submitStrategy) {
      return this.deunaWidgetManager.controller.submit();
    }

    this.submitStrategy = submitStrategy;
    this.notifyListeners();
    return this.submitStrategy.submit();
  };

  setCustomStyle = async (style: Partial<CustomStyles>): Promise<void> => {
    return this.deunaWidgetManager.controller.setCustomStyle(style);
  };

  refetchOrder = async (): Promise<Json | null> => {
    return this.deunaWidgetManager.controller.refetchOrder();
  };

  getWidgetState = async (): Promise<State> => {
    return this.deunaWidgetManager.controller.getWidgetState();
  };

  /**
   * Closes the DEUNA widget and releases the resources
   */
  close = async (): Promise<void> => {
    if (!this.deunaWidgetManager.isInitialized) {
      return;
    }

    try {
      let onClosedCallback: ((action: ClosedAction) => void) | undefined;
      const closedAction = this.deunaWidgetManager.controller.closedAction;

      if (
        this.deunaWidgetManager.controller instanceof PaymentWidgetController
      ) {
        onClosedCallback =
          this.deunaWidgetManager.controller.callbacks.onClosed;
      } else if (
        this.deunaWidgetManager.controller instanceof ElementsWidgetController
      ) {
        onClosedCallback =
          this.deunaWidgetManager.controller.callbacks.onClosed;
      }

      // If the external url was opened in a Safari View Controller or a Custom Chrome Tab
      // we need to wait until the browser is dismissed
      await this.externalUrlHelper.waitForClose();

      // Destroy the main webview and dismiss the modal
      this.deunaWidgetManager.destroy();

      // Close the submit strategy if it exists
      await this.submitStrategy?.deunaSDK.close();
      this.submitStrategy = null;

      // Notify listeners that the widget has been closed
      this.notifyListeners();

      // Notify the user that the widget has been closed
      this.onDestroyed?.();

      // Notify the widget that the user has closed the widget
      onClosedCallback?.(closedAction);
    } catch (error) {
      console.error('Error closing the widget', error);
    }
  };

  addListener = (listener: () => void) => {
    this.listeners.add(listener);
  };

  removeListener = (listener: () => void) => {
    this.listeners.delete(listener);
  };

  notifyListeners = () => {
    this.listeners.forEach((listener) => listener());
  };

  private notifyDownloadFile = (url: string) => {
    if (this.deunaWidgetManager.controller instanceof PaymentWidgetController) {
      this.deunaWidgetManager.controller.callbacks.onDownloadFile?.({
        type: DownloadType.URL,
        data: url,
      });
    }
  };

  /**
   * Closes the external URL Webview
   */
  onCloseExternalUrl = async () => {
    if (this.externalUrlHelper.externalUrlWebViewController) {
      await this.externalUrlHelper.closeWebView();
      this.notifyListeners();
    }
  };

  /**
   * Builds the delegate for the DEUNA widget to listen to the events
   * like when the user presses the close button or when the user
   * opens a new tab.
   * @returns The delegate for the DEUNA widget
   */
  buildDelegate = (): WebViewDelegate => {
    return {
      onOpenExternalUrl: (url) => {
        try {
          const host = new URL(url).host;
          let browser = ExternalUrlBrowser.WEB_VIEW;
          // Check if the URL is from a domain that must be opened in a cross platform browser (SafariView or Chrome Custom Tab)
          for (const domain of DOMAINS_MUST_BE_USE_CROSS_PLATFORM_BROWSER) {
            if (host.includes(domain)) {
              browser = ExternalUrlBrowser.CROSS_PLATFORM_BROWSER;
              break;
            }
          }

          this.externalUrlHelper.openUrl({
            url,
            browser,
            delegate: {
              onCloseExternalUrl: this.onCloseExternalUrl,
              onFileDownload: this.notifyDownloadFile,
            },
          });
          this.notifyListeners();
        } catch (error) {
          console.error('Error opening external URL', error);
        }
      },
      onCloseExternalUrl: this.onCloseExternalUrl,
      onCloseButtonPressed: this.close, // Close the payment widget when the user presses the close button
      onFileDownload: this.notifyDownloadFile, // Notify the user when a request to download a file is made
    };
  };
}
