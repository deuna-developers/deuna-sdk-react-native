import type { Environment } from '../types/base';
import type { UserInfo } from '../types/interfaces/initWidgetBase';

export type WalletProvider = 'apple_pay' | 'google_pay';

export interface WalletsError {
  code: string;
  message: string;
}

export interface InitElementsParams {
  orderToken: string;
  publicApiKey: string;
  environment: Environment;
  walletProvider: WalletProvider;
  userInfo?: Partial<UserInfo>;
}
