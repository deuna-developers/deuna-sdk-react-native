interface Env {
  publicApiKey?: string;
  environment?: 'sandbox' | 'production' | 'staging' | 'develop';
  domain?: string;
  orderToken?: string;
  userToken?: string;
}

const env: Env = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('../../.env.json');
  } catch (error) {
    console.error('Error loading .env.json', error);
    return {};
  }
})();

export const config: Env = {
  publicApiKey: env.publicApiKey || 'YOUR_PUBLIC_API_KEY',
  environment: env.environment || 'sandbox',
  domain: env.domain, // Optional
  orderToken: env.orderToken,
  userToken: env.userToken,
};
