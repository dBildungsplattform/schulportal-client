/* eslint-disable @typescript-eslint/typedef */
import {
  OrganisationsTyp,
  RollenMerkmal,
  Vertrauensstufe,
  type DBiamPersonenuebersichtControllerFindPersonenuebersichten200Response,
  type DBiamPersonenuebersichtResponse,
  type PersonFrontendControllerFindPersons200Response,
  type PersonLockResponse,
  type PersonendatensatzResponse,
} from '@/api-client/generated';
import { usePersonStore, type PersonStore, type Personendatensatz } from './PersonStore';
import ApiService from '@/services/ApiService';
import MockAdapter from 'axios-mock-adapter';
import { setActivePinia, createPinia } from 'pinia';
import { rejects } from 'assert';

const mockadapter: MockAdapter = new MockAdapter(ApiService);
function getMockPersonendatensatz(): Personendatensatz {
  return {
    person: {
      id: '123456',
      name: {
        familienname: 'Vimes',
        vorname: 'Susan',
      },
      referrer: '6978',
      personalnummer: '9183756',
      isLocked: false,
      lockInfo: null,
      revision: '1',
      lastModified: '2024-12-22',
    },
  };
}
function getMockPersonendatensatzResponse(): PersonendatensatzResponse {
  return {
    person: {
      ...getMockPersonendatensatz().person,
      mandant: '',
      geburt: {},
      stammorganisation: '',
      geschlecht: '',
      lokalisierung: '',
      vertrauensstufe: Vertrauensstufe.Teil,
      revision: '1',
      startpasswort: '',
      lastModified: '2024-12-22',
    },
  };
}

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
              familienname: 'Johnson',
              vorname: 'John',
            },
            referrer: 'jjohnson',
            personalnummer: '1234567',
            isLocked: false,
            lockInfo: null,
            revision: '1',
            lastModified: '2024-12-22',
          },
        },
        {
          person: {
            id: '5678',
            name: {
              familienname: 'Cena',
              vorname: 'Randy',
            },
            referrer: 'rcena',
            personalnummer: null,
            isLocked: false,
            lockInfo: null,
            revision: '1',
            lastModified: '2024-12-22',
          },
        },
        {
          person: {
            id: '7894',
            name: {
              familienname: 'Orton',
              vorname: 'Dwayne',
            },
            referrer: 'dorton',
            personalnummer: null,
            isLocked: false,
            lockInfo: null,
            revision: '1',
            lastModified: '2024-12-22',
          },
        },
        {
          person: {
            id: '3975',
            name: {
              familienname: 'Mardy',
              vorname: 'Hatt',
            },
            referrer: 'hmardy',
            personalnummer: null,
            isLocked: false,
            lockInfo: null,
            revision: '1',
            lastModified: '2024-12-22',
          },
        },
      ] as PersonendatensatzResponse[];

      // Mock response for persons
      const mockPersonsResponse: PersonFrontendControllerFindPersons200Response = {
        offset: 0,
        limit: 4,
        total: 4,
        items: mockPersons,
      };

      // Mock data for person overviews
      const mockUebersichten: DBiamPersonenuebersichtControllerFindPersonenuebersichten200Response = {
        total: 4,
        offset: 0,
        limit: 4,
        items: [
          {
            personId: '1234',
            vorname: 'John',
            nachname: 'Johnson',
            benutzername: 'string',
            lastModifiedZuordnungen: '08.02.2024',
            zuordnungen: [
              {
                sskId: '1',
                rolleId: 'string',
                sskName: 'Schule A',
                sskDstNr: '642462',
                rolle: 'string',
                typ: OrganisationsTyp.Schule,
                administriertVon: 'string',
                editable: true,
                merkmale: ["KOPERS_PFLICHT"] as unknown as RollenMerkmal,
                befristung: '2025-04-05',
              },
            ],
          },
          {
            personId: '5678',
            vorname: 'Randy',
            nachname: 'Cena',
            benutzername: 'string',
            lastModifiedZuordnungen: '08.02.2024',
            zuordnungen: [
              {
                sskId: '2',
                rolleId: 'string',
                sskName: 'Schule B',
                sskDstNr: '',
                rolle: 'string',
                typ: OrganisationsTyp.Schule,
                administriertVon: 'string',
                editable: true,
                merkmale: ["KOPERS_PFLICHT"] as unknown as RollenMerkmal,
                befristung: '2025-04-05',
              },
            ],
          },
          {
            personId: '7894',
            vorname: 'Dwayne',
            nachname: 'Orton',
            benutzername: 'string',
            lastModifiedZuordnungen: '08.02.2024',
            zuordnungen: [],
          },
          {
            personId: '5678',
            vorname: 'Hatt',
            nachname: 'Mardy',
            benutzername: 'string',
            lastModifiedZuordnungen: '08.02.2024',
            zuordnungen: [
              {
                sskId: '1',
                rolleId: 'string',
                sskName: 'Schule A',
                sskDstNr: '642462',
                rolle: 'string',
                typ: OrganisationsTyp.Schule,
                administriertVon: 'string',
                editable: true,
                merkmale: [] as unknown as RollenMerkmal,
                befristung: '2025-04-05',
              },
              {
                sskId: '3',
                rolleId: 'string',
                sskName: '2b',
                sskDstNr: '642462-2b',
                rolle: 'string',
                typ: OrganisationsTyp.Klasse,
                administriertVon: '1',
                editable: true,
                merkmale: [] as unknown as RollenMerkmal,
                befristung: '2025-04-05',
              },
            ],
          },
        ],
      };

      mockadapter.onGet('/api/personen-frontend').replyOnce(200, mockPersonsResponse);

      // Update the mock POST request with the appropriate body
      const personIds: string[] = mockPersons.map((person: PersonendatensatzResponse) => person.person.id);
      mockadapter.onPost('/api/dbiam/personenuebersicht', { personIds }).replyOnce(200, mockUebersichten);

      const getAllPersonsPromise: Promise<void> = personStore.getAllPersons({});
      expect(personStore.loading).toBe(true);
      await getAllPersonsPromise;
      expect(personStore.loading).toBe(false);

      // check if the kopersnr is displayed correctly
      expect(personStore.personenWithUebersicht?.[0]?.person.personalnummer).toEqual('1234567');
      expect(personStore.personenWithUebersicht?.[1]?.person.personalnummer).toEqual('fehlt');
      expect(personStore.personenWithUebersicht?.[2]?.person.personalnummer).toEqual('---');

      // check if administrationsebenen are displayed correctly
      expect(personStore.personenWithUebersicht?.[0]?.administrationsebenen).toEqual('642462');
      expect(personStore.personenWithUebersicht?.[1]?.administrationsebenen).toEqual('Schule B');
      expect(personStore.personenWithUebersicht?.[2]?.administrationsebenen).toEqual('---');

      // check if klassen are displayed correctly
      expect(personStore.personenWithUebersicht?.[0]?.klassen).toEqual('---');
      expect(personStore.personenWithUebersicht?.[3]?.klassen).toEqual('2b');
    });

    it('should return null if no persons were found', async () => {
      // Mock response for persons
      const mockPersonsResponse: PersonFrontendControllerFindPersons200Response = {
        offset: 0,
        limit: 0,
        total: 0,
        items: [],
      };

      mockadapter.onGet('/api/personen-frontend').replyOnce(200, mockPersonsResponse);

      const getAllPersonsPromise: Promise<void> = personStore.getAllPersons({});
      expect(personStore.loading).toBe(true);
      expect(personStore.personenWithUebersicht).toEqual(null);
      await getAllPersonsPromise;
      expect(personStore.loading).toBe(false);
      expect(personStore.personenWithUebersicht).toEqual(null);
    });

    it('should load persons according to filter', async () => {
      const mockPersons: PersonendatensatzResponse[] = [
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

      const mockPersonsResponse: PersonFrontendControllerFindPersons200Response = {
        offset: 0,
        limit: 2,
        total: 2,
        items: mockPersons,
      };

      mockadapter.onGet('/api/personen-frontend').replyOnce(200, mockPersonsResponse);

      const personIds: string[] = mockPersons.map((person: PersonendatensatzResponse) => person.person.id);
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

      // Mock response for persons
      const mockPersonsResponse: PersonFrontendControllerFindPersons200Response = {
        offset: 0,
        limit: 2,
        total: 2,
        items: mockPersons,
      };
      mockadapter.onGet('/api/personen-frontend').replyOnce(200, mockPersonsResponse, {});
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
    });

    it('should handle string error', async () => {
      mockadapter.onGet('/api/personen-frontend').replyOnce(500, 'some mock server error');
      const getAllPersonPromise: Promise<void> = personStore.getAllPersons({});
      expect(personStore.loading).toBe(true);
      await getAllPersonPromise;
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
      const mockPerson: Personendatensatz = getMockPersonendatensatz();
      const mockResponse: PersonendatensatzResponse = getMockPersonendatensatzResponse();

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
      const resetPasswordPromise: Promise<void> = personStore.resetPassword(userId);
      expect(personStore.loading).toBe(true);
      await resetPasswordPromise;
      expect(personStore.newPassword).toEqual(mockResponse);
      expect(personStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      const userId: string = '2345';

      mockadapter.onPatch(`/api/personen/${userId}/password`).replyOnce(500, 'some error');
      const resetPasswordPromise: Promise<void> = personStore.resetPassword(userId);
      expect(personStore.loading).toBe(true);
      await resetPasswordPromise;
      expect(personStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(personStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      const userId: string = '2345';

      mockadapter.onPatch(`/api/personen/${userId}/password`).replyOnce(500, { code: 'some mock server error' });
      const resetPasswordPromise: Promise<void> = personStore.resetPassword(userId);
      expect(personStore.loading).toBe(true);
      await resetPasswordPromise;
      expect(personStore.errorCode).toEqual('some mock server error');
      expect(personStore.loading).toBe(false);
    });
  });

  describe('changePersonInfoById', () => {
    it('should change a person\'s metadata and update state', async () => {
      const personId: string = '1234';
      const personalnummer: string = '1234567';

      mockadapter.onPatch(`/api/personen/${personId}/personalnummer`).replyOnce(200);

      await personStore.changePersonInfoById(personId, personalnummer);

      expect(personStore.loading).toBe(false);
      expect(personStore.errorCode).toEqual('');
    });

    it('should handle string error', async () => {
      const personId: string = '1234';
      const personalnummer: string = '1234567';

      mockadapter.onPatch(`/api/personen/${personId}/personalnummer`).replyOnce(500, 'some error');

      await rejects(personStore.changePersonInfoById(personId, personalnummer));

      expect(personStore.errorCode).toEqual('ERROR_LOADING_USER');
      expect(personStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      const personId: string = '1234';
      const personalnummer: string = '1234567';

      mockadapter.onPatch(`/api/personen/${personId}/personalnummer`).replyOnce(500, { i18nKey: 'CHANGE_METADATA_ERROR' });

      await rejects(personStore.changePersonInfoById(personId, personalnummer));

      expect(personStore.errorCode).toEqual('CHANGE_METADATA_ERROR');
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
            befristung: '2025-04-05',
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

  describe('lockPerson', () => {
    it('should lock the person and update state', async () => {
      const lock: boolean = true;
      const lockedFrom: string = 'admin';

      const mockPerson: PersonendatensatzResponse = getMockPersonendatensatzResponse();

      const mockResponse: PersonLockResponse = {
        message: 'User has been successfully locked.',
      };

      mockadapter.onPut(`/api/personen/${mockPerson.person.id}/lock-user`).replyOnce(200, mockResponse);
      mockadapter.onGet(`/api/personen/${mockPerson.person.id}`).replyOnce(200, mockPerson);

      const lockPersonPromise: Promise<void> = personStore.lockPerson(mockPerson.person.id, lock, lockedFrom);
      expect(personStore.loading).toBe(true);
      expect(lockPersonPromise).resolves.toBeUndefined();
      await lockPersonPromise;
      expect(personStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      const personId: string = '1234';
      const lock: boolean = true;
      const lockedFrom: string = 'admin';

      mockadapter.onPut(`/api/personen/${personId}/lock-user`).replyOnce(500, 'some mock server error');
      const lockPersonPromise: Promise<void> = personStore.lockPerson(personId, lock, lockedFrom);
      expect(personStore.loading).toBe(true);
      await rejects(lockPersonPromise);
      expect(personStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(personStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      const personId: string = '1234';
      const lock: boolean = true;
      const lockedFrom: string = 'admin';

      mockadapter.onPut(`/api/personen/${personId}/lock-user`).replyOnce(500, { code: 'some mock server error' });
      const lockPersonPromise: Promise<void> = personStore.lockPerson(personId, lock, lockedFrom);
      expect(personStore.loading).toBe(true);
      await rejects(lockPersonPromise);
      expect(personStore.errorCode).toEqual('some mock server error');
      expect(personStore.loading).toBe(false);
    });
  });

  describe('resetState', () => {
    it('should reset state', () => {
      personStore.errorCode = 'some error';
      personStore.loading = true;
      personStore.totalPersons = 1;
      personStore.currentPerson = {
        person: {
          id: '1234',
          name: {
            familienname: 'Vimes',
            vorname: 'Samuel',
          },
        },
      } as Personendatensatz;

      personStore.resetState();
      expect(personStore.errorCode).toEqual('');
      expect(personStore.loading).toBe(false);
      expect(personStore.totalPersons).toBe(0);
      expect(personStore.currentPerson).toBe(null);
    });
  });
});
