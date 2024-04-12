<script setup lang="ts">
  import { ref, type Ref, onMounted, onUnmounted, computed, type ComputedRef } from 'vue';
  import { useOrganisationStore, type OrganisationStore, type Organisation } from '@/stores/OrganisationStore';
  import {
    useRolleStore,
    type RolleStore,
    RolleResponseMerkmaleEnum,
    RolleResponseRollenartEnum,
    RolleResponseSystemrechteEnum,
    CreateRolleBodyParamsRollenartEnum,
    CreateRolleBodyParamsMerkmaleEnum,
    type CreateRolleBodyParamsSystemrechteEnum,
    type RolleResponse,
  } from '@/stores/RolleStore';
  import {
    useServiceProviderStore,
    type ServiceProvider,
    type ServiceProviderStore,
  } from '@/stores/ServiceProviderStore';
  import { useI18n, type Composer } from 'vue-i18n';
  import SpshAlert from '@/components/alert/SpshAlert.vue';
  import {
    onBeforeRouteLeave,
    type Router,
    useRouter,
    type NavigationGuardNext,
    type RouteLocationNormalized,
  } from 'vue-router';
  import { useDisplay } from 'vuetify';
  import { type BaseFieldProps, type TypedSchema, useForm } from 'vee-validate';
  import { object, string } from 'yup';
  import { toTypedSchema } from '@vee-validate/yup';
  import FormWrapper from '@/components/form/FormWrapper.vue';
  import FormRow from '@/components/form/FormRow.vue';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import { DIN_91379A_EXT } from '@/utils/validation';

  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();
  const rolleStore: RolleStore = useRolleStore();
  const organisationStore: OrganisationStore = useOrganisationStore();
  const serviceProviderStore: ServiceProviderStore = useServiceProviderStore();

  const { t }: Composer = useI18n({ useScope: 'global' });
  const router: Router = useRouter();

  type TranslatedRollenArt = { value: RolleResponseRollenartEnum; title: string };
  const translatedRollenarten: Ref<TranslatedRollenArt[]> = ref([]);

  type TranslatedMerkmal = { value: RolleResponseMerkmaleEnum; title: string };
  const translatedMerkmale: Ref<TranslatedMerkmal[]> = ref([]);

  type TranslatedSystemrecht = { value: RolleResponseSystemrechteEnum; title: string };
  const translatedSystemrechte: Ref<TranslatedSystemrecht[]> = ref([]);

  const validationSchema: TypedSchema = toTypedSchema(
    object({
      selectedRollenArt: string().required(t('admin.rolle.rules.rollenart.required')),
      selectedRollenName: string()
        .max(200, t('admin.rolle.rules.rollenname.length'))
        .matches(DIN_91379A_EXT, t('admin.rolle.rules.rollenname.matches'))
        .required(t('admin.rolle.rules.rollenname.required')),
      selectedAdministrationsebene: string().required(t('admin.administrationsebene.rules.required')),
    }),
  );

  const vuetifyConfig = (state: {
    errors: Array<string>;
  }): { props: { error: boolean; 'error-messages': Array<string> } } => ({
    props: {
      error: !!state.errors.length,
      'error-messages': state.errors,
    },
  });

  type RolleCreationForm = {
    selectedAdministrationsebene: string;
    selectedRollenArt: CreateRolleBodyParamsRollenartEnum;
    selectedRollenName: string;
    selectedMerkmale: CreateRolleBodyParamsMerkmaleEnum[];
    selectedServiceProviders: ServiceProvider[];
    selectedSystemRechte: CreateRolleBodyParamsSystemrechteEnum[];
  };

  // eslint-disable-next-line @typescript-eslint/typedef
  const { defineField, handleSubmit, isFieldDirty, resetForm } = useForm<RolleCreationForm>({
    validationSchema,
  });

  const [selectedAdministrationsebene, selectedAdministrationsebeneProps]: [
    Ref<string>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineField('selectedAdministrationsebene', vuetifyConfig);

  const [selectedRollenArt, selectedRollenArtProps]: [
    Ref<CreateRolleBodyParamsRollenartEnum | null>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineField('selectedRollenArt', vuetifyConfig);

  const [selectedRollenName, selectedRollenNameProps]: [
    Ref<string>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineField('selectedRollenName', vuetifyConfig);

  const [selectedMerkmale, selectedMerkmaleProps]: [
    Ref<CreateRolleBodyParamsMerkmaleEnum[] | null>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineField('selectedMerkmale', vuetifyConfig);

  const [selectedServiceProviders, selectedServiceProvidersProps]: [
    Ref<CreateRolleBodyParamsMerkmaleEnum[] | null>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineField('selectedServiceProviders', vuetifyConfig);

  const [selectedSystemRechte, selectedSystemRechteProps]: [
    Ref<CreateRolleBodyParamsSystemrechteEnum[] | null>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineField('selectedSystemRechte', vuetifyConfig);

  function isFormDirty(): boolean {
    return (
      isFieldDirty('selectedAdministrationsebene') ||
      isFieldDirty('selectedRollenArt') ||
      isFieldDirty('selectedRollenName') ||
      isFieldDirty('selectedMerkmale') ||
      isFieldDirty('selectedSystemRechte')
    );
  }

  const showUnsavedChangesDialog: Ref<boolean> = ref(false);
  let blockedNext: () => void = () => {};

  onBeforeRouteLeave((_to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
    if (isFormDirty()) {
      showUnsavedChangesDialog.value = true;
      blockedNext = next;
    } else {
      next();
    }
  });

  const handleCreateAnotherRolle = (): void => {
    rolleStore.createdRolle = null;
    resetForm();
    router.push({ name: 'create-rolle' });
  };

  function handleConfirmUnsavedChanges(): void {
    blockedNext();
  }

  async function navigateBackToRolleForm(): Promise<void> {
    await router.push({ name: 'create-rolle' });
    rolleStore.errorCode = '';
  }

  async function navigateToRolleManagement(): Promise<void> {
    await router.push({ name: 'rolle-management' });
    rolleStore.createdRolle = null;
  }

  const translatedCreatedRolleMerkmale: ComputedRef<string> = computed(() => {
    if (!rolleStore.createdRolle?.merkmale || Array.from(rolleStore.createdRolle.merkmale).length === 0) {
      return '-';
    }

    return Array.from(rolleStore.createdRolle.merkmale)
      .map((merkmalKey: string) => {
        return t(`admin.rolle.mappingFrontBackEnd.merkmale.${merkmalKey}`);
      })
      .join(', ');
  });

  const translatedCreatedSystemrecht: ComputedRef<string> = computed(() => {
    if (!rolleStore.createdRolle?.systemrechte || Array.from(rolleStore.createdRolle.systemrechte).length === 0) {
      return '-';
    }

    return Array.from(rolleStore.createdRolle.systemrechte)
      .map((systemrechtKey: string) => {
        return t(`admin.rolle.mappingFrontBackEnd.systemrechte.${systemrechtKey}`);
      })
      .join(', ');
  });

  const administrationsebenen: ComputedRef<
    {
      value: string;
      title: string;
    }[]
  > = computed(() =>
    organisationStore.allOrganisationen.map((org: Organisation) => ({
      value: org.id,
      title: `${org.kennung ?? ''} (${org.name})`,
    })),
  );

  const serviceProviders: ComputedRef<
    {
      value: string;
      title: string;
    }[]
  > = computed(() =>
    serviceProviderStore.allServiceProviders.map((provider: ServiceProvider) => ({
      value: provider.id,
      title: provider.name,
    })),
  );

  function preventNavigation(event: BeforeUnloadEvent): void {
    if (!isFormDirty()) return;
    event.preventDefault();
    /* Chrome requires returnValue to be set. */
    event.returnValue = '';
  }

  onMounted(async () => {
    rolleStore.createdRolle = null;
    await organisationStore.getAllOrganisationen();
    await serviceProviderStore.getAllServiceProviders();

    // Iterate over the enum values
    Object.values(RolleResponseRollenartEnum).forEach((enumValue: RolleResponseRollenartEnum) => {
      // Use the enum value to construct the i18n path
      const i18nPath: string = `admin.rolle.mappingFrontBackEnd.rollenarten.${enumValue}`;
      // Push the mapped object into the array
      translatedRollenarten.value.push({
        value: enumValue, // Keep the enum value for internal use
        title: t(i18nPath), // Get the localized title
      });
    });

    Object.values(RolleResponseMerkmaleEnum).forEach((enumValue: RolleResponseMerkmaleEnum) => {
      const i18nPath: string = `admin.rolle.mappingFrontBackEnd.merkmale.${enumValue}`;
      translatedMerkmale.value.push({
        value: enumValue,
        title: t(i18nPath),
      });
    });

    Object.values(RolleResponseSystemrechteEnum).forEach((enumValue: RolleResponseSystemrechteEnum) => {
      const i18nPath: string = `admin.rolle.mappingFrontBackEnd.systemrechte.${enumValue}`;
      translatedSystemrechte.value.push({
        value: enumValue,
        title: t(i18nPath),
      });
    });

    /* listen for browser changes and prevent them when form is dirty */
    window.addEventListener('beforeunload', preventNavigation);
  });

  onUnmounted(() => {
    window.removeEventListener('beforeunload', preventNavigation);
  });

  const onSubmit: (e?: Event | undefined) => Promise<Promise<void> | undefined> = handleSubmit(async () => {
    if (selectedRollenName.value && selectedAdministrationsebene.value && selectedRollenArt.value) {
      const merkmaleToSubmit: CreateRolleBodyParamsMerkmaleEnum[] =
        selectedMerkmale.value?.map((m: CreateRolleBodyParamsMerkmaleEnum) => m) || [];
      const systemrechteToSubmit: CreateRolleBodyParamsSystemrechteEnum[] =
        selectedSystemRechte.value?.map((m: CreateRolleBodyParamsSystemrechteEnum) => m) || [];
      await rolleStore
        .createRolle(
          selectedRollenName.value,
          selectedAdministrationsebene.value,
          selectedRollenArt.value,
          merkmaleToSubmit,
          systemrechteToSubmit,
        )
        .then(async (rolleResponse: RolleResponse) => {
          if (selectedServiceProviders.value) {
            selectedServiceProviders.value.forEach(async (serviceProviderId: string) => {
              await rolleStore.addServiceProviderToRolle(rolleResponse.id, {
                serviceProviderId,
              });
            });
          }
        });
      resetForm();

      if (rolleStore.createdRolle) {
        await organisationStore.getOrganisationById(rolleStore.createdRolle.administeredBySchulstrukturknoten);
      }
    }
  });
</script>

<template>
  <div class="admin">
    <LayoutCard
      :closable="true"
      @onCloseClicked="navigateToRolleManagement"
      :header="$t('admin.rolle.addNew')"
      :padded="true"
      :showCloseText="true"
    >
      <!-- Error Message Display if error on submit -->
      <SpshAlert
        :model-value="!!rolleStore.errorCode"
        :title="t('admin.rolle.rolleCreateErrorTitle')"
        :type="'error'"
        :closable="false"
        :text="$t('admin.rolle.rolleCreateErrorText')"
        :showButton="true"
        :buttonText="$t('admin.rolle.backToCreateRolle')"
        :buttonAction="navigateBackToRolleForm"
      />

      <!-- The form to create a new Rolle -->
      <template v-if="!rolleStore.createdRolle && !rolleStore.errorCode">
        <FormWrapper
          :confirmUnsavedChangesAction="handleConfirmUnsavedChanges"
          :createButtonLabel="$t('admin.rolle.create')"
          :discardButtonLabel="$t('admin.rolle.discard')"
          id="rolle-creation-form"
          :onDiscard="navigateToRolleManagement"
          @onShowDialogChange="(value: boolean) => (showUnsavedChangesDialog = value)"
          :onSubmit="onSubmit"
          :showUnsavedChangesDialog="showUnsavedChangesDialog"
        >
          <!-- 1. Administrationsebene zuordnen -->
          <v-row>
            <h3 class="headline-3">1. {{ $t('admin.administrationsebene.assignAdministrationsebene') }}</h3>
          </v-row>
          <FormRow
            :errorLabel="selectedAdministrationsebeneProps['error']"
            labelForId="administrationsebene-select"
            :isRequired="true"
            :label="$t('admin.administrationsebene.administrationsebene')"
          >
            <v-select
              clearable
              data-testid="administrationsebene-select"
              density="compact"
              id="administrationsebene-select"
              :items="administrationsebenen"
              item-value="value"
              item-text="title"
              :placeholder="$t('admin.administrationsebene.assignAdministrationsebene')"
              required="true"
              variant="outlined"
              v-bind="selectedAdministrationsebeneProps"
              v-model="selectedAdministrationsebene"
              :no-data-text="$t('noDataFound')"
            ></v-select>
          </FormRow>

          <!-- 2. Rollenart zuordnen -->
          <v-row>
            <h3 class="headline-3">2. {{ $t('admin.rolle.assignRollenart') }}</h3>
          </v-row>
          <FormRow
            :errorLabel="selectedRollenArtProps['error']"
            labelForId="rollenart-select"
            :isRequired="true"
            :label="$t('admin.rolle.rollenart')"
          >
            <v-select
              clearable
              data-testid="rollenart-select"
              density="compact"
              id="rollenart-select"
              :items="translatedRollenarten"
              item-value="value"
              item-text="title"
              :placeholder="$t('admin.rolle.selectRollenart')"
              required="true"
              variant="outlined"
              v-bind="selectedRollenArtProps"
              v-model="selectedRollenArt"
              :no-data-text="$t('noDataFound')"
            ></v-select>
          </FormRow>

          <template v-if="selectedRollenArt && selectedAdministrationsebene">
            <!-- 3. Rollenname eingeben -->
            <v-row>
              <h3 class="headline-3">3. {{ $t('admin.rolle.enterRollenname') }}</h3>
            </v-row>
            <FormRow
              :errorLabel="selectedRollenNameProps['error']"
              labelForId="rollenname-input"
              :isRequired="true"
              :label="$t('admin.rolle.rollenname')"
            >
              <v-text-field
                clearable
                data-testid="rollenname-input"
                density="compact"
                id="rollenname-input"
                :placeholder="$t('admin.rolle.enterRollenname')"
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
              :errorLabel="selectedMerkmaleProps['error']"
              labelForId="merkmale-select"
              :label="$t('admin.rolle.merkmale')"
            >
              <v-select
                chips
                clearable
                data-testid="merkmale-select"
                density="compact"
                id="merkmale-select"
                :items="translatedMerkmale"
                item-value="value"
                item-text="title"
                multiple
                :placeholder="$t('admin.rolle.selectMerkmale')"
                variant="outlined"
                v-bind="selectedMerkmaleProps"
                v-model="selectedMerkmale"
                :no-data-text="$t('noDataFound')"
              ></v-select>
            </FormRow>

            <!-- 5. Angebote zuordnen -->
            <v-row>
              <h3 class="headline-3">5. {{ $t('admin.serviceProvider.assignServiceProvider') }}</h3>
            </v-row>
            <FormRow
              :errorLabel="selectedServiceProvidersProps['error']"
              labelForId="service-provider-select"
              :label="$t('admin.serviceProvider.serviceProvider')"
            >
              <v-autocomplete
                autocomplete="off"
                chips
                clearable
                data-testid="service-provider-select"
                density="compact"
                id="service-provider-select"
                :items="serviceProviders"
                item-value="value"
                item-text="title"
                multiple
                :no-data-text="$t('noDataFound')"
                :placeholder="$t('admin.serviceProvider.selectServiceProvider')"
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
              v-for="systemrecht in translatedSystemrechte"
              :key="systemrecht.value"
              :errorLabel="selectedSystemRechteProps['error']"
              labelForId="systemrecht-select"
              :label="systemrecht.title"
            >
              <v-checkbox
                :value="systemrecht.value"
                v-model="selectedSystemRechte"
                :id="`systemrecht-${systemrecht.value}`"
                multiple
              ></v-checkbox>
            </FormRow>
          </template>
        </FormWrapper>
      </template>

      <!-- Result template on success after submit  -->
      <template v-if="rolleStore.createdRolle && !rolleStore.errorCode">
        <v-container class="new-rolle-success">
          <v-row justify="center">
            <v-col
              class="subtitle-1"
              cols="auto"
            >
              <span data-testid="rolle-success-text">{{ $t('admin.rolle.rolleAddedSuccessfully') }}</span>
            </v-col>
          </v-row>
          <v-row justify="center">
            <v-col cols="auto">
              <v-icon
                small
                color="#1EAE9C"
                icon="mdi-check-circle"
              >
              </v-icon>
            </v-col>
          </v-row>
          <v-row justify="center">
            <v-col
              class="subtitle-2"
              cols="auto"
            >
              {{ $t('admin.followingDataCreated') }}
            </v-col>
          </v-row>
          <v-row>
            <v-col class="text-body bold text-right">
              {{ $t('admin.administrationsebene.administrationsebene') }}:
            </v-col>
            <v-col class="text-body">
              {{
                `${organisationStore.currentOrganisation?.kennung} (${organisationStore.currentOrganisation?.name})`
              }}</v-col
            >
          </v-row>
          <v-row>
            <v-col class="text-body bold text-right"> {{ $t('admin.rolle.rollenart') }}: </v-col>
            <v-col class="text-body">
              {{ $t(`admin.rolle.mappingFrontBackEnd.rollenarten.${rolleStore.createdRolle.rollenart}`) }}</v-col
            >
          </v-row>
          <v-row>
            <v-col class="text-body bold text-right"> {{ $t('admin.rolle.rollenname') }}:</v-col>
            <v-col class="text-body">{{ rolleStore.createdRolle.name }} </v-col>
          </v-row>
          <v-row>
            <v-col class="text-body bold text-right"> {{ $t('admin.rolle.merkmale') }}:</v-col>
            <v-col class="text-body"> {{ translatedCreatedRolleMerkmale }}</v-col></v-row
          >
          <v-row>
            <v-col class="text-body bold text-right"> {{ $t('admin.rolle.systemrechte') }}:</v-col>
            <v-col class="text-body"> {{ translatedCreatedSystemrecht }}</v-col></v-row
          >
          <v-divider
            class="border-opacity-100 rounded my-6"
            color="#E5EAEF"
            thickness="6"
          ></v-divider>
          <v-row justify="end">
            <v-col
              cols="12"
              sm="6"
              md="auto"
            >
              <v-btn
                class="secondary"
                data-testid="back-to-list-button"
                :block="mdAndDown"
                @click="navigateToRolleManagement"
                >{{ $t('nav.backToList') }}</v-btn
              >
            </v-col>
            <v-col
              cols="12"
              sm="6"
              md="auto"
            >
              <v-btn
                class="primary button"
                data-testid="create-another-rolle-button"
                @click="handleCreateAnotherRolle"
                :block="mdAndDown"
              >
                {{ $t('admin.rolle.createAnother') }}
              </v-btn>
            </v-col>
          </v-row>
        </v-container>
      </template>
    </LayoutCard>
  </div>
</template>

<style></style>
