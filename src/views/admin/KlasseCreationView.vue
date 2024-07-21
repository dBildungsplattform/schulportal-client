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
  import { toTypedSchema } from '@vee-validate/yup';
  import { object, string } from 'yup';
  import {
    useOrganisationStore,
    type OrganisationStore,
    type Organisation,
    OrganisationsTyp,
  } from '@/stores/OrganisationStore';
  import { DIN_91379A_EXT } from '@/utils/validation';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import SpshAlert from '@/components/alert/SpshAlert.vue';
  import { useDisplay } from 'vuetify';
  import { usePersonenkontextStore, type PersonenkontextStore } from '@/stores/PersonenkontextStore';
  import KlasseForm from '@/components/form/KlasseForm.vue';

  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();

  const { t }: Composer = useI18n({ useScope: 'global' });
  const router: Router = useRouter();
  const organisationStore: OrganisationStore = useOrganisationStore();
  const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();

  const timerId: Ref<ReturnType<typeof setTimeout> | undefined> = ref<ReturnType<typeof setTimeout>>();
  let isSearching: boolean = false;
  const hasAutoselectedSchule: Ref<boolean> = ref(false);

  const validationSchema: TypedSchema = toTypedSchema(
    object({
      selectedSchule: string().required(t('admin.klasse.rules.schule.required')),
      selectedKlassenname: string()
        .matches(DIN_91379A_EXT, t('admin.klasse.rules.klassenname.matches'))
        .required(t('admin.klasse.rules.klassenname.required')),
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

  type KlasseCreationForm = {
    selectedSchule: string;
    selectedKlassenname: string;
  };

  type TranslatedObject = {
    value: string;
    title: string;
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
    return isFieldDirty('selectedSchule') || isFieldDirty('selectedKlassenname');
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

  const handleCreateAnotherKlasse = (): void => {
    organisationStore.createdKlasse = null;
    resetForm();
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
    /* listen for browser changes and prevent them when form is dirty */
    window.addEventListener('beforeunload', preventNavigation);
  });

  onUnmounted(() => {
    window.removeEventListener('beforeunload', preventNavigation);
  });

  // Clear the store on leaving the route
  onBeforeRouteLeave(() => {
    personenkontextStore.workflowStepResponse = null;
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
          :readonly="false"
          :selectedSchuleProps="selectedSchuleProps"
          :selectedKlassennameProps="selectedKlassennameProps"
          :showUnsavedChangesDialog="showUnsavedChangesDialog"
          :onHandleConfirmUnsavedChanges="handleConfirmUnsavedChanges"
          :onHandleDiscard="navigateToKlasseManagement"
          :onShowDialogChange="(value: boolean) => (showUnsavedChangesDialog = value)"
          :onSubmit="onSubmit"
          ref="klasse-creation-form"
          v-model:selectedSchule="selectedSchule"
          v-model:selectedKlassenname="selectedKlassenname"
        />
      </template>

      <!-- Result template on success after submit  -->
      <template v-if="organisationStore.createdKlasse && !organisationStore.errorCode">
        <v-container>
          <v-row justify="center">
            <v-col
              class="subtitle-1"
              cols="auto"
            >
              <span data-testid="klasse-success-text">{{ $t('admin.klasse.klasseAddedSuccessfully') }}</span>
            </v-col>
          </v-row>
          <v-row justify="center">
            <v-col cols="auto">
              <v-icon
                aria-hidden="true"
                color="#1EAE9C"
                icon="mdi-check-circle"
                small
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
            <v-col class="text-body bold text-right"> {{ $t('admin.schule.schule') }}: </v-col>
            <v-col class="text-body">
              <span data-testid="created-klasse-schule">
                {{ translatedSchulname }}
              </span>
            </v-col>
          </v-row>
          <v-row>
            <v-col class="text-body bold text-right"> {{ $t('admin.klasse.klassenname') }}: </v-col>
            <v-col class="text-body"
              ><span data-testid="created-klasse-name">{{ organisationStore.createdKlasse?.name }}</span></v-col
            >
          </v-row>
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
                @click.stop="navigateToKlasseManagement"
                data-testid="back-to-list-button"
                :block="mdAndDown"
              >
                {{ $t('nav.backToList') }}
              </v-btn>
            </v-col>
            <v-col
              cols="12"
              sm="6"
              md="auto"
            >
              <v-btn
                class="primary button"
                @click="handleCreateAnotherKlasse"
                data-testid="create-another-klasse-button"
                :block="mdAndDown"
              >
                {{ $t('admin.klasse.createAnother') }}
              </v-btn>
            </v-col>
          </v-row>
        </v-container>
      </template>
    </LayoutCard>
  </div>
</template>

<style></style>
