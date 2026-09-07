import { Environment } from "../base";

export const PLATFORM_DEFAULT = "custom";

export const WIDGET_URLS: Record<Environment, string> = {
  production: "https://pay.deuna.io",
  sandbox: "https://pay.sandbox.deuna.io",
  staging: "https://pay.stg.deuna.com",
  develop: "https://pay.dev.deuna.io",
};

export const ELEMENTS_URLS: Record<Environment, string> = {
  production: "https://elements.deuna.com",
  sandbox: "https://elements.sandbox.deuna.io",
  staging: "https://elements.stg.deuna.io",
  develop: "https://elements.dev.deuna.io",
};
