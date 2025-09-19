<script setup lang="ts">
  import { computed, ref, watch, type ComputedRef, type ModelRef, type Ref } from 'vue';
  import type { BaseFieldProps } from 'vee-validate';
  import FormWrapper from '@/components/form/FormWrapper.vue';
  import FormRow from '@/components/form/FormRow.vue';
  import { type TranslatedObject } from '@/types.d';
  import type { RollenArt, RollenMerkmal, RollenSystemRecht } from '@/stores/RolleStore';
  import {
    OrganisationsTyp,
    useOrganisationStore,
    type OrganisationenFilter,
    type OrganisationStore,
  } from '@/stores/OrganisationStore';

  type Props = {
    administrationsebenen?: Array<{ value: string; title: string }>;
    readonly?: boolean;
    errorCode?: string;
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
    isLoading: boolean;
    hasAutoselectedAdministrationsebene?: boolean;
    onHandleConfirmUnsavedChanges: () => void;
    onHandleDiscard: () => void;
    onShowDialogChange: (value?: boolean) => void;
    onSubmit: () => void;
  };

  const props: Props = defineProps<Props>();
  const organisationStore: OrganisationStore = useOrganisationStore();

  const timerId: Ref<ReturnType<typeof setTimeout> | undefined> = ref<ReturnType<typeof setTimeout>>();
  const searchInputAdministrationsebenen: Ref<string> = ref('');

  // Define the V-model for each field so the parent component can pass in the values for it.
  const selectedAdministrationsebene: ModelRef<string | undefined, string> =
    defineModel('selectedAdministrationsebene');
  const selectedRollenArt: ModelRef<RollenArt | undefined, string> = defineModel('selectedRollenArt');
  const selectedRollenName: ModelRef<string | undefined, string> = defineModel('selectedRollenName');
  const selectedMerkmale: ModelRef<RollenMerkmal[] | undefined, string> = defineModel('selectedMerkmale');
  const selectedServiceProviders: ModelRef<string[] | undefined, string> = defineModel('selectedServiceProviders');
  const selectedSystemRechte: ModelRef<RollenSystemRecht[] | undefined, string> = defineModel('selectedSystemRechte');

  const selectedAdministrationsebeneTitle: ComputedRef<string | undefined> = computed(() => {
    return props.administrationsebenen?.find(
      (org: TranslatedObject) => org.value === selectedAdministrationsebene.value,
    )?.title;
  });

  // Watcher for selectedOrganisation to fetch roles and classes
  watch(selectedAdministrationsebene, async (newValue: string | undefined, oldValue: string | undefined) => {
    if (newValue && newValue !== oldValue) {
      const filter: OrganisationenFilter = {
        systemrechte: ['ROLLEN_VERWALTEN'],
        organisationIds: [newValue],
        excludeTyp: [OrganisationsTyp.Klasse],
        limit: 25,
      };

      await organisationStore.getAllOrganisationen(filter);
    }
    selectedAdministrationsebene.value = newValue;
  });

  watch(searchInputAdministrationsebenen, (newValue: string, oldValue: string) => {
    clearTimeout(timerId.value);

    const filter: OrganisationenFilter = {
      systemrechte: ['ROLLEN_VERWALTEN'],
      excludeTyp: [OrganisationsTyp.Klasse],
      limit: 25,
    };

    if (oldValue === selectedAdministrationsebeneTitle.value) {
      return;
    }

    if (newValue === '' && !selectedAdministrationsebene.value) {
      // Case: Initial load
      // nothing to add — base filter is fine
    } else if (newValue && newValue !== selectedAdministrationsebeneTitle.value) {
      filter.searchString = newValue;
    } else if (newValue === '' && selectedAdministrationsebene.value) {
      // Case: user cleared search but selected something earlier
      filter.organisationIds = [selectedAdministrationsebene.value];
    } else {
      return;
    }

    timerId.value = setTimeout(async () => {
      await organisationStore.getAllOrganisationen(filter);
    }, 500);
  });
</script>

<template data-test-id="rolle-form">
  <FormWrapper
    id="rolle-form"
    ref="form-wrapper"
    :confirm-unsaved-changes-action="onHandleConfirmUnsavedChanges"
    :create-button-label="$t('admin.rolle.create')"
    :discard-button-label="$t('admin.rolle.discard')"
    :hide-actions="readonly || !!props.errorCode"
    :is-loading="isLoading"
    :on-discard="onHandleDiscard"
    :on-submit="onSubmit"
    :show-unsaved-changes-dialog="showUnsavedChangesDialog"
    @on-show-dialog-change="onShowDialogChange"
  >
    <!-- Slot for SPSH alerts -->
    <slot />

    <template v-if="!props.errorCode">
      <!-- 1. Administrationsebene zuordnen -->
      <v-row>
        <h3 class="headline-3">1. {{ $t('admin.administrationsebene.assignAdministrationsebene') }}</h3>
      </v-row>
      <FormRow
        :error-label="selectedAdministrationsebeneProps?.error || ''"
        label-for-id="administrationsebene-select"
        :is-required="true"
        :label="$t('admin.administrationsebene.administrationsebene')"
      >
        <v-autocomplete
          id="administrationsebene-select"
          ref="administrationsebene-select"
          v-bind="selectedAdministrationsebeneProps"
          v-model="selectedAdministrationsebene"
          v-model:search="searchInputAdministrationsebenen"
          autocomplete="off"
          clearable
          :class="[
            { 'filter-dropdown mb-4': hasAutoselectedAdministrationsebene },
            { selected: selectedAdministrationsebene },
          ]"
          data-testid="administrationsebene-select"
          density="compact"
          :disabled="readonly || hasAutoselectedAdministrationsebene"
          :items="administrationsebenen"
          item-value="value"
          item-text="title"
          :no-data-text="$t('noDataFound')"
          :placeholder="$t('admin.administrationsebene.assignAdministrationsebene')"
          required="true"
          variant="outlined"
        />
      </FormRow>

      <!-- 2. Rollenart zuordnen -->
      <v-row>
        <h3 class="headline-3">2. {{ $t('admin.rolle.assignRollenart') }}</h3>
      </v-row>
      <FormRow
        :error-label="selectedRollenArtProps?.error || ''"
        label-for-id="rollenart-select"
        :is-required="true"
        :label="$t('admin.rolle.rollenart')"
      >
        <v-select
          id="rollenart-select"
          ref="rollenart-select"
          v-bind="selectedRollenArtProps"
          v-model="selectedRollenArt"
          clearable
          data-testid="rollenart-select"
          density="compact"
          :disabled="readonly"
          :items="translatedRollenarten"
          item-value="value"
          item-text="title"
          :no-data-text="$t('noDataFound')"
          :placeholder="$t('admin.rolle.selectRollenart')"
          required="true"
          variant="outlined"
        />
      </FormRow>

      <template v-if="selectedRollenArt && selectedAdministrationsebene">
        <!-- 3. Rollenname eingeben -->
        <v-row>
          <h3 class="headline-3">3. {{ $t('admin.rolle.enterRollenname') }}</h3>
        </v-row>
        <FormRow
          :error-label="selectedRollenNameProps?.error || ''"
          label-for-id="rollenname-input"
          :is-required="true"
          :label="$t('admin.rolle.rollenname')"
        >
          <v-text-field
            id="rollenname-input"
            ref="rollenname-input"
            v-bind="selectedRollenNameProps"
            v-model="selectedRollenName"
            clearable
            data-testid="rollenname-input"
            density="compact"
            :disabled="!isEditActive"
            :placeholder="$t('admin.rolle.enterRollenname')"
            required="true"
            variant="outlined"
          />
        </FormRow>

        <!-- 4. Merkmale zuordnen -->
        <v-row>
          <h3 class="headline-3">4. {{ $t('admin.rolle.assignMerkmale') }}</h3>
        </v-row>
        <FormRow
          :error-label="selectedMerkmaleProps?.error || ''"
          label-for-id="merkmale-select"
          :label="$t('admin.rolle.merkmale')"
        >
          <v-select
            id="merkmale-select"
            ref="merkmale-select"
            v-bind="selectedMerkmaleProps"
            v-model="selectedMerkmale"
            chips
            clearable
            data-testid="merkmale-select"
            density="compact"
            :disabled="!isEditActive"
            :items="translatedMerkmale"
            item-value="value"
            item-text="title"
            multiple
            :no-data-text="$t('noDataFound')"
            :placeholder="isEditActive ? $t('admin.rolle.selectMerkmale') : '---'"
            variant="outlined"
          />
        </FormRow>

        <!-- 5. Angebote zuordnen -->
        <v-row>
          <h3 class="headline-3">5. {{ $t('admin.serviceProvider.assignServiceProvider') }}</h3>
        </v-row>
        <FormRow
          :error-label="selectedServiceProvidersProps?.error || ''"
          label-for-id="service-provider-select"
          :label="$t('admin.serviceProvider.serviceProvider')"
        >
          <v-autocomplete
            id="service-provider-select"
            ref="service-provider-select"
            v-bind="selectedServiceProvidersProps"
            v-model="selectedServiceProviders"
            autocomplete="off"
            chips
            clearable
            data-testid="service-provider-select"
            density="compact"
            :disabled="!isEditActive"
            :items="serviceProviders"
            item-value="value"
            item-text="title"
            multiple
            :no-data-text="$t('noDataFound')"
            :placeholder="isEditActive ? $t('admin.serviceProvider.selectServiceProvider') : '---'"
            variant="outlined"
          />
        </FormRow>

        <!-- 6. Systemrechte zuordnen -->
        <v-row>
          <h3 class="headline-3">6. {{ $t('admin.rolle.assignSystemrechte') }}</h3>
        </v-row>
        <!-- Iterate over each system right and create a checkbox for it -->
        <FormRow
          :error-label="selectedSystemRechteProps?.error || ''"
          label-for-id="systemrecht-select"
          :label="$t('admin.rolle.systemrechte')"
        >
          <v-autocomplete
            id="systemrechte-select"
            ref="systemrechte-select"
            v-bind="selectedSystemRechteProps"
            v-model="selectedSystemRechte"
            autocomplete="off"
            chips
            clearable
            data-testid="systemrechte-select"
            density="compact"
            :disabled="!isEditActive"
            :items="translatedSystemrechte"
            item-value="value"
            item-text="title"
            multiple
            :no-data-text="$t('noDataFound')"
            :placeholder="isEditActive ? $t('admin.rolle.selectSystemrechte') : '---'"
            variant="outlined"
          />
        </FormRow>
      </template>
    </template>
  </FormWrapper>
</template>

<style></style>
