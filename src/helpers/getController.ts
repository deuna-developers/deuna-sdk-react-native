import { DeunaWebViewController } from '../controllers/BaseWebViewController';
import { PaymentWidgetController } from '../controllers/PaymentWidgetController';
import { ElementsWidgetController } from '../controllers/ElementsWidgetController';
import {
  InitElementsWidgetParams,
  InitializeParams,
  InitNextActionWidgetParams,
  InitPaymentWidgetParams,
  InitVoucherWidgetParams,
} from '../types';
import { linkBuilders } from '../types/helpers';
import { Mode } from '../interfaces/types';
import { DeunaLogs } from '../DeunaLogs';

type PaymentWidgetControllerProps = InitPaymentWidgetParams & {
  widget: 'payment';
};

type NextActionWidgetControllerProps = InitNextActionWidgetParams & {
  widget: 'nextAction';
};

type VoucherWidgetControllerProps = InitVoucherWidgetParams & {
  widget: 'voucher';
};

type ElementsWidgetControllerProps = InitElementsWidgetParams & {
  widget: 'elements';
};

type ControllerProps =
  | PaymentWidgetControllerProps
  | NextActionWidgetControllerProps
  | VoucherWidgetControllerProps
  | ElementsWidgetControllerProps;

export const getWidgetController = (
  config: InitializeParams,
  props: ControllerProps & { mode?: Mode; sessionId?: string }
): DeunaWebViewController => {
  const { widget, mode, callbacks, ...rest } = props;

  const baseParams = {
    env: config.environment!,
    publicApiKey: config.publicApiKey,
    orderToken: rest.orderToken ?? '',
    userToken: rest.userToken ?? '',
    language: rest.language ?? 'es',
    sessionId: rest.sessionId ?? '',
    mode: mode ?? Mode.MODAL,
  };

  const widgetMappers = {
    elements: () => ({
      ...baseParams,
      userInfo: rest.userInfo,
      styleFile: rest.styleFile,
      behavior: rest.behavior,
      widgetExperience: rest.widgetExperience,
      types: (props as ElementsWidgetControllerProps).types,
    }),
    payment: () => ({
      ...baseParams,
      behavior: rest.behavior,
      paymentMethods: (props as PaymentWidgetControllerProps).paymentMethods,
      styleFile: rest.styleFile,
    }),
    nextAction: () => baseParams,
    voucher: () => baseParams,
  };

  const controller =
    widget === 'elements'
      ? new ElementsWidgetController(callbacks)
      : new PaymentWidgetController(callbacks);

  controller.url = linkBuilders[widget](widgetMappers[widget]());
  controller.hidePayButton = rest.hidePayButton ?? false;

  DeunaLogs.info('👀 loading link', controller.url);

  return controller;
};
