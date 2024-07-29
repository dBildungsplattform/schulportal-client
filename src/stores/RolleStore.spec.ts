import ApiService from '@/services/ApiService';
import MockAdapter from 'axios-mock-adapter';
import { setActivePinia, createPinia } from 'pinia';
import { useRolleStore, type Rolle, type RolleStore } from './RolleStore';
import {
  RollenMerkmal,
  RollenSystemRecht,
  type RolleResponse,
  type RolleWithServiceProvidersResponse,
} from '../api-client/generated/api';
import { rejects } from 'assert';
import type { ServiceProvider } from './ServiceProviderStore';

const mockadapter: MockAdapter = new MockAdapter(ApiService);

describe('rolleStore', () => {
  let rolleStore: RolleStore;
  beforeEach(() => {
    setActivePinia(createPinia());
    rolleStore = useRolleStore();
    mockadapter.reset();
  });

  it('should initalize state correctly', () => {
    expect(rolleStore.createdRolle).toEqual(null);
    expect(rolleStore.allRollen).toEqual([]);
    expect(rolleStore.errorCode).toEqual('');
    expect(rolleStore.loading).toBe(false);
  });

  describe('createRolle', () => {
    it('should create role and update state', async () => {
      const mockResponse: RolleResponse[] = [
        {
          administeredBySchulstrukturknoten: '1234',
          rollenart: 'LEHR',
          name: 'Lehrer',
          // TODO remove type casting when generator is fixed
          merkmale: ['KOPERS_PFLICHT'] as unknown as Set<RollenMerkmal>,
          systemrechte: ['ROLLEN_VERWALTEN'] as unknown as Set<RollenSystemRecht>,
          createdAt: '2022',
          updatedAt: '2022',
          id: '1',
        },
      ];

      mockadapter.onPost('/api/rolle').replyOnce(200, mockResponse);
      const createRollePromise: Promise<RolleResponse> = rolleStore.createRolle(
        'Lehrer',
        '1234',
        'LEHR',
        ['KOPERS_PFLICHT'],
        ['ROLLEN_VERWALTEN'],
      );
      expect(rolleStore.loading).toBe(true);
      await createRollePromise;
      expect(rolleStore.createdRolle).toEqual([...mockResponse]);
      expect(rolleStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      mockadapter.onPost('/api/rolle').replyOnce(500, 'some mock server error');
      const createRollePromise: Promise<RolleResponse> = rolleStore.createRolle(
        'Lehrer',
        '1234',
        'LEHR',
        ['KOPERS_PFLICHT'],
        ['ROLLEN_VERWALTEN'],
      );
      expect(rolleStore.loading).toBe(true);
      await rejects(createRollePromise);
      expect(rolleStore.errorCode).toEqual('ROLLE_ERROR');
      expect(rolleStore.createdRolle).toEqual(null);
      expect(rolleStore.loading).toBe(false);
    });
    it('should handle error code', async () => {
      mockadapter.onPost('/api/rolle').replyOnce(500, { i18nKey: 'SOME_MOCK_SERVER_ERROR' });
      const createRollePromise: Promise<RolleResponse> = rolleStore.createRolle(
        'Lehrer',
        '1234',
        'LEHR',
        ['KOPERS_PFLICHT'],
        ['ROLLEN_VERWALTEN'],
      );
      expect(rolleStore.loading).toBe(true);
      await expect(createRollePromise).rejects.toEqual('SOME_MOCK_SERVER_ERROR');
      expect(rolleStore.errorCode).toEqual('SOME_MOCK_SERVER_ERROR');
      expect(rolleStore.createdRolle).toEqual(null);
      expect(rolleStore.loading).toBe(false);
    });
  });

  describe('getAllRollen', () => {
    it('should load rollen and update state', async () => {
      const mockResponse: RolleResponse[] = [
        {
          administeredBySchulstrukturknoten: '1234',
          rollenart: 'LEHR',
          name: 'Lehrer',
          // TODO: remove type casting when generator is fixed
          merkmale: ['KOPERS_PFLICHT'] as unknown as Set<RollenMerkmal>,
          systemrechte: ['ROLLEN_VERWALTEN'] as unknown as Set<RollenSystemRecht>,
          createdAt: '2022',
          updatedAt: '2022',
          id: '1',
        },
      ];

      mockadapter.onGet('/api/rolle?searchStr=').replyOnce(200, mockResponse, {});
      const getAllRollenPromise: Promise<void> = rolleStore.getAllRollen('');
      expect(rolleStore.loading).toBe(true);
      await getAllRollenPromise;
      expect(rolleStore.allRollen).toEqual([...mockResponse]);
      expect(rolleStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      mockadapter.onGet('/api/rolle?searchStr=').replyOnce(500, 'some mock server error');
      const getAllRollenPromise: Promise<void> = rolleStore.getAllRollen('');
      expect(rolleStore.loading).toBe(true);
      await getAllRollenPromise;
      expect(rolleStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(rolleStore.allRollen).toEqual([]);
      expect(rolleStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      mockadapter.onGet('/api/rolle?searchStr=').replyOnce(500, { code: 'some mock server error' });
      const getAllRollenPromise: Promise<void> = rolleStore.getAllRollen('');
      expect(rolleStore.loading).toBe(true);
      await getAllRollenPromise;
      expect(rolleStore.errorCode).toEqual('some mock server error');
      expect(rolleStore.allRollen).toEqual([]);
      expect(rolleStore.loading).toBe(false);
    });
  });

  describe('addServiceProviderToRolle', () => {
    it('should add a service provider to a rolle', async () => {
      rolleStore.createdRolle = {
        id: '1',
        administeredBySchulstrukturknoten: '3',
        merkmale: new Set(),
        name: 'Rolle 1',
        rollenart: 'LERN',
        systemrechte: new Set(),
      };

      const mockResponse: ServiceProvider = {
        id: '1234',
        name: 'itslearning mock',
        url: 'example.org/itslearning',
        target: 'URL',
        kategorie: 'EMAIL',
        hasLogo: true,
      };

      mockadapter.onPost('/api/rolle/1/serviceProviders').replyOnce(200, mockResponse, {});
      const addServiceProviderToRollePromise: Promise<void> = rolleStore.addServiceProviderToRolle('1', {
        serviceProviderId: '1234',
      });
      expect(rolleStore.loading).toBe(true);
      await addServiceProviderToRollePromise;
      expect(rolleStore.createdRolle.serviceProviders).toEqual([mockResponse]);
      expect(rolleStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      mockadapter.onPost('/api/rolle/1/serviceProviders').replyOnce(500, 'some mock server error');
      const addServiceProviderToRollePromise: Promise<void> = rolleStore.addServiceProviderToRolle('1', {
        serviceProviderId: '1',
      });
      expect(rolleStore.loading).toBe(true);
      await addServiceProviderToRollePromise;
      expect(rolleStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(rolleStore.allRollen).toEqual([]);
      expect(rolleStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      mockadapter.onPost('/api/rolle/1/serviceProviders').replyOnce(500, { code: 'some mock server error' });
      const addServiceProviderToRollePromise: Promise<void> = rolleStore.addServiceProviderToRolle('1', {
        serviceProviderId: '1',
      });
      expect(rolleStore.loading).toBe(true);
      await addServiceProviderToRollePromise;
      expect(rolleStore.errorCode).toEqual('some mock server error');
      expect(rolleStore.allRollen).toEqual([]);
      expect(rolleStore.loading).toBe(false);
    });
  });
  describe('getRolleById', () => {
    it('should load Rolle and update state', async () => {
      const mockResponse: RolleResponse[] = [
        {
          administeredBySchulstrukturknoten: '1234',
          rollenart: 'LEHR',
          name: 'Lehrer',
          // TODO: remove type casting when generator is fixed
          merkmale: ['KOPERS_PFLICHT'] as unknown as Set<RollenMerkmal>,
          systemrechte: ['ROLLEN_VERWALTEN'] as unknown as Set<RollenSystemRecht>,
          createdAt: '2022',
          updatedAt: '2022',
          id: '1',
        },
      ];

      mockadapter.onGet('/api/rolle/1').replyOnce(200, mockResponse, {});
      const getRolleByIdPromise: Promise<Rolle> = rolleStore.getRolleById('1');
      expect(rolleStore.loading).toBe(true);
      await getRolleByIdPromise;
      expect(rolleStore.currentRolle).toEqual([...mockResponse]);
      expect(rolleStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      mockadapter.onGet('/api/rolle/1').replyOnce(500, 'some mock server error');
      const getRolleByIdPromise: Promise<Rolle> = rolleStore.getRolleById('1');
      expect(rolleStore.loading).toBe(true);
      await rejects(getRolleByIdPromise);
      expect(rolleStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(rolleStore.currentRolle).toEqual(null);
      expect(rolleStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      mockadapter.onGet('/api/rolle/1').replyOnce(500, { code: 'some mock server error' });
      const getRolleByIdPromise: Promise<Rolle> = rolleStore.getRolleById('1');
      expect(rolleStore.loading).toBe(true);
      await rejects(getRolleByIdPromise);
      expect(rolleStore.errorCode).toEqual('some mock server error');
      expect(rolleStore.currentRolle).toEqual(null);
      expect(rolleStore.loading).toBe(false);
    });
  });
  describe('updateRolle', () => {
    it('should update Rolle and update state', async () => {
      const mockResponse: RolleWithServiceProvidersResponse = {
        administeredBySchulstrukturknoten: '1234',
        rollenart: 'LEHR',
        name: 'Updated Lehrer',
        merkmale: ['KOPERS_PFLICHT'] as unknown as Set<RollenMerkmal>,
        systemrechte: ['ROLLEN_VERWALTEN'] as unknown as Set<RollenSystemRecht>,
        createdAt: '2022',
        updatedAt: '2023',
        id: '1',
        serviceProviders: [{ id: 'sp1', name: 'ServiceProvider1' }],
      };

      mockadapter.onPut('/api/rolle/1').replyOnce(200, mockResponse);
      const updateRollePromise: Promise<RolleWithServiceProvidersResponse> = rolleStore.updateRolle(
        '1',
        'Updated Lehrer',
        ['KOPERS_PFLICHT'],
        ['ROLLEN_VERWALTEN'],
        ['sp1'],
      );
      expect(rolleStore.loading).toBe(true);
      await updateRollePromise;
      expect(rolleStore.updatedRolle).toEqual(mockResponse);
      expect(rolleStore.loading).toBe(false);
    });

    it('should handle string error on update', async () => {
      mockadapter.onPut('/api/rolle/1').replyOnce(500, 'some mock server error');
      const updateRollePromise: Promise<RolleWithServiceProvidersResponse> = rolleStore.updateRolle(
        '1',
        'Updated Lehrer',
        ['KOPERS_PFLICHT'],
        ['ROLLEN_VERWALTEN'],
        ['sp1'],
      );
      expect(rolleStore.loading).toBe(true);
      await rejects(updateRollePromise);
      expect(rolleStore.errorCode).toEqual('UPDATE_MERKMALE_ERROR');
      expect(rolleStore.updatedRolle).toEqual(null);
      expect(rolleStore.loading).toBe(false);
    });

    it('should handle error code on update', async () => {
      mockadapter.onPut('/api/rolle/1').replyOnce(500, { code: 'some mock server error' });
      const updateRollePromise: Promise<RolleWithServiceProvidersResponse> = rolleStore.updateRolle(
        '1',
        'Updated Lehrer',
        ['KOPERS_PFLICHT'],
        ['ROLLEN_VERWALTEN'],
        ['sp1'],
      );
      expect(rolleStore.loading).toBe(true);
      await rejects(updateRollePromise);
      expect(rolleStore.errorCode).toEqual('UPDATE_MERKMALE_ERROR');
      expect(rolleStore.updatedRolle).toEqual(null);
      expect(rolleStore.loading).toBe(false);
    });
  });
});
