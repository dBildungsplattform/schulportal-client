<script setup lang="ts">
  import KlassenFilter from '@/components/filter/KlassenFilter.vue';
  import FormRow from '@/components/form/FormRow.vue';
  import { type BaseFieldProps } from 'vee-validate';
  import { type Ref, ref, type ModelRef } from 'vue';
  import { watch } from 'vue';

  type Props = {
    schulen?: Array<{ value: string; title: string }>;
    readonly?: boolean;
    selectedSchuleProps?: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
    selectedNewKlasseProps?: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
    onSubmit: () => void;
  };

  defineProps<Props>();

  const selectedSchule: ModelRef<string | undefined, string> = defineModel('selectedSchule');
  const selectedNewKlasse: ModelRef<string | undefined, string> = defineModel('selectedNewKlasse');

  // we need to cast the selectedSchule into an array
  // doing it this way prevents an issue where the reactive system constantly re-runs which causes requests to be issued in a loop
  const administriertVon: Ref<string[] | undefined> = ref();
  watch(
    selectedSchule,
    (newValue: string | undefined) => {
      if (!newValue) administriertVon.value = [];
      else if (!administriertVon.value?.includes(newValue)) administriertVon.value = [newValue];
    },
    { immediate: true },
  );
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
      <KlassenFilter
        :multiple="false"
        :hideDetails="false"
        :selectedKlasseProps="selectedNewKlasseProps"
        :highlightSelection="false"
        :selectedKlassen="selectedNewKlasse"
        :placeholderText="$t('admin.klasse.selectKlasse')"
        ref="klasse-select"
        :administriertVon
        :parentId="'klasse-change'"
        @update:selectedKlassen="(newValue: string | undefined) => (selectedNewKlasse = newValue)"
      />
    </FormRow>
  </v-form>
</template>

<style scoped></style>
