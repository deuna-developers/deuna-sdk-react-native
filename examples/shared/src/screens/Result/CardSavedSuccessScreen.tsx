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

type Props = NativeStackScreenProps<RootStackParamList, 'CardSavedSuccess'>;

export const CardSavedSuccessScreen = ({ route, navigation }: Props) => {
  const data = route.params?.data ?? {};

  const id: string = data.id ?? data.card_id ?? '';
  const cardHolder: string = data.card_holder ?? data.holder_name ?? '';
  const company: string = data.brand ?? data.company ?? data.card_brand ?? '';
  const expiration: string = data.expiration ?? data.expiry ?? `${data.exp_month ?? ''}/${data.exp_year ?? ''}`.replace(/\/$/, '');
  const lastFour: string = data.last_four ?? data.last4 ?? data.last_digits ?? '';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.iconWrapper}>
          <Text style={styles.icon}>💳</Text>
        </View>

        <Text style={styles.heading}>Card saved successfully</Text>

        <View style={styles.card}>
          {id ? (
            <InfoRow label="ID" value={id} />
          ) : null}
          {cardHolder ? (
            <InfoRow label="Card Holder" value={cardHolder} />
          ) : null}
          {company ? (
            <InfoRow label="Company" value={company} />
          ) : null}
          {expiration && expiration !== '/' ? (
            <InfoRow label="Expiration" value={expiration} />
          ) : null}
          {lastFour ? (
            <InfoRow label="Last Four" value={`•••• ${lastFour}`} />
          ) : null}

          {!id && !cardHolder && !company && !lastFour ? (
            <Text style={styles.rawJson}>{JSON.stringify(data, null, 2)}</Text>
          ) : null}
        </View>

        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Go back!</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  label: { fontSize: 13, color: '#6E7480', flex: 1 },
  value: { fontSize: 13, color: '#1B2B6E', fontWeight: '600', flex: 2, textAlign: 'right' },
});

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F2F2F7' },
  container: { padding: 20, alignItems: 'center', gap: 16, paddingBottom: 40 },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  icon: { fontSize: 32 },
  heading: { fontSize: 24, fontWeight: '800', color: '#1B2B6E', textAlign: 'center' },
  card: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
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
