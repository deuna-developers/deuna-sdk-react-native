import { type ConfigPlugin, withEntitlementsPlist } from 'expo/config-plugins';

export const withIosApplePay: ConfigPlugin<{ merchantIdentifiers: string[] }> = (
  config,
  { merchantIdentifiers }
) =>
  withEntitlementsPlist(config, (mod) => {
    mod.modResults['com.apple.developer.in-app-payments'] = merchantIdentifiers;
    return mod;
  });
