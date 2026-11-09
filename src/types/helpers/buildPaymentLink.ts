/**
 * Helper function to get base URL based on environment
 * @param config
 * @returns
 */

import {
  configToQueryParams,
  getIntegrationType,
  UrlConfig,
} from "./urlConfig";
import { PLATFORM_DEFAULT, WIDGET_URLS } from "./constants";

export const buildPaymentLink = (config: UrlConfig): string => {
  const { env, orderToken, widgetExperience } = config;

  let baseUrl = WIDGET_URLS.production;

  if (env) {
    baseUrl = WIDGET_URLS[env];
  }

  const searchParams = new URLSearchParams({
    mode: "widget",
    int: getIntegrationType(config.mode),
    language: config.language,
    platform: config.platform || PLATFORM_DEFAULT,
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
    widgetExperience,
  };

  configToQueryParams(config, searchParams);

  if (config.domain) {
    baseUrl = config.domain;
  }

  //encode to base64
  searchParams.append("xpropsB64", btoa(JSON.stringify(xpropsB64)));

  const token = orderToken || "preload";

  const url = new URL(
    `${baseUrl}/now/${token}?${searchParams.toString()}`
  );

  return url.toString();
};
