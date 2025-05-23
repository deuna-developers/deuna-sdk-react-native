import { Environment } from "../base";
import { BehaviorWidget, InitWidgetBase } from "../interfaces/initWidgetBase";

type ParamsKey = keyof UrlConfig;

export const configToQueryParams = (
  config: UrlConfig,
  searchParams: URLSearchParams
) => {
  const params: ParamsKey[] = ["styleFile", "userToken", "language"];

  params.forEach((param) => {
    if (param in config && config[param]) {
      searchParams.append(param, config[param] as string);
    }
  });
};

export const getIntegrationType = (mode?: string) => {
  const modeMap: { [key: string]: string } = {
    widget: "modal",
    modal: "modal",
    target: "embedded",
  };

  return modeMap[mode || ""] || "redirect";
};

interface PaymentMethods {
  paymentMethod: string;
  processors: string[];
}

export interface UrlConfig {
  // Instance identificator (zoid tag)
  id?: string;

  // Environment where the widget will run (optional)
  env?: Environment;

  // Order token to identify the transaction (mandatory)
  orderToken: string;

  // Only when this field is true when setCustomCss is called the upperTag will be showed
  showPromotionsBanner?: boolean;

  paymentMethods?: PaymentMethods[];

  publicApiKey: string;

  styleFile?: string;

  userToken: string;

  language: string;

  devUrl?: string;

  domain?: string;

  mode?: string;

  target?: string;

  userInfo?: InitWidgetBase["userInfo"];

  widgetExperience?: InitWidgetBase["widgetExperience"];

  behavior?: BehaviorWidget;

  sessionId: string;

  types?: ElementWidgetType[];
}

export interface ElementWidgetType {
  name: ElementWidgetTypeName;
}

type ElementWidgetTypeName = "vault" | "click_to_pay";
