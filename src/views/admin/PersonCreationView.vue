<script setup lang="ts">
  import {
    usePersonStore,
    type CreatePersonBodyParams,
    type CreatedPersonenkontext,
    type PersonStore,
  } from '@/stores/PersonStore';
  import { RollenArt } from '@/stores/RolleStore';
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
  import { object, string, StringSchema, type AnyObject } from 'yup';
  import { toTypedSchema } from '@vee-validate/yup';
  import SpshAlert from '@/components/alert/SpshAlert.vue';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import PasswordOutput from '@/components/form/PasswordOutput.vue';
  import FormWrapper from '@/components/form/FormWrapper.vue';
  import FormRow from '@/components/form/FormRow.vue';
  import {
    PersonenKontextTyp,
    usePersonenkontextStore,
    type PersonenkontextStore,
  } from '@/stores/PersonenkontextStore';
  import { useDisplay } from 'vuetify';

  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();
  import { DIN_91379A } from '@/utils/validation';
  import { useOrganisationen } from '@/composables/useOrganisationen';
  import { useRollen } from '@/composables/useRollen';
  import { useKlassen } from '@/composables/useKlassen';
  import PersonenkontextCreate from '@/components/admin/personen/PersonenkontextCreate.vue';
  import { type TranslatedObject } from '@/types.d';

  const router: Router = useRouter();
  const personStore: PersonStore = usePersonStore();
  const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();
  const { t }: Composer = useI18n({ useScope: 'global' });

  const showUnsavedChangesDialog: Ref<boolean> = ref(false);
  let blockedNext: () => void = () => {};

  const canCommit: Ref<boolean> = ref(false);

  type RolleWithRollenart = {
    value: string;
    title: string;
    Rollenart: RollenArt;
  };

  const rollen: ComputedRef<RolleWithRollenart[] | undefined> = useRollen();

  // Define a method to check if the selected Rolle is of type "Lern"
  function isLernRolle(selectedRolleId: string): boolean {
    const rolle: RolleWithRollenart | undefined = rollen.value?.find(
      (r: RolleWithRollenart) => r.value === selectedRolleId,
    );
    return !!rolle && rolle.Rollenart === RollenArt.Lern;
  }

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
      selectedKlasse: string().when('selectedRolle', {
        is: (selectedRolleId: string) => isLernRolle(selectedRolleId),
        then: (schema: StringSchema<string | undefined, AnyObject, undefined, ''>) =>
          schema.required(t('admin.klasse.rules.klasse.required')),
      }),
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
    selectedKlasse: string;
  };

  // eslint-disable-next-line @typescript-eslint/typedef
  const { defineField, handleSubmit, isFieldDirty, resetForm } = useForm<PersonCreationForm>({
    validationSchema,
  });

  const [selectedRolle, selectedRolleProps]: [
    Ref<string | undefined>,
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
  const [selectedKlasse, selectedKlasseProps]: [
    Ref<string | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineField('selectedKlasse', vuetifyConfig);

  const organisationen: ComputedRef<TranslatedObject[] | undefined> = useOrganisationen();

  const klassen: ComputedRef<TranslatedObject[] | undefined> = useKlassen();

  const translatedOrganisationsname: ComputedRef<string> = computed(
    () =>
      organisationen.value?.find(
        (organisation: TranslatedObject) =>
          organisation.value ===
          personenkontextStore.createdPersonWithKontext?.DBiamPersonenkontextResponse.organisationId,
      )?.title || '',
  );

  const translatedRollenname: ComputedRef<string> = computed(
    () =>
      rollen.value?.find(
        (rolle: TranslatedObject) =>
          rolle.value === personenkontextStore.createdPersonWithKontext?.DBiamPersonenkontextResponse.rolleId,
      )?.title || '',
  );

  const translatedKlassenname: ComputedRef<string> = computed(
    () =>
      klassen.value?.find(
        (klasse: TranslatedObject) =>
          klasse.value === personenkontextStore.createdPersonenkontextForKlasse?.organisationId,
      )?.title || '',
  );

  const creationErrorText: Ref<string> = ref('');

  function isFormDirty(): boolean {
    return (
      isFieldDirty('selectedOrganisation') ||
      isFieldDirty('selectedRolle') ||
      isFieldDirty('selectedKlasse') ||
      isFieldDirty('selectedVorname') ||
      isFieldDirty('selectedFamilienname')
    );
  }

  async function navigateToPersonTable(): Promise<void> {
    await router.push({ name: 'person-management' });
    personenkontextStore.createdPersonWithKontext = null;
    personenkontextStore.createdPersonenkontextForKlasse = null;
  }

  function handleFieldReset(field: string): void {
    if (field === 'selectedRolle') {
      selectedRolle.value = undefined;
    } else if (field === 'selectedKlasse') {
      selectedKlasse.value = undefined;
    }
  }

  async function createPerson(): Promise<void> {
    const bodyParams: CreatePersonBodyParams = {
      familienname: selectedFamilienname.value as string,
      vorname: selectedVorname.value as string,
      organisationId: selectedOrganisation.value,
      rolleId: selectedRolle.value ?? '',
    };

    await personenkontextStore.createPersonWithKontext(bodyParams);
    if (personenkontextStore.createdPersonWithKontext) {
      // Build the context for the Klasse and save it only if the the Klasse was selected
      if (selectedKlasse.value) {
        const unpersistedKlassePersonenkontext: CreatedPersonenkontext = {
          personId: personenkontextStore.createdPersonWithKontext.person.id,
          organisationId: selectedKlasse.value,
          rolleId: selectedRolle.value ?? '',
        };
        await personenkontextStore
          .createPersonenkontext(unpersistedKlassePersonenkontext, PersonenKontextTyp.Klasse)
          .catch(() => {
            creationErrorText.value = t(`admin.personenkontext.errors.${personenkontextStore.errorCode}`);
          });
      }
      resetForm();
    }
  }

  const onSubmit: (e?: Event | undefined) => Promise<void | undefined> = handleSubmit(() => {
    createPerson();
  });

  async function navigateBackToPersonForm(): Promise<void> {
    await router.push({ name: 'create-person' });
    personStore.errorCode = '';
  }

  const handleCreateAnotherPerson = (): void => {
    personenkontextStore.createdPersonWithKontext = null;
    personenkontextStore.createdPersonenkontextForKlasse = null;
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
    await personenkontextStore.processWorkflowStep();
    personStore.errorCode = '';
    personenkontextStore.createdPersonWithKontext = null;
    personenkontextStore.createdPersonenkontextForKlasse = null;

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
      :text="creationErrorText"
    />

    <!-- The form to create a new Person  -->
    <template v-if="!personenkontextStore.createdPersonWithKontext && !personStore.errorCode">
      <FormWrapper
        :canCommit="canCommit"
        :confirmUnsavedChangesAction="handleConfirmUnsavedChanges"
        :createButtonLabel="$t('admin.person.create')"
        :discardButtonLabel="$t('admin.person.discard')"
        id="person-creation-form"
        :onDiscard="navigateToPersonTable"
        @onShowDialogChange="(value: boolean | undefined) => (showUnsavedChangesDialog = value || false)"
        :onSubmit="onSubmit"
        :showUnsavedChangesDialog="showUnsavedChangesDialog"
      >
        <!-- Organisation, Rolle, Klasse zuordnen -->
        <PersonenkontextCreate
          :showHeadline="true"
          :organisationen="organisationen"
          :rollen="rollen"
          :klassen="klassen"
          :selectedOrganisationProps="selectedOrganisationProps"
          :selectedRolleProps="selectedRolleProps"
          :selectedKlasseProps="selectedKlasseProps"
          v-model:selectedOrganisation="selectedOrganisation"
          v-model:selectedRolle="selectedRolle"
          v-model:selectedKlasse="selectedKlasse"
          @update:selectedOrganisation="(value: string) => (selectedOrganisation = value)"
          @update:selectedRolle="(value: string | undefined) => (selectedRolle = value)"
          @update:selectedKlasse="(value: string | undefined) => (selectedKlasse = value)"
          @update:canCommit="canCommit = $event"
          @fieldReset="handleFieldReset"
        />
        <div v-if="selectedOrganisation">
          <v-row>
            <h3 class="headline-3">3. {{ $t('admin.person.personalInfo') }}</h3>
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
              ref="vorname-input"
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
              ref="familienname-input"
              :placeholder="$t('person.enterLastName')"
              required="true"
              variant="outlined"
              v-bind="selectedFamiliennameProps"
              v-model="selectedFamilienname"
            ></v-text-field>
          </FormRow>
        </div>
      </FormWrapper>
    </template>

    <!-- Result template on success after submit  -->
    <template v-if="personenkontextStore.createdPersonWithKontext && !personStore.errorCode">
      <v-container>
        <v-row justify="center">
          <v-col
            class="subtitle-1"
            cols="auto"
          >
            <span data-testid="person-success-text">
              {{
                $t('admin.person.addedSuccessfully', {
                  firstname: personenkontextStore.createdPersonWithKontext.person.name.vorname,
                  lastname: personenkontextStore.createdPersonWithKontext.person.name.familienname,
                })
              }}
            </span>
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
          <v-col class="text-body"
            ><span data-testid="created-person-vorname">{{
              personenkontextStore.createdPersonWithKontext.person.name.vorname
            }}</span></v-col
          >
        </v-row>
        <v-row>
          <v-col class="text-body bold text-right"> {{ $t('person.lastName') }}: </v-col>
          <v-col class="text-body"
            ><span data-testid="created-person-familienname">{{
              personenkontextStore.createdPersonWithKontext.person.name.familienname
            }}</span></v-col
          >
        </v-row>
        <v-row>
          <v-col class="text-body bold text-right"> {{ $t('person.userName') }}: </v-col>
          <v-col class="text-body"
            ><span data-testid="created-person-username">{{
              personenkontextStore.createdPersonWithKontext.person.referrer
            }}</span></v-col
          >
        </v-row>
        <v-row class="align-center">
          <v-col class="text-body bold text-right pb-8">{{ $t('admin.person.startPassword') }}: </v-col>
          <v-col class="text-body">
            <PasswordOutput
              :password="personenkontextStore.createdPersonWithKontext.person.startpasswort"
            ></PasswordOutput>
          </v-col>
        </v-row>
        <v-row>
          <v-col class="text-body bold text-right"> {{ $t('admin.rolle.rolle') }}: </v-col>
          <v-col class="text-body"
            ><span data-testid="created-person-rolle">{{ translatedRollenname }}</span></v-col
          >
        </v-row>
        <v-row>
          <v-col class="text-body bold text-right"> {{ $t('admin.organisation.organisation') }}: </v-col>
          <v-col class="text-body"
            ><span data-testid="created-person-organisation">{{ translatedOrganisationsname }}</span></v-col
          >
        </v-row>
        <v-row>
          <v-col class="text-body bold text-right"> {{ $t('admin.klasse.klasse') }}: </v-col>
          <v-col class="text-body"
            ><span data-testid="created-person-klasse">{{
              translatedKlassenname ? translatedKlassenname : '---'
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
              @click.stop="navigateToPersonTable"
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
              @click="handleCreateAnotherPerson"
              data-testid="create-another-person-button"
              :block="mdAndDown"
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
