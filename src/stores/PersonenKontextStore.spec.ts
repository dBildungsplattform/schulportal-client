import {
  type DBiamPersonenkontextResponse,
  type SystemrechtResponse,
  OrganisationResponseTypEnum,
} from '@/api-client/generated';
import ApiService from '@/services/ApiService';
import MockAdapter from 'axios-mock-adapter';
import { setActivePinia, createPinia } from 'pinia';
import { rejects } from 'assert';
import { usePersonenkontextStore, type PersonenkontextStore } from './PersonenKontextStore';

const mockadapter: MockAdapter = new MockAdapter(ApiService);

describe('PersonenkontextStore', () => {
  let personenkontextStore: PersonenkontextStore;
  beforeEach(() => {
    setActivePinia(createPinia());
    personenkontextStore = usePersonenkontextStore();
    mockadapter.reset();
  });

  it('should initalize state correctly', () => {
    expect(personenkontextStore.errorCode).toEqual('');
    expect(personenkontextStore.loading).toBe(false);
  });

  describe('hasSystemrecht', () => {
    it('should check for systemrecht and update state', async () => {
      const mockResponse: SystemrechtResponse = {
        ROLLEN_VERWALTEN: [
          {
            id: '1',
            kennung: '12345',
            name: 'Organisation 1',
            namensergaenzung: 'Ergänzung',
            kuerzel: 'O1',
            typ: OrganisationResponseTypEnum.Anbieter,
          },
        ],
      };

      mockadapter
        .onGet('/api/personenkontexte/1/hatSystemrecht?systemRecht=ROLLEN_VERWALTEN')
        .replyOnce(200, mockResponse);
      const hasSystemRechtPromise: Promise<SystemrechtResponse> = personenkontextStore.hasSystemrecht(
        '1',
        'ROLLEN_VERWALTEN',
      );
      expect(personenkontextStore.loading).toBe(true);
      await hasSystemRechtPromise;
      expect(personenkontextStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      mockadapter
        .onGet('/api/personenkontexte/1/hatSystemrecht?systemRecht=ROLLEN_VERWALTEN')
        .replyOnce(500, 'some mock server error');
      const hasSystemRechtPromise: Promise<SystemrechtResponse> = personenkontextStore.hasSystemrecht(
        '1',
        'ROLLEN_VERWALTEN',
      );
      expect(personenkontextStore.loading).toBe(true);
      await rejects(hasSystemRechtPromise);
      expect(personenkontextStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(personenkontextStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      mockadapter
        .onGet('/api/personenkontexte/1/hatSystemrecht?systemRecht=ROLLEN_VERWALTEN')
        .replyOnce(500, { code: 'some mock server error' });
      const hasSystemRechtPromise: Promise<SystemrechtResponse> = personenkontextStore.hasSystemrecht(
        '1',
        'ROLLEN_VERWALTEN',
      );
      expect(personenkontextStore.loading).toBe(true);
      await rejects(hasSystemRechtPromise);
      expect(personenkontextStore.errorCode).toEqual('some mock server error');
      expect(personenkontextStore.loading).toBe(false);
    });
  });
  describe('createPersonenkontext', () => {
    it('should create a Personenkontext', async () => {
      const mockPersonenkontext: DBiamPersonenkontextResponse = {
        personId: '12345',
        organisationId: '67890',
        rolleId: '54321',
      } as DBiamPersonenkontextResponse;

      const mockResponse: DBiamPersonenkontextResponse = mockPersonenkontext;

      mockadapter.onPost('/api/dbiam/personenkontext').replyOnce(201, mockResponse);
      const createPersonenkontextPromise: Promise<DBiamPersonenkontextResponse> =
        personenkontextStore.createPersonenkontext({
          personId: '12345',
          organisationId: '67890',
          rolleId: '54321',
        });
      expect(personenkontextStore.loading).toBe(true);
      const createdPersonenkontext: DBiamPersonenkontextResponse = await createPersonenkontextPromise;
      expect(createdPersonenkontext).toEqual(mockPersonenkontext);
      expect(personenkontextStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      mockadapter.onPost('/api/dbiam/personenkontext').replyOnce(500, 'some error');
      const createPersonenkontextPromise: Promise<DBiamPersonenkontextResponse> =
        personenkontextStore.createPersonenkontext({
          personId: '12345',
          organisationId: '67890',
          rolleId: '54321',
        });
      expect(personenkontextStore.loading).toBe(true);
      await rejects(createPersonenkontextPromise);
      expect(personenkontextStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(personenkontextStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      mockadapter.onPost('/api/dbiam/personenkontext').replyOnce(500, { code: 'some mock server error' });
      const createPersonenkontextPromise: Promise<DBiamPersonenkontextResponse> =
        personenkontextStore.createPersonenkontext({
          personId: '12345',
          organisationId: '67890',
          rolleId: '54321',
        });
      expect(personenkontextStore.loading).toBe(true);
      await rejects(createPersonenkontextPromise);
      expect(personenkontextStore.errorCode).toEqual('some mock server error');
      expect(personenkontextStore.loading).toBe(false);
    });
  });
});
