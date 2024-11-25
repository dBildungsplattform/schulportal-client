<script setup lang="ts">
  import { computed, defineProps, ref, watch, type ComputedRef, type ModelRef, type Ref } from 'vue';
  import { type BaseFieldProps } from 'vee-validate';
  import FormWrapper from '@/components/form/FormWrapper.vue';
  import FormRow from '@/components/form/FormRow.vue';
  import type { TranslatedObject } from '@/types';
  import { type PersonenkontextStore, usePersonenkontextStore } from '@/stores/PersonenkontextStore';

  const hasAutoselectedSchule: Ref<boolean> = ref(false);
  const searchInputSchule: Ref<string> = ref('');
  const timerId: Ref<ReturnType<typeof setTimeout> | undefined> = ref<ReturnType<typeof setTimeout>>();
  let isSearching: boolean = false;

  const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();

  type Props = {
    schulen?: Array<{ value: string; title: string }>;
    readonly?: boolean;
    selectedSchuleProps?: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
    selectedKlassennameProps?: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
    showUnsavedChangesDialog?: boolean;
    isEditActive?: boolean;
    isLoading?: boolean;
    onHandleConfirmUnsavedChanges: () => void;
    onHandleDiscard: () => void;
    onShowDialogChange: (value?: boolean) => void;
    onSubmit: () => void;
  };

  const props: Props = defineProps<Props>();

  const selectedSchule: ModelRef<string | undefined, string> = defineModel('selectedSchule');
  const selectedKlassenname: ModelRef<string | undefined, string> = defineModel('selectedKlassenname');

  // Watcher for schulen to auto-select if there is only one
  watch(
    () => props.schulen,
    (newSchulen: TranslatedObject[] | undefined) => {
      if (!isSearching && newSchulen && newSchulen.length === 1) {
        hasAutoselectedSchule.value = true;
        selectedSchule.value = newSchulen[0]?.value || '';
      }
    },
    { immediate: true },
  );

  const selectedSchuleTitle: ComputedRef<string> = computed(() => {
    return props.schulen?.find((schule: TranslatedObject) => schule.value === selectedSchule.value)?.title || '';
  });

  // Watcher to detect when the search input for Organisationen is triggered.
  watch(searchInputSchule, async (newValue: string, oldValue: string) => {
    clearTimeout(timerId.value);
    isSearching = !!newValue;
    if (oldValue === selectedSchuleTitle.value) return;

    if (newValue === '' && !selectedSchule.value) {
      timerId.value = setTimeout(async () => {
        await personenkontextStore.processWorkflowStep({
          limit: 25,
        });
      }, 500);
    } else if (newValue && newValue !== selectedSchuleTitle.value) {
      timerId.value = setTimeout(async () => {
        await personenkontextStore.processWorkflowStep({
          organisationName: newValue,
          limit: 25,
        });
      }, 500);
    } else if (newValue === '' && selectedSchule.value) {
      timerId.value = setTimeout(async () => {
        await personenkontextStore.processWorkflowStep({
          organisationId: selectedSchule.value,
          limit: 25,
        });
      }, 500);
    }
  });
</script>

<template data-test-id="klasse-form">
  <FormWrapper
    :confirmUnsavedChangesAction="onHandleConfirmUnsavedChanges"
    :createButtonLabel="$t('admin.klasse.create')"
    :discardButtonLabel="$t('admin.klasse.discard')"
    :hideActions="readonly"
    id="klasse-form"
    :isLoading="isLoading"
    :onDiscard="onHandleDiscard"
    @onShowDialogChange="onShowDialogChange"
    :onSubmit="onSubmit"
    :showUnsavedChangesDialog="showUnsavedChangesDialog"
  >
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
        :class="[{ 'filter-dropdown mb-4': hasAutoselectedSchule }, { selected: selectedSchule }]"
        clearable
        data-testid="schule-select"
        density="compact"
        :disabled="hasAutoselectedSchule || readonly"
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
        v-model="selectedSchule"
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
  </FormWrapper>
</template>

<style scoped></style>
