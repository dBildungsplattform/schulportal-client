import type { Zuordnung } from '@/stores/types/Zuordnung';
import type { InternalZuordnung } from '@/stores/types/bulkOperationTypes';
import type { PersonenkontextUpdate } from '@/stores/PersonenkontextStore';

/**
 * Maps Zuordnung objects to InternalZuordnung format.
 * Converts sskId to organisationId and ensures befristung is undefined instead of null.
 *
 * @param zuordnungen - Array of Zuordnung objects to map
 * @returns Array of InternalZuordnung objects
 */
export function mapToInternalZuordnungen(zuordnungen: Zuordnung[]): InternalZuordnung[] {
  return zuordnungen.map((z: Zuordnung) => ({
    organisationId: z.sskId,
    rolleId: z.rolleId,
    befristung: z.befristung ?? undefined,
    administriertVon: z.administriertVon,
  }));
}

/**
 * Filters out zuordnungen from current list that match any in the new list.
 * A match is defined as having the same organisationId AND rolleId.
 *
 * @param current - Current zuordnungen to filter
 * @param newZuordnungen - New zuordnungen to check against
 * @returns Filtered array with non-matching zuordnungen
 */
export function filterOutMatchingZuordnungen(
  current: InternalZuordnung[],
  newZuordnungen: InternalZuordnung[],
): InternalZuordnung[] {
  return current.filter(
    (c: InternalZuordnung) =>
      !newZuordnungen.some((n: InternalZuordnung) => n.organisationId === c.organisationId && n.rolleId === c.rolleId),
  );
}

/**
 * Combines current and new zuordnungen, removing duplicates and stripping administriertVon field.
 *
 * Process:
 * 1. Filters out current zuordnungen that match new ones (by organisationId + rolleId)
 * 2. Combines filtered current with new zuordnungen
 * 3. Maps to PersonenkontextUpdate format (removes administriertVon field)
 *
 * @param current - Current zuordnungen
 * @param newZuordnungen - New zuordnungen to add
 * @returns Combined array in PersonenkontextUpdate format
 */
export function combineZuordnungen(
  current: InternalZuordnung[],
  newZuordnungen: InternalZuordnung[],
): PersonenkontextUpdate[] {
  // Remove current zuordnungen that will be replaced by new ones
  const filtered: InternalZuordnung[] = filterOutMatchingZuordnungen(current, newZuordnungen);

  // Combine and convert to PersonenkontextUpdate format (strips administriertVon)
  return [...filtered, ...newZuordnungen].map(({ organisationId, rolleId, befristung }: InternalZuordnung) => ({
    organisationId,
    rolleId,
    befristung,
  }));
}
