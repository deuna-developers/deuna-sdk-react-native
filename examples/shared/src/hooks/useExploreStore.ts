import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { DeunaSDK, Mode, DownloadType } from '@deuna/react-native-sdk';
import type { InAppBrowserAdapter } from '@deuna/react-native-sdk';
import {
  IntegrationConfig,
  ApmOption,
  StorageAdapter,
  defaultIntegrationConfig,
  toSdkEnvironment,
} from '../explore/domain';
import { fetchMerchantProfile } from '../explore/MerchantService';
import { createOrderToken } from '../explore/OrderTokenService';
import { fetchApmOptions } from '../explore/ApmRepository';
import { PRODUCTS, getProductsForCurrency } from '../explore/ProductCatalog';
import type { NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ExtendedProduct = (typeof PRODUCTS)[number] & {
  priceCents: number;
  displayPrice: string;
};

export interface ExploreState {
  appliedConfig: IntegrationConfig;
  draftConfig: IntegrationConfig;
  products: ExtendedProduct[];
  selectedProductIds: Set<string>;
  isApplyingConfiguration: boolean;
  isLaunchingWidget: boolean;
  isLaunchingWallets: boolean;
  isLaunchingFormularios: boolean;
  isShowingEmbeddedWidget: boolean;
  keyErrorMessage: string | null;
  modalStatusMessage: string | null;
  fraudIdStatusMessage: string | null;
  isGeneratingFraudId: boolean;
  useManualOrderTokenFlow: boolean;
  generatedOrderToken: string | null;
  apmOptions: ApmOption[];
  isLoadingApms: boolean;
  sdkInstanceId: number;
}

function makeInitialState(): ExploreState {
  const initialProducts = getProductsForCurrency(
    defaultIntegrationConfig.merchantCurrencyCode
  ) as ExtendedProduct[];

  return {
    appliedConfig: defaultIntegrationConfig,
    draftConfig: defaultIntegrationConfig,
    products: initialProducts,
    selectedProductIds: new Set(),
    isApplyingConfiguration: false,
    isLaunchingWidget: false,
    isLaunchingWallets: false,
    isLaunchingFormularios: false,
    isShowingEmbeddedWidget: false,
    keyErrorMessage: null,
    modalStatusMessage: null,
    fraudIdStatusMessage: null,
    isGeneratingFraudId: false,
    useManualOrderTokenFlow: false,
    generatedOrderToken: null,
    apmOptions: [],
    isLoadingApms: false,
    sdkInstanceId: 0,
  };
}

function parseFraudProvidersJson(
  jsonStr?: string
): Record<string, any> | undefined {
  if (!jsonStr || !jsonStr.trim()) return undefined;
  try {
    return JSON.parse(jsonStr);
  } catch {
    return undefined;
  }
}

function prewarmFraudProviders(
  sdk: DeunaSDK,
  fraudProvidersJson?: string
): void {
  const providers = parseFraudProvidersJson(fraudProvidersJson);
  if (providers && Object.keys(providers).length > 0) {
    sdk.initializeFraudProviders(providers).catch(() => {});
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useExploreStore(
  inAppBrowserAdapter?: InAppBrowserAdapter,
  storageAdapter?: StorageAdapter
) {
  const deunaSDKRef = useRef<DeunaSDK>(
    DeunaSDK.initialize({
      publicApiKey: defaultIntegrationConfig.publicKey || 'placeholder',
      environment: toSdkEnvironment(defaultIntegrationConfig.environment),
      inAppBrowserAdapter,
    })
  );

  const [state, setStateInternal] = useState<ExploreState>(makeInitialState);

  // Keep a ref to always have the latest state for async operations
  const stateRef = useRef<ExploreState>(state);
  useEffect(() => {
    stateRef.current = state;
  });

  // Prewarm fraud providers on initial mount
  useEffect(() => {
    prewarmFraudProviders(
      deunaSDKRef.current,
      defaultIntegrationConfig.fraudProvidersJson
    );
  }, []);

  // Load persisted config on mount
  const storageAdapterRef = useRef(storageAdapter);
  useMemo(() => {
    storageAdapterRef.current = storageAdapter;
  }, [storageAdapter]);
  useEffect(() => {
    storageAdapterRef.current?.load().then((saved) => {
      if (!saved) return;
      deunaSDKRef.current = DeunaSDK.initialize({
        publicApiKey: saved.publicKey || 'placeholder',
        environment: toSdkEnvironment(saved.environment),
        inAppBrowserAdapter,
      });
      prewarmFraudProviders(deunaSDKRef.current, saved.fraudProvidersJson);
      const products = getProductsForCurrency(
        saved.merchantCurrencyCode
      ) as ExtendedProduct[];
      setStateInternal((prev) => ({
        ...prev,
        appliedConfig: saved,
        draftConfig: saved,
        products,
        useManualOrderTokenFlow: saved.orderToken.trim().length > 0,
        sdkInstanceId: prev.sdkInstanceId + 1,
      }));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setState = useCallback(
    (updater: ExploreState | ((prev: ExploreState) => ExploreState)) => {
      setStateInternal((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        stateRef.current = next;
        return next;
      });
    },
    []
  );

  const patchState = useCallback(
    (patch: Partial<ExploreState>) => {
      setState((prev) => ({ ...prev, ...patch }));
    },
    [setState]
  );

  // ── openDrawer ──────────────────────────────────────────────────────────────
  const openDrawer = useCallback(() => {
    setState((prev) => {
      prewarmFraudProviders(
        deunaSDKRef.current,
        prev.appliedConfig.fraudProvidersJson
      );
      return {
        ...prev,
        draftConfig: prev.appliedConfig,
        keyErrorMessage: null,
        modalStatusMessage: null,
      };
    });
  }, [setState]);

  // ── updateDraft ─────────────────────────────────────────────────────────────
  const updateDraft = useCallback(
    (patch: Partial<IntegrationConfig>) => {
      setState((prev) => ({
        ...prev,
        draftConfig: { ...prev.draftConfig, ...patch },
      }));
    },
    [setState]
  );

  // ── discardDraft ────────────────────────────────────────────────────────────
  const discardDraft = useCallback(() => {
    setState((prev) => ({
      ...prev,
      draftConfig: prev.appliedConfig,
      keyErrorMessage: null,
      modalStatusMessage: null,
    }));
  }, [setState]);

  // ── applyConfiguration ──────────────────────────────────────────────────────
  const applyConfiguration = useCallback(
    async (onSuccess?: () => void) => {
      patchState({ isApplyingConfiguration: true, keyErrorMessage: null });

      // Read current draft from ref (always up-to-date)
      const draft = stateRef.current.draftConfig;

      // Validate publicKey
      if (!draft.publicKey.trim()) {
        patchState({
          keyErrorMessage: 'Public Key is required',
          isApplyingConfiguration: false,
        });
        return;
      }

      // Validate fraudProvidersJson
      if (draft.fraudProvidersJson.trim()) {
        try {
          JSON.parse(draft.fraudProvidersJson);
        } catch {
          patchState({
            keyErrorMessage: 'Fraud Providers JSON is invalid',
            isApplyingConfiguration: false,
          });
          return;
        }
      }

      let merchantName = draft.merchantName;
      let merchantCountryCode = draft.merchantCountryCode;
      let merchantCurrencyCode = draft.merchantCurrencyCode;
      let generatedOrderToken: string | null = null;

      try {
        if (draft.privateKey.trim()) {
          if (
            draft.presentationMode === 'embedded' &&
            !draft.orderToken.trim()
          ) {
            // Auto-generate order token for embedded mode
            generatedOrderToken = await createOrderToken(
              draft.environment,
              draft.privateKey,
              stateRef.current.selectedProductIds
            );
          } else {
            // Just fetch merchant profile
            const profile = await fetchMerchantProfile(
              draft.environment,
              draft.privateKey
            );
            merchantName = profile.name;
            merchantCountryCode = profile.countryCode;
            merchantCurrencyCode = profile.currencyCode;
          }
        }
      } catch (e: any) {
        patchState({
          keyErrorMessage: e?.message ?? 'Failed to apply configuration',
          isApplyingConfiguration: false,
        });
        return;
      }

      // Re-initialize SDK
      deunaSDKRef.current = DeunaSDK.initialize({
        publicApiKey: draft.publicKey,
        environment: toSdkEnvironment(draft.environment),
        inAppBrowserAdapter,
      });

      const newConfig: IntegrationConfig = {
        ...draft,
        merchantName,
        merchantCountryCode,
        merchantCurrencyCode,
      };

      prewarmFraudProviders(deunaSDKRef.current, newConfig.fraudProvidersJson);

      const newProducts = getProductsForCurrency(
        merchantCurrencyCode
      ) as ExtendedProduct[];

      storageAdapter?.save(newConfig);

      setState((prev) => ({
        ...prev,
        appliedConfig: newConfig,
        draftConfig: newConfig,
        products: newProducts,
        isApplyingConfiguration: false,
        generatedOrderToken,
        useManualOrderTokenFlow: draft.orderToken.trim().length > 0,
        isShowingEmbeddedWidget: false,
        sdkInstanceId: prev.sdkInstanceId + 1,
      }));

      onSuccess?.();
    },
    [patchState, setState, inAppBrowserAdapter]
  );

  // ── toggleProductSelection ──────────────────────────────────────────────────
  const toggleProductSelection = useCallback(
    (id: string) => {
      setState((prev) => {
        const newSet = new Set(prev.selectedProductIds);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        return { ...prev, selectedProductIds: newSet };
      });
    },
    [setState]
  );

  // ── clearGeneratedOrder ─────────────────────────────────────────────────────
  const clearGeneratedOrder = useCallback(() => {
    setState((prev) => {
      const updatedConfig = { ...prev.appliedConfig, orderToken: '' };
      storageAdapterRef.current?.save(updatedConfig);
      return {
        ...prev,
        generatedOrderToken: null,
        useManualOrderTokenFlow: false,
        isShowingEmbeddedWidget: false,
        appliedConfig: updatedConfig,
        selectedProductIds: new Set(),
      };
    });
  }, [setState]);

  // ── resolveOrderToken (internal helper) ──────────────────────────────────────
  const resolveOrderToken = useCallback(async (): Promise<string> => {
    const { appliedConfig, selectedProductIds, generatedOrderToken } =
      stateRef.current;

    // Priority: manual orderToken → generatedOrderToken → create from products
    if (appliedConfig.orderToken.trim()) return appliedConfig.orderToken.trim();
    if (generatedOrderToken) return generatedOrderToken;

    if (!appliedConfig.privateKey.trim()) {
      throw new Error(
        'Private Key is required to create an order automatically'
      );
    }

    return createOrderToken(
      appliedConfig.environment,
      appliedConfig.privateKey,
      selectedProductIds
    );
  }, []);

  // ── showWidget ──────────────────────────────────────────────────────────────
  const showWidget = useCallback(
    async (navigation: NavigationProp<RootStackParamList, 'Home'>) => {
      patchState({ isLaunchingWidget: true, modalStatusMessage: null });

      let orderToken: string;
      try {
        orderToken = await resolveOrderToken();
      } catch (e: any) {
        patchState({
          isLaunchingWidget: false,
          modalStatusMessage: e?.message ?? 'Failed to create order',
        });
        return;
      }

      const config = stateRef.current.appliedConfig;
      const mode =
        config.presentationMode === 'embedded' ? Mode.EMBEDDED : Mode.MODAL;
      const sdk = deunaSDKRef.current;

      const userInfo =
        config.userInfoEmail ||
        config.userInfoFirstName ||
        config.userInfoLastName
          ? {
              firstName: config.userInfoFirstName || undefined,
              lastName: config.userInfoLastName || undefined,
              email: config.userInfoEmail || undefined,
            }
          : undefined;

      let fraudCredentials: Record<string, any> | undefined;
      if (config.fraudProvidersJson.trim()) {
        try {
          fraudCredentials = JSON.parse(config.fraudProvidersJson);
        } catch {
          // ignore
        }
      }

      if (config.presentationMode === 'embedded') {
        patchState({
          isLaunchingWidget: false,
          isShowingEmbeddedWidget: true,
          generatedOrderToken: orderToken,
        });
        // initPaymentWidget then navigate — fall through to the switch below
      }

      switch (config.selectedWidget) {
        case 'payment':
        case 'click_to_pay':
          sdk.initPaymentWidget({
            orderToken,
            userToken: config.userToken || undefined,
            userInfo,
            mode,
            hidePayButton: config.hidePayButton,
            fraudCredentials,
            domain: config.domain || undefined,
            callbacks: {
              onSuccess: async (order) => {
                await sdk.close();
                patchState({
                  isLaunchingWidget: false,
                  isShowingEmbeddedWidget: false,
                });
                navigation.navigate('PaymentSuccess', { order });
              },
              onError: async (_error) => {
                await sdk.close();
                patchState({
                  isLaunchingWidget: false,
                  isShowingEmbeddedWidget: false,
                });
                if (mode === Mode.EMBEDDED) {
                  navigation.navigate('Home');
                }
              },
              onClosed: (_action) => {
                patchState({
                  isLaunchingWidget: false,
                  isShowingEmbeddedWidget: false,
                });
              },
              onCardBinDetected: async (_metadata) => {},
              onInstallmentSelected: (_metadata) => {},
              onPaymentProcessing: () => {},
              onEventDispatch: (_event, _payload) => {},
              onDownloadFile: (file) => {
                const mapper = {
                  [DownloadType.URL]: () => {},
                  [DownloadType.BASE64]: () => {},
                };
                mapper[file.type]?.();
              },
            },
          });
          break;

        case 'vault':
          sdk.initElements({
            orderToken,
            userToken: config.userToken || undefined,
            hidePayButton: config.hidePayButton,
            userInfo,
            mode,
            fraudCredentials,
            domain: config.domain || undefined,
            callbacks: {
              onSuccess: async (data) => {
                await sdk.close();
                patchState({
                  isLaunchingWidget: false,
                  isShowingEmbeddedWidget: false,
                });
                navigation.navigate('CardSavedSuccess', { data });
              },
              onError: (_error) => {
                patchState({ isLaunchingWidget: false });
              },
              onClosed: (_action) => {
                patchState({ isLaunchingWidget: false });
              },
            },
          });
          break;

        case 'next_action':
          sdk.initNextAction({
            orderToken,
            mode,
            fraudCredentials,
            domain: config.domain || undefined,
            callbacks: {
              onSuccess: async (order) => {
                await sdk.close();
                patchState({
                  isLaunchingWidget: false,
                  isShowingEmbeddedWidget: false,
                });
                navigation.navigate('PaymentSuccess', { order });
              },
              onError: (_error) => {
                patchState({ isLaunchingWidget: false });
              },
              onClosed: (_action) => {
                patchState({ isLaunchingWidget: false });
              },
            },
          });
          break;

        case 'voucher':
          sdk.initVoucherWidget({
            orderToken,
            mode,
            fraudCredentials,
            domain: config.domain || undefined,
            callbacks: {
              onSuccess: async (order) => {
                await sdk.close();
                patchState({
                  isLaunchingWidget: false,
                  isShowingEmbeddedWidget: false,
                });
                navigation.navigate('PaymentSuccess', { order });
              },
              onError: (_error) => {
                patchState({ isLaunchingWidget: false });
              },
              onClosed: (_action) => {
                patchState({ isLaunchingWidget: false });
              },
              onDownloadFile: (_file) => {},
            },
          });
          break;

        default:
          patchState({ isLaunchingWidget: false });
      }

      if (config.presentationMode === 'embedded') {
        navigation.navigate('Embedded');
      }
    },
    [patchState, resolveOrderToken]
  );

  // ── showWallets ─────────────────────────────────────────────────────────────
  const showWallets = useCallback(
    async (navigation: NavigationProp<RootStackParamList, 'Home'>) => {
      patchState({ isLaunchingWallets: true, modalStatusMessage: null });

      let orderToken: string;
      try {
        orderToken = await resolveOrderToken();
      } catch (e: any) {
        patchState({
          isLaunchingWallets: false,
          modalStatusMessage:
            e?.message ?? 'Failed to create order for wallets',
        });
        return;
      }

      const config = stateRef.current.appliedConfig;
      patchState({ isLaunchingWallets: false });
      navigation.navigate('Wallets', {
        orderToken,
        publicApiKey: config.publicKey || undefined,
        environment: config.environment || undefined,
        userInfoFirstName: config.userInfoFirstName || undefined,
        userInfoLastName: config.userInfoLastName || undefined,
        userInfoEmail: config.userInfoEmail || undefined,
      });
    },
    [patchState, resolveOrderToken]
  );

  // ── showFormularios ─────────────────────────────────────────────────────────
  const showFormularios = useCallback(
    async (
      apm: ApmOption,
      navigation: NavigationProp<RootStackParamList, 'Home'>
    ) => {
      patchState({ isLaunchingFormularios: true, modalStatusMessage: null });

      let orderToken: string;
      try {
        orderToken = await resolveOrderToken();
      } catch (e: any) {
        patchState({
          isLaunchingFormularios: false,
          modalStatusMessage:
            e?.message ?? 'Failed to create order for formularios',
        });
        return;
      }

      const config = stateRef.current.appliedConfig;
      const mode =
        config.presentationMode === 'embedded' ? Mode.EMBEDDED : Mode.MODAL;
      const sdk = deunaSDKRef.current;

      let fraudCredentials: Record<string, any> | undefined;
      if (config.fraudProvidersJson.trim()) {
        try {
          fraudCredentials = JSON.parse(config.fraudProvidersJson);
        } catch {
          // ignore
        }
      }

      sdk.initPaymentWidget({
        orderToken,
        mode,
        hidePayButton: config.hidePayButton,
        fraudCredentials,
        domain: config.domain || undefined,
        paymentMethods: [
          {
            paymentMethod: apm.paymentMethod,
            processors: [apm.processor],
          },
        ],
        callbacks: {
          onSuccess: async (order) => {
            await sdk.close();
            patchState({ isLaunchingFormularios: false });
            navigation.navigate('PaymentSuccess', { order });
          },
          onError: async (_error) => {
            if (mode === Mode.MODAL) {
              await sdk.close();
            }
            patchState({ isLaunchingFormularios: false });
          },
          onClosed: (_action) => {
            patchState({ isLaunchingFormularios: false });
          },
          onDownloadFile: (_file) => {},
        },
      });

      patchState({ isLaunchingFormularios: false });
    },
    [patchState, resolveOrderToken]
  );

  // ── loadApmOptions ──────────────────────────────────────────────────────────
  const loadApmOptions = useCallback(async () => {
    patchState({ isLoadingApms: true });
    try {
      const options = await fetchApmOptions();
      patchState({ apmOptions: options, isLoadingApms: false });
    } catch (_e: any) {
      patchState({ isLoadingApms: false });
    }
  }, [patchState]);

  // ── generateFraudId ─────────────────────────────────────────────────────────
  const generateFraudId = useCallback(
    async (sdk?: DeunaSDK) => {
      patchState({ isGeneratingFraudId: true, fraudIdStatusMessage: null });

      try {
        const targetSdk = sdk ?? deunaSDKRef.current;
        const { appliedConfig, draftConfig } = stateRef.current;
        const jsonStr =
          draftConfig.fraudProvidersJson || appliedConfig.fraudProvidersJson;
        const params = parseFraudProvidersJson(jsonStr);

        // Call generateFraudId with native reflection support
        const fraudId =
          typeof (targetSdk as any)?.generateFraudId === 'function'
            ? await (targetSdk as any).generateFraudId(params ?? {})
            : await (targetSdk as any).getSessionId(params ?? {});

        console.log('🚀 [Explore] FRAUD ID GENERATED (Base64):', fraudId);
        if (fraudId) {
          try {
            const decoded = typeof atob === 'function' ? atob(fraudId) : null;
            if (decoded) {
              console.log('🔓 [Explore] FRAUD ID DECODED JSON:', decoded);
            }
          } catch {
            // ignore
          }
        }

        setState((prev) => ({
          ...prev,
          isGeneratingFraudId: false,
          fraudIdStatusMessage: fraudId
            ? `Fraud ID: ${fraudId}`
            : 'No fraud ID generated',
          appliedConfig: { ...prev.appliedConfig, fraudId: fraudId ?? '' },
          draftConfig: { ...prev.draftConfig, fraudId: fraudId ?? '' },
        }));
      } catch (e: any) {
        patchState({
          isGeneratingFraudId: false,
          fraudIdStatusMessage: `Error: ${e?.message ?? 'Failed to generate fraud ID'}`,
        });
      }
    },
    [patchState, setState]
  );

  return {
    state,
    deunaSDK: deunaSDKRef.current,
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
  };
}
