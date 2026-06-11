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

interface UserInfo {
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

export interface BehaviorWidget {
  hidePayButton?: boolean;
  paymentMethods?: {
    creditCard?: CreditCardBehavior;
    paypal?: PaypalBehavior;
    bankTransfer?: BankTransferBehavior;
    flowType?: PaymentMethodConfigurationFlow;
  };
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