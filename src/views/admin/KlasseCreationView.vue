<script setup lang="ts">
  import KlasseSuccessTemplate from '@/components/admin/klassen/KlasseSuccessTemplate.vue';
  import SpshAlert from '@/components/alert/SpshAlert.vue';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import KlasseForm from '@/components/form/KlasseForm.vue';
  import { useAutoselectedSchule } from '@/composables/useAutoselectedSchule';
  import {
    OrganisationsTyp,
    useOrganisationStore,
    type Organisation,
    type OrganisationStore,
  } from '@/stores/OrganisationStore';
  import { RollenSystemRecht } from '@/stores/RolleStore';
  import { getDisplayNameForOrg } from '@/utils/formatting';
  import { type ValidationSchema } from '@/utils/validationKlasse';
  import { computed, onMounted, onUnmounted, ref, useTemplateRef, type ComputedRef, type Ref } from 'vue';
  import {
    onBeforeRouteLeave,
    useRouter,
    type NavigationGuardNext,
    type RouteLocationNormalized,
    type Router,
  } from 'vue-router';

  const router: Router = useRouter();
  const organisationStore: OrganisationStore = useOrganisationStore();
  // eslint-disable-next-line @typescript-eslint/typedef
  const formRef = useTemplateRef('klasse-creation-form');

  const { autoselectedSchule }: ReturnType<typeof useAutoselectedSchule> = useAutoselectedSchule([
    RollenSystemRecht.KlassenVerwalten,
  ]);

  const translatedSchulname: ComputedRef<string> = computed(() => {
    const schule: Organisation | undefined = organisationStore.schulenFilter.filterResult.find(
      (s: Organisation) => s.id === organisationStore.createdKlasse?.administriertVon,
    );
    if (schule) return getDisplayNameForOrg(schule);
    if (autoselectedSchule.value) return getDisplayNameForOrg(autoselectedSchule.value);
    return '';
  });

  const isFormDirty: Ref<boolean> = ref(false);
  const hasUnsavedChanges: ComputedRef<boolean> = computed(() => {
    if (organisationStore.createdKlasse) return false;
    return isFormDirty.value;
  });
  const showUnsavedChangesDialog: Ref<boolean> = ref(false);
  let blockedNext: () => void = () => {};

  function resetForm(): void {
    formRef.value?.reset();
  }

  function preventNavigation(event: BeforeUnloadEvent): void {
    if (!hasUnsavedChanges.value) return;
    event.preventDefault();
    /* Chrome requires returnValue to be set. */
    event.returnValue = '';
  }

  async function initStores(): Promise<void> {
    organisationStore.createdKlasse = null;
    organisationStore.errorCode = '';
  }

  const handleCreateAnotherKlasse = async (): Promise<void> => {
    resetForm();
    await initStores();
    router.push({ name: 'create-klasse' });
  };

  async function navigateBackToKlasseForm(): Promise<void> {
    resetForm();
    if (organisationStore.errorCode === 'REQUIRED_STEP_UP_LEVEL_NOT_MET') {
      await router.push({ name: 'create-klasse' }).then(() => {
        router.go(0);
      });
    } else {
      organisationStore.errorCode = '';
      await router.push({ name: 'create-klasse' });
    }
  }

  async function navigateToKlasseManagement(): Promise<void> {
    if (organisationStore.errorCode === 'REQUIRED_STEP_UP_LEVEL_NOT_MET') {
      resetForm();
      await router.push({ name: 'create-klasse' }).then(() => {
        router.go(0);
      });
    } else {
      organisationStore.errorCode = '';
      await router.push({ name: 'klasse-management' });
    }
  }

  function handleConfirmUnsavedChanges(): void {
    blockedNext();
    organisationStore.errorCode = '';
  }

  function handleChangedFormState({ dirty }: { values: ValidationSchema; dirty: boolean; valid: boolean }): void {
    isFormDirty.value = dirty;
  }

  const onSubmit = async ({ selectedSchule, selectedKlassenname }: ValidationSchema): Promise<void> => {
    await organisationStore.createOrganisation(
      selectedSchule,
      selectedSchule,
      undefined,
      selectedKlassenname,
      undefined,
      undefined,
      OrganisationsTyp.Klasse,
    );
  };

  onMounted(async () => {
    await initStores();
    /* listen for browser changes and prevent them when form is dirty */
    window.addEventListener('beforeunload', preventNavigation);
  });

  onUnmounted(() => {
    window.removeEventListener('beforeunload', preventNavigation);
  });

  onBeforeRouteLeave((_to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
    if (hasUnsavedChanges.value) {
      showUnsavedChangesDialog.value = true;
      blockedNext = next;
    } else {
      next();
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
      :closable="!organisationStore.errorCode"
      @onCloseClicked="navigateToKlasseManagement"
      :header="$t('admin.klasse.addNew')"
      :padded="true"
      :showCloseText="true"
    >
      <!-- The form to create a new Klasse -->
      <template v-if="!organisationStore.createdKlasse">
        <KlasseForm
          :errorCode="organisationStore.errorCode"
          :editMode="false"
          :isLoading="organisationStore.loading"
          :showUnsavedChangesDialog="showUnsavedChangesDialog"
          :onHandleConfirmUnsavedChanges="handleConfirmUnsavedChanges"
          :onHandleDiscard="navigateToKlasseManagement"
          :onShowDialogChange="(value?: boolean) => (showUnsavedChangesDialog = value || false)"
          :onSubmit
          @formStateChanged="handleChangedFormState"
          ref="klasse-creation-form"
        >
          <!-- Error Message Display if error on submit -->
          <SpshAlert
            :model-value="!!organisationStore.errorCode"
            :title="$t('admin.klasse.klasseCreateErrorTitle')"
            :type="'error'"
            :closable="false"
            :text="organisationStore.errorCode ? $t(`admin.klasse.errors.${organisationStore.errorCode}`) : ''"
            :showButton="true"
            :buttonText="$t('admin.klasse.backToCreateKlasse')"
            :buttonAction="navigateBackToKlasseForm"
          />
        </KlasseForm>
      </template>

      <!-- Result template on success after submit -->
      <template v-if="organisationStore.createdKlasse && !organisationStore.errorCode">
        <KlasseSuccessTemplate
          :successMessage="$t('admin.klasse.klasseAddedSuccessfully')"
          :followingDataCreated="$t('admin.followingDataCreated')"
          :createdData="[
            { label: $t('admin.schule.schule'), value: translatedSchulname, testId: 'created-klasse-schule' },
            {
              label: $t('admin.klasse.klassenname'),
              value: organisationStore.createdKlasse?.name,
              testId: 'created-klasse-name',
            },
          ]"
          :backButtonText="$t('nav.backToList')"
          :createAnotherButtonText="$t('admin.klasse.createAnother')"
          :showCreateAnotherButton="true"
          :backButtonTestId="'back-to-list-button'"
          :createAnotherButtonTestId="'create-another-klasse-button'"
          @OnNavigateBack="navigateToKlasseManagement"
          @OnCreateAnother="handleCreateAnotherKlasse"
        />
      </template>
    </LayoutCard>
  </div>
</template>

<style></style>
