import { watch, type Ref } from 'vue';
import { usePersonenkontextStore, type PersonenkontextStore } from '@/stores/PersonenkontextStore';

export function useRolleWatcher(
  selectedRolle: Ref<string>,
  selectedOrganisation: Ref<string>,
  canCommit: Ref<boolean>,
): void {
  const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();

  watch(selectedRolle, async (newValue: string, oldValue: string) => {
    if (newValue && newValue !== oldValue) {
      // Call fetch with an empty string to get the initial organizations for the selected role without any filter
      await personenkontextStore.processWorkflowStep({
        organisationId: selectedOrganisation.value,
        rolleId: newValue,
        limit: 25,
      });
      canCommit.value = personenkontextStore.workflowStepResponse?.canCommit ?? false;
    }
  });
}
