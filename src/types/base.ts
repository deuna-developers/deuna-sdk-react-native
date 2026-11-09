import {
  ElementsWidgetCallbacks,
  NextActionWidgetCallbacks,
  PaymentWidgetCallbacks,
  VoucherWidgetCallbacks,
} from "./interfaces/callbacks";

export interface GooglePayTransactionInfo {
  totalPrice: string;
  totalPriceStatus: string;
  currencyCode: string;
  countryCode: string;
  totalPriceLabel?: string;
}

export interface ApplePayTransactionInfo {
  label: string;
  amount: string;
  currencyCode: string;
  countryCode: string;
}

export type GooglePayTokenizationType = "PAYMENT_GATEWAY" | "DIRECT";

export interface GooglePayWalletConfig {
  merchantId: string;
  merchantName: string;
  /** Payment gateway identifier (e.g. 'deuna', 'adyen') — used with PAYMENT_GATEWAY tokenization */
  gateway: string;
  /** Merchant identifier within the payment gateway — used with PAYMENT_GATEWAY tokenization */
  gatewayMerchantId: string;
  /** Tokenization type: "PAYMENT_GATEWAY" (default) or "DIRECT" */
  tokenizationType?: GooglePayTokenizationType;
  /** Base64-encoded public key for DIRECT tokenization */
  publicKey?: string;
  /** Protocol version for DIRECT tokenization (defaults to "ECv2") */
  protocolVersion?: string;
  transactionInfo?: GooglePayTransactionInfo;
  allowedCardNetworks?: Array<
    "AMEX" | "DISCOVER" | "INTERAC" | "JCB" | "MASTERCARD" | "VISA"
  >;
  allowedCardAuthMethods?: Array<"PAN_ONLY" | "CRYPTOGRAM_3DS">;
}

export interface ApplePayWalletConfig {
  /** Optional — under Option B (DEUNA-Managed), the backend resolves it via X-Api-Key. */
  merchantIdentifier?: string;
  displayName: string;
  transactionInfo?: ApplePayTransactionInfo;
  supportedNetworks?: string[];
  merchantCapabilities?: string[];
}

export interface WalletElementConfig {
  GOOGLE_PAY?: GooglePayWalletConfig;
  APPLE_PAY?: ApplePayWalletConfig;
}

/**
 * Parameters for `getWalletsAvailable()`.
 *
 * - **No arguments (Elements flow):** The SDK calls the DEUNA SSR endpoint
 *   with just the `publicApiKey` to resolve wallet credentials from the
 *   merchant configuration.
 *
 * - **`{ orderToken, userInfo }` (Elements flow with order):** Same SSR call
 *   but includes order data so transactionInfo is pre-resolved. This avoids
 *   a second SSR call during the click handler, which is critical for Apple Pay
 *   (user gesture must reach `session.begin()` within ~5 seconds).
 *
 * - **`WalletElementConfig` (Payment Widget / Modular Checkout):**
 *   Uses the provided credentials directly. No SSR call.
 */
export type GetWalletsAvailableParams =
  | WalletElementConfig
  | {
      orderToken?: string;
      userInfo?: Partial<UserInfo>;
    };


import { CustomStyles } from "./interfaces/customStyle";
import { ElementWidgetType } from "./helpers/urlConfig";
import {
  InitWidgetBase,
  PaymentMethodConfigurationFlow,
  UserInfo,
} from "./interfaces/initWidgetBase";
import {
  Merchant,
  PaymentMethodTypes,
  PaymentProcessorName,
} from "./interfaces/merchant";
import { Order } from "./interfaces/order";
import { User } from "./interfaces/user";
import { InitFraudProvidersProps } from "./fraudProviders";

export type Environment = "production" | "sandbox" | "develop" | "staging";

export interface InitializeParams {
  environment?: Environment;
  publicApiKey: string;
}
export type SubmitStatus = "success" | "error";

export type SubmitResult = {
  status: SubmitStatus;
  message?: string;
  code?: string;
};

export interface State {
  order: Order;
  merchant: Merchant;
  user: User;
  paymentMethods: {
    selectedPaymentMethod: {
      method_type: PaymentMethodTypes;
      processor_name?: PaymentProcessorName;
      configuration?: {
        express?: boolean;
        flowType?: PaymentMethodConfigurationFlow;
      };
    };
  };
}

export type Submit = () => Promise<SubmitResult>;
export type SetCustomStyle = (customStyles: CustomStyles) => void;
export type GetStateFn = () => Promise<State>;
export type IsValid = () => Promise<boolean>;
export type RefetchOrder = () => Promise<Order | null>;
export type OrderData = { orderToken?: string; userToken?: string };
export type SetOrderDataFn = (data: OrderData) => Promise<void>;

export type InitPaymentWidgetParams = Omit<InitWidgetBase, "callbacks"> & {
  orderToken: string;
  callbacks?: PaymentWidgetCallbacks;
  paymentMethods?: {
    paymentMethod: string;
    processors: string[];
    configuration?: {
      express?: boolean;
      flowType?: PaymentMethodConfigurationFlow;
    };
  }[];
  fraudCredentials?: Partial<InitFraudProvidersProps>;
  sessionId?: string;
  idempotencyKey?: string;
};

export type InitElementsWidgetParams = Omit<InitWidgetBase, "callbacks"> & {
  callbacks?: ElementsWidgetCallbacks;
  types?: ElementWidgetType[];
  /** Configuration for wallet payment providers (Google Pay, Apple Pay) */
  walletConfig?: WalletElementConfig;
};

export type InitNextActionWidgetParams = Omit<InitWidgetBase, "callbacks"> & {
  orderToken: string;
  callbacks: NextActionWidgetCallbacks;
};

export type InitVoucherWidgetParams = Omit<InitWidgetBase, "callbacks"> & {
  orderToken: string;
  callbacks: VoucherWidgetCallbacks;
};

export abstract class BaseDeuna {
  abstract setCustomStyleFn?: SetCustomStyle;
  abstract refetchOrderFn?: RefetchOrder;
  abstract getStateFn?: GetStateFn;
  abstract onSubmitFn?: Submit;
  abstract isValidFn?: IsValid;
  abstract closeFn?: () => void;
  abstract setOrderDataFn?: SetOrderDataFn;

  abstract getSessionId(): Promise<string>;
  abstract submit(): Promise<SubmitResult>;
  abstract close(): Promise<void>;

  async setCustomStyles(customStyles: CustomStyles): Promise<void> {
    await this.setCustomStyleFn?.(customStyles);
  }

  async refetchOrder(): Promise<Order | null> {
    return this.refetchOrderFn?.() || null;
  }

  async getWidgetState() {
    return this.getStateFn?.();
  }

  async isValid(): Promise<boolean> {
    return this.isValidFn?.() || false;
  }

  async getSelectedPaymentMethod() {
    const state = await this.getStateFn?.();
    if (!state?.paymentMethods.selectedPaymentMethod) {
      return null;
    }
    return state.paymentMethods.selectedPaymentMethod;
  }

  abstract initPaymentWidget(params: InitPaymentWidgetParams): Promise<void>;
  abstract initElements(params: InitElementsWidgetParams): Promise<void>;
  abstract initNextAction(params: InitNextActionWidgetParams): Promise<void>;
  abstract initVoucherWidget(params: InitVoucherWidgetParams): Promise<void>;
}
