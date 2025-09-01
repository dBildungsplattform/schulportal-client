import ApiService from '@/services/ApiService';
import MockAdapter from 'axios-mock-adapter';
import { createPinia, setActivePinia } from 'pinia';
import { useServiceProviderStore, type ServiceProvider, type ServiceProviderStore } from './ServiceProviderStore';
import type { CreateServiceProviderBodyParams, UpdateServiceProviderBodyParams } from '@/api-client/generated';

const mockadapter: MockAdapter = new MockAdapter(ApiService);

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
    expect(serviceProviderStore.loading).toBe(false);
    expect(serviceProviderStore.createdServiceProvider).toBe(null);
    expect(serviceProviderStore.updatedServiceProvider).toBe(null);
  });

  describe('getAllServiceProviders', () => {
    it('should load service providers and update state', async () => {
      const mockResponse: ServiceProvider[] = [
        {
          id: '1234',
          name: 'itslearning mock',
          url: 'example.org/itslearning',
          target: 'URL',
          kategorie: 'EMAIL',
          hasLogo: true,
          requires2fa: true,
        },
        {
          id: '5678',
          name: 'administration mock',
          url: '/admin',
          target: 'URL',
          kategorie: 'VERWALTUNG',
          hasLogo: true,
          requires2fa: false,
        },
      ];

      mockadapter.onGet('/api/provider/all').replyOnce(200, mockResponse);
      const getAllServiceProvidersPromise: Promise<void> = serviceProviderStore.getAllServiceProviders();
      expect(serviceProviderStore.loading).toBe(true);
      await getAllServiceProvidersPromise;
      expect(serviceProviderStore.allServiceProviders).toEqual([...mockResponse]);
      expect(serviceProviderStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      mockadapter.onGet('/api/provider/all').replyOnce(500, 'some mock server error');
      const getAllServiceProvidersPromise: Promise<void> = serviceProviderStore.getAllServiceProviders();
      expect(serviceProviderStore.loading).toBe(true);
      await getAllServiceProvidersPromise;
      expect(serviceProviderStore.allServiceProviders).toEqual([]);
      expect(serviceProviderStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(serviceProviderStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      mockadapter.onGet('/api/provider/all').replyOnce(500, { code: 'some mock server error' });
      const getAllServiceProvidersPromise: Promise<void> = serviceProviderStore.getAllServiceProviders();
      expect(serviceProviderStore.loading).toBe(true);
      await getAllServiceProvidersPromise;
      expect(serviceProviderStore.allServiceProviders).toEqual([]);
      expect(serviceProviderStore.errorCode).toEqual('some mock server error');
      expect(serviceProviderStore.loading).toBe(false);
    });
  });

  describe('getAvailableServiceProviders', () => {
    it("should load user's available service providers and update state", async () => {
      const mockResponse: ServiceProvider[] = [
        {
          id: '1234',
          name: 'itslearning mock',
          url: 'example.org/itslearning',
          kategorie: 'EMAIL',
          hasLogo: true,
          target: 'URL',
          requires2fa: true,
        },
        {
          id: '5678',
          name: 'administration mock',
          url: '/admin',
          kategorie: 'VERWALTUNG',
          hasLogo: true,
          target: 'URL',
          requires2fa: false,
        },
      ];

      mockadapter.onGet('/api/provider').replyOnce(200, mockResponse);
      const getAvailableServiceProvidersPromise: Promise<void> = serviceProviderStore.getAvailableServiceProviders();
      expect(serviceProviderStore.loading).toBe(true);
      await getAvailableServiceProvidersPromise;
      expect(serviceProviderStore.availableServiceProviders).toEqual([...mockResponse]);
      expect(serviceProviderStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      mockadapter.onGet('/api/provider').replyOnce(500, 'some mock server error');
      const getAvailableServiceProvidersPromise: Promise<void> = serviceProviderStore.getAvailableServiceProviders();
      expect(serviceProviderStore.loading).toBe(true);
      await getAvailableServiceProvidersPromise;
      expect(serviceProviderStore.availableServiceProviders).toEqual([]);
      expect(serviceProviderStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(serviceProviderStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      mockadapter.onGet('/api/provider').replyOnce(500, { code: 'some mock server error' });
      const getAvailableServiceProvidersPromise: Promise<void> = serviceProviderStore.getAvailableServiceProviders();
      expect(serviceProviderStore.loading).toBe(true);
      await getAvailableServiceProvidersPromise;
      expect(serviceProviderStore.availableServiceProviders).toEqual([]);
      expect(serviceProviderStore.errorCode).toEqual('some mock server error');
      expect(serviceProviderStore.loading).toBe(false);
    });
  });

  describe('createNewServiceProvider', () => {
    it('should create service providers and update state', async () => {
      const mockResponse: ServiceProvider = {
        id: '1234',
        name: 'itslearning mock',
        url: 'example.org/itslearning',
        target: 'URL',
        kategorie: 'EMAIL',
        hasLogo: true,
        requires2fa: true,
      };

      mockadapter.onPost('/api/provider').replyOnce(201, mockResponse);
      const createNewServiceProviderPromise: Promise<void> = serviceProviderStore.createNewServiceProvider(
        {} as CreateServiceProviderBodyParams,
      );
      expect(serviceProviderStore.loading).toBe(true);
      await createNewServiceProviderPromise;
      expect(serviceProviderStore.createdServiceProvider).toEqual(mockResponse);
      expect(serviceProviderStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      mockadapter.onPost('/api/provider').replyOnce(500, 'some mock server error');
      const createNewServiceProviderPromise: Promise<void> = serviceProviderStore.createNewServiceProvider(
        {} as CreateServiceProviderBodyParams,
      );
      expect(serviceProviderStore.loading).toBe(true);
      await createNewServiceProviderPromise;
      expect(serviceProviderStore.createdServiceProvider).toEqual(null);
      expect(serviceProviderStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(serviceProviderStore.loading).toBe(false);
    });
  });

  describe('updateServiceProvider', () => {
    it('should update service providers and update state', async () => {
      const mockResponse: ServiceProvider = {
        id: '1234',
        name: 'itslearning mock',
        url: 'example.org/itslearning',
        target: 'URL',
        kategorie: 'EMAIL',
        hasLogo: true,
        requires2fa: true,
      };

      mockadapter.onPatch('/api/provider/1234').replyOnce(200, mockResponse);
      const updateServiceProviderPromise: Promise<void> = serviceProviderStore.updateServiceProvider(
        '1234',
        {} as UpdateServiceProviderBodyParams,
      );
      expect(serviceProviderStore.loading).toBe(true);
      await updateServiceProviderPromise;
      expect(serviceProviderStore.updatedServiceProvider).toEqual(mockResponse);
      expect(serviceProviderStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      mockadapter.onPatch('/api/provider/1234').replyOnce(500, 'some mock server error');
      const updateServiceProviderPromise: Promise<void> = serviceProviderStore.updateServiceProvider(
        '1234',
        {} as UpdateServiceProviderBodyParams,
      );
      expect(serviceProviderStore.loading).toBe(true);
      await updateServiceProviderPromise;
      expect(serviceProviderStore.updatedServiceProvider).toEqual(null);
      expect(serviceProviderStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(serviceProviderStore.loading).toBe(false);
    });
  });

  describe('deleteServiceProvider', () => {
    it('should delete service providers and update state', async () => {
      mockadapter.onDelete('/api/provider/1234').replyOnce(204);
      const deleteServiceProviderPromise: Promise<void> = serviceProviderStore.deleteServiceProvider('1234');
      expect(serviceProviderStore.loading).toBe(true);
      await deleteServiceProviderPromise;
      expect(serviceProviderStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      mockadapter.onDelete('/api/provider/1234').replyOnce(500, 'some mock server error');
      const deleteServiceProviderPromise: Promise<void> = serviceProviderStore.deleteServiceProvider('1234');
      expect(serviceProviderStore.loading).toBe(true);
      await deleteServiceProviderPromise;
      expect(serviceProviderStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(serviceProviderStore.loading).toBe(false);
    });
  });
});
