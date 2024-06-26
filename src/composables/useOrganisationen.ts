import type { Organisation } from '@/stores/OrganisationStore';
import { usePersonenkontextStore, type PersonenkontextStore } from '@/stores/PersonenkontextStore';
import { computed, type ComputedRef } from 'vue';

interface TranslatedObject {
  value: string;
  title: string;
}

export function useOrganisationen(): ComputedRef<TranslatedObject[] | undefined> {
  const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();

  return computed(() => {
    return personenkontextStore.workflowStepResponse?.organisations
      .slice(0, 25)
      .map((org: Organisation) => ({
        value: org.id,
        title: org.kennung ? `${org.kennung} (${org.name})` : org.name,
      }))
      .sort((a: TranslatedObject, b: TranslatedObject) => a.title.localeCompare(b.title));
  });
}
