<script setup lang="ts">
  import SchulPortalLogo from '@/assets/logos/Schulportal_SH_Bildmarke_RGB_Anwendung_HG_Blau.svg';
  import SuccessTemplate from '@/components/admin/service-provider/SuccessTemplate.vue';
  import SpshAlert from '@/components/alert/SpshAlert.vue';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import SchulenFilter from '@/components/filter/SchulenFilter.vue';
  import FormRow from '@/components/form/FormRow.vue';
  import FormWrapper from '@/components/form/FormWrapper.vue';
  import { useAuthStore, type AuthStore } from '@/stores/AuthStore';
  import { useOrganisationStore, type Organisation, type OrganisationStore } from '@/stores/OrganisationStore';
  import { RollenSystemRecht } from '@/stores/RolleStore';
  import {
    ServiceProviderKategorie,
    ServiceProviderMerkmal,
    useServiceProviderStore,
    type ServiceProviderStore,
  } from '@/stores/ServiceProviderStore';
  import { DIN_91379A_EXT, NO_LEADING_TRAILING_SPACES } from '@/utils/validation';
  import { toTypedSchema } from '@vee-validate/yup';
  import { useForm, type BaseFieldProps, type FormContext, type TypedSchema } from 'vee-validate';
  import { computed, onMounted, onUnmounted, ref, type ComputedRef, type Ref } from 'vue';
  import { useI18n, type Composer } from 'vue-i18n';
  import {
    onBeforeRouteLeave,
    useRouter,
    type NavigationGuardNext,
    type RouteLocationNormalized,
    type Router,
  } from 'vue-router';
  import { boolean, object, string } from 'yup';

  const serviceProviderStore: ServiceProviderStore = useServiceProviderStore();
  const authStore: AuthStore = useAuthStore();
  const organisationStore: OrganisationStore = useOrganisationStore();

  const router: Router = useRouter();
  const { t }: Composer = useI18n({ useScope: 'global' });

  const showSuccess: Ref<boolean> = ref(false);

  const selectedOrganisationIdCache: Ref<string | undefined> = ref(undefined);
  const selectedOrganisationNameCache: Ref<string | undefined> = ref(undefined);

  const hasAngeboteVerwaltenPermission: ComputedRef<boolean> = computed(() => authStore.hasAngeboteVerwaltenPermission);

  const validationSchema: TypedSchema = toTypedSchema(
    object({
      selectedOrganisationId: string().required(t('angebot.rules.organisation.required')),
      name: string()
        .max(50, t('angebot.rules.name.maxLength'))
        .matches(DIN_91379A_EXT, t('angebot.rules.name.matches'))
        .matches(NO_LEADING_TRAILING_SPACES, t('angebot.rules.name.noLeadingTrailingSpaces'))
        .required(t('angebot.rules.name.required')),
      url: string().required(t('angebot.rules.url.required')),
      logo: string().optional(),
      kategorie: string().required(t('angebot.rules.kategorie.required')),
      nachtraeglichZuweisbar: boolean().optional(),
      verfuegbarFuerRollenerweiterung: boolean().optional(),
      requires2fa: boolean().optional(),
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
    logo: string;
    kategorie: ServiceProviderKategorie;
    nachtraeglichZuweisbar: boolean;
    verfuegbarFuerRollenerweiterung: boolean;
    requires2fa: boolean;
  };

  const formContext: FormContext<ServiceProviderForm, ServiceProviderForm> = useForm<ServiceProviderForm>({
    validationSchema,
    initialValues: {
      kategorie: ServiceProviderKategorie.Schulisch,
      nachtraeglichZuweisbar: true,
      verfuegbarFuerRollenerweiterung: true,
      requires2fa: false,
      logo: SchulPortalLogo,
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

  const [logo, logoProps]: [Ref<string>, Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>] =
    formContext.defineField('logo', vuetifyConfig);

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
    Object.values(ServiceProviderKategorie).map((k: ServiceProviderKategorie) => ({
      title: t(`angebot.kategorien.${k}`),
      value: k,
    })),
  );

  const canCommit: ComputedRef<boolean> = computed(() => formContext.meta.value.valid);

  const selectedOrganisationName: ComputedRef<string> = computed(() => selectedOrganisationNameCache.value || '');

  function openUrlInNewTab(): void {
    if (!url.value) {
      return;
    }

    let value: string = url.value.trim();

    // If it doesn't already have a protocol → force https. Useful because we want to allow the admin to just enter "example.com" instead of "https://example.com"
    if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(value)) {
      value = 'https://' + value;
    }

    window.open(value, '_blank', 'noopener,noreferrer');
  }

  function navigateToServiceProviderDetails(): void {
    if (serviceProviderStore.createdServiceProvider) {
      const id: string = serviceProviderStore.createdServiceProvider.id;
      formContext.resetForm();
      selectedOrganisationNameCache.value = '';
      serviceProviderStore.errorCode = '';
      router.push({
        name: 'angebot-details-schulspezifisch',
        params: { id },
        query: {
          from: 'create-angebot',
          orga: selectedOrganisationIdCache.value,
          autoEdit: 'true',
        },
      });
    }
  }

  function navigateToServiceProviderTable(): void {
    router.push({ name: 'angebot-management-schulspezifisch' });
    formContext.resetForm();
    selectedOrganisationNameCache.value = '';
    serviceProviderStore.errorCode = '';
    serviceProviderStore.createdServiceProvider = null;
  }

  function navigateToCreatePersonRoute(reload: boolean = false): void | Promise<void> {
    let routeName: string;
    routeName = 'create-angebot';

    if (reload) {
      return router.push({ name: routeName }).then(() => router.go(0));
    } else {
      router.push({ name: routeName });
    }
  }

  function navigateBackToAngebotForm(): void {
    if (serviceProviderStore.errorCode === 'REQUIRED_STEP_UP_LEVEL_NOT_MET') {
      formContext.resetForm();
      selectedOrganisationNameCache.value = '';
      navigateToCreatePersonRoute(true);
    } else {
      serviceProviderStore.errorCode = '';
      navigateToCreatePersonRoute();
    }
  }

  function updateSelectedOrganisation(id: string | undefined): void {
    formContext.setFieldValue('selectedOrganisationId', id);
    if (id) {
      const orgsObj: { filterResult: Organisation[] } | undefined =
        organisationStore.organisationenFilters.get('service-provider-create');
      const orgs: Organisation[] = orgsObj && Array.isArray(orgsObj.filterResult) ? orgsObj.filterResult : [];
      const match: Organisation | undefined = orgs.find((o: Organisation) => o.id === id);
      if (match) {
        selectedOrganisationNameCache.value = match.name;
      }
    } else {
      selectedOrganisationNameCache.value = undefined;
    }
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

  function handleDiscard(): void {
    if (isFormDirty()) {
      showUnsavedChangesDialog.value = true;
      blockedNext = navigateToServiceProviderTable;
    } else {
      navigateToServiceProviderTable();
    }
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

      // Normalize URL: add https:// if no protocol is present
      let normalizedUrl: string = values.url.trim();
      if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(normalizedUrl)) {
        normalizedUrl = 'https://' + normalizedUrl;
      }

      await serviceProviderStore.createServiceProvider({
        organisationId: values.selectedOrganisationId!,
        name: values.name,
        url: normalizedUrl,
        kategorie: values.kategorie,
        requires2fa: values.requires2fa,
        merkmale,
      });

      if (!serviceProviderStore.errorCode) {
        showSuccess.value = true;
        selectedOrganisationIdCache.value = values.selectedOrganisationId;
        selectedOrganisationNameCache.value = selectedOrganisationName.value;
        formContext.resetForm();
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
    serviceProviderStore.createdServiceProvider = null;
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
      :closable="!serviceProviderStore.errorCode && !serviceProviderStore.createdServiceProvider"
      :header="`${t('angebot.addNew')} ${selectedOrganisationName}`"
      :header-hover-text="selectedOrganisationName"
      headlineTestId="service-provider-create-headline"
      @onCloseClicked="navigateToServiceProviderTable"
      :padded="true"
      :showCloseText="true"
    >
      <!-- The form to create a new Angebot -->
      <template v-if="!serviceProviderStore.createdServiceProvider">
        <FormWrapper
          id="service-provider-create-form"
          :confirm-unsaved-changes-action="handleConfirmUnsavedChanges"
          :can-commit="canCommit"
          :create-button-label="$t('angebot.create')"
          :discard-button-label="$t('angebot.discard')"
          :hide-actions="!!serviceProviderStore.errorCode"
          :is-loading="serviceProviderStore.loading"
          :on-discard="handleDiscard"
          :on-submit="onSubmit"
          :show-unsaved-changes-dialog="showUnsavedChangesDialog"
          @on-show-dialog-change="(value?: boolean) => (showUnsavedChangesDialog = value || false)"
        >
          <!-- Error Message -->
          <SpshAlert
            :model-value="!!serviceProviderStore.errorCode"
            :title="$t('angebot.angebotCreateErrorTitle')"
            :type="'error'"
            :closable="false"
            :show-button="true"
            :button-action="navigateBackToAngebotForm"
            :button-text="$t('angebot.backToCreateAngebot')"
            :text="$t(`angebot.errors.${serviceProviderStore.errorCode}`)"
          />
          <template v-if="!serviceProviderStore.errorCode">
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
                :systemrechte-for-search="
                  authStore.currentUserPermissions.includes(RollenSystemRecht.AngeboteVerwalten)
                    ? [RollenSystemRecht.AngeboteVerwalten]
                    : [RollenSystemRecht.AngeboteEingeschraenktVerwalten]
                "
                :selected-schule-props="selectedOrganisationIdProps"
                :selected-schulen="selectedOrganisationId"
                @update:selected-schulen="updateSelectedOrganisation"
                @update:selected-schulen-objects="
                  (orgs) => {
                    if (orgs.length > 0) {
                      selectedOrganisationNameCache = orgs[0]?.name;
                    }
                  }
                "
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
            <v-row class="mb-n8">
              <v-col>
                <h3 class="headline-3">3. {{ $t('angebot.urlOfTheAngebot') }}</h3>
              </v-col>
            </v-row>
            <FormRow
              class=""
              :error-label="urlProps['error']"
              :is-required="true"
              label-for-id="url-input"
              :label="$t('angebot.url')"
            >
              <div class="mb-sm-8"></div>
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

            <!-- 4. Logo des Angebots auf der Startseite der Anwender -->
            <v-row>
              <v-col>
                <h3 class="headline-3">4. {{ $t('angebot.logoOfTheAngebotInTheStartPage') }}</h3>
              </v-col>
            </v-row>
            <FormRow
              :error-label="logoProps['error']"
              :is-required="true"
              label-for-id="logo-input"
              :label="$t('angebot.logo')"
            >
              <!-- Hardcoding the Logo for now and outlining it. When migrating the Logos to this project there will be a dedicated component for logo selection -->
              <v-card
                class="d-flex align-center justify-center mb-5"
                width="80"
                height="80"
                outlined
              >
                <div class="logo-box selected">
                  <v-img
                    :src="logo || SchulPortalLogo"
                    max-height="48"
                    max-width="48"
                    contain
                  />
                </div>
              </v-card>
            </FormRow>

            <!-- 5. Kategorie des Angebots -->
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
                id="kategorie-select"
                :disabled="!hasAngeboteVerwaltenPermission"
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

            <!-- 6. Darf dieses Angebot Rollen zugewiesen werden? -->
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
                id="nachtraeglich-zuweisbar-select"
                :disabled="!hasAngeboteVerwaltenPermission"
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

            <!-- 7. Darf dieses Angebot für schulspezifische Rollenerweiterungen genutzt werden? -->
            <v-row>
              <v-col>
                <h3 class="headline-3">
                  7. {{ $t('angebot.canThisAngebotBeUsedForSchulspezifischeRollenerweiterungen') }}
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
                :disabled="!hasAngeboteVerwaltenPermission"
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

            <!-- 8. Ist zur Nutzung eine Zwei-Faktor-Authentifizierung erforderlich? -->
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
                id="requires2fa-select"
                :disabled="!hasAngeboteVerwaltenPermission"
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

      <!-- Result template on success after submit  -->
      <template v-if="serviceProviderStore.createdServiceProvider && !serviceProviderStore.errorCode">
        <SuccessTemplate
          v-if="showSuccess && serviceProviderStore.createdServiceProvider"
          :success="{
            message: $t('angebot.angebotAddedSuccessfully', { name: serviceProviderStore.createdServiceProvider.name }),
            followingDataChanged: $t('admin.followingDataCreated'),
            data: [
              { label: $t('angebot.providedBy'), value: selectedOrganisationName!, testId: 'success-organisation' },
              {
                label: $t('angebot.name'),
                value: serviceProviderStore.createdServiceProvider.name,
                testId: 'success-name',
              },
              {
                label: $t('angebot.url'),
                value: serviceProviderStore.createdServiceProvider.url,
                testId: 'success-url',
              },
              {
                label: $t('angebot.logo'),
                value: SchulPortalLogo,
                testId: 'success-logo',
                type: 'image',
              },
              {
                label: $t('angebot.kategorie'),
                value: $t(`angebot.kategorien.${serviceProviderStore.createdServiceProvider.kategorie}`),
                testId: 'success-kategorie',
              },
              {
                label: $t('angebot.canBeAssigned'),
                value: serviceProviderStore.createdServiceProvider.merkmale.includes(
                  ServiceProviderMerkmal.NachtraeglichZuweisbar,
                )
                  ? $t('yes')
                  : $t('no'),
                testId: 'success-nachtraeglich-zuweisbar',
              },
              {
                label: $t('angebot.canBeUsed'),
                value: serviceProviderStore.createdServiceProvider.merkmale.includes(
                  ServiceProviderMerkmal.VerfuegbarFuerRollenerweiterung,
                )
                  ? $t('yes')
                  : $t('no'),
                testId: 'success-verfuegbar-fuer-rollenerweiterung',
              },
              {
                label: $t('angebot.requires2FA'),
                value: serviceProviderStore.createdServiceProvider.requires2fa ? $t('yes') : $t('no'),
                testId: 'success-requires-2fa',
              },
            ],
          }"
          :show-to-service-provider-details-button="true"
          :to-service-provider-details-button-text="$t('angebot.toServiceProviderDetails')"
          :showBackButton="true"
          :showCreateAnotherButton="true"
          toServiceProviderDetailsButtonTestId="to-service-provider-details-button"
          @toServiceProviderDetails="navigateToServiceProviderDetails"
        />
      </template>
    </LayoutCard>
  </div>
</template>
<style scoped>
  .logo-box {
    width: 80px;
    height: 80px;
    border: 2px solid #ddd;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .logo-box.selected {
    border-color: #001e49;
    box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
  }
</style>
