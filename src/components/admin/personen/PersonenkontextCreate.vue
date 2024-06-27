<script setup lang="ts">
  import { computed, type ComputedRef, type Ref, ref, watch } from 'vue';
  import { RollenArt } from '@/stores/RolleStore';
  import { useI18n } from 'vue-i18n';
  import FormRow from '@/components/form/FormRow.vue';
  import { usePersonenkontextStore, type PersonenkontextStore } from '@/stores/PersonenkontextStore';
  import { useOrganisationStore, type OrganisationStore } from '@/stores/OrganisationStore';

  useI18n({ useScope: 'global' });

  const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();
  const organisationStore: OrganisationStore = useOrganisationStore();

  const timerId: Ref<ReturnType<typeof setTimeout> | undefined> = ref<ReturnType<typeof setTimeout>>();
  const canCommit: Ref<boolean> = ref(false);
  type RolleWithRollenart = {
    value: string;
    title: string;
    Rollenart: RollenArt;
  };

  type TranslatedObject = {
    value: string;
    title: string;
  };

  const props = defineProps({
    organisationen: { type: Array<TranslatedObject>, required: true },
    rollen: { type: Array<RolleWithRollenart>, required: true },
    klassen: { type: Array<TranslatedObject>, required: true },
    selectedOrganisationProps: { type: Object, required: true },
    selectedRolleProps: { type: Object, required: true },
    selectedKlasseProps: { type: Object, required: true },
    selectedOrganisation: { type: String, required: true },
    selectedRolle: { type: String, required: true },
    selectedKlasse: { type: String, required: false },
    showHeadline: { type: Boolean, required: true },
  });

  const emits = defineEmits([
    'update:selectedOrganisation',
    'update:selectedRolle',
    'update:selectedKlasse',
    'update:canCommit',
    'fieldReset',
  ]);

  const selectedOrganisation: Ref<string> = ref(props.selectedOrganisation);
  const selectedRolle: Ref<string | undefined> = ref(props.selectedRolle);
  const selectedKlasse: Ref<string | undefined> = ref(props.selectedKlasse);

  // Computed property to get the title of the selected organisation
  const selectedOrganisationTitle: ComputedRef<string | undefined> = computed(() => {
    return props.organisationen.find((org: TranslatedObject) => org.value === selectedOrganisation.value)?.title;
  });

  // Computed property to get the title of the selected role
  const selectedRolleTitle: ComputedRef<string | undefined> = computed(() => {
    return props.rollen.find((rolle: TranslatedObject) => rolle.value === selectedRolle.value)?.title;
  });

  // Computed property to get the title of the selected class
  const selectedKlasseTitle: ComputedRef<string | undefined> = computed(() => {
    return props.klassen.find((klasse: TranslatedObject | undefined) => klasse?.value === selectedKlasse.value)?.title;
  });

  function isLernRolle(selectedRolleId: string | undefined): boolean {
    const rolle: RolleWithRollenart | undefined = props.rollen.find(
      (r: RolleWithRollenart) => r.value === selectedRolleId,
    );
    return !!rolle && rolle.Rollenart === RollenArt.Lern;
  }
  watch(selectedOrganisation, (newValue: string, oldValue: string) => {
    if (newValue && newValue !== oldValue) {
      // This is mainly to fetch the rollen after selecting the orga
      personenkontextStore.processWorkflowStep({
        organisationId: newValue,
        limit: 25,
      });
      // Call fetch with an empty string to get the initial organizations for the selected role without any filter
      organisationStore.getKlassenByOrganisationId(newValue);
    } else if (!newValue) {
      // If the organisation is flushed then clear the Rolle and Klasse by emitting undefined values for them
      selectedRolle.value = undefined;
      selectedKlasse.value = undefined;
      emits('fieldReset', 'selectedRolle');
      emits('fieldReset', 'selectedKlasse');
    }
    // Emit the new selected Organisation to the parent
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
      selectedRolle.value = undefined;
      emits('fieldReset', 'selectedRolle');
      emits('update:selectedRolle', null);
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
    clearTimeout(timerId.value);
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
    clearTimeout(timerId.value);
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
        autocomplete="off"
        clearable
        :click:clear="clearSelectedOrganisation"
        data-testid="organisation-select"
        density="compact"
        id="organisation-select"
        ref="organisation-select"
        :items="organisationen"
        item-value="value"
        item-text="title"
        :no-data-text="$t('noDataFound')"
        :placeholder="$t('admin.organisation.selectOrganisation')"
        required="true"
        @update:search="updateOrganisationSearch"
        variant="outlined"
        v-bind="selectedOrganisationProps"
        v-model="selectedOrganisation"
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
          @update:search="updateRollenSearch"
          variant="outlined"
          v-bind="selectedRolleProps"
          v-model="selectedRolle"
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
