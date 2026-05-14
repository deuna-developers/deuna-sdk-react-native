import { type ConfigPlugin } from 'expo/config-plugins';
import { withIosApplePay } from './withIosApplePay';
import { withAndroidGooglePay } from './withAndroidGooglePay';
import { withAndroidDepsCompat } from './withAndroidDepsCompat';
import { withIosFmtFix } from './withIosFmtFix';

export interface DeunaWalletsPluginOptions {
  merchantIdentifiers?: string[];
  googlePay?: boolean;
}

const withDeunaWallets: ConfigPlugin<DeunaWalletsPluginOptions> = (
  config,
  options = {}
) => {
  const { merchantIdentifiers, googlePay = true } = options;

  // Always apply — fixes fmt consteval build error with Xcode 16 / Clang 16+
  config = withIosFmtFix(config);

  // Always apply — pins transitive deps to versions compatible with RN 0.76.x
  config = withAndroidDepsCompat(config);

  if (merchantIdentifiers?.length) {
    config = withIosApplePay(config, { merchantIdentifiers });
  }
  if (googlePay) {
    config = withAndroidGooglePay(config);
  }
  return config;
};

export default withDeunaWallets;
