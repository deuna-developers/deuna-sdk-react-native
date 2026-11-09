import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import type { NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../types';
import type {
  ExploreState,
  ExtendedProduct,
} from '../../hooks/useExploreStore';
import type { ApmOption } from '../../explore/domain';
import { formatPrice } from '../../explore/ProductCatalog';
import { ApmPickerDialog } from './ApmPickerDialog';
import { DeunaWidget } from '@deuna/react-native-sdk';
import type { DeunaSDK } from '@deuna/react-native-sdk';

const COLORS = {
  brandBlue: '#147AE8',
  navyBlue: '#1B2B6E',
  mediumBlue: '#2563EB',
  lightBlue: '#3B82F6',
  screenBackground: '#F2F2F7',
  cardBackground: '#E5E5EA',
  labelGray: '#6E7480',
  accentBlue: '#147AE8',
};

// ─── ProductCard ──────────────────────────────────────────────────────────────

function ProductCard({
  product,
  isSelected,
  onToggle,
}: {
  product: ExtendedProduct;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={productStyles.card}>
      <View style={productStyles.imageWrapper}>
        <Image
          source={{ uri: product.image }}
          style={productStyles.image}
          resizeMode="cover"
        />
        {/* Price chip top-left */}
        <View style={productStyles.priceChip}>
          <Text style={productStyles.priceText}>{product.displayPrice}</Text>
        </View>
        {/* Check chip top-right when selected */}
        {isSelected && (
          <View style={productStyles.checkChip}>
            <Text style={productStyles.checkText}>✓</Text>
          </View>
        )}
      </View>
      <Text style={productStyles.name} numberOfLines={2}>
        {product.name}
      </Text>
      <TouchableOpacity
        style={[productStyles.btn, isSelected && productStyles.btnRemove]}
        onPress={onToggle}
      >
        <Text style={productStyles.btnText}>
          {isSelected ? 'Remove' : 'Add'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const productStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    margin: 4,
  },
  imageWrapper: { position: 'relative' },
  image: { height: 110, width: '100%' },
  priceChip: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  priceText: { color: 'white', fontSize: 11, fontWeight: '600' },
  checkChip: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#22C55E',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: { color: 'white', fontSize: 11, fontWeight: '700' },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1B2B6E',
    padding: 8,
    paddingBottom: 4,
  },
  btn: {
    margin: 8,
    marginTop: 4,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#147AE8',
    alignItems: 'center',
  },
  btnRemove: { backgroundColor: '#EF4444' },
  btnText: { color: 'white', fontSize: 12, fontWeight: '700' },
});

// ─── CartSummaryCard ──────────────────────────────────────────────────────────

function CartSummaryCard({
  products,
  selectedIds,
  currencyCode,
}: {
  products: ExtendedProduct[];
  selectedIds: Set<string>;
  currencyCode: string;
}) {
  const selected = products.filter((p) => selectedIds.has(p.id));
  const total = selected.reduce((sum, p) => sum + p.priceCents, 0);
  const totalDisplay =
    selected.length > 0
      ? formatPrice(total, currencyCode)
      : formatPrice(0, currencyCode);

  return (
    <View style={cartStyles.card}>
      <Text style={cartStyles.header}>Cart ({selected.length} selected)</Text>
      <View style={cartStyles.row}>
        <Text style={cartStyles.label}>{selected.length} Items Selected</Text>
      </View>
      <View style={cartStyles.divider} />
      <View style={cartStyles.row}>
        <Text style={cartStyles.label}>Subtotal</Text>
        <Text style={cartStyles.value}>{totalDisplay}</Text>
      </View>
      <View style={cartStyles.row}>
        <Text style={cartStyles.totalLabel}>Total</Text>
        <Text style={cartStyles.totalValue}>{totalDisplay}</Text>
      </View>
    </View>
  );
}

const cartStyles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  header: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1B2B6E',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E5EA',
    marginVertical: 4,
  },
  label: { fontSize: 13, color: '#6E7480' },
  value: { fontSize: 13, color: '#333' },
  totalLabel: { fontSize: 14, fontWeight: '600', color: '#1B2B6E' },
  totalValue: { fontSize: 15, fontWeight: '700', color: '#147AE8' },
});

// ─── OrderCreatedCard ─────────────────────────────────────────────────────────

function OrderCreatedCard({
  orderToken,
  onClear,
}: {
  orderToken: string;
  onClear: () => void;
}) {
  return (
    <View style={orderCardStyles.card}>
      <View style={orderCardStyles.header}>
        <Text style={orderCardStyles.title}>Order Created</Text>
        <TouchableOpacity
          onPress={onClear}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Text style={orderCardStyles.clearIcon}>✕</Text>
        </TouchableOpacity>
      </View>
      <Text style={orderCardStyles.tokenLabel}>Order Token</Text>
      <Text style={orderCardStyles.token} numberOfLines={3}>
        {orderToken}
      </Text>
    </View>
  );
}

const orderCardStyles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 15, fontWeight: '700', color: '#22C55E' },
  clearIcon: { fontSize: 16, color: '#888' },
  tokenLabel: { fontSize: 11, color: '#6E7480', textTransform: 'uppercase' },
  token: { fontSize: 12, color: '#333', fontFamily: 'monospace' },
});

// ─── ModalScreen ──────────────────────────────────────────────────────────────

interface ModalScreenProps {
  state: ExploreState;
  deunaSDK: DeunaSDK;
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
  navigation: NavigationProp<RootStackParamList, 'Home'>;
}

export const ModalScreen = ({
  state,
  deunaSDK,
  onToggleProduct,
  onClearOrder,
  onShowWidget,
  onShowWallets,
  onShowFormularios,
  onLoadApms,
  navigation,
}: ModalScreenProps) => {
  const [apmPickerVisible, setApmPickerVisible] = useState(false);

  const handleFormulariosPress = useCallback(() => {
    if (state.apmOptions.length === 0) {
      onLoadApms();
    }
    setApmPickerVisible(true);
  }, [state.apmOptions.length, onLoadApms]);

  const handleApmSelect = useCallback(
    (apm: ApmOption) => {
      setApmPickerVisible(false);
      onShowFormularios(apm, navigation);
    },
    [onShowFormularios, navigation]
  );

  const hasOrderToken =
    state.useManualOrderTokenFlow || state.generatedOrderToken !== null;

  // Layout products in rows of 2
  const productRows: ExtendedProduct[][] = [];
  for (let i = 0; i < state.products.length; i += 2) {
    productRows.push(state.products.slice(i, i + 2));
  }

  return (
    <>
      <ScrollView
        style={modalStyles.scroll}
        contentContainerStyle={modalStyles.content}
      >
        {hasOrderToken ? (
          // ── Order Created Flow ───────────────────────────────────────────────
          <OrderCreatedCard
            orderToken={
              state.appliedConfig.orderToken || state.generatedOrderToken || ''
            }
            onClear={onClearOrder}
          />
        ) : (
          // ── Product Selection Flow ───────────────────────────────────────────
          <View style={modalStyles.productsSection}>
            <Text style={modalStyles.sectionTitle}>Available Products</Text>
            {productRows.map((row, ri) => (
              <View key={ri} style={modalStyles.productRow}>
                {row.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isSelected={state.selectedProductIds.has(product.id)}
                    onToggle={() => onToggleProduct(product.id)}
                  />
                ))}
                {/* Spacer if odd row */}
                {row.length === 1 && <View style={{ flex: 1, margin: 4 }} />}
              </View>
            ))}
            <CartSummaryCard
              products={state.products}
              selectedIds={state.selectedProductIds}
              currencyCode={state.appliedConfig.merchantCurrencyCode || 'USD'}
            />
          </View>
        )}

        {/* Error banner */}
        {state.modalStatusMessage ? (
          <View style={modalStyles.errorBanner}>
            <Text style={modalStyles.errorBannerText}>
              {state.modalStatusMessage}
            </Text>
          </View>
        ) : null}

        {/* Action Buttons */}
        <View style={modalStyles.buttons}>
          <TouchableOpacity
            style={[modalStyles.btn, { backgroundColor: COLORS.navyBlue }]}
            onPress={() => onShowWidget(navigation)}
            disabled={state.isLaunchingWidget}
          >
            {state.isLaunchingWidget ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={modalStyles.btnText}>Show Widget</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[modalStyles.btn, { backgroundColor: COLORS.mediumBlue }]}
            onPress={() => onShowWallets(navigation)}
            disabled={state.isLaunchingWallets}
          >
            {state.isLaunchingWallets ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={modalStyles.btnText}>Wallets</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[modalStyles.btn, { backgroundColor: COLORS.lightBlue }]}
            onPress={handleFormulariosPress}
            disabled={state.isLaunchingFormularios}
          >
            {state.isLaunchingFormularios ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={modalStyles.btnText}>Formularios</Text>
            )}
          </TouchableOpacity>
        </View>

        <ApmPickerDialog
          visible={apmPickerVisible}
          apmOptions={state.apmOptions}
          isLoading={state.isLoadingApms}
          onSelect={handleApmSelect}
          onDismiss={() => setApmPickerVisible(false)}
        />
      </ScrollView>

      <DeunaWidget key={state.sdkInstanceId} instance={deunaSDK} />
    </>
  );
};

const modalStyles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F2F2F7' },
  content: { padding: 12, gap: 12, paddingBottom: 32 },
  productsSection: { gap: 12 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B2B6E',
    paddingHorizontal: 4,
  },
  productRow: { flexDirection: 'row' },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorBannerText: { color: '#B91C1C', fontSize: 13 },
  buttons: { gap: 10 },
  btn: {
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnText: { color: 'white', fontWeight: '700', fontSize: 15 },
});
