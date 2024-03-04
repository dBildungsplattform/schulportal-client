<script setup lang="ts">
  import { useOrganisationStore, type OrganisationStore, type Organisation } from '@/stores/OrganisationStore';
  import { usePersonStore, type CreatedPerson, type PersonStore } from '@/stores/PersonStore';
  import { onMounted, type Ref, ref, type ComputedRef, computed } from 'vue';
  import {
    onBeforeRouteLeave,
    type Router,
    useRouter,
    type RouteLocationNormalized,
    type NavigationGuardNext,
  } from 'vue-router';
  import { type Composer, useI18n } from 'vue-i18n';
  import { useForm, type TypedSchema, type BaseFieldProps } from 'vee-validate';
  import { object, string } from 'yup';
  import { toTypedSchema } from '@vee-validate/yup';
  import SpshAlert from '@/components/alert/SpshAlert.vue';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import PasswordOutput from '@/components/form/PasswordOutput.vue';
  import CreationForm from '@/components/form/CreationForm.vue';
  import InputRow from '@/components/form/InputRow.vue';

  const router: Router = useRouter();
  const personStore: PersonStore = usePersonStore();
  const organisationStore: OrganisationStore = useOrganisationStore();
  const { t }: Composer = useI18n({ useScope: 'global' });

  const isFormDirty: Ref<boolean> = ref(false);
  const showUnsavedChangesDialog: Ref<boolean> = ref(false);
  let blockedNext: () => void = () => {};

  const validationSchema: TypedSchema = toTypedSchema(
    object({
      selectedVorname: string()
        .matches(/^[A-Za-z]*[A-Za-zÀ-ÖØ-öø-ÿ-' ]*$/, t('admin.person.rules.vorname.matches'))
        .min(2, t('admin.person.rules.vorname.min'))
        .required(t('admin.person.rules.vorname.required')),
      selectedFamilienname: string()
        .matches(/^[A-Za-z]*[A-Za-zÀ-ÖØ-öø-ÿ-' ]*$/, t('admin.person.rules.familienname.matches'))
        .min(2, t('admin.person.rules.familienname.min'))
        .required(t('admin.person.rules.familienname.required')),
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

  type PersonCreationForm = {
    selectedVorname: string;
    selectedFamilienname: string;
    selectedSchule: string;
  };

  // eslint-disable-next-line @typescript-eslint/typedef
  const { defineField, handleSubmit, resetForm } = useForm<PersonCreationForm>({
    validationSchema,
  });

  const [selectedVorname, selectedVornameProps]: [
    Ref<string>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineField('selectedVorname', vuetifyConfig);
  const [selectedFamilienname, selectedFamiliennameProps]: [
    Ref<string>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineField('selectedFamilienname', vuetifyConfig);
  const [selectedSchule, selectedSchuleProps]: [
    Ref<string>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineField('selectedSchule', vuetifyConfig);

  const schulen: ComputedRef<
    {
      value: string;
      title: string;
    }[]
  > = computed(() =>
    organisationStore.allOrganisationen.map((org: Organisation) => ({
      value: org.id,
      title: `${org.kennung} (${org.name})`,
    })),
  );

  function navigateToPersonTable(): void {
    router.push({ name: 'person-management' });
    personStore.createdPerson = null;
  }

  function createPerson(): void {
    const unpersistedPerson: CreatedPerson = {
      name: {
        familienname: selectedFamilienname.value as string,
        vorname: selectedVorname.value as string,
      },
    };
    personStore.createPerson(unpersistedPerson);
  }

  const onSubmit: (e?: Event | undefined) => Promise<void | undefined> = handleSubmit(() => {
    createPerson();
  });

  const handleAlertClose = (): void => {
    personStore.errorCode = '';
  };

  const handleCreateAnotherPerson = (): void => {
    personStore.createdPerson = null;
    resetForm();
    router.push({ name: 'create-person' });
  };

  function handleConfirmUnsavedChanges(): void {
    blockedNext();
  }

  function handleDirtyModels(value: boolean): void {
    if (value) {
      isFormDirty.value = value;
    }
  }

  onBeforeRouteLeave((_to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
    if (isFormDirty.value) {
      showUnsavedChangesDialog.value = true;
      blockedNext = next;
    } else {
      next();
    }
  });

  onMounted(async () => {
    await organisationStore.getAllOrganisationen();
    personStore.errorCode = '';
  });
</script>

<template>
  <LayoutCard
    :closable="true"
    :header="$t('admin.person.addNew')"
    @onCloseClicked="navigateToPersonTable"
    :padded="true"
    :showCloseText="true"
  >
    <!-- Error Message Display -->
    <SpshAlert
      :model-value="!!personStore.errorCode"
      :title="$t('admin.person.creationErrorTitle')"
      :type="'error'"
      :closable="false"
      :showButton="true"
      :buttonText="$t('admin.backToForm')"
      :text="$t('admin.person.creationErrorText')"
      @update:modelValue="handleAlertClose"
    />

    <!-- The form to create a new Person  -->
    <template v-if="!personStore.createdPerson && !personStore.errorCode">
      <CreationForm
        :confirmUnsavedChangesAction="handleConfirmUnsavedChanges"
        :createButtonLabel="$t('admin.person.create')"
        :discardButtonLabel="$t('admin.person.discard')"
        id="person-creation-form"
        :onDiscard="navigateToPersonTable"
        @onShowDialogChange="(value: boolean) => (showUnsavedChangesDialog = value)"
        :onSubmit="onSubmit"
        :resetForm="resetForm"
        :showUnsavedChangesDialog="showUnsavedChangesDialog"
      >
        <!-- Persönliche Informationen -->
        <v-row>
          <h3 class="headline-3">1. {{ $t('admin.person.personalInfo') }}</h3>
        </v-row>
        <!-- Vorname -->
        <InputRow
          :errorLabel="selectedVornameProps['error']"
          :fieldProps="selectedVornameProps"
          id="vorname-input"
          :isRequired="true"
          :label="$t('person.firstName')"
          @onDirtyModelValue="handleDirtyModels"
          :placeholder="$t('person.enterFirstName')"
          v-model="selectedVorname"
        ></InputRow>

        <!-- Nachname -->
        <InputRow
          :errorLabel="selectedFamiliennameProps['error']"
          :fieldProps="selectedFamiliennameProps"
          id="familienname-input"
          :isRequired="true"
          :label="$t('person.lastName')"
          @onDirtyModelValue="handleDirtyModels"
          :placeholder="$t('person.enterLastName')"
          v-model="selectedFamilienname"
        ></InputRow>

        <!-- Schule zuordnen -->
        <v-row>
          <h3 class="headline-3">2. {{ $t('admin.schule.assignSchule') }}</h3>
        </v-row>
        <!-- Vorname -->
        <InputRow
          :errorLabel="selectedSchuleProps['error']"
          :fieldProps="selectedSchuleProps"
          id="schule-select"
          :isSelect="true"
          :label="$t('admin.schule.assignSchule')"
          @onDirtyModelValue="handleDirtyModels"
          :placeholder="$t('admin.schule.selectSchule')"
          :selectableItems="schulen"
          v-model="selectedSchule"
        ></InputRow>
      </CreationForm>
    </template>

    <!-- Result template on success after submit  -->
    <template v-if="personStore.createdPerson && !personStore.errorCode">
      <v-container class="new-role-success">
        <v-row justify="center">
          <v-col
            class="subtitle-1"
            cols="auto"
          >
            {{
              $t('admin.person.addedSuccessfully', {
                firstname: personStore.createdPerson.person.name.vorname,
                lastname: personStore.createdPerson.person.name.familienname,
              })
            }}
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
          <v-col class="text-body bold text-right"> {{ $t('person.firstName') }}: </v-col>
          <v-col class="text-body"> {{ personStore.createdPerson.person.name.vorname }}</v-col>
        </v-row>
        <v-row>
          <v-col class="text-body bold text-right"> {{ $t('person.lastName') }}: </v-col>
          <v-col class="text-body"> {{ personStore.createdPerson.person.name.familienname }}</v-col>
        </v-row>
        <v-row>
          <v-col class="text-body bold text-right"> {{ $t('person.userName') }}: </v-col>
          <v-col class="text-body"> {{ personStore.createdPerson.person.referrer }}</v-col>
        </v-row>
        <v-row class="align-center">
          <v-col class="text-body bold text-right pb-8"> {{ $t('admin.person.startPassword') }}: </v-col>
          <v-col class="text-body">
            <PasswordOutput :password="personStore.createdPerson.person.startpasswort"></PasswordOutput>
          </v-col>
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
              @click.stop="navigateToPersonTable"
              data-testid="back-to-list-button"
            >
              {{ $t('nav.backToList') }}
            </v-btn>
          </v-col>
          <v-col
            cols="12"
            md="auto"
          >
            <v-btn
              class="primary button"
              @click="handleCreateAnotherPerson"
              data-testid="create-another-person-button"
            >
              {{ $t('admin.person.createAnother') }}
            </v-btn>
          </v-col>
        </v-row>
      </v-container>
    </template>
  </LayoutCard>
</template>

<style></style>
