import { computed, type ComputedRef } from 'vue';
import { useOrganisationStore } from '@/stores/OrganisationStore';
import type { Organisation, OrganisationStore } from '@/stores/OrganisationStore';
import { type TranslatedObject } from '@/types.d';

export function useSchulen(): ComputedRef<TranslatedObject[]> {
  const organisationStore: OrganisationStore = useOrganisationStore();

  return computed(() => {
    return organisationStore.allSchulen.slice(0, 25).map((org: Organisation) => ({
      value: org.id,
      title: org.kennung ? `${org.kennung} (${org.name})` : org.name,
    }));
  });
}
