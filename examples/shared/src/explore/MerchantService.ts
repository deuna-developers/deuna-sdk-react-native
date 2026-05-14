import { getApiBaseUrl, IntegrationEnvironment, MerchantProfile } from './domain';

export async function fetchMerchantProfile(
  environment: IntegrationEnvironment,
  privateKey: string
): Promise<MerchantProfile> {
  const baseUrl = getApiBaseUrl(environment);
  const response = await fetch(`${baseUrl}/merchants`, {
    method: 'GET',
    headers: {
      'X-Api-Key': privateKey,
    },
  });

  if (!response.ok) {
    throw new Error(`MerchantService: HTTP ${response.status}`);
  }

  const json = await response.json();
  const data = json.data ?? json;

  const name: string = data.merchant_name ?? data.name ?? '';
  const countryCode: string = (data.country_iso ?? data.country_code ?? 'US').toUpperCase();
  const currencyCode: string = (data.currency_iso ?? data.currency ?? 'USD').toUpperCase();

  return { name, countryCode, currencyCode };
}
