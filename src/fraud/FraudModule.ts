import { NativeModules } from 'react-native';
import type { FraudOptions, FraudProvidersConfig } from './types';
import { DeunaLogs } from '../DeunaLogs';

type NativeFraudModule = {
  generateFraudId: (params: Record<string, unknown>) => Promise<string | null>;
  initializeFraudProviders: (params: Record<string, unknown>) => Promise<void>;
  [key: string]: unknown;
};

function getNativeFraud(): NativeFraudModule | null {
  const mod = (NativeModules.DeunaFraud ?? null) as NativeFraudModule | null;
  return mod;
}

/**
 * Generates a unified fraud ID / session token from configured fraud providers on the device.
 *
 * @param params Fraud provider configurations (e.g. { MERCADOPAGO: {}, CYBERSOURCE: { ... } })
 * @param options Optional environment and publicApiKey context
 * @returns Base64 encoded string containing the fraud IDs by provider, or null if unlinked/empty
 */
export async function generateFraudId(
  params: FraudProvidersConfig = {},
  options?: FraudOptions
): Promise<string | null> {
  const mod = getNativeFraud();
  if (!mod) {
    DeunaLogs.warn(
      'FraudModule',
      'DeunaFraud native module is not available on this platform. Ensure the native module is linked.'
    );
    return null;
  }

  const payload: Record<string, unknown> = {
    providers: params,
    ...(options?.publicApiKey ? { publicApiKey: options.publicApiKey } : {}),
    ...(options?.environment ? { environment: options.environment } : {}),
  };

  try {
    return await mod.generateFraudId(payload);
  } catch (error: any) {
    DeunaLogs.error('FraudModule', 'generateFraudId failed: ' + (error?.message ?? error));
    return null;
  }
}

/**
 * Initializes fraud providers in background (useful for providers like Mercado Pago on Android).
 *
 * @param params Fraud provider configurations (e.g. { MERCADOPAGO: {} })
 * @param options Optional environment and publicApiKey context
 */
export async function initializeFraudProviders(
  params: FraudProvidersConfig = {},
  options?: FraudOptions
): Promise<void> {
  const mod = getNativeFraud();
  if (!mod) {
    DeunaLogs.warn(
      'FraudModule',
      'DeunaFraud native module is not available on this platform. Ensure the native module is linked.'
    );
    return;
  }

  const payload: Record<string, unknown> = {
    providers: params,
    ...(options?.publicApiKey ? { publicApiKey: options.publicApiKey } : {}),
    ...(options?.environment ? { environment: options.environment } : {}),
  };

  try {
    await mod.initializeFraudProviders(payload);
  } catch (error: any) {
    DeunaLogs.error(
      'FraudModule',
      'initializeFraudProviders failed: ' + (error?.message ?? error)
    );
  }
}
