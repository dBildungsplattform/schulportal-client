<script setup lang="ts">
  import type { ModelRef } from 'vue';
  import type { BaseFieldProps } from 'vee-validate';
  import FormWrapper from '@/components/form/FormWrapper.vue';
  import FormRow from '@/components/form/FormRow.vue';
  import { type TranslatedObject } from '@/types.d';
  import type { RollenArt, RollenMerkmal, RollenSystemRecht } from '@/stores/RolleStore';

  type Props = {
    administrationsebenen?: Array<{ value: string; title: string }>;
    readonly?: boolean;
    selectedAdministrationsebeneProps?: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
    selectedRollenArtProps?: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
    selectedRollenNameProps?: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
    selectedMerkmaleProps?: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
    selectedServiceProvidersProps?: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
    selectedSystemRechteProps?: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
    serviceProviders?: Array<{ value: string; title: string }>;
    showUnsavedChangesDialog?: boolean;
    translatedRollenarten?: TranslatedObject[];
    translatedMerkmale?: TranslatedObject[];
    translatedSystemrechte?: TranslatedObject[];
    isEditActive?: boolean;
    onHandleConfirmUnsavedChanges: () => void;
    onHandleDiscard: () => void;
    onShowDialogChange: (value?: boolean) => void;
    onSubmit: () => void;
  };

  defineProps<Props>();

  // Define the V-model for each field so the parent component can pass in the values for it.
  const selectedAdministrationsebene: ModelRef<string | undefined, string> =
    defineModel('selectedAdministrationsebene');
  const selectedRollenArt: ModelRef<RollenArt | undefined, string> = defineModel('selectedRollenArt');
  const selectedRollenName: ModelRef<string | undefined, string> = defineModel('selectedRollenName');
  const selectedMerkmale: ModelRef<RollenMerkmal[] | undefined, string> = defineModel('selectedMerkmale');
  const selectedServiceProviders: ModelRef<string[] | undefined, string> = defineModel('selectedServiceProviders');
  const selectedSystemRechte: ModelRef<RollenSystemRecht[] | undefined, string> = defineModel('selectedSystemRechte');
</script>

<template data-test-id="rolle-form">
  <FormWrapper
    :confirmUnsavedChangesAction="onHandleConfirmUnsavedChanges"
    :createButtonLabel="$t('admin.rolle.create')"
    :discardButtonLabel="$t('admin.rolle.discard')"
    :hideActions="readonly"
    id="rolle-form"
    :onDiscard="onHandleDiscard"
    @onShowDialogChange="onShowDialogChange"
    :onSubmit="onSubmit"
    :showUnsavedChangesDialog="showUnsavedChangesDialog"
  >
    <!-- 1. Administrationsebene zuordnen -->
    <v-row>
      <h3 class="headline-3">1. {{ $t('admin.administrationsebene.assignAdministrationsebene') }}</h3>
    </v-row>
    <FormRow
      :errorLabel="selectedAdministrationsebeneProps?.error || ''"
      labelForId="administrationsebene-select"
      :isRequired="true"
      :label="$t('admin.administrationsebene.administrationsebene')"
    >
      <v-select
        clearable
        data-testid="administrationsebene-select"
        density="compact"
        :disabled="readonly"
        id="administrationsebene-select"
        :items="administrationsebenen"
        item-value="value"
        item-text="title"
        :no-data-text="$t('noDataFound')"
        :placeholder="$t('admin.administrationsebene.assignAdministrationsebene')"
        ref="administrationsebene-select"
        required="true"
        variant="outlined"
        v-bind="selectedAdministrationsebeneProps"
        v-model="selectedAdministrationsebene"
      ></v-select>
    </FormRow>

    <!-- 2. Rollenart zuordnen -->
    <v-row>
      <h3 class="headline-3">2. {{ $t('admin.rolle.assignRollenart') }}</h3>
    </v-row>
    <FormRow
      :errorLabel="selectedRollenArtProps?.error || ''"
      labelForId="rollenart-select"
      :isRequired="true"
      :label="$t('admin.rolle.rollenart')"
    >
      <v-select
        clearable
        data-testid="rollenart-select"
        density="compact"
        :disabled="readonly"
        id="rollenart-select"
        :items="translatedRollenarten"
        item-value="value"
        item-text="title"
        :no-data-text="$t('noDataFound')"
        :placeholder="$t('admin.rolle.selectRollenart')"
        ref="rollenart-select"
        required="true"
        variant="outlined"
        v-bind="selectedRollenArtProps"
        v-model="selectedRollenArt"
      ></v-select>
    </FormRow>

    <template v-if="selectedRollenArt && selectedAdministrationsebene">
      <!-- 3. Rollenname eingeben -->
      <v-row>
        <h3 class="headline-3">3. {{ $t('admin.rolle.enterRollenname') }}</h3>
      </v-row>
      <FormRow
        :errorLabel="selectedRollenNameProps?.error || ''"
        labelForId="rollenname-input"
        :isRequired="true"
        :label="$t('admin.rolle.rollenname')"
      >
        <v-text-field
          clearable
          data-testid="rollenname-input"
          density="compact"
          :disabled="!isEditActive"
          id="rollenname-input"
          :placeholder="$t('admin.rolle.enterRollenname')"
          ref="rollenname-input"
          required="true"
          variant="outlined"
          v-bind="selectedRollenNameProps"
          v-model="selectedRollenName"
        ></v-text-field>
      </FormRow>

      <!-- 4. Merkmale zuordnen -->
      <v-row>
        <h3 class="headline-3">4. {{ $t('admin.rolle.assignMerkmale') }}</h3>
      </v-row>
      <FormRow
        :errorLabel="selectedMerkmaleProps?.error || ''"
        labelForId="merkmale-select"
        :label="$t('admin.rolle.merkmale')"
      >
        <v-select
          chips
          clearable
          data-testid="merkmale-select"
          density="compact"
          :disabled="!isEditActive"
          id="merkmale-select"
          :items="translatedMerkmale"
          item-value="value"
          item-text="title"
          multiple
          :no-data-text="$t('noDataFound')"
          :placeholder="isEditActive ? $t('admin.rolle.selectMerkmale') : '---'"
          variant="outlined"
          v-bind="selectedMerkmaleProps"
          v-model="selectedMerkmale"
        ></v-select>
      </FormRow>

      <!-- 5. Angebote zuordnen -->
      <v-row>
        <h3 class="headline-3">5. {{ $t('admin.serviceProvider.assignServiceProvider') }}</h3>
      </v-row>
      <FormRow
        :errorLabel="selectedServiceProvidersProps?.error || ''"
        labelForId="service-provider-select"
        :label="$t('admin.serviceProvider.serviceProvider')"
      >
        <v-autocomplete
          autocomplete="off"
          chips
          clearable
          data-testid="service-provider-select"
          density="compact"
          :disabled="!isEditActive"
          id="service-provider-select"
          :items="serviceProviders"
          item-value="value"
          item-text="title"
          multiple
          :no-data-text="$t('noDataFound')"
          :placeholder="isEditActive ? $t('admin.serviceProvider.selectServiceProvider') : '---'"
          variant="outlined"
          v-bind="selectedServiceProvidersProps"
          v-model="selectedServiceProviders"
        ></v-autocomplete>
      </FormRow>

      <!-- 6. Systemrechte zuordnen -->
      <v-row>
        <h3 class="headline-3">6. {{ $t('admin.rolle.assignSystemrechte') }}</h3>
      </v-row>
      <!-- Iterate over each system right and create a checkbox for it -->
      <FormRow
        :errorLabel="selectedSystemRechteProps?.error || ''"
        labelForId="systemrecht-select"
        :label="$t('admin.rolle.systemrechte')"
      >
        <v-autocomplete
          autocomplete="off"
          chips
          clearable
          data-testid="systemrechte-select"
          density="compact"
          :disabled="!isEditActive"
          id="systemrechte-select"
          :items="translatedSystemrechte"
          item-value="value"
          item-text="title"
          multiple
          :no-data-text="$t('noDataFound')"
          :placeholder="isEditActive ? $t('admin.rolle.selectSystemrechte') : '---'"
          variant="outlined"
          v-bind="selectedSystemRechteProps"
          v-model="selectedSystemRechte"
        ></v-autocomplete>
      </FormRow>
    </template>
  </FormWrapper>
</template>

<style></style>
