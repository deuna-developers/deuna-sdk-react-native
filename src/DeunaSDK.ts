import {
  BaseDeuna,
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
  BaseWebViewController,
  DeunaWebViewController,
  WebViewDelegate,
} from './controllers/BaseWebViewController';
import { PaymentWidgetController } from './controllers/PaymentWidgetController';
import { OpenInNewTabController } from './controllers/OpenInNewTabController';
import { getWidgetController } from './helpers/getController';
import { Completer } from './helpers/Completer';
import { ElementsWidgetController } from './controllers/ElementsWidgetController';
import { DownloadType, Mode, OnDownloadFile } from './interfaces/types';
import { Platform } from 'react-native';
import { DeviceFingerprintController } from './controllers/DeviceFingerprintController';
import { DEVICE_FINGERPRINT_URL } from './interfaces/constants';

export class DeunaSDK extends BaseDeuna {
  constructor(private readonly config: InitializeParams) {
    super();
  }

  mode: Mode | null = null;

  setCustomStyleFn?: SetCustomStyle | undefined;
  refetchOrderFn?: RefetchOrder | undefined;
  getStateFn?: GetStateFn | undefined;
  onSubmitFn?: Submit | undefined;
  isValidFn?: IsValid | undefined;
  closeFn?: (() => void) | undefined;

  private listeners: Set<() => void> = new Set();
  webViewController: DeunaWebViewController | null = null;
  newTabWebViewController: BaseWebViewController | null = null;
  deviceFingerprintController: DeviceFingerprintController | null = null;

  modalDismissPromise: Completer<void> | null = null;
  newTabModalDismissPromise: Completer<void> | null = null;

  private get safeWebViewController(): DeunaWebViewController {
    if (!this.webViewController) {
      const errorMessage =
        'A variant of the init method must be called first. Please call initPaymentWidget, initVoucherWidget, or another init method before using this functionality.';
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
    return this.webViewController;
  }

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
    this.mode = mode ?? Mode.MODAL;
    if (this.mode === Mode.MODAL && Platform.OS === 'ios') {
      this.modalDismissPromise = new Completer<void>();
    }
    this.webViewController = controller;
    this.webViewController.delegate = this.buildDelegate();
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
      controller: getWidgetController(this.config, {
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
      controller: getWidgetController(this.config, {
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
      controller: getWidgetController(this.config, {
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
      controller: getWidgetController(this.config, {
        widget: 'voucher',
        ...props,
      }),
      mode: props.mode,
    });
  }

  isValid = async (): Promise<boolean> => {
    return this.safeWebViewController.isValid();
  };

  submit = async (): Promise<SubmitResult> => {
    return this.safeWebViewController.submit();
  };

  setCustomStyle = async (style: Partial<CustomStyles>): Promise<void> => {
    return this.safeWebViewController.setCustomStyle(style);
  };

  refetchOrder = async (): Promise<Json | null> => {
    return this.safeWebViewController.refetchOrder();
  };

  getWidgetState = async (): Promise<State> => {
    return this.safeWebViewController.getWidgetState();
  };

  /**
   * Closes the DEUNA widget and releases the resources
   */
  close = async (): Promise<void> => {
    if (this.webViewController instanceof PaymentWidgetController) {
      this.webViewController.callbacks.onClosed?.(
        this.webViewController.closedAction
      );
    } else if (this.webViewController instanceof ElementsWidgetController) {
      this.webViewController.callbacks.onClosed?.(
        this.webViewController.closedAction
      );
    }
    this.onCloseNewTab();
    await this.newTabModalDismissPromise?.wait;
    this.newTabWebViewController?.dispose();

    this.webViewController?.dispose();
    // reset all prop
    this.newTabWebViewController = null;
    this.webViewController = null;
    this.mode = null;
    this.notifyListeners();

    // if the widget was shown in modal mode, wait for the modal to be dismissed
    await this.modalDismissPromise?.wait;
    this.modalDismissPromise = null;
  };

  onModalDismissed = () => {
    this.modalDismissPromise?.complete();
  };

  onNewTabDismissed = () => {
    this.newTabModalDismissPromise?.complete();
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
    if (this.safeWebViewController instanceof PaymentWidgetController) {
      this.safeWebViewController.callbacks.onDownloadFile?.({
        type: DownloadType.URL,
        data: url,
      });
    }
  };

  onCloseNewTab = () => {
    if (this.webViewController) {
      this.webViewController.redirectUrl = null;
    }
    this.newTabWebViewController?.dispose();
    this.newTabWebViewController = null;
    this.notifyListeners();
  };

  /**
   * Builds the delegate for the DEUNA widget to listen to the events
   * like when the user presses the close button or when the user
   * opens a new tab.
   * @returns The delegate for the DEUNA widget
   */
  buildDelegate = (): WebViewDelegate => {
    return {
      onOpenInNewTab: (url) => {
        this.newTabWebViewController = new OpenInNewTabController(url);
        if (Platform.OS === 'ios') {
          this.newTabModalDismissPromise = new Completer<void>();
        }
        this.newTabWebViewController.delegate = {
          onFileDownload: this.notifyDownloadFile,
          onNewTabWindowClose: this.onCloseNewTab,
        };
        this.notifyListeners();
      },
      onCloseButtonPressed: this.close, // Close the payment widget when the user presses the close button
      onCloseSubWebView: this.onCloseNewTab, // Close the new tab web view when the DEUNA widget emits an error event or when the purchase is successful
      onFileDownload: this.notifyDownloadFile, // Notify the user when a request to download a file is made
    };
  };
}
