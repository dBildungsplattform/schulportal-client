import { OperationType, useBulkOperationStore, type BulkOperationStore } from '@/stores/BulkOperationStore';
import type { PersonWithZuordnungen } from '@/stores/types/PersonWithZuordnungen';
import { DoFactory } from 'test/DoFactory';
import type { MockInstance } from 'vitest';
import { useBulkErrors, type BulkErrorList } from './useBulkErrors';
import type { Composer } from 'vue-i18n';

describe('useBulkErrors', () => {
  let personen: Map<string, PersonWithZuordnungen>;
  let bulkOperationStore: BulkOperationStore;
  const mockTranslate: MockInstance = vi.fn((key: string | number) => key);

  beforeEach(() => {
    personen = new Map<string, PersonWithZuordnungen>();
    bulkOperationStore = useBulkOperationStore();
    bulkOperationStore.currentOperation = {
      type: OperationType.CHANGE_KLASSE,
      isRunning: false,
      progress: 100,
      complete: true,
      successMessage: '',
      data: new Map<string, string>(),
      errors: new Map<string, string>(),
    };

    for (let index: number = 0; index < 5; index++) {
      const person: PersonWithZuordnungen = DoFactory.getPersonWithZuordnung();
      personen.set(person.id, person);
      bulkOperationStore.currentOperation.errors.set(person.id, 'errorCode');
    }
  });

  test('returns errorList', () => {
    const bulkErrorList: Array<BulkErrorList> = useBulkErrors(mockTranslate as unknown as Composer['t'], personen);

    expect(bulkErrorList).toHaveLength(5);
    for (const person of personen.values()) {
      expect(bulkErrorList).toContainEqual({
        id: person.id,
        vorname: person.name.vorname,
        nachname: person.name.familienname,
        username: person.referrer,
        error: 'admin.personenkontext.errors.fallbackError (Fehlercode: errorCode)',
      });
    }
  });
});
