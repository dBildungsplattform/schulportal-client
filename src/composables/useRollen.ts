import { usePersonenkontextStore, type PersonenkontextStore } from '@/stores/PersonenkontextStore';
import type { RollenArt, RolleResponse } from '@/stores/RolleStore';
import { computed, type ComputedRef } from 'vue';

type RolleWithRollenart = {
  value: string;
  title: string;
  Rollenart: RollenArt;
};
export function useRollen(): ComputedRef<RolleWithRollenart[] | undefined> {
  const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();

  return computed(() => {
    return personenkontextStore.workflowStepResponse?.rollen
      .slice(0, 25)
      .map((rolle: RolleResponse) => ({
        value: rolle.id,
        title: rolle.name,
        Rollenart: rolle.rollenart, // Include Rollenart in the object
      }))
      .sort((a: RolleWithRollenart, b: RolleWithRollenart) => a.title.localeCompare(b.title));
  });
}
