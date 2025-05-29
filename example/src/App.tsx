/* eslint-disable react-native/no-inline-styles */
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  FlatList,
  SafeAreaView,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import {
  DeunaSDK,
  DeunaWidget,
  DownloadType,
  Environment,
  Mode,
} from '@deuna/react-native-sdk';
import { useState } from 'react';
import { credentials } from './credentials';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PaymentSuccess } from './PaymentSuccess';
import { SaveCardSuccess } from './SaveCardSuccess';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator<RootStackParamList>();

export type RootStackParamList = {
  Home: undefined;
  PaymentSuccess: { order: Record<string, any> };
  SaveCardSuccess: { data: Record<string, any> };
};

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Home'
>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

const deunaSDK = DeunaSDK.initialize({
  publicApiKey: credentials.publicApiKey,
  environment: credentials.environment as Environment,
});

enum Widgets {
  PAYMENT_WIDGET = 'Payment Widget',
  NEXT_ACTION_WIDGET = 'Next Action Widget',
  VOUCHER_WIDGET = 'Voucher Widget',
  VAULT_WIDGET = 'Vault Widget',
}

interface AppState {
  orderToken: string;
  userToken: string;
  mode: Mode;
}

const HomeScreen = ({ navigation }: HomeScreenProps) => {
  const [state, setState] = useState<AppState>({
    orderToken: '',
    userToken: '',
    mode: Mode.MODAL,
  });

  const onShowWidget = (widget: Widgets) => {
    switch (widget) {
      case Widgets.PAYMENT_WIDGET:
        deunaSDK.initPaymentWidget({
          orderToken: state.orderToken,
          userToken: state.userToken,
          mode: state.mode,
          hidePayButton: state.mode === Mode.EMBEDDED,
          // Check the documentation to know more about the payment methods
          // https://docs.deuna.com/reference/payment-widget-react-native#par%C3%A1metros
          // paymentMethods: [
          //   {
          //     paymentMethod: 'wallet',
          //     processors: ['paypal_wallet'],
          //     configuration: {
          //       express: false,
          //       flowType: {
          //         type: 'twoStep',
          //       },
          //     },
          //   },
          // ],
          callbacks: {
            onSuccess: async (order) => {
              console.log('✅ onSuccess', order);
              await deunaSDK.close();
              console.log('go to payment success screen');
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
            onError: (error) => {
              console.log('🚨 onError', error);
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

  const submit = () => {
    deunaSDK.submit();
    // const isValid = await deunaSDK.isValid();
    // console.log('👀 isValid', isValid);

    // if (isValid) {
    //   deunaSDK.submit();
    // }
  };

  const getSessionId = async () => {
    const sessionId = await deunaSDK.getSessionId({
      RISKIFIED: {
        storeDomain: 'volaris.com',
      },
    });
    Alert.alert(
      sessionId.length > 0 ? 'Session ID' : 'No session ID',
      sessionId
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.embeddedContainer}>
          <DeunaWidget instance={deunaSDK} />
        </View>
        <View style={styles.embeddedSwitch}>
          <Text>Embedded</Text>
          <Switch
            value={state.mode === Mode.EMBEDDED}
            onValueChange={(value) =>
              setState({ ...state, mode: value ? Mode.EMBEDDED : Mode.MODAL })
            }
          />
          {state.mode === Mode.EMBEDDED && (
            <TouchableOpacity style={styles.button} onPress={submit}>
              <Text style={textStyle}>Pay</Text>
            </TouchableOpacity>
          )}
        </View>

        <TextInput
          placeholder="ORDER TOKEN"
          style={styles.input}
          value={state.orderToken}
          onChangeText={(text) => setState({ ...state, orderToken: text })}
        />
        <TextInput
          placeholder="USER TOKEN"
          style={styles.input}
          value={state.userToken}
          onChangeText={(text) => setState({ ...state, userToken: text })}
        />
        <FlatList
          data={Object.values(Widgets)}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => onShowWidget(item)}
              style={styles.button}
            >
              <Text style={textStyle}>{item}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item}
          numColumns={2}
          columnWrapperStyle={styles.row}
          scrollEnabled={false}
          style={styles.flatList}
        />
        <TouchableOpacity onPress={getSessionId} style={styles.sessionIdButton}>
          <Text style={textStyle}>Get Session ID</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="PaymentSuccess" component={PaymentSuccess} />
        <Stack.Screen name="SaveCardSuccess" component={SaveCardSuccess} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;

const textStyle = { color: 'white', textAlign: 'center' as const };

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'white' },
  container: { padding: 15, flex: 1 },
  row: { justifyContent: 'space-between' },
  flatList: { flexGrow: 0, marginTop: 10 },
  embeddedContainer: { flex: 1, backgroundColor: '#d2d2d2', borderRadius: 10 },
  embeddedSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 10,
    marginBottom: 10,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 5,
    padding: 10,
    marginTop: 10,
  },
  button: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 5,
    margin: 4,
    flex: 1,
  },
  sessionIdButton: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 5,
    margin: 4,
  },
});
