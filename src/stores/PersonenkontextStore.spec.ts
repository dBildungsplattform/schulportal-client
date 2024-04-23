import {
  type DBiamPersonenkontextResponse,
  type DBiamPersonenuebersichtControllerFindPersonenuebersichten200Response,
  type DBiamPersonenuebersichtResponse,
  type FindRollenResponse,
  type FindSchulstrukturknotenResponse,
  type PersonFrontendControllerFindPersons200Response,
  type SystemrechtResponse,
  OrganisationResponseTypEnum,
  RolleResponseMerkmaleEnum,
  RolleResponseSystemrechteEnum,
} from '@/api-client/generated';
import ApiService from '@/services/ApiService';
import MockAdapter from 'axios-mock-adapter';
import { setActivePinia, createPinia } from 'pinia';
import { rejects } from 'assert';
import {
  usePersonenkontextStore,
  type PersonenkontextStore,
  type Uebersicht,
  type Zuordnung,
} from './PersonenkontextStore';
import {
  usePersonStore,
  type Person,
  type Personendatensatz,
  type PersonendatensatzResponse,
  type PersonStore,
} from './PersonStore';
import { computed, type ComputedRef } from 'vue';

const mockadapter: MockAdapter = new MockAdapter(ApiService);

describe('PersonenkontextStore', () => {
  let personStore: PersonStore;
  let personenkontextStore: PersonenkontextStore;
  beforeEach(() => {
    setActivePinia(createPinia());
    personStore = usePersonStore();
    personenkontextStore = usePersonenkontextStore();
    mockadapter.reset();
  });

  it('should initalize state correctly', () => {
    expect(personStore.allPersons).toEqual([]);
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
        KLASSEN_VERWALTEN: [
          {
            id: '1',
            kennung: '12345',
            name: 'Organisation 1',
            namensergaenzung: 'Ergänzung',
            kuerzel: 'O1',
            typ: OrganisationResponseTypEnum.Anbieter,
          },
        ],
        SCHULEN_VERWALTEN: [
          {
            id: '1',
            kennung: '12345',
            name: 'Organisation 1',
            namensergaenzung: 'Ergänzung',
            kuerzel: 'O1',
            typ: OrganisationResponseTypEnum.Anbieter,
          },
        ],
        PERSONEN_VERWALTEN: [
          {
            id: '1',
            kennung: '12345',
            name: 'Organisation 1',
            namensergaenzung: 'Ergänzung',
            kuerzel: 'O1',
            typ: OrganisationResponseTypEnum.Anbieter,
          },
        ],
        SCHULTRAEGER_VERWALTEN: [
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
  describe('getPersonenuebersichtById', () => {
    it('should get Personenuebersicht', async () => {
      const mockResponse: DBiamPersonenuebersichtResponse = {
        personId: '1',
        vorname: 'string',
        nachname: 'string',
        benutzername: 'string',
        zuordnungen: [
          {
            sskId: 'string',
            rolleId: 'string',
            sskName: 'string',
            sskDstNr: 'string',
            rolle: 'string',
          },
        ],
      };

      mockadapter.onGet('/api/dbiam/personenuebersicht/1').replyOnce(200, mockResponse);
      const getPersonenuebersichtByIdPromise: Promise<void> = personenkontextStore.getPersonenuebersichtById('1');
      expect(personenkontextStore.loading).toBe(true);
      await getPersonenuebersichtByIdPromise;
      expect(personenkontextStore.personenuebersicht).toEqual(mockResponse);
      expect(personenkontextStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      mockadapter.onGet('/api/dbiam/personenuebersicht/1').replyOnce(500, 'some error');
      const getPersonenuebersichtByIdPromise: Promise<void> = personenkontextStore.getPersonenuebersichtById('1');
      expect(personenkontextStore.loading).toBe(true);
      await getPersonenuebersichtByIdPromise;
      expect(personenkontextStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(personenkontextStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      mockadapter.onGet('/api/dbiam/personenuebersicht/1').replyOnce(500, { code: 'some mock server error' });
      const getPersonenuebersichtByIdPromise: Promise<void> = personenkontextStore.getPersonenuebersichtById('1');
      expect(personenkontextStore.loading).toBe(true);
      await getPersonenuebersichtByIdPromise;
      expect(personenkontextStore.errorCode).toEqual('some mock server error');
      expect(personenkontextStore.loading).toBe(false);
    });
  });
  describe('getPersonenkontextRolleWithFilter', () => {
    it('should get filtered Rollen', async () => {
      const mockResponse: FindRollenResponse = {
        moeglicheRollen: [
          {
            id: 'string',
            createdAt: '2024-03-24T16:35:32.711Z',
            updatedAt: '2024-03-24T16:35:32.711Z',
            name: 'string',
            administeredBySchulstrukturknoten: 'string',
            rollenart: 'LERN',
            merkmale: ['BEFRISTUNG_PFLICHT'] as unknown as Set<RolleResponseMerkmaleEnum>,
            systemrechte: ['ROLLEN_VERWALTEN'] as unknown as Set<RolleResponseSystemrechteEnum>,
          },
        ],
        total: 0,
      };

      mockadapter.onGet('/api/personenkontext/rollen?rolleName=str&limit=2').replyOnce(200, mockResponse);
      const getPersonenkontextRolleWithFilterPromise: Promise<void> =
        personenkontextStore.getPersonenkontextRolleWithFilter('str', 2);
      expect(personenkontextStore.loading).toBe(true);
      await getPersonenkontextRolleWithFilterPromise;
      expect(personenkontextStore.filteredRollen).toEqual(mockResponse);
      expect(personenkontextStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      mockadapter.onGet('/api/personenkontext/rollen?rolleName=str&limit=2').replyOnce(500, 'some mock server error');
      const getPersonenkontextRolleWithFilterPromise: Promise<void> =
        personenkontextStore.getPersonenkontextRolleWithFilter('str', 2);
      expect(personenkontextStore.loading).toBe(true);
      await rejects(getPersonenkontextRolleWithFilterPromise);
      expect(personenkontextStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(personenkontextStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      mockadapter
        .onGet('/api/personenkontext/rollen?rolleName=str&limit=2')
        .replyOnce(500, { code: 'some mock server error' });
      const getPersonenkontextRolleWithFilterPromise: Promise<void> =
        personenkontextStore.getPersonenkontextRolleWithFilter('str', 2);
      expect(personenkontextStore.loading).toBe(true);
      await rejects(getPersonenkontextRolleWithFilterPromise);
      expect(personenkontextStore.errorCode).toEqual('some mock server error');
      expect(personenkontextStore.loading).toBe(false);
    });
  });
  describe('getPersonenkontextAdministrationsebeneWithFilter', () => {
    it('should get filtered Administrationsebenen', async () => {
      const mockResponse: FindSchulstrukturknotenResponse = {
        moeglicheSsks: [
          {
            id: 'string',
            kennung: 'string',
            name: 'Organisation1',
            namensergaenzung: 'string',
            kuerzel: 'string',
            typ: 'TRAEGER',
          },
        ],
        total: 0,
      };
      mockadapter
        .onGet('/api/personenkontext/schulstrukturknoten?rolleId=1&sskName=Org&limit=2')
        .replyOnce(200, mockResponse);
      const getPersonenkontextAdministrationsebeneWithFilterPromise: Promise<void> =
        personenkontextStore.getPersonenkontextAdministrationsebeneWithFilter('1', 'Org', 2);
      expect(personenkontextStore.loading).toBe(true);
      await getPersonenkontextAdministrationsebeneWithFilterPromise;
      expect(personenkontextStore.filteredOrganisationen).toEqual(mockResponse);
      expect(personenkontextStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      mockadapter
        .onGet('/api/personenkontext/schulstrukturknoten?rolleId=1&sskName=Org&limit=2')
        .replyOnce(500, 'some mock server error');
      const getPersonenkontextAdministrationsebeneWithFilterPromise: Promise<void> =
        personenkontextStore.getPersonenkontextAdministrationsebeneWithFilter('1', 'Org', 2);
      expect(personenkontextStore.loading).toBe(true);
      await rejects(getPersonenkontextAdministrationsebeneWithFilterPromise);
      expect(personenkontextStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(personenkontextStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      mockadapter
        .onGet('/api/personenkontext/schulstrukturknoten?rolleId=1&sskName=Org&limit=2')
        .replyOnce(500, { code: 'some mock server error' });
      const getPersonenkontextAdministrationsebeneWithFilterPromise: Promise<void> =
        personenkontextStore.getPersonenkontextAdministrationsebeneWithFilter('1', 'Org', 2);
      expect(personenkontextStore.loading).toBe(true);
      await rejects(getPersonenkontextAdministrationsebeneWithFilterPromise);
      expect(personenkontextStore.errorCode).toEqual('some mock server error');
      expect(personenkontextStore.loading).toBe(false);
    });
  });
  describe('getAllPersonenuebersichte', () => {
    it('should get All Personenuebersicht', async () => {
      const mockResponse: DBiamPersonenuebersichtControllerFindPersonenuebersichten200Response = {
        total: 0,
        offset: 0,
        limit: 0,
        items: [
          {
            personId: '1234',
            vorname: 'Samuel',
            nachname: 'Vimes',
            benutzername: 'string',
            zuordnungen: [
              {
                sskId: 'string',
                rolleId: 'string',
                sskName: 'string',
                sskDstNr: 'string',
                rolle: 'string',
              },
            ],
          },
        ],
      };
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
      ] as PersonendatensatzResponse[];

      const mockPersonsResponse: PersonFrontendControllerFindPersons200Response = {
        offset: 0,
        limit: 2,
        total: 2,
        items: mockPersons,
      };

      type PersonenWithRolleAndZuordnung = {
        rollen: string;
        administrationsebenen: string;
        person: Person;
      }[];

      const personenWithUebersicht: ComputedRef<PersonenWithRolleAndZuordnung> = computed(() => {
        return personStore.allPersons.map((person: Personendatensatz) => {
          const uebersicht: Uebersicht = personenkontextStore.allUebersichten?.items.find(
            (ueb: Uebersicht) => ueb?.personId === person.person.id,
          );
          const rollen: string = uebersicht?.zuordnungen.length
            ? uebersicht.zuordnungen.map((zuordnung: Zuordnung) => zuordnung.rolle).join(', ')
            : '---';
          // Choose sskDstNr if available, otherwise sskName.
          const administrationsebenen: string = uebersicht?.zuordnungen.length
            ? uebersicht.zuordnungen
                .map((zuordnung: Zuordnung) => (zuordnung.sskDstNr ? zuordnung.sskDstNr : zuordnung.sskName))
                .join(', ')
            : '---';
          // Check if personalnummer is null, if so, replace it with "---"
          const personalnummer: string = person.person.personalnummer ?? '---';
          return {
            ...person,
            rollen: rollen,
            administrationsebenen: administrationsebenen,
            person: { ...person.person, personalnummer: personalnummer },
          };
        });
      });
      mockadapter.onGet('/api/dbiam/personenuebersicht').replyOnce(200, mockResponse);
      mockadapter.onGet('/api/personen-frontend').replyOnce(200, mockPersonsResponse, {});
      const getAllPersonenuebersichtenPromise: Promise<void> = personenkontextStore.getAllPersonenuebersichten();
      const getAllPersonPromise: Promise<void> = personStore.getAllPersons();
      expect(personenkontextStore.loading).toBe(true);
      await getAllPersonPromise;
      await getAllPersonenuebersichtenPromise;
      expect(personenkontextStore.allUebersichten).toEqual(mockResponse);
      expect(personenWithUebersicht.value.at(0)?.person.name.familienname).toEqual('Vimes');
      expect(personenkontextStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      mockadapter.onGet('/api/dbiam/personenuebersicht').replyOnce(500, 'some error');
      const getAllPersonenuebersichtenPromise: Promise<void> = personenkontextStore.getAllPersonenuebersichten();
      expect(personenkontextStore.loading).toBe(true);
      await getAllPersonenuebersichtenPromise;
      expect(personenkontextStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(personenkontextStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      mockadapter.onGet('/api/dbiam/personenuebersicht').replyOnce(500, { code: 'some mock server error' });
      const getAllPersonenuebersichtenPromise: Promise<void> = personenkontextStore.getAllPersonenuebersichten();
      expect(personenkontextStore.loading).toBe(true);
      await getAllPersonenuebersichtenPromise;
      expect(personenkontextStore.errorCode).toEqual('some mock server error');
      expect(personenkontextStore.loading).toBe(false);
    });
  });
});
