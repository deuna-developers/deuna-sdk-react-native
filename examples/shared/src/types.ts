import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Home: undefined;
  Embedded: undefined;
  PaymentSuccess: { order?: Record<string, any> } | undefined;
  CardSavedSuccess: { data?: Record<string, any> } | undefined;
  Wallets: { orderToken?: string; publicApiKey?: string; environment?: string; userInfoFirstName?: string; userInfoLastName?: string; userInfoEmail?: string } | undefined;
};

export type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Home'
>;

export interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}
