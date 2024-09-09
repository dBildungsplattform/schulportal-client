<script setup lang="ts">
  import {
    usePersonStore,
    type CreatePersonBodyParams,
    type CreatedPersonenkontext,
    type PersonStore,
  } from '@/stores/PersonStore';
  import { RollenArt, RollenMerkmal } from '@/stores/RolleStore';
  import { type ComputedRef, computed, onMounted, onUnmounted, type Ref, ref, watch } from 'vue';
  import {
    onBeforeRouteLeave,
    type Router,
    useRouter,
    type RouteLocationNormalized,
    type NavigationGuardNext,
  } from 'vue-router';
  import { type Composer, useI18n } from 'vue-i18n';
  import { useForm, type TypedSchema, type BaseFieldProps, type FormContext } from 'vee-validate';
  import { object, string, StringSchema, type AnyObject } from 'yup';
  import { toTypedSchema } from '@vee-validate/yup';
  import SpshAlert from '@/components/alert/SpshAlert.vue';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import PasswordOutput from '@/components/form/PasswordOutput.vue';
  import FormWrapper from '@/components/form/FormWrapper.vue';
  import FormRow from '@/components/form/FormRow.vue';
  import {
    BefristungOption,
    PersonenKontextTyp,
    usePersonenkontextStore,
    type PersonenkontextStore,
  } from '@/stores/PersonenkontextStore';
  import { useDisplay } from 'vuetify';

  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();
  import { DDMMYYYY, DIN_91379A, NO_LEADING_TRAILING_SPACES } from '@/utils/validation';
  import { useOrganisationen } from '@/composables/useOrganisationen';
  import { useRollen, type TranslatedRolleWithAttrs } from '@/composables/useRollen';
  import { useKlassen } from '@/composables/useKlassen';
  import PersonenkontextCreate from '@/components/admin/personen/PersonenkontextCreate.vue';
  import { type TranslatedObject } from '@/types.d';
  import { parse, isValid, isBefore } from 'date-fns';
  import BefristungComponent from '@/components/admin/personen/BefristungComponent.vue';
  import { getNextSchuljahresende, formatDateToISO } from '@/utils/dateUtils';
  import { isBefristungspflichtRolle, useBefristungUtils, type BefristungUtilsType } from '@/utils/befristungUtils';

  const router: Router = useRouter();
  const personStore: PersonStore = usePersonStore();
  const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();
  const { t }: Composer = useI18n({ useScope: 'global' });

  const showUnsavedChangesDialog: Ref<boolean> = ref(false);
  let blockedNext: () => void = () => {};

  const canCommit: Ref<boolean> = ref(false);
  const hasNoKopersNr: Ref<boolean> = ref(false);
  const showNoKopersNrConfirmationDialog: Ref<boolean> = ref(false);

  const calculatedBefristung: Ref<string | undefined> = ref('');

  const rollen: ComputedRef<TranslatedRolleWithAttrs[] | undefined> = useRollen();

  function isKopersRolle(selectedRolleId: string | undefined): boolean {
    const rolle: TranslatedRolleWithAttrs | undefined = rollen.value?.find(
      (r: TranslatedRolleWithAttrs) => r.value === selectedRolleId,
    );
    return !!rolle && !!rolle.merkmale && rolle.merkmale.has(RollenMerkmal.KopersPflicht);
  }

  // Define a method to check if the selected Rolle is of type "Lern"
  function isLernRolle(selectedRolleId: string): boolean {
    const rolle: TranslatedRolleWithAttrs | undefined = rollen.value?.find(
      (r: TranslatedRolleWithAttrs) => r.value === selectedRolleId,
    );
    return !!rolle && rolle.rollenart === RollenArt.Lern;
  }

  // Custom validation function to check if the date is in the past
  const notInPast = (value: string | undefined): boolean => {
    if (!value) return true;

    const parsedDate: Date = parse(value, 'dd.MM.yyyy', new Date());
    return isValid(parsedDate) && !isBefore(parsedDate, new Date());
  };

  const validationSchema: TypedSchema = toTypedSchema(
    object({
      selectedRolle: string().required(t('admin.rolle.rules.rolle.required')),
      selectedVorname: string()
        .matches(DIN_91379A, t('admin.person.rules.vorname.matches'))
        .matches(NO_LEADING_TRAILING_SPACES, t('admin.person.rules.vorname.noLeadingTrailingSpaces'))
        .min(2, t('admin.person.rules.vorname.min'))
        .required(t('admin.person.rules.vorname.required')),
      selectedFamilienname: string()
        .matches(DIN_91379A, t('admin.person.rules.familienname.matches'))
        .matches(NO_LEADING_TRAILING_SPACES, t('admin.person.rules.familienname.noLeadingTrailingSpaces'))
        .min(2, t('admin.person.rules.familienname.min'))
        .required(t('admin.person.rules.familienname.required')),
      selectedOrganisation: string().required(t('admin.organisation.rules.organisation.required')),
      selectedKlasse: string().when('selectedRolle', {
        is: (selectedRolleId: string) => isLernRolle(selectedRolleId),
        then: (schema: StringSchema<string | undefined, AnyObject, undefined, ''>) =>
          schema.required(t('admin.klasse.rules.klasse.required')),
      }),
      selectedKopersNr: string().when('selectedRolle', {
        is: (selectedRolleId: string) => isKopersRolle(selectedRolleId) && !hasNoKopersNr.value,
        then: (schema: StringSchema<string | undefined, AnyObject, undefined, ''>) =>
          schema.required(t('admin.person.rules.kopersNr.required')),
      }),
      selectedBefristung: string()
        .matches(DDMMYYYY, t('admin.befristung.rules.format'))
        .test('notInPast', t('admin.befristung.rules.pastDateNotAllowed'), notInPast)
        .when(['selectedRolle', 'selectedBefristungOption'], {
          is: (selectedRolleId: string, selectedBefristungOption: string | undefined) =>
            isBefristungspflichtRolle(selectedRolleId) && selectedBefristungOption === undefined,
          then: (schema: StringSchema<string | undefined, AnyObject, undefined, ''>) =>
            schema.required(t('admin.befristung.rules.required')),
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
    selectedBefristung: Date;
    selectedBefristungOption: string;
    selectedKopersNr: string;
  };

  const formContext: FormContext<PersonCreationForm, PersonCreationForm> = useForm<PersonCreationForm>({
    validationSchema,
  });

  const [selectedRolle, selectedRolleProps]: [
    Ref<string | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = formContext.defineField('selectedRolle', vuetifyConfig);
  const [selectedKopersNr, selectedKopersNrProps]: [
    Ref<string | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = formContext.defineField('selectedKopersNr', vuetifyConfig);
  const [selectedVorname, selectedVornameProps]: [
    Ref<string>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = formContext.defineField('selectedVorname', vuetifyConfig);
  const [selectedFamilienname, selectedFamiliennameProps]: [
    Ref<string>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = formContext.defineField('selectedFamilienname', vuetifyConfig);
  const [selectedOrganisation, selectedOrganisationProps]: [
    Ref<string | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = formContext.defineField('selectedOrganisation', vuetifyConfig);
  const [selectedKlasse, selectedKlasseProps]: [
    Ref<string | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = formContext.defineField('selectedKlasse', vuetifyConfig);
  const [selectedBefristung, selectedBefristungProps]: [
    Ref<string | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = formContext.defineField('selectedBefristung', vuetifyConfig);
  const [selectedBefristungOption, selectedBefristungOptionProps]: [
    Ref<string | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = formContext.defineField('selectedBefristungOption', vuetifyConfig);

  const { handleBefristungUpdate, handleBefristungOptionUpdate, setupWatchers }: BefristungUtilsType =
    useBefristungUtils({
      formContext,
      selectedBefristung,
      selectedBefristungOption,
      calculatedBefristung,
      selectedRolle,
    });

  setupWatchers();

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

  // Converts the ISO UTC formatted Befristung to the german local format, also ISO.
  const translatedBefristung: ComputedRef<string> = computed(() => {
    const ISOFormattedDate: string | undefined =
      personenkontextStore.createdPersonWithKontext?.DBiamPersonenkontextResponse.befristung;

    if (!ISOFormattedDate) {
      return t('admin.befristung.unlimitedSuccessTemplate');
    }

    // Parse the UTC date
    const utcDate: Date = new Date(ISOFormattedDate);

    // Subtract one day. The reason to substract it here is because when the UTC time from the backend gets converted back to the local german date here, it shows the next day
    // It's logical since we send the date in the first place as "31-07-2024 22H" UTC TIME which is "01-08-2024" 00H of the next day in MESZ (summer german time)
    // but the user obviously doesn't want to know that.
    if (utcDate.getTimezoneOffset() >= -120) {
      // Check if the timezone offset is 2 hours (indicating MESZ)
      // Subtract one day if in summer time (MESZ)
      utcDate.setDate(utcDate.getDate() - 1);
    }
    const germanDate: string = utcDate.toLocaleDateString('de-DE');

    return germanDate;
  });

  const creationErrorText: Ref<string> = ref('');

  function isFormDirty(): boolean {
    return (
      formContext.isFieldDirty('selectedOrganisation') ||
      formContext.isFieldDirty('selectedRolle') ||
      formContext.isFieldDirty('selectedKlasse') ||
      formContext.isFieldDirty('selectedKopersNr') ||
      formContext.isFieldDirty('selectedVorname') ||
      formContext.isFieldDirty('selectedFamilienname') ||
      formContext.isFieldDirty('selectedBefristung')
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
    const befristungDate: string | undefined = selectedBefristung.value
      ? selectedBefristung.value
      : calculatedBefristung.value;

    // Format the date in ISO 8601 format if it exists
    const formattedBefristung: string | undefined = befristungDate ? formatDateToISO(befristungDate) : undefined;

    const bodyParams: CreatePersonBodyParams = {
      familienname: selectedFamilienname.value as string,
      vorname: selectedVorname.value as string,
      personalnummer: selectedKopersNr.value,
      organisationId: selectedOrganisation.value as string,
      rolleId: selectedRolle.value ?? '',
      befristung: formattedBefristung,
    };

    await personenkontextStore.createPersonWithKontext(bodyParams);

    if (personenkontextStore.createdPersonWithKontext) {
      // Build the context for the Klasse and save it only if the Klasse was selected
      if (selectedKlasse.value) {
        const unpersistedKlassePersonenkontext: CreatedPersonenkontext = {
          personId: personenkontextStore.createdPersonWithKontext.person.id,
          organisationId: selectedKlasse.value,
          rolleId: selectedRolle.value ?? '',
          befristung: formattedBefristung,
        };

        await personenkontextStore
          .createPersonenkontext(unpersistedKlassePersonenkontext, PersonenKontextTyp.Klasse)
          .catch(() => {
            creationErrorText.value = t(`admin.personenkontext.errors.${personenkontextStore.errorCode}`);
          });
      }

      formContext.resetForm();
      hasNoKopersNr.value = false;
    }
  }

  watch(hasNoKopersNr, async (newValue: boolean) => {
    if (newValue) {
      showNoKopersNrConfirmationDialog.value = true;
    }
  });

  const onSubmit: (e?: Event | undefined) => Promise<void | undefined> = formContext.handleSubmit(() => {
    createPerson();
  });

  async function navigateBackToPersonForm(): Promise<void> {
    await router.push({ name: 'create-person' });
    personStore.errorCode = '';
    personenkontextStore.errorCode = '';
  }

  const handleCreateAnotherPerson = (): void => {
    personenkontextStore.createdPersonWithKontext = null;
    personenkontextStore.createdPersonenkontextForKlasse = null;
    formContext.resetForm();
    hasNoKopersNr.value = false;
    router.push({ name: 'create-person' });
  };

  // Watcher to reset the radio button in case the date was picked using date-input
  watch(
    selectedBefristung,
    (newValue: string | undefined) => {
      if (newValue) {
        selectedBefristungOption.value = undefined;
      }
    },
    { immediate: true },
  );

  // Watcher to set an initial value for the radio buttons depending on the selected Rolle
  watch(
    selectedRolle,
    (newValue: string | undefined) => {
      if (isBefristungspflichtRolle(newValue)) {
        selectedBefristungOption.value = BefristungOption.SCHULJAHRESENDE;
        calculatedBefristung.value = getNextSchuljahresende();
      } else {
        selectedBefristungOption.value = BefristungOption.UNBEFRISTET;
        calculatedBefristung.value = undefined;
      }
    },
    { immediate: true },
  );

  // Computed property to check if the second radio button should be disabled
  const isUnbefristetButtonDisabled: ComputedRef<boolean> = computed(() => {
    return isBefristungspflichtRolle(selectedRolle.value);
  });

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
    await personenkontextStore.processWorkflowStep({ limit: 25 });
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
    <!-- Error Message Display for error messages from the personStore -->
    <SpshAlert
      :model-value="!!personStore.errorCode"
      :title="$t('admin.person.creationErrorTitle')"
      :type="'error'"
      :closable="false"
      :showButton="true"
      :buttonText="$t('admin.person.backToCreatePerson')"
      :buttonAction="navigateBackToPersonForm"
      :text="creationErrorText"
    />

    <!-- Error Message Display for error messages from the personenkontextStore -->
    <SpshAlert
      :model-value="!!personenkontextStore.errorCode"
      :type="'error'"
      :closable="false"
      :text="t(`admin.personenkontext.errors.${personenkontextStore.errorCode}`)"
      :showButton="true"
      :buttonText="$t('admin.person.backToCreatePerson')"
      :buttonAction="navigateBackToPersonForm"
      :title="t(`admin.personenkontext.title.${personenkontextStore.errorCode}`)"
    />

    <!-- The form to create a new Person  -->
    <template
      v-if="!personenkontextStore.createdPersonWithKontext && !personStore.errorCode && !personenkontextStore.errorCode"
    >
      <FormWrapper
        :canCommit="canCommit"
        :confirmUnsavedChangesAction="handleConfirmUnsavedChanges"
        :createButtonLabel="$t('admin.person.create')"
        :discardButtonLabel="$t('admin.person.discard')"
        id="person-creation-form"
        :onDiscard="navigateToPersonTable"
        @onShowDialogChange="(value?: boolean) => (showUnsavedChangesDialog = value || false)"
        :onSubmit="onSubmit"
        :showUnsavedChangesDialog="showUnsavedChangesDialog"
      >
        <!-- Organisation, Rolle, Klasse zuordnen -->
        <PersonenkontextCreate
          :showHeadline="true"
          :organisationen="organisationen"
          ref="personenkontext-create"
          :rollen="rollen"
          :klassen="klassen"
          :selectedOrganisationProps="selectedOrganisationProps"
          :selectedRolleProps="selectedRolleProps"
          :selectedKlasseProps="selectedKlasseProps"
          v-model:selectedOrganisation="selectedOrganisation"
          v-model:selectedRolle="selectedRolle"
          v-model:selectedKlasse="selectedKlasse"
          @update:selectedOrganisation="(value?: string) => (selectedOrganisation = value)"
          @update:selectedRolle="(value?: string) => (selectedRolle = value)"
          @update:selectedKlasse="(value?: string) => (selectedKlasse = value)"
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

          <!-- No KoPers.-Nr. available checkbox
              We don't use the form row here to avoid margins and paddings -->
          <v-row
            class="align-center"
            v-if="isKopersRolle(selectedRolle) && selectedOrganisation"
          >
            <v-col
              class="py-0 pb-sm-8 pt-sm-3 text-sm-right"
              cols="12"
              sm="5"
            ></v-col>
            <v-checkbox
              data-testid="has-no-kopersnr-checkbox"
              :disabled="!!selectedKopersNr"
              hide-details
              :label="$t('admin.person.noKopersNr')"
              v-model="hasNoKopersNr"
            ></v-checkbox>
          </v-row>

          <!-- KoPers.-Nr. -->
          <FormRow
            v-if="isKopersRolle(selectedRolle) && selectedOrganisation && !hasNoKopersNr"
            :errorLabel="selectedKopersNrProps?.error || ''"
            :isRequired="!hasNoKopersNr"
            :label="$t('person.kopersNr')"
            labelForId="kopersnr-input"
            :noTopMargin="true"
          >
            <v-text-field
              clearable
              data-testid="kopersnr-input"
              density="compact"
              id="kopersnr-input"
              ref="kopersnr-input"
              :placeholder="$t('person.enterKopersNr')"
              :required="!hasNoKopersNr"
              variant="outlined"
              v-bind="selectedKopersNrProps"
              v-model="selectedKopersNr"
            ></v-text-field>
          </FormRow>
        </div>
        <!-- Befristung -->
        <div
          class="mt-4"
          v-if="selectedOrganisation && selectedRolle"
        >
          <BefristungComponent
            v-if="selectedOrganisation && selectedRolle"
            :befristungProps="selectedBefristungProps"
            :befristungOptionProps="selectedBefristungOptionProps"
            :isUnbefristetDisabled="isUnbefristetButtonDisabled"
            :isBefristungRequired="isBefristungspflichtRolle(selectedRolle)"
            :nextSchuljahresende="getNextSchuljahresende()"
            :befristung="selectedBefristung"
            :befristungOption="selectedBefristungOption"
            @update:befristung="handleBefristungUpdate"
            @update:befristungOption="handleBefristungOptionUpdate"
          />
        </div>
      </FormWrapper>
    </template>

    <!-- Result template on success after submit  -->
    <template
      v-if="personenkontextStore.createdPersonWithKontext && !personStore.errorCode && !personenkontextStore.errorCode"
    >
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
        <v-row v-if="isKopersRolle(personenkontextStore.createdPersonWithKontext.DBiamPersonenkontextResponse.rolleId)">
          <v-col
            :class="`${isKopersRolle(personenkontextStore.createdPersonWithKontext.DBiamPersonenkontextResponse.rolleId) && personenkontextStore.createdPersonWithKontext.person.personalnummer ? 'text-body bold text-right' : 'text-body bold text-right text-red'}`"
          >
            {{ $t('person.kopersNr') }}:
          </v-col>
          <v-col
            :class="`${isKopersRolle(personenkontextStore.createdPersonWithKontext.DBiamPersonenkontextResponse.rolleId) && personenkontextStore.createdPersonWithKontext.person.personalnummer ? 'text-body' : 'text-body text-red'}`"
            ><span data-testid="created-person-kopersNr">{{
              personenkontextStore.createdPersonWithKontext.person.personalnummer
                ? personenkontextStore.createdPersonWithKontext.person.personalnummer
                : $t('missing')
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
          <v-col class="text-body bold text-right"> {{ $t('admin.organisation.organisation') }}: </v-col>
          <v-col class="text-body"
            ><span data-testid="created-person-organisation">{{ translatedOrganisationsname }}</span></v-col
          >
        </v-row>
        <v-row>
          <v-col class="text-body bold text-right"> {{ $t('admin.rolle.rolle') }}: </v-col>
          <v-col class="text-body"
            ><span data-testid="created-person-rolle">{{ translatedRollenname }}</span></v-col
          >
        </v-row>
        <v-row>
          <v-col class="text-body bold text-right"> {{ $t('admin.befristung.befristung') }}: </v-col>
          <v-col class="text-body"
            ><span data-testid="created-person-befristung">{{ translatedBefristung }}</span></v-col
          >
        </v-row>
        <v-row v-if="isLernRolle(personenkontextStore.createdPersonWithKontext.DBiamPersonenkontextResponse.rolleId)">
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

  <v-dialog
    v-model="showNoKopersNrConfirmationDialog"
    persistent
  >
    <LayoutCard
      v-if="showNoKopersNrConfirmationDialog"
      :closable="false"
      :header="$t('admin.person.noKopersNr')"
    >
      <v-card-text>
        <v-container>
          <v-row class="text-body bold px-md-16">
            <v-col
              offset="1"
              cols="10"
            >
              <span data-testid="no-kopersnr-confirmation-text">
                {{ $t('admin.person.noKopersNrConfirmationDialogMessage') }}
              </span>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
      <v-card-actions class="justify-center">
        <v-row class="justify-center">
          <v-col
            cols="12"
            sm="6"
            md="4"
          >
            <v-btn
              :block="mdAndDown"
              class="secondary"
              @click.stop="
                showNoKopersNrConfirmationDialog = false;
                hasNoKopersNr = false;
              "
              data-testid="cancel-no-kopersnr-button"
            >
              {{ $t('cancel') }}
            </v-btn>
          </v-col>
          <v-col
            cols="12"
            sm="6"
            md="4"
          >
            <v-btn
              :block="mdAndDown"
              class="primary"
              @click.stop="showNoKopersNrConfirmationDialog = false"
              data-testid="confirm-no-kopersnr-button"
            >
              {{ $t('proceed') }}
            </v-btn>
          </v-col>
        </v-row>
      </v-card-actions>
    </LayoutCard>
  </v-dialog>
</template>

<style></style>
