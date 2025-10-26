import type { ProviderControllerGetManageableServiceProviders200Response } from '@/api-client/generated';
import ApiService from '@/services/ApiService';
import MockAdapter from 'axios-mock-adapter';
import { createPinia, setActivePinia } from 'pinia';

import { DoFactory } from 'test/DoFactory';
import {
  useServiceProviderStore,
  type StartPageServiceProvider,
  type ServiceProviderStore,
  type ManageableServiceProviderDetail,
} from './ServiceProviderStore';
import { faker } from '@faker-js/faker';

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
      const mockResponse: StartPageServiceProvider[] = [
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
      const mockResponse: StartPageServiceProvider[] = [
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

  describe('getManageableServiceProviderById', () => {
    const serviceProviderId: string = 'test-provider-id';
    const url: string = `/api/provider/manageable/${serviceProviderId}`;

    it('should load a manageable service provider by id', async () => {
      const mockResponse: ManageableServiceProviderDetail = DoFactory.getManageableServiceProviderDetail();

      mockadapter.onGet(url).replyOnce(200, mockResponse);
      const promise: Promise<void> = serviceProviderStore.getManageableServiceProviderById(serviceProviderId);
      expect(serviceProviderStore.loading).toBe(true);
      await promise;
      expect(serviceProviderStore.currentServiceProvider).toEqual({ ...mockResponse, hasRollenerweiterung: false });
      expect(serviceProviderStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      mockadapter.onGet(url).replyOnce(500, 'some mock server error');
      const promise: Promise<void> = serviceProviderStore.getManageableServiceProviderById(serviceProviderId);
      expect(serviceProviderStore.loading).toBe(true);
      await promise;
      expect(serviceProviderStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(serviceProviderStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      mockadapter.onGet(url).replyOnce(500, { code: 'some mock server error' });
      const promise: Promise<void> = serviceProviderStore.getManageableServiceProviderById(serviceProviderId);
      expect(serviceProviderStore.loading).toBe(true);
      await promise;
      expect(serviceProviderStore.errorCode).toEqual('some mock server error');
      expect(serviceProviderStore.loading).toBe(false);
    });
  });

  describe('getServiceProviderLogoById', () => {
    const serviceProviderId: string = faker.string.uuid();
    const url: string = `/api/provider/${serviceProviderId}/logo`;

    let mockReader: {
      onload: (() => void) | null;
      readAsDataURL: (blob: Blob) => void;
      result: string | ArrayBuffer | null;
    };

    beforeEach(() => {
      mockReader = {
        onload: null,
        result: 'data:image/png;base64,bW9jayBpbWFnZSBkYXRh',
        readAsDataURL: vi.fn(function (this: typeof mockReader, _blob: Blob) {
          this.onload?.();
        }),
      };

      vi.spyOn(global, 'FileReader').mockImplementation(() => mockReader as FileReader);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should load service provider logo by id', async () => {
      const mockBlob: Blob = new Blob(['mock image data'], { type: 'image/png' });
      mockadapter.onGet(url).replyOnce(200, mockBlob, { 'content-type': 'image/png' });

      const promise: Promise<void> = serviceProviderStore.getServiceProviderLogoById(serviceProviderId);
      expect(serviceProviderStore.loading).toBe(true);
      await promise;
      expect(serviceProviderStore.serviceProviderLogos.get(serviceProviderId)).toBe(
        'data:image/png;base64,bW9jayBpbWFnZSBkYXRh',
      );
      expect(serviceProviderStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      mockadapter.onGet(url).replyOnce(500, 'some mock server error');
      const promise: Promise<void> = serviceProviderStore.getServiceProviderLogoById(serviceProviderId);
      expect(serviceProviderStore.loading).toBe(true);
      await promise;
      expect(serviceProviderStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(serviceProviderStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      mockadapter.onGet(url).replyOnce(500, { code: 'some mock server error' });
      const promise: Promise<void> = serviceProviderStore.getServiceProviderLogoById(serviceProviderId);
      expect(serviceProviderStore.loading).toBe(true);
      await promise;
      expect(serviceProviderStore.errorCode).toEqual('some mock server error');
      expect(serviceProviderStore.loading).toBe(false);
    });
  });
});
