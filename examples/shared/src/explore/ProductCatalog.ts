import { Product } from './domain';

// ─── Static Catalog ───────────────────────────────────────────────────────────

export const PRODUCTS: Product[] = [
  {
    id: 'polo-shirt',
    name: 'Polo Shirt',
    image: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=400&q=80',
    basePriceCents: 10555, // $105.55 USD
  },
  {
    id: 'headphones',
    name: 'Headphones',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
    basePriceCents: 15100, // $151.00 USD
  },
  {
    id: 'sun-glasses',
    name: 'Sun Glasses',
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&q=80',
    basePriceCents: 5000, // $50.00 USD
  },
];

// ─── Currency Rates ───────────────────────────────────────────────────────────

interface CurrencyInfo {
  rate: number;       // conversion rate from USD
  decimals: number;   // number of decimal places for display
  symbol: string;
}

export const CURRENCY_MAP: Record<string, CurrencyInfo> = {
  USD: { rate: 1.0, decimals: 2, symbol: '$' },
  MXN: { rate: 17.0, decimals: 2, symbol: '$' },
  COP: { rate: 3900.0, decimals: 0, symbol: '$' },
  CLP: { rate: 950.0, decimals: 0, symbol: '$' },
  PEN: { rate: 3.75, decimals: 2, symbol: 'S/' },
  BRL: { rate: 5.1, decimals: 2, symbol: 'R$' },
};

/**
 * Returns the price of a product in the target currency's minimal unit (cents/equivalent).
 * basePriceCents is in USD cents. We convert to target currency cents.
 */
const DEFAULT_CURRENCY_INFO: CurrencyInfo = { rate: 1.0, decimals: 2, symbol: '$' };

export function convertPriceCents(basePriceCents: number, currencyCode: string): number {
  const info = CURRENCY_MAP[currencyCode] ?? DEFAULT_CURRENCY_INFO;
  // basePriceCents is USD cents → divide by 100 to get USD → multiply by rate → multiply by 10^decimals
  const usd = basePriceCents / 100;
  const converted = usd * info.rate;
  return Math.round(converted * Math.pow(10, info.decimals));
}

/**
 * Formats a price value (in minimal currency unit) for display.
 * E.g. 10555 USD cents → "$105.55"
 */
export function formatPrice(priceCents: number, currencyCode: string): string {
  const info = CURRENCY_MAP[currencyCode] ?? DEFAULT_CURRENCY_INFO;
  const divisor = Math.pow(10, info.decimals);
  const amount = priceCents / divisor;
  return `${info.symbol} ${amount.toFixed(info.decimals)}`;
}

/**
 * Convert products to the target currency (price in minimal unit of target currency).
 */
export function getProductsForCurrency(
  currencyCode: string
): Array<Product & { displayPrice: string; priceCents: number }> {
  return PRODUCTS.map((p) => {
    const priceCents = convertPriceCents(p.basePriceCents, currencyCode);
    return {
      ...p,
      priceCents,
      displayPrice: formatPrice(priceCents, currencyCode),
    };
  });
}
