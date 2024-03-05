<script setup lang="ts">
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import { onMounted, onUnmounted, ref, type Ref } from 'vue';
  import { useI18n, type Composer } from 'vue-i18n';
  import SpshAlert from '@/components/alert/SpshAlert.vue';
  import {
    type Router,
    useRouter,
    onBeforeRouteLeave,
    type RouteLocationNormalized,
    type NavigationGuardNext,
  } from 'vue-router';
  import { useDisplay } from 'vuetify';
  import {
    useOrganisationStore,
    type OrganisationStore,
    CreateOrganisationBodyParamsTypEnum,
  } from '@/stores/OrganisationStore';
  import { useForm, type TypedSchema, type BaseFieldProps } from 'vee-validate';
  import FormWrapper from '@/components/form/FormWrapper.vue';
  import FormRow from '@/components/form/FormRow.vue';
  import { object, string } from 'yup';
  import { toTypedSchema } from '@vee-validate/yup';

  const { smAndDown }: { smAndDown: Ref<boolean> } = useDisplay();

  const { t }: Composer = useI18n({ useScope: 'global' });
  const router: Router = useRouter();
  const organisationStore: OrganisationStore = useOrganisationStore();

  const validationSchema: TypedSchema = toTypedSchema(
    object({
      selectedDienststellennummer: string().required(t('admin.schule.rules.dienststellennummer.required')),
      selectedSchulname: string()
        .matches(/^[A-Za-z]*[A-Za-zÀ-ÖØ-öø-ÿ-' ]*$/, t('admin.schule.rules.schulname.matches'))
        .required(t('admin.schule.rules.schulname.required')),
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

  type SchuleCreationForm = {
    selectedSchulform: string;
    selectedDienststellennummer: string;
    selectedSchulname: string;
  };

  // eslint-disable-next-line @typescript-eslint/typedef
  const { defineField, handleSubmit, isFieldDirty, resetForm } = useForm<SchuleCreationForm>({
    validationSchema,
  });

  const [selectedSchulform]: [Ref<string>, Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>] =
    defineField('selectedSchulform', vuetifyConfig);
  const [selectedSchulname, selectedSchulnameProps]: [
    Ref<string>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineField('selectedSchulname', vuetifyConfig);
  const [selectedDienststellennummer, selectedDienststellennummerProps]: [
    Ref<string>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineField('selectedDienststellennummer', vuetifyConfig);

  function isFormDirty(): boolean {
    return (
      isFieldDirty('selectedSchulform') ||
      isFieldDirty('selectedSchulname') ||
      isFieldDirty('selectedDienststellennummer')
    );
  }

  const showUnsavedChangesDialog: Ref<boolean> = ref(false);
  let blockedNext: () => void = () => {};

  onBeforeRouteLeave((_to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
    if (isFormDirty()) {
      showUnsavedChangesDialog.value = true;
      blockedNext = next;
    } else {
      next();
    }
  });

  const onSubmit: (e?: Event | undefined) => Promise<Promise<void> | undefined> = handleSubmit(async () => {
    if (selectedDienststellennummer.value && selectedSchulname.value) {
      await organisationStore.createOrganisation(
        selectedDienststellennummer.value,
        selectedSchulname.value,
        ' ',
        ' ',
        CreateOrganisationBodyParamsTypEnum.Schule,
      );
      resetForm();
    }
  });

  const handleCreateAnotherSchule = (): void => {
    organisationStore.createdOrganisation = null;
    resetForm();
    router.push({ name: 'create-schule' });
  };

  function handleConfirmUnsavedChanges(): void {
    blockedNext();
  }

  // TODO: Navigate back to Rolle-management for now until the list for Schulen is merged
  async function navigateToSchuleManagement(): Promise<void> {
    await router.push({ name: 'rolle-management' });
    organisationStore.createdOrganisation = null;
  }

  function navigateBackToSchuleForm(): void {
    organisationStore.errorCode = '';
  }

  function preventNavigation(event: BeforeUnloadEvent): void {
    if (!isFormDirty()) return;
    event.preventDefault();
    /* Chrome requires returnValue to be set. */
    event.returnValue = '';
  }

  onMounted(async () => {
    organisationStore.createdOrganisation = null;
    /* listen for browser changes and prevent them when form is dirty */
    window.addEventListener('beforeunload', preventNavigation);
  });

  onUnmounted(() => {
    window.removeEventListener('beforeunload', preventNavigation);
  });
</script>

<template>
  <div class="admin">
    <LayoutCard
      :closable="true"
      @onCloseClicked="navigateToSchuleManagement"
      :header="$t('admin.schule.addNew')"
      :padded="true"
      :showCloseText="true"
    >
      <!-- Error Message Display if error on submit -->
      <SpshAlert
        :model-value="!!organisationStore.errorCode"
        :title="t('admin.schule.schuleCreateErrorTitle')"
        :type="'error'"
        :closable="false"
        :text="$t('admin.schule.schuleCreateErrorText')"
        :showButton="true"
        :buttonText="$t('admin.schule.backToCreateSchule')"
        :buttonAction="navigateBackToSchuleForm"
        buttonClass="primary"
      />
      <!-- The form to create a new school (No created school yet and no errorCode) -->
      <template v-if="!organisationStore.createdOrganisation && !organisationStore.errorCode">
        <FormWrapper
          :confirmUnsavedChangesAction="handleConfirmUnsavedChanges"
          :createButtonLabel="$t('admin.schule.create')"
          :discardButtonLabel="$t('admin.schule.discard')"
          id="schule-creation-form"
          :onDiscard="navigateToSchuleManagement"
          @onShowDialogChange="(value: boolean) => (showUnsavedChangesDialog = value)"
          :onSubmit="onSubmit"
          :showUnsavedChangesDialog="showUnsavedChangesDialog"
        >
          <!-- Select school type. For now not bound to anything and just a UI element -->
          <v-row>
            <v-col>
              <h3 class="headline-3">1. {{ $t('admin.schule.assignSchulform') }}</h3>
            </v-col>
          </v-row>
          <v-row>
            <!-- Spacer column -->
            <v-col
              cols="4"
              class="d-none d-md-flex"
            ></v-col>
            <v-radio-group
              inline
              v-model="selectedSchulform"
            >
              <v-col
                cols="12"
                sm="4"
                class="pb-0"
              >
                <v-radio
                  :label="$t('admin.schule.publicSchule')"
                  :value="$t('admin.schule.publicSchule')"
                ></v-radio>
              </v-col>
              <v-col
                cols="12"
                sm="4"
                class="pt-0 pt-sm-3 pb-0"
              >
                <v-radio
                  :label="$t('admin.schule.ersatzschule')"
                  :value="$t('admin.schule.ersatzschule')"
                ></v-radio>
              </v-col>
            </v-radio-group>
          </v-row>
          <!-- Enter service number -->
          <v-row>
            <v-col>
              <h3 class="headline-3">2. {{ $t('admin.schule.enterDienststellennummer') }}</h3>
            </v-col>
          </v-row>
          <FormRow
            :errorLabel="selectedDienststellennummerProps['error']"
            labelForId="dienststellennummer-input"
            :isRequired="true"
            :label="$t('admin.schule.dienststellennummer')"
          >
            <v-text-field
              data-testid="dienststellennummer-input"
              v-bind="selectedDienststellennummerProps"
              v-model="selectedDienststellennummer"
              :placeholder="$t('admin.schule.dienststellennummer')"
              variant="outlined"
              density="compact"
            ></v-text-field>
          </FormRow>
          <!-- select school name -->
          <v-row>
            <v-col>
              <h3 class="headline-3">3. {{ $t('admin.schule.enterSchulname') }}</h3>
            </v-col>
          </v-row>
          <FormRow
            :errorLabel="selectedSchulnameProps['error']"
            labelForId="schulname-input"
            :isRequired="true"
            :label="$t('admin.schule.schulname')"
          >
            <v-text-field
              data-testid="schul-name-input"
              v-bind="selectedSchulnameProps"
              v-model="selectedSchulname"
              :placeholder="$t('admin.schule.schulname')"
              variant="outlined"
              density="compact"
              required
            ></v-text-field>
          </FormRow>
        </FormWrapper>
      </template>
      <!-- Result template on success after submit (Present value in createdSchule and no errorCode)  -->
      <template v-if="organisationStore.createdOrganisation && !organisationStore.errorCode">
        <v-container class="new-schule-success">
          <v-row justify="center">
            <v-col
              class="subtitle-1"
              cols="auto"
            >
              {{ $t('admin.schule.schuleAddedSuccessfully') }}
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
            <v-col class="text-body bold text-right"> {{ $t('admin.schule.schulform') }}: </v-col>
            <v-col class="text-body"> {{ selectedSchulform }}</v-col>
          </v-row>
          <v-row>
            <v-col class="text-body bold text-right"> {{ $t('admin.schule.dienststellennummer') }}: </v-col>
            <v-col class="text-body"> {{ organisationStore.createdOrganisation.kennung }}</v-col>
          </v-row>
          <v-row>
            <v-col class="text-body bold text-right"> {{ $t('admin.schule.schulname') }}: </v-col>
            <v-col class="text-body"> {{ organisationStore.createdOrganisation.name }}</v-col>
          </v-row>
          <v-divider
            class="border-opacity-100 rounded my-6"
            color="#E5EAEF"
            thickness="6"
          ></v-divider>
          <v-row justify="end">
            <v-col
              cols="12"
              md="auto"
            >
              <v-btn
                class="secondary"
                data-testid="back-to-list-button"
                @click="navigateToSchuleManagement"
                :block="smAndDown"
                >{{ $t('nav.backToList') }}</v-btn
              >
            </v-col>
            <v-col
              cols="12"
              md="auto"
            >
              <v-btn
                class="primary button"
                data-testid="create-another-schule-button"
                @click="handleCreateAnotherSchule"
                :block="smAndDown"
              >
                {{ $t('admin.schule.createAnother') }}
              </v-btn>
            </v-col>
          </v-row>
        </v-container>
      </template>
    </LayoutCard>
  </div>
</template>

<style></style>
