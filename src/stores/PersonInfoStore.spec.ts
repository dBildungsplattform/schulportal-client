import { usePersonInfoStore, type PersonInfoStore } from './PersonInfoStore';
import ApiService from '@/services/ApiService';
import MockAdapter from 'axios-mock-adapter';
import { setActivePinia, createPinia } from 'pinia';
import type { PersonInfoResponse } from '@/api-client/generated/api';

const mockadapter: MockAdapter = new MockAdapter(ApiService);

describe('PersonInfoStore', () => {
  let personInfoStore: PersonInfoStore;

  beforeEach(() => {
    setActivePinia(createPinia());
    personInfoStore = usePersonInfoStore();
    mockadapter.reset();
  });

  it('should initialize state correctly', () => {
    expect(personInfoStore.personInfo).toBeNull();
    expect(personInfoStore.errorCode).toEqual('');
    expect(personInfoStore.loading).toBe(false);
  });

  describe('initPersonInfo', () => {
    it('should load PersonInfo and update state', async () => {
      const mockPersonInfo: PersonInfoResponse = {
        person: {
          id: '1234',
          name: {
            familiennamen: 'Vimes',
            vorname: 'Samuel',
            initialenfamilienname: null,
            initialenvorname: null,
            rufname: null,
            titel: null,
            anrede: null,
            namenspraefix: null,
            namenssuffix: null,
            sortierindex: null,
          },
          referrer: null,
          personalnummer: null,
          mandant: '',
          geburt: null,
          stammorganisation: null,
          geschlecht: null,
          lokalisierung: null,
          vertrauensstufe: 'KEIN',
          revision: '',
        },
        pid: '',
        personenkontexte: [],
        gruppen: [],
      };

      mockadapter.onGet('/api/person-info').replyOnce(200, mockPersonInfo);
      const initPersonInfoPromise: Promise<void> = personInfoStore.initPersonInfo();
      expect(personInfoStore.loading).toBe(true);
      await initPersonInfoPromise;
      expect(personInfoStore.personInfo).toEqual(mockPersonInfo);
      expect(personInfoStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      mockadapter.onGet('/api/person-info').replyOnce(500, 'some mock server error');
      const initPersonInfoPromise: Promise<void> = personInfoStore.initPersonInfo();
      expect(personInfoStore.loading).toBe(true);
      await initPersonInfoPromise;
      expect(personInfoStore.personInfo).toBeNull();
      expect(personInfoStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(personInfoStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      mockadapter.onGet('/api/person-info').replyOnce(500, { code: 'some mock server error' });
      const initPersonInfoPromise: Promise<void> = personInfoStore.initPersonInfo();
      expect(personInfoStore.loading).toBe(true);
      await initPersonInfoPromise;
      expect(personInfoStore.personInfo).toBeNull();
      expect(personInfoStore.errorCode).toEqual('some mock server error');
      expect(personInfoStore.loading).toBe(false);
    });
  });
});
