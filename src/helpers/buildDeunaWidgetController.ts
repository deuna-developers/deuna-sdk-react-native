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
import { InitFraudProvidersProps } from '../types/fraudProviders';
import { Environment } from '../types';
import { DeunaSDK } from '../DeunaSDK';

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

interface BaseParams {
  env: Environment;
  publicApiKey: string;
  orderToken: string;
  userToken: string;
  language: string;
  sessionId: string;
  mode: string;
  domain?: string;
  fraudCredentials?: Partial<InitFraudProvidersProps>;
  userAgent?: string;
}

export const buildDeunaWidgetController = (
  config: InitializeParams,
  props: ControllerProps & {
    mode?: Mode;
    sessionId?: string;
    sdkInstance?: DeunaSDK;
  }
): DeunaWebViewController => {
  const { widget, mode, callbacks, sdkInstance, ...rest } = props;

  const userAgent =
    typeof (rest as { userAgent?: unknown }).userAgent === 'string'
      ? (rest as { userAgent: string }).userAgent
      : undefined;

  const fraudCredentials =
    typeof (rest as { fraudCredentials?: unknown }).fraudCredentials ===
      'object' && (rest as { fraudCredentials?: unknown }).fraudCredentials !== null
      ? (rest as { fraudCredentials: Partial<InitFraudProvidersProps> })
        .fraudCredentials
      : undefined;

  const baseParams: BaseParams & {
    userAgent?: string;
    fraudCredentials?: Partial<InitFraudProvidersProps>;
  } = {
    env: config.environment!,
    publicApiKey: config.publicApiKey,
    orderToken: rest.orderToken ?? '',
    userToken: rest.userToken ?? '',
    language: rest.language ?? 'es',
    sessionId: rest.sessionId ?? '',
    mode: mode === Mode.MODAL ? 'modal' : 'target',
    ...(rest.domain && {
      domain:
        !rest.domain.startsWith('http') && !rest.domain.startsWith('https')
          ? `https://${rest.domain}`
          : rest.domain,
    }),
    userAgent,
    fraudCredentials,
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
    payment: () => {
      const paymentWidgetProps = props as PaymentWidgetControllerProps;
      return {
        ...baseParams,
        behavior: rest.behavior,
        paymentMethods: paymentWidgetProps.paymentMethods,
        styleFile: rest.styleFile,
      };
    },
    nextAction: () => baseParams,
    voucher: () => baseParams,
  };

  const widgetParams = widgetMappers[widget]();
  const widgetConfig = {
    orderToken: rest.orderToken,
    behavior: rest.behavior,
    userToken: rest.userToken,
    userAgent: widgetParams.userAgent,
    fraudCredentials: widgetParams.fraudCredentials,
    sdkInstance,
  };

  const controller =
    widget === 'elements'
      ? new ElementsWidgetController(callbacks ?? {}, widgetConfig)
      : new PaymentWidgetController(callbacks ?? {}, widgetConfig);

  controller.url = linkBuilders[widget](widgetParams);
  controller.hidePayButton = rest.hidePayButton ?? false;

  DeunaLogs.info('👀 loading link', controller.url);

  return controller;
};
