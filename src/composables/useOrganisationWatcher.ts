// src/composables/useOrganisationWatcher.ts
import { watch, type Ref } from 'vue';
import { usePersonenkontextStore, type PersonenkontextStore } from '@/stores/PersonenkontextStore';
import { useOrganisationStore, type OrganisationStore } from '@/stores/OrganisationStore';

export type SelectedField = 'selectedKlasse' | 'selectedRolle' | 'selectedOrganisation';

export function useOrganisationWatcher(
  selectedOrganisation: Ref<string>,
  resetField: (field: SelectedField) => void,
): void {
  const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();
  const organisationStore: OrganisationStore = useOrganisationStore();

  watch(selectedOrganisation, (newValue: string, oldValue: string) => {
    if (newValue && newValue !== oldValue) {
      resetField('selectedKlasse');
      resetField('selectedRolle');
      // This is mainly to fetch the rollen after selecting the orga
      personenkontextStore.processWorkflowStep({
        organisationId: newValue,
        limit: 25,
      });
      // Call fetch with an empty string to get the initial organizations for the selected role without any filter
      organisationStore.getKlassenByOrganisationId(newValue);
    } else if (!newValue) {
      resetField('selectedKlasse');
      resetField('selectedRolle');
    }
  });
}
