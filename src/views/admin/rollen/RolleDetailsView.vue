<script setup lang="ts">
  import {
    type RolleStore,
    useRolleStore,
    RollenMerkmal,
    RollenSystemRecht,
    type RolleFormType,
  } from '@/stores/RolleStore';
  import { OrganisationsTyp, useOrganisationStore, type OrganisationStore } from '@/stores/OrganisationStore';
  import {
    useServiceProviderStore,
    type ServiceProvider,
    type ServiceProviderStore,
    type ServiceProviderIdNameResponse,
  } from '@/stores/ServiceProviderStore';
  import { computed, onBeforeMount, onUnmounted, ref, type ComputedRef, type Ref } from 'vue';
  import {
    type Router,
    useRouter,
    type RouteLocationNormalizedLoaded,
    useRoute,
    onBeforeRouteLeave,
    type RouteLocationNormalized,
    type NavigationGuardNext,
  } from 'vue-router';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import SpshAlert from '@/components/alert/SpshAlert.vue';
  import RolleForm from '@/components/form/RolleForm.vue';
  import { type Composer, useI18n } from 'vue-i18n';
  import { useDisplay } from 'vuetify';
  import { useForm, type FormContext, type TypedSchema } from 'vee-validate';
  import {
    getDirtyState,
    getRolleFieldDefinitions,
    getValidationSchema,
    type RolleFieldDefinitions,
  } from '@/utils/validationRolle';
  import RolleDelete from '@/components/admin/rollen/RolleDelete.vue';
  import { type TranslatedObject } from '@/types.d';
  import SuccessTemplate from '@/components/admin/rollen/SuccessTemplate.vue';
  import { isHiddenSystemrecht } from '@/utils/systemrechte';

  const route: RouteLocationNormalizedLoaded = useRoute();
  const router: Router = useRouter();
  const { t }: Composer = useI18n({ useScope: 'global' });
  const validationSchema: TypedSchema = getValidationSchema(t);

  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();

  const rolleStore: RolleStore = useRolleStore();
  const organisationStore: OrganisationStore = useOrganisationStore();
  const serviceProviderStore: ServiceProviderStore = useServiceProviderStore();

  const currentRolleId: string = route.params['id'] as string;
  const isEditActive: Ref<boolean> = ref(false);

  const creationErrorText: Ref<string> = ref('');
  const creationErrorTitle: Ref<string> = ref('');

  type TranslatedMerkmal = { value: RollenMerkmal; title: string };
  const allMerkmale: Ref<TranslatedMerkmal[]> = ref([]);

  type TranslatedSystemrecht = { value: RollenSystemRecht; title: string };
  const allSystemrechte: Ref<TranslatedSystemrecht[]> = ref([]);

  const showUnsavedChangesDialog: Ref<boolean> = ref(false);

  const translatedOrgName: ComputedRef<string | undefined> = computed(() => {
    return organisationStore.currentOrganisation?.kennung
      ? `${organisationStore.currentOrganisation.kennung} (${organisationStore.currentOrganisation.name})`
      : organisationStore.currentOrganisation?.name;
  });

  const translatedRollenart: ComputedRef<string> = computed(() => {
    return t(`admin.rolle.mappingFrontBackEnd.rollenarten.${rolleStore.currentRolle?.rollenart}`);
  });

  const translatedProviderNames: ComputedRef<TranslatedObject[]> = computed(() => {
    const serviceProviders: Array<ServiceProvider> = Array.from(rolleStore.currentRolle?.serviceProviders || []);
    return serviceProviders.map((provider: ServiceProvider) => ({
      value: provider.id,
      title: provider.name,
    }));
  });

  const translatedMerkmale: ComputedRef<TranslatedObject[]> = computed(() => {
    const merkmale: Array<RollenMerkmal> = Array.from(rolleStore.currentRolle?.merkmale || []);
    return merkmale.map((merkmalKey: RollenMerkmal) => ({
      value: merkmalKey,
      title: t(`admin.rolle.mappingFrontBackEnd.merkmale.${merkmalKey}`),
    }));
  });

  const translatedSystemrechte: ComputedRef<TranslatedObject[]> = computed(() => {
    const systemrechte: Array<RollenSystemRecht> = Array.from(rolleStore.currentRolle?.systemrechte || []);
    return systemrechte.map((systemrechtKey: RollenSystemRecht) => ({
      value: systemrechtKey,
      title: t(`admin.rolle.mappingFrontBackEnd.systemrechte.${systemrechtKey}`),
    }));
  });

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

  const isFormDirty: ComputedRef<boolean> = computed(() => (isEditActive.value ? getDirtyState(formContext) : false));

  let blockedNext: () => void = () => {};

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

  function handleConfirmUnsavedChanges(): void {
    isEditActive.value = false;
    showUnsavedChangesDialog.value = false;
    blockedNext();
    rolleStore.errorCode = '';
  }

  const onSubmit: (e?: Event | undefined) => Promise<Promise<void> | undefined> = formContext.handleSubmit(async () => {
    if (selectedRollenName.value && selectedAdministrationsebene.value && selectedRollenArt.value) {
      if (rolleStore.currentRolle) {
        try {
          await rolleStore.updateRolle(
            rolleStore.currentRolle.id,
            selectedRollenName.value,
            selectedMerkmale.value || [],
            selectedSystemRechte.value || [],
            selectedServiceProviders.value || [],
            rolleStore.currentRolle.version,
          );
        } catch {
          creationErrorText.value = t(`admin.rolle.errors.${rolleStore.errorCode}`);
          creationErrorTitle.value = t(`admin.rolle.title.${rolleStore.errorCode}`);
        }
      }
      formContext.resetForm();
    }
  });

  const translatedUpdatedRolleMerkmale: ComputedRef<string> = computed(() => {
    if (!rolleStore.updatedRolle?.merkmale || Array.from(rolleStore.updatedRolle.merkmale).length === 0) {
      return '---';
    }

    return Array.from(rolleStore.updatedRolle.merkmale)
      .map((merkmalKey: string) => {
        return t(`admin.rolle.mappingFrontBackEnd.merkmale.${merkmalKey}`);
      })
      .join(', ');
  });

  const translatedUpdatedAngebote: ComputedRef<string> = computed(() => {
    if (
      !rolleStore.updatedRolle?.serviceProviders ||
      Array.from(rolleStore.updatedRolle.serviceProviders).length === 0
    ) {
      return '---';
    }

    return rolleStore.updatedRolle.serviceProviders
      .map((serviceProvider: ServiceProviderIdNameResponse) => {
        return serviceProvider.name;
      })
      .join(', ');
  });

  const translatedUpdatedSystemrecht: ComputedRef<string> = computed(() => {
    if (!rolleStore.updatedRolle?.systemrechte || Array.from(rolleStore.updatedRolle.systemrechte).length === 0) {
      return '---';
    }

    return Array.from(rolleStore.updatedRolle.systemrechte)
      .map((systemrechtKey: string) => {
        return t(`admin.rolle.mappingFrontBackEnd.systemrechte.${systemrechtKey}`);
      })
      .join(', ');
  });

  function activateEditing(): void {
    isEditActive.value = true;
  }

  function cancelEdit(): void {
    isEditActive.value = false;
  }

  function handleCancel(next: NavigationGuardNext): void {
    if (isFormDirty.value) {
      showUnsavedChangesDialog.value = true;
      blockedNext = next;
    } else {
      cancelEdit();
    }
  }

  async function deleteRolle(rolleId: string): Promise<void> {
    await rolleStore.deleteRolleById(rolleId);
  }

  function preventNavigation(event: BeforeUnloadEvent): void {
    if (!isFormDirty.value) return;
    event.preventDefault();
    /* Chrome requires returnValue to be set. */
    event.returnValue = '';
  }

  function navigateToRolleTable(): void {
    rolleStore.updatedRolle = null;
    router.push({ name: 'rolle-management' });
  }

  const handleAlertClose = (): void => {
    rolleStore.errorCode = '';
    navigateToRolleTable();
  };

  onBeforeMount(async () => {
    rolleStore.errorCode = '';
    await rolleStore.getRolleById(currentRolleId);
    await organisationStore.getOrganisationById(
      rolleStore.currentRolle?.administeredBySchulstrukturknoten || '',
      OrganisationsTyp.Schule,
    );
    await serviceProviderStore.getAllServiceProviders();

    Object.values(RollenMerkmal).forEach((enumValue: RollenMerkmal) => {
      const i18nPath: string = `admin.rolle.mappingFrontBackEnd.merkmale.${enumValue}`;
      allMerkmale.value.push({
        value: enumValue,
        title: t(i18nPath),
      });
    });

    Object.values(RollenSystemRecht).forEach((enumValue: RollenSystemRecht) => {
      if (!isHiddenSystemrecht(enumValue)) {
        const i18nPath: string = `admin.rolle.mappingFrontBackEnd.systemrechte.${enumValue}`;
        allSystemrechte.value.push({
          value: enumValue,
          title: t(i18nPath),
        });
      }
    });

    // Set the initial values using the computed properties
    formContext.setFieldValue('selectedAdministrationsebene', translatedOrgName.value);
    formContext.setFieldValue('selectedRollenArt', translatedRollenart.value);
    formContext.setFieldValue('selectedRollenName', rolleStore.currentRolle?.name);
    formContext.setFieldValue(
      'selectedMerkmale',
      translatedMerkmale.value.map((obj: TranslatedObject) => obj.value),
    );
    formContext.setFieldValue(
      'selectedServiceProviders',
      translatedProviderNames.value.map((obj: TranslatedObject) => obj.value),
    );
    formContext.setFieldValue(
      'selectedSystemRechte',
      translatedSystemrechte.value.map((obj: TranslatedObject) => obj.value),
    );

    /* listen for browser changes and prevent them when form is dirty */
    window.addEventListener('beforeunload', preventNavigation);
  });

  const alertButtonText: ComputedRef<string> = computed(() => {
    return rolleStore.errorCode === 'NEWER_VERSION_OF_ROLLE_AVAILABLE' ? t('refreshData') : t('nav.backToList');
  });

  const alertButtonAction: ComputedRef<() => void> = computed(() => {
    return rolleStore.errorCode === 'NEWER_VERSION_OF_ROLLE_AVAILABLE'
      ? (): void => router.go(0)
      : navigateToRolleTable;
  });

  onBeforeRouteLeave((_to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
    if (isFormDirty.value) {
      showUnsavedChangesDialog.value = true;
      blockedNext = next;
    } else {
      next();
    }
    rolleStore.createdRolle = null;
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
      data-testid="rolle-details-card"
      :header="$t('admin.rolle.edit')"
      @onCloseClicked="navigateToRolleTable"
      :padded="true"
      :showCloseText="true"
    >
      <template v-if="!rolleStore.updatedRolle">
        <v-container>
          <div v-if="rolleStore.currentRolle">
            <RolleForm
              :errorCode="rolleStore.errorCode"
              :onHandleConfirmUnsavedChanges="handleConfirmUnsavedChanges"
              :onHandleDiscard="navigateToRolleTable"
              :onShowDialogChange="(value?: boolean) => (showUnsavedChangesDialog = value || false)"
              :onSubmit="onSubmit"
              :isEditActive="isEditActive"
              :isLoading="rolleStore.loading"
              :readonly="true"
              ref="rolle-form"
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
              :translatedMerkmale="allMerkmale"
              :translatedSystemrechte="allSystemrechte"
              :showUnsavedChangesDialog="showUnsavedChangesDialog"
            >
              <!-- Error Message Display -->
              <SpshAlert
                :model-value="!!rolleStore.errorCode"
                :title="
                  organisationStore.errorCode === 'UNSPECIFIED_ERROR'
                    ? $t('admin.rolle.loadingErrorTitle')
                    : $t(`admin.rolle.title.${rolleStore.errorCode}`)
                "
                :type="'error'"
                :closable="false"
                :text="
                  rolleStore.errorCode === 'UNSPECIFIED_ERROR'
                    ? $t('admin.rolle.loadingErrorText')
                    : $t(`admin.rolle.errors.${rolleStore.errorCode}`)
                "
                :showButton="true"
                :buttonText="alertButtonText"
                :buttonAction="alertButtonAction"
                @update:modelValue="handleAlertClose"
              />
            </RolleForm>
            <v-divider
              v-if="isEditActive"
              class="border-opacity-100 rounded"
              color="#E5EAEF"
              thickness="5px"
            ></v-divider>
            <div
              v-if="!isEditActive"
              class="d-flex justify-sm-end"
            >
              <v-row class="pt-3 px-2 justify-end">
                <v-col
                  cols="12"
                  md="auto"
                  sm="6"
                >
                  <div class="d-flex justify-sm-end">
                    <RolleDelete
                      v-if="!rolleStore.errorCode"
                      :errorCode="rolleStore.errorCode"
                      :rolle="rolleStore.currentRolle"
                      :isLoading="rolleStore.loading"
                      @onDeleteRolle="deleteRolle(currentRolleId)"
                    >
                    </RolleDelete>
                  </div>
                </v-col>
                <v-col
                  cols="12"
                  sm="6"
                  md="auto"
                >
                  <v-btn
                    v-if="!rolleStore.errorCode"
                    class="primary"
                    data-testid="rolle-edit-button"
                    @Click="activateEditing"
                    :block="mdAndDown"
                  >
                    {{ $t('edit') }}
                  </v-btn>
                </v-col>
              </v-row>
            </div>
            <div
              v-else
              class="d-flex justify-end"
            >
              <v-row class="pt-3 px-2 save-cancel-row justify-end">
                <v-col
                  class="cancel-col"
                  cols="12"
                  sm="6"
                  md="auto"
                >
                  <v-btn
                    class="secondary"
                    data-testid="rolle-edit-cancel"
                    @click="handleCancel"
                    :block="mdAndDown"
                  >
                    {{ $t('cancel') }}
                  </v-btn>
                </v-col>
                <v-col
                  cols="12"
                  sm="6"
                  md="auto"
                >
                  <v-btn
                    class="primary"
                    data-testid="rolle-changes-save"
                    @Click="onSubmit"
                    :block="mdAndDown"
                    :disabled="rolleStore.loading"
                  >
                    {{ $t('save') }}
                  </v-btn>
                </v-col>
              </v-row>
            </div>
          </div>
          <div v-else-if="rolleStore.loading">
            <v-progress-circular indeterminate></v-progress-circular>
          </div>
        </v-container>
      </template>
      <!-- Result template on success after submit  -->
      <template v-if="rolleStore.updatedRolle && !rolleStore.errorCode">
        <SuccessTemplate
          :successMessage="$t('admin.rolle.rolleUpdatedSuccessfully')"
          :followingRolleDataCreated="$t('admin.followingDataCreated')"
          :createdRolleData="[
            { label: $t('admin.rolle.rollenname'), value: rolleStore.updatedRolle?.name, testId: 'updated-rolle-name' },
            {
              label: $t('admin.rolle.merkmale'),
              value: translatedUpdatedRolleMerkmale,
              testId: 'updated-rolle-merkmale',
            },
            {
              label: $t('admin.serviceProvider.assignedServiceProvider'),
              value: translatedUpdatedAngebote,
              testId: 'updated-rolle-angebote',
            },
            {
              label: $t('admin.rolle.systemrechte'),
              value: translatedUpdatedSystemrecht,
              testId: 'updated-rolle-systemrecht',
            },
          ]"
          :backButtonText="$t('nav.backToDetails')"
          :createAnotherRolleButtonText="$t('admin.rolle.createAnother')"
          :showCreateAnotherRolleButton="false"
          backButtonTestId="back-to-details-button"
          createAnotherButtonTestId="create-another-rolle-button"
          @OnNavigateBackToRolleManagement="router.go(0)"
        />
      </template>
    </LayoutCard>
  </div>
</template>

<style></style>
