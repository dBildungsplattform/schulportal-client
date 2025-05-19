<script setup lang="ts">
  import KopersInput from '@/components/admin/personen/KopersInput.vue';
  import PersonenkontextCreate from '@/components/admin/personen/PersonenkontextCreate.vue';
  import SpshAlert from '@/components/alert/SpshAlert.vue';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import FormRow from '@/components/form/FormRow.vue';
  import FormWrapper from '@/components/form/FormWrapper.vue';
  import PasswordOutput from '@/components/form/PasswordOutput.vue';
  import { useKlassen } from '@/composables/useKlassen';
  import { useOrganisationen } from '@/composables/useOrganisationen';
  import { useRollen, type TranslatedRolleWithAttrs } from '@/composables/useRollen';
  import {
    usePersonenkontextStore,
    type DbiamCreatePersonenkontextBodyParams,
    type DBiamPersonenkontextResponse,
    type PersonenkontextStore,
  } from '@/stores/PersonenkontextStore';
  import { usePersonStore, type CreatePersonBodyParams, type PersonStore } from '@/stores/PersonStore';
  import { RollenArt } from '@/stores/RolleStore';
  import { type TranslatedObject } from '@/types.d';
  import { isBefristungspflichtRolle, useBefristungUtils, type BefristungUtilsType } from '@/utils/befristung';
  import { formatDateToISO, getNextSchuljahresende, isValidDate, notInPast } from '@/utils/date';
  import { DDMMYYYY, DIN_91379A, NO_LEADING_TRAILING_SPACES } from '@/utils/validation';
  import { isKopersRolle } from '@/utils/validationPersonenkontext';
  import { toTypedSchema } from '@vee-validate/yup';
  import { useForm, type BaseFieldProps, type FormContext, type TypedSchema } from 'vee-validate';
  import { computed, onMounted, onUnmounted, ref, watch, type ComputedRef, type Ref } from 'vue';
  import { useI18n, type Composer } from 'vue-i18n';
  import {
    onBeforeRouteLeave,
    useRouter,
    type NavigationGuardNext,
    type RouteLocationNormalized,
    type Router,
  } from 'vue-router';
  import { useDisplay } from 'vuetify';
  import { array, object, string, StringSchema, type AnyObject } from 'yup';

  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();

  const router: Router = useRouter();
  const personStore: PersonStore = usePersonStore();
  const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();
  const { t }: Composer = useI18n({ useScope: 'global' });

  const showUnsavedChangesDialog: Ref<boolean> = ref(false);
  let blockedNext: () => void = () => {};

  const canCommit: Ref<boolean> = ref(false);
  const hasNoKopersNr: Ref<boolean | undefined> = ref(false);
  const showNoKopersNrConfirmationDialog: Ref<boolean> = ref(false);

  const calculatedBefristung: Ref<string | undefined> = ref('');

  const selectedOrgaCache: Ref<string | undefined> = ref(undefined);
  const selectedKlasseCache: Ref<string | undefined> = ref(undefined);
  const selectedRolleCache: Ref<string[] | undefined> = ref(undefined);

  const filteredRollen: Ref<TranslatedRolleWithAttrs[] | undefined> = ref<TranslatedRolleWithAttrs[] | undefined>([]);
  const filteredRollenCache: Ref<TranslatedRolleWithAttrs[] | undefined> = ref<TranslatedRolleWithAttrs[] | undefined>(
    [],
  );

  // Define a method to check if the selected Rolle is of type "Lern"
  function isLernRolle(selectedRolleIds?: string[]): boolean | undefined {
    if (!Array.isArray(selectedRolleIds)) return false;

    return filteredRollenCache.value?.some(
      (rolle: TranslatedRolleWithAttrs) => selectedRolleIds.includes(rolle.value) && rolle.rollenart === RollenArt.Lern,
    );
  }

  const validationSchema: TypedSchema = toTypedSchema(
    object({
      selectedRollen: array()
        .of(string().required(t('admin.rolle.rules.rolle.required')))
        .min(1, t('admin.rolle.rules.rolle.required')),
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
      selectedKlasse: string().when('selectedRollen', {
        is: (selectedRolleIds: string[]) => isLernRolle(selectedRolleIds),
        then: (schema: StringSchema<string | undefined, AnyObject, undefined, ''>) =>
          schema.required(t('admin.klasse.rules.klasse.required')),
      }),
      selectedKopersNr: string()
        .matches(NO_LEADING_TRAILING_SPACES, t('admin.person.rules.kopersNr.noLeadingTrailingSpaces'))
        .when('selectedRollen', {
          is: (selectedRolleIds: string[]) =>
            isKopersRolle(selectedRolleIds, filteredRollen.value) && !hasNoKopersNr.value,
          then: (schema: StringSchema<string | undefined, AnyObject, undefined, ''>) =>
            schema.required(t('admin.person.rules.kopersNr.required')),
        }),
      selectedBefristung: string()
        .test('notInPast', t('admin.befristung.rules.pastDateNotAllowed'), notInPast)
        .test('isValidDate', t('admin.befristung.rules.invalidDateNotAllowed'), isValidDate)
        .matches(DDMMYYYY, t('admin.befristung.rules.format'))
        .when(['selectedRolle', 'selectedBefristungOption'], {
          is: (selectedRolleIds: string[], selectedBefristungOption: string | undefined) =>
            isBefristungspflichtRolle(selectedRolleIds) && selectedBefristungOption === undefined,
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
    selectedOrganisation: string;
    selectedRollen: string[];
    selectedVorname: string;
    selectedFamilienname: string;
    selectedKlasse: string;
    selectedBefristung: Date;
    selectedBefristungOption: string;
    selectedKopersNr: string;
  };

  const formContext: FormContext<PersonCreationForm, PersonCreationForm> = useForm<PersonCreationForm>({
    validationSchema,
  });

  const [selectedOrganisation, selectedOrganisationProps]: [
    Ref<string | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = formContext.defineField('selectedOrganisation', vuetifyConfig);
  const [selectedRollen, selectedRollenProps]: [
    Ref<string[] | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = formContext.defineField('selectedRollen', vuetifyConfig);
  const [selectedVorname, selectedVornameProps]: [
    Ref<string>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = formContext.defineField('selectedVorname', vuetifyConfig);
  const [selectedFamilienname, selectedFamiliennameProps]: [
    Ref<string>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = formContext.defineField('selectedFamilienname', vuetifyConfig);
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
  const [selectedKopersNr, selectedKopersNrProps]: [
    Ref<string | undefined | null>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = formContext.defineField('selectedKopersNr', vuetifyConfig);

  const {
    handleBefristungUpdate,
    handleBefristungOptionUpdate,
    setupWatchers,
    setupRolleWatcher,
  }: BefristungUtilsType = useBefristungUtils({
    formContext,
    selectedBefristung,
    selectedBefristungOption,
    calculatedBefristung,
    selectedRollen,
  });

  setupWatchers();
  setupRolleWatcher();

  const rollen: ComputedRef<TranslatedRolleWithAttrs[] | undefined> = useRollen();
  const organisationen: ComputedRef<TranslatedObject[] | undefined> = useOrganisationen();
  const klassen: ComputedRef<TranslatedObject[] | undefined> = useKlassen();

  // Watch the selectedRollen and update filteredRollen accordingly
  watch(
    selectedRollen,
    (newSelectedRollen: string[] | undefined) => {
      if (newSelectedRollen && newSelectedRollen.length > 0) {
        const selectedRollenart: RollenArt | undefined = rollen.value?.find((rolle: TranslatedRolleWithAttrs) =>
          newSelectedRollen.includes(rolle.value),
        )?.rollenart;
        // Update filteredRollen based on selected rollen and their rollenart
        filteredRollen.value = rollen.value?.filter(
          (rolle: TranslatedRolleWithAttrs) => rolle.rollenart === selectedRollenart,
        );
      } else if (newSelectedRollen && newSelectedRollen.length === 0) {
        // If selectedRollen is empty, display all rollen
        filteredRollen.value = [];
      }
    },
    { immediate: true },
  );

  // Extract the created Klassenzuordnungen from the response after submission
  const klasseZuordnungFromCreatedKontext: ComputedRef<DBiamPersonenkontextResponse[]> = computed(() => {
    if (!personenkontextStore.createdPersonWithKontext) return [];

    return personenkontextStore.createdPersonWithKontext.dBiamPersonenkontextResponses.filter(
      (kontext: DBiamPersonenkontextResponse) =>
        kontext.organisationId === selectedKlasseCache.value && selectedRolleCache.value?.includes(kontext.rolleId),
    );
  });

  // Extract the created Schulenzuordnung from the response after submission
  const schuleZuordnungFromCreatedKontext: ComputedRef<DBiamPersonenkontextResponse[]> = computed(() => {
    if (!personenkontextStore.createdPersonWithKontext) return [];

    return personenkontextStore.createdPersonWithKontext.dBiamPersonenkontextResponses.filter(
      (kontext: DBiamPersonenkontextResponse) =>
        kontext.organisationId === selectedOrgaCache.value && selectedRolleCache.value?.includes(kontext.rolleId),
    );
  });

  // We extract the first Organisation since all of the Kontexte have the same one
  const translatedOrganisationsname: ComputedRef<string> = computed(() => {
    if (!schuleZuordnungFromCreatedKontext.value.length) return '';

    return (
      organisationen.value?.find(
        (organisation: TranslatedObject) =>
          organisation.value === schuleZuordnungFromCreatedKontext.value[0]?.organisationId,
      )?.title || ''
    );
  });

  // Extract all the Rollennamen
  const translatedRollenname: ComputedRef<string[]> = computed(() => {
    if (!schuleZuordnungFromCreatedKontext.value.length) return [];

    return schuleZuordnungFromCreatedKontext.value.map(
      (kontext: DBiamPersonenkontextResponse) =>
        rollen.value?.find((rolle: TranslatedObject) => rolle.value === kontext.rolleId)?.title || '',
    );
  });

  // We extract the first Klasse since all of the Kontexte have the same one
  const translatedKlassenname: ComputedRef<string> = computed(() => {
    if (!klasseZuordnungFromCreatedKontext.value.length) return '';

    return (
      klassen.value?.find(
        (klasse: TranslatedObject) => klasse.value === klasseZuordnungFromCreatedKontext.value[0]?.organisationId,
      )?.title || ''
    );
  });

  // Converts the ISO UTC formatted Befristung to the german local format, also ISO.
  const translatedBefristung: ComputedRef<string> = computed(() => {
    const ISOFormattedDate: string | undefined = schuleZuordnungFromCreatedKontext.value[0]?.befristung;

    if (!ISOFormattedDate) {
      return t('admin.befristung.unlimitedLower');
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
      formContext.isFieldDirty('selectedRollen') ||
      formContext.isFieldDirty('selectedKlasse') ||
      formContext.isFieldDirty('selectedKopersNr') ||
      formContext.isFieldDirty('selectedVorname') ||
      formContext.isFieldDirty('selectedFamilienname') ||
      formContext.isFieldDirty('selectedBefristung')
    );
  }

  async function navigateToPersonTable(): Promise<void> {
    if (
      personStore.errorCode === 'REQUIRED_STEP_UP_LEVEL_NOT_MET' ||
      personenkontextStore.errorCode === 'REQUIRED_STEP_UP_LEVEL_NOT_MET'
    ) {
      formContext.resetForm();
    } else {
      personenkontextStore.createdPersonWithKontext = null;
    }
    await router.push({ name: 'person-management' }).then(() => {
      router.go(0);
    });
  }

  async function navigateToPersonDetails(): Promise<void> {
    await router.push({
      name: 'person-details',
      params: { id: personenkontextStore.createdPersonWithKontext?.person.id },
    });
  }

  function handleFieldReset(field: string): void {
    if (field === 'selectedRollen') {
      selectedRollen.value = undefined;
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

    // This is used to cache the filtered Rollen to use for isLernRolle and isKopersRolle in the success template
    filteredRollenCache.value = filteredRollen.value;

    const bodyParams: CreatePersonBodyParams = {
      familienname: selectedFamilienname.value as string,
      vorname: selectedVorname.value as string,
      personalnummer: selectedKopersNr.value as string,
      befristung: formattedBefristung,
      createPersonenkontexte:
        selectedRollen.value?.map(
          (rolleId: string) =>
            ({
              organisationId: selectedOrganisation.value as string,
              rolleId,
            }) as DbiamCreatePersonenkontextBodyParams,
        ) || [],
    };
    // Klasse is only allowed if the selectedRolle is of type LERN.
    if (
      selectedKlasse.value &&
      selectedRollen.value &&
      selectedRollen.value.length > 0 &&
      isLernRolle(selectedRollen.value)
    ) {
      selectedKlasseCache.value = JSON.parse(JSON.stringify(selectedKlasse.value));
      for (const rolleId of selectedRollen.value)
        bodyParams.createPersonenkontexte.push({
          organisationId: selectedKlasse.value,
          rolleId: rolleId,
        });
    }
    // We save a copy of the selected values because they are not available anymore since we reset the form right after submitting
    // This will then be used to display the organisation again in the success template after receiving the orga ID and rolle ID back from the BE.
    selectedOrgaCache.value = JSON.parse(JSON.stringify(selectedOrganisation.value));
    selectedRolleCache.value = JSON.parse(JSON.stringify(selectedRollen.value));
    await personenkontextStore.createPersonWithKontexte(bodyParams);
    formContext.resetForm();
    hasNoKopersNr.value = false;
    filteredRollen.value = [];
  }

  watch(hasNoKopersNr, async (newValue: boolean | undefined) => {
    if (newValue) {
      showNoKopersNrConfirmationDialog.value = true;
    }
  });

  const onSubmit: (e?: Event | undefined) => Promise<void | undefined> = formContext.handleSubmit(() => {
    createPerson();
  });

  async function navigateBackToPersonForm(): Promise<void> {
    if (
      personStore.errorCode === 'REQUIRED_STEP_UP_LEVEL_NOT_MET' ||
      personenkontextStore.errorCode === 'REQUIRED_STEP_UP_LEVEL_NOT_MET'
    ) {
      formContext.resetForm();
      await router.push({ name: 'create-person' }).then(() => {
        router.go(0);
      });
    } else {
      personenkontextStore.errorCode = '';
      personStore.errorCode = '';
      await router.push({ name: 'create-person' });
    }
  }

  const handleCreateAnotherPerson = (): void => {
    personenkontextStore.createdPersonWithKontext = null;
    formContext.resetForm();
    hasNoKopersNr.value = false;
    // Re-trigger the watchers after resetting the form to auto-select the Befristung since the component isn't remounted
    // Because we navigate to the same route.
    setupWatchers();
    router.push({ name: 'create-person' });
  };

  // Computed property to check if the second radio button should be disabled
  const isUnbefristetButtonDisabled: ComputedRef<boolean> = computed(() => {
    return isBefristungspflichtRolle(selectedRollen.value);
  });

  function handleConfirmUnsavedChanges(): void {
    blockedNext();
    personStore.errorCode = '';
    personenkontextStore.errorCode = '';
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
      :closable="!personenkontextStore.errorCode && !personStore.errorCode"
      :header="$t('admin.person.addNew')"
      @onCloseClicked="navigateToPersonTable"
      :padded="true"
      :showCloseText="true"
    >
      <!-- The form to create a new Person  -->
      <template v-if="!personenkontextStore.createdPersonWithKontext">
        <FormWrapper
          :canCommit="canCommit"
          :confirmUnsavedChangesAction="handleConfirmUnsavedChanges"
          :createButtonLabel="$t('admin.person.create')"
          :discardButtonLabel="$t('admin.person.discard')"
          :hideActions="!!personenkontextStore.errorCode || !!personStore.errorCode"
          id="person-creation-form"
          :isLoading="personenkontextStore.loading"
          :onDiscard="navigateToPersonTable"
          @onShowDialogChange="(value?: boolean) => (showUnsavedChangesDialog = value || false)"
          :onSubmit="onSubmit"
          :showUnsavedChangesDialog="showUnsavedChangesDialog"
        >
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

          <template v-if="!personenkontextStore.errorCode && !personStore.errorCode">
            <!-- Organisation, Rolle, Klasse und Befristung zuordnen -->
            <PersonenkontextCreate
              :allowMultipleRollen="true"
              :showHeadline="true"
              :organisationen="organisationen"
              ref="personenkontext-create"
              :rollen="(filteredRollen?.length ?? 0) === 0 ? rollen : filteredRollen"
              :klassen="klassen"
              :selectedOrganisationProps="selectedOrganisationProps"
              :selectedRollenProps="selectedRollenProps"
              :selectedKlasseProps="selectedKlasseProps"
              :befristungInputProps="{
                befristungProps: selectedBefristungProps,
                befristungOptionProps: selectedBefristungOptionProps,
                isUnbefristetDisabled: isUnbefristetButtonDisabled,
                isBefristungRequired: isBefristungspflichtRolle(selectedRollen),
                nextSchuljahresende: getNextSchuljahresende(),
                befristung: selectedBefristung,
                befristungOption: selectedBefristungOption,
              }"
              v-model:selectedOrganisation="selectedOrganisation"
              v-model:selectedRollen="selectedRollen"
              v-model:selectedKlasse="selectedKlasse"
              @update:canCommit="canCommit = $event"
              @update:befristung="handleBefristungUpdate"
              @update:calculatedBefristungOption="handleBefristungOptionUpdate"
              @fieldReset="handleFieldReset"
            />
            <div v-if="selectedOrganisation">
              <v-row>
                <h3 class="headline-3">4. {{ $t('admin.person.personalInfo') }}</h3>
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
              <KopersInput
                v-if="isKopersRolle(selectedRollen, filteredRollen) && selectedOrganisation"
                :hasNoKopersNr="hasNoKopersNr"
                v-model:selectedKopersNr="selectedKopersNr"
                ref="kopers-input"
                :selectedKopersNrProps="selectedKopersNrProps"
                @update:selectedKopersNr="(value?: string | null) => (selectedKopersNr = value)"
                @update:hasNoKopersNr="(value: boolean | undefined) => (hasNoKopersNr = value)"
              ></KopersInput>
            </div>
          </template>
        </FormWrapper>
      </template>

      <!-- Result template on success after submit  -->
      <template
        v-if="
          personenkontextStore.createdPersonWithKontext && !personStore.errorCode && !personenkontextStore.errorCode
        "
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
          <v-row
            v-if="
              isKopersRolle(
                schuleZuordnungFromCreatedKontext.map((kontext: DBiamPersonenkontextResponse) => kontext.rolleId),
                filteredRollenCache,
              )
            "
          >
            <v-col
              :class="`${
                isKopersRolle(
                  schuleZuordnungFromCreatedKontext.map((kontext: DBiamPersonenkontextResponse) => kontext.rolleId),
                  filteredRollenCache,
                ) && personenkontextStore.createdPersonWithKontext.person.personalnummer
                  ? 'text-body bold text-right'
                  : 'text-body bold text-right text-red'
              }`"
            >
              {{ $t('person.kopersNr') }}:
            </v-col>
            <v-col
              :class="`${
                isKopersRolle(
                  schuleZuordnungFromCreatedKontext.map((kontext: DBiamPersonenkontextResponse) => kontext.rolleId),
                  filteredRollenCache,
                ) && personenkontextStore.createdPersonWithKontext.person.personalnummer
                  ? 'text-body'
                  : 'text-body text-red'
              }`"
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
              ><span data-testid="created-person-rolle">{{ translatedRollenname.join(', ') }}</span></v-col
            >
          </v-row>
          <v-row>
            <v-col class="text-body bold text-right"> {{ $t('admin.befristung.befristung') }}: </v-col>
            <v-col class="text-body"
              ><span data-testid="created-person-befristung">{{ translatedBefristung }}</span></v-col
            >
          </v-row>
          <v-row
            v-if="
              isLernRolle(
                klasseZuordnungFromCreatedKontext.map((kontext: DBiamPersonenkontextResponse) => kontext.rolleId),
              )
            "
          >
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
                @click.stop="navigateToPersonDetails"
                data-testid="to-details-button"
                :block="mdAndDown"
              >
                {{ $t('nav.toDetails') }}
              </v-btn>
            </v-col>
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
  </div>
</template>

<style></style>
