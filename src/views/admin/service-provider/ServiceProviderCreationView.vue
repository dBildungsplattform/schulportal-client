<script setup lang="ts">
  import SpshAlert from '@/components/alert/SpshAlert.vue';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import SchulenFilter from '@/components/filter/SchulenFilter.vue';
  import FormRow from '@/components/form/FormRow.vue';
  import FormWrapper from '@/components/form/FormWrapper.vue';
  import {
    ServiceProviderKategorie,
    ServiceProviderMerkmal,
    useServiceProviderStore,
    type ServiceProviderStore,
  } from '@/stores/ServiceProviderStore';
  import { toTypedSchema } from '@vee-validate/yup';
  import { useForm, type BaseFieldProps, type FormContext, type TypedSchema } from 'vee-validate';
  import { ref, computed, onMounted, onUnmounted, type Ref, type ComputedRef } from 'vue';
  import { useI18n, type Composer } from 'vue-i18n';
  import {
    onBeforeRouteLeave,
    useRouter,
    type NavigationGuardNext,
    type RouteLocationNormalized,
    type Router,
  } from 'vue-router';
  import { boolean, object, string } from 'yup';
  import { DIN_91379A_EXT, NO_LEADING_TRAILING_SPACES } from '@/utils/validation';

  const serviceProviderStore: ServiceProviderStore = useServiceProviderStore();

  const router: Router = useRouter();
  const { t }: Composer = useI18n({ useScope: 'global' });

  const validationSchema: TypedSchema = toTypedSchema(
    object({
      selectedOrganisationId: string().required(t('angebot.rules.organisation.required')),
      name: string()
        .max(50, t('angebot.rules.name.maxLength'))
        .matches(DIN_91379A_EXT, t('angebot.rules.name.matches'))
        .matches(NO_LEADING_TRAILING_SPACES, t('angebot.rules.name.noLeadingTrailingSpaces'))
        .required(t('angebot.rules.name.required')),
      url: string().required(t('angebot.rules.url.required')).url(t('angebot.rules.url.invalid')),
      kategorie: string().required(t('angebot.rules.kategorie.required')),
      nachtraeglichZuweisbar: boolean().required(),
      verfuegbarFuerRollenerweiterung: boolean().required(),
      requires2fa: boolean().required(),
    }),
  );

  const vuetifyConfig: (state: { errors: Array<string> }) => {
    props: { error: boolean; 'error-messages': Array<string> };
  } = (state: { errors: string[] }) => ({
    props: {
      error: !!state.errors.length,
      'error-messages': state.errors,
    },
  });

  type ServiceProviderForm = {
    selectedOrganisationId: string | undefined;
    name: string;
    url: string;
    kategorie: string | undefined;
    nachtraeglichZuweisbar: boolean;
    verfuegbarFuerRollenerweiterung: boolean;
    requires2fa: boolean;
  };

  const formContext: FormContext<ServiceProviderForm, ServiceProviderForm> = useForm<ServiceProviderForm>({
    validationSchema,
    initialValues: {
      nachtraeglichZuweisbar: true,
      verfuegbarFuerRollenerweiterung: true,
      requires2fa: false,
    },
  });

  const [selectedOrganisationId, selectedOrganisationIdProps]: [
    Ref<string | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = formContext.defineField('selectedOrganisationId', vuetifyConfig);

  const [name, nameProps]: [Ref<string>, Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>] =
    formContext.defineField('name', vuetifyConfig);

  const [url, urlProps]: [Ref<string>, Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>] =
    formContext.defineField('url', vuetifyConfig);

  const [kategorie, kategorieProps]: [
    Ref<string | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = formContext.defineField('kategorie', vuetifyConfig);

  const [requires2fa, requires2faProps]: [
    Ref<boolean>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = formContext.defineField('requires2fa', vuetifyConfig);

  const [nachtraeglichZuweisbar, nachtraeglichZuweisbarProps]: [
    Ref<boolean>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = formContext.defineField('nachtraeglichZuweisbar', vuetifyConfig);

  const [verfuegbarFuerRollenerweiterung, verfuegbarFuerRollenerweiterungProps]: [
    Ref<boolean>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = formContext.defineField('verfuegbarFuerRollenerweiterung', vuetifyConfig);

  const kategorieItems: ComputedRef<{ title: string; value: string }[]> = computed(() =>
    Object.values(ServiceProviderKategorie).map((k) => ({
      title: t(`angebot.kategorien.${k}`),
      value: k,
    })),
  );

  function navigateToServiceProviderTable(): void {
    formContext.resetForm();
    serviceProviderStore.errorCode = '';
    router.push({ name: 'service-provider-management' });
  }

  function updateSelectedOrganisation(id: string | undefined): void {
    formContext.setFieldValue('selectedOrganisationId', id);
  }

  function isFormDirty(): boolean {
    return (
      formContext.isFieldDirty('selectedOrganisationId') ||
      formContext.isFieldDirty('name') ||
      formContext.isFieldDirty('url') ||
      formContext.isFieldDirty('kategorie') ||
      formContext.isFieldDirty('nachtraeglichZuweisbar') ||
      formContext.isFieldDirty('verfuegbarFuerRollenerweiterung') ||
      formContext.isFieldDirty('requires2fa')
    );
  }

  const showUnsavedChangesDialog: Ref<boolean> = ref(false);
  let blockedNext: () => void = () => {
    /* empty */
  };

  function handleConfirmUnsavedChanges(): void {
    blockedNext();
    serviceProviderStore.errorCode = '';
  }

  function preventNavigation(event: BeforeUnloadEvent): void {
    if (!isFormDirty()) {
      return;
    }
    event.preventDefault();
    event.returnValue = '';
  }

  const onSubmit: (e?: Event) => Promise<Promise<void> | undefined> = formContext.handleSubmit(
    async (values: ServiceProviderForm) => {
      const merkmale: ServiceProviderMerkmal[] = [];
      if (values.nachtraeglichZuweisbar) {
        merkmale.push(ServiceProviderMerkmal.NachtraeglichZuweisbar);
      }
      if (values.verfuegbarFuerRollenerweiterung) {
        merkmale.push(ServiceProviderMerkmal.VerfuegbarFuerRollenerweiterung);
      }

      await serviceProviderStore.createServiceProvider({
        organisationId: values.selectedOrganisationId!,
        name: values.name,
        url: values.url,
        kategorie: values.kategorie as ServiceProviderKategorie,
        requires2fa: values.requires2fa,
        merkmale,
      });

      if (!serviceProviderStore.errorCode) {
        navigateToServiceProviderTable();
      }
    },
  );

  onBeforeRouteLeave((_to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
    if (isFormDirty()) {
      showUnsavedChangesDialog.value = true;
      blockedNext = next;
    } else {
      next();
    }
  });

  onMounted(() => {
    serviceProviderStore.errorCode = '';
    window.addEventListener('beforeunload', preventNavigation);
  });

  onUnmounted(() => {
    window.removeEventListener('beforeunload', preventNavigation);
  });
</script>

<template>
  <div class="admin">
    <h1
      class="text-center headline"
      data-testid="admin-headline"
    >
      {{ $t('admin.headline') }}
    </h1>
    <LayoutCard
      :closable="true"
      :header="$t('admin.serviceProvider.create')"
      headlineTestId="service-provider-create-headline"
      @onCloseClicked="navigateToServiceProviderTable"
      :padded="true"
      :showCloseText="true"
    >
      <FormWrapper
        id="service-provider-create-form"
        :confirm-unsaved-changes-action="handleConfirmUnsavedChanges"
        :create-button-label="$t('angebot.create')"
        :discard-button-label="$t('angebot.discard')"
        :hide-actions="false"
        :is-loading="serviceProviderStore.loading"
        :on-discard="navigateToServiceProviderTable"
        :on-submit="onSubmit"
        :show-unsaved-changes-dialog="showUnsavedChangesDialog"
        @on-show-dialog-change="(value?: boolean) => (showUnsavedChangesDialog = value || false)"
      >
        <!-- Error Message -->
        <SpshAlert
          :model-value="!!serviceProviderStore.errorCode"
          :title="$t('admin.serviceProvider.createErrorTitle')"
          :type="'error'"
          :closable="false"
          :show-button="false"
          :text="$t(`admin.serviceProvider.errors.${serviceProviderStore.errorCode}`)"
        />

        <!-- 1. Wer stellt das Angebot bereit? -->
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
            :multiple="false"
            parent-id="service-provider-create"
            :placeholderText="$t('admin.organisation.selectOrganisation')"
            :includeAll="true"
            :selected-schule-props="selectedOrganisationIdProps"
            :selected-schulen="selectedOrganisationId"
            @update:selected-schulen="updateSelectedOrganisation"
          />
        </FormRow>

        <!-- 2. Name des Angebots -->
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

        <!-- 3. URL des Angebots -->
        <v-row>
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
        </FormRow>

        <!-- 4. Kategorie des Angebots -->
        <v-row>
          <v-col>
            <h3 class="headline-3">4. {{ $t('angebot.kategorieOfTheAngebotInTheStartPage') }}</h3>
          </v-col>
        </v-row>
        <FormRow
          :error-label="kategorieProps['error']"
          :is-required="true"
          label-for-id="kategorie-select"
          :label="$t('angebot.kategorie')"
        >
          <v-autocomplete
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

        <!-- 5. Darf dieses Angebot Rollen zugewiesen werden? -->
        <v-row>
          <v-col>
            <h3 class="headline-3">5. {{ $t('angebot.canThisAngebotBeAssignedToRollen') }}</h3>
          </v-col>
        </v-row>
        <FormRow
          :error-label="nachtraeglichZuweisbarProps['error']"
          :is-required="false"
          label-for-id="nachtraeglich-zuweisbar-select"
          :label="$t('angebot.canBeAssigned')"
        >
          <v-select
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

        <!-- 6. Darf dieses Angebot für schulspezifische Rollenerweiterungen genutzt werden? -->
        <v-row>
          <v-col>
            <h3 class="headline-3">
              6. {{ $t('angebot.canThisAngebotBeUsedForSchulspezifischeRollenerweiterungen') }}
            </h3>
          </v-col>
        </v-row>
        <FormRow
          :error-label="verfuegbarFuerRollenerweiterungProps['error']"
          :is-required="false"
          label-for-id="verfuegbar-fuer-rollenerweiterung-select"
          :label="$t('angebot.canBeUsed')"
        >
          <v-select
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

        <!-- 7. Ist zur Nutzung eine Zwei-Faktor-Authentifizierung erforderlich? -->
        <v-row>
          <v-col>
            <h3 class="headline-3">7. {{ $t('angebot.is2FARequired') }}</h3>
          </v-col>
        </v-row>
        <FormRow
          :error-label="requires2faProps['error']"
          :is-required="false"
          label-for-id="requires2fa-select"
          :label="$t('angebot.requires2FA')"
        >
          <v-select
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
      </FormWrapper>
    </LayoutCard>
  </div>
</template>
