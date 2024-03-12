import { HatSystemrechtBodyParamsSystemRechtEnum, type SystemrechtResponse } from '@/api-client/generated';
import ApiService from '@/services/ApiService';
import MockAdapter from 'axios-mock-adapter';
import { setActivePinia, createPinia } from 'pinia';
import { rejects } from 'assert';
import { usePersonenkontextStore, type PersonenkontextStore } from './PersonenKontextStore';

const mockadapter: MockAdapter = new MockAdapter(ApiService);

describe('PersonenkontextStore', () => {
  let personkontextStore: PersonenkontextStore;
  beforeEach(() => {
    setActivePinia(createPinia());
    personkontextStore = usePersonenkontextStore();
    mockadapter.reset();
  });

  it('should initalize state correctly', () => {
    expect(personkontextStore.errorCode).toEqual('');
    expect(personkontextStore.loading).toBeFalsy();
  });

  describe('hasSystemrecht', () => {
    it('should check for systemrecht and update state', async () => {
      const mockResponse: SystemrechtResponse = {
        ROLLEN_VERWALTEN: [
          {
            id: 'string',
            kennung: 'string',
            name: 'string',
            namensergaenzung: 'string',
            kuerzel: 'string',
            typ: 'TRAEGER',
          },
        ],
      };

      mockadapter.onGet('/api/personenkontexte/1/hatSystemrecht').replyOnce(200, mockResponse, {});
      const hasSystemRechtPromise: Promise<SystemrechtResponse> = personkontextStore.hasSystemrecht(
        '1',
        HatSystemrechtBodyParamsSystemRechtEnum.RollenVerwalten,
      );
      expect(personkontextStore.loading).toBe(true);
      await hasSystemRechtPromise;
      expect(personkontextStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      mockadapter.onGet('/api/personenkontexte/1/hatSystemrecht').replyOnce(500, 'some mock server error');
      const hasSystemRechtPromise: Promise<SystemrechtResponse> = personkontextStore.hasSystemrecht(
        '1',
        HatSystemrechtBodyParamsSystemRechtEnum.RollenVerwalten,
      );
      expect(personkontextStore.loading).toBe(true);
      await rejects(hasSystemRechtPromise);
      expect(personkontextStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(personkontextStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      mockadapter.onGet('/api/personenkontexte/1/hatSystemrecht').replyOnce(500, { code: 'some mock server error' });
      const hasSystemRechtPromise: Promise<SystemrechtResponse> = personkontextStore.hasSystemrecht(
        '1',
        HatSystemrechtBodyParamsSystemRechtEnum.RollenVerwalten,
      );
      expect(personkontextStore.loading).toBe(true);
      await rejects(hasSystemRechtPromise);
      expect(personkontextStore.errorCode).toEqual('some mock server error');
      expect(personkontextStore.loading).toBe(false);
    });
  });
});
