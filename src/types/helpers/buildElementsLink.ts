import { Environment } from "../base";
import { hasKey } from "../utils/hasKey";
import { getIntegrationType, UrlConfig } from "./urlConfig";
import { PLATFORM_DEFAULT } from "./constants";

const ELEMENTS_URLS: Record<Environment, string> = {
  production: "https://elements.deuna.com",
  sandbox: "https://elements.sandbox.deuna.io",
  staging: "https://elements.stg.deuna.io",
  develop: "https://elements.dev.deuna.io",
} as const;

const WIDGET_PATHS = {
  click_to_pay: "/click_to_pay",
  vault: "/vault",
} as const;

type WidgetPath = keyof typeof WIDGET_PATHS;

interface SearchParams {
  publicApiKey: string;
  orderToken: string;
  email: string;
  firstName: string;
  lastName: string;
  int: string;
  language: string;
  cssFile?: string;
  userToken?: string;
  showSavedCardsFlow?: string;
  showDefaultCardFlow?: string;
  platform?: string;
}

/**
 * Builds the base URL for the Elements widget based on environment and domain configuration
 */
const buildBaseUrl = (config: UrlConfig): string => {
  if (config.domain) {
    return config.domain;
  }
  return config.env ? ELEMENTS_URLS[config.env] : ELEMENTS_URLS.production;
};

/**
 * Builds the search parameters for the Elements widget URL
 */
const buildSearchParams = (config: UrlConfig): URLSearchParams => {
  const { userInfo, userToken, widgetExperience, styleFile, mode, language } =
    config;

  const searchParams: SearchParams = {
    publicApiKey: config.publicApiKey,
    orderToken: config.orderToken,
    platform: config.platform || PLATFORM_DEFAULT,
    email: userInfo?.email || "",
    firstName: userInfo?.firstName || "",
    lastName: userInfo?.lastName || "",
    int: getIntegrationType(mode),
    language,
  };

  if (styleFile) {
    searchParams.cssFile = styleFile;
  }

  if (userToken) {
    searchParams.userToken = userToken;
  }

  if (widgetExperience?.userExperience?.showSavedCardsFlow) {
    searchParams.showSavedCardsFlow = String(
      widgetExperience.userExperience.showSavedCardsFlow
    );
  }

  if (widgetExperience?.userExperience?.defaultCardFlow) {
    searchParams.showDefaultCardFlow = String(
      widgetExperience.userExperience.defaultCardFlow
    );
  }

  return new URLSearchParams(searchParams as unknown as Record<string, string>);
};

/**
 * Determines the widget path based on the provided types
 */
const getWidgetPath = (types?: Array<{ name: string }>): string => {
  if (types && types.length > 0) {
    const firstPath = types[0]?.name as WidgetPath;
    return hasKey(WIDGET_PATHS, firstPath)
      ? WIDGET_PATHS[firstPath]
      : WIDGET_PATHS.vault;
  }
  return WIDGET_PATHS.vault;
};

/**
 * Builds a complete Elements widget URL with all necessary parameters
 * @param config - Configuration object for building the Elements URL
 * @returns The complete Elements widget URL as a string
 */
export const buildElementsLink = (config: UrlConfig): string => {
  const baseUrl = buildBaseUrl(config);
  const searchParams = buildSearchParams(config);

  const xpropsB64 = {
    id: config.id,
    behavior: config.behavior || {},
  };

  searchParams.append("xpropsB64", btoa(JSON.stringify(xpropsB64)));

  const widgetPath = getWidgetPath(config.types);
  const normalizedPath = widgetPath.startsWith("/")
    ? widgetPath
    : `/${widgetPath}`;

  const url = new URL(`${baseUrl}${normalizedPath}?${searchParams.toString()}`);

  return url.toString();
};
