/**
 * Helper function to get base URL based on environment
 * @param config
 * @returns
 */

import { Environment } from "../base";
import {
  configToQueryParams,
  getIntegrationType,
  UrlConfig,
} from "./urlConfig";

const urls: Record<Environment, string> = {
  production: "https://pay.deuna.io",
  sandbox: "https://pay.sandbox.deuna.io",
  staging: "https://pay.stg.deuna.com",
  develop: "https://pay.dev.deuna.io",
};

export const buildPaymentLink = (config: UrlConfig): string => {
  const { env, orderToken } = config;

  let baseUrl = urls.production;

  if (env) {
    baseUrl = urls[env];
  }

  const searchParams = new URLSearchParams({
    mode: "widget",
    int: getIntegrationType(config.mode),
    language: config.language,
  });

  // config.

  const xpropsB64 = {
    id: config.id,
    paymentMethods: config.paymentMethods,
    publicApiKey: config.publicApiKey,
    behavior: config.behavior,
    cdl: {
      sessionId: config.sessionId,
    },
  };

  configToQueryParams(config, searchParams);

  if (config.domain) {
    baseUrl = config.domain;
  }

  //encode to base64
  searchParams.append("xpropsB64", btoa(JSON.stringify(xpropsB64)));

  const url = new URL(`${baseUrl}/now/${orderToken}?${searchParams.toString()}`);

  return url.toString();
};
