import {
  configToQueryParams,
  getIntegrationType,
  UrlConfig,
} from "./urlConfig";
import { WIDGET_URLS } from "./constants";

export const buildNextActionLink = (config: UrlConfig): string => {
  const { env, orderToken } = config;

  let baseUrl = WIDGET_URLS.production;

  if (env) {
    baseUrl = WIDGET_URLS[env];
  }

  const xpropsB64 = {
    id: config.id
  };

  const searchParams = new URLSearchParams({
    mode: "widget",
    int: getIntegrationType(config.mode),
    language: config.language,
  });

  //encode to base64
  searchParams.append("xpropsB64", btoa(JSON.stringify(xpropsB64)));

  configToQueryParams(config, searchParams);

  if (config.domain) {
    baseUrl = config.domain;
  }

  const url = new URL(`${baseUrl}/next-action-purchase/${orderToken}?${searchParams.toString()}`);

  return url.toString();
};