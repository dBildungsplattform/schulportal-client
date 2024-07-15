<script setup lang="ts">
  import { type Ref, ref, onBeforeMount, computed, type ComputedRef, watch } from 'vue';
  import { type Router, type RouteLocationNormalizedLoaded, useRoute, useRouter } from 'vue-router';
  import { usePersonStore, type PersonStore } from '@/stores/PersonStore';
  import PasswordReset from '@/components/admin/personen/PasswordReset.vue';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import SpshAlert from '@/components/alert/SpshAlert.vue';
  import SpshTooltip from '@/components/admin/SpshTooltip.vue';
  import PersonDelete from '@/components/admin/personen/PersonDelete.vue';
  import PersonenkontextDelete from '@/components/admin/personen/PersonenkontextDelete.vue';
  import TwoFactorAuthenticationSetUp from '@/components/admin/personen/TwoFactorAuthenticationSetUp.vue';
  import {
    usePersonenkontextStore,
    type PersonenkontextStore,
    type Uebersicht,
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
  import { RollenArt } from '@/stores/RolleStore';
  import { type Composer, useI18n } from 'vue-i18n';
  import { useOrganisationen } from '@/composables/useOrganisationen';
  import { useRollen } from '@/composables/useRollen';
  import { useKlassen } from '@/composables/useKlassen';
  import PersonenkontextCreate from '@/components/admin/personen/PersonenkontextCreate.vue';
  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();

  const { t }: Composer = useI18n({ useScope: 'global' });

  const route: RouteLocationNormalizedLoaded = useRoute();
  const router: Router = useRouter();
  const currentPersonId: string = route.params['id'] as string;
  const personStore: PersonStore = usePersonStore();
  const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();
  const authStore: AuthStore = useAuthStore();
  const organisationStore: OrganisationStore = useOrganisationStore();

  const password: Ref<string> = ref('');

  const zuordnungenResult: Ref<Zuordnung[] | undefined> = ref<Zuordnung[] | undefined>(undefined);
  const getZuordnungen: ComputedRef<Zuordnung[] | undefined> = computed(() => zuordnungenResult.value);
  const selectedZuordnungen: Ref<Zuordnung[]> = ref<Zuordnung[]>([]);
  const newZuordnung: Ref<Zuordnung | undefined> = ref<Zuordnung | undefined>(undefined);
  const finalZuordnungen: Ref<Zuordnung[]> = ref<Zuordnung[]>([]);
  const originalZuordnungenResult: Ref<Zuordnung[] | undefined> = ref(undefined);

  const isEditActive: Ref<boolean> = ref(false);
  const isZuordnungFormActive: Ref<boolean> = ref(false);

  const pendingDeletion: Ref<boolean> = ref(false);
  const pendingCreation: Ref<boolean> = ref(false);

  const deleteSuccessDialogVisible: Ref<boolean> = ref(false);
  const createSuccessDialogVisible: Ref<boolean> = ref(false);
  const cannotDeleteDialogVisible: Ref<boolean> = ref(false);
  const createZuordnungConfirmationDialogVisible: Ref<boolean> = ref(false);
  const createZuordnungConfirmationDialogMessage: Ref<string> = ref('');

  const canCommit: Ref<boolean> = ref(false);

  const creationErrorText: Ref<string> = ref('');
  const creationErrorTitle: Ref<string> = ref('');

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

  // Deletes the person and all kontexte
  async function deletePerson(personId: string): Promise<void> {
    await personStore.deletePerson(personId);
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

  const triggerAddZuordnung = async (): Promise<void> => {
    await personenkontextStore.processWorkflowStep();
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
    const klassenZuordnungen: Zuordnung[] | undefined = personenkontextStore.personenuebersicht?.zuordnungen.filter(
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

    try {
      await personenkontextStore.updatePersonenkontexte(combinedZuordnungen, currentPersonId);
      zuordnungenResult.value = combinedZuordnungen;
      selectedZuordnungen.value = [];

      // Filter out Zuordnungen with editable === false
      const editableZuordnungen: Zuordnung[] | undefined = combinedZuordnungen?.filter(
        (zuordnung: Zuordnung) => zuordnung.editable,
      );

      deleteSuccessDialogVisible.value = true;

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
    } catch {
      creationErrorText.value = t(`admin.personenkontext.errors.${personenkontextStore.errorCode}`);
      creationErrorTitle.value = t(`admin.personenkontext.title.${personenkontextStore.errorCode}`);
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
  function computeZuordnungen(personenuebersicht: Uebersicht | null): Zuordnung[] | undefined {
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

  const rollen: ComputedRef<RolleWithRollenart[] | undefined> = useRollen();

  const organisationen: ComputedRef<TranslatedObject[] | undefined> = useOrganisationen();

  const klassen: ComputedRef<TranslatedObject[] | undefined> = useKlassen();

  type RolleWithRollenart = {
    value: string;
    title: string;
    Rollenart: RollenArt;
  };

  type TranslatedObject = {
    value: string;
    title: string;
  };

  type ZuordnungCreationForm = {
    selectedRolle: string;
    selectedOrganisation: string;
    selectedKlasse: string;
  };

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

  // eslint-disable-next-line @typescript-eslint/typedef
  const { defineField, handleSubmit, resetForm } = useForm<ZuordnungCreationForm>({
    validationSchema,
  });

  const [selectedRolle, selectedRolleProps]: [
    Ref<string | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineField('selectedRolle', vuetifyConfig);
  const [selectedOrganisation, selectedOrganisationProps]: [
    Ref<string>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineField('selectedOrganisation', vuetifyConfig);
  const [selectedKlasse, selectedKlasseProps]: [
    Ref<string | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineField('selectedKlasse', vuetifyConfig);

  // Triggers the template to start editing
  const triggerEdit = (): void => {
    isEditActive.value = true;
    // Deep copy of the zuordnungenResult to keep track of the Zuordnungen before any changes were done.
    // This is necessary if a user cancels the editing at some point and the zuordnungenResult was mutated at the time.
    originalZuordnungenResult.value = JSON.parse(JSON.stringify(zuordnungenResult.value));
  };

  // Cancels editing
  const cancelEdit = (): void => {
    isEditActive.value = false;
    pendingDeletion.value = false;
    pendingCreation.value = false;
    selectedZuordnungen.value = [];
    isZuordnungFormActive.value = false;
    resetForm();
    zuordnungenResult.value = originalZuordnungenResult.value
      ? JSON.parse(JSON.stringify(originalZuordnungenResult.value))
      : undefined;
  };

  // This will send the updated list of Zuordnungen to the Backend on TOP of the new added one through the form.
  const confirmAddition = async (): Promise<void> => {
    try {
      await personenkontextStore.updatePersonenkontexte(finalZuordnungen.value, currentPersonId);
      createSuccessDialogVisible.value = true;
      resetForm();
    } catch {
      creationErrorText.value = t(`admin.personenkontext.errors.${personenkontextStore.errorCode}`);
      creationErrorTitle.value = t(`admin.personenkontext.title.${personenkontextStore.errorCode}`);
    }
  };

  // The save button will act according to what kind of pending action we have.
  const handleSaveClick = (): void => {
    if (pendingCreation.value) {
      confirmAddition();
    } else if (pendingDeletion.value) {
      confirmDeletion();
    }
  };

  // The save button is always disabled if there is no pending creation nor deletion.
  const isSaveButtonDisabled: ComputedRef<boolean> = computed(() => !pendingCreation.value && !pendingDeletion.value);

  // Filter out the Rollen in case the admin chooses an organisation that the user has already a kontext in
  const filteredRollen: ComputedRef<RolleWithRollenart[] | undefined> = computed(() => {
    const existingZuordnungen: Zuordnung[] | undefined = personenkontextStore.personenuebersicht?.zuordnungen.filter(
      (zuordnung: Zuordnung) => zuordnung.sskId === selectedOrganisation.value,
    );
    return rollen.value?.filter(
      (rolle: RolleWithRollenart) =>
        !existingZuordnungen?.some((zuordnung: Zuordnung) => zuordnung.rolleId === rolle.value),
    );
  });

  // Computed property to get the title of the selected role
  const selectedRolleTitle: ComputedRef<string | undefined> = computed(() => {
    return rollen.value?.find((rolle: TranslatedObject) => rolle.value === selectedRolle.value)?.title;
  });

  // Computed property to get the title of the selected class
  const selectedKlasseTitle: ComputedRef<string | undefined> = computed(() => {
    return klassen.value?.find((klasse: TranslatedObject) => klasse.value === selectedKlasse.value)?.title;
  });

  const onSubmit: (e?: Event | undefined) => Promise<void | undefined> = handleSubmit(() => {
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
    const klasse: Organisation | undefined = organisationStore.klassen.find(
      (k: Organisation) => k.id === selectedKlasse.value,
    );
    if (organisation) {
      newZuordnung.value = {
        sskId: organisation.id,
        rolleId: selectedRolle.value ?? '',
        klasse: klasse?.name,
        sskDstNr: organisation.kennung ?? '',
        sskName: organisation.name,
        rolle: rollen.value?.find((rolle: RolleWithRollenart) => rolle.value === selectedRolle.value)?.title || '',
        administriertVon: organisation.administriertVon ?? '',
        editable: true,
        typ: OrganisationsTyp.Schule,
      };
      if (zuordnungenResult.value) {
        finalZuordnungen.value = zuordnungenResult.value;
        finalZuordnungen.value.push(newZuordnung.value);
      }
      if (klasse) {
        finalZuordnungen.value.push({
          sskId: klasse.id,
          rolleId: selectedRolle.value ?? '',
          sskDstNr: klasse.kennung ?? '',
          sskName: klasse.name,
          rolle: rollen.value?.find((rolle: RolleWithRollenart) => rolle.value === selectedRolle.value)?.title || '',
          administriertVon: klasse.administriertVon ?? '',
          editable: true,
          typ: OrganisationsTyp.Klasse,
        });
      }
    }
    zuordnungenResult.value = zuordnungenResult.value?.filter(
      (zuordnung: Zuordnung) => zuordnung.typ !== OrganisationsTyp.Klasse,
    );
    prepareCreation();
  };

  const cancelAddition = (): void => {
    createZuordnungConfirmationDialogVisible.value = false;
  };

  watch(
    () => personenkontextStore.personenuebersicht,
    (newValue: Uebersicht | null) => {
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
  onBeforeMount(async () => {
    personenkontextStore.errorCode = '';
    await personStore.getPersonById(currentPersonId);
    await personenkontextStore.getPersonenuebersichtById(currentPersonId);
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

      <!-- Error Message Display if the personenkontextStore throws any kind of error (Not being able to load the person) -->
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
            <!-- Kopers-Nr -->
            <v-row class="mt-0">
              <v-col cols="1"></v-col>
              <v-col
                class="text-right"
                md="2"
                sm="3"
                cols="5"
              >
                <span class="subtitle-2"> {{ $t('person.kopersnr') }}: </span>
              </v-col>
              <v-col
                cols="auto"
                data-testid="person-kopersnr"
              >
                <span class="text-body">{{ personStore.currentPerson.person.personalnummer ?? '---' }} </span>
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
        <v-container class="two-factor-authentication-set-up">
          <v-row class="ml-md-16">
            <v-col>
              <h3 class="subtitle-1">{{ $t('admin.person.twoFactorAuthentication.header') }}</h3>
            </v-col>
            <v-col
              class="mr-lg-13"
              cols="12"
              md="auto"
              v-if="personStore.currentPerson"
            >
              <div class="d-flex justify-sm-end">
                <TwoFactorAuthenticationSetUp
                  :errorCode="personStore.errorCode"
                  :disabled="isEditActive"
                  :person="personStore.currentPerson"
                >
                </TwoFactorAuthenticationSetUp>
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
            v-if="
              personenkontextStore.personenuebersicht?.zuordnungen &&
              personenkontextStore.personenuebersicht?.zuordnungen.length > 0
            "
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
          <template v-if="!isZuordnungFormActive">
            <v-row class="ml-md-16">
              <v-col
                v-if="!pendingDeletion && !pendingCreation"
                cols="12"
                sm="auto"
              >
                <h3 class="subtitle-1">{{ $t('person.editZuordnungen') }}: {{ $t('pleaseSelect') }}</h3>
              </v-col>
            </v-row>
            <!-- Check if 'zuordnungen' array exists and has length > 0 -->
            <v-row
              class="checkbox-row ml-md-16 mb-12"
              v-if="
                personenkontextStore.personenuebersicht?.zuordnungen &&
                personenkontextStore.personenuebersicht?.zuordnungen.length > 0
              "
            >
              <v-col
                v-if="pendingDeletion || pendingCreation"
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
                <template v-if="!pendingDeletion && !pendingCreation">
                  <div class="checkbox-div">
                    <v-checkbox
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
                      ({{ $t('person.willBeCreated') }})</span
                    >
                  </span>
                </template>
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
                      ({{ $t('person.willBeRemoved') }})</span
                    >
                  </span>
                </template>
              </v-col>
              <v-spacer></v-spacer>
              <v-col
                v-if="!pendingDeletion && !pendingCreation"
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
                    :zuordnungCount="zuordnungenResult?.filter((zuordnung) => zuordnung.editable).length"
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
                </v-col>
              </v-col>
            </v-row>
            <v-row v-else>
              <v-col
                class="mb-14"
                cols="10"
                offset-lg="2"
                offset="1"
              >
                <h3 class="text-body">{{ $t('person.noZuordnungenFound') }}</h3>
              </v-col>
            </v-row>
            <v-row class="save-cancel-row ml-md-16 mb-3">
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
          <template v-if="isZuordnungFormActive && !pendingDeletion">
            <!-- Formwrapper geht hier nicht, eigene Komponente hier einrichten?-->
            <v-form
              data-testid="zuordnung-creation-form"
              @submit="onSubmit"
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
                  @update:selectedOrganisation="(value: string) => (selectedOrganisation = value)"
                  @update:selectedRolle="(value: string | undefined) => (selectedRolle = value)"
                  @update:selectedKlasse="(value: string) => (selectedKlasse = value)"
                  @update:canCommit="canCommit = $event"
                  @fieldReset="handleFieldReset"
                />
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
