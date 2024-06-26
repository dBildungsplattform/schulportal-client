import type { Ref } from 'vue';
import { usePersonenkontextStore, type PersonenkontextStore } from '@/stores/PersonenkontextStore';
import { useOrganisationStore, type OrganisationStore } from '@/stores/OrganisationStore';

export type SearchUpdates = {
  updateOrganisationSearch: (searchValue: string) => void;
  updateRollenSearch: (searchValue: string) => void;
  updateKlassenSearch: (searchValue: string) => void;
};

export function useSearchUpdates(
  selectedOrganisation: Ref<string>,
  selectedRolle: Ref<string>,
  selectedKlasse: Ref<string>,
  selectedOrganisationTitle: Ref<string | undefined>,
  selectedRolleTitle: Ref<string | undefined>,
  selectedKlasseTitle: Ref<string | undefined>,
  timerId: Ref<ReturnType<typeof setTimeout> | undefined>,
): SearchUpdates {
  const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();
  const organisationStore: OrganisationStore = useOrganisationStore();

  function updateOrganisationSearch(searchValue: string): void {
    clearTimeout(timerId.value);
    // If searchValue is empty and selectedOrganisation does not have a value, fetch data without getKlassenByOrganisationId
    if (searchValue === '' && !selectedOrganisation.value) {
      timerId.value = setTimeout(async () => {
        await personenkontextStore.processWorkflowStep({
          limit: 25,
        });
      }, 500);
    } else if (searchValue && searchValue !== selectedOrganisationTitle.value) {
      // If searchValue is not empty and different from the current title, proceed with the search
      // (This stops an extra request being made once a value is selected)
      timerId.value = setTimeout(async () => {
        await personenkontextStore.processWorkflowStep({
          organisationName: searchValue,
          limit: 25,
        });
      }, 500);
    }
  }

  function updateRollenSearch(searchValue: string): void {
    // If searchValue is empty, fetch all roles for the organisationId
    if (searchValue === '' && !selectedRolle.value) {
      timerId.value = setTimeout(() => {
        personenkontextStore.processWorkflowStep({
          organisationId: selectedOrganisation.value,
          limit: 25,
        });
      }, 500);
      // Else fetch the Rollen that correspond to the orgaId
      // (This stops an extra request being made once a value is selected since we check if model !== searchValue)
    } else if (searchValue && searchValue !== selectedRolleTitle.value) {
      timerId.value = setTimeout(() => {
        personenkontextStore.processWorkflowStep({
          organisationId: selectedOrganisation.value,
          rolleName: searchValue,
          limit: 25,
        });
      }, 500);
    }
  }

  function updateKlassenSearch(searchValue: string): void {
    // If searchValue is empty, fetch all roles for the organisationId
    if (searchValue === '' && !selectedKlasse.value) {
      timerId.value = setTimeout(() => {
        organisationStore.getKlassenByOrganisationId(selectedOrganisation.value, searchValue);
      }, 500);
    } else if (searchValue && searchValue !== selectedKlasseTitle.value) {
      /* cancel pending call */
      clearTimeout(timerId.value);
      /* delay new call 500ms */
      timerId.value = setTimeout(() => {
        organisationStore.getKlassenByOrganisationId(selectedOrganisation.value, searchValue);
      }, 500);
    }
  }

  return {
    updateOrganisationSearch,
    updateRollenSearch,
    updateKlassenSearch,
  };
}
