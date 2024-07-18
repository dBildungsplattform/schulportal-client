<script setup lang="ts">
  import { type RolleStore, useRolleStore, RollenMerkmal, RollenSystemRecht, RollenArt } from '@/stores/RolleStore';
  import { useOrganisationStore, type OrganisationStore } from '@/stores/OrganisationStore';
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
  import { type BaseFieldProps, type TypedSchema, useForm } from 'vee-validate';
  import { getValidationSchema, getVuetifyConfig } from '@/utils/validationRolle';
  import SuccessTemplate from '@/components/admin/rollen/SuccessTemplate.vue';

  const route: RouteLocationNormalizedLoaded = useRoute();
  const router: Router = useRouter();
  const { t }: Composer = useI18n({ useScope: 'global' });

  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();

  const rolleStore: RolleStore = useRolleStore();
  const organisationStore: OrganisationStore = useOrganisationStore();
  const serviceProviderStore: ServiceProviderStore = useServiceProviderStore();

  const currentRolleId: string = route.params['id'] as string;
  const isEditActive: Ref<boolean> = ref(false);

  const creationErrorText: Ref<string> = ref('');
  const creationErrorTitle: Ref<string> = ref('');

  type TranslatedObject = {
    value: string;
    title: string;
  };

  type TranslatedMerkmal = { value: RollenMerkmal; title: string };
  const allMerkmale: Ref<TranslatedMerkmal[]> = ref([]);

  type TranslatedSystemrecht = { value: RollenSystemRecht; title: string };
  const allSystemrechte: Ref<TranslatedSystemrecht[]> = ref([]);

  const showUnsavedChangesDialog: Ref<boolean> = ref(false);

  const translatedOrgName: ComputedRef<string | undefined> = computed(() => {
    if (!rolleStore.currentRolle?.administeredBySchulstrukturknoten) {
      return '---';
    }
    return organisationStore.currentOrganisation?.kennung
      ? `${organisationStore.currentOrganisation.kennung} (${organisationStore.currentOrganisation.name})`
      : organisationStore.currentOrganisation?.name;
  });

  const translatedRollenart: ComputedRef<string> = computed(() => {
    if (!rolleStore.currentRolle?.rollenart) {
      return '---';
    }

    return t(`admin.rolle.mappingFrontBackEnd.rollenarten.${rolleStore.currentRolle.rollenart}`);
  });

  const translatedProviderNames: ComputedRef<TranslatedObject[]> = computed(() => {
    if (!rolleStore.currentRolle?.serviceProviders?.length) {
      return [{ value: '---', title: '---' }];
    }
    return rolleStore.currentRolle.serviceProviders.map((provider: ServiceProvider) => ({
      value: provider.id,
      title: provider.name,
    }));
  });

  const translatedMerkmale: ComputedRef<TranslatedObject[]> = computed(() => {
    const merkmale: Array<RollenMerkmal> = Array.from(rolleStore.currentRolle?.merkmale || []);
    if (!merkmale.length) {
      return [{ value: '---', title: '---' }];
    }
    return merkmale.map((merkmalKey: RollenMerkmal) => ({
      value: merkmalKey,
      title: t(`admin.rolle.mappingFrontBackEnd.merkmale.${merkmalKey}`),
    }));
  });

  const translatedSystemrechte: ComputedRef<TranslatedObject[]> = computed(() => {
    const systemrechte: Array<RollenSystemRecht> = Array.from(rolleStore.currentRolle?.systemrechte || []);
    if (!systemrechte.length) {
      return [{ value: '---', title: '---' }];
    }
    return systemrechte.map((systemrechtKey: RollenSystemRecht) => ({
      value: systemrechtKey,
      title: t(`admin.rolle.mappingFrontBackEnd.systemrechte.${systemrechtKey}`),
    }));
  });

  const validationSchema: TypedSchema = getValidationSchema(t);

  const vuetifyConfig = (state: {
    errors: Array<string>;
  }): { props: { error: boolean; 'error-messages': Array<string> } } => getVuetifyConfig(state);

  // eslint-disable-next-line @typescript-eslint/typedef
  const { defineField, handleSubmit, isFieldDirty, resetForm, setFieldValue } = useForm({
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
    Ref<RollenMerkmal[] | null | '---'>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineField('selectedMerkmale', vuetifyConfig);

  const [selectedServiceProviders, selectedServiceProvidersProps]: [
    Ref<string[] | null | '---'>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineField('selectedServiceProviders', vuetifyConfig);

  const [selectedSystemRechte, selectedSystemRechteProps]: [
    Ref<RollenSystemRecht[] | null | '---'>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineField('selectedSystemRechte', vuetifyConfig);

  function isFormDirty(): boolean {
    // Only check for dirtiness if the form is in edit mode
    if (!isEditActive.value) return false;
    return (
      isFieldDirty('selectedAdministrationsebene') ||
      isFieldDirty('selectedRollenArt') ||
      isFieldDirty('selectedRollenName') ||
      isFieldDirty('selectedMerkmale') ||
      isFieldDirty('selectedSystemRechte')
    );
  }
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
  }

  const onSubmit: (e?: Event | undefined) => Promise<Promise<void> | undefined> = handleSubmit(async () => {
    if (selectedRollenName.value && selectedAdministrationsebene.value && selectedRollenArt.value) {
      const merkmaleToSubmit: RollenMerkmal[] =
        selectedMerkmale.value === '---'
          ? []
          : selectedMerkmale.value?.filter((m: RollenMerkmal | '---') => m !== '---') || [];
      const systemrechteToSubmit: RollenSystemRecht[] =
        selectedSystemRechte.value === '---'
          ? []
          : selectedSystemRechte.value?.filter((m: RollenSystemRecht | '---') => m !== '---') || [];
      const serviceProvidersToSubmit: string[] =
        selectedServiceProviders.value === '---'
          ? []
          : selectedServiceProviders.value?.filter((s: string) => s !== '---') || [];
      if (rolleStore.currentRolle) {
        try {
          await rolleStore.updateRolle(
            rolleStore.currentRolle.id,
            selectedRollenName.value,
            merkmaleToSubmit,
            systemrechteToSubmit,
            serviceProvidersToSubmit,
          );
        } catch {
          creationErrorText.value = t(`admin.rolle.errors.${rolleStore.errorCode}`);
          creationErrorTitle.value = t(`admin.rolle.title.${rolleStore.errorCode}`);
        }
      }
      resetForm();
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
    if (isFormDirty()) {
      showUnsavedChangesDialog.value = true;
      blockedNext = next;
    } else {
      cancelEdit();
    }
  }

  function preventNavigation(event: BeforeUnloadEvent): void {
    if (!isFormDirty()) return;
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
    await organisationStore.getOrganisationById(rolleStore.currentRolle?.administeredBySchulstrukturknoten || '');
    await serviceProviderStore.getAllServiceProviders();

    Object.values(RollenMerkmal).forEach((enumValue: RollenMerkmal) => {
      const i18nPath: string = `admin.rolle.mappingFrontBackEnd.merkmale.${enumValue}`;
      allMerkmale.value.push({
        value: enumValue,
        title: t(i18nPath),
      });
    });

    Object.values(RollenSystemRecht).forEach((enumValue: RollenSystemRecht) => {
      if (enumValue !== RollenSystemRecht.MigrationDurchfuehren) {
        const i18nPath: string = `admin.rolle.mappingFrontBackEnd.systemrechte.${enumValue}`;
        allSystemrechte.value.push({
          value: enumValue,
          title: t(i18nPath),
        });
      }
    });

    // Set the initial values using the computed properties
    setFieldValue('selectedAdministrationsebene', translatedOrgName.value);
    setFieldValue('selectedRollenArt', translatedRollenart.value);
    setFieldValue('selectedRollenName', rolleStore.currentRolle?.name);
    setFieldValue(
      'selectedMerkmale',
      translatedMerkmale.value.map((obj: TranslatedObject) => obj.value),
    );
    setFieldValue(
      'selectedServiceProviders',
      translatedProviderNames.value.map((obj: TranslatedObject) => obj.value),
    );
    setFieldValue(
      'selectedSystemRechte',
      translatedSystemrechte.value.map((obj: TranslatedObject) => obj.value),
    );

    /* listen for browser changes and prevent them when form is dirty */
    window.addEventListener('beforeunload', preventNavigation);
  });

  onBeforeRouteLeave((_to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
    rolleStore.errorCode = '';
    if (isFormDirty()) {
      showUnsavedChangesDialog.value = true;
      blockedNext = next;
    } else {
      next();
    }
  });

  onUnmounted(() => {
    window.removeEventListener('beforeunload', preventNavigation);
  });
</script>

<template>
  <div class="admin">
    <v-row>
      <v-col cols="12">
        <h1
          class="text-center headline-1"
          data-testid="admin-headline"
        >
          {{ $t('admin.headline') }}
        </h1>
      </v-col>
    </v-row>
    <LayoutCard
      :closable="true"
      data-testid="rolle-details-card"
      :header="$t('admin.rolle.edit')"
      @onCloseClicked="navigateToRolleTable"
      :padded="true"
      :showCloseText="true"
    >
      <!-- Error Message Display -->
      <SpshAlert
        :model-value="!!rolleStore.errorCode"
        :title="creationErrorTitle || $t('admin.rolle.loadingErrorTitle')"
        :type="'error'"
        :closable="false"
        :text="creationErrorText || $t('admin.rolle.loadingErrorText')"
        :showButton="true"
        :buttonText="$t('nav.backToList')"
        :buttonAction="handleAlertClose"
        @update:modelValue="handleAlertClose"
      />

      <template v-if="!rolleStore.updatedRolle && !rolleStore.errorCode">
        <v-container>
          <div v-if="rolleStore.currentRolle">
            <RolleForm
              :onHandleConfirmUnsavedChanges="handleConfirmUnsavedChanges"
              :onHandleDiscard="navigateToRolleTable"
              :onShowDialogChange="(value: boolean) => (showUnsavedChangesDialog = value)"
              :onSubmit="onSubmit"
              :isEditActive="isEditActive"
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
            ></RolleForm>
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
              <v-col
                cols="12"
                sm="6"
                md="auto"
              >
                <v-btn
                  class="primary ml-lg-8"
                  data-testid="rolle-edit-button"
                  @Click="activateEditing"
                  :block="mdAndDown"
                >
                  {{ $t('edit') }}
                </v-btn>
              </v-col>
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
          :followingDataCreated="$t('admin.followingDataCreated')"
          :createdData="[
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
          :createAnotherButtonText="$t('admin.rolle.createAnother')"
          :showCreateAnotherButton="false"
          @navigateBack="router.go(0)"
        />
      </template>
    </LayoutCard>
  </div>
</template>

<style></style>
