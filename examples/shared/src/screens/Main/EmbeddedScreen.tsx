import { SafeAreaView, View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import type { NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../types';
import { DeunaWidget } from '@deuna/react-native-sdk';
import type { DeunaSDK } from '@deuna/react-native-sdk';
import { TopBar } from './TopBar';

interface EmbeddedScreenProps {
  navigation: NavigationProp<RootStackParamList, 'Embedded'>;
  deunaSDK: DeunaSDK;
  showPayButton: boolean;
  onRefresh: () => void;
}

export const EmbeddedScreen = ({
  navigation,
  deunaSDK,
  showPayButton,
  onRefresh,
}: EmbeddedScreenProps) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <TopBar
        title="Checkout"
        onOpenDrawer={() => navigation.goBack()}
        showRefresh
        onRefresh={onRefresh}
      />
      <View style={styles.widgetWrapper}>
        <DeunaWidget instance={deunaSDK} />
      </View>
      {showPayButton && (
        <TouchableOpacity style={styles.payBtn} onPress={() => deunaSDK.submit()}>
          <Text style={styles.payBtnText}>Pay Now</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'white' },
  widgetWrapper: {
    flex: 1,
    margin: 12,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
  },
  payBtn: {
    margin: 12,
    marginTop: 0,
    backgroundColor: '#1B2B6E',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  payBtnText: { color: 'white', fontWeight: '700', fontSize: 15 },
});
