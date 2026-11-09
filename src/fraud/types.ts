import type { InitFraudProvidersProps } from '../types/fraudProviders';

export type FraudProvidersConfig = Partial<InitFraudProvidersProps> &
  Record<string, any>;

export interface FraudOptions {
  publicApiKey?: string;
  environment?: string;
}
