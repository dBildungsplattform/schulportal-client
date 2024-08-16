import {
  OrganisationsTyp,
  RollenMerkmal,
  type DBiamPersonenuebersichtControllerFindPersonenuebersichten200Response,
  type DBiamPersonenuebersichtResponse,
  type PersonFrontendControllerFindPersons200Response,
  type PersonendatensatzResponse,
  type TokenStateResponse,
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
    expect(personStore.errorCode).toEqual('');
    expect(personStore.loading).toBe(false);
  });

  describe('getAllPersons', () => {
    it('should load persons and their overviews, and update state', async () => {
      // Mock data for persons
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

      // Mock response for persons
      const mockPersonsResponse: PersonFrontendControllerFindPersons200Response = {
        offset: 0,
        limit: 2,
        total: 2,
        items: mockPersons,
      };

      // Mock data for person overviews
      const mockUebersichten: DBiamPersonenuebersichtControllerFindPersonenuebersichten200Response = {
        total: 2,
        offset: 0,
        limit: 2,
        items: [
          {
            personId: '1234',
            vorname: 'Samuel',
            nachname: 'Vimes',
            benutzername: 'string',
            lastModifiedZuordnungen: '08.02.2024',
            zuordnungen: [
              {
                sskId: 'string',
                rolleId: 'string',
                sskName: 'string',
                sskDstNr: 'string',
                rolle: 'string',
                typ: OrganisationsTyp.Klasse,
                administriertVon: 'string',
                editable: true,
                merkmale: [] as unknown as RollenMerkmal,
              },
            ],
          },
        ],
      };

      mockadapter.onGet('/api/personen-frontend').replyOnce(200, mockPersonsResponse);

      // Update the mock POST request with the appropriate body
      const personIds: Array<string> = mockPersons.map((person: PersonendatensatzResponse) => person.person.id);
      mockadapter.onPost('/api/dbiam/personenuebersicht', { personIds }).replyOnce(200, mockUebersichten);

      const getAllPersonsPromise: Promise<void> = personStore.getAllPersons({});
      expect(personStore.loading).toBe(true);
      await getAllPersonsPromise;
      expect(personStore.loading).toBe(false);
    });

    it('should handle string error response', async () => {
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

      const mockPersonsResponse: PersonFrontendControllerFindPersons200Response = {
        offset: 0,
        limit: 2,
        total: 2,
        items: mockPersons,
      };

      mockadapter.onGet('/api/personen-frontend').replyOnce(200, mockPersonsResponse);

      const personIds: Array<string> = mockPersons.map((person: PersonendatensatzResponse) => person.person.id);
      mockadapter.onPost('/api/dbiam/personenuebersicht', { personIds }).replyOnce(500, 'Some error occurred');

      const getAllPersonsPromise: Promise<void> = personStore.getAllPersons({});
      expect(personStore.loading).toBe(true);
      await getAllPersonsPromise;
      expect(personStore.loading).toBe(false);
      expect(personStore.errorCode).toEqual('UNSPECIFIED_ERROR');
    });

    it('should handle error code in response', async () => {
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

      const mockPersonsResponse: PersonFrontendControllerFindPersons200Response = {
        offset: 0,
        limit: 2,
        total: 2,
        items: mockPersons,
      };

      mockadapter.onGet('/api/personen-frontend').replyOnce(200, mockPersonsResponse);

      const personIds: Array<string> = mockPersons.map((person: PersonendatensatzResponse) => person.person.id);
      mockadapter.onPost('/api/dbiam/personenuebersicht', { personIds }).replyOnce(500, { code: 'SERVER_ERROR' });

      const getAllPersonsPromise: Promise<void> = personStore.getAllPersons({});
      expect(personStore.loading).toBe(true);
      await getAllPersonsPromise;
      expect(personStore.loading).toBe(false);
      expect(personStore.errorCode).toEqual('SERVER_ERROR');
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

  describe('getPersonenuebersichtById', () => {
    it('should get Personenuebersicht', async () => {
      const mockResponse: DBiamPersonenuebersichtResponse = {
        personId: '1',
        vorname: 'string',
        nachname: 'string',
        benutzername: 'string',
        lastModifiedZuordnungen: '08.02.2024',
        zuordnungen: [
          {
            sskId: 'string',
            rolleId: 'string',
            sskName: 'string',
            sskDstNr: 'string',
            rolle: 'string',
            typ: OrganisationsTyp.Klasse,
            administriertVon: 'string',
            editable: true,
            merkmale: [] as unknown as RollenMerkmal,
          },
        ],
      };

      mockadapter.onGet('/api/dbiam/personenuebersicht/1').replyOnce(200, mockResponse);
      const getPersonenuebersichtByIdPromise: Promise<void> = personStore.getPersonenuebersichtById('1');
      expect(personStore.loading).toBe(true);
      await getPersonenuebersichtByIdPromise;
      expect(personStore.personenuebersicht).toEqual(mockResponse);
      expect(personStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      mockadapter.onGet('/api/dbiam/personenuebersicht/1').replyOnce(500, 'some error');
      const getPersonenuebersichtByIdPromise: Promise<void> = personStore.getPersonenuebersichtById('1');
      expect(personStore.loading).toBe(true);
      await getPersonenuebersichtByIdPromise;
      expect(personStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(personStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      mockadapter.onGet('/api/dbiam/personenuebersicht/1').replyOnce(500, { code: 'some mock server error' });
      const getPersonenuebersichtByIdPromise: Promise<void> = personStore.getPersonenuebersichtById('1');
      expect(personStore.loading).toBe(true);
      await getPersonenuebersichtByIdPromise;
      expect(personStore.errorCode).toEqual('some mock server error');
      expect(personStore.loading).toBe(false);
    });
  });
});
