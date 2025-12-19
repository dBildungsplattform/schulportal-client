import type { InternalZuordnung } from '@/stores/types/bulkOperationTypes';
import type { Organisation } from '@/stores/OrganisationStore';
import type { Zuordnung } from '@/stores/types/Zuordnung';
import { isBefore, parseISO } from 'date-fns';

export function findOrganisationById(organisations: Organisation[], id: string): Organisation | undefined {
  return organisations.find((org: Organisation) => org.id === id);
}
 
export function hasZuordnungForOrganisation(zuordnungen: InternalZuordnung[], organisationId: string): boolean {
  return zuordnungen.some((z) => z.organisationId === organisationId);
}

export function calculateEarliestBefristung(
  newBefristung: string,
  currentZuordnungen: InternalZuordnung[],
  organisationId: string,
): string {
  const parsedNew: Date = parseISO(newBefristung);
  return currentZuordnungen.reduce((earliest: string, z: InternalZuordnung) => {
    if (z.organisationId === organisationId && z.befristung) {
      const parsedOld: Date = parseISO(z.befristung);
      return isBefore(parsedOld, parsedNew) ? z.befristung : earliest;
    }
    return earliest;
  }, newBefristung);
}

export function hasEditableZuordnungsLeft(zuordnungen: Zuordnung[], shouldRemove: (z: Zuordnung) => boolean): boolean {
  return zuordnungen.filter((z: Zuordnung) => !shouldRemove(z) && z.editable).length > 0;
}
