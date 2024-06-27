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
    return organisationStore.klassen.slice(0, 25).map((org: Organisation) => ({
      value: org.id,
      title: org.name,
    }));
  });
}
