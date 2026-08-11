import { DeunaWebViewController } from './BaseWebViewController';
import {
  ElementsEvent,
  ElementsEventType,
} from '../interfaces/events/elements';
import { ElementsWidgetCallbacks } from '../types';
import { ElementsErrorType, WidgetConfig } from '../interfaces';
import { DeunaLogs } from '../DeunaLogs';

export class ElementsWidgetController extends DeunaWebViewController {
  constructor(
    readonly callbacks: ElementsWidgetCallbacks,
    readonly widgetConfig: WidgetConfig
  ) {
    super(widgetConfig);
  }

  onError = (event: any) => {
    const message = event.message ?? 'Error while loading the URL';
    DeunaLogs.error('Elements URL load error', message);
    this.callbacks.onError?.({
      type: ElementsErrorType.errorWhileLoadingTheURL,
      metadata: {
        code: ElementsErrorType.errorWhileLoadingTheURL,
        message,
      },
    });
  };

  onEventDispatch = (event: Record<string, any>) => {
    const elementsEvent = event as ElementsEvent;

    DeunaLogs.info('Elements event', elementsEvent.type);

    if (this.callbacks.onEventDispatch) {
      this.callbacks.onEventDispatch(elementsEvent.type, elementsEvent.data);
    }

    const mapper: Partial<Record<ElementsEventType, () => void>> = {
      [ElementsEventType.vaultClosed]: () => {
        DeunaLogs.info('Card tokenization', 'Widget closed by user');
        this.closedAction = 'userAction';
        this.delegate?.onCloseButtonPressed?.();
      },
      [ElementsEventType.vaultSaveSuccess]: () => {
        DeunaLogs.info('Card tokenization', 'Card saved successfully');
        this.delegate?.onCloseExternalUrl?.();
        this.callbacks.onSuccess?.(this.buildSuccessPayload(event.data));
      },
      [ElementsEventType.vaultSaveError]: () => {
        this.delegate?.onCloseExternalUrl?.();
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

          DeunaLogs.error(
            'Card tokenization failed',
            `code=${errorCode} message=${errorMessage} raw=${JSON.stringify(metadata)}`
          );
          this.callbacks.onError?.({
            type: ElementsErrorType.vaultSaveError,
            metadata: {
              code: errorCode,
              message: errorMessage,
            },
          });
        } else {
          DeunaLogs.error(
            'Card tokenization failed',
            `vaultSaveError fired with no metadata — raw event: ${JSON.stringify(elementsEvent.data)}`
          );
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
