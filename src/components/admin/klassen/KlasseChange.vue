<script setup lang="ts">
  import { defineProps, type ModelRef } from 'vue';
  import { type BaseFieldProps } from 'vee-validate';
  import FormRow from '@/components/form/FormRow.vue';

  type Props = {
    schulen?: Array<{ value: string; title: string }>;
    klassen: Array<{ value: string; title: string }> | undefined;
    readonly?: boolean;
    selectedSchuleProps?: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
    selectedNewKlasseProps?: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
    isEditActive?: boolean;
    onSubmit: () => void;
  };

  defineProps<Props>();

  const selectedSchule: ModelRef<unknown, string> = defineModel('selectedSchule');
  const selectedNewKlasse: ModelRef<unknown, string> = defineModel('selectedNewKlasse');
</script>

<template data-test-id="klasse-change-form">
  <v-form
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
        v-bind="selectedNewKlasseProps"
        v-model="selectedNewKlasse"
      ></v-autocomplete>
    </FormRow>
  </v-form>
</template>

<style scoped></style>
