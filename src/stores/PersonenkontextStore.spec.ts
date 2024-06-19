import {
  type DBiamPersonenkontextResponse,
  type DBiamPersonenuebersichtControllerFindPersonenuebersichten200Response,
  type DBiamPersonenuebersichtResponse,
  type FindRollenResponse,
  type FindSchulstrukturknotenResponse,
  type SystemrechtResponse,
  OrganisationsTyp,
  RollenMerkmal,
  RollenSystemRecht,
} from '@/api-client/generated';
import ApiService from '@/services/ApiService';
import MockAdapter from 'axios-mock-adapter';
import { setActivePinia, createPinia } from 'pinia';
import { rejects } from 'assert';
import { PersonenKontextTyp, usePersonenkontextStore, type PersonenkontextStore } from './PersonenkontextStore';
import { usePersonStore, type PersonStore } from './PersonStore';

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
            administriertVon: '1',
            typ: OrganisationsTyp.Anbieter,
          },
        ],
        KLASSEN_VERWALTEN: [
          {
            id: '1',
            kennung: '12345',
            name: 'Organisation 1',
            namensergaenzung: 'Ergänzung',
            kuerzel: 'O1',
            administriertVon: '1',
            typ: OrganisationsTyp.Anbieter,
          },
        ],
        SCHULEN_VERWALTEN: [
          {
            id: '1',
            kennung: '12345',
            name: 'Organisation 1',
            namensergaenzung: 'Ergänzung',
            kuerzel: 'O1',
            administriertVon: '1',
            typ: OrganisationsTyp.Anbieter,
          },
        ],
        PERSONEN_VERWALTEN: [
          {
            id: '1',
            kennung: '12345',
            name: 'Organisation 1',
            namensergaenzung: 'Ergänzung',
            kuerzel: 'O1',
            administriertVon: '1',
            typ: OrganisationsTyp.Anbieter,
          },
        ],
        SCHULTRAEGER_VERWALTEN: [
          {
            id: '1',
            kennung: '12345',
            name: 'Organisation 1',
            namensergaenzung: 'Ergänzung',
            kuerzel: 'O1',
            administriertVon: '1',
            typ: OrganisationsTyp.Anbieter,
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

  describe('createPersonenkontextForSchule', () => {
    it('should create a Personenkontext for the Schule', async () => {
      const mockPersonenkontext: DBiamPersonenkontextResponse = {
        personId: '12345',
        organisationId: '67890',
        rolleId: '54321',
      } as DBiamPersonenkontextResponse;

      const mockResponse: DBiamPersonenkontextResponse = mockPersonenkontext;

      mockadapter.onPost('/api/dbiam/personenkontext').replyOnce(201, mockResponse);
      const createPersonenkontextPromise: Promise<DBiamPersonenkontextResponse> =
        personenkontextStore.createPersonenkontext(
          {
            personId: '12345',
            organisationId: '67890',
            rolleId: '54321',
          },
          PersonenKontextTyp.Organisation,
        );
      expect(personenkontextStore.loading).toBe(true);
      const createdPersonenkontext: DBiamPersonenkontextResponse = await createPersonenkontextPromise;
      expect(createdPersonenkontext).toEqual(mockPersonenkontext);
      expect(personenkontextStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      mockadapter.onPost('/api/dbiam/personenkontext').replyOnce(500, 'some mock server error');
      const createPersonenkontextPromise: Promise<DBiamPersonenkontextResponse> =
        personenkontextStore.createPersonenkontext(
          {
            personId: '12345',
            organisationId: '67890',
            rolleId: '54321',
          },
          PersonenKontextTyp.Organisation,
        );
      expect(personenkontextStore.loading).toBe(true);
      await rejects(createPersonenkontextPromise);
      expect(personenkontextStore.errorCode).toEqual('PERSONENKONTEXT_SPECIFICATION_ERROR');
      expect(personenkontextStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      mockadapter.onPost('/api/dbiam/personenkontext').replyOnce(500, { i18nKey: 'SOME_MOCK_SERVER_ERROR' });
      const createPersonenkontextPromise: Promise<DBiamPersonenkontextResponse> =
        personenkontextStore.createPersonenkontext(
          {
            personId: '12345',
            organisationId: '67890',
            rolleId: '54321',
          },
          PersonenKontextTyp.Organisation,
        );
      expect(personenkontextStore.loading).toBe(true);
      await rejects(createPersonenkontextPromise);
      expect(personenkontextStore.errorCode).toEqual('SOME_MOCK_SERVER_ERROR');
      expect(personenkontextStore.loading).toBe(false);
    });
  });
  describe('createPersonenkontextForKlasse', () => {
    it('should create a Personenkontext for the Klasse', async () => {
      const mockPersonenkontext: DBiamPersonenkontextResponse = {
        personId: '12345',
        organisationId: '67890',
        rolleId: '54321',
      } as DBiamPersonenkontextResponse;

      const mockResponse: DBiamPersonenkontextResponse = mockPersonenkontext;

      mockadapter.onPost('/api/dbiam/personenkontext').replyOnce(201, mockResponse);
      const createPersonenkontextPromise: Promise<DBiamPersonenkontextResponse> =
        personenkontextStore.createPersonenkontext(
          {
            personId: '12345',
            organisationId: '67890',
            rolleId: '54321',
          },
          PersonenKontextTyp.Klasse,
        );
      expect(personenkontextStore.loading).toBe(true);
      const createdPersonenkontext: DBiamPersonenkontextResponse = await createPersonenkontextPromise;
      expect(createdPersonenkontext).toEqual(mockPersonenkontext);
      expect(personenkontextStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      mockadapter.onPost('/api/dbiam/personenkontext').replyOnce(500, 'some error');
      const createPersonenkontextPromise: Promise<DBiamPersonenkontextResponse> =
        personenkontextStore.createPersonenkontext(
          {
            personId: '12345',
            organisationId: '67890',
            rolleId: '54321',
          },
          PersonenKontextTyp.Klasse,
        );
      expect(personenkontextStore.loading).toBe(true);
      await rejects(createPersonenkontextPromise);
      expect(personenkontextStore.errorCode).toEqual('PERSONENKONTEXT_SPECIFICATION_ERROR');
      expect(personenkontextStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      mockadapter.onPost('/api/dbiam/personenkontext').replyOnce(500, { i18nKey: 'SOME_MOCK_SERVER_ERROR' });
      const createPersonenkontextPromise: Promise<DBiamPersonenkontextResponse> =
        personenkontextStore.createPersonenkontext(
          {
            personId: '12345',
            organisationId: '67890',
            rolleId: '54321',
          },
          PersonenKontextTyp.Klasse,
        );
      expect(personenkontextStore.loading).toBe(true);
      await rejects(createPersonenkontextPromise);
      expect(personenkontextStore.errorCode).toEqual('SOME_MOCK_SERVER_ERROR');
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
            typ: OrganisationsTyp.Klasse,
            administriertVon: 'string',
            editable: true,
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
            merkmale: ['BEFRISTUNG_PFLICHT'] as unknown as Set<RollenMerkmal>,
            systemrechte: ['ROLLEN_VERWALTEN'] as unknown as Set<RollenSystemRecht>,
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
            administriertVon: '1',
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
                typ: OrganisationsTyp.Klasse,
                administriertVon: 'string',
                editable: true,
              },
            ],
          },
        ],
      };
      mockadapter.onGet('/api/dbiam/personenuebersicht').replyOnce(200, mockResponse);
      const getAllPersonenuebersichtenPromise: Promise<void> = personenkontextStore.getAllPersonenuebersichten();
      expect(personenkontextStore.loading).toBe(true);
      await getAllPersonenuebersichtenPromise;
      expect(personenkontextStore.allUebersichten).toEqual(mockResponse);
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
