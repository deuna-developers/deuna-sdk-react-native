import {
  View,
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
  Environment,
  Mode,
} from '@deuna/react-native-sdk';
import { useState } from 'react';
import { credentials } from './utils/credentials';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PaymentSuccess } from '../PaymentSuccess';
import { SaveCardSuccess } from '../SaveCardSuccess';
import {
  AppState,
  HomeScreenProps,
  RootStackParamList,
  Widgets,
} from '../../types';
import { styles, textStyle } from './utils/styles';
import { onShowDeunaWidget } from './utils/onShowWidget';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const deunaSDK = DeunaSDK.initialize({
  publicApiKey: credentials.publicApiKey,
  environment: credentials.environment as Environment,
});

const HomeScreen = ({ navigation }: HomeScreenProps) => {
  const [state, setState] = useState<AppState>({
    orderToken: '',
    userToken: '',
    mode: Mode.MODAL,
  });

  const onShowWidget = (widget: Widgets) => {
    onShowDeunaWidget({ widget, state, navigation });
  };

  const submit = () => {
    deunaSDK.submit();
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
