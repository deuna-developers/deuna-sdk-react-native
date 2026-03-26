import { Mode } from '@deuna/react-native-sdk';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Home: undefined;
  PaymentSuccess: { order?: Record<string, any> } | undefined;
  SaveCardSuccess: { data?: Record<string, any> } | undefined;
};

export type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Home'
>;

export interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

export enum Widgets {
  PAYMENT_WIDGET = 'Payment Widget',
  NEXT_ACTION_WIDGET = 'Next Action Widget',
  VOUCHER_WIDGET = 'Voucher Widget',
  VAULT_WIDGET = 'Vault Widget',
}

export interface AppState {
  orderToken: string;
  userToken: string;
  mode: Mode;
}
