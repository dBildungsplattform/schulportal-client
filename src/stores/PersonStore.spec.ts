import type {
  PersonFrontendControllerFindPersons200Response,
  PersonendatensatzResponse,
  TokenStateResponse,
} from '@/api-client/generated';
import { usePersonStore, type PersonStore, type Personendatensatz } from './PersonStore';
import ApiService from '@/services/ApiService';
import MockAdapter from 'axios-mock-adapter';
import { setActivePinia, createPinia } from 'pinia';
import { rejects } from 'assert';

const mockadapter: MockAdapter = new MockAdapter(ApiService);

describe('PersonStore', () => {
  let personStore: PersonStore;
  beforeEach(() => {
    setActivePinia(createPinia());
    personStore = usePersonStore();
    mockadapter.reset();
  });

  it('should initalize state correctly', () => {
    expect(personStore.allPersons).toEqual([]);
    expect(personStore.errorCode).toEqual('');
    expect(personStore.loading).toBe(false);
  });

  describe('getAllPersons', () => {
    it('should load Persons and update state', async () => {
      const mockPersons: PersonendatensatzResponse[] = [
        {
          person: {
            id: '1234',
            name: {
              familienname: 'Vimes',
              vorname: 'Samuel',
            },
          },
        },
        {
          person: {
            id: '5678',
            name: {
              familienname: 'von Lipwig',
              vorname: 'Moist',
            },
          },
        },
      ] as PersonendatensatzResponse[];

      const mockResponse: PersonFrontendControllerFindPersons200Response = {
        offset: 0,
        limit: 2,
        total: 2,
        items: mockPersons,
      };
      mockadapter.onGet('/api/personen-frontend').replyOnce(200, mockResponse, {});
      const getAllPersonPromise: Promise<void> = personStore.getAllPersons({});
      expect(personStore.loading).toBe(true);
      await getAllPersonPromise;
      expect(personStore.allPersons).toEqual([...mockPersons]);
      expect(personStore.loading).toBe(false);
    });

    it('should load persons according to filter', async () => {
      const mockPersonsWithFilter: PersonendatensatzResponse[] = [
        {
          person: {
            id: '123456',
            name: {
              familienname: 'Vimes',
              vorname: 'Susan',
            },
          },
        },
      ] as PersonendatensatzResponse[];

      const mockResponseWithFilter: PersonFrontendControllerFindPersons200Response = {
        offset: 0,
        limit: 1,
        total: 1,
        items: mockPersonsWithFilter,
      };

      mockadapter.onGet('/api/personen-frontend?suchFilter=Sus').replyOnce(200, mockResponseWithFilter, {});
      const getAllPersonPromise: Promise<void> = personStore.getAllPersons({ searchFilter: 'Sus' });
      expect(personStore.loading).toBe(true);
      await getAllPersonPromise;
      expect(personStore.allPersons).toEqual([...mockPersonsWithFilter]);
      expect(personStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      mockadapter.onGet('/api/personen-frontend').replyOnce(500, 'some mock server error');
      const getAllPersonPromise: Promise<void> = personStore.getAllPersons({});
      expect(personStore.loading).toBe(true);
      await getAllPersonPromise;
      expect(personStore.allPersons).toEqual([]);
      expect(personStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(personStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      mockadapter.onGet('/api/personen-frontend').replyOnce(500, { code: 'some mock server error' });
      const getAllPersonPromise: Promise<void> = personStore.getAllPersons({});
      expect(personStore.loading).toBe(true);
      await getAllPersonPromise;
      expect(personStore.allPersons).toEqual([]);
      expect(personStore.errorCode).toEqual('some mock server error');
      expect(personStore.loading).toBe(false);
    });
  });

  describe('getPersonById', () => {
    it('should load Person and update state', async () => {
      const mockPerson: PersonendatensatzResponse = {
        person: {
          id: '1234',
          name: {
            familienname: 'Vimes',
            vorname: 'Samuel',
          },
        },
      } as PersonendatensatzResponse;

      const mockResponse: PersonendatensatzResponse = mockPerson;

      mockadapter.onGet('/api/personen/1234').replyOnce(200, mockResponse);
      const getPersonByIdPromise: Promise<Personendatensatz> = personStore.getPersonById('1234');
      expect(personStore.loading).toBe(true);
      const currentPerson: Personendatensatz = await getPersonByIdPromise;
      expect(currentPerson).toEqual(mockPerson);
      expect(personStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      mockadapter.onGet('/api/personen/2345').replyOnce(500, 'some mock server error');
      const getPersonByIdPromise: Promise<Personendatensatz> = personStore.getPersonById('2345');
      expect(personStore.loading).toBe(true);
      await rejects(getPersonByIdPromise);
      expect(personStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(personStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      mockadapter.onGet('/api/personen/2345').replyOnce(500, { code: 'some mock server error' });
      const getPersonByIdPromise: Promise<Personendatensatz> = personStore.getPersonById('2345');
      expect(personStore.loading).toBe(true);
      await rejects(getPersonByIdPromise);
      expect(personStore.errorCode).toEqual('some mock server error');
      expect(personStore.loading).toBe(false);
    });
  });

  describe('resetPassword', () => {
    it('should reset and return password', async () => {
      const userId: string = '2345';
      const mockResponse: string = 'fakePassword';

      mockadapter.onPatch(`/api/personen/${userId}/password`).replyOnce(200, mockResponse);
      const resetPasswordPromise: Promise<string> = personStore.resetPassword(userId);
      expect(personStore.loading).toBe(true);
      const generatedPassword: string = await resetPasswordPromise;
      expect(generatedPassword).toEqual(mockResponse);
      expect(personStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      const userId: string = '2345';

      mockadapter.onPatch(`/api/personen/${userId}/password`).replyOnce(500, 'some error');
      const resetPasswordPromise: Promise<string> = personStore.resetPassword(userId);
      expect(personStore.loading).toBe(true);
      await rejects(resetPasswordPromise);
      expect(personStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(personStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      const userId: string = '2345';

      mockadapter.onPatch(`/api/personen/${userId}/password`).replyOnce(500, { code: 'some mock server error' });
      const resetPasswordPromise: Promise<string> = personStore.resetPassword(userId);
      expect(personStore.loading).toBe(true);
      await rejects(resetPasswordPromise);
      expect(personStore.errorCode).toEqual('some mock server error');
      expect(personStore.loading).toBe(false);
    });
  });

  describe('deletePersonById', () => {
    it('should delete a person and update state', async () => {
      const personId: string = '1234';

      mockadapter.onDelete(`/api/personen/${personId}`).replyOnce(204);

      await personStore.deletePersonById(personId);

      expect(personStore.loading).toBe(false);
      expect(personStore.errorCode).toEqual('');
    });

    it('should handle string error', async () => {
      const personId: string = '1234';

      mockadapter.onDelete(`/api/personen/${personId}`).replyOnce(500, 'some error');

      await rejects(personStore.deletePersonById(personId));

      expect(personStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(personStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      const personId: string = '1234';

      mockadapter.onDelete(`/api/personen/${personId}`).replyOnce(500, { code: 'some mock server error' });

      await rejects(personStore.deletePersonById(personId));

      expect(personStore.errorCode).toEqual('some mock server error');
      expect(personStore.loading).toBe(false);
    });
  });
});
