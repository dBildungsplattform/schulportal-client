<script setup lang="ts">
  import { computed, defineProps, ref, watch, type ComputedRef, type ModelRef, type Ref } from 'vue';
  import { type BaseFieldProps } from 'vee-validate';
  import FormRow from '@/components/form/FormRow.vue';
  import { type OrganisationStore, useOrganisationStore } from '@/stores/OrganisationStore';
  import type { TranslatedObject } from '@/types';

  const organisationStore: OrganisationStore = useOrganisationStore();

  type Props = {
    schulen?: Array<{ value: string; title: string }>;
    klassen?: Array<{ value: string; title: string }>;
    readonly?: boolean;
    selectedSchuleProps?: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
    selectedNewKlasseProps?: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
    isEditActive?: boolean;
    onSubmit: () => void;
  };

  const props: Props = defineProps<Props>();

  const selectedSchule: ModelRef<string | undefined, string> = defineModel('selectedSchule');
  const selectedNewKlasse: ModelRef<string | undefined, string> = defineModel('selectedNewKlasse');

  const timerId: Ref<ReturnType<typeof setTimeout> | undefined> = ref<ReturnType<typeof setTimeout>>();

  // Computed property to get the title of the selected klasse
  const selectedKlasseTitle: ComputedRef<string | undefined> = computed(() => {
    return props.klassen?.find((klasse: TranslatedObject | undefined) => klasse?.value === selectedNewKlasse.value)
      ?.title;
  });

  watch(selectedNewKlasse, (newValue: string | undefined) => {
    if (!selectedNewKlasse.value) {
      organisationStore.getKlassenByOrganisationId(selectedSchule.value as string);
    }
    selectedNewKlasse.value = newValue;
  });

  function updateKlassenSearch(searchValue: string): void {
    clearTimeout(timerId.value);
    const organisationId: string | undefined = selectedSchule.value;

    if (!organisationId) {
      return;
    }
    if (searchValue === '' && !selectedNewKlasse.value) {
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
</script>

<template>
  <v-form
    data-testid="klasse-change-form"
    id="klasse-change-form"
    :onSubmit="onSubmit"
  >
    <!-- Schule zuordnen -->
    <FormRow
      :errorLabel="selectedSchuleProps?.error || ''"
      labelForId="schule-select"
      :isRequired="true"
      :label="$t('admin.schule.schule')"
    >
      <v-autocomplete
        :class="[{ 'filter-dropdown mb-4': true }, { selected: selectedSchule }]"
        autocomplete="off"
        clearable
        data-testid="schule-select"
        density="compact"
        :disabled="readonly"
        id="schule-select"
        :items="schulen"
        item-value="value"
        item-text="title"
        :no-data-text="$t('noDataFound')"
        :placeholder="$t('admin.schule.assignSchule')"
        ref="schule-select"
        hide-details
        required="true"
        variant="outlined"
        v-bind="selectedSchuleProps"
        v-model="selectedSchule"
      ></v-autocomplete>
    </FormRow>

    <!-- Klasse auswählen -->
    <FormRow
      :errorLabel="selectedNewKlasseProps?.error || ''"
      labelForId="klasse-select"
      :isRequired="true"
      :label="$t('admin.klasse.klasse')"
    >
      <v-autocomplete
        clearable
        autocomplete="off"
        data-testid="klassenname-input"
        density="compact"
        :disabled="!isEditActive"
        id="klasse-select"
        :items="klassen"
        item-value="value"
        item-text="title"
        :placeholder="$t('admin.klasse.selectKlasse')"
        ref="klasse-select"
        required="true"
        variant="outlined"
        @update:search="updateKlassenSearch"
        v-bind="selectedNewKlasseProps"
        v-model="selectedNewKlasse"
      ></v-autocomplete>
    </FormRow>
  </v-form>
</template>

<style scoped></style>
