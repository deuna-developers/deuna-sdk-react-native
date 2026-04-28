import { DeunaSDK, DownloadType, Mode } from '@deuna/react-native-sdk';
import { AppState, HomeScreenNavigationProp, Widgets } from '../../../types';
import { config } from '../../../config';

interface OnShowWidgetProps {
  widget: Widgets;
  state: AppState;
  navigation: HomeScreenNavigationProp;
  deunaSDK: DeunaSDK;
}

export const onShowDeunaWidget = ({
  widget,
  state,
  navigation,
  deunaSDK,
}: OnShowWidgetProps) => {
  switch (widget) {
    case Widgets.PAYMENT_WIDGET:
      console.log('💡 Initializing Payment Widget with config');
      deunaSDK.initPaymentWidget({
        orderToken: state.orderToken,
        userToken: state.userToken,
        mode: state.mode,
        hidePayButton: state.mode === Mode.EMBEDDED,
        fraudCredentials: {
          RISKIFIED: {
            storeDomain: 'deuna.com',
          },
        },
        // Check the documentation to know more about the payment methods
        // https://docs.deuna.com/reference/payment-widget-react-native#par%C3%A1metros
        paymentMethods: [
          {
            paymentMethod: 'wallet',
            processors: ['mercadopago_wallet'],
            // configuration: {
            //   express: false,
            //   flowType: {
            //     type: 'twoStep',
            //   },
            // },
          },
        ],
        domain: config.domain,
        callbacks: {
          onSuccess: async (order) => {
            console.log('✅ onSuccess', order);
            await deunaSDK.close();
            console.log('👀 go to payment success screen');
            navigation.navigate('PaymentSuccess', { order });
          },
          onCardBinDetected: async (metadata) => {
            console.log('👀 onCardBinDetected', metadata);
            deunaSDK.setCustomStyle({
              theme: {
                colors: {
                  backgroundPrimary: '#d2d2d2',
                  primaryTextColor: '#000',
                  backgroundSecondary: '#fff',
                  buttonPrimaryFill: '#052590',
                  buttonPrimaryHover: '#4f0df6',
                  buttonPrimaryText: '#fff',
                  buttonPrimaryActive: '#0a3f9b',
                },
              },
            });

            const widgetState = await deunaSDK.getWidgetState();
            console.log('👀 widgetState', widgetState);
          },
          onInstallmentSelected: (metadata) => {
            console.log('👀 onInstallmentSelected', metadata);
          },
          onPaymentProcessing: () => {
            console.log('👀 onPaymentProcessing');
          },
          onError: async (error) => {
            console.log('🚨 onError', error);
            await deunaSDK.close();
          },
          onEventDispatch: (event, _) => {
            console.info('👀 onEventDispatch', event);
          },
          onClosed: (action) => {
            console.log('👋 onClosed', action);
          },
          onDownloadFile: (file) => {
            const { type, data } = file;
            console.log('👀 onDownloadFile', type, data);
            const mapper = {
              [DownloadType.URL]: () => {
                // TODO: Implement download from url
              },
              [DownloadType.BASE64]: () => {
                // TODO: Implement download from image base64
              },
            };
            mapper[type]();
          },
        },
      });
      break;

    case Widgets.NEXT_ACTION_WIDGET:
      deunaSDK.initNextAction({
        orderToken: state.orderToken,
        mode: state.mode,
        callbacks: {
          onSuccess: async (order) => {
            console.log('✅ onSuccess', order);
            await deunaSDK.close();
            navigation.navigate('PaymentSuccess', { order });
          },
          onError: (error) => {
            console.log('🚨 onError', error);
          },
        },
      });
      break;

    case Widgets.VOUCHER_WIDGET:
      deunaSDK.initVoucherWidget({
        orderToken: state.orderToken,
        mode: state.mode,
        callbacks: {
          onSuccess: async (order) => {
            console.log('✅ onSuccess', order);
            await deunaSDK.close();
            navigation.navigate('PaymentSuccess', { order });
          },
          onError: (error) => {
            console.log('🚨 onError', error);
          },
          onDownloadFile: (file) => {
            const { type, data } = file;
            console.log('👀 onDownloadFile', type, data);
            const mapper = {
              [DownloadType.URL]: () => {
                // TODO: Implement download from url
              },
              [DownloadType.BASE64]: () => {
                // TODO: Implement download from image base64
              },
            };
            mapper[type]();
          },
        },
      });
      break;
    case Widgets.VAULT_WIDGET:
      deunaSDK.initElements({
        orderToken: state.orderToken,
        userToken: state.userToken,
        hidePayButton: state.mode === 'embedded',
        userInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
        },
        mode: state.mode,
        callbacks: {
          onSuccess: async (data) => {
            console.log('✅ onSuccess', data);
            await deunaSDK.close();
            navigation.navigate('SaveCardSuccess', { data });
          },
          onError: (error) => {
            console.log('🚨 onError', error);
          },
          // onEventDispatch: (event, payload) => {
          //   console.log('👀 onEventDispatch', event, payload);
          // },
        },
      });
      break;
    default:
      break;
  }
};
