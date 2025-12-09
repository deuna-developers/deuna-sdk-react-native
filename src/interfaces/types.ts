import { DeunaSDK } from '../DeunaSDK';
import { BehaviorWidget } from '../types';
import { InitFraudProvidersProps } from '../types/fraudProviders';

export interface WidgetConfig {
  behavior?: BehaviorWidget;
  orderToken?: string;
  userToken?: string;
  sdkInstance?: DeunaSDK;
  fraudCredentials?: Partial<InitFraudProvidersProps>;
}

export enum Mode {
  MODAL = 'modal',
  EMBEDDED = 'embedded',
}

export enum DownloadType {
  URL = 'url',
  BASE64 = 'base64',
}

export type OnDownloadFile = {
  onDownloadFile?: (data: { type: DownloadType; data: string }) => void;
};
