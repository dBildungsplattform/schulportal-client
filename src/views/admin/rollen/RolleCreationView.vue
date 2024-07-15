<script setup lang="ts">
  import { ref, type Ref, onMounted, onUnmounted, computed, type ComputedRef } from 'vue';
  import {
    useOrganisationStore,
    type OrganisationStore,
    type Organisation,
    OrganisationsTyp,
  } from '@/stores/OrganisationStore';
  import {
    useRolleStore,
    type RolleStore,
    RollenMerkmal,
    RollenSystemRecht,
    RollenArt,
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
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import RolleForm from '@/components/form/RolleForm.vue';
  import { DIN_91379A_EXT } from '@/utils/validation';

  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();
  const rolleStore: RolleStore = useRolleStore();
  const organisationStore: OrganisationStore = useOrganisationStore();
  const serviceProviderStore: ServiceProviderStore = useServiceProviderStore();

  const { t }: Composer = useI18n({ useScope: 'global' });
  const router: Router = useRouter();

  type TranslatedRollenArt = { value: RollenArt; title: string };
  const translatedRollenarten: Ref<TranslatedRollenArt[]> = ref([]);

  type TranslatedMerkmal = { value: RollenMerkmal; title: string };
  const translatedMerkmale: Ref<TranslatedMerkmal[]> = ref([]);

  type TranslatedSystemrecht = { value: RollenSystemRecht; title: string };
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

  type RolleCreationFormType = {
    selectedAdministrationsebene: string;
    selectedRollenArt: RollenArt;
    selectedRollenName: string;
    selectedMerkmale: RollenMerkmal[];
    selectedServiceProviders: ServiceProvider[];
    selectedSystemRechte: RollenSystemRecht[];
  };

  // eslint-disable-next-line @typescript-eslint/typedef
  const { defineField, handleSubmit, isFieldDirty, resetForm } = useForm<RolleCreationFormType>({
    validationSchema,
  });

  const [selectedAdministrationsebene, selectedAdministrationsebeneProps]: [
    Ref<string>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineField('selectedAdministrationsebene', vuetifyConfig);

  const [selectedRollenArt, selectedRollenArtProps]: [
    Ref<RollenArt | null>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineField('selectedRollenArt', vuetifyConfig);

  const [selectedRollenName, selectedRollenNameProps]: [
    Ref<string>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineField('selectedRollenName', vuetifyConfig);

  const [selectedMerkmale, selectedMerkmaleProps]: [
    Ref<RollenMerkmal[] | null>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineField('selectedMerkmale', vuetifyConfig);

  const [selectedServiceProviders, selectedServiceProvidersProps]: [
    Ref<RollenMerkmal[] | null>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineField('selectedServiceProviders', vuetifyConfig);

  const [selectedSystemRechte, selectedSystemRechteProps]: [
    Ref<RollenSystemRecht[] | null>,
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

  function getSskName(sskDstNr: string | null | undefined, sskName: string | null | undefined): string {
    /* omit parens when there is no ssk kennung  */
    if (sskDstNr) {
      return `${sskDstNr} (${sskName})`;
    } else {
      return sskName || '';
    }
  }

  const translatedCreatedRolleMerkmale: ComputedRef<string> = computed(() => {
    if (!rolleStore.createdRolle?.merkmale || Array.from(rolleStore.createdRolle.merkmale).length === 0) {
      return '---';
    }

    return Array.from(rolleStore.createdRolle.merkmale)
      .map((merkmalKey: string) => {
        return t(`admin.rolle.mappingFrontBackEnd.merkmale.${merkmalKey}`);
      })
      .join(', ');
  });

  const translatedCreatedAngebote: ComputedRef<string> = computed(() => {
    if (
      !rolleStore.createdRolle?.serviceProviders ||
      Array.from(rolleStore.createdRolle.serviceProviders).length === 0
    ) {
      return '---';
    }

    return rolleStore.createdRolle.serviceProviders
      .map((serviceProvider: ServiceProvider) => {
        return serviceProvider.name;
      })
      .join(', ');
  });

  const translatedCreatedSystemrecht: ComputedRef<string> = computed(() => {
    if (!rolleStore.createdRolle?.systemrechte || Array.from(rolleStore.createdRolle.systemrechte).length === 0) {
      return '---';
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
      title: org.kennung ? `${org.kennung} (${org.name})` : org.name,
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
    await organisationStore.getAllOrganisationen({
      systemrechte: ['ROLLEN_VERWALTEN'],
      excludeTyp: [OrganisationsTyp.Klasse],
    });
    await serviceProviderStore.getAllServiceProviders();

    // Iterate over the enum values
    Object.values(RollenArt).forEach((enumValue: RollenArt) => {
      // Use the enum value to construct the i18n path
      const i18nPath: string = `admin.rolle.mappingFrontBackEnd.rollenarten.${enumValue}`;
      // Push the mapped object into the array
      translatedRollenarten.value.push({
        value: enumValue, // Keep the enum value for internal use
        title: t(i18nPath), // Get the localized title
      });
    });

    Object.values(RollenMerkmal).forEach((enumValue: RollenMerkmal) => {
      const i18nPath: string = `admin.rolle.mappingFrontBackEnd.merkmale.${enumValue}`;
      translatedMerkmale.value.push({
        value: enumValue,
        title: t(i18nPath),
      });
    });

    Object.values(RollenSystemRecht).forEach((enumValue: RollenSystemRecht) => {
      if (enumValue !== RollenSystemRecht.MigrationDurchfuehren) {
        const i18nPath: string = `admin.rolle.mappingFrontBackEnd.systemrechte.${enumValue}`;
        translatedSystemrechte.value.push({
          value: enumValue,
          title: t(i18nPath),
        });
      }
    });

    /* listen for browser changes and prevent them when form is dirty */
    window.addEventListener('beforeunload', preventNavigation);
  });

  onUnmounted(() => {
    window.removeEventListener('beforeunload', preventNavigation);
  });

  const onSubmit: (e?: Event | undefined) => Promise<Promise<void> | undefined> = handleSubmit(async () => {
    if (selectedRollenName.value && selectedAdministrationsebene.value && selectedRollenArt.value) {
      const merkmaleToSubmit: RollenMerkmal[] = selectedMerkmale.value?.map((m: RollenMerkmal) => m) || [];
      const systemrechteToSubmit: RollenSystemRecht[] =
        selectedSystemRechte.value?.map((m: RollenSystemRecht) => m) || [];
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
        :text="rolleStore.errorCode ? $t(`admin.rolle.errors.${rolleStore.errorCode}`) : ''"
        :showButton="true"
        :buttonText="$t('admin.rolle.backToCreateRolle')"
        :buttonAction="navigateBackToRolleForm"
      />

      <!-- The form to create a new Rolle -->
      <template v-if="!rolleStore.createdRolle && !rolleStore.errorCode">
        <RolleForm
          :administrationsebenen="administrationsebenen"
          :onHandleConfirmUnsavedChanges="handleConfirmUnsavedChanges"
          :onHandleDiscard="navigateToRolleManagement"
          :onShowDialogChange="(value: boolean) => (showUnsavedChangesDialog = value)"
          :onSubmit="onSubmit"
          :isEditActive="true"
          ref="rolle-creation-form"
          v-model:selectedAdministrationsebene="selectedAdministrationsebene"
          :selectedAdministrationsebeneProps="selectedAdministrationsebeneProps"
          v-model:selectedRollenArt="selectedRollenArt"
          :selectedRollenArtProps="selectedRollenArtProps"
          v-model:selectedRollenName="selectedRollenName"
          :selectedRollenNameProps="selectedRollenNameProps"
          v-model:selectedMerkmale="selectedMerkmale"
          :selectedMerkmaleProps="selectedMerkmaleProps"
          v-model:selectedServiceProviders="selectedServiceProviders"
          :selectedServiceProvidersProps="selectedServiceProvidersProps"
          v-model:selectedSystemRechte="selectedSystemRechte"
          :selectedSystemRechteProps="selectedSystemRechteProps"
          :serviceProviders="serviceProviders"
          :showUnsavedChangesDialog="showUnsavedChangesDialog"
          :translatedRollenarten="translatedRollenarten"
          :translatedMerkmale="translatedMerkmale"
          :translatedSystemrechte="translatedSystemrechte"
        ></RolleForm>
      </template>

      <!-- Result template on success after submit  -->
      <template v-if="rolleStore.createdRolle && !rolleStore.errorCode">
        <v-container>
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
              <span data-testid="created-rolle-administrationsebene">
                {{
                  getSskName(
                    organisationStore.currentOrganisation?.kennung,
                    organisationStore.currentOrganisation?.name,
                  )
                }}
              </span>
            </v-col>
          </v-row>
          <v-row>
            <v-col class="text-body bold text-right"> {{ $t('admin.rolle.rollenart') }}: </v-col>
            <v-col class="text-body">
              <span data-testid="created-rolle-rollenart">
                {{ $t(`admin.rolle.mappingFrontBackEnd.rollenarten.${rolleStore.createdRolle.rollenart}`) }}
              </span>
            </v-col>
          </v-row>
          <v-row>
            <v-col class="text-body bold text-right"> {{ $t('admin.rolle.rollenname') }}:</v-col>
            <v-col class="text-body"
              ><span data-testid="created-rolle-name">{{ rolleStore.createdRolle.name }}</span></v-col
            >
          </v-row>
          <v-row>
            <v-col class="text-body bold text-right"> {{ $t('admin.rolle.merkmale') }}:</v-col>
            <v-col class="text-body"
              ><span data-testid="created-rolle-merkmale">{{ translatedCreatedRolleMerkmale }}</span></v-col
            ></v-row
          >
          <v-row>
            <v-col class="text-body bold text-right"> {{ $t('admin.serviceProvider.assignedServiceProvider') }}:</v-col>
            <v-col class="text-body">
              <span data-testid="created-rolle-angebote">{{ translatedCreatedAngebote }}</span>
            </v-col>
          </v-row>
          <v-row>
            <v-col class="text-body bold text-right"> {{ $t('admin.rolle.systemrechte') }}:</v-col>
            <v-col class="text-body"
              ><span data-testid="created-rolle-systemrecht">{{ translatedCreatedSystemrecht }}</span></v-col
            ></v-row
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
