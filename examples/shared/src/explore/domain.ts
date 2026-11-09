// ─── Integration Config ──────────────────────────────────────────────────────

export type IntegrationEnvironment = 'sandbox' | 'development' | 'staging';

// Map from our IntegrationEnvironment to SDK's Environment type
export type SdkEnvironment = 'sandbox' | 'develop' | 'staging' | 'production';

export function toSdkEnvironment(env: IntegrationEnvironment): SdkEnvironment {
  return env === 'development' ? 'develop' : env;
}
export type WidgetType =
  | 'payment'
  | 'vault'
  | 'next_action'
  | 'voucher'
  | 'click_to_pay';
export type PresentationMode = 'modal' | 'embedded';

export interface IntegrationConfig {
  environment: IntegrationEnvironment;
  privateKey: string;
  publicKey: string;
  orderToken: string;
  userToken: string;
  fraudId: string;
  fraudProvidersJson: string;
  merchantName: string;
  merchantCountryCode: string;
  merchantCurrencyCode: string;
  hidePayButton: boolean;
  enableSplitPayment: boolean;
  presentationMode: PresentationMode;
  selectedWidget: WidgetType;
  userInfoFirstName: string;
  userInfoLastName: string;
  userInfoEmail: string;
  domain: string;
  callbackUrlSuccess: string;
  callbackUrlCanceled: string;
  callbackUrlPending: string;
}

// Scheme registered in both example apps' manifests (AndroidManifest.xml's
// host-less <data android:scheme="myapprn" /> and iOS's CFBundleURLSchemes),
// so a "Generate" button in the drawer can fill working deep links without
// the user having to know the scheme.
export const CALLBACK_URL_SCHEME = 'myapprn';

export function generateDefaultCallbackUrls(): Pick<
  IntegrationConfig,
  'callbackUrlSuccess' | 'callbackUrlCanceled' | 'callbackUrlPending'
> {
  return {
    callbackUrlSuccess: `${CALLBACK_URL_SCHEME}://success`,
    callbackUrlCanceled: `${CALLBACK_URL_SCHEME}://canceled`,
    callbackUrlPending: `${CALLBACK_URL_SCHEME}://pending`,
  };
}

/**
 * Builds the behavior.paymentMethods.apms override for mercadopago_wallet from the
 * drawer's callback URL fields. Returns undefined when none are set, so
 * initPaymentWidget's behavior param is simply omitted (unchanged default behavior).
 */
export function buildApmBehaviorOverride(
  config: IntegrationConfig
): Record<string, any> | undefined {
  const { callbackUrlSuccess, callbackUrlCanceled, callbackUrlPending } =
    config;
  if (!callbackUrlSuccess && !callbackUrlCanceled && !callbackUrlPending) {
    return undefined;
  }
  return {
    paymentMethods: {
      apms: {
        mercadopago_wallet: {
          callbackUrls: {
            ...(callbackUrlSuccess ? { onSuccess: callbackUrlSuccess } : {}),
            ...(callbackUrlCanceled
              ? { onCanceled: callbackUrlCanceled }
              : {}),
            ...(callbackUrlPending ? { onPending: callbackUrlPending } : {}),
          },
        },
      },
    },
  };
}

export const DEFAULT_FRAUD_PROVIDERS_JSON = JSON.stringify(
  {
    ACCERTIFY: {},
    RISKIFIED: { storeDomain: 'your_domain.com' },
    MERCADOPAGO: {},
    CYBERSOURCE: { orgId: 'your_org_id', merchantId: 'your_merchant_id' },
  },
  null,
  2
);

export const defaultIntegrationConfig: IntegrationConfig = {
  environment: 'sandbox',
  privateKey: '',
  publicKey: '',
  orderToken: '',
  userToken: '',
  fraudId: '',
  fraudProvidersJson: DEFAULT_FRAUD_PROVIDERS_JSON,
  merchantName: '',
  merchantCountryCode: 'US',
  merchantCurrencyCode: 'USD',
  hidePayButton: true,
  enableSplitPayment: false,
  presentationMode: 'modal',
  selectedWidget: 'payment',
  userInfoFirstName: '',
  userInfoLastName: '',
  userInfoEmail: '',
  domain: '',
  callbackUrlSuccess: '',
  callbackUrlCanceled: '',
  callbackUrlPending: '',
};

export function getApiBaseUrl(environment: IntegrationEnvironment): string {
  switch (environment) {
    case 'sandbox':
      return 'https://api.sandbox.deuna.io';
    case 'development':
      return 'https://api.dev.deuna.io';
    case 'staging':
      return 'https://api.stg.deuna.io';
  }
}

// ─── Product ─────────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  image: string;
  /** Price in cents (USD base) */
  basePriceCents: number;
}

export interface ApmOption {
  paymentMethod: string;
  processor: string;
  logo: string;
  iosCompatible: boolean;
  androidCompatible: boolean;
}

// ─── Storage Adapter ─────────────────────────────────────────────────────────

export interface StorageAdapter {
  load(): Promise<IntegrationConfig | null>;
  save(config: IntegrationConfig): Promise<void>;
}

// ─── Merchant Profile ────────────────────────────────────────────────────────

export interface MerchantProfile {
  name: string;
  countryCode: string;
  currencyCode: string;
}
