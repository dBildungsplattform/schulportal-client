<script setup lang="ts">
  import { computed, onMounted, onUnmounted, ref, type ComputedRef, type Ref } from 'vue';
  import { useI18n, type Composer } from 'vue-i18n';
  import {
    type Router,
    useRouter,
    onBeforeRouteLeave,
    type RouteLocationNormalized,
    type NavigationGuardNext,
  } from 'vue-router';
  import { useDisplay } from 'vuetify';
  import {
    OrganisationsTyp,
    useOrganisationStore,
    type Organisation,
    type OrganisationStore,
  } from '@/stores/OrganisationStore';
  import { useForm, type TypedSchema, type BaseFieldProps } from 'vee-validate';
  import { object, string } from 'yup';
  import { toTypedSchema } from '@vee-validate/yup';
  import { DIN_91379A_EXT, NO_LEADING_TRAILING_SPACES } from '@/utils/validation';
  import SpshAlert from '@/components/alert/SpshAlert.vue';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import SchultraegerForm from '@/components/admin/schultraeger/SchultraegerForm.vue';

  const initialSchultraegerformCache: Ref<string> = ref('');

  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();

  const { t }: Composer = useI18n({ useScope: 'global' });
  const router: Router = useRouter();
  const organisationStore: OrganisationStore = useOrganisationStore();

  const validationSchema: TypedSchema = toTypedSchema(
    object({
      selectedSchultraegername: string()
        .matches(DIN_91379A_EXT, t('admin.schultraeger.rules.schultraegername.matches'))
        .matches(NO_LEADING_TRAILING_SPACES, t('admin.schultraeger.rules.schultraegername.noLeadingTrailingSpaces'))
        .required(t('admin.schultraeger.rules.schultraegername.required')),
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

  type SchultraegerCreationForm = {
    selectedSchultraegerform: string;
    selectedSchultraegername: string;
  };

  // eslint-disable-next-line @typescript-eslint/typedef
  const { defineField, handleSubmit, isFieldDirty, resetForm } = useForm<SchultraegerCreationForm>({
    validationSchema,
  });

  const preservedSchultraegerform: Ref<string | undefined> = ref<string>('');

  const [selectedSchultraegerform]: [
    Ref<string>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineField('selectedSchultraegerform', vuetifyConfig);
  const [selectedSchultraegername, selectedSchultraegernameProps]: [
    Ref<string>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineField('selectedSchultraegername', vuetifyConfig);

  const rootChildSchultraegerList: ComputedRef<Organisation[]> = computed(() => {
    return organisationStore.schultraeger;
  });

  function isFormDirty(): boolean {
    return isFieldDirty('selectedSchultraegerform') || isFieldDirty('selectedSchultraegername');
  }

  const showUnsavedChangesDialog: Ref<boolean> = ref(false);
  let blockedNext: () => void = () => {};

  const onSubmit: (e?: Event | undefined) => Promise<Promise<void> | undefined> = handleSubmit(async () => {
    preservedSchultraegerform.value = rootChildSchultraegerList.value.find(
      (schultraeger: Organisation) => schultraeger.id === selectedSchultraegerform.value,
    )?.name;
    if (selectedSchultraegername.value) {
      await organisationStore.createOrganisation(
        undefined,
        selectedSchultraegername.value,
        undefined,
        undefined,
        OrganisationsTyp.Traeger,
        undefined,
        selectedSchultraegerform.value,
        selectedSchultraegerform.value,
      );
      resetForm({
        values: {
          selectedSchultraegerform: initialSchultraegerformCache.value,
          selectedSchultraegername: '',
        },
      });
    }
  });

  const handleCreateAnotherSchultraeger = (): void => {
    organisationStore.createdSchultraeger = null;
    resetForm();
    router.push({ name: 'create-schultraeger' });
  };

  function handleConfirmUnsavedChanges(): void {
    blockedNext();
    organisationStore.errorCode = '';
  }

  // TODO: add a router.push to the Management when it's available
  async function navigateToSchultraegerManagement(): Promise<void> {
    organisationStore.createdSchule = null;
  }

  async function navigateBackToSchultraegerForm(): Promise<void> {
    if (organisationStore.errorCode === 'REQUIRED_STEP_UP_LEVEL_NOT_MET') {
      resetForm();
      await router.push({ name: 'create-schultraeger' }).then(() => {
        router.go(0);
      });
    } else {
      organisationStore.errorCode = '';
      await router.push({ name: 'create-schultraeger' });
    }
  }

  function preventNavigation(event: BeforeUnloadEvent): void {
    if (!isFormDirty()) return;
    event.preventDefault();
    /* Chrome requires returnValue to be set. */
    event.returnValue = '';
  }

  onMounted(async () => {
    organisationStore.createdSchultraeger = null;
    organisationStore.errorCode = '';
    await organisationStore.getRootKinderSchultraeger();

    if (rootChildSchultraegerList.value.length > 0) {
      const defaultSchultraegerform: string = rootChildSchultraegerList.value[0]?.id ?? '';
      selectedSchultraegerform.value = defaultSchultraegerform;
      initialSchultraegerformCache.value = defaultSchultraegerform;
    }
    /* listen for browser changes and prevent them when form is dirty */
    window.addEventListener('beforeunload', preventNavigation);
  });

  onBeforeRouteLeave((_to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
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
    <h1
      class="text-center headline"
      data-testid="admin-headline"
    >
      {{ $t('admin.headline') }}
    </h1>
    <LayoutCard
      :closable="!organisationStore.errorCode"
      @onCloseClicked="navigateToSchultraegerManagement"
      :header="$t('admin.schultraeger.addNew')"
      :padded="true"
      :showCloseText="true"
    >
      <!-- The form to create a new Schultraeger -->
      <template v-if="!organisationStore.createdSchultraeger">
        <SchultraegerForm
          :errorCode="organisationStore.errorCode"
          :isLoading="organisationStore.loading"
          :onHandleConfirmUnsavedChanges="handleConfirmUnsavedChanges"
          :onHandleDiscard="navigateToSchultraegerManagement"
          :onShowDialogChange="(value?: boolean) => (showUnsavedChangesDialog = value || false)"
          :onShowUnsavedChangesDialog="showUnsavedChangesDialog"
          :onSubmit="onSubmit"
          :rootChildSchultraegerList="rootChildSchultraegerList"
          v-model:selectedSchultraegerform="selectedSchultraegerform"
          v-model:selectedSchultraegername="selectedSchultraegername"
          :selectedSchultraegernameProps="selectedSchultraegernameProps"
        >
          <!-- Error Message Display if error on submit -->
          <!-- To trigger unsaved changes dialog the alert has to be inside the form wrapper -->
          <SpshAlert
            :model-value="!!organisationStore.errorCode"
            :title="$t('admin.schultraeger.schultraegerCreateErrorTitle')"
            :type="'error'"
            :closable="false"
            :text="organisationStore.errorCode ? $t(`admin.schultraeger.errors.${organisationStore.errorCode}`) : ''"
            :showButton="true"
            :buttonText="$t('admin.schule.backToCreateSchule')"
            :buttonAction="navigateBackToSchultraegerForm"
            buttonClass="primary"
          />
        </SchultraegerForm>
      </template>
      <!-- Result template on success after submit (Present value in createdSchultraeger and no errorCode)  -->
      <template v-if="organisationStore.createdSchultraeger && !organisationStore.errorCode">
        <v-container class="new-schultraeger-success">
          <v-row justify="center">
            <v-col
              class="subtitle-1"
              cols="auto"
            >
              <span data-testid="schultraeger-success-text">{{
                $t('admin.schultraeger.schultraegerAddedSuccessfully')
              }}</span>
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
            <v-col class="text-body bold text-right"> {{ $t('admin.schultraeger.schultraegerform') }}: </v-col>
            <v-col class="text-body"
              ><span data-testid="created-schultraeger-form">{{ preservedSchultraegerform }}</span></v-col
            >
          </v-row>
          <v-row>
            <v-col class="text-body bold text-right"> {{ $t('admin.schultraeger.schultraegername') }}: </v-col>
            <v-col class="text-body"
              ><span data-testid="created-schultraeger-name">{{
                organisationStore.createdSchultraeger.name
              }}</span></v-col
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
                data-testid="back-to-list-button"
                @click="navigateToSchultraegerManagement"
                :block="mdAndDown"
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
                data-testid="create-another-schultraeger-button"
                @click="handleCreateAnotherSchultraeger"
                :block="mdAndDown"
              >
                {{ $t('admin.schultraeger.createAnother') }}
              </v-btn>
            </v-col>
          </v-row>
        </v-container>
      </template>
    </LayoutCard>
  </div>
</template>

<style></style>
