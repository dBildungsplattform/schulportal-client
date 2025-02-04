<script setup lang="ts">
  import FormRow from '@/components/form/FormRow.vue';
  import FormWrapper from '@/components/form/FormWrapper.vue';
  import { useOrganisationStore, type Organisation, type OrganisationStore } from '@/stores/OrganisationStore';
  import { RollenSystemRecht } from '@/stores/RolleStore';
  import { type BaseFieldProps } from 'vee-validate';
  import { defineProps, watch, type ModelRef } from 'vue';
  import SchulenFilter from '../filter/SchulenFilter.vue';

  const organisationStore: OrganisationStore = useOrganisationStore();

  type Props = {
    errorCode?: string;
    schulen?: Array<{ value: string; title: string }>;
    readonly?: boolean;
    selectedSchuleProps?: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
    selectedKlassennameProps?: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
    showUnsavedChangesDialog?: boolean;
    isEditActive?: boolean;
    isLoading: boolean;
    onHandleConfirmUnsavedChanges: () => void;
    onHandleDiscard: () => void;
    onShowDialogChange: (value?: boolean) => void;
    onSubmit: () => void;
  };

  const props: Props = defineProps<Props>();

  const selectedSchuleId: ModelRef<string | undefined, string> = defineModel('selectedSchule');
  const selectedKlassenname: ModelRef<string | undefined, string> = defineModel('selectedKlassenname');

  watch(
    () => organisationStore.schulenFilter.selectedItems,
    (newSchulen: Array<Organisation>) => {
      if (newSchulen.length === 1) {
        selectedSchuleId.value = newSchulen[0]!.id;
      }
    },
  );
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
        <SchulenFilter
          :multiple="false"
          :readonly
          :systemrechte-for-search="[RollenSystemRecht.KlassenVerwalten]"
          :selected-schule-props="selectedSchuleProps"
        ></SchulenFilter>
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
