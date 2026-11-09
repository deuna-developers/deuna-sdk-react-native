import {
  ElementsWidgetCallbacks,
  NextActionWidgetCallbacks,
  PaymentWidgetCallbacks,
  VoucherWidgetCallbacks,
} from "./callbacks";

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export type Language = "es" | "pt" | "en";

export interface UserInfo {
  firstName: string;
  lastName: string;
  email: string;
}

interface WidgetExperience {
  theme: {
    mainColor: string;
    secondaryColor: string;
    backgroundColor: string;
    font: string;
    imageUrl: string;
    banner: string;
    mainActionButtonText: string;
  };
  userExperience: {
    showSavedCardsFlow: boolean;
    defaultCardFlow: boolean;
    disableInstallments?: boolean;
  };
  flags: {
    allowSaveUserInfo: boolean;
  };
  checkoutModules: CheckoutModule[];
}

interface CheckoutModule {
  name: string;
  props: {
    hideProductImage: boolean;
    showInMainView: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fields: any[]; // Replace `any` with a more specific type if available
  };
}
export type BehaviorFlow = "tokenize" | "purchase";

export interface BankTransferBehavior {
  splitPayments?: boolean;
}

/**
 * Deep-link callback URLs for a specific APM/processor, used when the order
 * was tokenized without callback_urls (e.g. merchants tokenizing through a
 * third party like Sabre). Any field left out falls back to the default
 * DEUNA redirect bridge URL.
 *
 * Not every field is accepted by every processor — e.g. Mercado Pago Wallet
 * does not support a custom on_failed callback, so it's intentionally not
 * part of this shape.
 */
export interface ApmCallbackUrls {
  onSuccess?: string;
  onCanceled?: string;
  onPending?: string;
}

export interface ApmBehavior {
  callbackUrls?: ApmCallbackUrls;
}

export interface BehaviorWidget {
  hidePayButton?: boolean;
  paymentMethods?: {
    creditCard?: CreditCardBehavior;
    paypal?: PaypalBehavior;
    bankTransfer?: BankTransferBehavior;
    flowType?: PaymentMethodConfigurationFlow;
    /**
     * Per-APM overrides, keyed by processor name (e.g. "mercadopago_wallet" —
     * matches order.payment.data.processor). Only the APMs listed here are
     * affected; every other processor keeps using the order's own
     * callback_urls or the default DEUNA redirect bridge.
     */
    apms?: Record<string, ApmBehavior>;
  };
  onlyCardEnrollment?: boolean;
}

export interface CreditCardBehavior {
  splitPayments?: {
    maxCards: number;
  };
  flow?: BehaviorFlow;
}

export interface PaypalBehavior {
  flow?: BehaviorFlow;
}

export interface InitWidgetBase {
  orderToken?: string;
  userToken?: string;
  language?: Language;
  styleFile?: string;
  int?: string;
  widgetExperience?: DeepPartial<WidgetExperience>;
  userInfo?: Partial<UserInfo>;
  behavior?: BehaviorWidget;
  domain?: string;
  platform?: string;
  hidePayButton?: boolean;
  callbacks?: PaymentWidgetCallbacks &
    ElementsWidgetCallbacks &
    NextActionWidgetCallbacks &
    VoucherWidgetCallbacks;
}


type PaymentMethodConfigurationFlowType = "twoStep" | "singleStep";
export interface PaymentMethodConfigurationFlow {
  type: PaymentMethodConfigurationFlowType;
}