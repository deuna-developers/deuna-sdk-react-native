import { Env } from "../envs";

export type Providers =
  | "CLEARSALE"
  | "CLEARSALE-BRASIL"
  | "CYBERSOURCE"
  | "MERCADOPAGO"
  | "SIFT"
  | "SIGNIFYD"
  | "STRIPE"
  | "KOUNT"
  | "KONDUTO"
  | "OPENPAY"
  | "RISKIFIED";

export interface FraudProviderParams<T> {
  sessionId: string;
  env: Env;
  params: T;
}

export type FraudProvider<T, Provider extends Providers> = (
  params: FraudProviderParams<T>
) => Promise<
  | {
      [key in Provider]?: string | string[];
    }
  | undefined
>;

export interface RiskifiedParams {
  storeDomain: string;
}

export interface CyberSourceParams {
  orgId: string;
  merchantId: string;
}

export interface SignifydParams {
  account: string;
  email: string;
}

export interface SiftParams {
  accountId: string;
  restApiKey: string;
}

export interface ClearSaleParams {
  clientId: string;
}

export interface StripeParams {
  apiKey: string;
}

export interface KountParams {
  dataCollectorUrl: string;
  merchantId: string; // m = six digit Merchant ID number issued by Kount
  clientId: string;
  environment: string;
  version: string;
  isSinglePageApp: boolean;
}

export interface KoinParams {
  id: string;
  orgId: string;
}

export interface KondutoParams {
  publicKey: string;
}

export interface OpenPayParams {
  merchantId: string;
  publicApiKey: string;
  sandboxMode?: boolean;
}

export type FraudProvidersObject = {
  [key in Providers]: FraudProvider<any, key>;
};

export type InitFraudProvidersProps = {
  CLEARSALE: ClearSaleParams;
  "CLEARSALE-BRASIL": ClearSaleParams;
  OPENPAY: OpenPayParams;
  CYBERSOURCE: CyberSourceParams;
  MERCADOPAGO: {};
  SIFT: SiftParams;
  SIGNIFYD: SignifydParams;
  STRIPE: StripeParams;
  KOUNT: KountParams;
  KONDUTO: KondutoParams;
  RISKIFIED: RiskifiedParams;
};
