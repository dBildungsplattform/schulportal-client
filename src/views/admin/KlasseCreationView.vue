<script setup lang="ts">
  import { ref, type ComputedRef, type Ref, computed, onMounted, watch, onUnmounted } from 'vue';
  import {
    type Router,
    useRouter,
    onBeforeRouteLeave,
    type RouteLocationNormalized,
    type NavigationGuardNext,
  } from 'vue-router';
  import { type Composer, useI18n } from 'vue-i18n';
  import { useForm, type TypedSchema, type BaseFieldProps } from 'vee-validate';
  import {
    useOrganisationStore,
    type OrganisationStore,
    OrganisationsTyp,
    type Organisation,
  } from '@/stores/OrganisationStore';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import SpshAlert from '@/components/alert/SpshAlert.vue';
  import { usePersonenkontextStore, type PersonenkontextStore } from '@/stores/PersonenkontextStore';
  import { type TranslatedObject } from '@/types.d';
  import KlasseForm from '@/components/form/KlasseForm.vue';
  import SuccessTemplate from '@/components/admin/klassen/SuccessTemplate.vue';
  import { getValidationSchema, getVuetifyConfig } from '@/utils/validationKlasse';

  const { t }: Composer = useI18n({ useScope: 'global' });
  const router: Router = useRouter();
  const organisationStore: OrganisationStore = useOrganisationStore();
  const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();

  const timerId: Ref<ReturnType<typeof setTimeout> | undefined> = ref<ReturnType<typeof setTimeout>>();
  let isSearching: boolean = false;
  const hasAutoselectedSchule: Ref<boolean> = ref(false);

  const validationSchema: TypedSchema = getValidationSchema(t);

  const vuetifyConfig = (state: {
    errors: Array<string>;
  }): { props: { error: boolean; 'error-messages': Array<string> } } => getVuetifyConfig(state);

  type KlasseCreationForm = {
    selectedSchule: string;
    selectedKlassenname: string;
  };

  // eslint-disable-next-line @typescript-eslint/typedef
  const { defineField, handleSubmit, isFieldDirty, resetForm, resetField } = useForm<KlasseCreationForm>({
    validationSchema,
  });

  const [selectedSchule, selectedSchuleProps]: [
    Ref<string>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineField('selectedSchule', vuetifyConfig);
  const [selectedKlassenname, selectedKlassennameProps]: [
    Ref<string>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineField('selectedKlassenname', vuetifyConfig);

  const searchInputSchule: Ref<string> = ref('');

  const schulen: ComputedRef<TranslatedObject[] | undefined> = computed(() => {
    return personenkontextStore.workflowStepResponse?.organisations
      .slice(0, 25)
      .filter((org: Organisation) => org.typ === OrganisationsTyp.Schule)
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

  const selectedSchuleTitle: ComputedRef<string> = computed(() => {
    return schulen.value?.find((schule: TranslatedObject) => schule.value === selectedSchule.value)?.title || '';
  });

  // Watcher to detect when the search input for Organisationen is triggered.
  watch(searchInputSchule, async (newValue: string, oldValue: string) => {
    clearTimeout(timerId.value);
    if (oldValue === selectedSchuleTitle.value) return;
    isSearching = !!newValue;

    if (newValue === '' && !selectedSchule.value) {
      timerId.value = setTimeout(async () => {
        await personenkontextStore.processWorkflowStep({
          limit: 25,
        });
      }, 500);
    } else if (newValue && newValue !== selectedSchuleTitle.value) {
      resetField('selectedSchule');
      timerId.value = setTimeout(async () => {
        await personenkontextStore.processWorkflowStep({
          organisationName: newValue,
          limit: 25,
        });
      }, 500);
    } else if (newValue === '' && selectedSchule.value) {
      timerId.value = setTimeout(async () => {
        await personenkontextStore.processWorkflowStep({
          limit: 25,
        });
      }, 500);
    }
  });

  function isFormDirty(): boolean {
    const schuleDirty: boolean = hasAutoselectedSchule.value ? false : isFieldDirty('selectedSchule');
    return schuleDirty || isFieldDirty('selectedKlassenname');
  }
  const showUnsavedChangesDialog: Ref<boolean> = ref(false);
  let blockedNext: () => void = () => {};

  function preventNavigation(event: BeforeUnloadEvent): void {
    if (!isFormDirty()) return;
    event.preventDefault();
    /* Chrome requires returnValue to be set. */
    event.returnValue = '';
  }

  onBeforeRouteLeave((_to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
    if (isFormDirty()) {
      showUnsavedChangesDialog.value = true;
      blockedNext = next;
    } else {
      next();
    }
  });

  const handleCreateAnotherKlasse = async (): Promise<void> => {
    organisationStore.createdKlasse = null;
    await personenkontextStore.processWorkflowStep();
    router.push({ name: 'create-klasse' });
  };

  async function navigateBackToKlasseForm(): Promise<void> {
    organisationStore.errorCode = '';
    await router.push({ name: 'create-klasse' });
  }

  async function navigateToKlasseManagement(): Promise<void> {
    await router.push({ name: 'klasse-management' });
    organisationStore.createdKlasse = null;
  }

  function handleConfirmUnsavedChanges(): void {
    blockedNext();
  }

  const onSubmit: (e?: Event | undefined) => Promise<Promise<void> | undefined> = handleSubmit(async () => {
    await organisationStore.createOrganisation(
      '',
      selectedKlassenname.value,
      '',
      '',
      OrganisationsTyp.Klasse,
      undefined,
      selectedSchule.value,
      selectedSchule.value,
    );
    resetForm();
  });

  // Watcher for schulen to auto-select if there is only one
  watch(
    () => schulen.value,
    (newSchulen: TranslatedObject[] | undefined) => {
      if (!isSearching && newSchulen && newSchulen.length === 1) {
        hasAutoselectedSchule.value = true;
        selectedSchule.value = newSchulen[0]?.value || '';
      }
    },
    { immediate: true },
  );

  onMounted(async () => {
    await personenkontextStore.processWorkflowStep();
    organisationStore.createdKlasse = null;
    organisationStore.errorCode = '';
    /* listen for browser changes and prevent them when form is dirty */
    window.addEventListener('beforeunload', preventNavigation);
  });

  onUnmounted(() => {
    personenkontextStore.workflowStepResponse = null;
    window.removeEventListener('beforeunload', preventNavigation);
  });
</script>

<template>
  <div class="admin">
    <LayoutCard
      :closable="true"
      @onCloseClicked="navigateToKlasseManagement"
      :header="$t('admin.klasse.addNew')"
      :padded="true"
      :showCloseText="true"
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

      <!-- The form to create a new Klasse -->
      <template v-if="!organisationStore.createdKlasse && !organisationStore.errorCode">
        <KlasseForm
          :schulen="schulen"
          :isEditActive="true"
          :readonly="false"
          :selectedSchuleProps="selectedSchuleProps"
          :selectedKlassennameProps="selectedKlassennameProps"
          :showUnsavedChangesDialog="showUnsavedChangesDialog"
          :onHandleConfirmUnsavedChanges="handleConfirmUnsavedChanges"
          :onHandleDiscard="navigateToKlasseManagement"
          :onShowDialogChange="(value?: boolean) => (showUnsavedChangesDialog = value || false)"
          :onSubmit="onSubmit"
          ref="klasse-creation-form"
          v-model:selectedSchule="selectedSchule"
          v-model:selectedKlassenname="selectedKlassenname"
        />
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
