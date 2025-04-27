import type {
  DBiamPersonenzuordnungResponse,
  DBiamPersonenuebersichtResponse,
  RollenMerkmal,
  DBiamPersonenkontextResponse,
  PersonenkontexteUpdateResponse,
} from '@/api-client/generated';
import ApiService from '@/services/ApiService';
import MockAdapter from 'axios-mock-adapter';
import { createPinia, setActivePinia } from 'pinia';
import { OperationType, useBulkOperationStore, type BulkOperationStore } from './BulkOperationStore';
import { usePersonStore, type PersonStore } from './PersonStore';
import { usePersonenkontextStore, type PersonenkontextStore } from './PersonenkontextStore';
import { OrganisationsTyp, type Organisation } from './OrganisationStore';
import { RollenArt } from './RolleStore';
import type { TranslatedRolleWithAttrs } from '@/composables/useRollen';

const mockAdapter: MockAdapter = new MockAdapter(ApiService);

describe('BulkOperationStore', () => {
  let bulkOperationStore: BulkOperationStore;
  let personStore: PersonStore;
  let personenkontextStore: PersonenkontextStore;

  const mockPersonId: string = '1';

  const mockSchuleZuordnung: DBiamPersonenzuordnungResponse = {
    sskId: '1234',
    rolleId: '5678',
    sskName: 'some ssk name',
    sskDstNr: '123',
    rolle: 'some role',
    rollenArt: RollenArt.Lern,
    administriertVon: '123',
    typ: OrganisationsTyp.Schule,
    editable: true,
    befristung: 'unbefristet',
    merkmale: [] as unknown as RollenMerkmal,
    admins: ['admin1', 'admin2'],
  };

  const person: DBiamPersonenuebersichtResponse = {
    personId: mockPersonId,
    vorname: 'John',
    nachname: 'Doe',
    benutzername: 'jdoe',
    zuordnungen: [mockSchuleZuordnung],
    lastModifiedZuordnungen: '2024-03-24T16:35:32.711Z',
  };

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
      const mockPersonResponse: DBiamPersonenuebersichtResponse = {
        personId: '1',
        vorname: 'John',
        nachname: 'Doe',
        benutzername: 'jdoe',
        lastModifiedZuordnungen: '2024-04-01T00:00:00.000Z',
        zuordnungen: [
          {
            sskId: '1234', // <- matches org ID
            rolleId: 'some-role',
            sskName: 'Test School',
            sskDstNr: '123',
            rolle: 'Test Role',
            rollenArt: RollenArt.Lern,
            administriertVon: 'admin-org-id',
            typ: OrganisationsTyp.Schule,
            editable: true,
            befristung: 'unbefristet',
            merkmale: [] as unknown as RollenMerkmal,
            admins: ['admin1'],
          },
          {
            sskId: '12345',
            rolleId: 'some-role',
            sskName: 'Test School',
            sskDstNr: '123',
            rolle: 'Test Role',
            rollenArt: RollenArt.Lern,
            administriertVon: '1234',
            typ: OrganisationsTyp.Klasse,
            editable: true,
            befristung: 'unbefristet',
            merkmale: [] as unknown as RollenMerkmal,
            admins: ['admin1'],
          },
        ],
      };

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
      expect(personStore.personenuebersicht).toEqual(mockPersonResponse);
      expect(bulkOperationStore.currentOperation?.progress).toBe(100);
      expect(bulkOperationStore.currentOperation?.errors.size).toBe(0);
    });

    it('should skip if person has no zuordnungen', async () => {
      mockAdapter.onGet('/api/dbiam/personenuebersicht/1').replyOnce(200, []);

      await bulkOperationStore.bulkUnassignPersonenFromOrg('1234', [mockPersonId]);

      expect(personStore.personenuebersicht).not.toBeNull();
      expect(personStore.personenuebersicht).toEqual([]);
      expect(bulkOperationStore.currentOperation?.progress).toBe(100);
    });

    it('should skip if personenuebersicht is missing', async () => {
      mockAdapter.onGet('/api/dbiam/personenuebersicht/1').replyOnce(200, null);

      await bulkOperationStore.bulkUnassignPersonenFromOrg('1234', [mockPersonId]);

      expect(personStore.personenuebersicht).toBeNull();
      expect(bulkOperationStore.currentOperation?.progress).toBe(100);
    });

    it('should handle errors if endpoint replies with 500', async () => {
      mockAdapter.onGet('/api/dbiam/personenuebersicht/1').replyOnce(500, { i18nKey: 'mockServerError' });

      await bulkOperationStore.bulkUnassignPersonenFromOrg('1234', [mockPersonId]);

      expect(bulkOperationStore.currentOperation?.errors.size).toBe(1);
      expect(bulkOperationStore.currentOperation?.errors.get(mockPersonId)).toBe('mockServerError');
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

    it('should handle errors if endpoint replies with 500', async () => {
      const userIds: Array<string> = ['id-1', 'id-2'];

      mockAdapter.onPatch(`/api/personen/${userIds[0]}/password`).replyOnce(500, { i18nKey: 'mockServerError' });
      mockAdapter.onPatch(`/api/personen/${userIds[1]}/password`).replyOnce(200, 'mockPassword');

      const resetPromise: Promise<void> = bulkOperationStore.bulkResetPassword(userIds);

      await resetPromise;

      expect(bulkOperationStore.currentOperation?.errors.size).toBe(1);
      expect(bulkOperationStore.currentOperation?.errors.get(userIds[0]!)).toBe('mockServerError');
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

      expect(personenkontextStore.errorCode).toBe('INVALID_PERSONENKONTEXT_FOR_PERSON_WITH_ROLLENART_LERN');
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

    it('should handle errors from both endpoints gracefully', async () => {
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

      mockAdapter.onGet('/api/dbiam/personenuebersicht/1').replyOnce(500, { i18nKey: 'mockGetError' });
      mockAdapter.onGet('/api/dbiam/personenuebersicht/2').replyOnce(200, {
        personId: '2',
        vorname: 'Jane',
        nachname: 'Doe',
        benutzername: 'jdoe2',
        lastModifiedZuordnungen: '2024-04-01T00:00:00.000Z',
        zuordnungen: [],
      });

      mockAdapter.onPut('/api/personenkontext-workflow/2').replyOnce(500, { i18nKey: 'mockPutError' });

      const modifyPromise: Promise<void> = bulkOperationStore.bulkModifyPersonenRolle(
        personIds,
        selectedOrganisationId,
        selectedRolleId,
        rollen,
        workflowStepResponseOrganisations,
      );

      await modifyPromise;

      expect(bulkOperationStore.currentOperation?.errors.size).toBe(2);
      expect(bulkOperationStore.currentOperation?.errors.get(personIds[0]!)).toBe('mockGetError');
      expect(bulkOperationStore.currentOperation?.errors.get(personIds[1]!)).toBe('mockGetError');
      expect(bulkOperationStore.currentOperation?.progress).toBe(100);
      expect(bulkOperationStore.currentOperation?.complete).toBe(true);
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

    it('should handle errors if endpoint replies with 500', async () => {
      const personIds: string[] = ['id-1', 'id-2'];

      mockAdapter.onDelete(`/api/personen/${personIds[0]}`).replyOnce(204);
      mockAdapter.onDelete(`/api/personen/${personIds[1]}`).replyOnce(500, { i18nKey: 'mockServerError' });

      const bulkDeletePromise: Promise<void> = bulkOperationStore.bulkPersonenDelete(personIds);

      await bulkDeletePromise;

      expect(bulkOperationStore.currentOperation?.errors.size).toBe(1);
      expect(bulkOperationStore.currentOperation?.errors.get(personIds[1]!)).toBe('mockServerError');
      expect(bulkOperationStore.currentOperation?.successMessage).toBeUndefined();
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
});
