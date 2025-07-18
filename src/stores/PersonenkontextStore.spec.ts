import {
  OrganisationsTyp,
  RollenMerkmal,
  RollenSystemRecht,
  type DBiamPersonenkontextResponse,
  type FindRollenResponse,
  type SystemrechtResponse,
} from '@/api-client/generated';
import ApiService from '@/services/ApiService';
import { rejects } from 'assert';
import MockAdapter from 'axios-mock-adapter';
import { createPinia, setActivePinia } from 'pinia';
import {
  usePersonenkontextStore,
  type PersonenkontexteUpdateResponse,
  type PersonenkontextStore,
  type PersonenkontextWorkflowResponse,
  type PersonenkontextUpdate,
  OperationContext,
  type WorkflowFilter,
} from './PersonenkontextStore';
import { usePersonStore, type PersonendatensatzResponse, type PersonStore } from './PersonStore';
import { DoFactory } from 'test/DoFactory';
import { PersonenUebersicht } from './types/PersonenUebersicht';
import type { Zuordnung } from './types/Zuordnung';
import type { Organisation } from './OrganisationStore';

const mockadapter: MockAdapter = new MockAdapter(ApiService);

describe('PersonenkontextStore', () => {
  let personenkontextStore: PersonenkontextStore;
  let personStore: PersonStore;

  const mockPersonId: string = '1';
  const mockSchule: Organisation = DoFactory.getSchule();
  const mockSchuleZuordnung: Zuordnung = DoFactory.getZuordnung({}, { organisation: mockSchule });
  const person: PersonenUebersicht = new PersonenUebersicht(
    mockPersonId,
    'John',
    'Doe',
    'jdoe',
    '2024-03-24T16:35:32.711Z',
    [mockSchuleZuordnung],
  );

  beforeEach(() => {
    setActivePinia(createPinia());
    personenkontextStore = usePersonenkontextStore();
    personStore = usePersonStore();
    mockadapter.reset();

    personStore.personenuebersicht = person;
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

  describe('processWorkflowStep', () => {
    const getUrl = (filter: WorkflowFilter): string => {
      const { operationContext, organisationId, rollenIds, rolleName, organisationName, limit }: WorkflowFilter =
        filter;
      let url: string = `/api/personenkontext-workflow/step?operationContext=${operationContext}`;
      if (organisationId) {
        url += `&organisationId=${organisationId}`;
      }
      if (rollenIds) {
        rollenIds.forEach((rolleId: string) => (url += `&rollenIds=${rolleId}`));
      }
      if (rolleName) {
        url += `&rolleName=${rolleName}`;
      }
      if (organisationName) {
        url += `&organisationName=${organisationName}`;
      }
      if (limit) {
        url += `&limit=${limit}`;
      }
      return url;
    };

    describe.each([[OperationContext.PERSON_ANLEGEN], [OperationContext.PERSON_BEARBEITEN]])(
      'when operationContext is %s',
      (operationContext: OperationContext) => {
        const mockResponse: PersonenkontextWorkflowResponse = {
          organisations: [
            {
              id: '1',
              administriertVon: 'string',
              kennung: 'string',
              name: 'string',
              namensergaenzung: 'string',
              kuerzel: 'string',
              typ: OrganisationsTyp.Schule,
            },
          ],
          rollen: [],
          selectedOrganisation: '1',
          selectedRollen: ['1'],
          canCommit: true,
        };
        it('should get step', async () => {
          mockadapter.onGet(getUrl({ operationContext })).replyOnce(200, mockResponse);
          const getPersonenkontextWorkFlowStep: Promise<void> = personenkontextStore.processWorkflowStep({
            operationContext,
          });
          expect(personenkontextStore.loading).toBe(true);
          await getPersonenkontextWorkFlowStep;
          expect(personenkontextStore.workflowStepResponse).toEqual(mockResponse);
          expect(personenkontextStore.loading).toBe(false);
        });

        it('should get step with parameters', async () => {
          mockadapter
            .onGet(getUrl({ operationContext, organisationId: '1', rollenIds: ['1'] }))
            .replyOnce(200, mockResponse);
          const getPersonenkontextWorkFlowStep: Promise<void> = personenkontextStore.processWorkflowStep({
            operationContext,
            organisationId: '1',
            rollenIds: ['1'],
          });
          expect(personenkontextStore.loading).toBe(true);
          await getPersonenkontextWorkFlowStep;
          expect(personenkontextStore.workflowStepResponse).toEqual(mockResponse);
          expect(personenkontextStore.loading).toBe(false);
        });

        it('should handle string error', async () => {
          mockadapter.onGet(getUrl({ operationContext })).replyOnce(500, 'some error');
          const getPersonenkontextWorkFlowStep: Promise<void> = personenkontextStore.processWorkflowStep({
            operationContext,
          });
          expect(personenkontextStore.loading).toBe(true);
          await getPersonenkontextWorkFlowStep;
          expect(personenkontextStore.errorCode).toEqual('UNSPECIFIED_ERROR');
          expect(personenkontextStore.loading).toBe(false);
        });

        it('should handle error code', async () => {
          mockadapter.onGet(getUrl({ operationContext })).replyOnce(500, { code: 'some mock server error' });
          const getPersonenkontextWorkFlowStep: Promise<void> = personenkontextStore.processWorkflowStep({
            operationContext,
          });
          expect(personenkontextStore.loading).toBe(true);
          await getPersonenkontextWorkFlowStep;
          expect(personenkontextStore.errorCode).toEqual('some mock server error');
          expect(personenkontextStore.loading).toBe(false);
        });
      },
    );
  });

  describe('processWorkflowStepLandesbedienstete', () => {
    const getUrl = (filter: WorkflowFilter): string => {
      const { organisationId, rollenIds, rolleName, organisationName, limit }: WorkflowFilter = filter;
      let url: string = '/api/landesbediensteter/step';
      const params: string[] = [];

      if (organisationId) {
        params.push(`organisationId=${organisationId}`);
      }
      if (rollenIds) {
        rollenIds.forEach((rolleId: string) => params.push(`rollenIds=${rolleId}`));
      }
      if (rolleName) {
        params.push(`rolleName=${rolleName}`);
      }
      if (organisationName) {
        params.push(`organisationName=${organisationName}`);
      }
      if (limit) {
        params.push(`limit=${limit}`);
      }

      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }

      return url;
    };

    const mockResponse: PersonenkontextWorkflowResponse = {
      organisations: [
        {
          id: '1',
          administriertVon: 'string',
          kennung: 'string',
          name: 'string',
          namensergaenzung: 'string',
          kuerzel: 'string',
          typ: OrganisationsTyp.Schule,
        },
      ],
      rollen: [],
      selectedOrganisation: '1',
      selectedRollen: ['1'],
      canCommit: true,
    };

    it('should get step successfully', async () => {
      const filter: WorkflowFilter = { organisationId: '1' };
      mockadapter.onGet(getUrl(filter)).replyOnce(200, mockResponse);

      const processWorkflowStep: Promise<void> = personenkontextStore.processWorkflowStepLandesbedienstete(filter);

      expect(personenkontextStore.loading).toBe(true);
      await processWorkflowStep;
      expect(personenkontextStore.workflowStepResponse).toEqual(mockResponse);
      expect(personenkontextStore.loading).toBe(false);
    });

    it('should get step with multiple parameters', async () => {
      const filter: WorkflowFilter = {
        organisationId: '1',
        rollenIds: ['role1', 'role2'],
        rolleName: 'TestRole',
        organisationName: 'TestOrg',
        limit: 10,
      };
      mockadapter.onGet(getUrl(filter)).replyOnce(200, mockResponse);

      const processWorkflowStep: Promise<void> = personenkontextStore.processWorkflowStepLandesbedienstete(filter);

      expect(personenkontextStore.loading).toBe(true);
      await processWorkflowStep;
      expect(personenkontextStore.workflowStepResponse).toEqual(mockResponse);
      expect(personenkontextStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      const filter: WorkflowFilter = { organisationId: '1' };
      mockadapter.onGet(getUrl(filter)).replyOnce(500, 'some error');

      const processWorkflowStep: Promise<void> = personenkontextStore.processWorkflowStepLandesbedienstete(filter);

      expect(personenkontextStore.loading).toBe(true);
      await processWorkflowStep;
      expect(personenkontextStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(personenkontextStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      const filter: WorkflowFilter = { organisationId: '1' };
      mockadapter.onGet(getUrl(filter)).replyOnce(500, { code: 'some mock server error' });

      const processWorkflowStep: Promise<void> = personenkontextStore.processWorkflowStepLandesbedienstete(filter);

      expect(personenkontextStore.loading).toBe(true);
      await processWorkflowStep;
      expect(personenkontextStore.errorCode).toEqual('some mock server error');
      expect(personenkontextStore.loading).toBe(false);
    });
  });

  describe('commitLandesbediensteteKontext', () => {
    const personId: string = '123';
    const personalnummer: string = '12345';
    const updatedPersonenkontexte: PersonenkontextUpdate[] = [
      {
        organisationId: 'org1',
        rolleId: 'role1',
      },
    ];

    const mockUpdateResponse: PersonenkontexteUpdateResponse = {
      dBiamPersonenkontextResponses: [
        {
          personId: '1',
          organisationId: 'org-123',
          rolleId: 'rolle-456',
        } as DBiamPersonenkontextResponse,
      ],
    };

    it('should commit landesbedienstete kontext successfully', async () => {
      mockadapter.onPut(`/api/landesbediensteter/${personId}`).replyOnce(200, mockUpdateResponse);

      const commitPromise: Promise<void> = personenkontextStore.commitLandesbediensteteKontext(
        personId,
        updatedPersonenkontexte,
        personalnummer,
      );

      expect(personenkontextStore.loading).toBe(true);
      await commitPromise;
      expect(personenkontextStore.landesbediensteteCommitResponse).toEqual(mockUpdateResponse);
      expect(personenkontextStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      mockadapter.onPut(`/api/landesbediensteter/${personId}`).replyOnce(500, 'some error');

      const commitPromise: Promise<void> = personenkontextStore.commitLandesbediensteteKontext(
        personId,
        updatedPersonenkontexte,
        personalnummer,
      );

      expect(personenkontextStore.loading).toBe(true);
      await commitPromise;
      expect(personenkontextStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(personenkontextStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      mockadapter.onPut(`/api/landesbediensteter/${personId}`).replyOnce(500, { code: 'some mock server error' });

      const commitPromise: Promise<void> = personenkontextStore.commitLandesbediensteteKontext(
        personId,
        updatedPersonenkontexte,
        personalnummer,
      );

      expect(personenkontextStore.loading).toBe(true);
      await commitPromise;
      expect(personenkontextStore.errorCode).toEqual('some mock server error');
      expect(personenkontextStore.loading).toBe(false);
    });
  });

  describe('updatePersonenkontexte', () => {
    const mockZuordnungUpdates: PersonenkontextUpdate[] = [
      {
        organisationId: '67890',
        rolleId: '54321',
      },
    ];

    it('should update Personenkontexte', async () => {
      const mockResponse: PersonenkontexteUpdateResponse = {
        dBiamPersonenkontextResponses: [
          {
            personId: '1',
            organisationId: '67890',
            rolleId: '54321',
          } as DBiamPersonenkontextResponse,
        ],
      };

      mockadapter.onPut('/api/personenkontext-workflow/1').replyOnce(200, mockResponse);

      const updatePersonenkontextePromise: Promise<void> = personenkontextStore.updatePersonenkontexte(
        mockZuordnungUpdates,
        '1',
      );
      expect(personenkontextStore.loading).toBe(true);
      await updatePersonenkontextePromise;
      expect(personenkontextStore.updatedPersonenkontexte).toEqual(mockResponse);
      expect(personenkontextStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      mockadapter.onPut('/api/personenkontext-workflow/1').replyOnce(500, 'some error');
      const updatePersonenkontextePromise: Promise<void> = personenkontextStore.updatePersonenkontexte(
        mockZuordnungUpdates,
        '1',
      );
      expect(personenkontextStore.loading).toBe(true);
      await updatePersonenkontextePromise;
      expect(personenkontextStore.errorCode).toEqual('PERSONENKONTEXTE_UPDATE_ERROR');
      expect(personenkontextStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      mockadapter.onPut('/api/personenkontext-workflow/1').replyOnce(500, { i18nKey: 'SOME_MOCK_SERVER_ERROR' });
      const updatePersonenkontextePromise: Promise<void> = personenkontextStore.updatePersonenkontexte(
        mockZuordnungUpdates,
        '1',
      );
      expect(personenkontextStore.loading).toBe(true);
      await updatePersonenkontextePromise;
      expect(personenkontextStore.errorCode).toEqual('SOME_MOCK_SERVER_ERROR');
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
            administeredBySchulstrukturknotenName: 'Land SH',
            administeredBySchulstrukturknotenKennung: '',
            version: 1,
          },
        ],
        total: 0,
      };

      mockadapter.onGet('/api/person-administration/rollen?rolleName=str&limit=2').replyOnce(200, mockResponse);
      const getPersonenkontextRolleWithFilterPromise: Promise<void> =
        personenkontextStore.getPersonenkontextRolleWithFilter('str', 2);
      expect(personenkontextStore.loading).toBe(true);
      await getPersonenkontextRolleWithFilterPromise;
      expect(personenkontextStore.filteredRollen).toEqual(mockResponse);
      expect(personenkontextStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      mockadapter
        .onGet('/api/person-administration/rollen?rolleName=str&limit=2')
        .replyOnce(500, 'some mock server error');
      const getPersonenkontextRolleWithFilterPromise: Promise<void> =
        personenkontextStore.getPersonenkontextRolleWithFilter('str', 2);
      expect(personenkontextStore.loading).toBe(true);
      await rejects(getPersonenkontextRolleWithFilterPromise);
      expect(personenkontextStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(personenkontextStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      mockadapter
        .onGet('/api/person-administration/rollen?rolleName=str&limit=2')
        .replyOnce(500, { code: 'some mock server error' });
      const getPersonenkontextRolleWithFilterPromise: Promise<void> =
        personenkontextStore.getPersonenkontextRolleWithFilter('str', 2);
      expect(personenkontextStore.loading).toBe(true);
      await rejects(getPersonenkontextRolleWithFilterPromise);
      expect(personenkontextStore.errorCode).toEqual('some mock server error');
      expect(personenkontextStore.loading).toBe(false);
    });
  });

  describe('createPersonWithKontexte', () => {
    it('should create a Person', async () => {
      const mockPerson: PersonendatensatzResponse = {
        person: {
          id: '9876',
          name: {
            familienname: 'Cena',
            vorname: 'Randy',
          },
          referrer: 'rcena',
        },
      } as PersonendatensatzResponse;

      const mockResponse: PersonendatensatzResponse = mockPerson;

      mockadapter.onPost('/api/personenkontext-workflow').replyOnce(201, mockResponse);
      const createPersonPromise: Promise<PersonendatensatzResponse> = personenkontextStore.createPersonWithKontexte({
        familienname: 'Cena',
        vorname: 'Randy',
        createPersonenkontexte: [
          {
            organisationId: '1234',
            rolleId: '5678',
          },
        ],
      });
      expect(personenkontextStore.loading).toBe(true);
      const createdPerson: PersonendatensatzResponse = await createPersonPromise;
      expect(createdPerson).toEqual(mockPerson);
      expect(personenkontextStore.loading).toBe(false);
    });

    it('should handle string error', async () => {
      mockadapter.onPost('/api/personenkontext-workflow').replyOnce(500, 'some error');
      const createPersonPromise: Promise<PersonendatensatzResponse> = personenkontextStore.createPersonWithKontexte({
        familienname: 'Copeland',
        vorname: 'Christian',
        createPersonenkontexte: [
          {
            organisationId: '',
            rolleId: '5678',
          },
        ],
      });
      expect(personenkontextStore.loading).toBe(true);
      await rejects(createPersonPromise);
      expect(personenkontextStore.errorCode).toEqual('UNSPECIFIED_ERROR');
      expect(personenkontextStore.loading).toBe(false);
    });

    it('should handle error code', async () => {
      mockadapter.onPost('/api/personenkontext-workflow').replyOnce(500, { i18nKey: 'SOME_MOCK_SERVER_ERROR' });
      const createPersonPromise: Promise<PersonendatensatzResponse> = personenkontextStore.createPersonWithKontexte({
        familienname: 'Copeland',
        vorname: 'Christian',
        createPersonenkontexte: [
          {
            organisationId: '1234',
            rolleId: '',
          },
        ],
      });
      expect(personenkontextStore.loading).toBe(true);
      await rejects(createPersonPromise);
      expect(personenkontextStore.errorCode).toEqual('SOME_MOCK_SERVER_ERROR');
      expect(personenkontextStore.loading).toBe(false);
    });
  });
});
