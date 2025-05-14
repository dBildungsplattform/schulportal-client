import type {
  DBiamPersonenkontextResponse,
  DBiamPersonenuebersichtResponse,
  DBiamPersonenzuordnungResponse,
  PersonenkontexteUpdateResponse,
  RollenMerkmal,
} from '@/api-client/generated';
import type { TranslatedRolleWithAttrs } from '@/composables/useRollen';
import ApiService from '@/services/ApiService';
import { DoFactory } from '@/testing/DoFactory';
import { faker } from '@faker-js/faker';
import MockAdapter from 'axios-mock-adapter';
import { isBefore } from 'date-fns';
import { createPinia, setActivePinia } from 'pinia';
import type { MockInstance } from 'vitest';
import { OperationType, useBulkOperationStore, type BulkOperationStore } from './BulkOperationStore';
import { OrganisationsTyp, type Organisation } from './OrganisationStore';
import { usePersonStore, type PersonStore } from './PersonStore';
import { usePersonenkontextStore, type PersonenkontextStore } from './PersonenkontextStore';
import { RollenArt } from './RolleStore';

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
    vi.restoreAllMocks();
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

    it('should handle errors if personenuebersicht replies with 500', async () => {
      mockAdapter.onGet('/api/dbiam/personenuebersicht/1').replyOnce(500, { i18nKey: 'mockServerError' });

      await bulkOperationStore.bulkUnassignPersonenFromOrg('1234', [mockPersonId]);

      expect(bulkOperationStore.currentOperation?.errors.size).toBe(1);
      expect(bulkOperationStore.currentOperation?.errors.get(mockPersonId)).toBe('mockServerError');
    });

    it('should handle errors if workflow replies with 500', async () => {
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
      mockAdapter.onGet('/api/dbiam/personenuebersicht/1').replyOnce(200, mockPersonResponse);
      mockAdapter.onPut('/api/personenkontext-workflow/1').replyOnce(500, { i18nKey: 'mockServerError' });

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

      expect(bulkOperationStore.currentOperation?.isRunning).toBe(true);

      await modifyPromise;

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

    it('should correctly handle befristungen', async () => {
      const selectedOrganisationId: string = faker.string.uuid();
      const selectedRolleTitle: string = 'Lehrer';
      const selectedRolleId: string = faker.string.uuid();
      const befristung: string = faker.date.future().toISOString();
      const spy: MockInstance = vi.spyOn(personenkontextStore, 'updatePersonenkontexte');

      const selectedOrganisation: Organisation = DoFactory.getOrganisationResponse({ id: selectedOrganisationId });
      const workflowStepResponseOrganisations: Organisation[] = [selectedOrganisation];

      const rollen: TranslatedRolleWithAttrs[] = [
        {
          title: selectedRolleTitle,
          value: selectedRolleId,
          rollenart: RollenArt.Lern,
        },
      ];
      const mockBefristungen: string[] = [
        '',
        faker.date.between({ from: new Date(), to: befristung }).toISOString(),
        befristung,
        faker.date.past({ refDate: befristung }).toISOString(),
      ];
      const mockZuordnungen: Array<DBiamPersonenzuordnungResponse> = mockBefristungen.map((mockBefristung: string) => ({
        befristung: mockBefristung,
        sskId: selectedOrganisation.id,
        sskName: selectedOrganisation.name,
        sskDstNr: selectedOrganisation.kennung ?? '',
        rolleId: selectedRolleId,
        rolle: selectedRolleTitle,
        administriertVon: selectedOrganisation.administriertVon ?? '',
        editable: true,
        merkmale: [] as unknown as RollenMerkmal,
        typ: selectedOrganisation.typ,
        rollenArt: RollenArt.Lern,
        admins: [faker.person.fullName()],
      }));
      const mockPersonResponses: Array<DBiamPersonenuebersichtResponse> = mockZuordnungen.map(
        (zuordnung: DBiamPersonenzuordnungResponse) => ({
          ...DoFactory.getDBiamPersonenuebersichtResponse({ zuordnungen: [zuordnung] }),
        }),
      );
      const personIds: string[] = mockPersonResponses.map(
        (response: DBiamPersonenuebersichtResponse) => response.personId,
      );

      const mockUpdateResponses: Array<PersonenkontexteUpdateResponse> = mockPersonResponses.map(
        (response: DBiamPersonenuebersichtResponse) => ({
          dBiamPersonenkontextResponses: [
            ...response.zuordnungen.map((zuordnung: DBiamPersonenzuordnungResponse) => ({
              personId: response.personId,
              organisationId: zuordnung.sskId,
              rolleId: zuordnung.rolleId,
              befristung: zuordnung.befristung,
            })),
            {
              personId: response.personId,
              organisationId: selectedOrganisationId,
              rolleId: selectedRolleId,
              befristung: isBefore(response.zuordnungen[0]!.befristung, befristung)
                ? response.zuordnungen[0]!.befristung
                : befristung,
            },
          ],
        }),
      );
      mockPersonResponses.forEach((response: DBiamPersonenuebersichtResponse) => {
        mockAdapter.onGet(`/api/dbiam/personenuebersicht/${response.personId}`).replyOnce(200, response);
      });
      mockUpdateResponses.forEach((response: PersonenkontexteUpdateResponse) => {
        mockAdapter
          .onPut(`/api/personenkontext-workflow/${response.dBiamPersonenkontextResponses[0]!.personId}`)
          .replyOnce(200, response);
      });

      const modifyPromise: Promise<void> = bulkOperationStore.bulkModifyPersonenRolle(
        personIds,
        selectedOrganisationId,
        selectedRolleId,
        rollen,
        workflowStepResponseOrganisations,
        befristung,
      );

      expect(bulkOperationStore.currentOperation?.isRunning).toBe(true);

      await modifyPromise;

      expect(personenkontextStore.errorCode).toBe('');
      expect(bulkOperationStore.currentOperation?.isRunning).toBe(false);
      expect(bulkOperationStore.currentOperation?.complete).toBe(true);
      expect(bulkOperationStore.currentOperation?.progress).toBe(100);
      expect(bulkOperationStore.currentOperation?.successMessage).toBe('admin.rolle.rollenAssignedSuccessfully');
      expect(bulkOperationStore.currentOperation?.errors).toEqual(new Map());
      mockPersonResponses.forEach((response: DBiamPersonenuebersichtResponse) => {
        const personId: string = response.personId;
        const correctBefristung: string = isBefore(response.zuordnungen[0]!.befristung, befristung)
          ? response.zuordnungen[0]!.befristung
          : befristung;
        expect(spy).toHaveBeenCalledWith(
          [
            ...response.zuordnungen,
            {
              administriertVon: selectedOrganisation.administriertVon ?? '',
              befristung: correctBefristung,
              editable: true,
              klasse: undefined,
              merkmale: [],
              rolle: selectedRolleTitle,
              rollenArt: RollenArt.Lern,
              sskDstNr: selectedOrganisation.kennung ?? '',
              sskId: selectedOrganisationId,
              rolleId: selectedRolleId,
              sskName: selectedOrganisation.name,
              typ: selectedOrganisation.typ,
            },
          ],
          personId,
        );
      });
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

  describe('bulkUnassignPersonenFromRolle', () => {
    it('should unassign person from role successfully', async () => {
      const organisationId: string = '1234';
      const rolleId: string = '5678';
      const personId: string = '1';

      const mockPersonResponse: DBiamPersonenuebersichtResponse = {
        personId: personId,
        vorname: 'John',
        nachname: 'Doe',
        benutzername: 'jdoe',
        lastModifiedZuordnungen: '2024-04-01T00:00:00.000Z',
        zuordnungen: [
          {
            sskId: organisationId, // matches organisation ID
            rolleId: rolleId, // matches rolle ID
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
            sskId: '5678', // different organisation ID
            rolleId: rolleId,
            sskName: 'Another School',
            sskDstNr: '456',
            rolle: 'Test Role',
            rollenArt: RollenArt.Lern,
            administriertVon: 'admin-org-id',
            typ: OrganisationsTyp.Schule,
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
            personId: personId,
            organisationId: '5678', // Only the non-matching zuordnung remains
            rolleId: rolleId,
          } as DBiamPersonenkontextResponse,
        ],
      };

      mockAdapter.onGet(`/api/dbiam/personenuebersicht/${personId}`).replyOnce(200, mockPersonResponse);
      mockAdapter.onPut(`/api/personenkontext-workflow/${personId}`).replyOnce(200, mockUpdateResponse);

      const unassignPromise: Promise<void> = bulkOperationStore.bulkUnassignPersonenFromRolle(organisationId, rolleId, [
        personId,
      ]);

      expect(bulkOperationStore.currentOperation?.type).toBe(OperationType.ROLLE_UNASSIGN);
      expect(bulkOperationStore.currentOperation?.isRunning).toBe(true);
      expect(bulkOperationStore.currentOperation?.progress).toBe(0);

      await unassignPromise;

      expect(bulkOperationStore.currentOperation?.isRunning).toBe(false);
      expect(bulkOperationStore.currentOperation?.complete).toBe(true);
      expect(bulkOperationStore.currentOperation?.progress).toBe(100);
      expect(bulkOperationStore.currentOperation?.errors.size).toBe(0);
      expect(bulkOperationStore.currentOperation?.successMessage).toBe('admin.rolle.rollenUnassignedSuccessfully');
    });

    it('should skip if no matching zuordnung exists', async () => {
      const organisationId: string = '1234';
      const rolleId: string = '5678';
      const personId: string = '1';

      const mockPersonResponse: DBiamPersonenuebersichtResponse = {
        personId: personId,
        vorname: 'John',
        nachname: 'Doe',
        benutzername: 'jdoe',
        lastModifiedZuordnungen: '2024-04-01T00:00:00.000Z',
        zuordnungen: [
          {
            sskId: '9999', // Different from the requested organisationId
            rolleId: '9999', // Different from the requested rolleId
            sskName: 'Another School',
            sskDstNr: '456',
            rolle: 'Test Role',
            rollenArt: RollenArt.Lern,
            administriertVon: 'admin-org-id',
            typ: OrganisationsTyp.Schule,
            editable: true,
            befristung: 'unbefristet',
            merkmale: [] as unknown as RollenMerkmal,
            admins: ['admin1'],
          },
        ],
      };

      mockAdapter.onGet(`/api/dbiam/personenuebersicht/${personId}`).replyOnce(200, mockPersonResponse);

      const unassignPromise: Promise<void> = bulkOperationStore.bulkUnassignPersonenFromRolle(organisationId, rolleId, [
        personId,
      ]);

      await unassignPromise;

      expect(bulkOperationStore.currentOperation?.isRunning).toBe(false);
      expect(bulkOperationStore.currentOperation?.complete).toBe(true);
      expect(bulkOperationStore.currentOperation?.progress).toBe(100);
      expect(bulkOperationStore.currentOperation?.errors.size).toBe(0);
      expect(bulkOperationStore.currentOperation?.successMessage).toBe('admin.rolle.rollenUnassignedSuccessfully');
    });

    it('should handle errors from personenuebersicht and personenkontext-workflow endpoints', async () => {
      const organisationId: string = '1234';
      const rolleId: string = '5678';
      const personIds: string[] = ['1', '2'];

      // Person 1: Error in personenuebersicht (GET) call
      mockAdapter.onGet(`/api/dbiam/personenuebersicht/${personIds[0]}`).replyOnce(500, { i18nKey: 'mockGetError' });

      // Person 2: Success in GET but error in personenkontext-workflow (PUT) call
      const mockPersonResponse2: DBiamPersonenuebersichtResponse = {
        personId: personIds[1]!,
        vorname: 'Jane',
        nachname: 'Doe',
        benutzername: 'jdoe2',
        lastModifiedZuordnungen: '2024-04-01T00:00:00.000Z',
        zuordnungen: [
          {
            sskId: organisationId,
            rolleId: rolleId,
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
        ],
      };
      mockAdapter.onGet(`/api/dbiam/personenuebersicht/${personIds[1]}`).replyOnce(200, mockPersonResponse2);
      mockAdapter.onPut(`/api/personenkontext-workflow/${personIds[1]}`).replyOnce(500, { i18nKey: 'mockPutError' });

      const unassignPromise: Promise<void> = bulkOperationStore.bulkUnassignPersonenFromRolle(
        organisationId,
        rolleId,
        personIds,
      );

      await unassignPromise;

      expect(bulkOperationStore.currentOperation?.isRunning).toBe(false);
      expect(bulkOperationStore.currentOperation?.complete).toBe(true);
      expect(bulkOperationStore.currentOperation?.progress).toBe(100);
      expect(bulkOperationStore.currentOperation?.errors.size).toBe(2);
      expect(bulkOperationStore.currentOperation?.errors.get(personIds[0]!)).toBe('mockGetError');
      expect(bulkOperationStore.currentOperation?.errors.get(personIds[1]!)).toBe('mockGetError');
      expect(bulkOperationStore.currentOperation?.successMessage).toBeUndefined(); // No success message because there are errors
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
