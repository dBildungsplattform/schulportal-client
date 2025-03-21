<script setup lang="ts">
  import KlasseSuccessTemplate from '@/components/admin/klassen/KlasseSuccessTemplate.vue';
  import type { DBiamPersonenzuordnungResponse, PersonenkontextRolleFieldsResponse } from '@/api-client/generated';
  import SpshAlert from '@/components/alert/SpshAlert.vue';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import KlasseForm from '@/components/form/KlasseForm.vue';
  import { useAuthStore, type AuthStore } from '@/stores/AuthStore';
  import {
    OrganisationsTyp,
    useOrganisationStore,
    type Organisation,
    type OrganisationStore,
  } from '@/stores/OrganisationStore';
  import { usePersonStore, type PersonStore } from '@/stores/PersonStore';
  import { RollenSystemRecht } from '@/stores/RolleStore';
  import { type TranslatedObject } from '@/types.d';
  import { getValidationSchema, getVuetifyConfig } from '@/utils/validationKlasse';
  import { useForm, type BaseFieldProps, type TypedSchema } from 'vee-validate';
  import { computed, onMounted, onUnmounted, ref, watch, type ComputedRef, type Ref } from 'vue';
  import { useI18n, type Composer } from 'vue-i18n';
  import {
    onBeforeRouteLeave,
    useRouter,
    type NavigationGuardNext,
    type RouteLocationNormalized,
    type Router,
  } from 'vue-router';

  const { t }: Composer = useI18n({ useScope: 'global' });
  const router: Router = useRouter();
  const authStore: AuthStore = useAuthStore();
  const personStore: PersonStore = usePersonStore();
  const organisationStore: OrganisationStore = useOrganisationStore();
  // get personenuebersicht for the current user, if we don't have it
  watch(
    () => ({
      uebersicht: personStore.personenuebersicht,
      currentUser: authStore.currentUser,
    }),
    async ({
      uebersicht,
      currentUser,
    }: {
      uebersicht: PersonStore['personenuebersicht'];
      currentUser: AuthStore['currentUser'];
    }) => {
      if (!(currentUser && currentUser.personId)) return;
      if (uebersicht && uebersicht.personId === currentUser.personId) return;

      await personStore.getPersonenuebersichtById(currentUser.personId);
    },
    { immediate: true },
  );

  const autoselectedSchuleId: ComputedRef<string | null> = computed(() => {
    const { currentUser }: AuthStore = authStore;
    if (!currentUser?.personenkontexte) return null;
    // Find all contexts where the user has KlassenVerwalten
    const schuleIdsWithKlasseVerwaltenPermission: Array<string> = currentUser.personenkontexte.reduce(
      (acc: Array<string>, personenkontext: PersonenkontextRolleFieldsResponse) => {
        if (!personenkontext.rolle.systemrechte.includes(RollenSystemRecht.KlassenVerwalten)) return acc;
        const schulZuordnung: DBiamPersonenzuordnungResponse | undefined =
          personStore.personenuebersicht?.zuordnungen.find(
            (z: DBiamPersonenzuordnungResponse) =>
              z.sskId === personenkontext.organisationsId && z.typ === OrganisationsTyp.Schule,
          );
        if (schulZuordnung) acc.push(personenkontext.organisationsId);
        return acc;
      },
      [],
    );
    return schuleIdsWithKlasseVerwaltenPermission.length === 1 ? schuleIdsWithKlasseVerwaltenPermission[0]! : null;
  });
  const hasAutoselectedSchule: ComputedRef<boolean> = computed(() => autoselectedSchuleId.value !== null);

  const validationSchema: TypedSchema = getValidationSchema(t);

  const vuetifyConfig = (state: {
    errors: Array<string>;
  }): { props: { error: boolean; 'error-messages': Array<string> } } => getVuetifyConfig(state);

  type KlasseCreationForm = {
    selectedSchule: string | undefined;
    selectedKlassenname: string;
  };

  // eslint-disable-next-line @typescript-eslint/typedef
  const { defineField, handleSubmit, isFieldDirty, resetForm } = useForm<KlasseCreationForm>({
    validationSchema,
  });

  const [selectedSchule, selectedSchuleProps]: [
    Ref<string | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineField('selectedSchule', vuetifyConfig);
  const [selectedKlassenname, selectedKlassennameProps]: [
    Ref<string>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineField('selectedKlassenname', vuetifyConfig);

  const filteredSchulen: ComputedRef<TranslatedObject[] | undefined> = computed(() => {
    return organisationStore.filteredSchulen.schulen
      .slice(0, 25)
      .map((org: Organisation) => ({
        value: org.id,
        title: org.kennung ? `${org.kennung} (${org.name.trim()})` : org.name,
      }))
      .sort((a: TranslatedObject, b: TranslatedObject) => a.title.localeCompare(b.title));
  });

  watch(
    autoselectedSchuleId,
    (newAutoSelectedOrgId: string | null) => {
      const newSelectedSchule: TranslatedObject | undefined = filteredSchulen.value?.find(
        (schule: TranslatedObject) => schule.value === newAutoSelectedOrgId,
      );
      selectedSchule.value = newSelectedSchule?.value;
    },
    { immediate: true },
  );

  const translatedSchulname: ComputedRef<string> = computed(
    () =>
      filteredSchulen.value?.find(
        (schule: TranslatedObject) => schule.value === organisationStore.createdKlasse?.administriertVon,
      )?.title || '',
  );

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

  async function initStores(): Promise<void> {
    // initial options for autocomplete
    await organisationStore.getFilteredSchulen({
      includeTyp: OrganisationsTyp.Schule,
      systemrechte: [RollenSystemRecht.KlassenVerwalten],
      limit: 25,
    });
    organisationStore.createdKlasse = null;
    organisationStore.errorCode = '';
  }

  const handleCreateAnotherKlasse = async (): Promise<void> => {
    resetForm();
    await initStores();
    router.push({ name: 'create-klasse' });
  };

  async function navigateBackToKlasseForm(): Promise<void> {
    if (organisationStore.errorCode === 'REQUIRED_STEP_UP_LEVEL_NOT_MET') {
      resetForm();
      await router.push({ name: 'create-klasse' }).then(() => {
        router.go(0);
      });
    } else {
      organisationStore.errorCode = '';
      await router.push({ name: 'create-klasse' });
    }
  }

  async function navigateToKlasseManagement(): Promise<void> {
    organisationStore.errorCode = '';
    await router.push({ name: 'klasse-management' });
  }

  function handleConfirmUnsavedChanges(): void {
    blockedNext();
    organisationStore.errorCode = '';
  }

  const onSubmit: (e?: Event | undefined) => Promise<Promise<void> | undefined> = handleSubmit(async () => {
    if (!selectedSchule.value) return;
    await organisationStore.createOrganisation(
      selectedSchule.value,
      selectedSchule.value,
      undefined,
      selectedKlassenname.value,
      undefined,
      undefined,
      OrganisationsTyp.Klasse,
      undefined,
    );
    resetForm();
  });

  onMounted(async () => {
    await initStores();
    /* listen for browser changes and prevent them when form is dirty */
    window.addEventListener('beforeunload', preventNavigation);
  });

  onUnmounted(() => {
    window.removeEventListener('beforeunload', preventNavigation);
  });

  onBeforeRouteLeave((_to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
    if (isFormDirty()) {
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
          :autoselected-schule-id="autoselectedSchuleId"
          :errorCode="organisationStore.errorCode"
          :schulen="filteredSchulen"
          :isEditActive="true"
          :isLoading="organisationStore.filteredSchulen.loading"
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
