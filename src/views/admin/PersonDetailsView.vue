<script setup lang="ts">
  import { type Ref, ref, onBeforeMount, computed, type ComputedRef, watch } from 'vue';
  import { type Router, type RouteLocationNormalizedLoaded, useRoute, useRouter } from 'vue-router';
  import { usePersonStore, type PersonStore, type PersonWithUebersicht } from '@/stores/PersonStore';
  import PasswordReset from '@/components/admin/personen/PasswordReset.vue';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import SpshAlert from '@/components/alert/SpshAlert.vue';
  import SpshTooltip from '@/components/admin/SpshTooltip.vue';
  import PersonDelete from '@/components/admin/personen/PersonDelete.vue';
  import PersonenkontextDelete from '@/components/admin/personen/PersonenkontextDelete.vue';
  import TwoFactorAuthenticationSetUp from '@/components/two-factor-authentication/TwoFactorAuthenticationSetUp.vue';
  import {
    BefristungOption,
    usePersonenkontextStore,
    type PersonenkontextStore,
    type Zuordnung,
  } from '@/stores/PersonenkontextStore';
  import {
    OrganisationsTyp,
    useOrganisationStore,
    type Organisation,
    type OrganisationStore,
  } from '@/stores/OrganisationStore';
  import { useAuthStore, type AuthStore } from '@/stores/AuthStore';
  import { useDisplay } from 'vuetify';
  import { object, string, StringSchema, type AnyObject } from 'yup';
  import { toTypedSchema } from '@vee-validate/yup';
  import { useForm, type BaseFieldProps, type TypedSchema } from 'vee-validate';
  import { RollenArt, RollenMerkmal } from '@/stores/RolleStore';
  import { type Composer, useI18n } from 'vue-i18n';
  import { useOrganisationen } from '@/composables/useOrganisationen';
  import { useRollen, type TranslatedRolleWithAttrs } from '@/composables/useRollen';
  import { useKlassen } from '@/composables/useKlassen';
  import PersonenkontextCreate from '@/components/admin/personen/PersonenkontextCreate.vue';
  import { type TranslatedObject } from '@/types.d';
  import KlasseChange from '@/components/admin/klassen/KlasseChange.vue';
  import {
    useTwoFactorAuthentificationStore,
    type TwoFactorAuthentificationStore,
  } from '@/stores/TwoFactorAuthentificationStore';
  import { DDMMYYYY } from '@/utils/validation';
  import { isBefore, isValid, parse } from 'date-fns';
  import BefristungComponent from '@/components/admin/personen/BefristungComponent.vue';

  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();

  const { t }: Composer = useI18n({ useScope: 'global' });

  const route: RouteLocationNormalizedLoaded = useRoute();
  const router: Router = useRouter();
  const currentPersonId: string = route.params['id'] as string;
  const personStore: PersonStore = usePersonStore();
  const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();
  const authStore: AuthStore = useAuthStore();
  const organisationStore: OrganisationStore = useOrganisationStore();
  const twoFactorAuthentificationStore: TwoFactorAuthentificationStore = useTwoFactorAuthentificationStore();

  const password: Ref<string> = ref('');

  const zuordnungenResult: Ref<Zuordnung[] | undefined> = ref<Zuordnung[] | undefined>(undefined);
  const getZuordnungen: ComputedRef<Zuordnung[] | undefined> = computed(() => zuordnungenResult.value);
  const selectedZuordnungen: Ref<Zuordnung[]> = ref<Zuordnung[]>([]);
  const newZuordnung: Ref<Zuordnung | undefined> = ref<Zuordnung | undefined>(undefined);
  const finalZuordnungen: Ref<Zuordnung[]> = ref<Zuordnung[]>([]);
  const originalZuordnungenResult: Ref<Zuordnung[] | undefined> = ref(undefined);
  const hasKlassenZuordnung: Ref<boolean | undefined> = ref(false);

  const isEditActive: Ref<boolean> = ref(false);
  const isZuordnungFormActive: Ref<boolean> = ref(false);
  const isChangeKlasseFormActive: Ref<boolean> = ref(false);

  const pendingDeletion: Ref<boolean> = ref(false);
  const pendingCreation: Ref<boolean> = ref(false);
  const pendingChangeKlasse: Ref<boolean> = ref(false);

  const deleteSuccessDialogVisible: Ref<boolean> = ref(false);
  const createSuccessDialogVisible: Ref<boolean> = ref(false);
  const changeKlasseSuccessDialogVisible: Ref<boolean> = ref(false);
  const cannotDeleteDialogVisible: Ref<boolean> = ref(false);
  const createZuordnungConfirmationDialogVisible: Ref<boolean> = ref(false);
  const changeKlasseConfirmationDialogVisible: Ref<boolean> = ref(false);
  const createZuordnungConfirmationDialogMessage: Ref<string> = ref('');
  const changeKlasseConfirmationDialogMessage: Ref<string> = ref('');
  const canCommit: Ref<boolean> = ref(false);

  const creationErrorText: Ref<string> = ref('');
  const creationErrorTitle: Ref<string> = ref('');

  const calculatedBefristung: Ref<string | undefined> = ref('');

  function navigateToPersonTable(): void {
    router.push({ name: 'person-management' });
  }

  function resetPassword(personId: string): void {
    personStore.resetPassword(personId).then((newPassword?: string) => {
      password.value = newPassword || '';
    });
  }

  const handleAlertClose = (): void => {
    personStore.errorCode = '';
    navigateToPersonTable();
  };

  // Triggers the template to prepare the deletion
  const prepareDeletion = (): void => {
    pendingDeletion.value = true;
  };
  // Triggers the template to prepare the creation
  const prepareCreation = (): void => {
    pendingCreation.value = true;
    isZuordnungFormActive.value = false;
  };
  // Triggers the template to prepare the change of Klasse
  const prepareChangeKlasse = (): void => {
    pendingChangeKlasse.value = true;
    isChangeKlasseFormActive.value = false;
  };

  // Deletes the person and all kontexte
  async function deletePerson(personId: string): Promise<void> {
    await personStore.deletePersonById(personId);
  }

  let closeCannotDeleteDialog = (): void => {
    cannotDeleteDialogVisible.value = false;
  };
  let closeCreateSuccessDialog = (): void => {
    createSuccessDialogVisible.value = false;
    router.push(route).then(() => {
      router.go(0);
    });
  };

  let closeDeleteSuccessDialog = (): void => {
    deleteSuccessDialogVisible.value = false;
    router.push(route).then(() => {
      router.go(0);
    });
  };

  let closeChangeKlasseSuccessDialog = (): void => {
    changeKlasseSuccessDialogVisible.value = false;
    router.push(route).then(() => {
      router.go(0);
    });
  };

  // Triggers the template to add a new Zuordnung
  const triggerAddZuordnung = async (): Promise<void> => {
    await personenkontextStore.processWorkflowStep({ limit: 25 });
    isZuordnungFormActive.value = true;
  };

  // This will send the updated list of Zuordnungen to the Backend WITHOUT the selected Zuordnungen.
  const confirmDeletion = async (): Promise<void> => {
    // Check if the current user is trying to delete their own Zuordnungen
    if (authStore.currentUser?.personId === currentPersonId) {
      cannotDeleteDialogVisible.value = true;
      return;
    }

    // The remaining Zuordnungen that were not selected
    const remainingZuordnungen: Zuordnung[] | undefined = zuordnungenResult.value?.filter(
      (zuordnung: Zuordnung) => !selectedZuordnungen.value.includes(zuordnung),
    );

    // Extract Zuordnungen of type "Klasse"
    const klassenZuordnungen: Zuordnung[] | undefined = personStore.personenuebersicht?.zuordnungen.filter(
      (zuordnung: Zuordnung) => zuordnung.typ === OrganisationsTyp.Klasse,
    );

    // Filter out Klassen where administriertVon is equal to any selectedZuordnungen.sskId so the Klasse is also deleted alongside the Schule.
    // Otherwise the Zuordnung to the Schule will be deleted but the one to the Klasse will remain.
    const filteredKlassenZuordnungen: Zuordnung[] | undefined = klassenZuordnungen?.filter(
      (klasseZuordnung: Zuordnung) =>
        !selectedZuordnungen.value.some(
          (selectedZuordnung: Zuordnung) => selectedZuordnung.sskId === klasseZuordnung.administriertVon,
        ),
    );

    // Combine remaining Zuordnungen and filtered Klassen Zuordnungen
    const combinedZuordnungen: Zuordnung[] | undefined = remainingZuordnungen?.concat(filteredKlassenZuordnungen || []);
    await personenkontextStore.updatePersonenkontexte(combinedZuordnungen, currentPersonId);
    zuordnungenResult.value = combinedZuordnungen;
    selectedZuordnungen.value = [];

    // Filter out Zuordnungen with editable === false
    const editableZuordnungen: Zuordnung[] | undefined = combinedZuordnungen?.filter(
      (zuordnung: Zuordnung) => zuordnung.editable,
    );

    deleteSuccessDialogVisible.value = !personenkontextStore.errorCode;

    if (!editableZuordnungen || editableZuordnungen.length === 0) {
      // If no editable Zuordnungen are left, navigate to person table after the dialog is closed
      closeDeleteSuccessDialog = (): void => {
        deleteSuccessDialogVisible.value = false;
        navigateToPersonTable();
      };
    } else {
      closeDeleteSuccessDialog = (): void => {
        deleteSuccessDialogVisible.value = false;
        router.push(route).then(() => {
          router.go(0);
        });
      };
    }
  };

  const alertButtonText: ComputedRef<string> = computed(() => {
    return personenkontextStore.errorCode === 'PERSON_NOT_FOUND' ? t('nav.backToList') : t('refreshData');
  });

  const alertButtonAction: ComputedRef<() => void> = computed(() => {
    return personenkontextStore.errorCode === 'PERSON_NOT_FOUND' ? navigateToPersonTable : (): void => router.go(0);
  });
  function getSskName(sskDstNr: string, sskName: string): string {
    /* truncate ssk name */
    const truncatededSskName: string = sskName.length > 30 ? `${sskName.substring(0, 30)}...` : sskName;

    /* omit parens when there is no ssk kennung  */
    if (sskDstNr) {
      return `${sskDstNr} (${truncatededSskName})`;
    } else {
      return truncatededSskName;
    }
  }

  // Add the Klasse to it's corresponding Schule
  function computeZuordnungen(personenuebersicht: PersonWithUebersicht | null): Zuordnung[] | undefined {
    const zuordnungen: Zuordnung[] | undefined = personenuebersicht?.zuordnungen;

    if (!zuordnungen) return;

    const result: Zuordnung[] = [];

    // Extract all Klassen from the Zuordnungen
    const klassen: Zuordnung[] = zuordnungen.filter(
      (zuordnung: Zuordnung) => zuordnung.typ === OrganisationsTyp.Klasse,
    );
    // Add every klasse to result
    for (const klasse of klassen) {
      // Find the specific parent of every Klasse (The rolle in the Klasse should also be the same role in the Parent (Schule))
      const administrierendeZuordnung: Zuordnung | undefined = zuordnungen.find(
        (z: Zuordnung) =>
          z.sskId === klasse.administriertVon && z.rolleId === klasse.rolleId && z.typ !== OrganisationsTyp.Klasse,
      );
      // If the parent is found then add the Klasse property to it
      if (administrierendeZuordnung) {
        result.push({
          ...administrierendeZuordnung,
          klasse: klasse.sskName,
        });
      }
    }
    // Other Zuordnungen not of typ Klasse
    const otherZuordnungen: Zuordnung[] = zuordnungen.filter(
      (zuordnung: Zuordnung) => zuordnung.typ !== OrganisationsTyp.Klasse,
    );

    for (const zuordnung of otherZuordnungen) {
      // Only add Zuordnungen that don't have the same sskId and rolleId to avoid redundancy in the final result
      if (!result.find((z: Zuordnung) => z.sskId === zuordnung.sskId && z.rolleId === zuordnung.rolleId)) {
        result.push(zuordnung);
      }
    }
    // Sort by klasse, rolle and SSK (optional)
    result
      .sort((a: Zuordnung, b: Zuordnung) => (a.klasse && b.klasse ? a.klasse.localeCompare(b.klasse) : 0))
      .sort((a: Zuordnung, b: Zuordnung) => a.rolle.localeCompare(b.rolle))
      .sort((a: Zuordnung, b: Zuordnung) => a.sskDstNr.localeCompare(b.sskDstNr));

    return result;
  }

  const rollen: ComputedRef<TranslatedRolleWithAttrs[] | undefined> = useRollen();

  const organisationen: ComputedRef<TranslatedObject[] | undefined> = useOrganisationen();

  const klassen: ComputedRef<TranslatedObject[] | undefined> = useKlassen();

  type ZuordnungCreationForm = {
    selectedRolle: string;
    selectedOrganisation: string;
    selectedKlasse: string;
    selectedBefristung: Date;
    selectedBefristungOption: string;
  };

  type ChangeKlasseForm = {
    selectedSchule: string;
    selectedNewKlasse: string;
  };

  // Define a method to check if the selected Rolle is of type "Lern"
  function isLernRolle(selectedRolleId: string): boolean {
    const rolle: TranslatedRolleWithAttrs | undefined = rollen.value?.find(
      (r: TranslatedRolleWithAttrs) => r.value === selectedRolleId,
    );
    return !!rolle && rolle.rollenart === RollenArt.Lern;
  }

  const hasKopersRolle: ComputedRef<boolean> = computed(() => {
    return (
      !!zuordnungenResult.value?.find((zuordnung: Zuordnung) => {
        return zuordnung.merkmale.includes(RollenMerkmal.KopersPflicht);
      }) || false
    );
  });

  // Check if the button to change the Klasse should be active or not. Activate only if there is 1 selected Zuordnung and if it is of type LERN.
  const canChangeKlasse: ComputedRef<boolean> = computed(() => {
    const hasOneSelectedZuordnung: boolean = selectedZuordnungen.value.length === 1;

    const organisationId: string | undefined = selectedZuordnungen.value[0]?.sskId;
    const rolleId: string | undefined = selectedZuordnungen.value[0]?.rolleId;

    personenkontextStore.processWorkflowStep({ organisationId: organisationId, rolleId: rolleId, limit: 25 });
    // Check if rolleId exists and if it's of type LERN
    if (rolleId && isLernRolle(rolleId) && hasOneSelectedZuordnung) {
      return true;
    }
    return false;
  });

  // Custom validation function to check if the date is in the past
  const notInPast = (value: string | undefined): boolean => {
    if (!value) return true;

    const parsedDate: Date = parse(value, 'dd.MM.yyyy', new Date());
    return isValid(parsedDate) && !isBefore(parsedDate, new Date());
  };

  // Checks if the selected Rolle has Befristungspflicht
  function isBefristungspflichtRolle(selectedRolleId: string | undefined): boolean {
    const rolle: TranslatedRolleWithAttrs | undefined = rollen.value?.find(
      (r: TranslatedRolleWithAttrs) => r.value === selectedRolleId,
    );

    return !!rolle && !!rolle.merkmale && rolle.merkmale.has(RollenMerkmal.BefristungPflicht);
  }

  const zuordnungFormValidationSchema: TypedSchema = toTypedSchema(
    object({
      selectedRolle: string().required(t('admin.rolle.rules.rolle.required')),
      selectedOrganisation: string().required(t('admin.organisation.rules.organisation.required')),
      selectedKlasse: string().when('selectedRolle', {
        is: (selectedRolleId: string) => isLernRolle(selectedRolleId),
        then: (schema: StringSchema<string | undefined, AnyObject, undefined, ''>) =>
          schema.required(t('admin.klasse.rules.klasse.required')),
      }),
      selectedNewKlasse: string().when('selectedSchule', {
        is: (selectedSchule: string) => selectedSchule,
        then: (schema: StringSchema<string | undefined, AnyObject, undefined, ''>) =>
          schema.required(t('admin.klasse.rules.klasse.required')),
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

  const changeKlasseValidationSchema: TypedSchema = toTypedSchema(
    object({
      selectedNewKlasse: string().when('selectedSchule', {
        is: (selectedSchule: string) => selectedSchule,
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

  // eslint-disable-next-line @typescript-eslint/typedef
  const {
    defineField: defineFieldZuordnung,
    handleSubmit: handleSubmitZuordnungForm,
    resetForm: resetZuordnungForm,
    resetField: resetFieldZuordnungForm,
  } = useForm<ZuordnungCreationForm>({
    validationSchema: zuordnungFormValidationSchema,
  });

  // eslint-disable-next-line @typescript-eslint/typedef
  const {
    defineField: defineFieldChangeKlasse,
    handleSubmit: handleSubmitChangeKlasse,
    resetForm: resetChangeKlasseForm,
  } = useForm<ChangeKlasseForm>({
    validationSchema: changeKlasseValidationSchema,
  });

  // Add Zuordnung Form
  const [selectedRolle, selectedRolleProps]: [
    Ref<string | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineFieldZuordnung('selectedRolle', vuetifyConfig);
  const [selectedOrganisation, selectedOrganisationProps]: [
    Ref<string | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineFieldZuordnung('selectedOrganisation', vuetifyConfig);
  const [selectedKlasse, selectedKlasseProps]: [
    Ref<string | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineFieldZuordnung('selectedKlasse', vuetifyConfig);

  const [selectedBefristung, selectedBefristungProps]: [
    Ref<string | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineFieldZuordnung('selectedBefristung', vuetifyConfig);
  const [selectedBefristungOption, selectedBefristungOptionProps]: [
    Ref<string | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineFieldZuordnung('selectedBefristungOption', vuetifyConfig);

  // Change Klasse Form
  const [selectedSchule, selectedSchuleProps]: [
    Ref<string | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineFieldChangeKlasse('selectedSchule', vuetifyConfig);
  const [selectedNewKlasse, selectedNewKlasseProps]: [
    Ref<string | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineFieldChangeKlasse('selectedNewKlasse', vuetifyConfig);

  // Triggers the template to start editing
  const triggerEdit = (): void => {
    isEditActive.value = true;
    // Deep copy of the zuordnungenResult to keep track of the Zuordnungen before any changes were done.
    // This is necessary if a user cancels the editing at some point and the zuordnungenResult was mutated at the time.
    originalZuordnungenResult.value = JSON.parse(JSON.stringify(zuordnungenResult.value));
  };

  // Triggers the template to change the Klasse. Also pre-select the Schule and Klasse.
  const triggerChangeKlasse = async (): Promise<void> => {
    // Get the Klasse from the parent
    if (selectedZuordnungen.value[0]?.sskId) {
      await organisationStore.getKlassenByOrganisationId(selectedZuordnungen.value[0]?.sskId);
    }
    // Auto select the new Schule
    selectedSchule.value = selectedZuordnungen.value[0]?.sskId;
    // Retrieves the new Klasse from the selected Zuordnung
    const newKlasse: Organisation | undefined = organisationStore.klassen.find(
      (k: Organisation) => k.name === selectedZuordnungen.value[0]?.klasse,
    );
    // Auto select the new Klasse
    selectedNewKlasse.value = newKlasse?.id;
    isChangeKlasseFormActive.value = true;
  };

  // Cancels editing
  const cancelEdit = (): void => {
    isEditActive.value = false;
    pendingDeletion.value = false;
    pendingCreation.value = false;
    pendingChangeKlasse.value = false;
    selectedZuordnungen.value = [];
    isZuordnungFormActive.value = false;
    isChangeKlasseFormActive.value = false;
    resetZuordnungForm();
    resetChangeKlasseForm();
    zuordnungenResult.value = originalZuordnungenResult.value
      ? JSON.parse(JSON.stringify(originalZuordnungenResult.value))
      : undefined;
  };

  function handleStoreUpdates(): void {
    if (personenkontextStore.errorCode) {
      creationErrorText.value = t(`admin.personenkontext.errors.${personenkontextStore.errorCode}`);
      creationErrorTitle.value = t(`admin.personenkontext.title.${personenkontextStore.errorCode}`);
    }
  }

  watch(() => personenkontextStore.errorCode, handleStoreUpdates);
  watch(() => personenkontextStore.loading, handleStoreUpdates);

  // This will send the updated list of Zuordnungen to the Backend on TOP of the new added one through the form.
  async function confirmAddition(): Promise<void> {
    await personenkontextStore.updatePersonenkontexte(finalZuordnungen.value, currentPersonId);
    createSuccessDialogVisible.value = !personenkontextStore.errorCode;
    resetZuordnungForm();
  }

  // This will send the updated list of Zuordnungen to the Backend with the selected Zuordnung but with the new Klasse.
  async function confirmChangeKlasse(): Promise<void> {
    await personenkontextStore.updatePersonenkontexte(finalZuordnungen.value, currentPersonId);
    changeKlasseSuccessDialogVisible.value = !personenkontextStore.errorCode;
    resetChangeKlasseForm();
  }

  // The save button will act according to what kind of pending action we have.
  const handleSaveClick = (): void => {
    if (pendingCreation.value) {
      confirmAddition();
    } else if (pendingDeletion.value) {
      confirmDeletion();
    } else if (pendingChangeKlasse.value) {
      confirmChangeKlasse();
    }
  };

  // The save button is always disabled if there is no pending creation, deletion nor changeKlasse.
  const isSaveButtonDisabled: ComputedRef<boolean> = computed(
    () => !pendingCreation.value && !pendingDeletion.value && !pendingChangeKlasse.value,
  );

  // Filter out the Rollen based on the user's existing Zuordnungen and selected organization
  const filteredRollen: ComputedRef<TranslatedRolleWithAttrs[] | undefined> = computed(() => {
    const existingZuordnungen: Zuordnung[] | undefined = personStore.personenuebersicht?.zuordnungen;

    // If no existing Zuordnungen then just show all roles
    if (!existingZuordnungen || existingZuordnungen.length === 0) {
      return rollen.value;
    }

    const selectedOrgaId: string | undefined = selectedOrganisation.value;

    // Determine if the user already has any LERN roles
    const hasLernRolle: boolean = existingZuordnungen.some((zuordnung: Zuordnung) => isLernRolle(zuordnung.rolleId));

    // Filter out Rollen that the user already has in the selected organization
    return rollen.value?.filter((rolle: TranslatedRolleWithAttrs) => {
      // Check if the user already has this role in the selected organization
      const alreadyHasRolleInSelectedOrga: boolean = existingZuordnungen.some(
        (zuordnung: Zuordnung) => zuordnung.rolleId === rolle.value && zuordnung.sskId === selectedOrgaId,
      );

      // If the user has any LERN roles, only allow LERN roles to be selected
      if (hasLernRolle) {
        // Allow LERN roles in other organizations, but filter them out for the selected organization
        return !alreadyHasRolleInSelectedOrga && rolle.rollenart === RollenArt.Lern;
      }

      // If the user doesn't have any LERN roles, allow any role that hasn't been assigned yet in the selected organization besides LERN.
      return !alreadyHasRolleInSelectedOrga && rolle.rollenart !== RollenArt.Lern;
    });
  });

  // Computed property to get the title of the selected rolle
  const selectedRolleTitle: ComputedRef<string | undefined> = computed(() => {
    return rollen.value?.find((rolle: TranslatedObject) => rolle.value === selectedRolle.value)?.title;
  });

  // Computed property to get the title of the selected klasse
  const selectedKlasseTitle: ComputedRef<string | undefined> = computed(() => {
    return klassen.value?.find((klasse: TranslatedObject) => klasse.value === selectedKlasse.value)?.title;
  });

  // Computed property to get the title of the selected new klasse
  const selectedNewKlasseTitle: ComputedRef<string | undefined> = computed(() => {
    return klassen.value?.find((klasse: TranslatedObject) => klasse.value === selectedNewKlasse.value)?.title;
  });

  // Computed property to get the title of the selected new klasse
  const isSubmitDisabled: ComputedRef<boolean> = computed(() => {
    return selectedNewKlasseTitle.value === selectedZuordnungen.value[0]?.klasse;
  });

  const onSubmitChangeKlasse: (e?: Event | undefined) => Promise<void | undefined> = handleSubmitChangeKlasse(() => {
    changeKlasseConfirmationDialogMessage.value = t('person.changeKlasseConfirmation', {
      oldKlasse: selectedZuordnungen.value[0]?.klasse,
      newKlasse: selectedNewKlasseTitle.value,
    });
    changeKlasseConfirmationDialogVisible.value = true;
  });

  const onSubmitCreateZuordnung: (e?: Event | undefined) => Promise<void | undefined> = handleSubmitZuordnungForm(
    () => {
      if (selectedRolle.value) {
        if (isLernRolle(selectedRolle.value)) {
          createZuordnungConfirmationDialogMessage.value = t('person.addZuordnungKlasseConfirmation', {
            rollenname: selectedRolleTitle.value,
            klassenname: selectedKlasseTitle.value,
          });
        } else {
          createZuordnungConfirmationDialogMessage.value = t('person.addZuordnungConfirmation', {
            rollenname: selectedRolleTitle.value,
          });
        }
        createZuordnungConfirmationDialogVisible.value = true;
      }
    },
  );

  const confirmDialogAddition = async (): Promise<void> => {
    createZuordnungConfirmationDialogVisible.value = false;
    const organisation: Organisation | undefined = personenkontextStore.workflowStepResponse?.organisations.find(
      (orga: Organisation) => orga.id === selectedOrganisation.value,
    );

    // The existing Klassenzuordnungen that the person has already
    const existingKlassen: Zuordnung[] | undefined = personStore.personenuebersicht?.zuordnungen.filter(
      (zuordnung: Zuordnung) => zuordnung.typ === OrganisationsTyp.Klasse,
    );
    // The new selected Klasse to add as a separate Zuordnung
    const klasse: Organisation | undefined = organisationStore.klassen.find(
      (k: Organisation) => k.id === selectedKlasse.value,
    );

    // Function to format a date in dd.MM.yyyy format to ISO 8601
    function formatDateToISO(date: string | undefined): string | undefined {
      if (date) {
        // Split the date by '.' to extract day, month, and year
        const [day, month, year]: (number | undefined)[] = date.split('.').map(Number);

        if (day && month && year) {
          // Create a new Date object with the extracted parts
          // Alwyays adding 1 day to the date because for example if the Befristung is chosen as 20.05.2024 then it should be valid until 20.05.2024 23:59
          // Also the UTC ISO formatted send date will be 20-05-2024 22H which is basically 21.05.2024 in german summer time.
          const d: Date = new Date(year, month - 1, day + 1);

          // Return the ISO string
          return d.toISOString();
        }
      }
      return;
    }

    const befristungDate: string | undefined = selectedBefristung.value
      ? selectedBefristung.value
      : calculatedBefristung.value;

    // Format the date in ISO 8601 format if it exists
    const formattedBefristung: string | undefined = befristungDate ? formatDateToISO(befristungDate) : undefined;

    if (organisation) {
      newZuordnung.value = {
        sskId: organisation.id,
        rolleId: selectedRolle.value ?? '',
        klasse: klasse?.name,
        sskDstNr: organisation.kennung ?? '',
        sskName: organisation.name,
        rolle:
          rollen.value?.find((rolle: TranslatedRolleWithAttrs) => rolle.value === selectedRolle.value)?.title || '',
        administriertVon: organisation.administriertVon ?? '',
        editable: true,
        merkmale: [] as unknown as RollenMerkmal,
        typ: OrganisationsTyp.Schule,
        befristung: formattedBefristung,
      };
      if (zuordnungenResult.value) {
        finalZuordnungen.value = zuordnungenResult.value;
        finalZuordnungen.value.push(newZuordnung.value);
      }

      // Add the new selected Klasse to finalZuordnungen
      if (klasse) {
        finalZuordnungen.value.push({
          sskId: klasse.id,
          rolleId: selectedRolle.value ?? '',
          sskDstNr: klasse.kennung ?? '',
          sskName: klasse.name,
          rolle:
            rollen.value?.find((rolle: TranslatedRolleWithAttrs) => rolle.value === selectedRolle.value)?.title || '',
          administriertVon: klasse.administriertVon ?? '',
          editable: true,
          typ: OrganisationsTyp.Klasse,
          merkmale: [] as unknown as RollenMerkmal,
          befristung: formattedBefristung,
        });
      }

      // Add all existing Klassenzuordnungen to finalZuordnungen
      if (existingKlassen) {
        existingKlassen.forEach((existingKlasse: Zuordnung) => {
          finalZuordnungen.value.push({
            sskId: existingKlasse.sskId,
            rolleId: existingKlasse.rolleId,
            sskDstNr: existingKlasse.sskDstNr,
            sskName: existingKlasse.sskName,
            rolle: existingKlasse.rolle,
            administriertVon: existingKlasse.administriertVon,
            editable: true,
            merkmale: [] as unknown as RollenMerkmal,
            typ: OrganisationsTyp.Klasse,
            befristung: existingKlasse.befristung,
          });
        });
      }
    }

    // Filter out existing Klassen from zuordnungenResult
    zuordnungenResult.value = zuordnungenResult.value?.filter(
      (zuordnung: Zuordnung) => zuordnung.typ !== OrganisationsTyp.Klasse,
    );

    prepareCreation();
  };

  // When the button "Yes" from the Dialog after filling the form for changing the Klasse is clicked
  const confirmDialogChangeKlasse = async (): Promise<void> => {
    changeKlasseConfirmationDialogVisible.value = false;
    // Find the Orga object for the selected Schule (unchangeable anyways)
    const organisation: Organisation | undefined = personenkontextStore.workflowStepResponse?.organisations.find(
      (orga: Organisation) => orga.id === selectedSchule.value,
    );

    // Find the Orga object for the selected new Klasse
    const newKlasse: Organisation | undefined = organisationStore.klassen.find(
      (k: Organisation) => k.id === selectedNewKlasse.value,
    );

    if (organisation) {
      // Used to build the Zuordnung of type Schule and keep track of it (Only use it in the template)
      // This is basically the old Zuordnung in the Schule but since it is already available in ZuordnungenResult we won't be adding this to the finalZuordnungen
      // It's just better to use this since using an array of Zuordnung (selectedZuordnungen) in the template is not so fun
      newZuordnung.value = {
        sskId: organisation.id,
        rolleId: selectedZuordnungen.value[0]?.rolleId ?? '',
        klasse: newKlasse?.name,
        sskDstNr: organisation.kennung ?? '',
        sskName: organisation.name,
        rolle:
          rollen.value?.find((rolle: TranslatedRolleWithAttrs) => rolle.value === selectedZuordnungen.value[0]?.rolleId)
            ?.title || '',
        administriertVon: organisation.administriertVon ?? '',
        editable: true,
        merkmale: [] as unknown as RollenMerkmal,
        typ: OrganisationsTyp.Schule,
      };

      if (zuordnungenResult.value) {
        finalZuordnungen.value = zuordnungenResult.value;
      }

      // Add the new Klasse Zuordnung
      if (newKlasse) {
        finalZuordnungen.value.push({
          sskId: newKlasse.id,
          rolleId: selectedZuordnungen.value[0]?.rolleId ?? '',
          sskDstNr: newKlasse.kennung ?? '',
          sskName: newKlasse.name,
          rolle:
            rollen.value?.find(
              (rolle: TranslatedRolleWithAttrs) => rolle.value === selectedZuordnungen.value[0]?.rolleId,
            )?.title || '',
          administriertVon: newKlasse.administriertVon ?? '',
          editable: true,
          merkmale: [] as unknown as RollenMerkmal,
          typ: OrganisationsTyp.Klasse,
        });
      }
    }

    // zuordnungenResult is what we show in the UI and so Zuordnungen of type Klasse shouldn't show up (since they are merged with the ones of type Schule already)
    zuordnungenResult.value = zuordnungenResult.value?.filter(
      (zuordnung: Zuordnung) => zuordnung.typ !== OrganisationsTyp.Klasse,
    );
    // Proceed with the pending change Klasse operation
    prepareChangeKlasse();
  };

  const cancelAddition = (): void => {
    createZuordnungConfirmationDialogVisible.value = false;
  };

  const cancelChangeKlasse = (): void => {
    changeKlasseConfirmationDialogVisible.value = false;
  };

  watch(
    () => personStore.personenuebersicht,
    (newValue: PersonWithUebersicht | null) => {
      zuordnungenResult.value = computeZuordnungen(newValue);
    },
    { immediate: true },
  );

  function handleFieldReset(field: string): void {
    if (field === 'selectedRolle') {
      selectedRolle.value = undefined;
    } else if (field === 'selectedKlasse') {
      selectedKlasse.value = undefined;
    }
  }

  // Calculates the next 31st of July (End of school year)
  // Time here is in german iso format but will later be converted to UCT
  function getNextSchuljahresende(): string {
    const today: Date = new Date();
    const currentYear: number = today.getFullYear();
    const july31stThisYear: Date = new Date(currentYear, 6, 31); // July is month 6 (0-indexed)

    // If today's date is after July 31st this year, return July 31st of next year
    if (today > july31stThisYear) {
      return new Date(currentYear + 1, 6, 31).toLocaleDateString('de-DE');
    }

    // Otherwise, return July 31st of this year
    return july31stThisYear.toLocaleDateString('de-DE');
  }

  // Calculates the Befristung depending on the selected radio button. Each radio button illustrates a date (Either 31st July or undefined)
  // The backend will receive the calculatedBefristung.
  function handleBefristungOptionChange(value: string | undefined): void {
    switch (value) {
      case BefristungOption.SCHULJAHRESENDE: {
        calculatedBefristung.value = getNextSchuljahresende();
        resetFieldZuordnungForm('selectedBefristung'); // Reset the date picker
        break;
      }
      case BefristungOption.UNBEFRISTET: {
        calculatedBefristung.value = undefined;
        resetFieldZuordnungForm('selectedBefristung');
        break;
      }
    }
  }

  const handleBefristungUpdate = (value: string | undefined): void => {
    selectedBefristung.value = value;
    calculatedBefristung.value = value;
  };

  const handleBefristungOptionUpdate = (value: string | undefined): void => {
    selectedBefristungOption.value = value;
    handleBefristungOptionChange(value);
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

  onBeforeMount(async () => {
    personStore.resetState();
    personenkontextStore.errorCode = '';
    await personStore.getPersonById(currentPersonId);
    await personStore.getPersonenuebersichtById(currentPersonId);
    await personenkontextStore.processWorkflowStep({ limit: 25 });
    hasKlassenZuordnung.value = personStore.personenuebersicht?.zuordnungen.some(
      (zuordnung: Zuordnung) => zuordnung.typ === OrganisationsTyp.Klasse,
    );
    await twoFactorAuthentificationStore.get2FAState(currentPersonId);
  });
</script>

<template>
  <div class="admin">
    <v-row>
      <v-col cols="12">
        <h1
          class="text-center headline-1"
          data-testid="admin-headline"
        >
          {{ $t('admin.headline') }}
        </h1>
      </v-col>
    </v-row>
    <LayoutCard
      :closable="true"
      data-testid="person-details-card"
      :header="$t('admin.person.edit')"
      @onCloseClicked="navigateToPersonTable"
      :padded="true"
      :showCloseText="true"
    >
      <!-- Error Message Display if the personStore throws any kind of error (Not being able to load the person) -->
      <SpshAlert
        :model-value="!!personStore.errorCode"
        :type="'error'"
        :closable="false"
        :text="$t('admin.person.loadingErrorText')"
        :showButton="true"
        :buttonText="$t('nav.backToList')"
        :buttonAction="navigateToPersonTable"
        :title="$t('admin.person.loadingErrorTitle')"
        @update:modelValue="handleAlertClose"
      />

      <!-- Error Message Display if the personenkontextStore throws any kind of error (Not being able to load the kontext) -->
      <SpshAlert
        :model-value="!!personenkontextStore.errorCode"
        :type="'error'"
        :closable="false"
        :text="creationErrorText"
        :showButton="true"
        :buttonText="alertButtonText"
        :buttonAction="alertButtonAction"
        :title="creationErrorTitle"
        @update:modelValue="handleAlertClose"
      />

      <template v-if="!personStore.errorCode && !personenkontextStore.errorCode">
        <v-container class="personal-info">
          <div v-if="personStore.currentPerson?.person">
            <!-- Vorname -->
            <v-row class="mt-0">
              <v-col cols="1"></v-col>
              <v-col
                class="text-right"
                md="2"
                sm="3"
                cols="5"
              >
                <span class="subtitle-2"> {{ $t('person.firstName') }}: </span>
              </v-col>
              <v-col
                cols="auto"
                data-testid="person-vorname"
              >
                <span class="text-body"> {{ personStore.currentPerson.person.name.vorname }} </span>
              </v-col>
            </v-row>
            <!-- Familienname -->
            <v-row class="mt-0">
              <v-col cols="1"></v-col>
              <v-col
                class="text-right"
                md="2"
                sm="3"
                cols="5"
              >
                <span class="subtitle-2"> {{ $t('person.lastName') }}: </span>
              </v-col>
              <v-col
                cols="auto"
                data-testid="person-familienname"
              >
                <span class="text-body"> {{ personStore.currentPerson.person.name.familienname }}</span>
              </v-col>
            </v-row>
            <!-- Benutzername -->
            <v-row class="mt-0">
              <v-col cols="1"></v-col>
              <v-col
                class="text-right"
                md="2"
                sm="3"
                cols="5"
              >
                <span class="subtitle-2"> {{ $t('person.userName') }}: </span>
              </v-col>
              <v-col
                cols="auto"
                data-testid="person-username"
              >
                <span class="text-body">{{ personStore.currentPerson.person.referrer }} </span>
              </v-col>
            </v-row>
            <!-- KoPers.-Nr. -->
            <v-row
              class="mt-0"
              v-if="hasKopersRolle"
            >
              <v-col cols="1"></v-col>
              <v-col
                class="text-right"
                md="2"
                sm="3"
                cols="5"
              >
                <span
                  :class="`${hasKopersRolle && personStore.currentPerson.person.personalnummer ? 'subtitle-2' : 'subtitle-2 text-red'}`"
                >
                  {{ $t('person.kopersNr') }}:
                </span>
              </v-col>
              <v-col
                cols="auto"
                data-testid="person-kopersnr"
              >
                <span
                  :class="`${hasKopersRolle && personStore.currentPerson.person.personalnummer ? 'text-body' : 'text-body text-red'}`"
                >
                  {{ personStore.currentPerson.person.personalnummer ?? $t('missing') }}
                </span>
              </v-col>
            </v-row>
          </div>
          <div v-else-if="personStore.loading">
            <v-progress-circular indeterminate></v-progress-circular>
          </div>
        </v-container>
        <v-divider
          class="border-opacity-100 rounded my-6 mx-4"
          color="#E5EAEF"
          thickness="6"
        ></v-divider>
        <!-- Password reset -->
        <v-container class="password-reset">
          <v-row class="ml-md-16">
            <v-col>
              <h3 class="subtitle-1">{{ $t('person.password') }}</h3>
            </v-col>
            <v-col
              class="mr-lg-13"
              cols="12"
              md="auto"
              v-if="personStore.currentPerson"
            >
              <div class="d-flex justify-sm-end">
                <PasswordReset
                  :errorCode="personStore.errorCode"
                  :disabled="isEditActive"
                  :person="personStore.currentPerson"
                  @onClearPassword="password = ''"
                  @onResetPassword="resetPassword(currentPersonId)"
                  :password="password"
                >
                </PasswordReset>
              </div>
            </v-col>
            <v-col v-else-if="personStore.loading"> <v-progress-circular indeterminate></v-progress-circular></v-col
          ></v-row>
        </v-container>
        <v-divider
          class="border-opacity-100 rounded my-6 mx-4"
          color="#E5EAEF"
          thickness="6"
        ></v-divider>
        <!-- Two Factor Authentication -->
        <v-container v-if="twoFactorAuthentificationStore.hasToken != undefined">
          <v-row class="ml-md-16">
            <v-col>
              <h3 class="subtitle-1">{{ $t('admin.person.twoFactorAuthentication.header') }}</h3>
              <v-row
                class="mt-4 text-body"
                v-if="twoFactorAuthentificationStore.hasToken"
              >
                <v-col
                  class="text-right"
                  cols="1"
                >
                  <v-icon
                    icon="mdi-check-circle"
                    color="green"
                    v-if="twoFactorAuthentificationStore.hasToken"
                  ></v-icon>
                </v-col>
                <div class="v-col">
                  <p v-if="twoFactorAuthentificationStore.tokenKind === 'software'">
                    {{ $t('admin.person.twoFactorAuthentication.softwareTokenIsSetUp') }}
                  </p>
                  <p v-if="twoFactorAuthentificationStore.tokenKind === 'hardware'">
                    {{ $t('admin.person.twoFactorAuthentication.hardwareTokenIsSetUp') }}
                  </p>
                  <p v-if="twoFactorAuthentificationStore.serial">
                    {{
                      $t('admin.person.twoFactorAuthentication.serial') + ': ' + twoFactorAuthentificationStore.serial
                    }}
                  </p>
                </div>
              </v-row>
              <v-row class="mt-4 text-body">
                <v-col
                  class="text-right"
                  cols="1"
                >
                  <v-icon
                    class="mb-2"
                    icon="mdi-information"
                  >
                  </v-icon>
                </v-col>
                <div class="v-col">
                  <p v-if="twoFactorAuthentificationStore.hasToken">
                    {{ $t('admin.person.twoFactorAuthentication.resetInfo') }}
                  </p>
                  <p v-if="!twoFactorAuthentificationStore.hasToken">
                    {{ $t('admin.person.twoFactorAuthentication.notSetUp') }}
                  </p>
                </div>
              </v-row>
            </v-col>
            <v-col
              class="mr-lg-13"
              cols="12"
              md="auto"
              v-if="personStore.currentPerson"
            >
              <div
                class="d-flex justify-sm-end"
                v-if="!twoFactorAuthentificationStore.hasToken"
              >
                <TwoFactorAuthenticationSetUp
                  :errorCode="twoFactorAuthentificationStore.errorCode"
                  :disabled="isEditActive"
                  :person="personStore.currentPerson"
                  @dialogClosed="twoFactorAuthentificationStore.get2FAState(currentPersonId)"
                >
                </TwoFactorAuthenticationSetUp>
              </div>
              <div
                class="d-flex justify-sm-end"
                v-if="twoFactorAuthentificationStore.hasToken"
              >
                <v-col
                  cols="12"
                  sm="6"
                  md="auto"
                >
                  <SpshTooltip
                    :enabledCondition="twoFactorAuthentificationStore.hasToken"
                    :disabledText="$t('person.finishEditFirst')"
                    :enabledText="$t('admin.person.twoFactorAuthentication.tokenReset')"
                    position="start"
                  >
                    <v-btn
                      class="primary"
                      :disabled="isEditActive"
                    >
                      {{ $t('admin.person.twoFactorAuthentication.tokenReset') }}</v-btn
                    >
                  </SpshTooltip></v-col
                >
              </div>
            </v-col>
            <v-col v-else-if="personStore.loading"> <v-progress-circular indeterminate></v-progress-circular></v-col
          ></v-row>
        </v-container>
        <v-divider
          v-if="twoFactorAuthentificationStore.hasToken != undefined"
          class="border-opacity-100 rounded my-6 mx-4"
          color="#E5EAEF"
          thickness="6"
        ></v-divider>
        <!-- Zuordnungen -->
        <v-container
          v-if="!isEditActive"
          class="person-zuordnungen"
        >
          <v-row class="ml-md-16">
            <v-col
              cols="12"
              sm="auto"
            >
              <h3 class="subtitle-1">{{ $t('person.zuordnungen') }}</h3>
            </v-col>
            <v-spacer></v-spacer>
            <v-col
              cols="12"
              md="auto"
              class="mr-lg-13"
            >
              <div class="d-flex justify-sm-end">
                <v-col
                  cols="12"
                  sm="6"
                  md="auto"
                >
                  <v-btn
                    class="primary ml-lg-8"
                    data-testid="zuordnung-edit-button"
                    @Click="triggerEdit"
                    :block="mdAndDown"
                  >
                    {{ $t('edit') }}
                  </v-btn>
                </v-col>
              </div>
            </v-col>
          </v-row>
          <!-- Check if 'zuordnungen' array exists and has length > 0 -->
          <v-row
            class="ml-md-3 mt-md-n8"
            v-if="personStore.personenuebersicht?.zuordnungen && personStore.personenuebersicht?.zuordnungen.length > 0"
          >
            <v-col
              cols="10"
              offset="1"
              v-for="zuordnung in getZuordnungen"
              :key="zuordnung.sskId"
              :data-testid="`person-zuordnung-${zuordnung.sskId}`"
              :title="zuordnung.sskName"
            >
              <span class="text-body"
                >{{ getSskName(zuordnung.sskDstNr, zuordnung.sskName) }}: {{ zuordnung.rolle }}
                {{ zuordnung.klasse }}</span
              >
            </v-col>
          </v-row>
          <!-- Display 'Keine Zuordnungen gefunden' if the above condition is false -->
          <v-row v-else>
            <v-col
              cols="10"
              offset="1"
            >
              <h3 class="text-body">{{ $t('person.noZuordnungenFound') }}</h3>
            </v-col>
          </v-row>
        </v-container>
        <!-- Show this template if the edit button is triggered-->
        <v-container v-if="isEditActive">
          <template v-if="!isZuordnungFormActive && !isChangeKlasseFormActive">
            <v-row class="ml-md-16">
              <v-col
                v-if="!pendingDeletion && !pendingCreation && !pendingChangeKlasse"
                cols="12"
                sm="auto"
              >
                <h3 class="subtitle-1">{{ $t('person.editZuordnungen') }}: {{ $t('pleaseSelect') }}</h3>
              </v-col>
            </v-row>
            <v-row class="ml-md-16 mb-12">
              <v-col
                v-if="pendingDeletion || pendingCreation || pendingChangeKlasse"
                cols="12"
                sm="auto"
              >
                <h3 class="subtitle-1">{{ $t('person.checkAndSave') }}:</h3></v-col
              >
              <v-col
                cols="12"
                v-for="zuordnung in getZuordnungen?.filter((zuordnung) => zuordnung.editable)"
                :key="zuordnung.sskId"
                :data-testid="`person-zuordnung-${zuordnung.sskId}`"
                :title="zuordnung.sskName"
                class="py-0 d-flex align-items-center"
              >
                <template v-if="!pendingDeletion && !pendingCreation && !pendingChangeKlasse">
                  <div class="checkbox-div">
                    <v-checkbox
                      :ref="`checkbox-zuordnung-${zuordnung.sskId}`"
                      v-model="selectedZuordnungen"
                      :value="zuordnung"
                    >
                      <template v-slot:label>
                        <span class="text-body">
                          {{ getSskName(zuordnung.sskDstNr, zuordnung.sskName) }}: {{ zuordnung.rolle }}
                          {{ zuordnung.klasse }}
                        </span>
                      </template>
                    </v-checkbox>
                  </div>
                </template>
                <!-- Template  to show when the creation of a Zuordnung is pending -->
                <template v-else-if="pendingCreation && !pendingDeletion">
                  <span
                    class="text-body my-3 ml-5"
                    :class="{
                      'text-green':
                        newZuordnung &&
                        zuordnung.sskId === newZuordnung.sskId &&
                        zuordnung.rolleId === newZuordnung.rolleId,
                    }"
                  >
                    {{ getSskName(zuordnung.sskDstNr, zuordnung.sskName) }}: {{ zuordnung.rolle }}
                    {{ zuordnung.klasse }}
                    <span
                      v-if="
                        newZuordnung &&
                        zuordnung.sskId === newZuordnung.sskId &&
                        zuordnung.rolleId === newZuordnung.rolleId
                      "
                      class="text-body text-green"
                    >
                      ({{ $t('willBeCreated') }})</span
                    >
                  </span>
                </template>
                <!-- Template  to show when the deletion of a Zuordnung is pending -->
                <template v-else-if="pendingDeletion">
                  <span
                    class="text-body my-3 ml-5"
                    :class="{
                      'text-red': selectedZuordnungen.includes(zuordnung),
                    }"
                  >
                    {{ getSskName(zuordnung.sskDstNr, zuordnung.sskName) }}: {{ zuordnung.rolle }}
                    {{ zuordnung.klasse }}
                    <span
                      v-if="selectedZuordnungen.includes(zuordnung)"
                      class="text-body text-red"
                    >
                      ({{ $t('willBeRemoved') }})</span
                    >
                  </span>
                </template>
                <!-- Template  to show when the change Klasse is pending -->
                <template v-else-if="pendingChangeKlasse">
                  <div class="d-flex flex-column">
                    <span
                      class="text-body my-3 ml-5"
                      :class="{
                        'text-red': selectedZuordnungen.includes(zuordnung),
                      }"
                    >
                      {{ getSskName(zuordnung.sskDstNr, zuordnung.sskName) }}: {{ zuordnung.rolle }}
                      {{ zuordnung.klasse }}
                      <span
                        v-if="selectedZuordnungen.includes(zuordnung)"
                        class="text-body text-red"
                      >
                        ({{ $t('willBeRemoved') }})
                      </span>
                    </span>

                    <span
                      v-if="
                        newZuordnung &&
                        zuordnung.sskId === newZuordnung.sskId &&
                        zuordnung.rolleId === newZuordnung.rolleId
                      "
                      class="text-body my-3 ml-5"
                      :class="{
                        'text-green':
                          newZuordnung &&
                          zuordnung.sskId === newZuordnung.sskId &&
                          zuordnung.rolleId === newZuordnung.rolleId,
                      }"
                    >
                      {{ getSskName(zuordnung.sskDstNr, zuordnung.sskName) }}: {{ zuordnung.rolle }}
                      {{ newZuordnung?.klasse }}
                      <span
                        v-if="
                          newZuordnung &&
                          zuordnung.sskId === newZuordnung.sskId &&
                          zuordnung.rolleId === newZuordnung.rolleId
                        "
                        class="text-body text-green"
                      >
                        ({{ $t('willBeCreated') }})
                      </span>
                    </span>
                  </div>
                </template>
              </v-col>
              <v-spacer></v-spacer>
              <v-col
                v-if="!pendingDeletion && !pendingCreation && !pendingChangeKlasse"
                class="button-container"
                cols="12"
                md="auto"
              >
                <v-col
                  cols="12"
                  sm="6"
                  md="auto"
                >
                  <PersonenkontextDelete
                    v-if="!pendingDeletion"
                    :errorCode="personStore.errorCode"
                    :person="personStore.currentPerson"
                    :disabled="selectedZuordnungen.length === 0"
                    :zuordnungCount="zuordnungenResult?.filter((zuordnung) => zuordnung.editable).length || 0"
                    @onDeletePersonenkontext="prepareDeletion"
                  >
                  </PersonenkontextDelete>
                  <SpshTooltip
                    :enabledCondition="selectedZuordnungen.length === 0"
                    :disabledText="$t('person.addZuordnungNotAllowed')"
                    :enabledText="$t('person.addZuordnung')"
                    position="start"
                  >
                    <v-btn
                      class="primary mt-2"
                      @Click="triggerAddZuordnung"
                      data-testid="zuordnung-create-button"
                      :disabled="selectedZuordnungen.length > 0"
                      :block="mdAndDown"
                      ref="zuordnung-create-button"
                    >
                      {{ $t('person.addZuordnung') }}
                    </v-btn>
                  </SpshTooltip>
                  <SpshTooltip
                    :enabledCondition="selectedZuordnungen.length > 0"
                    :disabledText="$t('person.chooseZuordnungFirst')"
                    :enabledText="$t('person.changeRolleDescription')"
                    position="start"
                  >
                    <v-btn
                      class="primary mt-2"
                      data-testid="rolle-change-button"
                      :disabled="selectedZuordnungen.length === 0"
                      :block="mdAndDown"
                    >
                      {{ $t('person.changeRolle') }}
                    </v-btn>
                  </SpshTooltip>
                  <SpshTooltip
                    :enabledCondition="selectedZuordnungen.length > 0"
                    :disabledText="$t('person.chooseZuordnungFirst')"
                    :enabledText="$t('person.modifyBefristungDescription')"
                    position="start"
                  >
                    <v-btn
                      class="primary mt-2"
                      data-testid="befristung-change-button"
                      :disabled="selectedZuordnungen.length === 0"
                      :block="mdAndDown"
                    >
                      {{ $t('person.modifyBefristung') }}
                    </v-btn>
                  </SpshTooltip>
                  <SpshTooltip
                    v-if="hasKlassenZuordnung"
                    :enabledCondition="canChangeKlasse"
                    :disabledText="$t('person.chooseKlasseZuordnungFirst')"
                    :enabledText="$t('person.changeKlasseDescription')"
                    position="start"
                  >
                    <v-btn
                      class="primary mt-2"
                      @Click="triggerChangeKlasse"
                      data-testid="klasse-change-button"
                      :disabled="!canChangeKlasse"
                      :block="mdAndDown"
                    >
                      {{ $t('transfer') }}
                    </v-btn>
                  </SpshTooltip>
                </v-col>
              </v-col>
            </v-row>
            <v-row
              v-if="
                personStore.personenuebersicht?.zuordnungen &&
                personStore.personenuebersicht?.zuordnungen.length === 0 &&
                !pendingCreation &&
                !pendingDeletion
              "
            >
              <v-col
                class="mt-n12 mb-16"
                cols="10"
                offset="1"
              >
                <h3 class="text-body">{{ $t('person.noZuordnungenFound') }}</h3>
              </v-col>
            </v-row>
            <v-row class="save-cancel-row ml-md-16 mb-3 pt-14">
              <v-col
                class="cancel-col"
                cols="12"
                sm="6"
                md="auto"
              >
                <v-btn
                  class="secondary small"
                  data-testid="zuordnung-edit-cancel"
                  @click="cancelEdit"
                  :block="mdAndDown"
                >
                  {{ $t('cancel') }}
                </v-btn>
              </v-col>
              <v-col
                cols="12"
                sm="6"
                md="auto"
              >
                <SpshTooltip
                  :enabledCondition="!isSaveButtonDisabled"
                  :disabledText="$t('person.noChangesToSave')"
                  :enabledText="$t('person.saveChanges')"
                >
                  <v-btn
                    class="primary small"
                    data-testid="zuordnung-changes-save"
                    @click="handleSaveClick"
                    :block="mdAndDown"
                    :disabled="isSaveButtonDisabled"
                  >
                    {{ $t('save') }}
                  </v-btn>
                </SpshTooltip>
              </v-col>
            </v-row>
          </template>
          <!-- Form to add Zuordnung -->
          <template v-if="isZuordnungFormActive && !pendingDeletion && !pendingChangeKlasse">
            <v-form
              data-testid="zuordnung-creation-form"
              @submit="onSubmitCreateZuordnung"
            >
              <v-row class="ml-md-16">
                <v-col
                  cols="12"
                  sm="auto"
                >
                  <h3 class="subtitle-1">{{ $t('person.addZuordnung') }}:</h3></v-col
                >
              </v-row>
              <v-container class="px-lg-16">
                <!-- Organisation, Rolle, Klasse zuordnen -->
                <PersonenkontextCreate
                  ref="personenkontext-creation-form"
                  :showHeadline="false"
                  :organisationen="organisationen"
                  :rollen="filteredRollen"
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
                <!-- Befristung -->
                <div v-if="selectedOrganisation && selectedRolle">
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
              </v-container>
              <v-row class="py-3 px-2 justify-center">
                <v-spacer class="hidden-sm-and-down"></v-spacer>
                <v-col
                  cols="12"
                  sm="6"
                  md="auto"
                >
                  <v-btn
                    :block="mdAndDown"
                    class="secondary"
                    @Click="cancelEdit"
                    data-testid="zuordnung-creation-discard-button"
                    >{{ $t('cancel') }}</v-btn
                  >
                </v-col>
                <v-col
                  cols="12"
                  sm="6"
                  md="auto"
                >
                  <v-btn
                    :block="mdAndDown"
                    :disabled="!canCommit"
                    class="primary"
                    data-testid="zuordnung-creation-submit-button"
                    type="submit"
                    >{{ $t('person.addZuordnung') }}</v-btn
                  >
                </v-col>
              </v-row>
            </v-form>
          </template>
          <!-- Form to change Klasse -->
          <template v-if="isChangeKlasseFormActive && !pendingChangeKlasse">
            <v-form
              data-testid="klasse-change-form"
              @submit="onSubmitChangeKlasse"
            >
              <v-row class="ml-md-16">
                <v-col
                  cols="12"
                  sm="auto"
                >
                  <h3 class="subtitle-1">{{ $t('transfer') }}:</h3></v-col
                >
              </v-row>
              <v-container class="px-lg-16">
                <KlasseChange
                  :isEditActive="isEditActive"
                  :readonly="true"
                  :schulen="organisationen"
                  :klassen="klassen"
                  :selectedSchuleProps="selectedSchuleProps"
                  :selectedNewKlasseProps="selectedNewKlasseProps"
                  :onSubmit="onSubmitChangeKlasse"
                  ref="klasse-change-form"
                  v-model:selectedSchule="selectedSchule"
                  v-model:selectedNewKlasse="selectedNewKlasse"
                ></KlasseChange>
              </v-container>
              <v-row class="py-3 px-2 justify-center">
                <v-spacer class="hidden-sm-and-down"></v-spacer>
                <v-col
                  cols="12"
                  sm="6"
                  md="auto"
                >
                  <v-btn
                    :block="mdAndDown"
                    class="secondary"
                    @Click="cancelEdit"
                    data-testid="klasse-change-discard-button"
                    >{{ $t('cancel') }}</v-btn
                  >
                </v-col>
                <v-col
                  cols="12"
                  sm="6"
                  md="auto"
                >
                  <SpshTooltip
                    :enabledCondition="!isSubmitDisabled"
                    :disabledText="$t('person.changeKlasseNotDisabledDescription')"
                    :enabledText="$t('transfer')"
                    position="start"
                  >
                    <v-btn
                      :block="mdAndDown"
                      class="primary"
                      data-testid="klasse-change-submit-button"
                      :disabled="isSubmitDisabled"
                      type="submit"
                      >{{ $t('transfer') }}</v-btn
                    >
                  </SpshTooltip>
                </v-col>
              </v-row>
            </v-form>
          </template>
        </v-container>
        <v-divider
          class="border-opacity-100 rounded my-6 mx-4"
          color="#E5EAEF"
          thickness="6"
        ></v-divider>
        <!-- Delete person -->
        <v-container
          v-if="authStore.hasPersonenLoeschenPermission"
          class="person-delete"
        >
          <v-row class="ml-md-16">
            <v-col>
              <h3 class="subtitle-1">{{ $t('admin.person.status') }}</h3>
            </v-col>
            <v-col
              class="mr-lg-13"
              cols="12"
              md="auto"
              v-if="personStore.currentPerson"
            >
              <div class="d-flex justify-sm-end">
                <PersonDelete
                  :disabled="isEditActive"
                  :errorCode="personStore.errorCode"
                  :person="personStore.currentPerson"
                  @onDeletePerson="deletePerson(currentPersonId)"
                >
                </PersonDelete>
              </div>
            </v-col>
            <v-col v-else-if="personStore.loading"> <v-progress-circular indeterminate></v-progress-circular></v-col
          ></v-row>
        </v-container>
      </template>
    </LayoutCard>
    <!-- Success Dialog after deleting the Zuordnung-->
    <v-dialog
      v-model="deleteSuccessDialogVisible"
      persistent
      max-width="600px"
    >
      <LayoutCard
        :closable="true"
        :header="$t('person.editZuordnungen')"
        @onCloseClicked="closeDeleteSuccessDialog"
      >
        <v-card-text>
          <v-container>
            <v-row class="text-body bold px-md-16">
              <v-col
                offset="1"
                cols="10"
              >
                <span>{{ $t('person.deleteZuordnungSuccess') }}</span>
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
                class="primary"
                @click.stop="closeDeleteSuccessDialog"
              >
                {{ $t('close') }}
              </v-btn>
            </v-col>
          </v-row>
        </v-card-actions>
      </LayoutCard>
    </v-dialog>
    <!-- Success Dialog after creating the Zuordnung-->
    <v-dialog
      v-model="createSuccessDialogVisible"
      persistent
      max-width="600px"
    >
      <LayoutCard
        :closable="true"
        :header="$t('person.editZuordnungen')"
        @onCloseClicked="closeCreateSuccessDialog"
      >
        <v-card-text>
          <v-container>
            <v-row class="text-body bold px-md-16">
              <v-col
                offset="1"
                cols="10"
              >
                <span>{{ $t('person.addZuordnungSuccess') }}</span>
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
                class="primary"
                @click.stop="closeCreateSuccessDialog"
              >
                {{ $t('close') }}
              </v-btn>
            </v-col>
          </v-row>
        </v-card-actions>
      </LayoutCard>
    </v-dialog>
    <!-- Success Dialog after chagning the name of the Klasse-->
    <v-dialog
      v-model="changeKlasseSuccessDialogVisible"
      persistent
      max-width="600px"
    >
      <LayoutCard
        :closable="true"
        :header="$t('transfer')"
        @onCloseClicked="closeChangeKlasseSuccessDialog"
      >
        <v-card-text>
          <v-container>
            <v-row class="text-body bold">
              <v-col
                offset="1"
                cols="10"
              >
                <span>{{ $t('person.changeKlasseSuccess') }}</span>
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
                class="primary"
                @click.stop="closeCreateSuccessDialog"
              >
                {{ $t('close') }}
              </v-btn>
            </v-col>
          </v-row>
        </v-card-actions>
      </LayoutCard>
    </v-dialog>
    <!-- Confirmation Dialog after filling the form and adding the Zuordnung-->
    <v-dialog
      v-model="createZuordnungConfirmationDialogVisible"
      persistent
      max-width="600px"
    >
      <LayoutCard
        :closable="true"
        :header="$t('person.editZuordnungen')"
        @onCloseClicked="cancelAddition"
      >
        <v-card-text>
          <v-container>
            <v-row class="text-body bold px-md-16">
              <v-col
                offset="1"
                cols="10"
              >
                <span>{{ createZuordnungConfirmationDialogMessage }}</span>
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
                class="primary"
                @click.stop="confirmDialogAddition"
              >
                {{ $t('yes') }}
              </v-btn>
            </v-col>
            <v-col
              cols="12"
              sm="6"
              md="4"
            >
              <v-btn
                :block="mdAndDown"
                class="secondary"
                @click.stop="cancelAddition"
              >
                {{ $t('no') }}
              </v-btn>
            </v-col>
          </v-row>
        </v-card-actions>
      </LayoutCard>
    </v-dialog>
    <!-- Confirmation Dialog after filling the form to change Klasse-->
    <v-dialog
      v-model="changeKlasseConfirmationDialogVisible"
      persistent
      max-width="600px"
    >
      <LayoutCard
        :closable="true"
        :header="$t('transfer')"
        @onCloseClicked="cancelChangeKlasse"
      >
        <v-card-text>
          <v-container>
            <v-row class="text-body bold">
              <v-col
                offset="1"
                cols="10"
              >
                <span>{{ changeKlasseConfirmationDialogMessage }}</span>
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
                class="primary"
                @click.stop="confirmDialogChangeKlasse"
              >
                {{ $t('yes') }}
              </v-btn>
            </v-col>
            <v-col
              cols="12"
              sm="6"
              md="4"
            >
              <v-btn
                :block="mdAndDown"
                class="secondary"
                @click.stop="cancelChangeKlasse"
              >
                {{ $t('no') }}
              </v-btn>
            </v-col>
          </v-row>
        </v-card-actions>
      </LayoutCard>
    </v-dialog>
    <!-- Dialog to inform the user that he can't delete his own Zuordnungen -->
    <v-dialog
      v-model="cannotDeleteDialogVisible"
      persistent
      max-width="600px"
    >
      <LayoutCard
        :closable="true"
        :header="$t('person.editZuordnungen')"
        @onCloseClicked="closeCannotDeleteDialog"
      >
        <v-card-text>
          <v-container>
            <v-row class="text-body bold px-md-16">
              <v-col
                offset="1"
                cols="10"
              >
                <span>{{ $t('person.cannotDeleteOwnZuordnung') }}</span>
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
                class="primary"
                @click.stop="closeCannotDeleteDialog"
              >
                {{ $t('close') }}
              </v-btn>
            </v-col>
          </v-row>
        </v-card-actions>
      </LayoutCard>
    </v-dialog>
  </div>
</template>

<style scoped>
  @media only screen and (max-width: 600px) {
    .save-cancel-row {
      margin-top: -40px;
    }
    .cancel-col {
      margin-bottom: -15px;
    }
  }
</style>
