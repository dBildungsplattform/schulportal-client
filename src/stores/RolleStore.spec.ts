import ApiService from '@/services/ApiService';
import MockAdapter from 'axios-mock-adapter';
import { setActivePinia, createPinia } from 'pinia';
import { useRolleStore, type RolleStore } from './RolleStore';
import { RollenMerkmal, RollenSystemRecht, type RolleResponse } from '../api-client/generated/api';
import { rejects } from 'assert';

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
      expect(rolleStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(rolleStore.createdRolle).toEqual(null);
      expect(rolleStore.loading).toBe(false);
    });
    it('should handle error code', async () => {
      mockadapter.onPost('/api/rolle').replyOnce(500, { code: 'some mock server error' });
      const createRollePromise: Promise<RolleResponse> = rolleStore.createRolle(
        'Lehrer',
        '1234',
        'LEHR',
        ['KOPERS_PFLICHT'],
        ['ROLLEN_VERWALTEN'],
      );
      expect(rolleStore.loading).toBe(true);
      await expect(createRollePromise).rejects.toEqual('some mock server error');
      expect(rolleStore.errorCode).toEqual('some mock server error');
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
      const getAllRollenPromise: Promise<void> = rolleStore.getAllRollen();
      expect(rolleStore.loading).toBe(true);
      await getAllRollenPromise;
      expect(rolleStore.allRollen).toEqual([...mockResponse]);
      expect(rolleStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      mockadapter.onGet('/api/rolle?searchStr=').replyOnce(500, 'some mock server error');
      const getAllRollenPromise: Promise<void> = rolleStore.getAllRollen();
      expect(rolleStore.loading).toBe(true);
      await getAllRollenPromise;
      expect(rolleStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(rolleStore.allRollen).toEqual([]);
      expect(rolleStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      mockadapter.onGet('/api/rolle?searchStr=').replyOnce(500, { code: 'some mock server error' });
      const getAllRollenPromise: Promise<void> = rolleStore.getAllRollen();
      expect(rolleStore.loading).toBe(true);
      await getAllRollenPromise;
      expect(rolleStore.errorCode).toEqual('some mock server error');
      expect(rolleStore.allRollen).toEqual([]);
      expect(rolleStore.loading).toBe(false);
    });
  });

  describe('addServiceProviderToRolle', () => {
    it('should add a service provider to a rolle', async () => {
      mockadapter.onPost('/api/rolle/1/serviceProviders').replyOnce(200, {}, {});
      const addServiceProviderToRollePromise: Promise<void> = rolleStore.addServiceProviderToRolle('1', {
        serviceProviderId: '1',
      });
      expect(rolleStore.loading).toBe(true);
      await addServiceProviderToRollePromise;
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
});
