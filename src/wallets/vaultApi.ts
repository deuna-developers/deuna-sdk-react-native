import { ELEMENTS_URLS } from '../types/helpers/buildElementsLink';
import type { UserInfo } from '../types/interfaces/initWidgetBase';

const DEFAULT_CARD_NETWORKS = ['VISA', 'MASTERCARD', 'AMEX', 'DISCOVER'];
const DEFAULT_AUTH_METHODS_APPLE = ['CRYPTOGRAM_3DS'];
const DEFAULT_AUTH_METHODS_GOOGLE = ['PAN_ONLY', 'CRYPTOGRAM_3DS'];

export interface ApplePayCredentials {
  merchantIdentifier: string;
  displayName: string;
  supportedNetworks: string[];
  merchantCapabilities: string[];
  transactionInfo?: {
    amount: string;
    currencyCode: string;
    countryCode: string;
    label: string;
  };
  credentialId?: string;
}

export interface GooglePayCredentials {
  merchantId: string;
  merchantName: string;
  gateway: string;
  gatewayMerchantId: string;
  tokenizationType: 'PAYMENT_GATEWAY' | 'DIRECT';
  publicKey?: string;
  allowedCardNetworks: string[];
  allowedAuthMethods: string[];
  transactionInfo?: {
    totalPrice: string;
    currencyCode: string;
    countryCode: string;
  };
}

export type WalletCredentials = ApplePayCredentials | GooglePayCredentials;

export interface VaultFetchResult {
  providers: string[];
  credentials: Record<string, WalletCredentials>;
  userToken?: string;
  userId?: string;
}

export async function fetchVaultResult(
  environment: string,
  publicApiKey: string,
  orderToken?: string,
  userInfo?: Partial<UserInfo>
): Promise<VaultFetchResult> {
  const base =
    ELEMENTS_URLS[environment as keyof typeof ELEMENTS_URLS] ??
    ELEMENTS_URLS.develop;
  const url = orderToken
    ? `${base}/api/vault?orderToken=${encodeURIComponent(orderToken)}`
    : `${base}/api/vault`;

  const body = userInfo ? buildUserInfoBody(userInfo) : undefined;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'x-api-key': publicApiKey, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw {
      code: 'VAULT_FETCH_FAILED',
      message: `Vault API error: ${response.status}`,
    };
  }

  return parseVaultResponse(await response.json());
}

function parseVaultResponse(json: Record<string, unknown>): VaultFetchResult {
  const paymentMethods = (json['paymentMethods'] as unknown[]) ?? [];
  const checkout = json['checkout'] as Record<string, unknown> | undefined;
  const merchant = checkout?.['merchant'] as
    | Record<string, unknown>
    | undefined;
  const order = (checkout?.['order'] as Record<string, unknown> | undefined)?.[
    'order'
  ] as Record<string, unknown> | undefined;
  const userAuthData = (
    json['userAuthResponse'] as Record<string, unknown> | undefined
  )?.['data'] as Record<string, unknown> | undefined;

  const credentialParser = {
    apple_pay: parseApplePayCredentials,
    google_pay: parseGooglePayCredentials,
  };

  const providers: string[] = [];
  const credentials: Record<string, WalletCredentials> = {};

  for (const rawMethod of paymentMethods) {
    const method = rawMethod as Record<string, unknown>;
    const processorName = method['processor_name'] as string | undefined;
    if (!processorName || providers.includes(processorName)) continue;

    providers.push(processorName);

    const parse =
      credentialParser[processorName as keyof typeof credentialParser];
    if (parse) {
      credentials[processorName] = parse(method, merchant, order);
    }
  }

  return {
    providers,
    credentials,
    userToken:
      (userAuthData?.['user_token'] as string | undefined) || undefined,
    userId: (userAuthData?.['user_id'] as string | undefined) || undefined,
  };
}

function parseApplePayCredentials(
  method: Record<string, unknown>,
  merchant: Record<string, unknown> | undefined,
  order: Record<string, unknown> | undefined
): ApplePayCredentials {
  const extra = (method['extra_params'] as Record<string, unknown>) ?? {};
  const displayName =
    (extra['merchant_name'] as string | undefined) ??
    (merchant?.['name'] as string | undefined) ??
    '';

  return {
    merchantIdentifier:
      (extra['mobile_merchant_id'] as string | undefined) ?? '',
    displayName,
    supportedNetworks:
      (extra['allowed_card_networks'] as string[] | undefined) ??
      DEFAULT_CARD_NETWORKS,
    merchantCapabilities:
      (extra['allowed_auth_methods'] as string[] | undefined) ??
      DEFAULT_AUTH_METHODS_APPLE,
    transactionInfo: buildApplePayTransactionInfo(order, merchant, displayName),
    credentialId: (method['id'] as string | undefined) || undefined,
  };
}

function buildApplePayTransactionInfo(
  order: Record<string, unknown> | undefined,
  merchant: Record<string, unknown> | undefined,
  label: string
): ApplePayCredentials['transactionInfo'] {
  const currency = order?.['currency'] as string | undefined;
  const country = merchant?.['country'] as string | undefined;
  if (!currency || !country) return undefined;
  const totalCents = (order?.['total_amount'] as number | undefined) ?? 0;
  return {
    amount: (totalCents / 100).toFixed(2),
    currencyCode: currency.toUpperCase(),
    countryCode: country.toUpperCase(),
    label,
  };
}

function parseGooglePayCredentials(
  method: Record<string, unknown>,
  merchant: Record<string, unknown> | undefined,
  order: Record<string, unknown> | undefined
): GooglePayCredentials {
  const creds = (method['credentials'] as Record<string, unknown>) ?? {};
  const extra = (method['extra_params'] as Record<string, unknown>) ?? {};
  const gateway = (extra['gateway'] as string | undefined) ?? '';

  return {
    merchantId: (extra['mobile_merchant_id'] as string | undefined) ?? '',
    merchantName: (merchant?.['name'] as string | undefined) ?? '',
    gateway,
    gatewayMerchantId:
      (extra['mobile_merchant_id'] as string | undefined) ?? '',
    tokenizationType:
      gateway.toUpperCase() === 'DIRECT' ? 'DIRECT' : 'PAYMENT_GATEWAY',
    publicKey: (creds['public_api_key'] as string | undefined) || undefined,
    allowedCardNetworks:
      (extra['allowed_card_networks'] as string[] | undefined) ??
      DEFAULT_CARD_NETWORKS,
    allowedAuthMethods:
      (extra['allowed_auth_methods'] as string[] | undefined) ??
      DEFAULT_AUTH_METHODS_GOOGLE,
    transactionInfo: buildGooglePayTransactionInfo(order, merchant),
  };
}

function buildGooglePayTransactionInfo(
  order: Record<string, unknown> | undefined,
  merchant: Record<string, unknown> | undefined
): GooglePayCredentials['transactionInfo'] {
  const currency = order?.['currency'] as string | undefined;
  const country = merchant?.['country'] as string | undefined;
  if (!currency || !country) return undefined;
  const totalCents = (order?.['total_amount'] as number | undefined) ?? 0;
  return {
    totalPrice: (totalCents / 100).toFixed(2),
    currencyCode: currency.toUpperCase(),
    countryCode: country.toUpperCase(),
  };
}

function buildUserInfoBody(
  userInfo: Partial<UserInfo>
): Record<string, unknown> | undefined {
  if (!userInfo.email) return undefined;
  const body: Record<string, unknown> = { email: userInfo.email };
  if (userInfo.firstName) body['firstName'] = userInfo.firstName;
  if (userInfo.lastName) body['lastName'] = userInfo.lastName;
  return body;
}
