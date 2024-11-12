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
    type RolleFormType,
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
  import { useForm, type FormContext, type TypedSchema } from 'vee-validate';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import RolleForm from '@/components/form/RolleForm.vue';
  import {
    getDirtyState,
    getRolleFieldDefinitions,
    getValidationSchema,
    type RolleFieldDefinitions,
  } from '@/utils/validationRolle';
  import SuccessTemplate from '@/components/admin/rollen/SuccessTemplate.vue';
  import { type TranslatedObject } from '@/types.d';

  const rolleStore: RolleStore = useRolleStore();
  const organisationStore: OrganisationStore = useOrganisationStore();
  const serviceProviderStore: ServiceProviderStore = useServiceProviderStore();

  const { t }: Composer = useI18n({ useScope: 'global' });
  const router: Router = useRouter();
  const validationSchema: TypedSchema = getValidationSchema(t);

  type TranslatedRollenArt = { value: RollenArt; title: string };
  const translatedRollenarten: Ref<TranslatedRollenArt[]> = ref([]);

  type TranslatedMerkmal = { value: RollenMerkmal; title: string };
  const translatedMerkmale: Ref<TranslatedMerkmal[]> = ref([]);

  type TranslatedSystemrecht = { value: RollenSystemRecht; title: string };
  const translatedSystemrechte: Ref<TranslatedSystemrecht[]> = ref([]);

  const formContext: FormContext<RolleFormType, RolleFormType> = useForm<RolleFormType>({ validationSchema });

  const {
    selectedAdministrationsebene,
    selectedAdministrationsebeneProps,
    selectedRollenArt,
    selectedRollenArtProps,
    selectedRollenName,
    selectedRollenNameProps,
    selectedMerkmale,
    selectedMerkmaleProps,
    selectedServiceProviders,
    selectedServiceProvidersProps,
    selectedSystemRechte,
    selectedSystemRechteProps,
  }: RolleFieldDefinitions = getRolleFieldDefinitions(formContext);

  const isFormDirty: ComputedRef<boolean> = computed(() => getDirtyState(formContext));

  const showUnsavedChangesDialog: Ref<boolean> = ref(false);
  let blockedNext: () => void = () => {};

  onBeforeRouteLeave((_to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
    if (isFormDirty.value) {
      showUnsavedChangesDialog.value = true;
      blockedNext = next;
    } else {
      next();
    }
    rolleStore.createdRolle = null;
  });

  const handleCreateAnotherRolle = (): void => {
    rolleStore.createdRolle = null;
    formContext.resetForm();
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

  const administrationsebenen: ComputedRef<TranslatedObject[]> = computed(() =>
    organisationStore.allOrganisationen.map((org: Organisation) => ({
      value: org.id,
      title: org.kennung ? `${org.kennung} (${org.name})` : org.name,
    })),
  );

  const serviceProviders: ComputedRef<TranslatedObject[]> = computed(() =>
    serviceProviderStore.allServiceProviders.map((provider: ServiceProvider) => ({
      value: provider.id,
      title: provider.name,
    })),
  );

  function preventNavigation(event: BeforeUnloadEvent): void {
    if (!isFormDirty.value) return;
    event.preventDefault();
    /* Chrome requires returnValue to be set. */
    event.returnValue = '';
  }

  onMounted(async () => {
    rolleStore.createdRolle = null;
    await organisationStore.getAllOrganisationen({
      systemrechte: ['ROLLEN_VERWALTEN'],
      excludeTyp: [OrganisationsTyp.Klasse],
      limit: 25,
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

  const onSubmit: (e?: Event | undefined) => Promise<Promise<void> | undefined> = formContext.handleSubmit(async () => {
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
          if (selectedServiceProviders.value && selectedServiceProviders.value.length > 0) {
            await rolleStore.updateServiceProviderInRolle(rolleResponse.id, {
              serviceProviderIds: selectedServiceProviders.value,
              version: rolleStore.currentRolle?.version || 1,
            });
          }
        });
      formContext.resetForm();

      if (rolleStore.createdRolle) {
        await organisationStore.getOrganisationById(
          rolleStore.createdRolle.administeredBySchulstrukturknoten,
          OrganisationsTyp.Schule,
        );
      }
    }
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
          :onShowDialogChange="(value?: boolean) => (showUnsavedChangesDialog = value || false)"
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
        <SuccessTemplate
          :successMessage="$t('admin.rolle.rolleAddedSuccessfully')"
          :followingRolleDataCreated="$t('admin.followingDataCreated')"
          :createdRolleData="[
            {
              label: $t('admin.administrationsebene.administrationsebene'),
              value: getSskName(
                organisationStore.currentOrganisation?.kennung,
                organisationStore.currentOrganisation?.name,
              ),
              testId: 'created-rolle-administrationsebene',
            },
            {
              label: $t('admin.rolle.rollenart'),
              value: $t(`admin.rolle.mappingFrontBackEnd.rollenarten.${rolleStore.createdRolle.rollenart}`),
              testId: 'created-rolle-rollenart',
            },
            { label: $t('admin.rolle.rollenname'), value: rolleStore.createdRolle.name, testId: 'created-rolle-name' },
            {
              label: $t('admin.rolle.merkmale'),
              value: translatedCreatedRolleMerkmale,
              testId: 'created-rolle-merkmale',
            },
            {
              label: $t('admin.serviceProvider.assignedServiceProvider'),
              value: translatedCreatedAngebote,
              testId: 'created-rolle-angebote',
            },
            {
              label: $t('admin.rolle.systemrechte'),
              value: translatedCreatedSystemrecht,
              testId: 'created-rolle-systemrecht',
            },
          ]"
          :backButtonText="$t('nav.backToList')"
          :createAnotherRolleButtonText="$t('admin.rolle.createAnother')"
          :showCreateAnotherRolleButton="true"
          backButtonTestId="back-to-list-button"
          createAnotherButtonTestId="create-another-rolle-button"
          @OnNavigateBackToRolleManagement="navigateToRolleManagement"
          @OnCreateAnotherRolle="handleCreateAnotherRolle"
        />
      </template>
    </LayoutCard>
  </div>
</template>

<style></style>
