import type { InternalZuordnung } from '@/stores/types/bulkOperationTypes';

/**
 * Builds Klassen zuordnungen based on selected Klasse or existing Klassen for a person.
 *
 * Logic:
 * - If selectedKlasseId is provided: Creates a single zuordnung for that Klasse
 * - If no selectedKlasseId:
 *   - If person already has the Rolle in any Klasse: Updates befristung for those Klassen
 *   - If person doesn't have the Rolle: Creates zuordnungen for all existing Klassen
 *
 * @param selectedKlasseId - Optional specific Klasse ID to assign
 * @param selectedRolleId - The Rolle ID to assign
 * @param currentZuordnungen - Person's current zuordnungen
 * @param organisationId - The organisation ID that administers the Klassen
 * @param befristung - Optional expiration date for the zuordnung
 * @returns Array of Klassen zuordnungen to be created/updated
 */
export function buildKlassenZuordnungen(
  selectedKlasseId: string | undefined,
  selectedRolleId: string,
  currentZuordnungen: InternalZuordnung[],
  organisationId: string,
  befristung?: string,
): InternalZuordnung[] {
  // If specific Klasse selected, return just that one
  if (selectedKlasseId) {
    return [
      {
        organisationId: selectedKlasseId,
        rolleId: selectedRolleId,
        administriertVon: organisationId,
        befristung,
      },
    ];
  }

  // Get all Klassen the person already has at that organisation
  const klassenZuordnungen: InternalZuordnung[] = currentZuordnungen.filter(
    (z: InternalZuordnung) => z.administriertVon === organisationId,
  );

  // Get all Klassen the person already has at that organisation with the wanted Rolle
  const klassenWithWantedRolle: InternalZuordnung[] = klassenZuordnungen.filter(
    (z: InternalZuordnung) => z.rolleId === selectedRolleId,
  );

  // User already has the Rolle for at least one of the Klassen, just update Befristung
  if (klassenWithWantedRolle.length > 0) {
    return klassenWithWantedRolle.map((klasse: InternalZuordnung) => ({
      organisationId: klasse.organisationId,
      rolleId: selectedRolleId,
      administriertVon: organisationId,
      befristung,
    }));
  }

  // User doesn't have the Rolle, add one zuordnung for every Klasse
  // (will fail in backend if user has multiple Klassen)
  const uniqueKlassen: string[] = [...new Set(klassenZuordnungen.map((z: InternalZuordnung) => z.organisationId))];

  return uniqueKlassen.map((klasseId: string) => ({
    organisationId: klasseId,
    rolleId: selectedRolleId,
    administriertVon: organisationId,
    befristung,
  }));
}
