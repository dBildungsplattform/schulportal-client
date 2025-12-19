// utils/bulkOperations/klassenBuilder.ts
import type { InternalZuordnung } from '@/stores/types/bulkOperationTypes';

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

  // Otherwise, process existing Klassen
  const klassenZuordnungen: InternalZuordnung[] = currentZuordnungen.filter(
    (z: InternalZuordnung) => z.administriertVon === organisationId,
  );

  const klassenWithWantedRolle: InternalZuordnung[] = klassenZuordnungen.filter(
    (z: InternalZuordnung) => z.rolleId === selectedRolleId,
  );

  // User already has the role for some Klassen
  if (klassenWithWantedRolle.length > 0) {
    return klassenWithWantedRolle.map((klasse: InternalZuordnung) => ({
      organisationId: klasse.organisationId,
      rolleId: selectedRolleId,
      administriertVon: organisationId,
      befristung,
    }));
  }

  // User doesn't have the role, add for all Klassen
  const uniqueKlassen: string[] = [...new Set(klassenZuordnungen.map((z: InternalZuordnung) => z.organisationId))];

  return uniqueKlassen.map((klasseId: string) => ({
    organisationId: klasseId,
    rolleId: selectedRolleId,
    administriertVon: organisationId,
    befristung,
  }));
}
