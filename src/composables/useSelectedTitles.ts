// src/composables/useTitles.ts
import { computed, type ComputedRef, type Ref } from 'vue';

interface TranslatedObject {
  value: string;
  title: string;
}

export type SelectedTitles = {
  selectedOrganisationTitle: ComputedRef<string | undefined>;
  selectedRolleTitle: ComputedRef<string | undefined>;
  selectedKlasseTitle: ComputedRef<string | undefined>;
};

export function useSelectedTitles(
  organisationen: ComputedRef<TranslatedObject[] | undefined>,
  rollen: ComputedRef<TranslatedObject[] | undefined>,
  klassen: ComputedRef<TranslatedObject[] | undefined>,
  selectedOrganisation: Ref<string>,
  selectedRolle: Ref<string>,
  selectedKlasse: Ref<string>,
): SelectedTitles {
  // Computed property to get the title of the selected organisation
  const selectedOrganisationTitle: ComputedRef<string | undefined> = computed(() => {
    return organisationen.value?.find((org: TranslatedObject) => org.value === selectedOrganisation.value)?.title;
  });

  // Computed property to get the title of the selected role
  const selectedRolleTitle: ComputedRef<string | undefined> = computed(() => {
    return rollen.value?.find((rolle: TranslatedObject) => rolle.value === selectedRolle.value)?.title;
  });

  // Computed property to get the title of the selected class
  const selectedKlasseTitle: ComputedRef<string | undefined> = computed(() => {
    return klassen.value?.find((klasse: TranslatedObject) => klasse.value === selectedKlasse.value)?.title;
  });

  return {
    selectedOrganisationTitle,
    selectedRolleTitle,
    selectedKlasseTitle,
  };
}
