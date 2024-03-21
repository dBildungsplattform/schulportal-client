<script setup lang="ts">
  import { useOrganisationStore, type OrganisationStore, type Organisation } from '@/stores/OrganisationStore';
  import {
    usePersonStore,
    type CreatedPerson,
    type CreatedPersonenkontext,
    type PersonStore,
    type PersonendatensatzResponse,
  } from '@/stores/PersonStore';
  import { type RolleStore, useRolleStore, type Rolle } from '@/stores/RolleStore';
  import { type ComputedRef, computed, onMounted, onUnmounted, type Ref, ref } from 'vue';
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
  import FormWrapper from '@/components/form/FormWrapper.vue';
  import FormRow from '@/components/form/FormRow.vue';
  import { DIN_91379A } from '@/utils/validation';

  const router: Router = useRouter();
  const personStore: PersonStore = usePersonStore();
  const organisationStore: OrganisationStore = useOrganisationStore();
  const rolleStore: RolleStore = useRolleStore();
  const { t }: Composer = useI18n({ useScope: 'global' });

  const showUnsavedChangesDialog: Ref<boolean> = ref(false);
  let blockedNext: () => void = () => {};

  const validationSchema: TypedSchema = toTypedSchema(
    object({
      selectedRolle: string().required(t('admin.rolle.rules.rolle.required')),
      selectedVorname: string()
        .matches(DIN_91379A, t('admin.person.rules.vorname.matches'))
        .min(2, t('admin.person.rules.vorname.min'))
        .required(t('admin.person.rules.vorname.required')),
      selectedFamilienname: string()
        .matches(DIN_91379A, t('admin.person.rules.familienname.matches'))
        .min(2, t('admin.person.rules.familienname.min'))
        .required(t('admin.person.rules.familienname.required')),
      selectedOrganisation: string().required(t('admin.organisation.rules.organisation.required')),
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
    selectedRolle: string;
    selectedVorname: string;
    selectedFamilienname: string;
    selectedOrganisation: string;
  };

  type TranslatedObject = {
    value: string;
    title: string;
  };

  // eslint-disable-next-line @typescript-eslint/typedef
  const { defineField, handleSubmit, isFieldDirty, resetForm } = useForm<PersonCreationForm>({
    validationSchema,
  });

  const [selectedRolle, selectedRolleProps]: [
    Ref<string>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineField('selectedRolle', vuetifyConfig);
  const [selectedVorname, selectedVornameProps]: [
    Ref<string>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineField('selectedVorname', vuetifyConfig);
  const [selectedFamilienname, selectedFamiliennameProps]: [
    Ref<string>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineField('selectedFamilienname', vuetifyConfig);
  const [selectedOrganisation, selectedOrganisationProps]: [
    Ref<string>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineField('selectedOrganisation', vuetifyConfig);

  const rollen: ComputedRef<TranslatedObject[]> = computed(() =>
    rolleStore.allRollen.map((rolle: Rolle) => ({
      value: rolle.id,
      title: rolle.name,
    })),
  );

  const organisationen: ComputedRef<TranslatedObject[]> = computed(() =>
    organisationStore.allOrganisationen.map((org: Organisation) => ({
      value: org.id,
      title: `${org.kennung} (${org.name})`,
    })),
  );

  const translatedOrganisationsname: ComputedRef<string> = computed(
    () =>
      organisationen.value.find(
        (organisation: TranslatedObject) => organisation.value === personStore.createdPersonenkontext?.organisationId,
      )?.title || '',
  );

  const translatedRollenname: ComputedRef<string> = computed(
    () =>
      rollen.value.find((rolle: TranslatedObject) => rolle.value === personStore.createdPersonenkontext?.rolleId)
        ?.title || '',
  );

  function isFormDirty(): boolean {
    return isFieldDirty('selectedVorname') || isFieldDirty('selectedFamilienname');
  }

  async function navigateToPersonTable(): Promise<void> {
    await router.push({ name: 'person-management' });
    personStore.createdPerson = null;
  }

  async function createPerson(): Promise<void> {
    const unpersistedPerson: CreatedPerson = {
      name: {
        familienname: selectedFamilienname.value as string,
        vorname: selectedVorname.value as string,
      },
    };
    personStore.createPerson(unpersistedPerson).then(async (personResponse: PersonendatensatzResponse) => {
      const unpersistedPersonenkontext: CreatedPersonenkontext = {
        personId: personResponse.person.id,
        organisationId: selectedOrganisation.value,
        rolleId: selectedRolle.value,
      };
      await personStore.createPersonenkontext(unpersistedPersonenkontext);
      resetForm();
    });
  }

  const onSubmit: (e?: Event | undefined) => Promise<void | undefined> = handleSubmit(() => {
    createPerson();
  });

  async function navigateBackToPersonForm(): Promise<void> {
    await router.push({ name: 'create-person' });
    personStore.errorCode = '';
  }

  const handleCreateAnotherPerson = (): void => {
    personStore.createdPerson = null;
    resetForm();
    router.push({ name: 'create-person' });
  };

  function handleConfirmUnsavedChanges(): void {
    blockedNext();
  }

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

  onMounted(async () => {
    await organisationStore.getAllOrganisationen();
    await rolleStore.getAllRollen();
    personStore.errorCode = '';
    personStore.createdPerson = null;

    /* listen for browser changes and prevent them when form is dirty */
    window.addEventListener('beforeunload', preventNavigation);
  });

  onUnmounted(() => {
    window.removeEventListener('beforeunload', preventNavigation);
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
      :buttonAction="navigateBackToPersonForm"
      :text="$t('admin.person.creationErrorText')"
    />

    <!-- The form to create a new Person  -->
    <template v-if="!personStore.createdPerson && !personStore.errorCode">
      <FormWrapper
        :confirmUnsavedChangesAction="handleConfirmUnsavedChanges"
        :createButtonLabel="$t('admin.person.create')"
        :discardButtonLabel="$t('admin.person.discard')"
        id="person-creation-form"
        :onDiscard="navigateToPersonTable"
        @onShowDialogChange="(value: boolean) => (showUnsavedChangesDialog = value)"
        :onSubmit="onSubmit"
        :showUnsavedChangesDialog="showUnsavedChangesDialog"
      >
        <!-- Rollenzuordnung -->
        <v-row>
          <h3 class="headline-3">1. {{ $t('admin.rolle.assignRolle') }}</h3>
        </v-row>
        <FormRow
          :errorLabel="selectedRolleProps['error']"
          labelForId="rolle-select"
          :isRequired="true"
          :label="$t('admin.rolle.rolle')"
        >
          <v-select
            clearable
            data-testid="rolle-select"
            density="compact"
            id="rolle-select"
            :items="rollen"
            item-value="value"
            item-text="title"
            :placeholder="$t('admin.rolle.selectRolle')"
            required="true"
            variant="outlined"
            v-bind="selectedRolleProps"
            v-model="selectedRolle"
          ></v-select>
        </FormRow>

        <!-- Persönliche Informationen -->
        <div v-if="selectedRolle">
          <v-row>
            <h3 class="headline-3">2. {{ $t('admin.person.personalInfo') }}</h3>
          </v-row>
          <!-- Vorname -->
          <FormRow
            :errorLabel="selectedVornameProps['error']"
            labelForId="vorname-input"
            :isRequired="true"
            :label="$t('person.firstName')"
          >
            <v-text-field
              clearable
              data-testid="vorname-input"
              density="compact"
              id="vorname-input"
              :placeholder="$t('person.enterFirstName')"
              required="true"
              variant="outlined"
              v-bind="selectedVornameProps"
              v-model="selectedVorname"
            ></v-text-field>
          </FormRow>

          <!-- Nachname -->
          <FormRow
            :errorLabel="selectedFamiliennameProps['error']"
            labelForId="familienname-input"
            :isRequired="true"
            :label="$t('person.lastName')"
          >
            <v-text-field
              clearable
              data-testid="familienname-input"
              density="compact"
              id="familienname-input"
              :placeholder="$t('person.enterLastName')"
              required="true"
              variant="outlined"
              v-bind="selectedFamiliennameProps"
              v-model="selectedFamilienname"
            ></v-text-field>
          </FormRow>

          <!-- Organisation zuordnen -->
          <v-row>
            <h3 class="headline-3">3. {{ $t('admin.organisation.assignOrganisation') }}</h3>
          </v-row>
          <FormRow
            :errorLabel="selectedOrganisationProps['error']"
            :isRequired="true"
            labelForId="organisation-select"
            :label="$t('admin.organisation.assignOrganisation')"
          >
            <v-select
              clearable
              data-testid="organisation-select"
              density="compact"
              id="organisation-select"
              :items="organisationen"
              item-value="value"
              item-text="title"
              :placeholder="$t('admin.organisation.selectOrganisation')"
              required="true"
              variant="outlined"
              v-bind="selectedOrganisationProps"
              v-model="selectedOrganisation"
            ></v-select>
          </FormRow>
        </div>
      </FormWrapper>
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
        <v-row>
          <v-col class="text-body bold text-right"> {{ $t('admin.rolle.rolle') }}: </v-col>
          <v-col class="text-body"> {{ translatedRollenname }}</v-col>
        </v-row>
        <v-row>
          <v-col class="text-body bold text-right"> {{ $t('admin.organisation.organisation') }}: </v-col>
          <v-col class="text-body"> {{ translatedOrganisationsname }}</v-col>
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
