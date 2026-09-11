/**
 * Helper function to get base URL based on environment
 * @param config
 * @returns
 */

import { PLATFORM_DEFAULT, WIDGET_URLS } from "./constants";
import { getIntegrationType, UrlConfig } from "./urlConfig";

export const buildVoucherLink = (config: UrlConfig): string => {
  const { env, orderToken } = config;

  let baseUrl = WIDGET_URLS.production;

  if (env) {
    baseUrl = WIDGET_URLS[env];
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
