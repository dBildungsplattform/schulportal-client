<script setup lang="ts">
  import FormWrapper from '@/components/form/FormWrapper.vue';
  import FormRow from '@/components/form/FormRow.vue';
  import { type ModelRef } from 'vue';
  import { type Organisation } from '@/stores/OrganisationStore';
  import { type BaseFieldProps } from 'vee-validate';

  type Props = {
    errorCode?: string;
    isLoading: boolean;
    onHandleConfirmUnsavedChanges: () => void;
    onHandleDiscard: () => void;
    onShowDialogChange: (value?: boolean) => void;
    onSubmit: () => void;
    readonly?: boolean;
    rootChildSchultraegerList: Organisation[];
    selectedSchultraegernameProps?: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
    showUnsavedChangesDialog?: boolean;
  };

  const props: Props = defineProps<Props>();

  // Define the V-model for each field so the parent component can pass in the values for it.
  const selectedSchultraegerform: ModelRef<string | undefined, string> = defineModel('selectedSchultraegerform');
  const selectedSchultraegername: ModelRef<string | undefined, string> = defineModel('selectedSchultraegername');
</script>

<template>
  <FormWrapper
    :confirmUnsavedChangesAction="onHandleConfirmUnsavedChanges"
    :createButtonLabel="$t('admin.schultraeger.create')"
    :discardButtonLabel="$t('admin.schultraeger.discard')"
    :hideActions="readonly || !!props.errorCode"
    id="schultraeger-form"
    :isLoading="isLoading"
    :onDiscard="onHandleDiscard"
    @onShowDialogChange="onShowDialogChange"
    :onSubmit="onSubmit"
    ref="schultraeger-form"
    :showUnsavedChangesDialog="showUnsavedChangesDialog"
  >
    <!-- Slot for SPSH alerts -->
    <slot />

    <template v-if="!props.errorCode">
      <!-- Select Schultraeger type. For now not bound to anything and just a UI element -->
      <v-row>
        <v-col>
          <h3 class="headline-3">1. {{ $t('admin.schultraeger.assignSchultraegerform') }}</h3>
        </v-col>
      </v-row>
      <v-row>
        <v-col
          cols="4"
          class="d-none d-md-flex"
        ></v-col>
        <v-radio-group
          inline
          v-model="selectedSchultraegerform"
          data-testid="schultraegerform-radio-group"
          :disabled="readonly"
        >
          <v-col
            v-for="schultraeger in rootChildSchultraegerList"
            :key="schultraeger.id"
            offset-md="1"
            cols="12"
            sm="5"
            class="pb-0"
          >
            <v-radio
              :label="schultraeger.name"
              :value="schultraeger.id"
              :data-testid="'schultraegerform-radio-button-' + schultraeger.name.replace(/\s+/g, '-').toLowerCase()"
            ></v-radio>
          </v-col>
        </v-radio-group>
      </v-row>
      <!-- select Schultraeger name -->
      <v-row>
        <v-col>
          <h3 class="headline-3">2. {{ $t('admin.schultraeger.enterSchultraegername') }}</h3>
        </v-col>
      </v-row>
      <FormRow
        :errorLabel="selectedSchultraegernameProps?.error || ''"
        labelForId="schultraegername-input"
        :isRequired="true"
        :label="$t('admin.schultraeger.schultraegername')"
      >
        <v-text-field
          clearable
          data-testid="schultraegername-input"
          v-bind="selectedSchultraegernameProps"
          v-model="selectedSchultraegername"
          :placeholder="$t('admin.schultraeger.schultraegername')"
          ref="schultraegername-input"
          variant="outlined"
          density="compact"
          required
        ></v-text-field>
      </FormRow>
    </template>
  </FormWrapper>
</template>
