import { useBulkOperationStore, type BulkOperationStore } from '@/stores/BulkOperationStore';
import type { PersonWithZuordnungen } from '@/stores/types/PersonWithZuordnungen';
import { type Composer } from 'vue-i18n';

export type BulkErrorList = {
  id: string;
  vorname: string;
  nachname: string;
  username: string;
  error: string;
};

/**
 * Helper to translate with fallback keys.
 * Tries each key in order and returns the first successful translation,
 * or the fallback string if none are found.
 */
function translateWithFallback(t: Composer['t'], keys: string[], errorCode: string): string {
  for (const key of keys) {
    const result: string = t(key);
    if (result !== key) return result;
  }
  // Fallback to a generic message with the error code appended
  const fallbackBase: string = t(
    'admin.personenkontext.errors.fallbackError',
    {},
    { default: 'Es ist ein Fehler aufgetreten.' },
  );
  return `${fallbackBase} (Fehlercode: ${errorCode})`;
}

/**
 * Composable function to map bulk operation errors to a list of detailed error objects.
 *
 * This function retrieves the current bulk operation errors from the `BulkOperationStore`,
 * matches them with the provided list of persons, and translates the error codes into
 * human-readable error messages using the i18n translation system.
 *
 * @param personen - An array of PersonenWithRolleAndZuordnung objects representing the persons
 *                  involved in the bulk operation.
 *
 * @returns An array of BulkErrorList objects, where each object contains:
 *          - `id`: The ID of the person.
 *          - `vorname`: The first name of the person.
 *          - `nachname`: The last name of the person.
 *          - `error`: The translated error message for the person.
 */
export function useBulkErrors(t: Composer['t'], personen: Map<string, PersonWithZuordnungen>): BulkErrorList[] {
  const bulkOperationStore: BulkOperationStore = useBulkOperationStore();

  return Array.from(bulkOperationStore.currentOperation?.errors.entries() || [])
    .map(([id, errorCode]: [string, string]) => {
      const person: PersonWithZuordnungen | undefined = personen.get(id);
      if (!person) return null;

      const errorTranslation: string = translateWithFallback(
        t,
        [`admin.personenkontext.errors.${errorCode}`, `admin.person.errors.${errorCode}`],
        errorCode,
      );

      return {
        id,
        nachname: person.name.familienname,
        vorname: person.name.vorname,
        username: person.referrer,
        error: errorTranslation,
      };
    })
    .filter((item: BulkErrorList | null): item is BulkErrorList => item !== null);
}
