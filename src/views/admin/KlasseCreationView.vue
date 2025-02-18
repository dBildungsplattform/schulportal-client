<script setup lang="ts">
  import SuccessTemplate from '@/components/admin/klassen/SuccessTemplate.vue';
  import SpshAlert from '@/components/alert/SpshAlert.vue';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import KlasseForm from '@/components/form/KlasseForm.vue';
  import {
    OrganisationsTyp,
    useOrganisationStore,
    type Organisation,
    type OrganisationStore,
  } from '@/stores/OrganisationStore';
  import { RollenSystemRecht } from '@/stores/RolleStore';
  import { type TranslatedObject } from '@/types.d';
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
  const formRef: Readonly<typeof KlasseForm> = useTemplateRef<InstanceType<typeof KlasseForm>>('klasse-creation-form');

  const schulen: ComputedRef<TranslatedObject[] | undefined> = computed(() => {
    return organisationStore.allSchulen
      .slice(0, 25)
      .map((org: Organisation) => ({
        value: org.id,
        title: org.kennung ? `${org.kennung} (${org.name.trim()})` : org.name,
      }))
      .sort((a: TranslatedObject, b: TranslatedObject) => a.title.localeCompare(b.title));
  });

  const translatedSchulname: ComputedRef<string> = computed(
    () =>
      schulen.value?.find(
        (schule: TranslatedObject) => schule.value === organisationStore.createdKlasse?.administriertVon,
      )?.title || '',
  );

  const isFormDirty: Ref<boolean> = ref(false);
  const showUnsavedChangesDialog: Ref<boolean> = ref(false);
  let blockedNext: () => void = () => {};

  function preventNavigation(event: BeforeUnloadEvent): void {
    if (!isFormDirty.value) return;
    event.preventDefault();
    /* Chrome requires returnValue to be set. */
    event.returnValue = '';
  }

  async function initStores(): Promise<void> {
    await organisationStore.getAllOrganisationen({
      includeTyp: OrganisationsTyp.Schule,
      systemrechte: [RollenSystemRecht.KlassenVerwalten],
      limit: 25,
    });
    organisationStore.createdKlasse = null;
    organisationStore.errorCode = '';
  }

  onBeforeRouteLeave((_to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
    if (isFormDirty.value) {
      showUnsavedChangesDialog.value = true;
      blockedNext = next;
    } else {
      next();
    }
  });

  const handleCreateAnotherKlasse = async (): Promise<void> => {
    formRef.value?.reset();
    await initStores();
    router.push({ name: 'create-klasse' });
  };

  async function navigateBackToKlasseForm(): Promise<void> {
    if (organisationStore.errorCode === 'REQUIRED_STEP_UP_LEVEL_NOT_MET') {
      formRef.value?.reset();
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
      formRef.value?.reset();
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
      undefined,
      selectedKlassenname,
      undefined,
      undefined,
      OrganisationsTyp.Klasse,
      undefined,
      selectedSchule,
      selectedSchule,
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
          @form-state-changed="handleChangedFormState"
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
        <SuccessTemplate
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
