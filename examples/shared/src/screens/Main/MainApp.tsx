import { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { InAppBrowserAdapter } from '@deuna/react-native-sdk';
import type { StorageAdapter } from '../../explore/domain';
import type { RootStackParamList } from '../../types';
import { useExploreStore } from '../../hooks/useExploreStore';
import { HomeScreen } from './HomeScreen';
import { EmbeddedScreen } from './EmbeddedScreen';
import { ConfigurationDrawer } from './ConfigurationDrawer';
import { PaymentSuccessScreen } from '../Result/PaymentSuccessScreen';
import { CardSavedSuccessScreen } from '../Result/CardSavedSuccessScreen';
import { WalletsScreen } from '../Wallets/WalletsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

interface MainAppProps {
  runtimeLabel?: string;
  inAppBrowserAdapter?: InAppBrowserAdapter;
  storageAdapter?: StorageAdapter;
}

const MainApp = ({
  runtimeLabel: _runtimeLabel,
  inAppBrowserAdapter,
  storageAdapter,
}: MainAppProps) => {
  const [drawerVisible, setDrawerVisible] = useState(false);

  const store = useExploreStore(inAppBrowserAdapter, storageAdapter);
  const {
    state,
    deunaSDKRef,
    openDrawer,
    updateDraft,
    discardDraft,
    applyConfiguration,
    toggleProductSelection,
    clearGeneratedOrder,
    showWidget,
    showWallets,
    showFormularios,
    loadApmOptions,
    generateFraudId,
  } = store;

  const handleOpenDrawer = () => {
    openDrawer();
    setDrawerVisible(true);
  };

  const handleDiscard = () => {
    discardDraft();
    setDrawerVisible(false);
  };

  const handleApply = (onSuccess?: () => void) => {
    applyConfiguration(() => {
      setDrawerVisible(false);
      onSuccess?.();
    });
  };

  const handleRefreshEmbedded = () => {
    deunaSDKRef.current?.close();
  };

  return (
    <>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home">
            {(props) => (
              <HomeScreen
                navigation={props.navigation}
                state={state}
                deunaSDK={deunaSDKRef.current}
                onOpenDrawer={handleOpenDrawer}
                onToggleProduct={toggleProductSelection}
                onClearOrder={clearGeneratedOrder}
                onShowWidget={showWidget}
                onShowWallets={showWallets}
                onShowFormularios={showFormularios}
                onLoadApms={loadApmOptions}
              />
            )}
          </Stack.Screen>

          <Stack.Screen name="Embedded">
            {(props) => (
              <EmbeddedScreen
                navigation={props.navigation}
                deunaSDK={deunaSDKRef.current}
                showPayButton={state.appliedConfig.hidePayButton}
                onRefresh={handleRefreshEmbedded}
              />
            )}
          </Stack.Screen>

          <Stack.Screen
            name="PaymentSuccess"
            component={PaymentSuccessScreen}
          />
          <Stack.Screen
            name="CardSavedSuccess"
            component={CardSavedSuccessScreen}
          />
          <Stack.Screen
            name="Wallets"
            component={WalletsScreen}
            options={{
              headerShown: true,
              title: 'Wallets',
              headerTintColor: '#147AE8',
              headerStyle: { backgroundColor: 'white' },
              headerTitleStyle: { fontWeight: '700', color: '#1B2B6E' },
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>

      <ConfigurationDrawer
        visible={drawerVisible}
        draftConfig={state.draftConfig}
        keyErrorMessage={state.keyErrorMessage}
        fraudIdStatusMessage={state.fraudIdStatusMessage}
        isGeneratingFraudId={state.isGeneratingFraudId}
        isApplyingConfiguration={state.isApplyingConfiguration}
        onUpdateDraft={updateDraft}
        onDiscard={handleDiscard}
        onApply={handleApply}
        onGenerateFraudId={() => generateFraudId(deunaSDKRef.current)}
      />
    </>
  );
};

export default MainApp;
