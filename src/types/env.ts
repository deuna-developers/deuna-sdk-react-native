export enum Env {
    Production = 'production',
    Staging = 'staging',
    Develop = 'develop',
    Sandbox = 'sandbox',
    local = 'local'
  }
  
  export const env = {
    [Env.Production]: 'https://apigw.getduna.com/',
    [Env.Staging]: 'https://api.stg.deuna.io/',
    [Env.Develop]: 'https://api.dev.deuna.io/',
    [Env.Sandbox]: 'https://api.sandbox.deuna.io/'
  };
  
  export const checkout = {
    [Env.Production]: 'https://checkout-ux.deuna.com/',
    [Env.Staging]: 'https://checkout.stg.deuna.io/',
    [Env.Develop]: 'https://checkout.dev.deuna.io/',
    [Env.Sandbox]: 'https://checkout.sandbox.deuna.io/'
  };
  
  export const fingerprintjsEnv = {
    [Env.Production]: 'PczoxhUz1RUyPv5Ih7nM',
    [Env.Staging]: 'sB9jPdnpvLP3FkjjUPi3',
    [Env.Develop]: 'sB9jPdnpvLP3FkjjUPi3',
    [Env.Sandbox]: 'sB9jPdnpvLP3FkjjUPi3'
  };
  
  export const storageSite = {
    [Env.Production]: 'https://cdn.getduna.com/cdl/storageSite/index.html',
    [Env.Staging]: 'https://cdn.stg.deuna.io/cdl/storageSite/index.html',
    [Env.Develop]: 'https://cdn.dev.deuna.io/cdl/storageSite/index.html',
    [Env.Sandbox]: 'https://cdn.stg.deuna.io/cdl/storageSite/index.html',
    [Env.local]: 'http://localhost:3005/'
  };
  
  export const siftCred = {
    [Env.Production]: 'ab8ca5421b',
    [Env.Staging]: 'b267dfc8a5',
    [Env.Develop]: 'b267dfc8a5',
    [Env.Sandbox]: 'b267dfc8a5'
  };
  
  export const proxyUrls = {
    URL: 'mimos.vendodeuna.com',
    FPJS_BEHAVIOR_PATH: 'thomas',
    FPJS_AGENT_DOWNLOAD_PATH: 'tommy',
    FPJS_GET_RESULT_PATH: 'pabloinvita'
  };
  