import type {
  DBiamPersonenzuordnungResponse,
  DBiamPersonenuebersichtResponse,
  RollenMerkmal,
} from '@/api-client/generated';
import ApiService from '@/services/ApiService';
import MockAdapter from 'axios-mock-adapter';
import { createPinia, setActivePinia } from 'pinia';
import { useBulkOperationStore, type BulkOperationStore } from './BulkOperationStore';
import { usePersonStore, type PersonStore } from './PersonStore';
import { usePersonenkontextStore, type PersonenkontextStore } from './PersonenkontextStore';
import { OrganisationsTyp } from './OrganisationStore';
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
    personStore.personenuebersicht = person;
  });

  describe('bulkUnassignPersonenFromOrg', () => {
    it('should unassign person from Organisation successfully', async () => {
      vi.spyOn(personStore, 'getPersonenuebersichtById').mockResolvedValue();
      vi.spyOn(personenkontextStore, 'updatePersonenkontexte').mockResolvedValue();

      const unassign: Promise<void> = bulkOperationStore.bulkUnassignPersonenFromOrg('1234', [mockPersonId]);
      expect(bulkOperationStore.currentOperation?.progress).toBe(0);

      await unassign;
      expect(bulkOperationStore.currentOperation?.progress).toBe(100);
      expect(bulkOperationStore.currentOperation?.errors.size).toBe(0);
    });

    it('should skip if person has no zuordnungen', async () => {
      personStore.personenuebersicht = { ...person, zuordnungen: [] };
      vi.spyOn(personenkontextStore, 'updatePersonenkontexte').mockResolvedValue();

      await bulkOperationStore.bulkUnassignPersonenFromOrg('1234', [mockPersonId]);
      expect(bulkOperationStore.currentOperation?.progress).toBe(100);
    });

    it('should skip if personenuebersicht is missing', async () => {
      personStore.personenuebersicht = null;
      vi.spyOn(personStore, 'getPersonenuebersichtById').mockResolvedValue();

      await bulkOperationStore.bulkUnassignPersonenFromOrg('1234', [mockPersonId]);
      expect(bulkOperationStore.currentOperation?.progress).toBe(100);
    });
  });
});
