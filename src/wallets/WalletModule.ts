import { NativeModules, NativeEventEmitter } from 'react-native';
import type { EmitterSubscription } from 'react-native';
import type { InitElementsParams, WalletProvider, WalletsError } from './types';
import type { UserInfo } from '../types/interfaces/initWidgetBase';
import type {
  GetWalletsAvailableParams,
  WalletElementConfig,
} from '../types/base';
import { api as API_URLS } from '../types/envs';
import { fetchVaultResult } from './vaultApi';
import { buildTokenizeBody } from './tokenize';

type NativeWalletsModule = {
  checkAvailableProviders: (
    params: Record<string, unknown>
  ) => Promise<string[]>;
  launchWallet: (
    params: Record<string, unknown>
  ) => Promise<Record<string, unknown> | 'closed'>;
  setLoading?: (visible: boolean) => void;
  [key: string]: unknown;
};

function resolveNativeWallets(): {
  mod: NativeWalletsModule;
  isExpo: boolean;
} | null {
  // RN CLI / bare: module registered via RCTBridgeModule.
  // Keep this path dependency-free (no expo-modules-core require).
  const mod = (NativeModules.DeunaWallets ??
    null) as NativeWalletsModule | null;
  return mod ? { mod, isExpo: false } : null;
}

function getNativeWallets() {
  return resolveNativeWallets()?.mod ?? null;
}

function getEmitter() {
  const resolved = resolveNativeWallets();
  if (!resolved) return null;
  return new NativeEventEmitter(resolved.mod as any);
}

async function executeWithNativeLoader<T>(
  mod: NativeWalletsModule,
  task: () => Promise<T>
): Promise<T> {
  mod.setLoading?.(true);
  try {
    return await task();
  } finally {
    mod.setLoading?.(false);
  }
}

function isWalletElementConfig(
  params: GetWalletsAvailableParams
): params is WalletElementConfig {
  return 'GOOGLE_PAY' in params || 'APPLE_PAY' in params;
}

const WALLET_PROVIDER_MAP: Record<string, WalletProvider> = {
  GOOGLE_PAY: 'google_pay',
  APPLE_PAY: 'apple_pay',
};

/**
 * Returns the list of wallet providers available on the current device for the given order.
 *
 * Two flows:
 *  - WalletElementConfig: credentials provided directly, no vault fetch.
 *    Native module checks device availability only.
 *  - { orderToken?, userInfo? }: fetches vault API to get providers + credentials,
 *    then native module filters by device availability.
 */
export async function getWalletsAvailable(
  publicApiKey: string,
  environment: string,
  params: GetWalletsAvailableParams
): Promise<WalletProvider[]> {
  const mod = getNativeWallets();
  if (!mod) {
    console.log('❌ [Wallets] No native module available');
    return [];
  }

  if (isWalletElementConfig(params)) {
    const providers = Object.keys(params).filter(
      (k): k is keyof WalletElementConfig =>
        k === 'GOOGLE_PAY' || k === 'APPLE_PAY'
    );
    const available: string[] = await mod.checkAvailableProviders({
      providers: providers.map((p) => WALLET_PROVIDER_MAP[p]),
      environment,
    });
    if (available.length === 0) {
      console.log(
        '⚠️ [Wallets] No wallets available for current device/context'
      );
    }

    return available as WalletProvider[];
  }

  const { orderToken, userInfo } = params as {
    orderToken?: string;
    userInfo?: Partial<UserInfo>;
  };
  const vaultResult = await fetchVaultResult(
    environment,
    publicApiKey,
    orderToken,
    userInfo
  );

  if (vaultResult.providers.length === 0) {
    console.log('⚠️ [Wallets] No wallets available for current device/context');
    return [];
  }

  const available: string[] = await mod.checkAvailableProviders({
    providers: vaultResult.providers,
    environment,
  });
  if (available.length === 0) {
    console.log('⚠️ [Wallets] No wallets available for current device/context');
  }

  return available as WalletProvider[];
}

/**
 * Launches the native wallet payment sheet for the given provider.
 * - Resolves with `undefined` on payment success (tokenization complete if userToken present).
 * - Resolves with `"closed"` when the user dismisses without paying.
 * - Rejects with a `WalletsError` on failure.
 *
 * Credentials are re-used from a prior getWalletsAvailable call if available,
 * otherwise the vault API is refetched.
 */
export async function initElements(
  params: InitElementsParams,
  walletConfig?: WalletElementConfig
): Promise<Record<string, unknown> | 'closed'> {
  const mod = getNativeWallets();
  if (!mod)
    throw new Error(
      'DeunaWallets native module is not available on this platform. ' +
        'Ensure the native module is properly linked and available at runtime.'
    );

  const { orderToken, publicApiKey, environment, walletProvider, userInfo } =
    params;

  let credentials: Record<string, unknown> | undefined;
  let userToken: string | undefined;
  let userId: string | undefined;

  if (walletConfig) {
    const configKey =
      walletProvider === 'apple_pay' ? 'APPLE_PAY' : 'GOOGLE_PAY';
    credentials = walletConfig[configKey] as
      | Record<string, unknown>
      | undefined;
  }

  if (!credentials) {
    const vaultResult = await executeWithNativeLoader(mod, () =>
      fetchVaultResult(environment, publicApiKey, orderToken, userInfo)
    );
    credentials = vaultResult.credentials[walletProvider] as
      | Record<string, unknown>
      | undefined;
    userToken = vaultResult.userToken;
    userId = vaultResult.userId;
  }

  if (!credentials) {
    throw {
      code: 'WALLET_UNAVAILABLE',
      message: `No credentials for ${walletProvider}`,
    };
  }

  if (!userToken || !userId) {
    throw {
      code: 'MISSING_USER_AUTH',
      message:
        'userToken or userId is missing — cannot tokenize wallet payment.',
    };
  }

  let result: Record<string, unknown> | 'closed';
  try {
    result = await mod.launchWallet({
      provider: walletProvider,
      credentials,
      environment,
    });
  } catch (nativeErr: any) {
    throw nativeErr;
  }

  if (result === 'closed') return 'closed';

  const paymentData = (result as Record<string, unknown>).paymentData;
  try {
    return await executeWithNativeLoader(mod, () =>
      tokenizeCard({
        environment,
        publicApiKey,
        userId,
        userToken,
        provider: walletProvider,
        paymentData,
      })
    );
  } catch (tokenizeErr: any) {
    const rawMessage =
      tokenizeErr?.message ??
      (typeof tokenizeErr === 'string'
        ? tokenizeErr
        : 'Unknown tokenization error');

    throw {
      code: tokenizeErr?.code ?? 'TOKENIZATION_ERROR',
      message: rawMessage,
      metadata: {
        provider: walletProvider,
        environment,
        userId,
        requestUrl:
          tokenizeErr?.metadata?.requestUrl ??
          `${API_URLS[environment as keyof typeof API_URLS] ?? API_URLS.develop}/users/${encodeURIComponent(userId)}/cards`,
        status: tokenizeErr?.metadata?.status,
        responseBody: tokenizeErr?.metadata?.responseBody,
        paymentDataPreview: JSON.stringify(paymentData ?? null).slice(0, 1000),
        rawError: JSON.stringify(tokenizeErr ?? {}).slice(0, 1000),
        stack: tokenizeErr?.stack,
      },
    };
  }
}

async function tokenizeCard(params: {
  environment: string;
  publicApiKey: string;
  userId: string;
  userToken: string;
  provider: WalletProvider;
  paymentData: unknown;
}): Promise<Record<string, unknown>> {
  const {
    environment,
    publicApiKey,
    userId,
    userToken,
    provider,
    paymentData,
  } = params;
  try {
    const base =
      API_URLS[environment as keyof typeof API_URLS] ?? API_URLS.develop;
    const url = `${base}/users/${encodeURIComponent(userId)}/cards`;

    const body = buildTokenizeBody(provider, paymentData);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
        'x-api-key': publicApiKey,
      },
      body: JSON.stringify(body),
    });

    const responseText = await response.text().catch(() => '');

    let json: Record<string, unknown> = {};
    try {
      json = JSON.parse(responseText);
    } catch {
      /* non-JSON body */
    }

    if (json?.error) {
      const errPayload = json.error as Record<string, unknown>;
      throw {
        code: errPayload.code ?? 'TOKENIZATION_ERROR',
        message: errPayload.message ?? 'Card tokenization returned an error.',
        metadata: {
          provider,
          requestUrl: url,
          status: response.status,
          responseBody: responseText,
        },
      };
    }

    if (!response.ok) {
      throw {
        code: 'TOKENIZATION_ERROR',
        message: `Tokenization failed: ${response.status}`,
        metadata: {
          provider,
          requestUrl: url,
          status: response.status,
          responseBody: responseText,
        },
      };
    }

    return json;
  } catch (err: any) {
    throw {
      code: err?.code ?? 'TOKENIZATION_ERROR',
      message: err?.message ?? 'Unexpected tokenization error',
      metadata: {
        provider,
        environment,
        userId,
        paymentDataPreview: JSON.stringify(paymentData ?? null).slice(0, 1000),
        rawError: JSON.stringify(err ?? {}).slice(0, 1000),
        stack: err?.stack,
        ...(err?.metadata ?? {}),
      },
    };
  }
}

export function addWalletSuccessListener(
  listener: (data: Record<string, unknown>) => void
): EmitterSubscription | null {
  const emitter = getEmitter();
  return emitter?.addListener('onWalletSuccess', listener) ?? null;
}

export function addWalletErrorListener(
  listener: (error: WalletsError) => void
): EmitterSubscription | null {
  const emitter = getEmitter();
  return emitter?.addListener('onWalletError', listener) ?? null;
}

export function addWalletClosedListener(
  listener: (payload: { action: 'userAction' | 'systemAction' }) => void
): EmitterSubscription | null {
  const emitter = getEmitter();
  return emitter?.addListener('onWalletClosed', listener) ?? null;
}
