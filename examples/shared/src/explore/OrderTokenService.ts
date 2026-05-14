import { getApiBaseUrl, IntegrationEnvironment } from './domain';
import { fetchMerchantProfile } from './MerchantService';
import { CURRENCY_MAP, convertPriceCents } from './ProductCatalog';
import { PRODUCTS } from './ProductCatalog';

// ─── Address seeds ────────────────────────────────────────────────────────────

interface AddressSeed {
  city: string;
  stateName: string;
  countryName: string;
  countryCode: string;
  zipcode: string;
  lat: number;
  lng: number;
}

const ADDRESS_SEEDS: Record<string, AddressSeed> = {
  MX: { city: 'Ciudad de Mexico', stateName: 'CDMX', countryName: 'Mexico', countryCode: 'MX', zipcode: '06600', lat: 19.4326, lng: -99.1332 },
  CO: { city: 'Bogota', stateName: 'Cundinamarca', countryName: 'Colombia', countryCode: 'CO', zipcode: '110111', lat: 4.711, lng: -74.0721 },
  CL: { city: 'Santiago', stateName: 'Region Metropolitana', countryName: 'Chile', countryCode: 'CL', zipcode: '8320000', lat: -33.4489, lng: -70.6693 },
  PE: { city: 'Lima', stateName: 'Lima', countryName: 'Peru', countryCode: 'PE', zipcode: '15001', lat: -12.0464, lng: -77.0428 },
  EC: { city: 'Quito', stateName: 'Pichincha', countryName: 'Ecuador', countryCode: 'EC', zipcode: '170150', lat: -0.1807, lng: -78.4678 },
};

const DEFAULT_ADDRESS: AddressSeed = {
  city: 'Miami', stateName: 'Florida', countryName: 'United States',
  countryCode: 'US', zipcode: '33101', lat: 25.7617, lng: -80.1918,
};

function randomUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function randomAlphanumeric(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

function formatAmount(cents: number, decimals: number): string {
  const divisor = decimals === 0 ? 1 : 100;
  const value = cents / divisor;
  return decimals === 0 ? Math.round(value).toString() : value.toFixed(decimals);
}

function moneyObject(amount: number, displayAmount: string) {
  return { amount, display_amount: displayAmount };
}

export async function createOrderToken(
  environment: IntegrationEnvironment,
  privateKey: string,
  selectedProductIds: Set<string>
): Promise<string> {
  const merchant = await fetchMerchantProfile(environment, privateKey);

  const currencyCode = (merchant.currencyCode || 'USD').toUpperCase();
  const countryCode = (merchant.countryCode || 'US').toUpperCase();
  const address = ADDRESS_SEEDS[countryCode] ?? DEFAULT_ADDRESS;

  const currencyInfo = CURRENCY_MAP[currencyCode] ?? { rate: 1.0, decimals: 2, symbol: '$' };
  const decimals = currencyInfo.decimals;

  const selectedProducts = PRODUCTS.filter((p) => selectedProductIds.has(p.id));
  const productsToOrder = selectedProducts.length > 0 ? selectedProducts : PRODUCTS;

  const items = productsToOrder.map((p) => {
    const priceCents = convertPriceCents(p.basePriceCents, currencyCode);
    const displayAmount = `${currencyCode} ${formatAmount(priceCents, decimals)}`;
    return {
      id: p.id,
      name: p.name,
      description: 'Product from Explore RN sample',
      quantity: 1,
      sku: p.id.toUpperCase(),
      category: 'sample',
      total_amount: moneyObject(priceCents, displayAmount),
      unit_price: moneyObject(priceCents, displayAmount),
    };
  });

  const totalAmount = items.reduce((sum, item) => sum + item.total_amount.amount, 0);
  const displayTotal = `${currencyCode} ${formatAmount(totalAmount, decimals)}`;
  const orderId = randomUuid();
  const email = `explore-rn+${randomAlphanumeric(8)}@deuna.test`;

  const addressPayload = {
    first_name: 'Explore',
    last_name: 'RN',
    phone: '+593999999999',
    identity_document: '1234567890',
    lat: address.lat,
    lng: address.lng,
    address1: 'Main Street 123',
    address2: '',
    city: address.city,
    zipcode: address.zipcode,
    state_name: address.stateName,
    country: address.countryName,
    country_code: address.countryCode,
    email,
  };

  const body = {
    order_type: 'DEUNA_NOW',
    order: {
      order_id: orderId,
      store_code: 'all',
      currency: currencyCode,
      tax_amount: 0,
      shipping_amount: 0,
      items_total_amount: totalAmount,
      sub_total: totalAmount,
      total_amount: totalAmount,
      display_total_amount: displayTotal,
      items,
      discounts: [],
      shipping_address: addressPayload,
      billing_address: addressPayload,
      status: 'pending',
      timezone: 'America/Guayaquil',
    },
  };

  const baseUrl = getApiBaseUrl(environment);
  const response = await fetch(`${baseUrl}/merchants/orders`, {
    method: 'POST',
    headers: {
      'X-Api-Key': privateKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OrderTokenService: HTTP ${response.status} - ${text}`);
  }

  const json = await response.json();
  const token: string = json.token ?? json.data?.token ?? '';
  if (!token) {
    throw new Error('OrderTokenService: No token in response');
  }
  return token;
}
