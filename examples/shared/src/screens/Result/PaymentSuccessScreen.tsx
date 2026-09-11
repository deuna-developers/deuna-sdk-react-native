import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'PaymentSuccess'>;

export const PaymentSuccessScreen = ({ route, navigation }: Props) => {
  const order = route.params?.order ?? {};
  const orderId: string = order.order_id ?? order.id ?? '';
  const items: any[] = order.items ?? order.order?.items ?? [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.iconWrapper}>
          <Text style={styles.icon}>✓</Text>
        </View>

        <Text style={styles.heading}>Payment Successful</Text>

        {orderId ? (
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>ORDER ID</Text>
            <Text style={styles.infoValue}>{orderId}</Text>
          </View>
        ) : null}

        {items.length > 0 ? (
          <View style={styles.itemsCard}>
            <Text style={styles.itemsTitle}>Items</Text>
            {items.map((item: any, i: number) => (
              <View key={i} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name ?? item.id ?? `Item ${i + 1}`}</Text>
                  {item.options ? (
                    <Text style={styles.itemOptions}>{JSON.stringify(item.options)}</Text>
                  ) : null}
                </View>
                <Text style={styles.itemPrice}>
                  {item.total_amount != null
                    ? `$${(item.total_amount / 100).toFixed(2)}`
                    : ''}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {items.length === 0 && !orderId ? (
          <View style={styles.rawCard}>
            <Text style={styles.rawJson}>{JSON.stringify(order, null, 2)}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Go back!</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F2F2F7' },
  container: { padding: 20, alignItems: 'center', gap: 16, paddingBottom: 40 },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  icon: { color: 'white', fontSize: 36, fontWeight: '700' },
  heading: { fontSize: 26, fontWeight: '800', color: '#1B2B6E', textAlign: 'center' },
  infoCard: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  infoLabel: {
    fontSize: 11,
    color: '#6E7480',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  infoValue: { fontSize: 14, color: '#1B2B6E', fontWeight: '600' },
  itemsCard: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  itemsTitle: { fontSize: 16, fontWeight: '700', color: '#1B2B6E', marginBottom: 4 },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, color: '#333', fontWeight: '500' },
  itemOptions: { fontSize: 11, color: '#888', marginTop: 2 },
  itemPrice: { fontSize: 14, color: '#1B2B6E', fontWeight: '600' },
  rawCard: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
  },
  rawJson: { fontSize: 11, color: '#555', fontFamily: 'monospace' },
  backBtn: {
    marginTop: 8,
    backgroundColor: '#147AE8',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  backBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },
});
