<script setup lang="ts">
  import KlasseDelete from '@/components/admin/klassen/KlasseDelete.vue';
  import KlasseSuccessTemplate from '@/components/admin/klassen/KlasseSuccessTemplate.vue';
  import SpshAlert from '@/components/alert/SpshAlert.vue';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import KlasseForm from '@/components/form/KlasseForm.vue';
  import {
    OrganisationsTyp,
    useOrganisationStore,
    type Organisation,
    type OrganisationStore,
  } from '@/stores/OrganisationStore';
  import { useSearchFilterStore, type SearchFilterStore } from '@/stores/SearchFilterStore';
  import { type ValidationSchema as KlasseFormValues, type ValidationSchema } from '@/utils/validationKlasse';
  import { computed, onBeforeMount, onUnmounted, ref, watch, type ComputedRef, type Ref } from 'vue';
  import { useI18n, type Composer } from 'vue-i18n';
  import {
    onBeforeRouteLeave,
    useRoute,
    useRouter,
    type NavigationGuardNext,
    type RouteLocationNormalized,
    type RouteLocationNormalizedLoaded,
    type Router,
  } from 'vue-router';
  import { useDisplay } from 'vuetify';

  const route: RouteLocationNormalizedLoaded = useRoute();
  const router: Router = useRouter();
  const { t }: Composer = useI18n({ useScope: 'global' });

  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();

  const organisationStore: OrganisationStore = useOrganisationStore();
  const searchFilterStore: SearchFilterStore = useSearchFilterStore();

  const currentKlasseId: string = route.params['id'] as string;
  const isEditActive: Ref<boolean> = ref(false);

  const showUnsavedChangesDialog: Ref<boolean> = ref(false);

  const translatedSchulname: ComputedRef<string | undefined> = computed(() => {
    if (!organisationStore.currentOrganisation?.name) {
      return '---';
    }
    return organisationStore.currentOrganisation.kennung
      ? `${organisationStore.currentOrganisation.kennung} (${organisationStore.currentOrganisation.name})`
      : organisationStore.currentOrganisation.name;
  });
  const errorTitle: ComputedRef<string> = computed(() => {
    if (!organisationStore.errorCode) return '';
    return organisationStore.errorCode === 'UNSPECIFIED_ERROR'
      ? t('admin.klasse.loadingErrorTitle')
      : t(`admin.klasse.title.${organisationStore.errorCode}`);
  });
  const errorText: ComputedRef<string> = computed(() => {
    if (!organisationStore.errorCode) return '';
    return organisationStore.errorCode === 'UNSPECIFIED_ERROR'
      ? t('admin.klasse.loadingErrorText')
      : t(`admin.klasse.errors.${organisationStore.errorCode}`);
  });

  const initialFormValues: ComputedRef<Partial<KlasseFormValues>> = computed(() => ({
    selectedSchule: organisationStore.currentOrganisation?.id,
    selectedKlassenname: organisationStore.currentKlasse?.name,
  }));
  const isFormDirty: Ref<boolean> = ref(false);
  const hasUnsavedChanges: ComputedRef<boolean> = computed(() => {
    if (organisationStore.updatedOrganisation) return false;
    return isFormDirty.value;
  });

  let blockedNext: () => void = () => {};

  function handleConfirmUnsavedChanges(): void {
    isEditActive.value = false;
    showUnsavedChangesDialog.value = false;
    blockedNext();
    organisationStore.errorCode = '';
  }

  function activateEditing(): void {
    isEditActive.value = true;
  }

  function cancelEdit(): void {
    isEditActive.value = false;
  }

  function handleCancel(next?: NavigationGuardNext): void {
    if (hasUnsavedChanges.value) {
      showUnsavedChangesDialog.value = true;
      if (next) blockedNext = next;
    } else {
      cancelEdit();
    }
  }

  function preventNavigation(event: BeforeUnloadEvent): void {
    if (!hasUnsavedChanges.value) return;
    event.preventDefault();
    /* Chrome requires returnValue to be set. */
    event.returnValue = '';
  }

  async function navigateToKlasseManagement(): Promise<void> {
    await router.push({ name: 'klasse-management' });
    organisationStore.updatedOrganisation = null;
  }

  const handleAlertClose = (): void => {
    organisationStore.errorCode = '';
    navigateToKlasseManagement();
  };

  const onSubmit = async ({ selectedKlassenname }: KlasseFormValues): Promise<void> => {
    if (selectedKlassenname) {
      if (organisationStore.currentOrganisation) {
        await organisationStore.updateOrganisationById(currentKlasseId, selectedKlassenname);
      }
    }
  };

  async function deleteKlasseById(organisationId: string): Promise<void> {
    await organisationStore.deleteOrganisationById(organisationId);
    // If the deleted Klasse was used for the Klassen filter then reset the filter for Klassen
    if (searchFilterStore.selectedKlassenForKlassen?.includes(organisationId)) {
      searchFilterStore.selectedKlassenForKlassen = [];
    }
  }

  const alertButtonText: ComputedRef<string> = computed(() => {
    if (organisationStore.errorCode === 'NEWER_VERSION_ORGANISATION') return t('refreshData');
    else if (isEditActive.value) {
      return t('admin.klasse.backToEditKlasse');
    } else return t('nav.backToList');
  });

  const alertButtonAction: ComputedRef<() => void> = computed(() => {
    return organisationStore.errorCode === 'NEWER_VERSION_ORGANISATION' || isEditActive.value
      ? (): void => router.go(0)
      : navigateToKlasseManagement;
  });

  function handleChangedFormState({ dirty }: { values: ValidationSchema; dirty: boolean; valid: boolean }): void {
    isFormDirty.value = dirty;
  }

  watch(
    () => organisationStore.currentKlasse,
    async (newKlasse: Organisation | null) => {
      if (!newKlasse) return;
      if (newKlasse.administriertVon) {
        if (
          !organisationStore.currentOrganisation ||
          organisationStore.currentOrganisation.id !== newKlasse.administriertVon
        )
          await organisationStore.getOrganisationById(newKlasse.administriertVon, OrganisationsTyp.Schule);
      }
    },
    { immediate: true },
  );

  onBeforeMount(async () => {
    organisationStore.errorCode = '';
    organisationStore.updatedOrganisation = null;
    organisationStore.currentKlasse = null;
    organisationStore.currentOrganisation = null;
    // Retrieves the Klasse using the Id in the route since that's all we have
    await organisationStore.getOrganisationById(currentKlasseId, OrganisationsTyp.Klasse);

    /* listen for browser changes and prevent them when form is dirty */
    window.addEventListener('beforeunload', preventNavigation);
  });

  onBeforeRouteLeave((_to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
    if (hasUnsavedChanges.value) {
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
    <h1
      class="text-center headline"
      data-testid="admin-headline"
    >
      {{ $t('admin.headline') }}
    </h1>
    <LayoutCard
      :closable="!organisationStore.errorCode"
      data-testid="klasse-details-card"
      :header="$t('admin.klasse.edit')"
      @onCloseClicked="navigateToKlasseManagement"
      :padded="true"
      :showCloseText="true"
    >
      <template v-if="!organisationStore.updatedOrganisation">
        <v-container>
          <div v-if="organisationStore.currentOrganisation">
            <KlasseForm
              :initialValues="initialFormValues"
              :errorCode="organisationStore.errorCode"
              :editMode="true"
              :isEditActive="isEditActive"
              :isLoading="organisationStore.loading"
              :showUnsavedChangesDialog="showUnsavedChangesDialog"
              :onHandleConfirmUnsavedChanges="handleConfirmUnsavedChanges"
              :onHandleDiscard="handleCancel"
              :onShowDialogChange="(value?: boolean) => (showUnsavedChangesDialog = value || false)"
              :onSubmit="onSubmit"
              @form-state-changed="handleChangedFormState"
              ref="klasse-creation-form"
            >
              <!-- Error Message Display -->
              <SpshAlert
                :model-value="!!organisationStore.errorCode"
                :title="errorTitle"
                :type="'error'"
                :closable="false"
                :text="errorText"
                :showButton="true"
                :buttonText="alertButtonText"
                :buttonAction="alertButtonAction"
                @update:modelValue="handleAlertClose"
              />
            </KlasseForm>
            <v-divider
              v-if="isEditActive && !organisationStore.errorCode"
              class="border-opacity-100 rounded"
              color="#E5EAEF"
              thickness="5px"
            ></v-divider>
            <div
              v-if="!isEditActive && !organisationStore.errorCode"
              class="d-flex justify-sm-end"
            >
              <v-row class="pt-3 px-2 justify-end">
                <v-col
                  cols="12"
                  md="auto"
                  sm="6"
                >
                  <div class="d-flex justify-sm-end">
                    <KlasseDelete
                      :errorCode="organisationStore.errorCode"
                      :klassenname="organisationStore.currentKlasse?.name || ''"
                      :klassenId="organisationStore.currentKlasse?.id || ''"
                      ref="klasse-delete"
                      :schulname="organisationStore.currentOrganisation.name || ''"
                      :isLoading="organisationStore.loading"
                      :useIconActivator="false"
                      @onDeleteKlasse="deleteKlasseById(currentKlasseId)"
                    >
                    </KlasseDelete>
                  </div>
                </v-col>
                <v-col
                  cols="12"
                  sm="6"
                  md="auto"
                >
                  <v-btn
                    class="primary ml-lg-8"
                    data-testid="klasse-edit-button"
                    @click="activateEditing"
                    :block="mdAndDown"
                  >
                    {{ $t('edit') }}
                  </v-btn>
                </v-col>
              </v-row>
            </div>
          </div>
          <div v-else-if="organisationStore.loading">
            <v-progress-circular indeterminate></v-progress-circular>
          </div>
        </v-container>
      </template>
      <!-- Result template on success after submit  -->
      <template v-if="organisationStore.updatedOrganisation && !organisationStore.errorCode">
        <KlasseSuccessTemplate
          :backButtonTestId="'back-to-details-button'"
          :backButtonText="$t('nav.backToList')"
          :createAnotherButtonText="$t('admin.klasse.createAnother')"
          :createdData="[
            { label: $t('admin.schule.schule'), value: translatedSchulname || '', testId: 'created-klasse-schule' },
            {
              label: $t('admin.klasse.klassenname'),
              value: organisationStore.updatedOrganisation?.name || '',
              testId: 'created-klasse-name',
            },
          ]"
          :followingDataCreated="$t('admin.followingDataCreated')"
          @onNavigateBack="navigateToKlasseManagement"
          :showCreateAnotherButton="false"
          :successMessage="$t('admin.klasse.klasseUpdatedSuccessfully')"
        />
      </template>
    </LayoutCard>
  </div>
</template>

<style></style>
