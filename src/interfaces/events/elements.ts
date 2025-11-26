export enum ElementsEventType {
  vaultClosed = 'vaultClosed',
  vaultProcessing = 'vaultProcessing',
  vaultSaveClick = 'vaultSaveClick',
  vaultStarted = 'vaultStarted',
  vaultFailed = 'vaultFailed',
  cardSuccessfullyCreated = 'cardSuccessfullyCreated',
  changeAddress = 'changeAddress',
  changeCart = 'changeCart',
  vaultSaveError = 'vaultSaveError',
  vaultSaveSuccess = 'vaultSaveSuccess',
  vaultClickRedirect3DS = 'vaultClickRedirect3DS',
  cardCreationError = 'cardCreationError',
  paymentMethodsCardIdentityNumberInitiated = 'paymentMethodsCardIdentityNumberInitiated',
  paymentMethodsCardIdentityNumberEntered = 'paymentMethodsCardIdentityNumberEntered',
  paymentMethodsCardNameInitiated = 'paymentMethodsCardNameInitiated',
  paymentMethodsCardNameEntered = 'paymentMethodsCardNameEntered',
  paymentMethodsCardSecurityCodeInitiated = 'paymentMethodsCardSecurityCodeInitiated',
  paymentMethodsCardSecurityCodeEntered = 'paymentMethodsCardSecurityCodeEntered',
  paymentMethodsCardExpirationDateEntered = 'paymentMethodsCardExpirationDateEntered',
  paymentMethodsCardExpirationDateInitiated = 'paymentMethodsCardExpirationDateInitiated',
  paymentMethodsCardNumberEntered = 'paymentMethodsCardNumberEntered',
  paymentMethodsCardNumberInitiated = 'paymentMethodsCardNumberInitiated',
}

export interface ElementsEvent {
  type: ElementsEventType;
  data: Record<string, any>;
}
