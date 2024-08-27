<script setup lang="ts">
  import { computed, type ComputedRef, type Ref, ref, watch } from 'vue';
  import { RollenArt } from '@/stores/RolleStore';
  import { useI18n } from 'vue-i18n';
  import FormRow from '@/components/form/FormRow.vue';
  import { usePersonenkontextStore, type PersonenkontextStore } from '@/stores/PersonenkontextStore';
  import { useOrganisationStore, type OrganisationStore } from '@/stores/OrganisationStore';
  import { type TranslatedObject } from '@/types.d';
  import type { BaseFieldProps } from 'vee-validate';

  useI18n({ useScope: 'global' });

  const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();
  const organisationStore: OrganisationStore = useOrganisationStore();

  const timerId: Ref<ReturnType<typeof setTimeout> | undefined> = ref<ReturnType<typeof setTimeout>>();
  const canCommit: Ref<boolean> = ref(false);
  const hasAutoselectedSchule: Ref<boolean> = ref(false);

  const searchInputOrganisation: Ref<string> = ref('');
  const searchInputRolle: Ref<string> = ref('');

  let isSearching: boolean = false;

  type RolleWithRollenart = {
    value: string;
    title: string;
    Rollenart: RollenArt;
  };

  type Props = {
    organisationen: TranslatedObject[] | undefined;
    rollen: RolleWithRollenart[] | undefined;
    klassen: TranslatedObject[] | undefined;
    selectedOrganisationProps: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
    selectedRolleProps: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
    selectedKlasseProps: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
    selectedOrganisation: string | undefined;
    selectedRolle: string | undefined;
    selectedKlasse?: string | undefined;
    showHeadline: boolean;
  };

  const props: Props = defineProps<Props>();

  type Emits = {
    (event: 'update:selectedOrganisation', value: string | undefined): void;
    (event: 'update:selectedRolle', value: string | undefined): void;
    (event: 'update:selectedKlasse', value: string | undefined): void;
    (event: 'update:canCommit', value: boolean): void;
    (event: 'fieldReset', field: 'selectedOrganisation' | 'selectedRolle' | 'selectedKlasse'): void;
  };
  const emits: Emits = defineEmits<Emits>();

  const selectedOrganisation: Ref<string | undefined> = ref(props.selectedOrganisation);
  const selectedRolle: Ref<string | undefined> = ref(props.selectedRolle);
  const selectedKlasse: Ref<string | undefined> = ref(props.selectedKlasse);

  // Computed property to get the title of the selected organisation
  const selectedOrganisationTitle: ComputedRef<string | undefined> = computed(() => {
    return props.organisationen?.find((org: TranslatedObject) => org.value === selectedOrganisation.value)?.title;
  });

  // Computed property to get the title of the selected role
  const selectedRolleTitle: ComputedRef<string | undefined> = computed(() => {
    return props.rollen?.find((rolle: TranslatedObject) => rolle.value === selectedRolle.value)?.title;
  });

  // Computed property to get the title of the selected class
  const selectedKlasseTitle: ComputedRef<string | undefined> = computed(() => {
    return props.klassen?.find((klasse: TranslatedObject | undefined) => klasse?.value === selectedKlasse.value)?.title;
  });

  function isLernRolle(selectedRolleId: string | undefined): boolean {
    const rolle: RolleWithRollenart | undefined = props.rollen?.find(
      (r: RolleWithRollenart) => r.value === selectedRolleId,
    );
    return !!rolle && rolle.Rollenart === RollenArt.Lern;
  }

  // Watcher for selectedOrganisation to fetch roles and classes
  watch(selectedOrganisation, (newValue: string | undefined, oldValue: string | undefined) => {
    if (newValue && newValue !== oldValue) {
      // Fetch the roles after selecting the organization
      personenkontextStore.processWorkflowStep({
        organisationId: newValue,
        limit: 25,
      });

      // Fetch all classes for the selected organization without any filter
      organisationStore.getKlassenByOrganisationId(newValue);

      // Reset the selectedRolle field only if oldValue was not undefined
      if (oldValue !== undefined) {
        selectedRolle.value = undefined;
        emits('fieldReset', 'selectedRolle');
      }
    } else if (!newValue) {
      // If the organization is cleared, reset selectedRolle and selectedKlasse
      selectedRolle.value = undefined;
      selectedKlasse.value = undefined;
      emits('fieldReset', 'selectedRolle');
      emits('fieldReset', 'selectedKlasse');
    }
    // Emit the new selected organization to the parent component
    emits('update:selectedOrganisation', newValue);
  });

  watch(selectedRolle, async (newValue: string | undefined, oldValue: string | undefined) => {
    if (newValue && newValue !== oldValue) {
      // Call fetch with an empty string to get the initial organizations for the selected role without any filter
      await personenkontextStore.processWorkflowStep({
        organisationId: selectedOrganisation.value,
        rolleId: newValue,
        limit: 25,
      });
      canCommit.value = personenkontextStore.workflowStepResponse?.canCommit ?? false;
      emits('update:canCommit', canCommit.value);
    }
    if (!newValue) {
      // Set canCommit to false and reset Klasse
      emits('update:canCommit', false);
      selectedKlasse.value = undefined;
      emits('fieldReset', 'selectedKlasse');
    }
    // Emit the new selected value to the parent
    emits('update:selectedRolle', newValue);
  });

  watch(selectedKlasse, (newValue: string | undefined) => {
    emits('update:selectedKlasse', newValue);
  });

  // Using a watcher instead of modelUpdate since we need the old Value as well.
  // Default behavior of the autocomplete is to reset the newValue to empty string and that causes another request to be made
  watch(searchInputOrganisation, async (newValue: string, oldValue: string) => {
    clearTimeout(timerId.value);
    isSearching = !!newValue;
    if (oldValue === selectedOrganisationTitle.value) {
      return;
    }
    // If searchValue is empty and selectedOrganisation does not have a value, fetch initial data
    if (newValue === '' && !selectedOrganisation.value) {
      timerId.value = setTimeout(async () => {
        await personenkontextStore.processWorkflowStep({
          limit: 25,
        });
      }, 500);
    } else if (newValue && newValue !== selectedOrganisationTitle.value) {
      // If searchValue is not empty and different from the current title, proceed with the search
      // Reset selectedRolle only if it's a new search and not when selecting an organization
      selectedRolle.value = undefined;
      emits('fieldReset', 'selectedRolle');
      emits('update:selectedRolle', undefined);

      timerId.value = setTimeout(async () => {
        await personenkontextStore.processWorkflowStep({
          organisationName: newValue,
          limit: 25,
        });
      }, 500);
    } else if (newValue === '' && selectedOrganisation.value) {
      // If searchValue is empty and an organization is selected, fetch roles for the selected organization
      timerId.value = setTimeout(async () => {
        await personenkontextStore.processWorkflowStep({
          organisationId: selectedOrganisation.value,
          limit: 25,
        });
      }, 500);
    }
  });

  watch(searchInputRolle, async (newValue: string, oldValue: string) => {
    clearTimeout(timerId.value);
    // If the oldValue (What has been in the searchValue beforing losing focus) is equal to the selected Rolle.title then do nothing
    if (oldValue === selectedRolleTitle.value) return;
    // If searchValue is empty, fetch all roles for the organisationId
    if (newValue === '' && !selectedRolle.value) {
      timerId.value = setTimeout(() => {
        personenkontextStore.processWorkflowStep({
          organisationId: selectedOrganisation.value,
          limit: 25,
        });
      }, 500);
      // Else fetch the Rollen that correspond to the orgaId
      // (This stops an extra request being made once a value is selected since we check if model !== searchValue)
    } else if (newValue && newValue !== selectedRolleTitle.value) {
      timerId.value = setTimeout(() => {
        personenkontextStore.processWorkflowStep({
          organisationId: selectedOrganisation.value,
          rolleName: newValue,
          limit: 25,
        });
      }, 500);
    }
  });

  function updateKlassenSearch(searchValue: string): void {
    clearTimeout(timerId.value);
    const organisationId: string | undefined = selectedOrganisation.value;

    if (!organisationId) {
      return;
    }
    // If searchValue is empty, fetch all roles for the organisationId
    if (searchValue === '' && !selectedKlasse.value) {
      timerId.value = setTimeout(() => {
        organisationStore.getKlassenByOrganisationId(organisationId, { searchString: searchValue });
      }, 500);
    } else if (searchValue && searchValue !== selectedKlasseTitle.value) {
      /* cancel pending call */
      clearTimeout(timerId.value);
      /* delay new call 500ms */
      timerId.value = setTimeout(() => {
        organisationStore.getKlassenByOrganisationId(organisationId, { searchString: searchValue });
      }, 500);
    }
  }

  // Clear the selected Organisation once the input field is cleared (This is the only way to fetch all Orgas again)
  // This is also important since we only want to fetch all orgas once the selected Orga is null, otherwise an extra request is made with an empty string
  function clearSelectedOrganisation(): void {
    emits('fieldReset', 'selectedOrganisation');
  }
  // Clear the selected Rolle once the input field is cleared (This is the only way to fetch all Rollen again)
  // This is also important since we only want to fetch all orgas once the selected Rolle is null, otherwise an extra request is made with an empty string
  function clearSelectedRolle(): void {
    emits('fieldReset', 'selectedRolle');
  }

  watch(
    () => props.organisationen,
    async (newOrganisations: TranslatedObject[] | undefined, _oldOrganisations: TranslatedObject[] | undefined) => {
      if (!isSearching && newOrganisations && newOrganisations.length === 1) {
        hasAutoselectedSchule.value = true;
        selectedOrganisation.value = newOrganisations[0]?.value;
        emits('update:selectedOrganisation', selectedOrganisation.value);
      }
    },
    { immediate: true },
  );
</script>

<template>
  <div>
    <v-row v-if="showHeadline">
      <h3 class="headline-3">1. {{ $t('admin.organisation.assignOrganisation') }}</h3>
    </v-row>
    <!-- Organisation zuordnen -->
    <FormRow
      :errorLabel="selectedOrganisationProps['error']"
      :isRequired="true"
      labelForId="organisation-select"
      :label="$t('admin.organisation.organisation')"
    >
      <v-autocomplete
        class="mb-5"
        autocomplete="off"
        :class="[{ 'filter-dropdown mb-4': hasAutoselectedSchule }, { selected: selectedOrganisation }]"
        clearable
        :click:clear="clearSelectedOrganisation"
        data-testid="organisation-select"
        density="compact"
        :disabled="hasAutoselectedSchule"
        id="organisation-select"
        ref="organisation-select"
        hide-details
        :items="organisationen"
        item-value="value"
        item-text="title"
        :no-data-text="$t('noDataFound')"
        :placeholder="$t('admin.organisation.selectOrganisation')"
        required="true"
        variant="outlined"
        v-bind="selectedOrganisationProps"
        v-model="selectedOrganisation"
        v-model:search="searchInputOrganisation"
      ></v-autocomplete>
    </FormRow>

    <div v-if="selectedOrganisation">
      <v-row v-if="showHeadline">
        <h3 class="headline-3">2. {{ $t('admin.rolle.assignRolle') }}</h3>
      </v-row>
      <!-- Rollenzuordnung -->
      <FormRow
        :errorLabel="selectedRolleProps['error']"
        labelForId="rolle-select"
        :isRequired="true"
        :label="$t('admin.rolle.rolle')"
      >
        <v-autocomplete
          autocomplete="off"
          clearable
          @clear="clearSelectedRolle"
          data-testid="rolle-select"
          density="compact"
          id="rolle-select"
          ref="rolle-select"
          :items="rollen"
          item-value="value"
          item-text="title"
          :no-data-text="$t('noDataFound')"
          :placeholder="$t('admin.rolle.selectRolle')"
          required="true"
          variant="outlined"
          v-bind="selectedRolleProps"
          v-model="selectedRolle"
          v-model:search="searchInputRolle"
        ></v-autocomplete>
      </FormRow>
      <!-- Klasse zuordnen -->
      <FormRow
        v-if="isLernRolle(selectedRolle) && selectedOrganisation"
        :errorLabel="selectedKlasseProps['error']"
        :isRequired="true"
        labelForId="klasse-select"
        :label="$t('admin.klasse.klasse')"
      >
        <v-autocomplete
          autocomplete="off"
          clearable
          data-testid="klasse-select"
          density="compact"
          id="klasse-select"
          ref="klasse-select"
          :items="klassen"
          item-value="value"
          item-text="title"
          :no-data-text="$t('noDataFound')"
          :placeholder="$t('admin.klasse.selectKlasse')"
          @update:search="updateKlassenSearch"
          variant="outlined"
          v-bind="selectedKlasseProps"
          v-model="selectedKlasse"
        ></v-autocomplete>
      </FormRow>
    </div>
  </div>
</template>

<style></style>
