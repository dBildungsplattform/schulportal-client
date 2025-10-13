<script setup lang="ts">
  import type { BefristungProps } from '@/components/admin/personen/BefristungInput.vue';
  import BefristungInput from '@/components/admin/personen/BefristungInput.vue';
  import KlassenFilter from '@/components/filter/KlassenFilter.vue';
  import FormRow from '@/components/form/FormRow.vue';
  import { useAutoselectedSchule } from '@/composables/useAutoselectedSchule';
  import type { TranslatedRolleWithAttrs } from '@/composables/useRollen';
  import { OrganisationsTyp, type Organisation } from '@/stores/OrganisationStore';
  import {
    CreationType,
    KlassenOption,
    OperationContext,
    usePersonenkontextStore,
    type PersonenkontextStore,
    type WorkflowFilter,
  } from '@/stores/PersonenkontextStore';
  import { usePersonStore, type PersonStore } from '@/stores/PersonStore';
  import { RollenArt, RollenSystemRecht } from '@/stores/RolleStore';
  import type { Zuordnung } from '@/stores/types/Zuordnung';
  import { type TranslatedObject } from '@/types.d';
  import type { BaseFieldProps } from 'vee-validate';
  import { computed, onMounted, ref, watch, type ComputedRef, type Ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import SchulenFilter from '@/components/filter/SchulenFilter.vue';

  useI18n({ useScope: 'global' });

  const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();
  const personStore: PersonStore = usePersonStore();

  const timerId: Ref<ReturnType<typeof setTimeout> | undefined> = ref<ReturnType<typeof setTimeout>>();
  const canCommit: Ref<boolean> = ref(false);

  const searchInputRolle: Ref<string | undefined> = ref('');
  const searchInputRollen: Ref<string | undefined> = ref('');

  const localKlassenOption: Ref<string | undefined> = ref(KlassenOption.KEEP_KLASSE);

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
    selectedKlassenOption?: string | null;
    selectedKlasse?: string | undefined;
    selectedOrganisationProps?: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
    selectedKlasseProps?: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
    selectedRolleProps?: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
    selectedRollenProps?: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
    selectedKlassenOptionProps?: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
    isModifyRolleDialog?: boolean;
    befristungInputProps?: BefristungProps;
    headlineNumbers?: {
      org: string;
      rolle: string;
      befristung: string;
    };
    allowMultipleRollen?: boolean;
    isRolleUnassignForm?: boolean;
    isRolleModify?: boolean;
  };

  const props: Props = defineProps<Props>();
  const {
    autoselectedSchule,
  }: { hasAutoselectedSchule: ComputedRef<boolean>; autoselectedSchule: ComputedRef<Organisation | null> } =
    useAutoselectedSchule([RollenSystemRecht.PersonenVerwalten]);

  type Emits = {
    (e: 'update:befristung', value: string | undefined): void;
    (e: 'update:calculatedBefristungOption', value: string | undefined): void;
    (event: 'update:selectedOrganisation', value: string | undefined): void;
    (event: 'update:selectedRolle', value: string | undefined): void;
    (event: 'update:selectedRollen', value: string[] | undefined): void;
    (event: 'update:selectedKlasse', value: string | undefined): void;
    (event: 'update:selectedKlassenOption', value: string | null): void;
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

  const useLandesbediensteteWorkflow: ComputedRef<boolean> = computed((): boolean => {
    return props.createType === CreationType.AddPersonToOwnSchule;
  });

  const requestedWithSystemrecht: ComputedRef<RollenSystemRecht | undefined> = computed(
    (): RollenSystemRecht | undefined => {
      return props.createType === CreationType.Limited
        ? RollenSystemRecht.EingeschraenktNeueBenutzerErstellen
        : undefined;
    },
  );

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

  async function handleWorkflowStep(filter: WorkflowFilter): Promise<void> {
    const useLandesbediensteteWorkflows: boolean = props.createType === CreationType.AddPersonToOwnSchule;

    if (useLandesbediensteteWorkflows) {
      await personenkontextStore.processWorkflowStepLandesbedienstete(filter);
    } else {
      await personenkontextStore.processWorkflowStep({
        operationContext: props.operationContext,
        ...filter,
        requestedWithSystemrecht:
          props.createType === CreationType.Limited ? RollenSystemRecht.EingeschraenktNeueBenutzerErstellen : undefined,
      });
    }

    canCommit.value = personenkontextStore.workflowStepResponse?.canCommit ?? false;
  }

  // Watcher for selectedOrganisation to fetch roles and classes
  watch(selectedOrganisation, async (newValue: string | undefined, oldValue: string | undefined) => {
    // Reset selected roles if oldValue existed (change event)
    if (oldValue !== undefined) {
      selectedRolle.value = undefined;
      selectedRollen.value = undefined;
      emits('fieldReset', 'selectedRolle');
      emits('fieldReset', 'selectedRollen');
    }
    emits('update:selectedOrganisation', newValue);

    if (newValue && newValue !== oldValue) {
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
  });

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

  watch(
    props.allowMultipleRollen ? searchInputRollen : searchInputRolle,
    async (newValue: string | undefined, oldValue: string | undefined) => {
      clearTimeout(timerId.value);

      // this prevents duplicate requests because the input value changes between "" and null
      if (!newValue && !oldValue) return;

      // this prevents duplicate requests when the user selects a value from the dropdown
      if (
        newValue &&
        (props.allowMultipleRollen
          ? selectedRolleTitles.value.includes(newValue)
          : selectedRolleTitle.value === newValue)
      ) {
        return;
      }

      const filter: WorkflowFilter = {
        personId: props.personId,
        organisationId: selectedOrganisation.value,
        rollenIds: selectedRollen.value,
        limit: 25,
      };

      // Add rolleName if user is typing
      if (!newValue) {
        // No rolleName (cleared)
      } else {
        filter.rolleName = newValue;
      }

      timerId.value = setTimeout(async () => {
        await handleWorkflowStep(filter);
      }, 500);
    },
  );

  const handleFocusChange = (focused: boolean): void => {
    if (!focused) {
      searchInputRollen.value = '';
      searchInputRolle.value = '';
    }
  };

  function updateKlasseSelection(selectedKlassen: string | undefined): void {
    selectedKlasse.value = selectedKlassen;
    emits('update:selectedKlasse', selectedKlassen);
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
    autoselectedSchule,
    async (newAutoselectedSchule: Organisation | null) => {
      if (newAutoselectedSchule) {
        selectedOrganisation.value = newAutoselectedSchule.id;
        emits('update:selectedOrganisation', newAutoselectedSchule.id);
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

  function updateSchuleSelection(orgaId: string): void {
    selectedOrganisation.value = orgaId;
    emits('update:selectedOrganisation', orgaId);
  }

  // Handles any change related to the klassen radio buttons
  function handleKlassenOption(value: string | null): void {
    if (value === null) return;
    localKlassenOption.value = value;
    emits('update:selectedKlassenOption', value);
  }

  // If the submission of the form goes wrong and the user needs to correct something, we need to ensure that the canCommit value is updated
  onMounted(() => {
    emits('update:canCommit', personenkontextStore.workflowStepResponse?.canCommit ?? false);
  });
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
      <SchulenFilter
        ref="schulenFilter"
        parentId="personenkontext-create"
        :selectedSchulen="selectedOrganisation ? [selectedOrganisation] : []"
        :selectedRollen="selectedRollen ? selectedRollen : []"
        :multiple="false"
        :systemrechteForSearch="[requestedWithSystemrecht].filter((v): v is RollenSystemRecht => v !== undefined)"
        :selectedSchuleProps="selectedOrganisationProps"
        :useWorkflowEndpoints="true"
        :useLandesbediensteteWorkflow="useLandesbediensteteWorkflow"
        :operationContext="props.operationContext"
        :isRolleUnassignForm="isRolleUnassignForm"
        :includeAll="true"
        :placeholderText="$t('admin.organisation.selectOrganisation')"
        :personId="props.personId"
        @update:selectedSchulen="updateSchuleSelection"
        @update:selectedSchulenObjects="
          (organisations: Array<Organisation>) =>
            emits('update:selectedOrganisation', organisations.length > 0 ? organisations[0]?.id : undefined)
        "
      ></SchulenFilter>
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
          @update:focused="handleFocusChange"
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
            : isLernRolle(selectedRolle) && selectedOrganisation && !isRolleUnassignForm && !isRolleModify
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
          parentId="personenkontext-create"
        />
      </FormRow>
      <v-row
        v-if="isLernRolle(selectedRolle) && isRolleModify"
        class="align-center"
      >
        <v-col
          class="py-0 mt-n1"
          cols="12"
          sm="7"
          offset-sm="5"
        >
          <v-radio-group
            data-testid="befristung-radio-group"
            ref="befristung-radio-group"
            @update:modelValue="handleKlassenOption"
            v-model="localKlassenOption"
            v-bind="selectedKlassenOptionProps"
          >
            <v-radio
              data-testid="schuljahresende-radio-button"
              :label="$t('admin.klasse.keepKlasse')"
              :value="KlassenOption.KEEP_KLASSE"
              color="primary"
            ></v-radio>
            <v-radio
              data-testid="unbefristet-radio-button"
              :label="$t('admin.klasse.selectNewKlasse')"
              :value="KlassenOption.SELECT_NEW_KLASSE"
              :color="'primary'"
            ></v-radio>
          </v-radio-group>
        </v-col>
      </v-row>
      <!-- Klasse zuordnen for RolleModify -->
      <FormRow
        v-if="
          isLernRolle(selectedRolle) &&
          selectedOrganisation &&
          !isRolleUnassignForm &&
          isRolleModify &&
          localKlassenOption === KlassenOption.SELECT_NEW_KLASSE
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
          parentId="personenkontext-create"
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
