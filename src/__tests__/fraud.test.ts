import { NativeModules } from 'react-native';
import { generateFraudId, initializeFraudProviders } from '../fraud';
import { DeunaSDK } from '../DeunaSDK';
import {
  withAndroidFraudProviders,
  withIosFraudProviders,
  withFraudProviders,
} from '../plugin/withFraudProviders';

describe('FraudModule', () => {
  const originalDeunaFraud = NativeModules.DeunaFraud;

  afterEach(() => {
    NativeModules.DeunaFraud = originalDeunaFraud;
    jest.clearAllMocks();
  });

  describe('generateFraudId', () => {
    it('returns fraudId when native module succeeds', async () => {
      const mockGenerate = jest
        .fn()
        .mockResolvedValue('eyJN RVJDQURPUEFHTyI6InRva2VuMTIzIn0=');
      NativeModules.DeunaFraud = {
        generateFraudId: mockGenerate,
        initializeFraudProviders: jest.fn(),
      };

      const result = await generateFraudId(
        { MERCADOPAGO: {} },
        { publicApiKey: 'test-key', environment: 'staging' }
      );

      expect(mockGenerate).toHaveBeenCalledWith({
        providers: { MERCADOPAGO: {} },
        publicApiKey: 'test-key',
        environment: 'staging',
      });
      expect(result).toBe('eyJN RVJDQURPUEFHTyI6InRva2VuMTIzIn0=');
    });

    it('returns null safely when native module is missing', async () => {
      delete NativeModules.DeunaFraud;

      const result = await generateFraudId({ MERCADOPAGO: {} });
      expect(result).toBeNull();
    });

    it('returns null safely when native module throws', async () => {
      NativeModules.DeunaFraud = {
        generateFraudId: jest.fn().mockRejectedValue(new Error('Native error')),
        initializeFraudProviders: jest.fn(),
      };

      const result = await generateFraudId({ MERCADOPAGO: {} });
      expect(result).toBeNull();
    });
  });

  describe('initializeFraudProviders', () => {
    it('calls native initializeFraudProviders with correct payload', async () => {
      const mockInit = jest.fn().mockResolvedValue(undefined);
      NativeModules.DeunaFraud = {
        generateFraudId: jest.fn(),
        initializeFraudProviders: mockInit,
      };

      await initializeFraudProviders(
        { MERCADOPAGO: {} },
        { publicApiKey: 'pk_123', environment: 'production' }
      );

      expect(mockInit).toHaveBeenCalledWith({
        providers: { MERCADOPAGO: {} },
        publicApiKey: 'pk_123',
        environment: 'production',
      });
    });

    it('handles missing native module safely without throwing', async () => {
      delete NativeModules.DeunaFraud;

      await expect(
        initializeFraudProviders({ MERCADOPAGO: {} })
      ).resolves.not.toThrow();
    });

    it('handles native rejection safely without throwing', async () => {
      NativeModules.DeunaFraud = {
        generateFraudId: jest.fn(),
        initializeFraudProviders: jest
          .fn()
          .mockRejectedValue(new Error('Init failed')),
      };

      await expect(
        initializeFraudProviders({ MERCADOPAGO: {} })
      ).resolves.not.toThrow();
    });
  });

  describe('DeunaSDK fraud methods', () => {
    it('instance method uses instance publicApiKey and environment', async () => {
      const mockGenerate = jest.fn().mockResolvedValue('test-token');
      NativeModules.DeunaFraud = {
        generateFraudId: mockGenerate,
        initializeFraudProviders: jest.fn(),
      };

      const sdk = new DeunaSDK({
        publicApiKey: 'instance-pk',
        environment: 'sandbox',
      });

      const res = await sdk.generateFraudId({ CYBERSOURCE: { orgId: '1', merchantId: '2' } });

      expect(mockGenerate).toHaveBeenCalledWith({
        providers: { CYBERSOURCE: { orgId: '1', merchantId: '2' } },
        publicApiKey: 'instance-pk',
        environment: 'sandbox',
      });
      expect(res).toBe('test-token');
    });

    it('static method generates fraud ID with provided options', async () => {
      const mockGenerate = jest.fn().mockResolvedValue('static-token');
      NativeModules.DeunaFraud = {
        generateFraudId: mockGenerate,
        initializeFraudProviders: jest.fn(),
      };

      const res = await DeunaSDK.generateFraudId(
        { RISKIFIED: { storeDomain: 'example.com' } },
        { publicApiKey: 'static-pk', environment: 'production' }
      );

      expect(mockGenerate).toHaveBeenCalledWith({
        providers: { RISKIFIED: { storeDomain: 'example.com' } },
        publicApiKey: 'static-pk',
        environment: 'production',
      });
      expect(res).toBe('static-token');
    });
  });
});

describe('Config Plugin withFraudProviders', () => {
  it('does nothing when no fraud providers specified', () => {
    const config = { name: 'TestApp', slug: 'test-app' } as any;
    const result = withFraudProviders(config, { fraudProviders: [] });
    expect(result).toBe(config);
  });

  it('exports withAndroidFraudProviders and withIosFraudProviders functions', () => {
    expect(typeof withAndroidFraudProviders).toBe('function');
    expect(typeof withIosFraudProviders).toBe('function');
    expect(typeof withFraudProviders).toBe('function');
  });
});
