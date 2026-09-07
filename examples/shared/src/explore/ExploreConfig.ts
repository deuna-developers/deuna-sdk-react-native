import { Mode } from '@deuna/react-native-sdk';

export type ExploreEnvironment = 'sandbox' | 'staging' | 'production' | 'develop';

export enum ExploreWidget {
  PAYMENT_WIDGET = 'Payment Widget',
  VAULT_WIDGET = 'Vault Widget',
  NEXT_ACTION_WIDGET = 'Next Action',
  VOUCHER_WIDGET = 'Voucher',
}

export interface ExploreConfig {
  publicApiKey: string;
  environment: ExploreEnvironment;
  orderToken: string;
  userToken: string;
  selectedWidget: ExploreWidget;
  mode: Mode;
  hidePayButton: boolean;
  userInfoFirstName: string;
  userInfoLastName: string;
  userInfoEmail: string;
}

export const defaultExploreConfig: ExploreConfig = {
  publicApiKey: '',
  environment: 'sandbox',
  orderToken: '',
  userToken: '',
  selectedWidget: ExploreWidget.PAYMENT_WIDGET,
  mode: Mode.MODAL,
  hidePayButton: true,
  userInfoFirstName: '',
  userInfoLastName: '',
  userInfoEmail: '',
};
