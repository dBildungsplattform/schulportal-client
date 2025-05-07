import type {
  DBiamPersonenkontextResponse,
  DBiamPersonenuebersichtResponse,
  PersonenkontexteUpdateResponse,
} from '@/api-client/generated';
import type { TranslatedRolleWithAttrs } from '@/composables/useRollen';
import ApiService from '@/services/ApiService';
import { DoFactory } from '@/testing/DoFactory';
import { faker } from '@faker-js/faker';
import MockAdapter from 'axios-mock-adapter';
import { createPinia, setActivePinia } from 'pinia';
import type { MockInstance } from 'vitest';
import { OperationType, useBulkOperationStore, type BulkOperationStore } from './BulkOperationStore';
import { type Organisation } from './OrganisationStore';
import { usePersonStore, type PersonStore } from './PersonStore';
import { usePersonenkontextStore, type PersonenkontextStore } from './PersonenkontextStore';
import { RollenArt } from './RolleStore';
import { PersonenUebersicht } from './types/PersonenUebersicht';
import type { Zuordnung } from './types/Zuordnung';

const mockAdapter: MockAdapter = new MockAdapter(ApiService);

describe('BulkOperationStore', () => {
  let bulkOperationStore: BulkOperationStore;
  let personStore: PersonStore;
  let personenkontextStore: PersonenkontextStore;

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
    bulkOperationStore = useBulkOperationStore();
    personStore = usePersonStore();
    personenkontextStore = usePersonenkontextStore();
    mockAdapter.reset();
    personStore.$reset();
    personenkontextStore.$reset();
    bulkOperationStore.$reset();
    personStore.personenuebersicht = person;
  });

  describe('bulkUnassignPersonenFromOrg', () => {
    it('should unassign person from Organisation successfully', async () => {
      const mockPersonResponse: DBiamPersonenuebersichtResponse = {
        personId: '1',
        vorname: 'John',
        nachname: 'Doe',
        benutzername: 'jdoe',
        lastModifiedZuordnungen: '2024-04-01T00:00:00.000Z',
        zuordnungen: [],
      };
      const mockUpdateResponse: PersonenkontexteUpdateResponse = {
        dBiamPersonenkontextResponses: [
          {
            personId: '1',
            organisationId: 'org-123',
            rolleId: 'rolle-456',
          } as DBiamPersonenkontextResponse,
        ],
      };

      mockAdapter.onGet('/api/dbiam/personenuebersicht/1').replyOnce(200, mockPersonResponse);
      mockAdapter.onPut('/api/personenkontext-workflow/1').replyOnce(200, mockUpdateResponse);

      const unassign: Promise<void> = bulkOperationStore.bulkUnassignPersonenFromOrg('1234', [mockPersonId]);
      expect(bulkOperationStore.currentOperation?.progress).toBe(0);

      await unassign;

      expect(personStore.personenuebersicht).not.toBeNull();
      expect(personStore.personenuebersicht).toEqual(mockPersonResponse);
      expect(bulkOperationStore.currentOperation?.progress).toBe(100);
      expect(bulkOperationStore.currentOperation?.errors.size).toBe(0);
    });

    it('should unassign and call updatePersonenkontexte if matching zuordnung exists', async () => {
      const mockPersonResponse: DBiamPersonenuebersichtResponse = DoFactory.getDBiamPersonenuebersichtResponse({
        ...person,
        zuordnungen: [
          DoFactory.getDBiamPersonenzuordnungResponse({}, { organisation: mockSchule }),
          DoFactory.getDBiamPersonenzuordnungResponse(),
        ],
      });

      const mockUpdateResponse: PersonenkontexteUpdateResponse = {
        dBiamPersonenkontextResponses: [
          {
            personId: '1',
            organisationId: '1234',
            rolleId: 'some-role',
          } as DBiamPersonenkontextResponse,
        ],
      };

      mockAdapter.onGet('/api/dbiam/personenuebersicht/1').replyOnce(200, mockPersonResponse);
      mockAdapter.onPut('/api/personenkontext-workflow/1').replyOnce(200, mockUpdateResponse);

      const unassign: Promise<void> = bulkOperationStore.bulkUnassignPersonenFromOrg('1234', [mockPersonId]);

      await unassign;

      expect(personStore.personenuebersicht).not.toBeNull();
      expect(personStore.personenuebersicht).toEqual(PersonenUebersicht.fromResponse(mockPersonResponse));
      expect(bulkOperationStore.currentOperation?.progress).toBe(100);
      expect(bulkOperationStore.currentOperation?.errors.size).toBe(0);
    });

    it('should skip if person has no zuordnungen', async () => {
      const spy: MockInstance = vi.spyOn(personenkontextStore, 'updatePersonenkontexte');
      mockAdapter
        .onGet(`/api/dbiam/personenuebersicht/${mockPersonId}`)
        .replyOnce(200, DoFactory.getDBiamPersonenuebersichtResponse({ zuordnungen: [] }));

      await bulkOperationStore.bulkUnassignPersonenFromOrg('1234', [mockPersonId]);

      expect(bulkOperationStore.currentOperation?.progress).toBe(100);
      expect(spy).not.toHaveBeenCalled();
    });

    it('should skip if personenuebersicht is missing', async () => {
      const spy: MockInstance = vi.spyOn(personenkontextStore, 'updatePersonenkontexte');
      mockAdapter.onGet(`/api/dbiam/personenuebersicht/${mockPersonId}`).replyOnce(200);

      await bulkOperationStore.bulkUnassignPersonenFromOrg('1234', [mockPersonId]);

      expect(bulkOperationStore.currentOperation?.progress).toBe(100);

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('bulkResetPassword', () => {
    it('should reset passwords successfully and handle errors', async () => {
      const userIds: Array<string> = [
        'bd5c231b-5171-49f4-a3c2-cb9fb470ed91',
        'f4e64f48-f1cf-463e-958f-ffd68e712713',
        'ede4055b-e18a-4f1a-9bce-9e8871772229',
      ];
      const mockPassword: string = 'fakePassword';

      mockAdapter.onPatch(`/api/personen/${userIds[0]}/password`).replyOnce(200, mockPassword);
      mockAdapter.onPatch(`/api/personen/${userIds[1]}/password`).replyOnce(200, mockPassword);
      mockAdapter.onPatch(`/api/personen/${userIds[2]}/password`).replyOnce(500, { i18nKey: 'some mock server error' });

      const resetPromise: Promise<void> = bulkOperationStore.bulkResetPassword(userIds);

      expect(bulkOperationStore.currentOperation?.isRunning).toBe(true);
      expect(bulkOperationStore.currentOperation?.progress).toBe(0);

      await resetPromise;

      expect(bulkOperationStore.currentOperation?.isRunning).toBe(false);
      expect(bulkOperationStore.currentOperation?.complete).toBe(true);
      expect(bulkOperationStore.currentOperation?.progress).toBe(100);

      expect(bulkOperationStore.currentOperation?.errors.size).toBe(1);
      expect(bulkOperationStore.currentOperation?.errors.get(userIds[2]!)).toBe('some mock server error');

      expect(bulkOperationStore.currentOperation?.data.size).toBe(2);
      expect(bulkOperationStore.currentOperation?.data.get(userIds[0]!)).toBe(mockPassword);
      expect(bulkOperationStore.currentOperation?.data.get(userIds[1]!)).toBe(mockPassword);
    });
  });

  describe('bulkModifyPersonenRolle', () => {
    it('should update successfully with given values', async () => {
      const personIds: string[] = ['1', '2'];
      const selectedOrganisationId: string = 'org-123';
      const selectedRolleId: string = 'rolle-456';

      const workflowStepResponseOrganisations: Organisation[] = [
        {
          id: 'org-123',
          name: 'Test Schule',
          kennung: 'SCH123',
          administriertVon: 'adminId',
        } as Organisation,
      ];

      const rollen: TranslatedRolleWithAttrs[] = [
        {
          title: 'Lehrer',
          value: 'rolle-456',
          rollenart: RollenArt.Lern,
        },
      ];

      const mockPersonResponse: DBiamPersonenuebersichtResponse = {
        personId: '1',
        vorname: 'John',
        nachname: 'Doe',
        benutzername: 'jdoe',
        lastModifiedZuordnungen: '2024-04-01T00:00:00.000Z',
        zuordnungen: [],
      };

      const mockUpdateResponse: PersonenkontexteUpdateResponse = {
        dBiamPersonenkontextResponses: [
          {
            personId: '1',
            organisationId: 'org-123',
            rolleId: 'rolle-456',
          } as DBiamPersonenkontextResponse,
        ],
      };

      mockAdapter.onGet('/api/dbiam/personenuebersicht/1').replyOnce(200, mockPersonResponse);
      mockAdapter.onGet('/api/dbiam/personenuebersicht/2').replyOnce(200, mockPersonResponse);

      mockAdapter.onPut('/api/personenkontext-workflow/1').replyOnce(200, mockUpdateResponse);
      mockAdapter.onPut('/api/personenkontext-workflow/2').replyOnce(200, mockUpdateResponse);

      const modifyPromise: Promise<void> = bulkOperationStore.bulkModifyPersonenRolle(
        personIds,
        selectedOrganisationId,
        selectedRolleId,
        rollen,
        workflowStepResponseOrganisations,
      );

      // We set the errorCode to cover the case where the update fails
      vi.spyOn(personenkontextStore, 'updatePersonenkontexte').mockImplementation(async () => {
        personenkontextStore.errorCode = 'INVALID_PERSONENKONTEXT_FOR_PERSON_WITH_ROLLENART_LERN';
        return Promise.resolve();
      });

      expect(bulkOperationStore.currentOperation?.isRunning).toBe(true);

      await modifyPromise;

      expect(personenkontextStore.errorCode).toBe('');
      expect(bulkOperationStore.currentOperation?.isRunning).toBe(false);
      expect(bulkOperationStore.currentOperation?.complete).toBe(true);
      expect(bulkOperationStore.currentOperation?.progress).toBe(100);
    });

    it('should return early if organisation is not found', async () => {
      const personIds: string[] = ['1', '2'];
      const selectedOrganisationId: string = 'non-existing-org';
      const selectedRolleId: string = 'rolle-456';

      const workflowStepResponseOrganisations: Organisation[] = [
        {
          id: 'some-other-org',
          name: 'Other Schule',
          kennung: 'SCH999',
          administriertVon: 'adminId',
        } as Organisation,
      ];

      const rollen: TranslatedRolleWithAttrs[] = [
        {
          title: 'Lehrer',
          value: 'rolle-456',
          rollenart: RollenArt.Lern,
        },
      ];

      const modifyPromise: Promise<void> = bulkOperationStore.bulkModifyPersonenRolle(
        personIds,
        selectedOrganisationId,
        selectedRolleId,
        rollen,
        workflowStepResponseOrganisations,
      );

      await modifyPromise;

      // Assertions
      expect(bulkOperationStore.currentOperation?.isRunning).toBe(true);
      expect(bulkOperationStore.currentOperation?.progress).toBe(0);
      expect(bulkOperationStore.currentOperation?.complete).toBe(false);
    });

    it('should update successfully with default values for baseZuordnung', async () => {
      const personIds: string[] = ['1', '2'];
      const selectedOrganisationId: string = 'org-123';
      const selectedRolleId: string = 'rolle-456';

      const workflowStepResponseOrganisations: Organisation[] = [
        {
          id: 'org-123',
          name: 'Test Schule',
          kennung: null,
          administriertVon: null,
        } as Organisation,
      ];

      const rollen: TranslatedRolleWithAttrs[] = [
        {
          title: 'Lehrer',
          value: 'rolle-457',
          rollenart: RollenArt.Lern,
        },
      ];

      const mockPersonResponse: DBiamPersonenuebersichtResponse = {
        personId: '1',
        vorname: 'John',
        nachname: 'Doe',
        benutzername: 'jdoe',
        lastModifiedZuordnungen: '2024-04-01T00:00:00.000Z',
        zuordnungen: [],
      };

      const mockUpdateResponse: PersonenkontexteUpdateResponse = {
        dBiamPersonenkontextResponses: [
          {
            personId: '1',
            organisationId: 'org-123',
            rolleId: 'rolle-456',
          } as DBiamPersonenkontextResponse,
        ],
      };

      mockAdapter.onGet('/api/dbiam/personenuebersicht/1').replyOnce(200, []);
      mockAdapter.onGet('/api/dbiam/personenuebersicht/2').replyOnce(200, mockPersonResponse);

      mockAdapter.onPut('/api/personenkontext-workflow/1').replyOnce(200, mockUpdateResponse);
      mockAdapter.onPut('/api/personenkontext-workflow/2').replyOnce(200, mockUpdateResponse);

      const modifyPromise: Promise<void> = bulkOperationStore.bulkModifyPersonenRolle(
        personIds,
        selectedOrganisationId,
        selectedRolleId,
        rollen,
        workflowStepResponseOrganisations,
      );
      expect(bulkOperationStore.currentOperation?.isRunning).toBe(true);

      await modifyPromise;

      expect(bulkOperationStore.currentOperation?.isRunning).toBe(false);
      expect(bulkOperationStore.currentOperation?.complete).toBe(true);
      expect(bulkOperationStore.currentOperation?.progress).toBe(100);
    });
  });

  describe('bulkPersonenDelete', () => {
    it('should set successMessage when all deletes succeed', async () => {
      const personIds: string[] = ['id-1', 'id-2'];

      mockAdapter.onDelete(`/api/personen/${personIds[0]}`).replyOnce(204);
      mockAdapter.onDelete(`/api/personen/${personIds[1]}`).replyOnce(204);

      const bulkDeletePromise: Promise<void> = bulkOperationStore.bulkPersonenDelete(personIds);

      await bulkDeletePromise;

      expect(bulkOperationStore.currentOperation?.errors.size).toBe(0);
      expect(bulkOperationStore.currentOperation?.successMessage).toBe('admin.person.deletePersonBulkSuccessMessage');
    });
  });

  describe('resetState', () => {
    it('should reset the currentOperation state', () => {
      bulkOperationStore.currentOperation = {
        type: OperationType.DELETE_PERSON,
        isRunning: true,
        progress: 55,
        complete: true,
        errors: new Map([['someId', 'someError']]),
        data: new Map([['someId', 'someData']]),
        successMessage: 'Some success message',
      };

      bulkOperationStore.resetState();

      expect(bulkOperationStore.currentOperation.type).toBeNull();
      expect(bulkOperationStore.currentOperation.isRunning).toBe(false);
      expect(bulkOperationStore.currentOperation.progress).toBe(0);
      expect(bulkOperationStore.currentOperation.complete).toBe(false);
      expect(bulkOperationStore.currentOperation.errors.size).toBe(0);
      expect(bulkOperationStore.currentOperation.data.size).toBe(0);
      expect(bulkOperationStore.currentOperation.successMessage).toBeUndefined();
    });
  });

  describe('bulkChangeKlasse', () => {
    it('should call the API and update the state', async () => {
      const personId: string = faker.string.uuid();
      const spy: MockInstance = vi.spyOn(personenkontextStore, 'updatePersonenkontexte');
      const bulkChangeKlassePromise: Promise<void> = bulkOperationStore.bulkChangeKlasse(
        [personId],
        faker.string.uuid(),
        faker.string.uuid(),
      );

      mockAdapter.onGet(`/api/dbiam/personenuebersicht/${personId}`).replyOnce(200, []);
      mockAdapter.onPut(`/api/personenkontext-workflow/${personId}`).replyOnce(200, []);

      expect(bulkOperationStore.currentOperation?.isRunning).toBe(true);
      expect(bulkOperationStore.currentOperation?.progress).toBe(0);

      await bulkChangeKlassePromise;

      expect(bulkOperationStore.currentOperation?.isRunning).toBe(false);
      expect(bulkOperationStore.currentOperation?.complete).toBe(true);
      expect(bulkOperationStore.currentOperation?.progress).toBe(100);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should call api with correct data', async () => {
      const spy: MockInstance = vi.spyOn(personenkontextStore, 'updatePersonenkontexte');
      const mockPersonIds: string[] = [faker.string.uuid(), faker.string.uuid()];
      const klassenId: string = faker.string.uuid();
      const unchangedKlassenId: string = faker.string.uuid();
      const mockKlassen: Organisation[] = [
        DoFactory.getKlasse(mockSchule),
        DoFactory.getKlasse(mockSchule),
        DoFactory.getKlasse(mockSchule, { id: klassenId }),
      ];
      const mockKontexte: Map<string, DBiamPersonenuebersichtResponse> = new Map();
      mockKontexte.set(
        mockPersonIds[0]!,
        DoFactory.getDBiamPersonenuebersichtResponse(
          {
            personId: mockPersonIds[0]!,
            zuordnungen: [
              DoFactory.getDBiamPersonenzuordnungResponse({ rollenArt: RollenArt.Lern }, { organisation: mockSchule }),
              DoFactory.getDBiamPersonenzuordnungResponse(
                { rollenArt: RollenArt.Lern, administriertVon: mockSchule.id },
                { organisation: mockKlassen[0] },
              ),
              DoFactory.getDBiamPersonenzuordnungResponse(
                { rollenArt: RollenArt.Lern },
                { organisation: DoFactory.getKlasse(undefined, { id: unchangedKlassenId }) },
              ),
            ],
          },
          { organisation: mockSchule },
        ),
      );
      mockKontexte.set(
        mockPersonIds[1]!,
        DoFactory.getDBiamPersonenuebersichtResponse(
          {
            personId: mockPersonIds[1]!,
            zuordnungen: [
              DoFactory.getDBiamPersonenzuordnungResponse({ rollenArt: RollenArt.Lern }, { organisation: mockSchule }),
              DoFactory.getDBiamPersonenzuordnungResponse(
                { rollenArt: RollenArt.Lern, administriertVon: mockSchule.id },
                { organisation: mockKlassen[0] },
              ),
              DoFactory.getDBiamPersonenzuordnungResponse(
                { rollenArt: RollenArt.Lern, administriertVon: mockSchule.id },
                { organisation: mockKlassen[1] },
              ),
            ],
          },
          { organisation: mockSchule },
        ),
      );
      mockPersonIds.forEach((personId: string) => {
        mockAdapter.onGet(`/api/dbiam/personenuebersicht/${personId}`).replyOnce(200, mockKontexte.get(personId));
      });
      mockPersonIds.forEach((personId: string) => {
        mockAdapter.onPut(`/api/personenkontext-workflow/${personId}`).replyOnce(200, []);
      });

      await bulkOperationStore.bulkChangeKlasse(mockPersonIds, mockSchule.id, klassenId);

      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            sskId: mockSchule.id,
            rolleId: mockKontexte.get(mockPersonIds[0]!)?.zuordnungen[0]?.rolleId,
          }),
          expect.objectContaining({
            sskId: klassenId,
            rolleId: mockKontexte.get(mockPersonIds[0]!)?.zuordnungen[1]?.rolleId,
          }),
          expect.objectContaining({
            sskId: unchangedKlassenId,
            rolleId: mockKontexte.get(mockPersonIds[0]!)?.zuordnungen[2]?.rolleId,
          }),
        ]),
        mockPersonIds[0],
      );
      expect(spy).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            sskId: mockSchule.id,
            rolleId: mockKontexte.get(mockPersonIds[1]!)?.zuordnungen[0]?.rolleId,
          }),
          expect.objectContaining({
            sskId: klassenId,
            rolleId: mockKontexte.get(mockPersonIds[1]!)?.zuordnungen[1]?.rolleId,
          }),
          expect.objectContaining({
            sskId: klassenId,
            rolleId: mockKontexte.get(mockPersonIds[1]!)?.zuordnungen[2]?.rolleId,
          }),
        ]),
        mockPersonIds[1],
      );
    });
  });
});
