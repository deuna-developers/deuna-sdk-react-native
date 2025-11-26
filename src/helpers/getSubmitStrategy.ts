import { DeunaSDK } from '../DeunaSDK';
import { TWO_STEP_FLOW } from '../interfaces/constants';
import { PayPalSubmitStrategy, SubmitStrategy } from './SubmitStrategy';

export const getSubmitStrategy = async (
  deunaSDK: DeunaSDK
): Promise<SubmitStrategy | null> => {
  const selectedPaymentMethod = await deunaSDK.getSelectedPaymentMethod();
  if (!selectedPaymentMethod) {
    return null;
  }

  const { widgetConfig } = deunaSDK.deunaWidgetManager.controller;

  const processorName = selectedPaymentMethod.processor_name as string;

  const configFlowType = selectedPaymentMethod.configuration?.flowType?.type;
  const behaviorFlowType =
    widgetConfig.behavior?.paymentMethods?.flowType?.type;

  const isTwoStepFlow =
    configFlowType === TWO_STEP_FLOW ||
    (!configFlowType && behaviorFlowType === TWO_STEP_FLOW);

  if (isTwoStepFlow && processorName === 'paypal_wallet') {
    return new PayPalSubmitStrategy(
      {
        publicApiKey: deunaSDK.config.publicApiKey,
        environment: deunaSDK.config.environment ?? 'production',
        orderToken: widgetConfig.orderToken,
        userToken: widgetConfig.userToken,
      },
      () => {
        if (deunaSDK.submitStrategy) {
          deunaSDK.submitStrategy = null;
          deunaSDK.notifyListeners();
        }
      }
    );
  }
  return null;
};
