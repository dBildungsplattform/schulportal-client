<script setup lang="ts">
  import SchulenFilter from '@/components/filter/SchulenFilter.vue';
  import FormRow from '@/components/form/FormRow.vue';
  import FormWrapper from '@/components/form/FormWrapper.vue';
  import LogoSelector from '@/components/form/LogoSelector.vue';
  import { getLogoPath } from '@/config/logosConfig';
  import { type Organisation } from '@/stores/OrganisationStore';
  import { RollenSystemRecht } from '@/stores/RolleStore';
  import { ServiceProviderKategorie, ServiceProviderMerkmal } from '@/stores/ServiceProviderStore';
  import { DIN_91379A_EXT, NO_LEADING_TRAILING_SPACES } from '@/utils/validation';
  import { toTypedSchema } from '@vee-validate/yup';
  import { useForm, type BaseFieldProps, type FormContext, type FormMeta, type TypedSchema } from 'vee-validate';
  import { computed, onMounted, ref, watch, watchEffect, type ComputedRef, type Ref } from 'vue';
  import { useI18n, type Composer } from 'vue-i18n';
  import { boolean, number, object, string } from 'yup';
  import type { ServiceProviderFormProps as Props, ServiceProviderForm, ServiceProviderFormSubmitData } from './types';

  type Emits = {
    (e: 'click:confirmUnsaved'): void;
    (e: 'click:discard'): void;
    (e: 'click:submit', values: ServiceProviderFormSubmitData): void;
    (e: 'update:canSubmit', value: boolean): void;
    (e: 'update:dirty', value: boolean): void;
    (e: 'update:showUnsavedChangesDialog', visible: boolean): void;
  };

  type FieldDefinition<T> = [Ref<T>, Ref<BaseFieldProps & { error: boolean; 'error-messages': string[] }>];

  const props: Props = defineProps<Props>();

  const emit: Emits = defineEmits<Emits>();

  const { t }: Composer = useI18n({ useScope: 'global' });

  const validationSchema: TypedSchema<ServiceProviderForm> = toTypedSchema(
    object({
      selectedOrganisationId: string().required(t('angebot.rules.organisation.required')),
      name: string()
        .max(50, t('angebot.rules.name.maxLength'))
        .matches(DIN_91379A_EXT, t('angebot.rules.name.matches'))
        .matches(NO_LEADING_TRAILING_SPACES, t('angebot.rules.name.noLeadingTrailingSpaces'))
        .required(t('angebot.rules.name.required')),
      url: string().required(t('angebot.rules.url.required')),
      logoId: number().required(t('angebot.rules.logo.required')),
      kategorie: string().required(t('angebot.rules.kategorie.required')),
      nachtraeglichZuweisbar: boolean().optional(),
      verfuegbarFuerRollenerweiterung: boolean().optional(),
      requires2fa: boolean().optional(),
    }),
  );

  const vuetifyConfig: (state: { errors: string[] }) => {
    props: { error: boolean; 'error-messages': string[] };
  } = (state: { errors: string[] }) => ({
    props: {
      error: !!state.errors.length,
      'error-messages': state.errors,
    },
  });

  const formContext: FormContext<ServiceProviderForm> = useForm({
    validationSchema,
    initialValues: {
      kategorie: ServiceProviderKategorie.Schulisch,
      nachtraeglichZuweisbar: true,
      verfuegbarFuerRollenerweiterung: true,
      requires2fa: false,
      // No default logoId — admin must actively pick one
      ...props.initialValues,
    } as ServiceProviderForm,
  });

  const [selectedOrganisationId, selectedOrganisationIdProps]: FieldDefinition<string> = formContext.defineField(
    'selectedOrganisationId',
    vuetifyConfig,
  );
  const [name, nameProps]: FieldDefinition<string> = formContext.defineField('name', vuetifyConfig);
  const [url, urlProps]: FieldDefinition<string> = formContext.defineField('url', vuetifyConfig);
  const [logoId, logoIdProps]: FieldDefinition<number> = formContext.defineField('logoId', vuetifyConfig);
  const [kategorie, kategorieProps]: FieldDefinition<ServiceProviderKategorie> = formContext.defineField(
    'kategorie',
    vuetifyConfig,
  );
  const [requires2fa, requires2faProps]: FieldDefinition<boolean> = formContext.defineField(
    'requires2fa',
    vuetifyConfig,
  );
  const [nachtraeglichZuweisbar, nachtraeglichZuweisbarProps]: FieldDefinition<boolean> = formContext.defineField(
    'nachtraeglichZuweisbar',
    vuetifyConfig,
  );
  const [verfuegbarFuerRollenerweiterung, verfuegbarFuerRollenerweiterungProps]: FieldDefinition<boolean> =
    formContext.defineField('verfuegbarFuerRollenerweiterung', vuetifyConfig);

  const canCommit: ComputedRef<boolean> = computed(() => formContext.meta.value.valid && formContext.meta.value.dirty);

  const kategorieItems: ComputedRef<{ title: string; value: string }[]> = computed(() =>
    Object.values(ServiceProviderKategorie).map((k: string) => ({
      title: t(`angebot.kategorien.${k}`),
      value: k,
    })),
  );

  // Resolve the SVG path for the currently selected logoId — used for the preview
  const selectedLogoPath: ComputedRef<string | undefined> = computed(() => getLogoPath(logoId.value));

  // Show preview only when both name and logo are selected
  const showPreview: ComputedRef<boolean> = computed(() => !!name.value && !!logoId.value);

  function initializeFormWithCachedValues(): void {
    if (!props.cachedValues) {
      return;
    }
    const cached: Partial<ServiceProviderForm> = props.cachedValues;
    formContext.setValues(cached);
  }

  const cachedOrga: Ref<Organisation | undefined> = ref();

  function updateSelectedOrganisation(selectedOrgas: Organisation[]): void {
    if (props.isEditMode) {
      return;
    }
    const org: Organisation | undefined = selectedOrgas.at(0);
    if (org) {
      formContext.setFieldValue('selectedOrganisationId', org.id);
      cachedOrga.value = org;
    }
  }

  function openUrlInNewTab(): void {
    if (!url.value) {
      return;
    }

    let value: string = url.value.trim();

    if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(value)) {
      value = 'https://' + value;
    }

    window.open(value, '_blank', 'noopener,noreferrer');
  }

  const onSubmit: (e?: Event) => Promise<void> = formContext.handleSubmit((values: ServiceProviderForm) => {
    if (!props.isEditMode && !cachedOrga.value) {
      return;
    }

    let normalizedUrl: string = values.url.trim();
    if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(normalizedUrl)) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    const payload: ServiceProviderFormSubmitData = {
      selectedOrganisation: cachedOrga.value,
      name: values.name,
      url: normalizedUrl,
      logoId: values.logoId, // integer ID sent to backend
      kategorie: values.kategorie,
      merkmale: [],
      requires2fa: values.requires2fa,
    };
    if (values.nachtraeglichZuweisbar) {
      payload.merkmale.push(ServiceProviderMerkmal.NachtraeglichZuweisbar);
    }
    if (values.verfuegbarFuerRollenerweiterung) {
      payload.merkmale.push(ServiceProviderMerkmal.VerfuegbarFuerRollenerweiterung);
    }
    emit('click:submit', payload);
  });

  watch(formContext.meta, ({ dirty }: FormMeta<ServiceProviderForm>) => {
    emit('update:dirty', dirty);
  });

  watchEffect(() => {
    emit('update:canSubmit', canCommit.value);
  });

  onMounted(() => {
    initializeFormWithCachedValues();
  });
</script>

<template>
  <FormWrapper
    :id="isEditMode ? 'service-provider-edit-form' : 'service-provider-create-form'"
    :confirm-unsaved-changes-action="() => emit('click:confirmUnsaved')"
    :can-commit="canCommit"
    :create-button-label="isEditMode ? t('save') : t('angebot.create')"
    :discard-button-label="isEditMode ? t('cancel') : t('angebot.discard')"
    :hide-actions="!!errorCode"
    :is-loading="loading"
    :on-discard="() => emit('click:discard')"
    :on-submit="onSubmit"
    :show-unsaved-changes-dialog
    @on-show-dialog-change="(value?: boolean) => emit('update:showUnsavedChangesDialog', !!value)"
  >
    <template v-if="!errorCode">
      <!-- 1. Organisation -->
      <v-row>
        <v-col>
          <h3 class="headline-3">1. {{ $t('angebot.whoProvidesThisAngebot') }}</h3>
        </v-col>
      </v-row>
      <FormRow
        :error-label="selectedOrganisationIdProps['error']"
        :is-required="true"
        label-for-id="organisation-select"
        :label="$t('angebot.providedBy')"
      >
        <SchulenFilter
          :systemrechte-for-search="[props.systemrecht]"
          :readonly="isEditMode"
          :highlight-selection="isEditMode"
          :multiple="false"
          :parent-id="isEditMode ? 'service-provider-edit' : 'service-provider-create'"
          :placeholderText="$t('admin.organisation.selectOrganisation')"
          :includeAll="true"
          :selected-schule-props="selectedOrganisationIdProps"
          :selected-schulen="selectedOrganisationId"
          @update:selected-schulen-objects="updateSelectedOrganisation"
        />
      </FormRow>

      <!-- 2. Name -->
      <v-row>
        <v-col>
          <h3 class="headline-3">2. {{ $t('angebot.nameOfAngebotInTheStartPage') }}</h3>
        </v-col>
      </v-row>
      <FormRow
        :error-label="nameProps['error']"
        :is-required="true"
        label-for-id="name-input"
        :label="$t('angebot.name')"
      >
        <v-text-field
          id="name-input"
          v-bind="nameProps"
          v-model="name"
          autocomplete="off"
          data-testid="name-input"
          density="compact"
          :placeholder="$t('angebot.enterName')"
          required
          variant="outlined"
        />
      </FormRow>

      <!-- 3. URL -->
      <v-row class="mb-n8">
        <v-col>
          <h3 class="headline-3">3. {{ $t('angebot.urlOfTheAngebot') }}</h3>
        </v-col>
      </v-row>
      <FormRow
        :error-label="urlProps['error']"
        :is-required="true"
        label-for-id="url-input"
        :label="$t('angebot.url')"
      >
        <v-text-field
          id="url-input"
          v-bind="urlProps"
          v-model="url"
          autocomplete="off"
          data-testid="url-input"
          density="compact"
          :placeholder="$t('angebot.enterUrl')"
          required
          variant="outlined"
        />
        <div class="d-flex justify-end">
          <v-btn
            :disabled="!url"
            class="primary smallest"
            data-testid="url-test-button"
            density="compact"
            variant="outlined"
            @click="openUrlInNewTab"
          >
            {{ $t('angebot.testUrl') }}
          </v-btn>
        </div>
      </FormRow>

      <!-- 4. Logo -->
      <v-row>
        <v-col>
          <h3 class="headline-3">4. {{ $t('angebot.logoOfTheAngebotInTheStartPage') }}</h3>
        </v-col>
      </v-row>
      <FormRow
        :error-label="logoIdProps['error']"
        :is-required="true"
        label-for-id="logo-selector"
        :label="$t('angebot.logo')"
      >
        <LogoSelector
          id="logo-selector"
          v-model="logoId"
          v-bind="logoIdProps"
          :readonly="false"
          data-testid="logo-selector"
        />
      </FormRow>

      <!-- Preview: visible as soon as name + logo are both set -->
      <template v-if="showPreview">
        <v-row>
          <v-col>
            <h3 class="headline-3">{{ $t('angebot.preview') }}</h3>
          </v-col>
        </v-row>
        <v-row>
          <v-col
            cols="12"
            sm="6"
            md="4"
          >
            <v-card
              class="preview-card d-flex align-center pa-4 ga-4"
              variant="outlined"
            >
              <v-img
                :src="selectedLogoPath"
                max-height="48"
                max-width="48"
                contain
              />
              <span class="preview-name">{{ name }}</span>
            </v-card>
            <p class="preview-hint mt-2">{{ $t('angebot.previewHint') }}</p>
          </v-col>
        </v-row>
      </template>

      <!-- 5. Kategorie -->
      <v-row>
        <v-col>
          <h3 class="headline-3">5. {{ $t('angebot.kategorieOfTheAngebotInTheStartPage') }}</h3>
        </v-col>
      </v-row>
      <FormRow
        :error-label="kategorieProps['error']"
        :is-required="false"
        label-for-id="kategorie-select"
        :label="$t('angebot.kategorie')"
      >
        <v-autocomplete
          :disabled="systemrecht !== RollenSystemRecht.AngeboteVerwalten"
          id="kategorie-select"
          v-bind="kategorieProps"
          v-model="kategorie"
          autocomplete="off"
          clearable
          data-testid="kategorie-select"
          density="compact"
          :items="kategorieItems"
          item-value="value"
          item-title="title"
          :no-data-text="$t('noDataFound')"
          :placeholder="$t('angebot.selectKategorie')"
          required
          variant="outlined"
        />
      </FormRow>

      <!-- 6. Nachträglich zuweisbar -->
      <v-row>
        <v-col>
          <h3 class="headline-3">6. {{ $t('angebot.canThisAngebotBeAssignedToRollen') }}</h3>
        </v-col>
      </v-row>
      <FormRow
        :error-label="nachtraeglichZuweisbarProps['error']"
        :is-required="false"
        label-for-id="nachtraeglich-zuweisbar-select"
        :label="$t('angebot.canBeAssigned')"
      >
        <v-select
          :disabled="isEditMode || systemrecht !== RollenSystemRecht.AngeboteVerwalten"
          id="nachtraeglich-zuweisbar-select"
          v-bind="nachtraeglichZuweisbarProps"
          v-model="nachtraeglichZuweisbar"
          data-testid="nachtraeglich-zuweisbar-select"
          density="compact"
          :items="[
            { title: $t('yes'), value: true },
            { title: $t('no'), value: false },
          ]"
          item-value="value"
          item-title="title"
          variant="outlined"
        />
      </FormRow>

      <!-- 7. Rollenerweiterung -->
      <v-row>
        <v-col>
          <h3 class="headline-3">7. {{ $t('angebot.canThisAngebotBeUsedForSchulspezifischeRollenerweiterungen') }}</h3>
        </v-col>
      </v-row>
      <FormRow
        :error-label="verfuegbarFuerRollenerweiterungProps['error']"
        :is-required="false"
        label-for-id="verfuegbar-fuer-rollenerweiterung-select"
        :label="$t('angebot.canBeUsed')"
      >
        <v-select
          :disabled="isEditMode || systemrecht !== RollenSystemRecht.AngeboteVerwalten"
          id="verfuegbar-fuer-rollenerweiterung-select"
          v-bind="verfuegbarFuerRollenerweiterungProps"
          v-model="verfuegbarFuerRollenerweiterung"
          data-testid="verfuegbar-fuer-rollenerweiterung-select"
          density="compact"
          :items="[
            { title: $t('yes'), value: true },
            { title: $t('no'), value: false },
          ]"
          item-value="value"
          item-title="title"
          variant="outlined"
        />
      </FormRow>

      <!-- 8. 2FA -->
      <v-row>
        <v-col>
          <h3 class="headline-3">8. {{ $t('angebot.is2FARequired') }}</h3>
        </v-col>
      </v-row>
      <FormRow
        :error-label="requires2faProps['error']"
        :is-required="false"
        label-for-id="requires2fa-select"
        :label="$t('angebot.requires2FA')"
      >
        <v-select
          disabled
          id="requires2fa-select"
          v-bind="requires2faProps"
          v-model="requires2fa"
          data-testid="requires2fa-select"
          density="compact"
          :items="[
            { title: $t('yes'), value: true },
            { title: $t('no'), value: false },
          ]"
          item-value="value"
          item-title="title"
          variant="outlined"
        />
      </FormRow>
    </template>
  </FormWrapper>
</template>

<style scoped>
  .preview-card {
    border-color: #001e49;
    border-radius: 8px;
  }

  .preview-name {
    font-size: 1rem;
    font-weight: 600;
    color: #001e49;
  }

  .preview-hint {
    font-size: 0.75rem;
    color: #666;
    font-style: italic;
  }
</style>
