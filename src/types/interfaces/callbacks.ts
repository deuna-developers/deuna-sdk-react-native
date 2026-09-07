export type ClosedAction = "userAction" | "systemAction";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Json = Record<string, any>;

export interface WalletPaymentData {
  provider: "GOOGLE_PAY" | "APPLE_PAY";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  paymentMethodData: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  shippingAddress?: Record<string, any>;
  email?: string;
}

export interface WalletPaymentAuthResult {
  status: "SUCCESS" | "ERROR";
  error?: string;
}

export interface OnClosedMetadata {
  code: string;
  message: string;
}

export interface OnError {
  type: string;
  metadata: {
    code: string;
    message: string;
  };
}

interface OnCardBinDetected {
  cardBin: string;
  cardBrand: string;
}

interface OnInstallmentSelectedPayload {
  cardBin: string;
  installmentPlanOptionId: string;
}

interface Dimensions {
  height: number;
  width: number;
}
interface BaseCallbacks {
  onSuccess?: (data: Json) => void;
  onError?: (data: OnError) => void;
  onClosed?: (action: ClosedAction, metadata?: OnClosedMetadata) => void;
  onEventDispatch?: (event: string, payload: Json) => void;
  onResize?: (dimensions: Dimensions) => void;
}

export interface PaymentWidgetCallbacks extends BaseCallbacks {
  onCardBinDetected?: (data: OnCardBinDetected) => void;
  onInstallmentSelected?: (data: OnInstallmentSelectedPayload) => void;
  onPaymentProcessing?: () => void;
  onPaymentAuthorized?: (data: WalletPaymentData) => Promise<WalletPaymentAuthResult>;
}

export interface ElementsWidgetCallbacks extends BaseCallbacks {
  onCardBinDetected?: (data: OnCardBinDetected) => void;
  onInstallmentSelected?: (data: OnInstallmentSelectedPayload) => void;
}

export interface NextActionWidgetCallbacks extends BaseCallbacks {}

export interface VoucherWidgetCallbacks extends BaseCallbacks {
  onCardBinDetected?: (data: OnCardBinDetected) => void;
  onInstallmentSelected?: (data: OnInstallmentSelectedPayload) => void;
  onPaymentProcessing?: () => void;
}
