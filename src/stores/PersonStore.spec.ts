/* eslint-disable @typescript-eslint/typedef */
import {
  EmailAddressStatus,
  OrganisationsTyp,
  RollenArt,
  RollenMerkmal,
  Vertrauensstufe,
  type DBiamPersonenuebersichtControllerFindPersonenuebersichten200Response,
  type DBiamPersonenuebersichtResponse,
  type LockUserBodyParams,
  type PersonFrontendControllerFindPersons200Response,
  type PersonLockResponse,
  type PersonMetadataBodyParams,
  type PersonendatensatzResponse,
} from '@/api-client/generated';
import { PersonLockOccasion, usePersonStore, type PersonStore, type Personendatensatz } from './PersonStore';
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
      userLock: [
        {
          personId: '1',
          created_at: '2024-12-22',
          lock_occasion: PersonLockOccasion.MANUELL_GESPERRT,
          locked_by: 'ME',
          locked_until: '2024-12-22',
        },
        {
          personId: '2',
          created_at: '2024-12-22',
          lock_occasion: PersonLockOccasion.KOPERS_GESPERRT,
          locked_by: 'Cron',
          locked_until: '2024-12-22',
        },
      ],
      revision: '1',
      lastModified: '2024-12-22',
      email: {
        address: 'email',
        status: EmailAddressStatus.Requested,
      },
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
      userLock: [
        {
          personId: '1',
          created_at: '2024-12-22',
          lock_occasion: PersonLockOccasion.MANUELL_GESPERRT,
          locked_by: 'ME',
          locked_until: '2024-12-22',
        },
        {
          personId: '2',
          created_at: '2024-12-22',
          lock_occasion: PersonLockOccasion.KOPERS_GESPERRT,
          locked_by: 'Cron',
          locked_until: '2024-12-22',
        },
      ],
    },
  };
}

function getUserLockBodyParams(lock: boolean): LockUserBodyParams {
  return {
    lock: lock,
    locked_by: 'Alfred Admin',
    locked_until: undefined,
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
            userLock: null,
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
            userLock: null,
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
            userLock: null,
            revision: '1',
            lastModified: '2024-12-22',
          },
        },
        {
          person: {
            id: '3755',
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
        {
          person: {
            id: '3975',
            name: {
              familienname: 'Jardy',
              vorname: 'Heff',
            },
            referrer: 'hjardy',
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
                rollenArt: RollenArt.Lern,
                typ: OrganisationsTyp.Schule,
                administriertVon: 'string',
                editable: true,
                merkmale: ['KOPERS_PFLICHT'] as unknown as RollenMerkmal,
                befristung: '2025-04-05',
                admins: ['test'],
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
                rollenArt: RollenArt.Lern,
                typ: OrganisationsTyp.Schule,
                administriertVon: 'string',
                editable: true,
                merkmale: ['KOPERS_PFLICHT'] as unknown as RollenMerkmal,
                befristung: '2025-04-05',
                admins: ['test'],
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
            personId: '3755',
            vorname: 'Hatt',
            nachname: 'Mardy',
            benutzername: 'hmardy',
            lastModifiedZuordnungen: '08.02.2024',
            zuordnungen: [
              {
                sskId: '1',
                rolleId: '3',
                sskName: 'Schule A',
                sskDstNr: '642462',
                rolle: 'SuS',
                rollenArt: RollenArt.Lern,
                typ: OrganisationsTyp.Schule,
                administriertVon: 'string',
                editable: true,
                merkmale: [] as unknown as RollenMerkmal,
                befristung: '2025-04-05',
                admins: ['test'],
              },
              {
                sskId: '3',
                rolleId: '3',
                sskName: '2b',
                sskDstNr: '642462-2b',
                rolle: 'SuS',
                rollenArt: RollenArt.Lern,
                typ: OrganisationsTyp.Klasse,
                administriertVon: '1',
                editable: true,
                merkmale: [] as unknown as RollenMerkmal,
                befristung: '2025-04-05',
                admins: ['test'],
              },
            ],
          },
          {
            personId: '3975',
            vorname: 'Heff',
            nachname: 'Jardy',
            benutzername: 'hjardy',
            lastModifiedZuordnungen: '08.02.2024',
            zuordnungen: [
              {
                sskId: '1',
                rolleId: '3',
                sskName: 'Schule A',
                sskDstNr: '642462',
                rolle: 'SuS',
                rollenArt: RollenArt.Lern,
                typ: OrganisationsTyp.Schule,
                administriertVon: 'string',
                editable: true,
                merkmale: [] as unknown as RollenMerkmal,
                befristung: '2025-04-05',
                admins: ['test'],
              },
              {
                sskId: '3',
                rolleId: '3',
                sskName: '',
                sskDstNr: '642462-2b',
                rolle: 'SuS',
                rollenArt: RollenArt.Lern,
                typ: OrganisationsTyp.Klasse,
                administriertVon: '1',
                editable: true,
                merkmale: [] as unknown as RollenMerkmal,
                befristung: '2025-04-05',
                admins: ['test'],
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
      expect(personStore.personenWithUebersicht?.[4]?.klassen).toEqual('---');
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

      const personIds: Array<string> = mockPersons.map((person: PersonendatensatzResponse) => person.person.id);
      mockadapter
        .onPost('/api/dbiam/personenuebersicht', { personIds })
        .replyOnce(500, { code: 'some mock server error' });

      const getAllPersonsPromise: Promise<void> = personStore.getAllPersons({});
      expect(personStore.loading).toBe(true);
      await getAllPersonsPromise;
      expect(personStore.errorCode).toEqual('some mock server error');
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
      mockadapter.onPost('/api/dbiam/personenuebersicht', { personIds }).replyOnce(500, 'some mock server error');

      const getAllPersonsPromise: Promise<void> = personStore.getAllPersons({});
      expect(personStore.loading).toBe(true);
      await getAllPersonsPromise;
      expect(personStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(personStore.loading).toBe(false);
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
      mockPerson.person.userLock!.forEach((lock) => {
        const lockDate = new Date(lock.locked_until);
        // Adjust date for MESZ (German summer time) if necessary
        if (lockDate.getTimezoneOffset() >= -120) {
          lockDate.setDate(lockDate.getDate() - 1);
        }
        const createdAt = new Date(lock.created_at);
        lock.locked_until = lockDate.toLocaleDateString('de-DE');
        lock.created_at = createdAt.toLocaleDateString('de-DE');
      });
      expect(currentPerson).toEqual(
        expect.objectContaining({
          // Include only the relevant properties you want to check
          person: expect.objectContaining({
            id: mockPerson.person.id,
            email: mockPerson.person.email,
            name: mockPerson.person.name,
            // Add any other properties that you want to check from currentPerson
            userLock: expect.arrayContaining([
              expect.objectContaining({
                lock_occasion: PersonLockOccasion.MANUELL_GESPERRT,
                locked_by: mockPerson.person.userLock![0]!.locked_by,
                locked_until: mockPerson.person.userLock![0]!.locked_until,
                created_at: mockPerson.person.userLock![0]!.created_at,
              }),
              expect.objectContaining({
                lock_occasion: PersonLockOccasion.KOPERS_GESPERRT,
              }),
            ]),
          }),
        }),
      );
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

  describe('bulkResetPassword', () => {
    it('should reset and return passwords', async () => {
      const userIds: Array<string> = [
        'bd5c231b-5171-49f4-a3c2-cb9fb470ed91',
        'f4e64f48-f1cf-463e-958f-ffd68e712713',
        'ede4055b-e18a-4f1a-9bce-9e8871772229',
      ];
      const mockResponse: string = 'fakePassword';
      mockadapter.onPatch(`/api/personen/${userIds[0]}/password`).replyOnce(200, mockResponse);
      mockadapter.onPatch(`/api/personen/${userIds[1]}/password`).replyOnce(200, mockResponse);
      mockadapter.onPatch(`/api/personen/${userIds[2]}/password`).replyOnce(500, new Error());
      const resetPasswordPromise: Promise<void> = personStore.bulkResetPassword(userIds);

      await resetPasswordPromise;

      expect(personStore.loading).toBe(false);
      expect(personStore.bulkResetPasswordResult?.complete).toBe(true);
      expect(personStore.bulkResetPasswordResult?.progress).toBe(1);
      expect(personStore.bulkResetPasswordResult?.errors.size).toBe(1);
      expect(personStore.bulkResetPasswordResult?.errors.get(userIds[2]!)).toBe('UNSPECIFIED_ERROR');
      expect(personStore.bulkResetPasswordResult?.passwords.size).toBe(2);
      expect(personStore.bulkResetPasswordResult?.passwords.get(userIds[0]!)).toBe(mockResponse);
      expect(personStore.bulkResetPasswordResult?.passwords.get(userIds[1]!)).toBe(mockResponse);
    });
  });

  describe('resetDevicePassword', () => {
    it('should reset and return device password when given a personId', async () => {
      const userId: string = '2345';
      const mockResponse: string = 'fakePassword';

      mockadapter.onPatch(`/api/personen/${userId}/uem-password`).replyOnce(202, mockResponse);
      const resetDevicePasswordPromise: Promise<void> = personStore.resetDevicePassword(userId);
      expect(personStore.loading).toBe(true);
      await resetDevicePasswordPromise;
      expect(personStore.newDevicePassword).toEqual(mockResponse);
      expect(personStore.loading).toBe(false);
    });

    it('should reset and return device password without a personId', async () => {
      const mockResponse: string = 'fakePassword';

      mockadapter.onPatch(`/api/personen/uem-password`).replyOnce(202, mockResponse);
      const resetDevicePasswordPromise: Promise<void> = personStore.resetDevicePassword();
      expect(personStore.loading).toBe(true);
      await resetDevicePasswordPromise;
      expect(personStore.newDevicePassword).toEqual(mockResponse);
      expect(personStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      const userId: string = '2345';

      mockadapter.onPatch(`/api/personen/${userId}/uem-password`).replyOnce(500, 'some error');
      const resetDevicePasswordPromise: Promise<void> = personStore.resetDevicePassword(userId);
      expect(personStore.loading).toBe(true);
      await resetDevicePasswordPromise;
      expect(personStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(personStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      const userId: string = '2345';

      mockadapter.onPatch(`/api/personen/${userId}/uem-password`).replyOnce(500, { i18nKey: 'SOME_MOCK_ERROR' });
      const resetDevicePasswordPromise: Promise<void> = personStore.resetDevicePassword(userId);
      expect(personStore.loading).toBe(true);
      await resetDevicePasswordPromise;
      expect(personStore.errorCode).toEqual('SOME_MOCK_ERROR');
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
            rollenArt: RollenArt.Lern,
            typ: OrganisationsTyp.Klasse,
            administriertVon: 'string',
            editable: true,
            merkmale: [] as unknown as RollenMerkmal,
            befristung: '2025-04-05',
            admins: ['test'],
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
      const mockPerson: PersonendatensatzResponse = getMockPersonendatensatzResponse();

      const mockResponse: PersonLockResponse = {
        message: 'User has been successfully locked.',
      };

      mockadapter.onPut(`/api/personen/${mockPerson.person.id}/lock-user`).replyOnce(200, mockResponse);
      mockadapter.onGet(`/api/personen/${mockPerson.person.id}`).replyOnce(200, mockPerson);

      const lockUserBodyParams: LockUserBodyParams = getUserLockBodyParams(true);
      const lockPersonPromise: Promise<void> = personStore.lockPerson(mockPerson.person.id, lockUserBodyParams);
      expect(personStore.loading).toBe(true);
      expect(lockPersonPromise).resolves.toBeUndefined();
      await lockPersonPromise;
      expect(personStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      const personId: string = '1234';

      mockadapter.onPut(`/api/personen/${personId}/lock-user`).replyOnce(500, 'some mock server error');
      const lockUserBodyParams: LockUserBodyParams = getUserLockBodyParams(true);
      const lockPersonPromise: Promise<void> = personStore.lockPerson(personId, lockUserBodyParams);
      expect(personStore.loading).toBe(true);
      await expect(lockPersonPromise).rejects.toEqual('UNSPECIFIED_ERROR');
      expect(personStore.loading).toBe(false);
      expect(personStore.errorCode).toBe('UNSPECIFIED_ERROR');
    });

    it('should handle error code', async () => {
      const personId: string = '1234';

      mockadapter.onPut(`/api/personen/${personId}/lock-user`).replyOnce(500, { code: 'LOCK_FAILED_ERROR' });
      const lockUserBodyParams: LockUserBodyParams = getUserLockBodyParams(true);
      const lockPersonPromise: Promise<void> = personStore.lockPerson(personId, lockUserBodyParams);
      expect(personStore.loading).toBe(true);
      await expect(lockPersonPromise).rejects.toEqual('LOCK_FAILED_ERROR');
      expect(personStore.loading).toBe(false);
      expect(personStore.errorCode).toEqual('LOCK_FAILED_ERROR');
    });
  });

  describe('syncPersonById', () => {
    it('should sync a person', async () => {
      const personId: string = '1234';

      mockadapter.onPost(`/api/personen/${personId}/sync`).replyOnce(200);

      await personStore.syncPersonById(personId);

      expect(personStore.loading).toBe(false);
      expect(personStore.errorCode).toEqual('');
    });

    it('should handle string error', async () => {
      const personId: string = '1234';

      mockadapter.onPost(`/api/personen/${personId}/sync`).replyOnce(500, 'some error');

      await personStore.syncPersonById(personId);

      expect(personStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(personStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      const personId: string = '1234';

      mockadapter.onPost(`/api/personen/${personId}/sync`).replyOnce(500, { code: 'some mock server error' });

      await personStore.syncPersonById(personId);

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

  describe('changePersonMetaDataById', () => {
    it('should update person metadata and set patchedPerson', async () => {
      const personId = '1234';
      const vorname = 'Samuel';
      const familienname = 'Vimes';
      const personalnummer = '9876';

      const mockCurrentPerson: Personendatensatz = {
        person: {
          id: personId,
          name: {
            familienname: 'Old',
            vorname: 'Name',
          },
          revision: '1',
          lastModified: '2099-01-01',
          referrer: '6978',
          personalnummer: personalnummer,
          isLocked: false,
          userLock: null,
          email: {
            address: 'email',
            status: EmailAddressStatus.Requested,
          },
        },
      };

      personStore.currentPerson = mockCurrentPerson;

      const mockResponse: PersonendatensatzResponse = {
        person: {
          id: personId,
          name: {
            familienname,
            vorname,
          },
          personalnummer,
          revision: '2',
          lastModified: '2099-01-02',
          referrer: '6978',
          isLocked: false,
          userLock: null,
          mandant: '',
          geburt: {},
          stammorganisation: '',
          geschlecht: '',
          lokalisierung: '',
          vertrauensstufe: Vertrauensstufe.Teil,
          startpasswort: '',
          email: {
            address: 'email',
            status: EmailAddressStatus.Requested,
          },
        },
      };

      const expectedBodyParams: PersonMetadataBodyParams = {
        vorname,
        familienname,
        personalnummer,
        revision: '1',
        lastModified: '2099-01-01',
      };

      mockadapter.onPatch(`/api/personen/${personId}/metadata`).reply((config) => {
        expect(JSON.parse(config.data)).toEqual(expectedBodyParams);
        return [200, mockResponse];
      });

      await personStore.changePersonMetadataById(personId, vorname, familienname, personalnummer);

      expect(personStore.loading).toBe(false);
      expect(personStore.patchedPerson).toEqual(mockResponse);
      expect(personStore.errorCode).toEqual('');
    });

    it('should handle error and set errorCode', async () => {
      const personId: string = '1234';
      const vorname: string = 'Samuel';
      const familienname: string = 'Vimes';

      mockadapter.onPatch(`/api/personen/${personId}/metadata`).reply(500, { i18nKey: 'ERROR_UPDATING_USER' });

      await personStore.changePersonMetadataById(personId, vorname, familienname);

      expect(personStore.loading).toBe(false);
      expect(personStore.errorCode).toEqual('ERROR_UPDATING_USER');
    });

    it('should handle unknown error', async () => {
      const personId: string = '1234';
      const vorname: string = 'Samuel';
      const familienname: string = 'Vimes';

      mockadapter.onPatch(`/api/personen/${personId}/metadata`).reply(500, 'Unknown error');

      await personStore.changePersonMetadataById(personId, vorname, familienname);

      expect(personStore.loading).toBe(false);
      expect(personStore.errorCode).toEqual('ERROR_LOADING_USER');
    });
  });
});
