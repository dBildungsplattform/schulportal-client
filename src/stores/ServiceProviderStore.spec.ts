import ApiService from '@/services/ApiService';
import MockAdapter from 'axios-mock-adapter';
import { createPinia, setActivePinia } from 'pinia';

import {
  ServiceProviderTarget,
  type ProviderControllerFindRollenerweiterungenByServiceProviderId200Response,
  type ProviderControllerGetManageableServiceProviders200Response,
  type RollenerweiterungWithExtendedDataResponse,
  type ServiceProviderResponse,
} from '@/api-client/generated';
import { faker } from '@faker-js/faker';
import { DoFactory } from 'test/DoFactory';
import {
  ServiceProviderKategorie,
  ServiceProviderMerkmal,
  useServiceProviderStore,
  type ManageableServiceProviderDetail,
  type PersistRollenerweiterung,
  type RollenErweiterungenUebersicht,
  type ServiceProviderCreationFilter,
  type ServiceProviderStore,
  type StartPageServiceProvider,
} from './ServiceProviderStore';

interface MultiErrorRolleIdWithI18nKey {
  rolleId: string;
  i18nKey: string;
}

interface MultiError {
  code: number;
  rolleIdsWithI18nKeys: MultiErrorRolleIdWithI18nKey[];
}

interface MalformedMultiError {
  code?: unknown;
  rolleIdsWithI18nKeys?: unknown;
}

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

  describe('getManageableServiceProvidersForOrganisation', () => {
    const organisationId: string = faker.string.uuid();
    const page: number = 1;
    const itemsPerPage: number = 30;
    const offset: number = (page - 1) * itemsPerPage;
    const limit: number = itemsPerPage;
    const url: string = `/api/provider/manageable-by-organisation?offset=${offset}&limit=${limit}&organisationId=${organisationId}`;

    it('should load service providers manageable for the organisation', async () => {
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
      const promise: Promise<void> = serviceProviderStore.getManageableServiceProvidersForOrganisation(
        organisationId,
        page,
        itemsPerPage,
      );
      expect(serviceProviderStore.loading).toBe(true);
      await promise;
      expect(serviceProviderStore.manageableServiceProvidersForOrganisation).toEqual(
        expect.arrayContaining(mockResponse.items),
      );
      expect(serviceProviderStore.manageableServiceProvidersForOrganisation).toHaveLength(mockResponse.items.length);
      expect(serviceProviderStore.totalManageableServiceProvidersForOrganisation).toEqual(mockResponse.total);
      expect(serviceProviderStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      mockadapter.onGet(url).replyOnce(500, 'some mock server error');
      const promise: Promise<void> = serviceProviderStore.getManageableServiceProvidersForOrganisation(
        organisationId,
        page,
        itemsPerPage,
      );
      expect(serviceProviderStore.loading).toBe(true);
      await promise;
      expect(serviceProviderStore.manageableServiceProvidersForOrganisation).toEqual([]);
      expect(serviceProviderStore.totalManageableServiceProvidersForOrganisation).toEqual(0);
      expect(serviceProviderStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(serviceProviderStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      mockadapter.onGet(url).replyOnce(500, { code: 'some mock server error' });
      const promise: Promise<void> = serviceProviderStore.getManageableServiceProvidersForOrganisation(
        organisationId,
        page,
        itemsPerPage,
      );
      expect(serviceProviderStore.loading).toBe(true);
      await promise;
      expect(serviceProviderStore.manageableServiceProvidersForOrganisation).toEqual([]);
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
      expect(serviceProviderStore.currentServiceProvider).toEqual(mockResponse);
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
      onerror?: (() => void) | null;
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

      vi.spyOn(globalThis, 'FileReader').mockImplementation(function () {
        return mockReader as FileReader;
      });
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
      expect(serviceProviderStore.errorCode).toEqual('');
      expect(serviceProviderStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      mockadapter.onGet(url).replyOnce(500, { code: 'some mock server error' });
      const promise: Promise<void> = serviceProviderStore.getServiceProviderLogoById(serviceProviderId);
      expect(serviceProviderStore.loading).toBe(true);
      await promise;
      expect(serviceProviderStore.errorCode).toEqual('');
      expect(serviceProviderStore.loading).toBe(false);
    });

    it('should handle FileReader error', async () => {
      // Mock the FileReader to trigger an error
      mockReader = {
        onload: null,
        onerror: null,
        result: null,
        readAsDataURL: vi.fn(function (this: typeof mockReader, _blob: Blob) {
          // Simulate FileReader error
          this.onerror?.();
        }),
      };

      vi.spyOn(globalThis, 'FileReader').mockImplementation(function () {
        return mockReader as unknown as FileReader;
      });

      const mockBlob: Blob = new Blob(['mock image data'], { type: 'image/png' });
      mockadapter
        .onGet(`/api/provider/${serviceProviderId}/logo`)
        .replyOnce(200, mockBlob, { 'content-type': 'image/png' });

      await serviceProviderStore.getServiceProviderLogoById(serviceProviderId);

      // The FileReader error triggers your rejection handler, which sets errorCode
      expect(serviceProviderStore.errorCode).toEqual('');
      expect(serviceProviderStore.loading).toBe(false);
    });
  });

  describe('getRollenerweiterungenById (generic test)', () => {
    const serviceProviderId: string = faker.string.uuid();
    const url: string = `/api/provider/${serviceProviderId}/rollenerweiterung`;

    it('should transform API response into displayable overview array', async () => {
      // Generate random API items
      const apiItems: RollenerweiterungWithExtendedDataResponse[] = Array.from({ length: 5 }, () =>
        DoFactory.getRollenerweiterungItem(),
      );

      const mockResponse: ProviderControllerFindRollenerweiterungenByServiceProviderId200Response =
        DoFactory.getRollenerweiterungenResponse(apiItems);

      mockadapter.onGet(url).replyOnce(200, mockResponse);

      await serviceProviderStore.getRollenerweiterungenById({ serviceProviderId: serviceProviderId });

      const expectedRollenerweiterungUebersicht: RollenErweiterungenUebersicht[] =
        DoFactory.buildRollenerweiterungenUebersicht(apiItems);

      // Assert the store built the same overview
      expect(serviceProviderStore.rollenerweiterungenUebersicht).toEqual(expectedRollenerweiterungUebersicht);
      expect(serviceProviderStore.loading).toBe(false);
    });

    it('should handle errors', async () => {
      mockadapter.onGet(url).replyOnce(500, 'some error');
      await serviceProviderStore.getRollenerweiterungenById({ serviceProviderId: serviceProviderId });
      expect(serviceProviderStore.rollenerweiterungenUebersicht).toEqual([]);
      expect(serviceProviderStore.errorCode).toBe('UNSPECIFIED_ERROR');
      expect(serviceProviderStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      mockadapter.onGet(url).replyOnce(500, { code: 'some mock server error' });
      await serviceProviderStore.getRollenerweiterungenById({ serviceProviderId: serviceProviderId });
      expect(serviceProviderStore.rollenerweiterungenUebersicht).toEqual([]);
      expect(serviceProviderStore.errorCode).toBe('some mock server error');
      expect(serviceProviderStore.loading).toBe(false);
    });
  });

  describe('persistRollenerweiterungenForServiceProvider', () => {
    const serviceProviderId: string = faker.string.uuid();
    const organisationId: string = faker.string.uuid();
    const url: string = `/api/rollen-erweiterung/angebot/${serviceProviderId}/organisation/${organisationId}/apply`;

    const filter: PersistRollenerweiterung = {
      serviceProviderId,
      organisationId,
      addErweiterungenForRolleIds: [faker.string.uuid(), faker.string.uuid()],
      removeErweiterungenForRolleIds: [faker.string.uuid()],
    };

    it('should persist rollenerweiterungen and update loading state', async () => {
      mockadapter.onPost(url).replyOnce(200);

      const promise: Promise<void> = serviceProviderStore.persistRollenerweiterungenForServiceProvider(filter);
      expect(serviceProviderStore.loading).toBe(true);
      await promise;
      expect(serviceProviderStore.errorCode).toEqual('');
      expect(serviceProviderStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      mockadapter.onPost(url).replyOnce(500, 'some mock server error');

      const promise: Promise<void> = serviceProviderStore.persistRollenerweiterungenForServiceProvider(filter);
      expect(serviceProviderStore.loading).toBe(true);
      await promise;
      expect(serviceProviderStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(serviceProviderStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      mockadapter.onPost(url).replyOnce(500, { code: 'some mock server error' });

      const promise: Promise<void> = serviceProviderStore.persistRollenerweiterungenForServiceProvider(filter);
      expect(serviceProviderStore.loading).toBe(true);
      await promise;
      expect(serviceProviderStore.errorCode).toEqual('some mock server error');
      expect(serviceProviderStore.loading).toBe(false);
    });

    it('should handle MultiError with valid rolleIdsWithI18nKeys', async () => {
      const code: number = 400;
      const multiError: MultiError = {
        code,
        rolleIdsWithI18nKeys: [
          { rolleId: 'role-1', i18nKey: 'ROLLENERWEITERUNG_TECHNICAL_ERROR' },
          { rolleId: 'role-2', i18nKey: 'NOT_FOUND' },
        ],
      };
      mockadapter.onPost(url).replyOnce(code, multiError);

      const promise: Promise<void> = serviceProviderStore.persistRollenerweiterungenForServiceProvider(filter);
      expect(serviceProviderStore.loading).toBe(true);
      await promise;
      expect(serviceProviderStore.errors.size).toBe(2);
      expect(serviceProviderStore.errors.get('role-1')).toBe('ROLLENERWEITERUNG_TECHNICAL_ERROR');
      expect(serviceProviderStore.errors.get('role-2')).toBe('NOT_FOUND');
      expect(serviceProviderStore.errorCode).toBe('');
      expect(serviceProviderStore.loading).toBe(false);
    });

    it('should handle MultiError with empty rolleIdsWithI18nKeys', async () => {
      const code: number = 400;
      const multiError: MultiError = {
        code,
        rolleIdsWithI18nKeys: [],
      };
      mockadapter.onPost(url).replyOnce(code, multiError);

      const promise: Promise<void> = serviceProviderStore.persistRollenerweiterungenForServiceProvider(filter);
      expect(serviceProviderStore.loading).toBe(true);
      await promise;
      expect(serviceProviderStore.errors.size).toBe(0);
      expect(serviceProviderStore.errorCode).toBe('');
      expect(serviceProviderStore.loading).toBe(false);
    });

    it('should handle MultiError with missing code property', async () => {
      const multiError: MalformedMultiError = {
        rolleIdsWithI18nKeys: [{ rolleId: 'role-1', i18nKey: 'ROLLENERWEITERUNG_TECHNICAL_ERROR' }],
      };
      mockadapter.onPost(url).replyOnce(500, multiError);

      const promise: Promise<void> = serviceProviderStore.persistRollenerweiterungenForServiceProvider(filter);
      expect(serviceProviderStore.loading).toBe(true);
      await promise;
      expect(serviceProviderStore.errorCode).toBe('UNSPECIFIED_ERROR');
      expect(serviceProviderStore.errors.size).toBe(0);
      expect(serviceProviderStore.loading).toBe(false);
    });

    it('should handle MultiError with wrong code type', async () => {
      const multiError: MalformedMultiError = {
        code: null,
        rolleIdsWithI18nKeys: 'not-an-array',
      };
      mockadapter.onPost(url).replyOnce(400, multiError);

      const promise: Promise<void> = serviceProviderStore.persistRollenerweiterungenForServiceProvider(filter);
      expect(serviceProviderStore.loading).toBe(true);
      await promise;
      expect(serviceProviderStore.errorCode).toBe('UNSPECIFIED_ERROR');
      expect(serviceProviderStore.errors.size).toBe(0);
      expect(serviceProviderStore.loading).toBe(false);
    });

    it('should handle MultiError with non-array rolleIdsWithI18nKeys', async () => {
      const code: number = 400;
      const multiError: MalformedMultiError = {
        code,
        rolleIdsWithI18nKeys: 'not-an-array',
      };
      mockadapter.onPost(url).replyOnce(code, multiError);

      const promise: Promise<void> = serviceProviderStore.persistRollenerweiterungenForServiceProvider(filter);
      expect(serviceProviderStore.loading).toBe(true);
      await promise;
      expect(serviceProviderStore.errorCode).toBe(multiError.code);
      expect(serviceProviderStore.errors.size).toBe(0);
      expect(serviceProviderStore.loading).toBe(false);
    });

    it('should handle MultiError with null error', async () => {
      mockadapter.onPost(url).replyOnce(500, null);

      const promise: Promise<void> = serviceProviderStore.persistRollenerweiterungenForServiceProvider(filter);
      expect(serviceProviderStore.loading).toBe(true);
      await promise;
      expect(serviceProviderStore.errorCode).toBe('UNSPECIFIED_ERROR');
      expect(serviceProviderStore.errors.size).toBe(0);
      expect(serviceProviderStore.loading).toBe(false);
    });
  });

  describe('createServiceProvider', () => {
    const filter: ServiceProviderCreationFilter = {
      organisationId: faker.string.uuid(),
      name: 'Test Service Provider',
      url: faker.internet.url(),
      kategorie: ServiceProviderKategorie.Email,
      requires2fa: true,
      merkmale: [ServiceProviderMerkmal.NachtraeglichZuweisbar, ServiceProviderMerkmal.VerfuegbarFuerRollenerweiterung],
    };
    const url: string = '/api/provider';

    it('should create a service provider and update state', async () => {
      const mockResponse: ServiceProviderResponse = {
        id: faker.string.uuid(),
        name: filter.name,
        url: filter.url,
        target: ServiceProviderTarget.Url,
        hasLogo: false,
        kategorie: filter.kategorie,
        requires2fa: filter.requires2fa,
        merkmale: filter.merkmale,
      };

      mockadapter.onPost(url).replyOnce(200, mockResponse);
      const promise: Promise<void> = serviceProviderStore.createServiceProvider(filter);
      expect(serviceProviderStore.loading).toBe(true);
      await promise;
      expect(serviceProviderStore.createdServiceProvider).toEqual(mockResponse);
      expect(serviceProviderStore.errorCode).toEqual('');
      expect(serviceProviderStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      mockadapter.onPost(url).replyOnce(500, 'some mock server error');
      const promise: Promise<void> = serviceProviderStore.createServiceProvider(filter);
      expect(serviceProviderStore.loading).toBe(true);
      await promise;
      expect(serviceProviderStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(serviceProviderStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      mockadapter.onPost(url).replyOnce(500, { code: 'some mock server error' });
      const promise: Promise<void> = serviceProviderStore.createServiceProvider(filter);
      expect(serviceProviderStore.loading).toBe(true);
      await promise;
      expect(serviceProviderStore.errorCode).toEqual('some mock server error');
      expect(serviceProviderStore.loading).toBe(false);
    });
  });

  describe('updateServiceProvider', () => {
    beforeEach(() => {
      serviceProviderStore.updatedServiceProvider = null;
    });
    const providerId: string = 'provider-to-update';
    const apiUrl: string = `/api/provider/${providerId}`;
    const update: Partial<{ name: string; url: string; kategorie: ServiceProviderKategorie }> = {
      name: 'Updated Service Provider',
      url: 'https://updated-url.com',
      kategorie: ServiceProviderKategorie.Email,
    };

    it('should update a service provider and update state', async () => {
      const mockResponse: ServiceProviderResponse = {
        id: providerId,
        name: update.name!,
        url: update.url!,
        target: ServiceProviderTarget.Url,
        hasLogo: false,
        kategorie: update.kategorie!,
        requires2fa: false,
        merkmale: [],
      };

      mockadapter.onPatch(apiUrl).replyOnce(200, mockResponse);
      const promise: Promise<void> = serviceProviderStore.updateServiceProvider(providerId, update);
      expect(serviceProviderStore.loading).toBe(true);
      await promise;
      expect(serviceProviderStore.updatedServiceProvider).toEqual(mockResponse);
      expect(serviceProviderStore.errorCode).toEqual('');
      expect(serviceProviderStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      mockadapter.onPatch(apiUrl).replyOnce(500, 'some mock server error');
      const promise: Promise<void> = serviceProviderStore.updateServiceProvider(providerId, update);
      expect(serviceProviderStore.loading).toBe(true);
      await promise;
      expect(serviceProviderStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(serviceProviderStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      mockadapter.onPatch(apiUrl).replyOnce(500, { code: 'some mock server error' });
      const promise: Promise<void> = serviceProviderStore.updateServiceProvider(providerId, update);
      expect(serviceProviderStore.loading).toBe(true);
      await promise;
      expect(serviceProviderStore.errorCode).toEqual('some mock server error');
      expect(serviceProviderStore.loading).toBe(false);
    });
  });

  describe('deleteServiceProvider', () => {
    const providerId: string = 'provider-to-delete';
    const apiUrl: string = `/api/provider/${providerId}`;

    beforeEach(() => {
      mockadapter.reset();
      serviceProviderStore.errorCode = '';
      serviceProviderStore.loading = false;
    });

    it('removes provider from all arrays and resets currentServiceProvider on success', async () => {
      mockadapter.onDelete(apiUrl).replyOnce(200);
      const promise: Promise<void> = serviceProviderStore.deleteServiceProvider(providerId);
      expect(serviceProviderStore.loading).toBe(true);
      await promise;
      expect(serviceProviderStore.errorCode).toBe('');
      expect(serviceProviderStore.loading).toBe(false);
    });

    it('sets errorCode to UNSPECIFIED_ERROR on string error', async () => {
      mockadapter.onDelete(apiUrl).replyOnce(500, 'some error');
      const promise: Promise<void> = serviceProviderStore.deleteServiceProvider(providerId);
      expect(serviceProviderStore.loading).toBe(true);
      await promise;
      expect(serviceProviderStore.errorCode).toBe('UNSPECIFIED_ERROR');
      expect(serviceProviderStore.loading).toBe(false);
    });

    it('sets errorCode to error code if present in error response', async () => {
      mockadapter.onDelete(apiUrl).replyOnce(500, { code: 'some error code' });
      const promise: Promise<void> = serviceProviderStore.deleteServiceProvider(providerId);
      expect(serviceProviderStore.loading).toBe(true);
      await promise;
      expect(serviceProviderStore.errorCode).toBe('some error code');
      expect(serviceProviderStore.loading).toBe(false);
    });
  });
});
