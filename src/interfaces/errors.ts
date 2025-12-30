export const initializationError = {
  type: 'INITIALIZATION_ERROR',
  code: 'INITIALIZATION_ERROR',
  message: 'Failed to initialize the widget',
};

export const submitError = {
  status: 'error',
  code: 'error',
  message: 'Error al procesar la solicitud.',
};

export enum PaymentErrorType {
  noInternetConnection = 'noInternetConnection',
  invalidOrderToken = 'invalidOrderToken',
  initializationFailed = 'initializationFailed',
  errorWhileLoadingTheURL = 'errorWhileLoadingTheURL',
  orderNotFound = 'orderNotFound',
  orderCouldNotBeRetrieved = 'orderCouldNotBeRetrieved',
  paymentError = 'paymentError',
  userError = 'userError',
  unknownError = 'unknownError',
}

export enum ElementsErrorType {
  noInternetConnection = 'noInternetConnection',
  initializationFailed = 'initializationFailed',
  errorWhileLoadingTheURL = 'errorWhileLoadingTheURL',
  userError = 'userError',
  invalidUserToken = 'invalidUserToken',
  unknownError = 'unknownError',
  vaultSaveError = 'vaultSaveError',
  vaultFailed = 'vaultFailed',
}
