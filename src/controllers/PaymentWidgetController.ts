import {
  CheckoutEvent,
  CheckoutEventType,
  PaymentErrorType,
} from '../interfaces';
import { constants } from '../interfaces/constants';
import { DownloadType, OnDownloadFile } from '../interfaces/types';
import {
  PaymentWidgetCallbacks,
  NextActionWidgetCallbacks,
  VoucherWidgetCallbacks,
} from '../types';
import { DeunaWebViewController } from './BaseWebViewController';

type Callbacks = PaymentWidgetCallbacks &
  NextActionWidgetCallbacks &
  VoucherWidgetCallbacks &
  OnDownloadFile;

export class PaymentWidgetController extends DeunaWebViewController {
  constructor(readonly callbacks: Callbacks) {
    super();
  }

  onError = (event: any) => {
    this.callbacks.onError?.({
      type: PaymentErrorType.errorWhileLoadingTheURL,
      metadata: {
        code: PaymentErrorType.errorWhileLoadingTheURL,
        message: event.message ?? 'Error while loading the URL',
      },
    });
  };

  onEventDispatch = async (event: Record<string, any>) => {
    const checkoutEvent = event as CheckoutEvent;

    // This event is used to listen when a voucher save request is made
    if (checkoutEvent.type === constants.apmSaveId) {
      const { voucherPdfDownloadUrl }: { voucherPdfDownloadUrl?: string } =
        checkoutEvent.data.metadata;

      // If the file url is provided, download the file and save it to the device
      if (voucherPdfDownloadUrl) {
        this.callbacks.onDownloadFile?.({
          type: DownloadType.URL,
          data: voucherPdfDownloadUrl,
        });
      } else {
        // Take a screenshot of current content in the webview
        const base64Image = await this.takeScreenshot();
        if (base64Image) {
          this.callbacks.onDownloadFile?.({
            type: DownloadType.BASE64,
            data: base64Image,
          });
        }
      }
      return;
    }

    if (this.callbacks.onEventDispatch) {
      this.callbacks.onEventDispatch(checkoutEvent.type, checkoutEvent.data);
    }

    const mapper: Partial<Record<CheckoutEventType, () => void>> = {
      [CheckoutEventType.linkClose]: () => {
        this.closedAction = 'userAction';
        this.delegate?.onCloseButtonPressed?.();
      },
      [CheckoutEventType.onBinDetected]: () => {
        this.callbacks.onCardBinDetected?.(checkoutEvent.data.metadata);
      },
      [CheckoutEventType.onInstallmentSelected]: () => {
        this.callbacks.onInstallmentSelected?.(checkoutEvent.data.metadata);
      },
      [CheckoutEventType.paymentProcessing]: () => {
        this.callbacks.onPaymentProcessing?.();
      },
      [CheckoutEventType.purchase]: () => {
        this.delegate?.onCloseSubWebView?.();
        this.callbacks.onSuccess?.(checkoutEvent.data.order);
      },
      [CheckoutEventType.purchaseError]: () => {
        this.delegate?.onCloseSubWebView?.();
        const { metadata } = checkoutEvent.data;

        if (metadata) {
          const errorCode =
            metadata.code ??
            metadata.errorCode ??
            PaymentErrorType.unknownError;

          const errorMessage =
            metadata.message ??
            metadata.errorMessage ??
            metadata.reason ??
            'unknown error';

          this.callbacks.onError?.({
            type: PaymentErrorType.paymentError,
            metadata: { code: errorCode, message: errorMessage },
          });
        } else {
          this.callbacks.onError?.({
            type: PaymentErrorType.unknownError,
            metadata: {
              code: PaymentErrorType.unknownError,
              message: 'unknown error',
            },
          });
        }
      },
    };

    mapper[checkoutEvent.type]?.();
  };
}
