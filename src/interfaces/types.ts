import { BehaviorWidget } from '../types';

export interface WidgetConfig {
  behavior?: BehaviorWidget;
  orderToken?: string;
  userToken?: string;
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
