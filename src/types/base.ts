import {
  ElementsWidgetCallbacks,
  NextActionWidgetCallbacks,
  PaymentWidgetCallbacks,
  VoucherWidgetCallbacks,
} from './interfaces/callbacks';
import { CustomStyles } from './interfaces/customStyle';
import { ElementWidgetType } from './helpers/urlConfig';
import {
  InitWidgetBase,
  PaymentMethodConfigurationFlow,
} from './interfaces/initWidgetBase';
import {
  Merchant,
  PaymentMethodTypes,
  PaymentProcessorName,
} from './interfaces/merchant';
import { Order } from './interfaces/order';
import { User } from './interfaces/user';

export type Environment = 'production' | 'sandbox' | 'develop' | 'staging';

export interface InitializeParams {
  environment?: Environment;
  publicApiKey: string;
}
export type SubmitStatus = 'success' | 'error';

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

export type InitPaymentWidgetParams = Omit<InitWidgetBase, 'callbacks'> & {
  orderToken: string;
  callbacks: PaymentWidgetCallbacks;
  paymentMethods?: {
    paymentMethod: string;
    processors: string[];
    configuration?: {
      express?: boolean;
      flowType?: PaymentMethodConfigurationFlow;
    };
  }[];
  sessionId?: string;
};

export type InitElementsWidgetParams = Omit<InitWidgetBase, 'callbacks'> & {
  callbacks: ElementsWidgetCallbacks;
  types?: ElementWidgetType[];
};

export type InitNextActionWidgetParams = Omit<InitWidgetBase, 'callbacks'> & {
  orderToken: string;
  callbacks: NextActionWidgetCallbacks;
};

export type InitVoucherWidgetParams = Omit<InitWidgetBase, 'callbacks'> & {
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
