<script setup lang="ts">
  import FormRow from '@/components/form/FormRow.vue';
  import FormWrapper from '@/components/form/FormWrapper.vue';
  import {
    OrganisationsTyp,
    useOrganisationStore,
    type OrganisationenFilter,
    type OrganisationStore,
  } from '@/stores/OrganisationStore';
  import { RollenSystemRecht } from '@/stores/RolleStore';
  import type { TranslatedObject } from '@/types';
  import { type BaseFieldProps } from 'vee-validate';
  import { computed, ref, watch, type ComputedRef, type ModelRef, type Ref } from 'vue';

  const searchInputSchule: Ref<string> = ref('');
  const timerId: Ref<ReturnType<typeof setTimeout> | undefined> = ref<ReturnType<typeof setTimeout>>();

  const organisationStore: OrganisationStore = useOrganisationStore();

  type Props = {
    errorCode?: string;
    schulen?: Array<{ value: string; title: string }>;
    readonly?: boolean;
    selectedSchuleProps?: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
    selectedKlassennameProps?: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
    showUnsavedChangesDialog?: boolean;
    isEditActive?: boolean;
    autoselectedSchuleId: string | null;
    isLoading: boolean;
    onHandleConfirmUnsavedChanges: () => void;
    onHandleDiscard: () => void;
    onShowDialogChange: (value?: boolean) => void;
    onSubmit: () => void;
  };

  const props: Props = defineProps<Props>();
  // derive this from props by checking id against props.schulen
  const hasAutoselected: ComputedRef<boolean> = computed(() => props.autoselectedSchuleId !== null);
  const selectedSchuleId: ModelRef<string | undefined, string> = defineModel('selectedSchule');
  const selectedSchuleTitle: ComputedRef<string> = computed(() => {
    return props.schulen?.find((schule: TranslatedObject) => schule.value === selectedSchuleId.value)?.title || '';
  });
  const selectedKlassenname: ModelRef<string | undefined, string> = defineModel('selectedKlassenname');

  watch(
    () => props.autoselectedSchuleId,
    (newId: string | null) => {
      selectedSchuleId.value = newId || undefined;
    },
  );

  // Watcher to detect when the search input for Organisationen is triggered.
  watch(searchInputSchule, async (newValue: string | undefined) => {
    clearTimeout(timerId.value);
    if (hasAutoselected.value) return;
    if (newValue !== '' && newValue === selectedSchuleTitle.value) return;

    const organisationFilter: OrganisationenFilter = {
      includeTyp: OrganisationsTyp.Schule,
      systemrechte: [RollenSystemRecht.KlassenVerwalten],
      limit: 25,
    };
    if (newValue) {
      organisationFilter.searchString = newValue;
    }
    if (selectedSchuleId.value) {
      organisationFilter.organisationIds = [selectedSchuleId.value];
    }

    timerId.value = setTimeout(async () => {
      await organisationStore.getFilteredSchulen(organisationFilter);
    }, 500);
  });
</script>

<template data-test-id="klasse-form">
  <FormWrapper
    :confirmUnsavedChangesAction="onHandleConfirmUnsavedChanges"
    :createButtonLabel="$t('admin.klasse.create')"
    :discardButtonLabel="$t('admin.klasse.discard')"
    :hideActions="readonly || !!props.errorCode"
    id="klasse-form"
    :isLoading="isLoading"
    :onDiscard="onHandleDiscard"
    @onShowDialogChange="onShowDialogChange"
    :onSubmit="onSubmit"
    :showUnsavedChangesDialog="showUnsavedChangesDialog"
  >
    <!-- Slot for SPSH alerts -->
    <slot />

    <template v-if="!props.errorCode">
      <!-- Schule zuordnen -->
      <v-row>
        <h3 class="headline-3">1. {{ $t('admin.schule.assignSchule') }}</h3>
      </v-row>
      <FormRow
        :errorLabel="selectedSchuleProps?.error || ''"
        labelForId="schule-select"
        :isRequired="true"
        :label="$t('admin.schule.schule')"
      >
        <v-autocomplete
          autocomplete="off"
          :class="['filter-dropdown mb-4', { selected: selectedSchuleId }]"
          clearable
          data-testid="schule-select"
          density="compact"
          :disabled="hasAutoselected || readonly"
          id="schule-select"
          :items="schulen"
          item-value="value"
          item-text="title"
          :no-data-text="$t('noDataFound')"
          :placeholder="$t('admin.schule.assignSchule')"
          ref="schule-select"
          required="true"
          variant="outlined"
          v-bind="selectedSchuleProps"
          v-model="selectedSchuleId"
          v-model:search="searchInputSchule"
          hide-details
        ></v-autocomplete>
      </FormRow>

      <!-- Klassenname eingeben -->
      <v-row class="mt-8">
        <h3 class="headline-3">2. {{ $t('admin.klasse.enterKlassenname') }}</h3>
      </v-row>
      <FormRow
        :errorLabel="selectedKlassennameProps?.error || ''"
        labelForId="klassenname-input"
        :isRequired="true"
        :label="$t('admin.klasse.klassenname')"
      >
        <v-text-field
          clearable
          data-testid="klassenname-input"
          density="compact"
          :disabled="!isEditActive"
          id="klassenname-input"
          :placeholder="$t('admin.klasse.enterKlassenname')"
          ref="klassenname-input"
          required="true"
          variant="outlined"
          v-bind="selectedKlassennameProps"
          v-model="selectedKlassenname"
        ></v-text-field>
      </FormRow>
    </template>
  </FormWrapper>
</template>

<style scoped></style>
