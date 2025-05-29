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

export const buildNextActionLink = (config: UrlConfig): string => {
  const { env, orderToken } = config;

  let baseUrl = urls.production;

  if (env) {
    baseUrl = urls[env];
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