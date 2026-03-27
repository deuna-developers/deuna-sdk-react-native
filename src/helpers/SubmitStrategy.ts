import { DeunaSDK } from '../DeunaSDK';
import { Mode } from '../interfaces';
import { Environment, SubmitResult } from '../types';

export type SubmitStrategyType = 'PayPal';

export type SubmitStrategyConfig = {
  publicApiKey: string;
  environment: Environment;
  orderToken?: string;
  userToken?: string;
};

export abstract class SubmitStrategy {
  abstract deunaSDK: DeunaSDK;
  constructor(
    readonly config: SubmitStrategyConfig,
    readonly type: SubmitStrategyType
  ) {}

  abstract submit(): Promise<SubmitResult>;
}

export class PayPalSubmitStrategy extends SubmitStrategy {
  deunaSDK: DeunaSDK;

  constructor(
    config: SubmitStrategyConfig,
    readonly onDestroyed: () => void
  ) {
    super(config, 'PayPal');
    this.deunaSDK = new DeunaSDK(
      {
        publicApiKey: this.config.publicApiKey,
        environment: this.config.environment,
      },
      this.onDestroyed
    );
  }

  async submit(): Promise<SubmitResult> {
    await this.deunaSDK.initPaymentWidget({
      mode: Mode.MODAL,
      orderToken: this.config.orderToken ?? '',
      userToken: this.config.userToken,
      paymentMethods: [
        {
          paymentMethod: 'wallet',
          processors: ['paypal_wallet'],
          configuration: {
            express: true,
            flowType: {
              type: 'twoStep',
            },
          },
        },
      ],
      callbacks: {},
    });

    return {
      status: 'success',
      code: 'success',
      message: 'Payment submitted successfully',
    };
  }
}
