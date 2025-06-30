<script setup lang="ts">
  import type { BefristungProps } from '@/components/admin/personen/BefristungInput.vue';
  import BefristungInput from '@/components/admin/personen/BefristungInput.vue';
  import KlassenFilter from '@/components/filter/KlassenFilter.vue';
  import FormRow from '@/components/form/FormRow.vue';
  import type { TranslatedRolleWithAttrs } from '@/composables/useRollen';
  import { OrganisationsTyp } from '@/stores/OrganisationStore';
  import {
    CreationType,
    OperationContext,
    usePersonenkontextStore,
    type PersonenkontextStore,
    type WorkflowFilter,
  } from '@/stores/PersonenkontextStore';
  import { usePersonStore, type PersonStore } from '@/stores/PersonStore';
  import { RollenArt } from '@/stores/RolleStore';
  import type { Zuordnung } from '@/stores/types/Zuordnung';
  import { type TranslatedObject } from '@/types.d';
  import { sameContent } from '@/utils/arrays';
  import type { BaseFieldProps } from 'vee-validate';
  import { computed, ref, watch, type ComputedRef, type Ref } from 'vue';
  import { useI18n } from 'vue-i18n';

  useI18n({ useScope: 'global' });

  const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();
  const personStore: PersonStore = usePersonStore();

  const timerId: Ref<ReturnType<typeof setTimeout> | undefined> = ref<ReturnType<typeof setTimeout>>();
  const canCommit: Ref<boolean> = ref(false);
  const hasAutoselectedSchule: Ref<boolean> = ref(false);

  const searchInputOrganisation: Ref<string> = ref('');
  const searchInputRolle: Ref<string> = ref('');
  const searchInputRollen: Ref<string> = ref('');

  let isSearching: boolean = false;

  type Props = {
    organisationen: TranslatedObject[] | undefined;
    rollen: TranslatedRolleWithAttrs[] | undefined;
    selectedOrganisation: string | undefined;
    createType?: CreationType;
    showHeadline: boolean;
    personId?: string;
    operationContext: OperationContext;
    selectedRolle?: string | undefined;
    selectedRollen?: string[] | undefined;
    selectedKlasse?: string | undefined;
    selectedOrganisationProps?: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
    selectedKlasseProps?: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
    selectedRolleProps?: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
    selectedRollenProps?: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
    isModifyRolleDialog?: boolean;
    befristungInputProps?: BefristungProps;
    headlineNumbers?: {
      org: string;
      rolle: string;
      befristung: string;
    };
    allowMultipleRollen?: boolean;
    isRolleUnassignForm?: boolean;
  };

  const props: Props = defineProps<Props>();

  type Emits = {
    (e: 'update:befristung', value: string | undefined): void;
    (e: 'update:calculatedBefristungOption', value: string | undefined): void;
    (event: 'update:selectedOrganisation', value: string | undefined): void;
    (event: 'update:selectedRolle', value: string | undefined): void;
    (event: 'update:selectedRollen', value: string[] | undefined): void;
    (event: 'update:selectedKlasse', value: string | undefined): void;
    (event: 'update:canCommit', value: boolean): void;
    (event: 'fieldReset', field: 'selectedOrganisation' | 'selectedRolle' | 'selectedKlasse' | 'selectedRollen'): void;
  };
  const emits: Emits = defineEmits<Emits>();

  const selectedOrganisation: Ref<string | undefined> = ref(props.selectedOrganisation);
  const selectedRolle: Ref<string | undefined> = ref(props.selectedRolle);
  const selectedRollen: Ref<string[] | undefined> = ref(props.selectedRollen || []);
  const selectedKlasse: Ref<string | undefined> = ref(props.selectedKlasse);
  // we need to cast the selectedSchule into an array
  // doing it this way prevents an issue where the reactive system constantly re-runs which causes requests to be issued in a loop
  const administriertVon: Ref<string[] | undefined> = ref([]);

  // Computed property to get the title of the selected organisation
  const selectedOrganisationTitle: ComputedRef<string | undefined> = computed(() => {
    return props.organisationen?.find((org: TranslatedObject) => org.value === selectedOrganisation.value)?.title;
  });

  const selectedRolleTitles: ComputedRef<string[]> = computed(() => {
    if (!Array.isArray(selectedRollen.value)) return [];
    return selectedRollen.value
      .map((id: string) => props.rollen?.find((rolle: TranslatedObject) => rolle.value === id)?.title)
      .filter((title: string | undefined): title is string => !!title);
  });

  // Computed property to get the title of the selected role
  const selectedRolleTitle: ComputedRef<string | undefined> = computed(() => {
    return props.rollen?.find((rolle: TranslatedObject) => rolle.value === selectedRolle.value)?.title;
  });

  function isLernRolle(selectedRolleIds: string | string[] | undefined): boolean {
    if (!selectedRolleIds) return false;

    // Ensure we always work with an array
    const rolleIdsArray: string[] = Array.isArray(selectedRolleIds) ? selectedRolleIds : [selectedRolleIds];

    return rolleIdsArray.some((rolleId: string) =>
      props.rollen?.some(
        (rolle: TranslatedRolleWithAttrs) => rolle.value === rolleId && rolle.rollenart === RollenArt.Lern,
      ),
    );
  }

  // Watcher for selectedOrganisation to fetch roles and classes
  watch(selectedOrganisation, async (newValue: string | undefined, oldValue: string | undefined) => {
    const useLandesbediensteteWorkflow: boolean = props.createType === CreationType.AddPersonToOwnSchule;

    // Reset selected roles if oldValue existed (change event)
    if (oldValue !== undefined) {
      selectedRolle.value = undefined;
      selectedRollen.value = undefined;
      emits('fieldReset', 'selectedRolle');
      emits('fieldReset', 'selectedRollen');
    }

    if (newValue && newValue !== oldValue) {
      const filter: WorkflowFilter = {
        personId: props.personId,
        organisationId: newValue,
        limit: 25,
      };

      if (useLandesbediensteteWorkflow) {
        await personenkontextStore.processWorkflowStepLandesbedienstete(filter);
      } else {
        await personenkontextStore.processWorkflowStep({
          operationContext: props.operationContext,
          ...filter,
        });
      }

      administriertVon.value?.pop();
      administriertVon.value?.push(newValue);

      // Check if all Klassen for this orga are the same
      const klassenZuordnungen: Zuordnung[] | undefined = personStore.personenuebersicht?.zuordnungen.filter(
        (zuordnung: Zuordnung) => zuordnung.typ === OrganisationsTyp.Klasse && zuordnung.administriertVon === newValue,
      );

      const klassenIds: Set<string> = new Set(klassenZuordnungen?.map((zuordnung: Zuordnung) => zuordnung.sskId));
      if (klassenIds.size === 1) {
        const klasseId: string | undefined = klassenIds.values().next().value;
        if (klasseId) {
          selectedKlasse.value = klasseId;
          emits('update:selectedKlasse', klasseId);
        }
      } else {
        selectedKlasse.value = undefined;
        emits('fieldReset', 'selectedKlasse');
      }
    } else if (!newValue) {
      // Clear selections if orga was cleared
      administriertVon.value?.pop();
      selectedRolle.value = undefined;
      selectedKlasse.value = undefined;
      emits('fieldReset', 'selectedRolle');
      emits('fieldReset', 'selectedKlasse');
    }

    emits('update:selectedOrganisation', newValue);
  });

  async function handleWorkflowStep(filter: WorkflowFilter): Promise<void> {
    const useLandesbediensteteWorkflow: boolean = props.createType === CreationType.AddPersonToOwnSchule;

    if (useLandesbediensteteWorkflow) {
      await personenkontextStore.processWorkflowStepLandesbedienstete(filter);
    } else {
      await personenkontextStore.processWorkflowStep({
        operationContext: props.operationContext,
        ...filter,
      });
    }

    canCommit.value = personenkontextStore.workflowStepResponse?.canCommit ?? false;
  }

  watch(
    () => (props.allowMultipleRollen ? selectedRollen.value : selectedRolle.value),
    async (newValue: string | string[] | undefined, oldValue: string | string[] | undefined) => {
      if (props.allowMultipleRollen) {
        const newRollen: string[] | undefined = newValue as string[] | undefined;
        if (newRollen && newRollen.length > 0) {
          const filter: WorkflowFilter = {
            personId: props.personId,
            organisationId: selectedOrganisation.value,
            rollenIds: newRollen,
            limit: 25,
          };

          await handleWorkflowStep(filter);

          canCommit.value = personenkontextStore.workflowStepResponse?.canCommit ?? false;
        } else {
          selectedKlasse.value = undefined;
          emits('fieldReset', 'selectedKlasse');
          emits('fieldReset', 'selectedRollen');
          canCommit.value = false;
        }
        emits('update:selectedRollen', newRollen);
      } else {
        const newRolle: string | undefined = newValue as string | undefined;

        if (newRolle && newRolle !== oldValue) {
          const filter: WorkflowFilter = {
            personId: props.personId,
            organisationId: selectedOrganisation.value,
            rollenIds: [newRolle],
            limit: 25,
          };

          await handleWorkflowStep(filter);

          canCommit.value = personenkontextStore.workflowStepResponse?.canCommit ?? false;
        }

        if (!newRolle) {
          canCommit.value = false;
          selectedKlasse.value = undefined;
          emits('fieldReset', 'selectedKlasse');
        }

        emits('update:selectedRolle', newRolle);
      }
    },
    { deep: true },
  );

  // Using a watcher instead of modelUpdate since we need the old Value as well.
  // Default behavior of the autocomplete is to reset the newValue to empty string and that causes another request to be made
  watch(searchInputOrganisation, async (newValue: string, oldValue: string) => {
    clearTimeout(timerId.value);
    isSearching = !!newValue;

    if (oldValue === selectedOrganisationTitle.value) return;

    const filter: WorkflowFilter = { limit: 25 };

    if (newValue === '' && !selectedOrganisation.value) {
      // Case: Initial load
      // nothing to add — base filter is fine
    } else if (newValue && newValue !== selectedOrganisationTitle.value) {
      filter.organisationName = newValue;
    } else if (newValue === '' && selectedOrganisation.value) {
      // Case: user cleared search but selected something earlier
      filter.organisationId = selectedOrganisation.value;
    } else {
      return;
    }

    timerId.value = setTimeout(async () => {
      if (props.createType === CreationType.AddPersonToOwnSchule) {
        await personenkontextStore.processWorkflowStepLandesbedienstete(filter);
      } else {
        await personenkontextStore.processWorkflowStep({
          ...filter,
          personId: props.personId,
          operationContext: props.operationContext,
        });
      }
    }, 500);
  });

  watch(
    props.allowMultipleRollen ? searchInputRollen : searchInputRolle,
    async (newValue: string | string[], oldValue: string | string[]) => {
      clearTimeout(timerId.value);

      const isEqual: boolean = props.allowMultipleRollen
        ? Array.isArray(newValue) && sameContent(newValue, selectedRolleTitles.value)
        : oldValue === selectedRolleTitle.value;

      if (isEqual) return;

      const filter: WorkflowFilter = {
        personId: props.personId,
        organisationId: selectedOrganisation.value,
        rollenIds: selectedRollen.value,
        limit: 25,
      };

      // Add rolleName if user is typing
      if (!newValue || (Array.isArray(newValue) && newValue.length === 0)) {
        // No rolleName (cleared)
      } else if (!Array.isArray(newValue)) {
        filter.rolleName = newValue;
      }

      timerId.value = setTimeout(async () => {
        if (props.createType === CreationType.AddPersonToOwnSchule) {
          await personenkontextStore.processWorkflowStepLandesbedienstete(filter);
        } else {
          await personenkontextStore.processWorkflowStep({
            ...filter,
            operationContext: props.operationContext,
          });
        }
      }, 500);
    },
  );

  function updateKlasseSelection(selectedKlassen: string | undefined): void {
    selectedKlasse.value = selectedKlassen;
    emits('update:selectedKlasse', selectedKlassen);
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

  function clearSelectedRollen(): void {
    emits('fieldReset', 'selectedRollen');
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

  const handleBefristungChange = (value: string | undefined): void => {
    emits('update:befristung', value);
  };

  const handleCalculatedBefristungOptionChange = (value: string | undefined): void => {
    emits('update:calculatedBefristungOption', value);
  };

  watch(
    canCommit,
    (newValue: boolean) => {
      emits('update:canCommit', newValue);
    },
    { immediate: true },
  );
</script>

<template>
  <div>
    <v-row v-if="showHeadline">
      <h3 class="headline-3 mt-3">
        {{ headlineNumbers?.org ?? '1.' }} {{ $t('admin.organisation.assignOrganisation') }}
      </h3>
    </v-row>
    <!-- Organisation zuordnen -->
    <FormRow
      ref="form-row"
      :errorLabel="selectedOrganisationProps?.['error'] ?? false"
      :isRequired="true"
      labelForId="organisation-select"
      :label="$t('admin.organisation.organisation')"
    >
      <v-autocomplete
        class="mb-5"
        autocomplete="off"
        :class="[
          { 'filter-dropdown mb-4': hasAutoselectedSchule || isRolleUnassignForm },
          { selected: selectedOrganisation },
        ]"
        clearable
        :click:clear="clearSelectedOrganisation"
        data-testid="organisation-select"
        density="compact"
        :disabled="hasAutoselectedSchule || isRolleUnassignForm"
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
        <h3 class="headline-3">{{ headlineNumbers?.rolle ?? '2.' }} {{ $t('admin.rolle.assignRolle') }}</h3>
      </v-row>
      <!-- Rollenzuordnung -->
      <FormRow
        :errorLabel="
          allowMultipleRollen ? (selectedRollenProps?.['error'] ?? false) : (selectedRolleProps?.['error'] ?? false)
        "
        labelForId="rolle-select"
        :isRequired="true"
        :label="$t('admin.rolle.rolle')"
      >
        <v-autocomplete
          v-if="allowMultipleRollen"
          autocomplete="off"
          clearable
          @clear="clearSelectedRollen"
          data-testid="rollen-select"
          density="compact"
          id="rollen-select"
          ref="rollen-select"
          :items="rollen"
          item-value="value"
          item-text="title"
          :multiple="allowMultipleRollen"
          :no-data-text="$t('noDataFound')"
          :placeholder="$t('admin.rolle.selectRolle')"
          required="true"
          variant="outlined"
          v-bind="selectedRollenProps"
          v-model="selectedRollen"
          v-model:search="searchInputRollen"
        ></v-autocomplete>
        <v-autocomplete
          v-else-if="!allowMultipleRollen"
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
        v-if="
          allowMultipleRollen
            ? isLernRolle(selectedRollen) && selectedOrganisation
            : isLernRolle(selectedRolle) && selectedOrganisation && !isRolleUnassignForm
        "
        :errorLabel="selectedKlasseProps?.['error'] || false"
        :isRequired="true"
        labelForId="klasse-select"
        :label="$t('admin.klasse.klasse')"
      >
        <KlassenFilter
          :multiple="false"
          :hideDetails="false"
          :selectedKlasseProps="selectedKlasseProps"
          :highlightSelection="false"
          :selectedKlassen="selectedKlasse"
          @update:selectedKlassen="updateKlasseSelection"
          :placeholderText="$t('admin.klasse.selectKlasse')"
          ref="klasse-select"
          :administriertVon
          :filterId="'personenkontext-create'"
        />
      </FormRow>
      <!-- Befristung -->
      <v-row
        v-if="
          selectedOrganisation &&
          (allowMultipleRollen ? (selectedRollen?.length ?? 0) > 0 : selectedRolle) &&
          showHeadline
        "
      >
        <h3 class="headline-3">
          {{ headlineNumbers?.befristung ?? '2.1' }} {{ $t('admin.befristung.assignBefristung') }}
        </h3>
      </v-row>
      <BefristungInput
        v-if="
          selectedOrganisation &&
          (allowMultipleRollen ? (selectedRollen?.length ?? 0) > 0 : selectedRolle) &&
          !isModifyRolleDialog &&
          props.befristungInputProps
        "
        :befristungProps="befristungInputProps?.befristungProps"
        :befristungOptionProps="befristungInputProps?.befristungOptionProps"
        :isUnbefristetDisabled="befristungInputProps?.isUnbefristetDisabled"
        :isBefristungRequired="befristungInputProps?.isBefristungRequired"
        :nextSchuljahresende="befristungInputProps?.nextSchuljahresende"
        :befristung="befristungInputProps?.befristung"
        :befristungOption="befristungInputProps?.befristungOption"
        ref="befristung-input-wrapper"
        @update:befristung="handleBefristungChange"
        @update:calculatedBefristungOption="handleCalculatedBefristungOptionChange"
      />
    </div>
  </div>
</template>

<style></style>
