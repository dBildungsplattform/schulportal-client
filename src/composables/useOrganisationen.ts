import type { Organisation } from '@/stores/OrganisationStore';
import { usePersonenkontextStore, type PersonenkontextStore } from '@/stores/PersonenkontextStore';
import { computed, type ComputedRef } from 'vue';
import { type TranslatedObject } from '@/types.d';

export function useOrganisationen(): ComputedRef<TranslatedObject[] | undefined> {
  const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();

  return computed(() => {
    return personenkontextStore.workflowStepResponse?.organisations.map((org: Organisation) => ({
      value: org.id,
      title: org.kennung ? `${org.kennung} (${org.name})` : org.name,
    }));
  });
}
