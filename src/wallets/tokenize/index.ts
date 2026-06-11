import type { WalletProvider } from '../types';
import { buildGooglePayTokenizeBody } from './googlePay';
import { buildApplePayTokenizeBody } from './applePay';

const tokenizeBodyBuilders: Record<WalletProvider, (paymentData: unknown) => Record<string, unknown>> = {
  google_pay: buildGooglePayTokenizeBody,
  apple_pay: buildApplePayTokenizeBody,
};

export function buildTokenizeBody(provider: WalletProvider, paymentData: unknown): Record<string, unknown> {
  return tokenizeBodyBuilders[provider](paymentData);
}
