import { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  Clipboard,
} from 'react-native';
import {
  DeunaSDK,
  type WalletProvider,
} from '@deuna/react-native-sdk';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Wallets'>;

type ResultState =
  | { kind: 'success'; data: Record<string, unknown> }
  | { kind: 'error'; code: string; message: string }
  | { kind: 'closed'; action: string };

const WALLET_LABELS: Record<WalletProvider, string> = {
  apple_pay: 'Apple Pay',
  google_pay: 'Google Pay',
};

const COLORS = {
  brandBlue: '#147AE8',
  navyBlue: '#1B2B6E',
  screenBackground: '#F2F2F7',
};

export const WalletsScreen = ({ route }: Props) => {
  const passedOrderToken = route.params?.orderToken ?? '';
  const passedPublicApiKey = route.params?.publicApiKey ?? '';
  const passedEnvironment = (route.params?.environment ?? 'sandbox') as any;
  const userInfo = (route.params?.userInfoEmail || route.params?.userInfoFirstName || route.params?.userInfoLastName)
    ? {
        firstName: route.params?.userInfoFirstName || undefined,
        lastName: route.params?.userInfoLastName || undefined,
        email: route.params?.userInfoEmail || undefined,
      }
    : undefined;
  const [loading, setLoading] = useState(false);
  const [availableWallets, setAvailableWallets] = useState<WalletProvider[]>([]);
  const [result, setResult] = useState<ResultState | null>(null);
  const [activeWallet, setActiveWallet] = useState<WalletProvider | null>(null);

  const deunaSDK = useMemo(
    () =>
      DeunaSDK.initialize({
        publicApiKey: passedPublicApiKey,
        environment: passedEnvironment,
      }),
    []
  );

  const handleGetWallets = async () => {
    if (!passedOrderToken) {
      setResult({ kind: 'error', code: 'NO_TOKEN', message: 'No order token provided. Go back and create an order first.' });
      return;
    }
    setLoading(true);
    setAvailableWallets([]);
    setResult(null);
    try {
      const wallets = await deunaSDK.getWalletsAvailable({ orderToken: passedOrderToken });
      setAvailableWallets(wallets);
      if (wallets.length === 0) {
        setResult({ kind: 'error', code: 'NONE', message: 'No wallets available on this device' });
      }
    } catch (e: any) {
      setResult({ kind: 'error', code: 'FETCH_ERROR', message: e?.message ?? String(e) });
    } finally {
      setLoading(false);
    }
  };

  const handleInitWallet = (walletProvider: WalletProvider) => {
    setActiveWallet(walletProvider);
    setResult(null);

    const typeName = walletProvider === 'apple_pay' ? 'APPLE_PAY' : 'GOOGLE_PAY';
    deunaSDK.initElements({
      orderToken: passedOrderToken,
      userInfo,
      types: [{ name: typeName }],
      callbacks: {
        onSuccess: (data) => {
          setResult({ kind: 'success', data });
          setActiveWallet(null);
        },
        onError: (err) => {
          setResult({ kind: 'error', code: err.metadata.code, message: err.metadata.message });
          setActiveWallet(null);
        },
        onClosed: (action) => {
          setResult({ kind: 'closed', action });
          setActiveWallet(null);
        },
      },
    });
  };

  const copyResult = () => {
    if (result?.kind === 'success') {
      Clipboard.setString(JSON.stringify(result.data, null, 2));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Order token display */}
        {passedOrderToken ? (
          <View style={styles.tokenCard}>
            <Text style={styles.tokenLabel}>ORDER TOKEN</Text>
            <Text style={styles.tokenValue} numberOfLines={2}>{passedOrderToken}</Text>
          </View>
        ) : (
          <View style={styles.warningCard}>
            <Text style={styles.warningText}>No order token available. Go back and create an order first.</Text>
          </View>
        )}

        {/* Get Wallets Button */}
        <TouchableOpacity
          style={[styles.primaryButton, !passedOrderToken && styles.buttonDisabled]}
          onPress={handleGetWallets}
          disabled={loading || !passedOrderToken}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Get Wallets Available</Text>
          )}
        </TouchableOpacity>

        {/* Available Wallet Buttons */}
        {availableWallets.length > 0 && (
          <View style={styles.walletsContainer}>
            <Text style={styles.sectionTitle}>Available Wallets</Text>
            {availableWallets.map((wallet) => (
              <TouchableOpacity
                key={wallet}
                style={[
                  styles.walletButton,
                  activeWallet === wallet && styles.walletButtonActive,
                ]}
                onPress={() => handleInitWallet(wallet)}
                disabled={activeWallet !== null}
              >
                {activeWallet === wallet ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>
                    {WALLET_LABELS[wallet] ?? wallet}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Result Card */}
        {result && (
          <View
            style={[
              styles.resultCard,
              result.kind === 'success' && styles.resultSuccess,
              result.kind === 'error' && styles.resultError,
              result.kind === 'closed' && styles.resultClosed,
            ]}
          >
            {result.kind === 'success' && (
              <>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultTitle}>Payment Successful</Text>
                  <TouchableOpacity onPress={copyResult} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
                    <Text style={styles.copyBtn}>Copy</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.resultBody}>
                  {JSON.stringify(result.data, null, 2)}
                </Text>
              </>
            )}
            {result.kind === 'error' && (
              <>
                <Text style={styles.resultTitle}>Error: {result.code}</Text>
                <Text style={styles.resultBody}>{result.message}</Text>
              </>
            )}
            {result.kind === 'closed' && (
              <>
                <Text style={styles.resultTitle}>Sheet Closed</Text>
                <Text style={styles.resultBody}>action: {result.action}</Text>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.screenBackground },
  container: { padding: 16, gap: 14, paddingBottom: 32 },
  tokenCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  tokenLabel: {
    fontSize: 11,
    color: '#6E7480',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  tokenValue: { fontSize: 13, color: '#1B2B6E', fontFamily: 'monospace' },
  warningCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  warningText: { color: '#92400E', fontSize: 14 },
  primaryButton: {
    backgroundColor: COLORS.brandBlue,
    padding: 16,
    borderRadius: 24,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: 'white', fontWeight: '600', textAlign: 'center', fontSize: 15 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1B2B6E', marginBottom: 4 },
  walletsContainer: { gap: 10 },
  walletButton: {
    backgroundColor: '#000000',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  walletButtonActive: { opacity: 0.7 },
  resultCard: { borderRadius: 12, padding: 14, gap: 8 },
  resultSuccess: { backgroundColor: '#DCFCE7', borderWidth: 1, borderColor: '#22C55E' },
  resultError: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FCA5A5' },
  resultClosed: { backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FCD34D' },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultTitle: { fontWeight: '700', fontSize: 15, color: '#1B2B6E' },
  copyBtn: { color: '#147AE8', fontSize: 13, fontWeight: '600' },
  resultBody: { fontFamily: 'monospace', fontSize: 12, color: '#333' },
});
