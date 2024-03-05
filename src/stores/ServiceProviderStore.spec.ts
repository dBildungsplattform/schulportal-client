import ApiService from '@/services/ApiService';
import MockAdapter from 'axios-mock-adapter';
import { setActivePinia, createPinia } from 'pinia';
import { useServiceProviderStore, type ServiceProviderStore, type ServiceProvider } from './ServiceProviderStore';
import { rejects } from 'assert';

const mockadapter: MockAdapter = new MockAdapter(ApiService);

beforeEach(() => {
  URL.createObjectURL = (): string => 'http://mockurl.com/mockBlobUrl';
});

describe('serviceProviderStore', () => {
  let serviceProviderStore: ServiceProviderStore;
  beforeEach(() => {
    setActivePinia(createPinia());
    serviceProviderStore = useServiceProviderStore();
    mockadapter.reset();
  });

  it('should initalize state correctly', () => {
    expect(serviceProviderStore.allServiceProviders).toEqual([]);
    expect(serviceProviderStore.errorCode).toEqual('');
    expect(serviceProviderStore.loading).toBeFalsy();
  });

  describe('getAllServiceProviders', () => {
    it('should load service providers and update state', async () => {
      const mockResponse: ServiceProvider[] = [
        { id: '1234', name: 'itslearning mock', url: 'example.org/itslearning', kategorie: 'EMAIL', hasLogo: true },
        { id: '5678', name: 'administration mock', url: '/admin', kategorie: 'VERWALTUNG', hasLogo: true },
      ];

      mockadapter.onGet('/api/provider').replyOnce(200, mockResponse);
      const getAllServiceProvidersPromise: Promise<void> = serviceProviderStore.getAllServiceProviders();
      expect(serviceProviderStore.loading).toBe(true);
      await getAllServiceProvidersPromise;
      expect(serviceProviderStore.allServiceProviders).toEqual([...mockResponse]);
      expect(serviceProviderStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      mockadapter.onGet('/api/provider').replyOnce(500, 'some mock server error');
      const getAllServiceProvidersPromise: Promise<void> = serviceProviderStore.getAllServiceProviders();
      expect(serviceProviderStore.loading).toBe(true);
      await getAllServiceProvidersPromise;
      expect(serviceProviderStore.allServiceProviders).toEqual([]);
      expect(serviceProviderStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(serviceProviderStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      mockadapter.onGet('/api/provider').replyOnce(500, { code: 'some mock server error' });
      const getAllServiceProvidersPromise: Promise<void> = serviceProviderStore.getAllServiceProviders();
      expect(serviceProviderStore.loading).toBe(true);
      await getAllServiceProvidersPromise;
      expect(serviceProviderStore.allServiceProviders).toEqual([]);
      expect(serviceProviderStore.errorCode).toEqual('some mock server error');
      expect(serviceProviderStore.loading).toBe(false);
    });
  });
});
