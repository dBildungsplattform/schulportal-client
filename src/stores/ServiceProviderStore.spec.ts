import type { ProviderControllerGetManageableServiceProviders200Response } from '@/api-client/generated';
import ApiService from '@/services/ApiService';
import MockAdapter from 'axios-mock-adapter';
import { createPinia, setActivePinia } from 'pinia';

import { DoFactory } from 'test/DoFactory';
import { useServiceProviderStore, type ServiceProvider, type ServiceProviderStore } from './ServiceProviderStore';

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

  describe('getManageableServiceProviders', () => {
    const page: number = 1;
    const itemsPerPage: number = 30;
    const offset: number = (page - 1) * itemsPerPage;
    const limit: number = itemsPerPage;
    const url: string = `/api/provider/manageable?offset=${offset}&limit=${limit}`;

    it('should load service providers manageable by the user', async () => {
      const mockResponse: ProviderControllerGetManageableServiceProviders200Response = {
        items: [
          DoFactory.getManageableServiceProviderListEntryResponse(),
          DoFactory.getManageableServiceProviderListEntryResponse(),
          DoFactory.getManageableServiceProviderListEntryResponse(),
        ],
        offset,
        limit,
        total: 3,
      };

      mockadapter.onGet(url).replyOnce(200, mockResponse);
      const promise: Promise<void> = serviceProviderStore.getManageableServiceProviders(page, itemsPerPage);
      expect(serviceProviderStore.loading).toBe(true);
      await promise;
      expect(serviceProviderStore.manageableServiceProviders).toEqual(expect.arrayContaining(mockResponse.items));
      expect(serviceProviderStore.manageableServiceProviders).toHaveLength(mockResponse.items.length);
      expect(serviceProviderStore.totalManageableServiceProviders).toEqual(mockResponse.total);
      expect(serviceProviderStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      mockadapter.onGet(url).replyOnce(500, 'some mock server error');
      const promise: Promise<void> = serviceProviderStore.getManageableServiceProviders(page, itemsPerPage);
      expect(serviceProviderStore.loading).toBe(true);
      await promise;
      expect(serviceProviderStore.manageableServiceProviders).toEqual([]);
      expect(serviceProviderStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(serviceProviderStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      mockadapter.onGet(url).replyOnce(500, { code: 'some mock server error' });
      const promise: Promise<void> = serviceProviderStore.getManageableServiceProviders(page, itemsPerPage);
      expect(serviceProviderStore.loading).toBe(true);
      await promise;
      expect(serviceProviderStore.manageableServiceProviders).toEqual([]);
      expect(serviceProviderStore.errorCode).toEqual('some mock server error');
      expect(serviceProviderStore.loading).toBe(false);
    });
  });
});
