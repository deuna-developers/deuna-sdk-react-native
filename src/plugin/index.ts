import { type ConfigPlugin } from 'expo/config-plugins';
import { withIosApplePay } from './withIosApplePay';
import { withAndroidGooglePay } from './withAndroidGooglePay';
import { withAndroidDepsCompat } from './withAndroidDepsCompat';
import { withIosFmtFix } from './withIosFmtFix';
import {
  withFraudProviders,
  type SupportedFraudProvider,
} from './withFraudProviders';

export type { SupportedFraudProvider };

export interface DeunaPluginOptions {
  merchantIdentifiers?: string[];
  googlePay?: boolean;
  fraudProviders?: SupportedFraudProvider[];
}

/** @deprecated Use DeunaPluginOptions */
export type DeunaWalletsPluginOptions = DeunaPluginOptions;

const withDeunaSDK: ConfigPlugin<DeunaPluginOptions> = (
  config,
  options = {}
) => {
  const { merchantIdentifiers, googlePay = true, fraudProviders } = options;

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
  if (fraudProviders?.length) {
    config = withFraudProviders(config, { fraudProviders });
  }
  return config;
};

export { withFraudProviders };
export default withDeunaSDK;
