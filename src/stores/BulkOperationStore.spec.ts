import type { DBiamPersonenzuordnungResponse, DBiamPersonenuebersichtResponse } from '@/api-client/generated';
import type { MockInstance } from 'vitest';
import { OrganisationsTyp } from './OrganisationStore';
import { usePersonenkontextStore, type PersonenkontextStore, type Zuordnung } from './PersonenkontextStore';
import { RollenArt, RollenMerkmal } from './RolleStore';
import { useBulkOperationStore, type BulkOperationStore } from './BulkOperationStore';
import { createPinia, setActivePinia } from 'pinia';
import { usePersonStore, type PersonStore } from './PersonStore';

describe('BulkOperationStore', () => {
  let bulkOperationStore: BulkOperationStore;
  let personStore: PersonStore;
  let personenkontextStore: PersonenkontextStore;
  beforeEach(() => {
    setActivePinia(createPinia());
    bulkOperationStore = useBulkOperationStore();
    personStore = usePersonStore();
    personenkontextStore = usePersonenkontextStore();
  });

  describe('unassignPersonenFromOrg', () => {
    const mockPersonId: string = '1';
    const mockError: string = 'some error';

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

    const mockSchuleZuordnung2: DBiamPersonenzuordnungResponse = { ...mockSchuleZuordnung, sskId: '84573' };

    const mockKlasseZuordnung: DBiamPersonenzuordnungResponse = {
      sskId: '4321',
      rolleId: '5678',
      sskName: 'some ssk name',
      sskDstNr: '123',
      rolle: 'some role',
      rollenArt: RollenArt.Lern,
      administriertVon: '1234',
      typ: OrganisationsTyp.Klasse,
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
      zuordnungen: [mockSchuleZuordnung, mockKlasseZuordnung, mockSchuleZuordnung2],
      lastModifiedZuordnungen: '2024-03-24T16:35:32.711Z',
    };

    const personWithoutOrg: DBiamPersonenuebersichtResponse = {
      personId: mockPersonId,
      vorname: 'John',
      nachname: 'Doe',
      benutzername: 'jdoe',
      zuordnungen: [],
      lastModifiedZuordnungen: '2024-03-24T16:35:32.711Z',
    };

    beforeEach(() => {
      personStore.$reset();
      personenkontextStore.$reset();

      personStore.getPersonenuebersichtById = vi.fn(async (_personId: string) => Promise.resolve());
      personenkontextStore.updatePersonenkontexte = vi.fn(
        async (_zuordnungen: Zuordnung[] | undefined, _personId: string) => {
          return Promise.resolve();
        },
      );

      personStore.personenuebersicht = person;
    });

    test('should unassign person from Organisation', async () => {
      const spy: MockInstance = vi.spyOn(personenkontextStore, 'updatePersonenkontexte');

      await bulkOperationStore.unassignPersonenFromOrg('1234', [mockPersonId]);

      expect(spy).toHaveBeenCalledWith([mockSchuleZuordnung2], mockPersonId);
    });

    test('should skip if not at org', async () => {
      personStore.personenuebersicht = personWithoutOrg;

      const spy: MockInstance = vi.spyOn(personenkontextStore, 'updatePersonenkontexte');
      await bulkOperationStore.unassignPersonenFromOrg('1234', [mockPersonId]);

      expect(spy).not.toHaveBeenCalled();
      expect(bulkOperationStore.progress).toEqual(100);
    });

    test('should handle personstore error', async () => {
      personStore.errorCode = mockError;
      await bulkOperationStore.unassignPersonenFromOrg('1234', [mockPersonId]);

      expect(bulkOperationStore.errors).toHaveLength(1);
      expect(bulkOperationStore.errors.get(mockPersonId)).toEqual(mockError);
    });

    test('should handle personenkontext error', async () => {
      personenkontextStore.errorCode = mockError;

      await bulkOperationStore.unassignPersonenFromOrg('1234', [mockPersonId]);

      expect(bulkOperationStore.errors).toHaveLength(1);
      expect(bulkOperationStore.errors.get(mockPersonId)).toEqual(mockError);
    });

    test('should skip person id missing personenuebersicht', async () => {
      personStore.personenuebersicht = null;

      const spy: MockInstance = vi.spyOn(personenkontextStore, 'updatePersonenkontexte');
      await bulkOperationStore.unassignPersonenFromOrg('1234', [mockPersonId]);

      expect(spy).not.toHaveBeenCalled();
      expect(bulkOperationStore.progress).toEqual(100);
    });
  });
});
