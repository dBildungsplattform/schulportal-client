import { useI18n, type Composer } from 'vue-i18n';
import { useBulkOperationStore, type BulkOperationStore } from '@/stores/BulkOperationStore';
import type { PersonenWithRolleAndZuordnung } from '@/stores/PersonStore';

export type BulkErrorList = {
  id: string;
  vorname: string;
  nachname: string;
  error: string;
};

type PersonWithRolleAndZuordnung = PersonenWithRolleAndZuordnung[number];

/**
 * Composable function to map bulk operation errors to a list of detailed error objects.
 * 
 * This function retrieves the current bulk operation errors from the `BulkOperationStore`,
 * matches them with the provided list of persons, and translates the error codes into
 * human-readable error messages using the i18n translation system.
 * 
 * @param persons - An array of PersonenWithRolleAndZuordnung objects representing the persons
 *                  involved in the bulk operation.
 * 
 * @returns An array of BulkErrorList objects, where each object contains:
 *          - `id`: The ID of the person.
 *          - `vorname`: The first name of the person.
 *          - `nachname`: The last name of the person.
 *          - `error`: The translated error message for the person.
 */
export function useBulkErrors(persons: PersonenWithRolleAndZuordnung): BulkErrorList[] {
  const { t }: Composer = useI18n({ useScope: 'global' });
  const bulkOperationStore: BulkOperationStore = useBulkOperationStore();

  return Array.from(bulkOperationStore.currentOperation?.errors.entries() || [])
    .map(([id, errorCode]: [string, string]) => {
      const person: PersonWithRolleAndZuordnung | undefined = persons.find(
        (p: PersonWithRolleAndZuordnung) => p.person.id === id,
      );
      if (!person) return null;

      // Translate the error code using i18n, falling back to the error code itself if no translation is found
      const errorTranslation: string =
        t(`admin.personenkontext.errors.${errorCode}`, {}, { default: '' }) ||
        t(`admin.person.errors.${errorCode}`, {}, { default: errorCode });

      return {
        id,
        nachname: person.person.name.familienname,
        vorname: person.person.name.vorname,
        error: errorTranslation,
      };
    })
    .filter((item: BulkErrorList | null): item is BulkErrorList => item !== null);
}