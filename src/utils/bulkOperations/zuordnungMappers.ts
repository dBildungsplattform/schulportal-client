import type { Zuordnung } from '@/stores/types/Zuordnung';
import type { InternalZuordnung } from '@/stores/types/bulkOperationTypes';
import type { PersonenkontextUpdate } from '@/stores/PersonenkontextStore';

export function mapToInternalZuordnungen(zuordnungen: Zuordnung[]): InternalZuordnung[] {
  return zuordnungen.map((z: Zuordnung) => ({
    organisationId: z.sskId,
    rolleId: z.rolleId,
    befristung: z.befristung ?? undefined,
    administriertVon: z.administriertVon,
  }));
}

export function filterOutMatchingZuordnungen(
  current: InternalZuordnung[],
  newZuordnungen: InternalZuordnung[],
): InternalZuordnung[] {
  return current.filter(
    (c) =>
      !newZuordnungen.some((n: InternalZuordnung) => n.organisationId === c.organisationId && n.rolleId === c.rolleId),
  );
}

export function combineZuordnungen(
  current: InternalZuordnung[],
  newZuordnungen: InternalZuordnung[],
): PersonenkontextUpdate[] {
  const filtered: InternalZuordnung[] = filterOutMatchingZuordnungen(current, newZuordnungen);

  return [...filtered, ...newZuordnungen].map(({ organisationId, rolleId, befristung }: InternalZuordnung) => ({
    organisationId,
    rolleId,
    befristung,
  }));
}
