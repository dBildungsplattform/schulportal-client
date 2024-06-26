import { computed, type ComputedRef } from 'vue';
import { useOrganisationStore } from '@/stores/OrganisationStore';
import type { Organisation, OrganisationStore } from '@/stores/OrganisationStore';

interface TranslatedObject {
  value: string;
  title: string;
}

export function useKlassen(): ComputedRef<TranslatedObject[]> {
  const organisationStore: OrganisationStore = useOrganisationStore();

  return computed(() => {
    return organisationStore.klassen
      .map((org: Organisation) => ({
        value: org.id,
        title: org.name,
      }))
      .sort((a: TranslatedObject, b: TranslatedObject) => a.title.localeCompare(b.title));
  });
}