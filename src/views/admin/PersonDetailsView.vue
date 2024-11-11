<script setup lang="ts">
  import type { PersonenkontextRolleFieldsResponse } from '@/api-client/generated/api';
  import SpshTooltip from '@/components/admin/SpshTooltip.vue';
  import KlasseChange from '@/components/admin/klassen/KlasseChange.vue';
  import KopersInput from '@/components/admin/personen/KopersInput.vue';
  import PasswordReset from '@/components/admin/personen/PasswordReset.vue';
  import PersonDelete from '@/components/admin/personen/PersonDelete.vue';
  import PersonLock from '@/components/admin/personen/PersonLock.vue';
  import PersonSync from '@/components/admin/personen/PersonSync.vue';
  import PersonenkontextCreate from '@/components/admin/personen/PersonenkontextCreate.vue';
  import PersonenkontextDelete from '@/components/admin/personen/PersonenkontextDelete.vue';
  import SpshAlert from '@/components/alert/SpshAlert.vue';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import TokenReset from '@/components/two-factor-authentication/TokenReset.vue';
  import TwoFactorAuthenticationSetUp from '@/components/two-factor-authentication/TwoFactorAuthenticationSetUp.vue';
  import { useKlassen } from '@/composables/useKlassen';
  import { useOrganisationen } from '@/composables/useOrganisationen';
  import { useRollen, type TranslatedRolleWithAttrs } from '@/composables/useRollen';
  import { useAuthStore, type AuthStore } from '@/stores/AuthStore';
  import {
    OrganisationsTyp,
    useOrganisationStore,
    type Organisation,
    type OrganisationStore,
  } from '@/stores/OrganisationStore';
  import {
    EmailStatus,
    LockKeys,
    usePersonStore,
    type Person,
    type Personendatensatz,
    type PersonStore,
    type PersonWithUebersicht,
  } from '@/stores/PersonStore';
  import {
    usePersonenkontextStore,
    type PersonenkontextStore,
    type PersonenkontextWorkflowResponse,
    type Zuordnung,
  } from '@/stores/PersonenkontextStore';
  import { RollenArt, RollenMerkmal } from '@/stores/RolleStore';
  import {
    TokenKind,
    useTwoFactorAuthentificationStore,
    type TwoFactorAuthentificationStore,
  } from '@/stores/TwoFactorAuthentificationStore';
  import PersonenMetadataChange from '@/components/admin/personen/PersonenMetadataChange.vue';
  import { isBefristungspflichtRolle, useBefristungUtils, type BefristungUtilsType } from '@/utils/befristung';
  import { formatDate, formatDateToISO, getNextSchuljahresende } from '@/utils/date';
  import {
    getDirtyState,
    getPersonenkontextFieldDefinitions,
    getValidationSchema,
    type PersonenkontextFieldDefinitions,
  } from '@/utils/validationPersonenkontext';
  import { toTypedSchema } from '@vee-validate/yup';
  import { useForm, type BaseFieldProps, type FormContext, type TypedSchema } from 'vee-validate';
  import { computed, onBeforeMount, onMounted, onUnmounted, ref, watch, type ComputedRef, type Ref } from 'vue';
  import { useI18n, type Composer } from 'vue-i18n';
  import {
    onBeforeRouteLeave,
    useRoute,
    useRouter,
    type NavigationGuardNext,
    type RouteLocationNormalized,
    type RouteLocationNormalizedLoaded,
    type Router,
  } from 'vue-router';
  import { useDisplay } from 'vuetify';
  import { object, string, StringSchema, type AnyObject } from 'yup';
  import type { LockUserBodyParams } from '@/api-client/generated';
  import type { TranslatedObject } from '@/types';
  import { DIN_91379A, NO_LEADING_TRAILING_SPACES } from '@/utils/validation';

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

  const isEditPersonMetadataActive: Ref<boolean> = ref(false);

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
  const hasNoKopersNr: Ref<boolean | undefined> = ref(false);
  const changePersonMetadataSuccessVisible: Ref<boolean> = ref(false);
  const changePersonMetadataSuccessMessage: Ref<string> = ref('');

  const showNoKopersNrConfirmationDialog: Ref<boolean> = ref(false);

  const creationErrorText: Ref<string> = ref('');
  const creationErrorTitle: Ref<string> = ref('');

  const showUnsavedChangesDialog: Ref<boolean> = ref(false);
  let blockedNext: () => void = () => {};
  const calculatedBefristung: Ref<string | undefined> = ref('');
  const loading: Ref<boolean> = ref(true);

  function navigateToPersonTable(): void {
    router.push({ name: 'person-management' });
  }

  async function resetPassword(personId: string): Promise<void> {
    await personStore.resetPassword(personId);
    password.value = personStore.newPassword || '';
  }

  async function onLockUser(lockedBy: string, date: string | undefined): Promise<void> {
    if (!personStore.currentPerson) return;
    let bodyParams: LockUserBodyParams = {
      lock: !personStore.currentPerson.person.isLocked,
      locked_by: lockedBy,
      locked_until: date,
    };
    await personStore.lockPerson(personStore.currentPerson.person.id, bodyParams);
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

  // Synchronizes the person with external systems
  async function syncPerson(personId: string): Promise<void> {
    await personStore.syncPersonById(personId);
  }

  function getOrganisationDisplayName(organisation: Organisation): string {
    return organisation.kennung ? `${organisation.kennung} (${organisation.name})` : organisation.name;
  }

  // translate keys and format attributes for display
  const getuserLock: ComputedRef<{ key: string; attribute: string }[]> = computed(() => {
    if (!personStore.currentPerson?.person.isLocked) return [];

    const { userLock }: Person = personStore.currentPerson.person;
    if (!userLock) return [];

    return Object.entries(userLock).map(([key, attribute]: [string, string]) => {
      switch (key) {
        case LockKeys.LockedBy:
          return {
            key: t('person.lockedBy'),
            attribute: organisationStore.lockingOrganisation
              ? getOrganisationDisplayName(organisationStore.lockingOrganisation)
              : t('admin.organisation.unknownOrganisation'),
          };

        case LockKeys.CreatedAt:
          return {
            key: t('person.lockedSince'),
            attribute: new Intl.DateTimeFormat('de-DE', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            }).format(new Date(attribute)),
          };
        case LockKeys.LockedUntil:
          return {
            key: t('person.lockedUntil'),
            attribute,
          };

        default:
          return { key, attribute };
      }
    });
  });

  watch(
    () => personStore.currentPerson?.person,
    async (person: Person | undefined) => {
      if (!(person && person.isLocked && person.userLock)) return;
      await organisationStore.getLockingOrganisationById(person.userLock.locked_by);
    },
  );

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

  let closeChangePersonMetadataSuccessDialog = (): void => {
    changePersonMetadataSuccessVisible.value = false;
    router.push(route).then(() => {
      router.go(0);
    });
  };

  // Triggers the template to add a new Zuordnung
  const triggerAddZuordnung = async (): Promise<void> => {
    await personenkontextStore.processWorkflowStep({ limit: 25 });
    isZuordnungFormActive.value = true;
  };

  const confirmDeletion = async (): Promise<void> => {
    // Check if the current user is trying to delete their own Zuordnungen
    if (authStore.currentUser?.personId === currentPersonId) {
      cannotDeleteDialogVisible.value = true;
      return;
    }

    // The remaining Zuordnungen that were not selected for deletion
    const remainingZuordnungen: Zuordnung[] | undefined = zuordnungenResult.value?.filter(
      (zuordnung: Zuordnung) => !selectedZuordnungen.value.includes(zuordnung),
    );

    // Get all Klassen Zuordnungen
    const klassenZuordnungen: Zuordnung[] | undefined = personStore.personenuebersicht?.zuordnungen.filter(
      (zuordnung: Zuordnung) => zuordnung.typ === OrganisationsTyp.Klasse,
    );

    // Create a map of Schule to Klasse relationships to keep the Klassen that are not supposed to be deleted
    const schuleToKlasseMap: Map<string, Zuordnung[]> = new Map<string, Zuordnung[]>();

    klassenZuordnungen?.forEach((klasseZuordnung: Zuordnung) => {
      const schuleId: string = klasseZuordnung.administriertVon;
      if (!schuleToKlasseMap.has(schuleId)) {
        schuleToKlasseMap.set(schuleId, []);
      }
      schuleToKlasseMap.get(schuleId)?.push(klasseZuordnung);
    });

    // Find Klassen that should be kept
    const klassenToKeep: Zuordnung[] = [];

    // For each remaining Zuordnung that is a Schule, keep its associated Klassen
    remainingZuordnungen?.forEach((zuordnung: Zuordnung) => {
      const associatedKlassen: Zuordnung[] = schuleToKlasseMap.get(zuordnung.sskId) || [];
      klassenToKeep.push(...associatedKlassen);
    });

    // Combine remaining Zuordnungen with Klassen that should be kept
    const combinedZuordnungen: Zuordnung[] | undefined = remainingZuordnungen?.concat(klassenToKeep);

    // Update the personenkontexte with the filtered list
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

  const alertButtonTextKopers: ComputedRef<string> = computed(() => {
    switch (personStore.errorCode) {
      case 'PERSONALNUMMER_NICHT_EINDEUTIG':
        return t('admin.person.backToInput');
      case 'NEWER_VERSION_OF_PERSON_AVAILABLE':
        return t('refreshData');
      default:
        return t('nav.backToList');
    }
  });

  function getSskName(sskDstNr: string | undefined, sskName: string): string {
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
      .sort((a: Zuordnung, b: Zuordnung) => {
        if (a.sskDstNr === undefined) return 1;
        if (b.sskDstNr === undefined) return -1;
        return a.sskDstNr.localeCompare(b.sskDstNr);
      });
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
    selectedKopersNr?: string;
  };

  type ChangeKlasseForm = {
    selectedSchule: string;
    selectedNewKlasse: string;
  };

  type ChangePersonMetadata = {
    selectedVorname: string;
    selectedFamilienname: string;
    selectedKopersNrMetadata: string;
  };

  // Define a method to check if the selected Rolle is of type "Lern"
  function isLernRolle(selectedRolleId: string): boolean {
    const rolle: TranslatedRolleWithAttrs | undefined = rollen.value?.find(
      (r: TranslatedRolleWithAttrs) => r.value === selectedRolleId,
    );
    return !!rolle && rolle.rollenart === RollenArt.Lern;
  }

  // Used for the form
  function isKopersRolle(selectedRolleId: string | undefined): boolean {
    const rolle: TranslatedRolleWithAttrs | undefined = rollen.value?.find(
      (r: TranslatedRolleWithAttrs) => r.value === selectedRolleId,
    );
    return !!rolle && !!rolle.merkmale && rolle.merkmale.has(RollenMerkmal.KopersPflicht);
  }

  const hasKopersNummer: ComputedRef<boolean> = computed(() => {
    return !!personStore.currentPerson?.person.personalnummer;
  });

  // Used on mount to check the retrieved Zuordnungen and if any of them has a Koperspflicht Merkmal
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

  // Validation schema for the form for changing the Klasse (Versetzen)
  const changeKlasseValidationSchema: TypedSchema = toTypedSchema(
    object({
      selectedNewKlasse: string().when('selectedSchule', {
        is: (selectedSchule: string) => selectedSchule,
        then: (schema: StringSchema<string | undefined, AnyObject, undefined, ''>) =>
          schema.required(t('admin.klasse.rules.klasse.required')),
      }),
    }),
  );

  // Validation schema for the form for changing person metadata
  const changePersonMetadataValidationSchema: TypedSchema = toTypedSchema(
    object({
      selectedKopersNrMetadata: string()
        .matches(NO_LEADING_TRAILING_SPACES, t('admin.person.rules.kopersNr.noLeadingTrailingSpaces'))
        .when([], {
          is: () => personStore.currentPerson?.person.personalnummer,
          then: (schema: StringSchema) => schema.required(t('admin.person.rules.kopersNr.required')),
          otherwise: (schema: StringSchema) => schema.notRequired(),
        }),
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

  const formContext: FormContext<ZuordnungCreationForm, ZuordnungCreationForm> = useForm({
    validationSchema: getValidationSchema(t, hasNoKopersNr, hasKopersNummer),
  });

  const isZuordnungCreationFormDirty: ComputedRef<boolean> = computed(() => getDirtyState(formContext));

  const {
    selectedRolle,
    selectedRolleProps,
    selectedOrganisation,
    selectedOrganisationProps,
    selectedKlasse,
    selectedKlasseProps,
    selectedBefristung,
    selectedBefristungProps,
    selectedBefristungOption,
    selectedBefristungOptionProps,
    selectedKopersNr,
    selectedKopersNrProps,
  }: PersonenkontextFieldDefinitions = getPersonenkontextFieldDefinitions(formContext);

  // eslint-disable-next-line @typescript-eslint/typedef
  const {
    defineField: defineFieldChangeKlasse,
    handleSubmit: handleSubmitChangeKlasse,
    resetForm: resetChangeKlasseForm,
    isFieldDirty: isChangeKlasseFieldDirty,
  } = useForm<ChangeKlasseForm>({
    validationSchema: changeKlasseValidationSchema,
  });

  // eslint-disable-next-line @typescript-eslint/typedef
  const {
    defineField: defineFieldChangePersonMetadata,
    handleSubmit: handleSubmitChangePersonMetadata,
    resetForm: resetFormChangePersonMetadata,
    isFieldDirty: isChangePersonMetadataFieldDirty,
    setFieldValue: setFieldValueChangePersonMetadata,
  } = useForm<ChangePersonMetadata>({
    validationSchema: changePersonMetadataValidationSchema,
  });

  // Change Klasse Form
  const [selectedSchule, selectedSchuleProps]: [
    Ref<string | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineFieldChangeKlasse('selectedSchule', vuetifyConfig);
  const [selectedNewKlasse, selectedNewKlasseProps]: [
    Ref<string | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineFieldChangeKlasse('selectedNewKlasse', vuetifyConfig);

  // Change Person Info Form
  const [selectedVorname, selectedVornameProps]: [
    Ref<string | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineFieldChangePersonMetadata('selectedVorname', vuetifyConfig);
  const [selectedFamilienname, selectedFamiliennameProps]: [
    Ref<string | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineFieldChangePersonMetadata('selectedFamilienname', vuetifyConfig);
  const [selectedKopersNrMetadata, selectedKopersNrMetadataProps]: [
    Ref<string | undefined | null>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineFieldChangePersonMetadata('selectedKopersNrMetadata', vuetifyConfig);

  // Methods from utils that handle the Befristung events and sets up watchers
  const { handleBefristungUpdate, handleBefristungOptionUpdate, setupWatchers }: BefristungUtilsType =
    useBefristungUtils({
      formContext,
      selectedBefristung,
      selectedBefristungOption,
      calculatedBefristung,
      selectedRolle,
    });

  async function navigateBackToKopersForm(): Promise<void> {
    const personalnummer: string | null | undefined = personStore.currentPerson?.person.personalnummer;
    const vorname: string | undefined = personStore.currentPerson?.person.name.vorname;
    const familienname: string | undefined = personStore.currentPerson?.person.name.familienname;

    // Set the initial values of the person in the form again when navigating back to it after an error in the first submit.
    setFieldValueChangePersonMetadata('selectedKopersNrMetadata', personalnummer ?? '');
    setFieldValueChangePersonMetadata('selectedVorname', vorname ?? '');
    setFieldValueChangePersonMetadata('selectedFamilienname', familienname ?? '');
    personStore.errorCode = '';
    personenkontextStore.errorCode = '';
  }

  const alertButtonActionKopers: ComputedRef<() => void> = computed(() => {
    switch (personStore.errorCode) {
      case 'PERSONALNUMMER_NICHT_EINDEUTIG':
        return navigateBackToKopersForm;
      case 'NEWER_VERSION_OF_PERSON_AVAILABLE':
        return () => router.go(0);
      default:
        return navigateToPersonTable;
    }
  });

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
    formContext.resetForm();
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
    if (selectedKopersNr.value !== null) {
      await personenkontextStore.updatePersonenkontexte(
        finalZuordnungen.value,
        currentPersonId,
        selectedKopersNr.value,
      );
    }
    createSuccessDialogVisible.value = !personenkontextStore.errorCode;
    formContext.resetForm();
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

  // Helper function to determine the existing RollenArt
  function getExistingRollenArt(zuordnungen: Zuordnung[]): RollenArt | undefined {
    const rollenIds: string[] = zuordnungen.map((zuordnung: Zuordnung) => zuordnung.rolleId);
    const existingRollen: TranslatedRolleWithAttrs[] | undefined = rollen.value?.filter(
      (rolle: TranslatedRolleWithAttrs) => rollenIds.includes(rolle.value),
    );

    if (existingRollen && existingRollen.length > 0) {
      return existingRollen[0]?.rollenart;
    }

    return undefined;
  }

  // Filter out the Rollen based on the user's existing Zuordnungen and selected organization
  const filteredRollen: ComputedRef = computed(() => {
    const existingZuordnungen: Zuordnung[] | undefined = personStore.personenuebersicht?.zuordnungen;

    // If no existing Zuordnungen then show all roles
    if (!existingZuordnungen || existingZuordnungen.length === 0) {
      return rollen.value;
    }

    const selectedOrgaId: string | undefined = selectedOrganisation.value;

    // Determine the existing RollenArt from Zuordnungen
    const existingRollenArt: RollenArt | undefined = getExistingRollenArt(existingZuordnungen);

    // Filter out Rollen that the user already has in the selected organization
    return rollen.value?.filter((rolle: TranslatedRolleWithAttrs) => {
      // Check if the user already has this role in the selected organization
      const alreadyHasRolleInSelectedOrga: boolean = existingZuordnungen.some(
        (zuordnung: Zuordnung) => zuordnung.rolleId === rolle.value && zuordnung.sskId === selectedOrgaId,
      );

      // If there's an existing RollenArt, only allow roles of that type
      if (existingRollenArt) {
        return !alreadyHasRolleInSelectedOrga && rolle.rollenart === existingRollenArt;
      }

      // If there's no existing RollenArt, allow any role that hasn't been assigned yet in the selected organization
      return !alreadyHasRolleInSelectedOrga;
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

  const onSubmitCreateZuordnung: (e?: Event | undefined) => Promise<void | undefined> = formContext.handleSubmit(() => {
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
  });

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
    async (newValue: PersonWithUebersicht | null) => {
      zuordnungenResult.value = computeZuordnungen(newValue);
      const organisationIds: Array<string> = [...new Set(newValue?.zuordnungen.map((z: Zuordnung) => z.sskId))];
      if (organisationIds.length > 0) await organisationStore.getParentOrganisationsByIds(organisationIds);
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

  // Triggers the template to start editing the person informations
  const triggerPersonMetadataEdit = (): void => {
    isEditPersonMetadataActive.value = true;
    const personalnummer: string | null | undefined = personStore.currentPerson?.person.personalnummer;
    const vorname: string | undefined = personStore.currentPerson?.person.name.vorname;
    const familienname: string | undefined = personStore.currentPerson?.person.name.familienname;

    setFieldValueChangePersonMetadata('selectedKopersNrMetadata', personalnummer ?? '');
    setFieldValueChangePersonMetadata('selectedVorname', vorname ?? '');
    setFieldValueChangePersonMetadata('selectedFamilienname', familienname ?? '');
  };

  const cancelEditPersonMetadata = (): void => {
    isEditPersonMetadataActive.value = false;
    resetFormChangePersonMetadata();
  };

  // Handles the value emitted by PersonenMetadata for the selectedKopersNr
  function handleSelectedKopersNrUpdate(value: string | undefined | null): void {
    selectedKopersNrMetadata.value = value;
  }

  // Handles the value emitted by PersonenMetadata for the selectedVorname
  function handleSelectedVorname(value: string | undefined): void {
    selectedVorname.value = value;
  }

  // Handles the value emitted by PersonenMetadata for the selectedFamilienname
  function handleSelectedFamilienname(value: string | undefined): void {
    selectedFamilienname.value = value;
  }

  // Submit the form for changing person informations (Vorname, Nachname, KopersNr.)
  const onSubmitChangePersonMetadata: (e?: Event) => Promise<Promise<void> | undefined> =
    handleSubmitChangePersonMetadata(async () => {
      if (selectedKopersNrMetadata.value && selectedVorname.value && selectedFamilienname.value) {
        if (selectedKopersNrMetadata.value === personStore.currentPerson?.person.personalnummer) {
          await personStore.changePersonMetadataById(
            currentPersonId,
            selectedVorname.value,
            selectedFamilienname.value,
          );
        } else {
          await personStore.changePersonMetadataById(
            currentPersonId,
            selectedVorname.value,
            selectedFamilienname.value,
            selectedKopersNrMetadata.value,
          );
        }
      } else if (!selectedKopersNrMetadata.value && selectedVorname.value && selectedFamilienname.value) {
        await personStore.changePersonMetadataById(currentPersonId, selectedVorname.value, selectedFamilienname.value);
      }
      changePersonMetadataSuccessMessage.value = t('admin.person.personalInfoSuccessDialogMessageWithUsername');
      changePersonMetadataSuccessVisible.value = !personStore.errorCode;
      resetFormChangePersonMetadata();
    });

  // Checks for dirtiness depending on the active form
  function isFormDirty(): boolean {
    if (isEditPersonMetadataActive.value) {
      return (
        isChangePersonMetadataFieldDirty('selectedKopersNrMetadata') ||
        isChangePersonMetadataFieldDirty('selectedVorname') ||
        isChangePersonMetadataFieldDirty('selectedFamilienname')
      );
    } else if (isChangeKlasseFormActive.value) {
      return isChangeKlasseFieldDirty('selectedSchule') || isChangeKlasseFieldDirty('selectedNewKlasse');
    } else if (isEditActive.value) {
      return isZuordnungCreationFormDirty.value;
    }
    return false;
  }

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

  setupWatchers();

  watch(hasNoKopersNr, async (newValue: boolean | undefined) => {
    if (newValue) {
      showNoKopersNrConfirmationDialog.value = true;
    }
  });

  // Checks if the entered KopersNr is the same one that is already assigned to the user.
  // This is used to disable the save button in that case (To avoid errors).
  const hasSameMetadata: ComputedRef<boolean> = computed(() => {
    // Check if personalnummer does not exist and names are unchanged
    const isPersonalnummerMissing: boolean = !personStore.currentPerson?.person.personalnummer;
    const isFamiliennameUnchanged: boolean =
      selectedFamilienname.value === personStore.currentPerson?.person.name.familienname;
    const isVornameUnchanged: boolean = selectedVorname.value === personStore.currentPerson?.person.name.vorname;

    // If personalnummer is missing but selectedKopersNr has a value, return false
    if (isPersonalnummerMissing && selectedKopersNrMetadata.value) {
      return false;
    }

    // If personalnummer doesn't exist and both names are unchanged, return true
    if (isPersonalnummerMissing && isFamiliennameUnchanged && isVornameUnchanged) {
      return true;
    }

    // Otherwise, return true only if all fields match exactly
    if (
      selectedKopersNrMetadata.value === personStore.currentPerson?.person.personalnummer &&
      isFamiliennameUnchanged &&
      isVornameUnchanged
    ) {
      return true;
    }

    return false;
  });

  // Computed property to check if the second radio button should be disabled
  const isUnbefristetButtonDisabled: ComputedRef<boolean> = computed(() => {
    return isBefristungspflichtRolle(selectedRolle.value);
  });

  const intersectingOrganisations: ComputedRef<Set<Organisation>> = computed(() => {
    const adminOrganisationIds: Set<string> = new Set(
      authStore.currentUser?.personenkontexte?.map((pk: PersonenkontextRolleFieldsResponse) => pk.organisationsId),
    );
    return new Set<Organisation>(
      organisationStore.parentOrganisationen.filter((userOrg: Organisation) => adminOrganisationIds.has(userOrg.id)),
    );
  });

  const twoFactorAuthenticationConnectionError: ComputedRef<string> = computed(() => {
    // Early return if loading
    if (twoFactorAuthentificationStore.loading) return '';

    switch (twoFactorAuthentificationStore.errorCode) {
      case 'TOKEN_STATE_ERROR':
        return t('admin.person.twoFactorAuthentication.errors.tokenStateError');
      case 'PI_UNAVAILABLE_ERROR':
        return t('admin.person.twoFactorAuthentication.errors.connection');
      default:
        return '';
    }
  });

  // Computed property to define what will be shown in the field Email depending on the returned status.
  const emailStatusText: ComputedRef<{
    text: string;
    tooltip: string;
  }> = computed(() => {
    switch (personStore.currentPerson?.person.email?.status) {
      case EmailStatus.Enabled:
        return {
          text: personStore.currentPerson.person.email.address,
          tooltip: t('person.emailStatusActiveHover'),
        };
      case EmailStatus.Requested:
        return {
          text: t('person.emailStatusRequested'),
          tooltip: t('person.emailStatusRequestedHover'),
        };
      case EmailStatus.Disabled:
        return {
          text: t('person.emailStatusDisabled'),
          tooltip: t('person.emailStatusDisabledHover'),
        };
      case EmailStatus.Failed:
        return {
          text: t('person.emailStatusFailed'),
          tooltip: t('person.emailStatusFailedHover'),
        };
      default:
        return {
          text: t('person.emailStatusUnknown'),
          tooltip: t('person.emailStatusUnknownHover'),
        };
    }
  });

  onBeforeMount(async () => {
    personStore.resetState();
    twoFactorAuthentificationStore.resetState();

    const twoFARequirementPromise: Promise<void> = twoFactorAuthentificationStore.get2FARequirement(currentPersonId);
    const personByIdPromise: Promise<Personendatensatz> = personStore.getPersonById(currentPersonId);
    const personUebersichtPromise: Promise<void> = personStore.getPersonenuebersichtById(currentPersonId);
    const workflowStepPromise: Promise<PersonenkontextWorkflowResponse> = personenkontextStore.processWorkflowStep({
      limit: 25,
    });
    const get2FAStatePromise: Promise<void> = twoFactorAuthentificationStore.get2FAState(currentPersonId);
    await Promise.all([
      twoFARequirementPromise,
      personByIdPromise,
      personUebersichtPromise,
      workflowStepPromise,
      get2FAStatePromise,
    ]);
    loading.value = false;

    hasKlassenZuordnung.value = personStore.personenuebersicht?.zuordnungen.some(
      (zuordnung: Zuordnung) => zuordnung.typ === OrganisationsTyp.Klasse,
    );
  });

  onMounted(async () => {
    /* listen for browser changes and prevent them when form is dirty */
    window.addEventListener('beforeunload', preventNavigation);
  });

  onUnmounted(() => {
    window.removeEventListener('beforeunload', preventNavigation);
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
        :text="$t(`admin.person.errors.${personStore.errorCode}`)"
        :showButton="true"
        :buttonText="alertButtonTextKopers"
        :buttonAction="alertButtonActionKopers"
        :title="$t(`admin.person.title.${personStore.errorCode}`)"
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
          <div v-if="personStore.currentPerson?.person && !isEditPersonMetadataActive">
            <!-- Befristung -->
            <v-row class="ml-md-16">
              <v-col
                cols="12"
                md="auto"
                class="mt-1 edit-container"
              >
                <div class="d-flex justify-sm-end">
                  <v-col
                    cols="12"
                    sm="6"
                    md="auto"
                  >
                    <SpshTooltip
                      :enabledCondition="!isEditActive"
                      :disabledText="$t('person.finishEditFirst')"
                      :enabledText="$t('admin.person.editPersonalInfo')"
                      position="start"
                    >
                      <v-btn
                        :disabled="isEditActive"
                        class="primary ml-lg-8"
                        data-testid="metadata-edit-button"
                        @Click="triggerPersonMetadataEdit"
                        :block="mdAndDown"
                      >
                        {{ $t('edit') }}
                      </v-btn>
                    </SpshTooltip>
                  </v-col>
                </div>
              </v-col>
            </v-row>
            <!-- Vorname -->
            <v-row class="mt-md-6">
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
              v-if="hasKopersRolle || personStore.currentPerson.person.personalnummer"
            >
              <v-col cols="1"></v-col>
              <v-col
                class="text-right"
                md="2"
                sm="3"
                cols="5"
              >
                <span
                  :class="{
                    'subtitle-2': true,
                    'text-red': hasKopersRolle && !personStore.currentPerson.person.personalnummer,
                  }"
                >
                  {{ $t('person.kopersNr') }}:
                </span>
              </v-col>
              <v-col
                cols="auto"
                data-testid="person-kopersnr"
              >
                <span
                  :class="{
                    'text-body': true,
                    'text-red': hasKopersRolle && !personStore.currentPerson.person.personalnummer,
                  }"
                >
                  {{ personStore.currentPerson.person.personalnummer ?? $t('missing') }}
                </span>
              </v-col>
            </v-row>
            <!-- Email -->
            <v-row
              v-if="emailStatusText.text !== $t('person.emailStatusUnknown')"
              class="mt-0"
            >
              <v-col cols="1"></v-col>
              <v-col
                class="text-right"
                md="2"
                sm="3"
                cols="5"
              >
                <span class="subtitle-2"> {{ $t('person.email') }}: </span>
              </v-col>
              <v-col
                cols="auto"
                data-testid="person-email"
              >
                <SpshTooltip
                  :enabledCondition="!!personStore.currentPerson.person.email"
                  :disabledText="$t('person.changePersonMetaDataDisabledDescription')"
                  :enabledText="emailStatusText.tooltip"
                  position="bottom"
                >
                  <v-icon
                    aria-hidden="true"
                    class="mr-2"
                    icon="mdi-alert-circle-outline"
                    size="small"
                  ></v-icon>
                  <span
                    data-testid="person-email-text"
                    class="text-body"
                  >
                    {{ emailStatusText.text }}
                  </span>
                </SpshTooltip>
              </v-col>
            </v-row>
          </div>
          <div v-else-if="personStore.loading">
            <v-progress-circular indeterminate></v-progress-circular>
          </div>
        </v-container>
        <v-container v-if="isEditPersonMetadataActive">
          <v-form
            data-testid="person-metadata-form"
            @submit="onSubmitChangePersonMetadata"
          >
            <PersonenMetadataChange
              ref="person-metadata-change"
              :selectedVornameProps="selectedVornameProps"
              :selectedVorname="personStore.currentPerson?.person.name.vorname"
              :selectedFamiliennameProps="selectedFamiliennameProps"
              :selectedFamilienname="personStore.currentPerson?.person.name.familienname"
              :selectedKopersNrMetadataProps="selectedKopersNrMetadataProps"
              :selectedKopersNrMetadata="personStore.currentPerson?.person.personalnummer"
              :hasKopersRolle="hasKopersRolle"
              @update:selectedKopersNrMetadata="handleSelectedKopersNrUpdate"
              @update:selectedVorname="handleSelectedVorname"
              @update:selectedFamilienname="handleSelectedFamilienname"
            ></PersonenMetadataChange>
            <v-row class="save-cancel-row ml-md-16 pt-md-5 pt-12 justify-end">
              <v-col
                class="cancel-col px-5"
                cols="12"
                sm="6"
                md="auto"
              >
                <v-btn
                  class="secondary small"
                  data-testid="person-info-edit-cancel"
                  @click="cancelEditPersonMetadata"
                  :block="mdAndDown"
                >
                  {{ $t('cancel') }}
                </v-btn>
              </v-col>
              <v-col
                cols="12"
                sm="6"
                md="auto"
                class="px-5"
              >
                <SpshTooltip
                  :enabledCondition="!hasSameMetadata"
                  :disabledText="$t('person.changePersonMetaDataDisabledDescription')"
                  :enabledText="$t('save')"
                  position="start"
                >
                  <v-btn
                    class="primary small"
                    :disabled="hasSameMetadata"
                    data-testid="person-info-edit-save"
                    :block="mdAndDown"
                    type="submit"
                  >
                    {{ $t('save') }}
                  </v-btn>
                </SpshTooltip>
              </v-col>
            </v-row>
          </v-form>
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
                  :disabled="isEditActive || isEditPersonMetadataActive"
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
                  <SpshTooltip
                    :enabledCondition="selectedZuordnungen.length === 0 && !isEditPersonMetadataActive"
                    :disabledText="$t('person.finishEditFirst')"
                    :enabledText="$t('person.editZuordnungen')"
                    position="start"
                  >
                    <v-btn
                      class="primary ml-lg-8"
                      data-testid="zuordnung-edit-button"
                      :disabled="isEditPersonMetadataActive"
                      @Click="triggerEdit"
                      :block="mdAndDown"
                    >
                      {{ $t('edit') }}
                    </v-btn>
                  </SpshTooltip>
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
              <span class="text-body">
                {{ getSskName(zuordnung.sskDstNr, zuordnung.sskName) }}: {{ zuordnung.rolle }}
                {{ zuordnung.klasse }}
                <span v-if="zuordnung.befristung"> ({{ formatDate(zuordnung.befristung, t) }})</span>
              </span>
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
                <h3 class="subtitle-1">{{ $t('person.checkAndSave') }}:</h3>
              </v-col>
              <v-col
                cols="12"
                v-for="zuordnung in getZuordnungen?.filter((zuordnung: Zuordnung) => zuordnung.editable)"
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
                        zuordnung.befristung &&
                        newZuordnung &&
                        zuordnung.sskId === newZuordnung.sskId &&
                        zuordnung.rolleId === newZuordnung.rolleId
                      "
                      class="text-body text-green"
                    >
                      ({{ formatDate(zuordnung.befristung, t) }})</span
                    >
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
                <!-- Template to show when the change Klasse is pending -->
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
                    :zuordnungCount="
                      zuordnungenResult?.filter((zuordnung: Zuordnung) => zuordnung.editable).length ?? 0
                    "
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
                  <!-- This will stay commented until the buttons are actually functionable 
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
                  -->
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
                  <h3 class="subtitle-1">{{ $t('person.addZuordnung') }}:</h3>
                </v-col>
              </v-row>
              <v-container class="px-lg-16">
                <!-- Organisation, Rolle, Klasse zuordnen -->
                <PersonenkontextCreate
                  ref="personenkontext-create"
                  :showHeadline="false"
                  :organisationen="organisationen"
                  :rollen="filteredRollen"
                  :klassen="klassen"
                  :selectedOrganisationProps="selectedOrganisationProps"
                  :selectedRolleProps="selectedRolleProps"
                  :selectedKlasseProps="selectedKlasseProps"
                  :befristungInputProps="{
                    befristungProps: selectedBefristungProps,
                    befristungOptionProps: selectedBefristungOptionProps,
                    isUnbefristetDisabled: isUnbefristetButtonDisabled,
                    isBefristungRequired: isBefristungspflichtRolle(selectedRolle),
                    nextSchuljahresende: getNextSchuljahresende(),
                    befristung: selectedBefristung,
                    befristungOption: selectedBefristungOption,
                  }"
                  v-model:selectedOrganisation="selectedOrganisation"
                  v-model:selectedRolle="selectedRolle"
                  v-model:selectedKlasse="selectedKlasse"
                  @update:selectedOrganisation="(value?: string) => (selectedOrganisation = value)"
                  @update:selectedRolle="(value?: string) => (selectedRolle = value)"
                  @update:selectedKlasse="(value?: string) => (selectedKlasse = value)"
                  @update:canCommit="canCommit = $event"
                  @update:befristung="handleBefristungUpdate"
                  @update:calculatedBefristungOption="handleBefristungOptionUpdate"
                  @fieldReset="handleFieldReset"
                />
                <KopersInput
                  v-if="!hasKopersNummer && isKopersRolle(selectedRolle) && selectedOrganisation"
                  :hasNoKopersNr="hasNoKopersNr"
                  v-model:selectedKopersNr="selectedKopersNr"
                  :selectedKopersNrProps="selectedKopersNrProps"
                  @update:selectedKopersNr="(value?: string | null) => (selectedKopersNr = value)"
                  @update:hasNoKopersNr="(value: boolean | undefined) => (hasNoKopersNr = value)"
                ></KopersInput>
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
                  <h3 class="subtitle-1">{{ $t('transfer') }}:</h3>
                </v-col>
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
        <!-- Two Factor Authentication -->
        <template v-if="loading">
          <v-divider
            class="border-opacity-100 rounded my-6 mx-4"
            color="#E5EAEF"
            thickness="6"
          ></v-divider>
          <v-container>
            <v-row class="ml-md-16">
              <v-col> <v-progress-circular indeterminate></v-progress-circular></v-col>
            </v-row>
          </v-container>
        </template>
        <template
          v-else-if="twoFactorAuthentificationStore.required || twoFactorAuthentificationStore.hasToken === true"
        >
          <v-divider
            class="border-opacity-100 rounded my-6 mx-4"
            color="#E5EAEF"
            thickness="6"
          ></v-divider>
          <v-container>
            <v-row class="ml-md-16">
              <v-col v-if="personStore.loading">
                <v-progress-circular indeterminate></v-progress-circular>
              </v-col>
              <template v-else>
                <v-col>
                  <h3 class="subtitle-1">{{ $t('admin.person.twoFactorAuthentication.header') }}</h3>
                  <v-row class="mt-4 mr-lg-13 text-body">
                    <v-col
                      class="text-right"
                      cols="1"
                    >
                      <v-icon
                        v-if="twoFactorAuthentificationStore.hasToken"
                        icon="mdi-check-circle"
                        color="green"
                      ></v-icon>
                      <v-icon
                        color="warning"
                        icon="mdi-alert-outline"
                        v-else-if="twoFactorAuthenticationConnectionError"
                      ></v-icon>
                    </v-col>
                    <v-col>
                      <template
                        v-if="twoFactorAuthentificationStore.errorCode && !twoFactorAuthentificationStore.loading"
                      >
                        <v-row v-if="twoFactorAuthentificationStore.errorCode === 'PI_UNAVAILABLE_ERROR'">
                          <p
                            class="text-body"
                            data-testid="connection-error-text"
                          >
                            {{ $t('admin.person.twoFactorAuthentication.errors.connection') }}
                          </p>
                        </v-row>
                        <v-row v-else-if="twoFactorAuthentificationStore.errorCode === 'TOKEN_STATE_ERROR'">
                          <p
                            class="text-body"
                            data-testid="token-state-error-text"
                          >
                            <i18n-t
                              keypath="admin.person.twoFactorAuthentication.errors.tokenStateError"
                              for="admin.person.twoFactorAuthentication.errors.iqshHelpdesk"
                              tag="label"
                            >
                              <a
                                :href="$t('admin.person.twoFactorAuthentication.errors.iqshHelpdeskLink')"
                                rel="noopener noreferrer"
                                target="_blank"
                                >{{ $t('admin.person.twoFactorAuthentication.errors.iqshHelpdesk') }}</a
                              >
                            </i18n-t>
                          </p>
                        </v-row>
                      </template>
                      <template v-else-if="twoFactorAuthentificationStore.hasToken">
                        <p v-if="twoFactorAuthentificationStore.tokenKind === TokenKind.software">
                          {{ $t('admin.person.twoFactorAuthentication.softwareTokenIsSetUp') }}
                        </p>
                        <p v-if="twoFactorAuthentificationStore.tokenKind === TokenKind.hardware">
                          {{ $t('admin.person.twoFactorAuthentication.hardwareTokenIsSetUp') }}
                        </p>
                        <p
                          v-if="
                            twoFactorAuthentificationStore.serial &&
                            twoFactorAuthentificationStore.tokenKind == TokenKind.hardware
                          "
                        >
                          {{
                            `${$t('admin.person.twoFactorAuthentication.serial')}: ` +
                            `${twoFactorAuthentificationStore.serial}`
                          }}
                        </p>
                      </template>
                    </v-col>
                  </v-row>
                  <v-row
                    v-if="!twoFactorAuthenticationConnectionError"
                    class="text-body"
                  >
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
                      <p v-if="twoFactorAuthentificationStore.hasToken && !twoFactorAuthentificationStore.required">
                        {{ $t('admin.person.twoFactorAuthentication.NoLongerNeedToken') }}
                      </p>
                      <p v-else-if="twoFactorAuthentificationStore.hasToken">
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
                  v-if="personStore.currentPerson && !twoFactorAuthenticationConnectionError"
                >
                  <div class="d-flex justify-sm-end">
                    <v-col
                      cols="12"
                      sm="6"
                      md="auto"
                    >
                      <SpshTooltip
                        :enabledCondition="!isEditActive && !isEditPersonMetadataActive"
                        :disabledText="$t('person.finishEditFirst')"
                        :enabledText="$t('admin.person.twoFactorAuthentication.tokenReset')"
                        position="start"
                      >
                        <TokenReset
                          v-if="twoFactorAuthentificationStore.hasToken"
                          :errorCode="twoFactorAuthentificationStore.errorCode"
                          :disabled="isEditActive || isEditPersonMetadataActive"
                          :person="personStore.currentPerson"
                          :tokenType="twoFactorAuthentificationStore.tokenKind"
                          :personId="currentPersonId"
                          @dialogClosed="twoFactorAuthentificationStore.get2FAState(currentPersonId)"
                        >
                        </TokenReset>
                      </SpshTooltip>
                      <SpshTooltip
                        :enabledCondition="!isEditActive && !isEditPersonMetadataActive"
                        :disabledText="$t('person.finishEditFirst')"
                        :enabledText="$t('admin.person.twoFactorAuthentication.setUpShort')"
                        position="start"
                      >
                        <TwoFactorAuthenticationSetUp
                          v-if="!twoFactorAuthentificationStore.hasToken"
                          :errorCode="twoFactorAuthentificationStore.errorCode"
                          :disabled="isEditActive || isEditPersonMetadataActive"
                          :person="personStore.currentPerson"
                          @dialogClosed="twoFactorAuthentificationStore.get2FAState(currentPersonId)"
                        >
                        </TwoFactorAuthenticationSetUp>
                      </SpshTooltip>
                    </v-col>
                  </div>
                </v-col>
              </template>
            </v-row>
          </v-container>
        </template>
        <v-divider
          class="border-opacity-100 rounded my-6 mx-4"
          color="#E5EAEF"
          thickness="6"
        ></v-divider>
        <v-container class="person-lock">
          <v-row class="ml-md-16">
            <v-col data-testid="person-lock-info">
              <h3 class="subtitle-1">{{ $t('admin.person.status') }}</h3>
              <template v-if="!personStore.loading">
                <v-row class="mt-4 text-body">
                  <v-col
                    class="text-right"
                    cols="1"
                  >
                    <v-icon
                      v-if="personStore.currentPerson?.person.isLocked"
                      icon="mdi-lock"
                      color="red"
                    ></v-icon>
                  </v-col>
                  <v-col cols="10">
                    <span>
                      {{
                        personStore.currentPerson?.person.isLocked
                          ? t('person.userIsLocked')
                          : t('person.userIsUnlocked')
                      }}
                    </span>
                  </v-col>
                </v-row>
                <v-row
                  class="mt-0"
                  v-for="({ key, attribute }, index) of getuserLock"
                  :key="key"
                  cols="10"
                >
                  <v-col
                    class="text-right"
                    cols="4"
                  >
                    <span
                      class="subtitle-2"
                      :data-testid="`lock-info-${index}-key`"
                    >
                      {{ key }}:
                    </span>
                  </v-col>
                  <v-col
                    cols="5"
                    class="ellipsis-wrapper"
                  >
                    <span
                      class="text-body"
                      :title="attribute"
                      :data-testid="`lock-info-${index}-attribute`"
                    >
                      {{ attribute }}
                    </span>
                  </v-col>
                </v-row>
              </template>
              <template v-else-if="personStore.loading">
                <v-col> <v-progress-circular indeterminate></v-progress-circular></v-col>
              </template>
            </v-col>
            <v-col
              class="mr-lg-13"
              cols="12"
              md="auto"
              v-if="personStore.currentPerson"
            >
              <div class="d-flex justify-sm-end">
                <PersonLock
                  :disabled="isEditActive || isEditPersonMetadataActive"
                  :errorCode="personStore.errorCode"
                  :person="personStore.currentPerson"
                  :adminId="authStore.currentUser?.personId!"
                  :formatOrganisationName="getOrganisationDisplayName"
                  :intersectingOrganisations="intersectingOrganisations"
                  @onLockUser="onLockUser"
                >
                </PersonLock>
              </div>
              <div class="d-flex justify-sm-end">
                <template v-if="authStore.hasPersonenLoeschenPermission">
                  <PersonDelete
                    :disabled="isEditActive || isEditPersonMetadataActive"
                    :errorCode="personStore.errorCode"
                    :person="personStore.currentPerson"
                    @onDeletePerson="deletePerson(currentPersonId)"
                  >
                  </PersonDelete>
                </template>
              </div>
              <div class="d-flex justify-sm-end">
                <template v-if="authStore.hasPersonenSyncPermission">
                  <PersonSync
                    :disabled="isEditActive || isEditPersonMetadataActive"
                    :errorCode="personStore.errorCode"
                    :person="personStore.currentPerson"
                    @onSyncPerson="syncPerson(currentPersonId)"
                  >
                  </PersonSync>
                </template>
              </div>
            </v-col>
            <v-col v-else-if="personStore.loading"> <v-progress-circular indeterminate></v-progress-circular></v-col>
          </v-row>
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
    <!-- Success Dialog after changing the Person Infos-->
    <v-dialog
      v-model="changePersonMetadataSuccessVisible"
      persistent
      max-width="600px"
    >
      <LayoutCard
        :closable="true"
        :header="$t('admin.person.personalInfo')"
        @onCloseClicked="closeChangePersonMetadataSuccessDialog"
      >
        <v-card-text>
          <v-container>
            <v-row class="text-body bold px-md-12">
              <v-col
                offset="1"
                cols="10"
              >
                <span class="metadata-success-message">{{ changePersonMetadataSuccessMessage }}</span>
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
                @click.stop="closeChangePersonMetadataSuccessDialog"
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

    <!-- Warning dialog for unsaved changes -->
    <v-dialog
      data-testid="unsaved-changes-dialog"
      ref="unsaved-changes-dialog"
      persistent
      v-model="showUnsavedChangesDialog"
    >
      <LayoutCard :header="$t('unsavedChanges.title')">
        <v-card-text>
          <v-container>
            <v-row class="text-body bold px-md-16">
              <v-col>
                <p data-testid="unsaved-changes-warning-text">
                  {{ $t('unsavedChanges.message') }}
                </p>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions class="justify-center">
          <v-row class="justify-center">
            <v-col
              cols="12"
              sm="6"
              md="auto"
            >
              <v-btn
                @click.stop="handleConfirmUnsavedChanges"
                class="secondary button"
                data-testid="confirm-unsaved-changes-button"
                :block="mdAndDown"
              >
                {{ $t('yes') }}
              </v-btn>
            </v-col>
            <v-col
              cols="12"
              sm="6"
              md="auto"
            >
              <v-btn
                @click.stop="showUnsavedChangesDialog = false"
                class="primary button"
                data-testid="close-unsaved-changes-dialog-button"
                :block="mdAndDown"
              >
                {{ $t('no') }}
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

  span {
    white-space: normal;
    text-wrap: pretty;
  }

  .metadata-success-message {
    white-space: pre;
    text-wrap: pretty;
  }
</style>
