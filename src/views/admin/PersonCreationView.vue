<script setup lang="ts">
  import { useOrganisationStore, type OrganisationStore, type Organisation } from '@/stores/OrganisationStore';
  import {
    usePersonStore,
    type CreatedPerson,
    type CreatedPersonenkontext,
    type PersonStore,
  } from '@/stores/PersonStore';
  import { type RolleResponse, RollenArt } from '@/stores/RolleStore';
  import { type ComputedRef, computed, onMounted, onUnmounted, type Ref, ref, watch } from 'vue';
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

  const router: Router = useRouter();
  const personStore: PersonStore = usePersonStore();
  const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();
  const organisationStore: OrganisationStore = useOrganisationStore();
  const { t }: Composer = useI18n({ useScope: 'global' });

  const showUnsavedChangesDialog: Ref<boolean> = ref(false);
  let blockedNext: () => void = () => {};
  let timerId: ReturnType<typeof setTimeout>;

  const searchInputRollen: Ref<string> = ref('');
  const searchInputOrganisation: Ref<string> = ref('');
  const searchInputKlasse: Ref<string> = ref('');

  type RolleWithRollenart = {
    value: string;
    title: string;
    Rollenart: RollenArt;
  };

  // Watcher to detect when the search input for Rollen has 3 or more characters to trigger filtering.
  watch(searchInputRollen, async (newValue: string, _oldValue: string) => {
    if (newValue.length >= 3) {
      personenkontextStore.getPersonenkontextRolleWithFilter(newValue, 25);
    }
  });

  const rollen: ComputedRef<RolleWithRollenart[] | undefined> = computed(() => {
    // If searchInput is less than 3 characters, return the initial 25 roles from the rolleStore
    if (searchInputRollen.value.length < 3) {
      return personenkontextStore.filteredRollen?.moeglicheRollen
        .slice(0, 25)
        .map((rolle: RolleResponse) => ({
          value: rolle.id,
          title: rolle.name,
          Rollenart: rolle.rollenart, // Include Rollenart in the object
        }))
        .sort((a: TranslatedObject, b: TranslatedObject) => a.title.localeCompare(b.title));
    } else {
      // Once filtering is applied, map the filteredRollen for the autocomplete
      return personenkontextStore.filteredRollen?.moeglicheRollen
        .slice(0, 25)
        .map((rolle: RolleResponse) => ({
          value: rolle.id,
          title: rolle.name,
          Rollenart: rolle.rollenart, // Include Rollenart in the object
        }))
        .sort((a: TranslatedObject, b: TranslatedObject) => a.title.localeCompare(b.title));
    }
  });

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

  type TranslatedObject = {
    value: string;
    title: string;
  };

  // eslint-disable-next-line @typescript-eslint/typedef
  const { defineField, handleSubmit, isFieldDirty, resetForm, resetField } = useForm<PersonCreationForm>({
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
  const [selectedKlasse, selectedKlasseProps]: [
    Ref<string>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineField('selectedKlasse', vuetifyConfig);

  // Watcher to detect when the Rolle is selected so the Organisationen show all the possible choices using that value.
  watch(selectedRolle, (newValue: string, oldValue: string) => {
    // This checks if `selectedRolle` is cleared or set to a falsy value
    if (!newValue) {
      resetField('selectedOrganisation');
      return;
    }

    if (newValue !== oldValue) {
      // Call fetch with an empty string to get the initial organizations for the selected role without any filter
      personenkontextStore.getPersonenkontextAdministrationsebeneWithFilter(newValue, '', 25);
    }
  });

  // Watcher to detect when the Organisationsebene is selected so the Klasse show all the possible choices using that value.
  watch(selectedOrganisation, (newValue: string, oldValue: string) => {
    // This checks if `selectedOrganisation` is cleared or set to a falsy value
    if (!newValue) {
      resetField('selectedKlasse');
      return;
    }

    if (newValue !== oldValue) {
      // Call fetch with an empty string to get the initial organizations for the selected role without any filter
      organisationStore.getKlassenByOrganisationId(newValue);
    }
  });

  const organisationen: ComputedRef<TranslatedObject[] | undefined> = computed(() => {
    return personenkontextStore.filteredOrganisationen?.moeglicheSsks
      .slice(0, 25)
      .map((org: Organisation) => ({
        value: org.id,
        title: org.kennung ? `${org.kennung} (${org.name})` : org.name,
      }))
      .sort((a: TranslatedObject, b: TranslatedObject) => a.title.localeCompare(b.title));
  });

  const klassen: ComputedRef<TranslatedObject[] | undefined> = computed(() => {
    return organisationStore.klassen
      .slice(0, 25)
      .map((org: Organisation) => ({
        value: org.id,
        title: org.name,
      }))
      .sort((a: TranslatedObject, b: TranslatedObject) => a.title.localeCompare(b.title));
  });

  const translatedOrganisationsname: ComputedRef<string> = computed(
    () =>
      organisationen.value?.find(
        (organisation: TranslatedObject) =>
          organisation.value === personenkontextStore.createdPersonenkontextForOrganisation?.organisationId,
      )?.title || '',
  );

  const translatedRollenname: ComputedRef<string> = computed(
    () =>
      rollen.value?.find(
        (rolle: TranslatedObject) =>
          rolle.value === personenkontextStore.createdPersonenkontextForOrganisation?.rolleId,
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

    await personStore.createPerson(unpersistedPerson);
    if (personStore.createdPerson) {
      // Build the context for the organisation
      const unpersistedOrganisationPersonenkontext: CreatedPersonenkontext = {
        personId: personStore.createdPerson.person.id,
        organisationId: selectedOrganisation.value,
        rolleId: selectedRolle.value,
      };
      await personenkontextStore
        .createPersonenkontext(unpersistedOrganisationPersonenkontext, PersonenKontextTyp.Organisation)
        .catch(() => {
          creationErrorText.value = t(`admin.personenkontext.errors.${personenkontextStore.errorCode}`);
        });
      // Build the context for the Klasse and save it only if the the Klasse was selected
      if (selectedKlasse.value) {
        const unpersistedKlassePersonenkontext: CreatedPersonenkontext = {
          personId: personStore.createdPerson.person.id,
          organisationId: selectedKlasse.value,
          rolleId: selectedRolle.value,
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

  function updateKlasseSearch(searchValue: string): void {
    /* cancel pending call */
    clearTimeout(timerId);
    /* delay new call 500ms */
    timerId = setTimeout(() => {
      organisationStore.getKlassenByOrganisationId(selectedOrganisation.value, searchValue);
    }, 500);
  }

  function updateOrganisationSearch(searchValue: string): void {
    /* cancel pending call */
    clearTimeout(timerId);
    /* delay new call 500ms */
    timerId = setTimeout(() => {
      personenkontextStore.getPersonenkontextAdministrationsebeneWithFilter(selectedRolle.value, searchValue, 25);
    }, 500);
  }

  function updateRollenSearch(searchValue: string): void {
    /* cancel pending call */
    clearTimeout(timerId);
    /* delay new call 500ms */
    timerId = setTimeout(() => {
      personenkontextStore.getPersonenkontextRolleWithFilter(searchValue, 25);
    }, 500);
  }

  onMounted(async () => {
    await organisationStore.getAllOrganisationen();
    await personenkontextStore.getPersonenkontextRolleWithFilter('', 25);
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
      :text="creationErrorText"
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
          <v-autocomplete
            autocomplete="off"
            clearable
            data-testid="rolle-select"
            density="compact"
            id="rolle-select"
            ref="rolle-select"
            :items="rollen"
            item-value="value"
            item-text="title"
            :no-data-text="$t('noDataFound')"
            :placeholder="$t('admin.rolle.selectRolle')"
            required="true"
            @update:search="updateRollenSearch"
            variant="outlined"
            v-bind="selectedRolleProps"
            v-model="selectedRolle"
            v-model:search="searchInputRollen"
          ></v-autocomplete>
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

          <!-- Organisation zuordnen -->
          <v-row>
            <h3 class="headline-3">3. {{ $t('admin.organisation.assignOrganisation') }}</h3>
          </v-row>
          <FormRow
            :errorLabel="selectedOrganisationProps['error']"
            :isRequired="true"
            labelForId="organisation-select"
            :label="$t('admin.organisation.organisation')"
          >
            <v-autocomplete
              autocomplete="off"
              clearable
              data-testid="organisation-select"
              density="compact"
              id="organisation-select"
              ref="organisation-select"
              :items="organisationen"
              item-value="value"
              item-text="title"
              :no-data-text="$t('noDataFound')"
              :placeholder="$t('admin.organisation.selectOrganisation')"
              required="true"
              @update:search="updateOrganisationSearch"
              variant="outlined"
              v-bind="selectedOrganisationProps"
              v-model="selectedOrganisation"
              v-model:search="searchInputOrganisation"
            ></v-autocomplete>
          </FormRow>
          <!-- Klasse zuordnen -->
          <FormRow
            v-if="isLernRolle(selectedRolle) && selectedOrganisation"
            :errorLabel="selectedKlasseProps['error']"
            :isRequired="true"
            labelForId="klasse-select"
            :label="$t('admin.klasse.klasse')"
          >
            <v-autocomplete
              autocomplete="off"
              clearable
              data-testid="klasse-select"
              density="compact"
              id="klasse-select"
              ref="klasse-select"
              :items="klassen"
              item-value="value"
              item-text="title"
              :no-data-text="$t('noDataFound')"
              :placeholder="$t('admin.klasse.selectKlasse')"
              @update:search="updateKlasseSearch"
              variant="outlined"
              v-bind="selectedKlasseProps"
              v-model="selectedKlasse"
              v-model:search="searchInputKlasse"
            ></v-autocomplete>
          </FormRow>
        </div>
      </FormWrapper>
    </template>

    <!-- Result template on success after submit  -->
    <template v-if="personStore.createdPerson && !personStore.errorCode">
      <v-container>
        <v-row justify="center">
          <v-col
            class="subtitle-1"
            cols="auto"
          >
            <span data-testid="person-success-text">
              {{
                $t('admin.person.addedSuccessfully', {
                  firstname: personStore.createdPerson.person.name.vorname,
                  lastname: personStore.createdPerson.person.name.familienname,
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
              personStore.createdPerson.person.name.vorname
            }}</span></v-col
          >
        </v-row>
        <v-row>
          <v-col class="text-body bold text-right"> {{ $t('person.lastName') }}: </v-col>
          <v-col class="text-body"
            ><span data-testid="created-person-familienname">{{
              personStore.createdPerson.person.name.familienname
            }}</span></v-col
          >
        </v-row>
        <v-row>
          <v-col class="text-body bold text-right"> {{ $t('person.userName') }}: </v-col>
          <v-col class="text-body"
            ><span data-testid="created-person-username">{{ personStore.createdPerson.person.referrer }}</span></v-col
          >
        </v-row>
        <v-row class="align-center">
          <v-col class="text-body bold text-right pb-8">{{ $t('admin.person.startPassword') }}: </v-col>
          <v-col class="text-body">
            <PasswordOutput :password="personStore.createdPerson.person.startpasswort"></PasswordOutput>
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
