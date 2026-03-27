/**
 * Helper function to get base URL based on environment
 * @param config
 * @returns
 */

import { Environment } from "../base";
import { PLATFORM_DEFAULT } from "./constants";
import { getIntegrationType, UrlConfig } from "./urlConfig";

const urls: Record<Environment, string> = {
  production: "https://pay.deuna.io",
  sandbox: "https://pay.sandbox.deuna.io",
  staging: "https://pay.stg.deuna.com",
  develop: "https://pay.dev.deuna.io",
};

export const buildVoucherLink = (config: UrlConfig): string => {
  const { env, orderToken } = config;

  let baseUrl = urls.production;

  if (env) {
    baseUrl = urls[env];
  }

  const searchParams = new URLSearchParams({
    mode: "widget",
    int: getIntegrationType(config.mode),
    language: config.language,
    orderToken,
    platform: config.platform || PLATFORM_DEFAULT,
  });

  const xpropsB64 = {
    id: config.id,
    cdl: {
      sessionId: config.sessionId,
    },
  };

  if (config.domain) {
    baseUrl = config.domain;
  }

  //encode to base64
  searchParams.append("xpropsB64", btoa(JSON.stringify(xpropsB64)));

  const url = new URL(`${baseUrl}/voucher?${searchParams.toString()}`);

  return url.toString();
};
