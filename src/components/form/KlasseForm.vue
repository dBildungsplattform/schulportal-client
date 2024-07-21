<script setup lang="ts">
  import { defineProps, type ModelRef } from 'vue';
  import { type BaseFieldProps } from 'vee-validate';
  import FormWrapper from '@/components/form/FormWrapper.vue';
  import FormRow from '@/components/form/FormRow.vue';

  type Props = {
    schulen?: Array<{ value: string; title: string }>;
    readonly?: boolean;
    selectedSchuleProps?: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
    selectedKlassennameProps?: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
    showUnsavedChangesDialog?: boolean;
    isEditActive?: boolean;
    onHandleConfirmUnsavedChanges: () => void;
    onHandleDiscard: () => void;
    onShowDialogChange: (value: boolean) => void;
    onSubmit: () => void;
  };

  defineProps<Props>();

  const selectedSchule: ModelRef<unknown, string> = defineModel('selectedSchule');
  const selectedKlassenname: ModelRef<unknown, string> = defineModel('selectedKlassenname');
</script>

<template data-test-id="klasse-form">
  <FormWrapper
    :confirmUnsavedChangesAction="onHandleConfirmUnsavedChanges"
    :createButtonLabel="$t('admin.klasse.create')"
    :discardButtonLabel="$t('admin.klasse.discard')"
    :hideActions="readonly"
    id="klasse-form"
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
      <v-select
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
        required="true"
        variant="outlined"
        v-bind="selectedSchuleProps"
        v-model="selectedSchule"
      ></v-select>
    </FormRow>

    <!-- Klassenname eingeben -->
    <v-row>
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
