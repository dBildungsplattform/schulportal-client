import { usePersonenkontextStore, type PersonenkontextStore } from '@/stores/PersonenkontextStore';
import type { RolleResponse } from '@/stores/RolleStore';
import { computed, type ComputedRef } from 'vue';

interface TranslatedObject {
  value: string;
  title: string;
}

export function useRollen(): ComputedRef<TranslatedObject[] | undefined> {
  const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();

  return computed(() => {
    return personenkontextStore.workflowStepResponse?.rollen
      .slice(0, 25)
      .map((rolle: RolleResponse) => ({
        value: rolle.id,
        title: rolle.name,
        Rollenart: rolle.rollenart, // Include Rollenart in the object
      }))
      .sort((a: TranslatedObject, b: TranslatedObject) => a.title.localeCompare(b.title));
  });
}
