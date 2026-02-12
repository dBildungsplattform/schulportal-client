import ApiService from '@/services/ApiService';
import * as errorHandlers from '@/utils/errorHandlers';
import MockAdapter from 'axios-mock-adapter';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, type MockInstance } from 'vitest';
import { useRollenMappingStore, type RollenMapping, type RollenMappingStore } from './RollenMappingStore';
import { faker } from '@faker-js/faker/locale/en';

const mockadapter: MockAdapter = new MockAdapter(ApiService);
const getResponseErrorCodeMock: MockInstance = vi
  .spyOn(errorHandlers, 'getResponseErrorCode')
  .mockImplementation((_error: unknown, defaultErrorCode: string) => {
    return defaultErrorCode || 'UNSPECIFIED_ERROR';
  });

describe('RollenMappingStore', () => {
  let rollenMappingStore: RollenMappingStore;

  beforeEach(() => {
    setActivePinia(createPinia());
    rollenMappingStore = useRollenMappingStore();
    mockadapter.reset();
    getResponseErrorCodeMock.mockClear();
  });

  it('should initialize state correctly', () => {
    expect(rollenMappingStore.createdRollenMapping).toEqual(null);
    expect(rollenMappingStore.updatedRollenMapping).toEqual(null);
    expect(rollenMappingStore.allRollenMappings).toEqual([]);
    expect(rollenMappingStore.errorCode).toEqual('');
    expect(rollenMappingStore.loading).toBe(false);
    expect(rollenMappingStore.totalRollenMappings).toBe(0);
  });

  describe('createRollenMapping', () => {
    it('should create rollenMapping and update state', async () => {
      const mockResponse: RollenMapping = {
        id: faker.string.uuid(),
        rolleId: faker.string.uuid(),
        serviceProviderId: faker.string.uuid(),
        mapToLmsRolle: 'LEHRER',
      };
      mockadapter.onPost(/.*/).replyOnce(200, mockResponse);

      const promise: Promise<RollenMapping> = rollenMappingStore.createRollenMapping({
        rolleId: faker.string.uuid(),
        serviceProviderId: faker.string.uuid(),
        mapToLmsRolle: 'LEHRER',
      });

      expect(rollenMappingStore.loading).toBe(true);
      const result: RollenMapping = await promise;
      expect(result).toEqual(mockResponse);
      expect(rollenMappingStore.createdRollenMapping).toEqual(mockResponse);
      expect(rollenMappingStore.errorCode).toEqual('');
      expect(rollenMappingStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      const promise: Promise<RollenMapping> = rollenMappingStore.createRollenMapping({
        rolleId: faker.string.uuid(),
        serviceProviderId: faker.string.uuid(),
        mapToLmsRolle: 'LEHRER',
      });

      expect(rollenMappingStore.loading).toBe(true);
      await expect(promise).rejects.toEqual(new Error('ROLLENMAPPING_CREATE_ERROR'));
      expect(rollenMappingStore.errorCode).toEqual('ROLLENMAPPING_CREATE_ERROR');
      expect(rollenMappingStore.createdRollenMapping).toEqual(null);
      expect(rollenMappingStore.loading).toBe(false);
    });
  });

  describe('getAllRollenMappings', () => {
    it('should load rollenMappings and update state', async () => {
      const mockResponse: RollenMapping[] = [
        {
          id: faker.string.uuid(),
          rolleId: faker.string.uuid(),
          serviceProviderId: faker.string.uuid(),
          mapToLmsRolle: 'LEHRER',
        },
        {
          id: faker.string.uuid(),
          rolleId: faker.string.uuid(),
          serviceProviderId: faker.string.uuid(),
          mapToLmsRolle: 'SCHUELER',
        },
      ];
      mockadapter.onGet(/.*/).replyOnce(200, mockResponse);

      const promise: Promise<void> = rollenMappingStore.getAllRollenMappings();
      expect(rollenMappingStore.loading).toBe(true);
      await promise;
      expect(rollenMappingStore.allRollenMappings).toEqual(mockResponse);
      expect(rollenMappingStore.totalRollenMappings).toBe(2);
      expect(rollenMappingStore.errorCode).toEqual('');
      expect(rollenMappingStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      const promise: Promise<void> = rollenMappingStore.getAllRollenMappings();
      expect(rollenMappingStore.loading).toBe(true);
      await promise;
      expect(rollenMappingStore.errorCode).toEqual('ROLLENMAPPING_LIST_ERROR');
      expect(rollenMappingStore.loading).toBe(false);
    });

    it('should handle empty list', async () => {
      await rollenMappingStore.getAllRollenMappings();
      expect(rollenMappingStore.allRollenMappings).toEqual([]);
      expect(rollenMappingStore.totalRollenMappings).toBe(0);
      expect(rollenMappingStore.errorCode).toEqual('ROLLENMAPPING_LIST_ERROR');
    });
  });

  describe('getRollenMappingsForServiceProvider', () => {
    it('should load mappings for service provider and update state', async () => {
      const mockResponse: RollenMapping[] = [
        {
          id: faker.string.uuid(),
          rolleId: faker.string.uuid(),
          serviceProviderId: faker.string.uuid(),
          mapToLmsRolle: 'LEHRER',
        },
      ];
      mockadapter.onGet(/.*/).replyOnce(200, mockResponse);

      const promise: Promise<void> = rollenMappingStore.getRollenMappingsForServiceProvider('sp1');
      expect(rollenMappingStore.loading).toBe(true);
      await promise;
      expect(rollenMappingStore.allRollenMappings).toEqual(mockResponse);
      expect(rollenMappingStore.totalRollenMappings).toBe(1);
      expect(rollenMappingStore.errorCode).toEqual('');
      expect(rollenMappingStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      const promise: Promise<void> = rollenMappingStore.getRollenMappingsForServiceProvider('sp1');
      expect(rollenMappingStore.loading).toBe(true);
      await promise;
      expect(rollenMappingStore.errorCode).toEqual('ROLLENMAPPING_LIST_ERROR');
      expect(rollenMappingStore.loading).toBe(false);
    });

    it('should handle empty list of RollenMappings for service provider', async () => {
      await rollenMappingStore.getRollenMappingsForServiceProvider('sp1');
      expect(rollenMappingStore.allRollenMappings).toEqual([]);
      expect(rollenMappingStore.totalRollenMappings).toBe(0);
      expect(rollenMappingStore.errorCode).toEqual('ROLLENMAPPING_LIST_ERROR');
    });
  });

  describe('getRollenMappingById', () => {
    it('should load by id and return mapping', async () => {
      const mockResponse: RollenMapping = {
        id: faker.string.uuid(),
        rolleId: faker.string.uuid(),
        serviceProviderId: faker.string.uuid(),
        mapToLmsRolle: 'LEHRER',
      };
      mockadapter.onGet(/.*/).replyOnce(200, mockResponse);

      const promise: Promise<RollenMapping> = rollenMappingStore.getRollenMappingById('m1');
      expect(rollenMappingStore.loading).toBe(true);
      const data: RollenMapping = await promise;
      expect(data).toEqual(mockResponse);
      expect(rollenMappingStore.errorCode).toEqual('');
      expect(rollenMappingStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      const promise: Promise<RollenMapping> = rollenMappingStore.getRollenMappingById('m1');
      expect(rollenMappingStore.loading).toBe(true);
      await promise.catch(() => undefined);
      expect(rollenMappingStore.errorCode).toEqual('ROLLENMAPPING_FETCH_ERROR');
      expect(rollenMappingStore.loading).toBe(false);
    });
  });

  describe('updateRollenMapping', () => {
    it('should update mapping and set updatedRollenMapping', async () => {
      const mockResponse: RollenMapping = {
        id: faker.string.uuid(),
        rolleId: faker.string.uuid(),
        serviceProviderId: faker.string.uuid(),
        mapToLmsRolle: 'SCHUELER',
      };
      mockadapter.onPut(/.*/).replyOnce(200, mockResponse);

      const promise: Promise<void> = rollenMappingStore.updateRollenMapping('m1', 'SCHUELER');
      expect(rollenMappingStore.loading).toBe(true);
      await promise;
      expect(rollenMappingStore.updatedRollenMapping).toEqual(mockResponse);
      expect(rollenMappingStore.errorCode).toEqual('');
      expect(rollenMappingStore.loading).toBe(false);
    });

    it('should handle string error on update', async () => {
      const promise: Promise<void> = rollenMappingStore.updateRollenMapping('m1', 'SCHUELER');
      expect(rollenMappingStore.loading).toBe(true);
      await promise;
      expect(rollenMappingStore.errorCode).toEqual('ROLLENMAPPING_UPDATE_ERROR');
      expect(rollenMappingStore.loading).toBe(false);
    });

    it('should not change updatedRollenMapping on update error', async () => {
      const oldRollenMapping: RollenMapping = (rollenMappingStore.updatedRollenMapping = {
        id: faker.string.uuid(),
        rolleId: faker.string.uuid(),
        serviceProviderId: faker.string.uuid(),
        mapToLmsRolle: 'LEHRER',
      });
      mockadapter.onPut(/.*/).replyOnce(500, { i18nKey: 'UPDATE_FAILED' });
      await rollenMappingStore.updateRollenMapping(oldRollenMapping.id, 'SCHUELER');
      expect(rollenMappingStore.updatedRollenMapping).toEqual({
        id: oldRollenMapping.id,
        rolleId: oldRollenMapping.rolleId,
        serviceProviderId: oldRollenMapping.serviceProviderId,
        mapToLmsRolle: 'LEHRER',
      });
    });
  });

  describe('deleteRollenMappingById', () => {
    it('should delete mapping and keep state consistent', async () => {
      mockadapter.onDelete(/.*/).replyOnce(200);

      const promise: Promise<void> = rollenMappingStore.deleteRollenMappingById('m1');
      expect(rollenMappingStore.loading).toBe(true);
      await promise;
      expect(rollenMappingStore.errorCode).toEqual('');
      expect(rollenMappingStore.loading).toBe(false);
    });

    it('should handle error code on delete', async () => {
      const promise: Promise<void> = rollenMappingStore.deleteRollenMappingById('m1');
      expect(rollenMappingStore.loading).toBe(true);
      await promise;
      expect(rollenMappingStore.errorCode).toEqual('ROLLENMAPPING_DELETE_ERROR');
      expect(rollenMappingStore.loading).toBe(false);
    });
  });

  describe('getMappingForRolleAndServiceProvider', () => {
    it('should return correct mapping for given rolleId and serviceProviderId and mapToLmsRolle', async () => {
      const mockResponse1: RollenMapping = {
        id: faker.string.uuid(),
        rolleId: faker.string.uuid(),
        serviceProviderId: faker.string.uuid(),
        mapToLmsRolle: 'LEHRER',
      };
      mockadapter.onPost(/.*/).reply(200, mockResponse1);
      const mapping1: RollenMapping | null = await rollenMappingStore.getMappingForRolleAndServiceProvider(
        mockResponse1.rolleId,
        mockResponse1.serviceProviderId,
        'LEHRER',
      );

      expect(mapping1).toEqual(mockResponse1);

      const mockResponse2: RollenMapping = {
        id: faker.string.uuid(),
        rolleId: faker.string.uuid(),
        serviceProviderId: faker.string.uuid(),
        mapToLmsRolle: '',
      };
      mockadapter.onPost(/.*/).reply(200, mockResponse2);
      const mapping2: RollenMapping | null = await rollenMappingStore.getMappingForRolleAndServiceProvider(
        mockResponse2.rolleId,
        mockResponse2.serviceProviderId,
        '',
      );

      expect(mapping2).toEqual(mockResponse2);
    });

    it('should throw invalid RollenMapping Response error', async () => {
      const invalidResponse: RollenMapping = {
        id: faker.string.uuid(),
        rolleId: undefined as unknown as string,
        serviceProviderId: faker.string.uuid(),
        mapToLmsRolle: '',
      };
      mockadapter.onAny(/.*/).reply(200, invalidResponse);
      await expect(
        rollenMappingStore.getMappingForRolleAndServiceProvider(
          invalidResponse.id,
          invalidResponse.rolleId,
          invalidResponse.serviceProviderId,
        ),
      ).rejects.toEqual(new Error('ROLLENMAPPING_FETCH_ERROR'));
    });

    it('should throw on invalid API response (missing id) and set errorCode', async () => {
      const invalidResponse: Partial<RollenMapping> = {
        rolleId: faker.string.uuid(),
        serviceProviderId: faker.string.uuid(),
        mapToLmsRolle: 'LEARNER',
      };
      mockadapter.onAny().reply(200, invalidResponse);

      await expect(
        rollenMappingStore.getMappingForRolleAndServiceProvider(
          invalidResponse.rolleId!,
          invalidResponse.serviceProviderId!,
          'LEARNER',
        ),
      ).rejects.toStrictEqual(new Error('ROLLENMAPPING_FETCH_ERROR'));

      expect(getResponseErrorCodeMock).toHaveBeenCalledTimes(1);
      const firstCall: [unknown, string] | undefined = getResponseErrorCodeMock.mock.calls[0] as
        | [unknown, string]
        | undefined;
      expect(firstCall).toBeDefined();
      const [caughtError, defaultCode]: [unknown, string] = firstCall!;
      expect(caughtError).toBeInstanceOf(Error);
      expect((caughtError as Error).message).toContain('Invalid RollenMapping response: missing id');
      expect(defaultCode).toBe('ROLLENMAPPING_FETCH_ERROR');

      expect(rollenMappingStore.errorCode).toBe('ROLLENMAPPING_FETCH_ERROR');
      expect(rollenMappingStore.loading).toBe(false);
    });

    it('should throw on invalid API response (missing rolleId) and set errorCode', async () => {
      const invalidResponse: Partial<RollenMapping> = {
        id: faker.string.uuid(),
        serviceProviderId: faker.string.uuid(),
        mapToLmsRolle: 'LEARNER',
      };
      mockadapter.onAny().reply(200, invalidResponse);

      await expect(
        rollenMappingStore.getMappingForRolleAndServiceProvider(
          invalidResponse.id!,
          invalidResponse.serviceProviderId!,
          'LEARNER',
        ),
      ).rejects.toStrictEqual(new Error('ROLLENMAPPING_FETCH_ERROR'));

      expect(getResponseErrorCodeMock).toHaveBeenCalledTimes(1);
      const firstCall: [unknown, string] | undefined = getResponseErrorCodeMock.mock.calls[0] as
        | [unknown, string]
        | undefined;
      expect(firstCall).toBeDefined();
      const [caughtError, defaultCode]: [unknown, string] = firstCall!;
      expect(caughtError).toBeInstanceOf(Error);
      expect((caughtError as Error).message).toContain('Invalid RollenMapping response: missing rolleId');
      expect(defaultCode).toBe('ROLLENMAPPING_FETCH_ERROR');

      expect(rollenMappingStore.errorCode).toBe('ROLLENMAPPING_FETCH_ERROR');
      expect(rollenMappingStore.loading).toBe(false);
    });

    it('should throw on invalid API response (missing serviceProviderId) and set errorCode', async () => {
      const invalidResponse: Partial<RollenMapping> = {
        id: faker.string.uuid(),
        rolleId: faker.string.uuid(),
        mapToLmsRolle: 'LEARNER',
      };
      mockadapter.onAny().reply(200, invalidResponse);

      await expect(
        rollenMappingStore.getMappingForRolleAndServiceProvider(
          invalidResponse.id!,
          invalidResponse.rolleId!,
          'LEARNER',
        ),
      ).rejects.toStrictEqual(new Error('ROLLENMAPPING_FETCH_ERROR'));

      expect(getResponseErrorCodeMock).toHaveBeenCalledTimes(1);
      const firstCall: [unknown, string] | undefined = getResponseErrorCodeMock.mock.calls[0] as
        | [unknown, string]
        | undefined;
      expect(firstCall).toBeDefined();
      const [caughtError, defaultCode]: [unknown, string] = firstCall!;
      expect(caughtError).toBeInstanceOf(Error);
      expect((caughtError as Error).message).toContain('Invalid RollenMapping response: missing serviceProviderId');
      expect(defaultCode).toBe('ROLLENMAPPING_FETCH_ERROR');

      expect(rollenMappingStore.errorCode).toBe('ROLLENMAPPING_FETCH_ERROR');
      expect(rollenMappingStore.loading).toBe(false);
    });
  });
});
