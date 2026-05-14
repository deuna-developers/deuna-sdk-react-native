import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Image,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { ApmOption } from '../../explore/domain';

interface Props {
  visible: boolean;
  apmOptions: ApmOption[];
  isLoading: boolean;
  onSelect: (apm: ApmOption) => void;
  onDismiss: () => void;
}

export const ApmPickerDialog = ({
  visible,
  apmOptions,
  isLoading,
  onSelect,
  onDismiss,
}: Props) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onDismiss}
    >
      <SafeAreaView style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Select Payment Method</Text>
          <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color="#147AE8" size="large" />
            <Text style={styles.loadingText}>Loading payment methods...</Text>
          </View>
        ) : apmOptions.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No payment methods available</Text>
          </View>
        ) : (
          <FlatList
            data={apmOptions}
            keyExtractor={(item, i) => `${item.paymentMethod}_${item.processor}_${i}`}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.row} onPress={() => onSelect(item)}>
                <Image
                  source={{ uri: item.logo }}
                  style={styles.logo}
                  resizeMode="contain"
                />
                <View style={styles.rowText}>
                  <Text style={styles.paymentMethod}>{item.paymentMethod}</Text>
                  <Text style={styles.processor}>{item.processor}</Text>
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F2F2F7' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#E0E0E0',
    backgroundColor: 'white',
  },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#1B2B6E' },
  closeBtn: { fontSize: 18, color: '#888', paddingHorizontal: 4 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: '#666' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#888', fontSize: 15 },
  list: { padding: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: 'white',
    borderRadius: 12,
    gap: 14,
  },
  logo: { width: 40, height: 40, borderRadius: 6 },
  rowText: { flex: 1 },
  paymentMethod: { fontSize: 14, fontWeight: '600', color: '#1B2B6E' },
  processor: { fontSize: 12, color: '#6E7480', marginTop: 2 },
  separator: { height: 8 },
});
