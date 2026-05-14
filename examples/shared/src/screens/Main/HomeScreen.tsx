import { SafeAreaView, StyleSheet } from 'react-native';
import type { NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../types';
import type { ExploreState } from '../../hooks/useExploreStore';
import type { ApmOption } from '../../explore/domain';
import { TopBar } from './TopBar';
import { ModalScreen } from './ModalScreen';
import type { DeunaSDK } from '@deuna/react-native-sdk';

interface HomeScreenProps {
  navigation: NavigationProp<RootStackParamList, 'Home'>;
  state: ExploreState;
  deunaSDK: DeunaSDK;
  onOpenDrawer: () => void;
  onToggleProduct: (id: string) => void;
  onClearOrder: () => void;
  onShowWidget: (
    navigation: NavigationProp<RootStackParamList, 'Home'>
  ) => void;
  onShowWallets: (
    navigation: NavigationProp<RootStackParamList, 'Home'>
  ) => void;
  onShowFormularios: (
    apm: ApmOption,
    navigation: NavigationProp<RootStackParamList, 'Home'>
  ) => void;
  onLoadApms: () => void;
}

export const HomeScreen = ({
  navigation,
  state,
  deunaSDK,
  onOpenDrawer,
  onToggleProduct,
  onClearOrder,
  onShowWidget,
  onShowWallets,
  onShowFormularios,
  onLoadApms,
}: HomeScreenProps) => {
  const merchantName = state.appliedConfig.merchantName;
  const title =
    merchantName && merchantName.trim() ? merchantName : 'SDK Tester';

  return (
    <SafeAreaView style={styles.safeArea}>
      <TopBar title={title} onOpenDrawer={onOpenDrawer} />
      <ModalScreen
        state={state}
        deunaSDK={deunaSDK}
        onToggleProduct={onToggleProduct}
        onClearOrder={onClearOrder}
        onShowWidget={onShowWidget}
        onShowWallets={onShowWallets}
        onShowFormularios={onShowFormularios}
        onLoadApms={onLoadApms}
        navigation={navigation}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'white' },
});
