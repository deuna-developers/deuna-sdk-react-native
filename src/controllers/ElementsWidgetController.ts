import { DeunaWebViewController } from './BaseWebViewController';
import {
  ElementsEvent,
  ElementsEventType,
} from '../interfaces/events/elements';
import { ElementsWidgetCallbacks } from '../types';
import { ElementsErrorType } from '../interfaces';

export class ElementsWidgetController extends DeunaWebViewController {
  constructor(readonly callbacks: ElementsWidgetCallbacks) {
    super();
  }

  onError = (event: any) => {
    this.callbacks.onError?.({
      type: ElementsErrorType.errorWhileLoadingTheURL,
      metadata: {
        code: ElementsErrorType.errorWhileLoadingTheURL,
        message: event.message ?? 'Error while loading the URL',
      },
    });
  };

  onEventDispatch = (event: Record<string, any>) => {
    const elementsEvent = event as ElementsEvent;

    if (this.callbacks.onEventDispatch) {
      this.callbacks.onEventDispatch(elementsEvent.type, elementsEvent.data);
    }

    const mapper: Partial<Record<ElementsEventType, () => void>> = {
      [ElementsEventType.vaultClosed]: () => {
        this.closedAction = 'userAction';
        this.delegate?.onCloseButtonPressed?.();
      },
      [ElementsEventType.vaultSaveSuccess]: () => {
        this.delegate?.onCloseSubWebView?.();
        this.callbacks.onSuccess?.(event.data);
      },
      [ElementsEventType.vaultSaveError]: () => {
        this.delegate?.onCloseSubWebView?.();
        this.delegate?.onCloseSubWebView?.();
        const { metadata } = elementsEvent.data;

        if (metadata) {
          const errorCode =
            metadata.code ??
            metadata.errorCode ??
            ElementsErrorType.unknownError;

          const errorMessage =
            metadata.message ??
            metadata.errorMessage ??
            metadata.reason ??
            'unknown error';

          this.callbacks.onError?.({
            type: ElementsErrorType.vaultSaveError,
            metadata: {
              code: errorCode,
              message: errorMessage,
            },
          });
        } else {
          this.callbacks.onError?.({
            type: ElementsErrorType.unknownError,
            metadata: {
              code: ElementsErrorType.unknownError,
              message: 'unknown error',
            },
          });
        }
      },
    };

    mapper[elementsEvent.type]?.();
  };
}
