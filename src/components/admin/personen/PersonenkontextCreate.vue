<script setup lang="ts">
  import { computed, type ComputedRef, type Ref, ref, watch } from 'vue';
  import { RollenArt } from '@/stores/RolleStore';
  import { useI18n } from 'vue-i18n';
  import FormRow from '@/components/form/FormRow.vue';
  import { usePersonenkontextStore, type PersonenkontextStore, type Zuordnung } from '@/stores/PersonenkontextStore';
  import {
    OrganisationsTyp,
    useOrganisationStore,
    type Organisation,
    type OrganisationStore,
  } from '@/stores/OrganisationStore';
  import { type TranslatedObject } from '@/types.d';
  import type { BaseFieldProps } from 'vee-validate';
  import type { TranslatedRolleWithAttrs } from '@/composables/useRollen';
  import BefristungInput from '@/components/admin/personen/BefristungInput.vue';
  import type { BefristungProps } from '@/components/admin/personen/BefristungInput.vue';
  import { usePersonStore, type PersonStore } from '@/stores/PersonStore';

  useI18n({ useScope: 'global' });

  const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();
  const organisationStore: OrganisationStore = useOrganisationStore();
  const personStore: PersonStore = usePersonStore();

  const timerId: Ref<ReturnType<typeof setTimeout> | undefined> = ref<ReturnType<typeof setTimeout>>();
  const canCommit: Ref<boolean> = ref(false);
  const hasAutoselectedSchule: Ref<boolean> = ref(false);
  const searchInputOrganisation: Ref<string> = ref('');
  const searchInputRolle: Ref<string> = ref('');

  let isSearching: boolean = false;

  type Props = {
    organisationen: TranslatedObject[] | undefined;
    rollen: TranslatedRolleWithAttrs[] | undefined;
    selectedOrganisation: string | undefined;
    showHeadline: boolean;
    selectedOrganisationProps: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
    klassen?: TranslatedObject[] | undefined;
    selectedRolle?: string | undefined;
    selectedRollen?: string[] | undefined;
    selectedKlasse?: string | undefined;
    selectedKlasseProps?: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
    selectedRolleProps?: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
    selectedRollenProps?: BaseFieldProps & { error: boolean; 'error-messages': Array<string> };
    isModifyRolleDialog?: boolean;
    befristungInputProps?: BefristungProps;
    allowMultipleRollen?: boolean;
  };

  const props: Props = defineProps<Props>();

  type Emits = {
    (e: 'update:befristung', value: string | undefined): void;
    (e: 'update:calculatedBefristungOption', value: string | undefined): void;
    (event: 'update:selectedOrganisation', value: string | undefined): void;
    (event: 'update:selectedRolle', value: string | undefined): void;
    (event: 'update:selectedRollen', value: string[] | undefined): void;
    (event: 'update:selectedKlasse', value: string | undefined): void;
    (event: 'update:canCommit', value: boolean): void;
    (event: 'fieldReset', field: 'selectedOrganisation' | 'selectedRolle' | 'selectedKlasse' | 'selectedRollen'): void;
  };
  const emits: Emits = defineEmits<Emits>();

  const selectedOrganisation: Ref<string | undefined> = ref(props.selectedOrganisation);
  const selectedRolle: Ref<string | undefined> = ref(props.selectedRolle);
  const selectedRollen: Ref<string[] | undefined> = ref(props.selectedRollen || []);
  const selectedKlasse: Ref<string | undefined> = ref(props.selectedKlasse);

  // Computed property to get the title of the selected organisation
  const selectedOrganisationTitle: ComputedRef<string | undefined> = computed(() => {
    return props.organisationen?.find((org: TranslatedObject) => org.value === selectedOrganisation.value)?.title;
  });

  // Computed property to get the title of the selected role
  const selectedRolleTitle: ComputedRef<string | undefined> = computed(() => {
    return props.rollen?.find((rolle: TranslatedObject) => rolle.value === selectedRolle.value)?.title;
  });

  // Computed property to get the title of the selected class
  const selectedKlasseTitle: ComputedRef<string | undefined> = computed(() => {
    return props.klassen?.find((klasse: TranslatedObject | undefined) => klasse?.value === selectedKlasse.value)?.title;
  });

  function isLernRolle(selectedRolleIds: string | string[] | undefined): boolean {
    if (!selectedRolleIds) return false;

    // Ensure we always work with an array
    const rolleIdsArray: string[] = Array.isArray(selectedRolleIds) ? selectedRolleIds : [selectedRolleIds];

    return rolleIdsArray.some((rolleId: string) =>
      props.rollen?.some(
        (rolle: TranslatedRolleWithAttrs) => rolle.value === rolleId && rolle.rollenart === RollenArt.Lern,
      ),
    );
  }

  // Watcher for selectedOrganisation to fetch roles and classes
  watch(selectedOrganisation, async (newValue: string | undefined, oldValue: string | undefined) => {
    // Reset the selectedRolle field only if oldValue was not undefined
    if (oldValue !== undefined) {
      selectedRolle.value = undefined;
      emits('fieldReset', 'selectedRolle');
    }
    if (newValue && newValue !== oldValue) {
      // Fetch the roles after selecting the organization
      await personenkontextStore.processWorkflowStep({
        organisationId: newValue,
        limit: 25,
      });

      // Fetch all Klassen for the selected organization
      await organisationStore.getKlassenByOrganisationId({ limit: 25, administriertVon: [newValue] });

      // Check that all the Klassen associated with the selectedOrga have the same Klasse for the same person.
      const klassenZuordnungen: Zuordnung[] | undefined = personStore.personenuebersicht?.zuordnungen.filter(
        (zuordnung: Zuordnung) => zuordnung.typ === OrganisationsTyp.Klasse && zuordnung.administriertVon === newValue,
      );

      if (klassenZuordnungen && klassenZuordnungen.length > 0) {
        // Check if all Zuordnungen of type Klasse have the same SSKID.
        // We only preselect when there's a clear, unambiguous single Klasse association for the selected Orga.
        const sameSSK: boolean = klassenZuordnungen.every(
          (zuordnung: Zuordnung) => zuordnung.sskId === klassenZuordnungen[0]?.sskId,
        );

        if (sameSSK) {
          await organisationStore.getKlassenByOrganisationId({ administriertVon: [newValue] });
          const klasse: Organisation | undefined = organisationStore.klassen.find(
            (k: Organisation) => k.id === klassenZuordnungen[0]?.sskId,
          );
          // If the klasse was found then add it to the 25 Klassen in the dropdown and preselect it
          if (klasse) {
            selectedKlasse.value = klasse.id;
            emits('update:selectedKlasse', newValue);
            // Another request to limit the Klassen because beforehand we made the same request with no limit to check all possible Klassen
            await organisationStore.getKlassenByOrganisationId({ limit: 25, administriertVon: [newValue] });
            // Push the preselected Klasse to the array of klassen (dropdown) if its not there already (this is necessary if the Klasse isn't part of the initial 25)
            if (!organisationStore.klassen.some((k: Organisation) => k.id === klasse.id)) {
              organisationStore.klassen.push(klasse);
            }
          }
        }
      }
    } else if (!newValue) {
      // If the organization is cleared, reset selectedRolle and selectedKlasse
      selectedRolle.value = undefined;
      selectedKlasse.value = undefined;
      emits('fieldReset', 'selectedRolle');
      emits('fieldReset', 'selectedKlasse');
    }
    // Emit the new selected organization to the parent component
    emits('update:selectedOrganisation', newValue);
  });

  watch(
    () => (props.allowMultipleRollen ? selectedRollen.value : selectedRolle.value),
    async (newValue: string | string[] | undefined, oldValue: string | string[] | undefined) => {
      if (props.allowMultipleRollen) {
        // Multiple rollen selected
        const newRoles: string[] | undefined = newValue as string[] | undefined;
        if (newRoles && newRoles.length > 0) {
          await personenkontextStore.processWorkflowStep({
            organisationId: selectedOrganisation.value,
            rollenIds: newRoles,
            limit: 25,
          });
          canCommit.value = personenkontextStore.workflowStepResponse?.canCommit ?? false;
          emits('update:canCommit', canCommit.value);
        } else {
          // No roles selected, reset values
          selectedKlasse.value = undefined;
          emits('fieldReset', 'selectedKlasse');
          emits('fieldReset', 'selectedRollen');
          emits('update:canCommit', false);
        }
        emits('update:selectedRollen', newRoles);
      } else {
        // Single rolle selected
        const newRole: string | undefined = newValue as string | undefined;
        if (newRole && newRole !== oldValue) {
          await personenkontextStore.processWorkflowStep({
            organisationId: selectedOrganisation.value,
            rollenIds: [newRole], // Wrap single role in an array
            limit: 25,
          });
          canCommit.value = personenkontextStore.workflowStepResponse?.canCommit ?? false;
          emits('update:canCommit', canCommit.value);
        }
        if (!newRole) {
          // Reset when no role is selected
          emits('update:canCommit', false);
          selectedKlasse.value = undefined;
          emits('fieldReset', 'selectedKlasse');
        }
        emits('update:selectedRolle', newRole); // Emit selected single role
      }
    },
    { deep: true },
  );

  watch(selectedKlasse, (newValue: string | undefined) => {
    emits('update:selectedKlasse', newValue);
  });

  // Using a watcher instead of modelUpdate since we need the old Value as well.
  // Default behavior of the autocomplete is to reset the newValue to empty string and that causes another request to be made
  watch(searchInputOrganisation, async (newValue: string, oldValue: string) => {
    clearTimeout(timerId.value);
    isSearching = !!newValue;
    if (oldValue === selectedOrganisationTitle.value) {
      return;
    }
    // If searchValue is empty and selectedOrganisation does not have a value, fetch initial data
    if (newValue === '' && !selectedOrganisation.value) {
      timerId.value = setTimeout(async () => {
        await personenkontextStore.processWorkflowStep({
          limit: 25,
        });
      }, 500);
    } else if (newValue && newValue !== selectedOrganisationTitle.value) {
      // If searchValue is not empty and different from the current title, proceed with the search
      // Reset selectedRolle only if it's a new search and not when selecting an organization
      selectedRolle.value = undefined;
      emits('fieldReset', 'selectedRolle');
      emits('update:selectedRolle', undefined);

      timerId.value = setTimeout(async () => {
        await personenkontextStore.processWorkflowStep({
          organisationName: newValue,
          limit: 25,
        });
      }, 500);
    } else if (newValue === '' && selectedOrganisation.value) {
      // If searchValue is empty and an organization is selected, fetch roles for the selected organization
      timerId.value = setTimeout(async () => {
        await personenkontextStore.processWorkflowStep({
          organisationId: selectedOrganisation.value,
          limit: 25,
        });
      }, 500);
    }
  });

  watch(searchInputRolle, async (newValue: string, oldValue: string) => {
    clearTimeout(timerId.value);
    // If the oldValue (What has been in the searchValue beforing losing focus) is equal to the selected Rolle.title then do nothing
    if (oldValue === selectedRolleTitle.value) return;
    // If searchValue is empty, fetch all roles for the organisationId
    if (newValue === '' && !selectedRolle.value) {
      timerId.value = setTimeout(() => {
        personenkontextStore.processWorkflowStep({
          organisationId: selectedOrganisation.value,
          limit: 25,
        });
      }, 500);
      // Else fetch the Rollen that correspond to the orgaId
      // (This stops an extra request being made once a value is selected since we check if model !== searchValue)
    } else if (newValue && newValue !== selectedRolleTitle.value) {
      timerId.value = setTimeout(() => {
        personenkontextStore.processWorkflowStep({
          organisationId: selectedOrganisation.value,
          rolleName: newValue,
          limit: 25,
        });
      }, 500);
    }
  });

  function updateKlassenSearch(searchValue: string): void {
    clearTimeout(timerId.value);
    const organisationId: string | undefined = selectedOrganisation.value;

    if (!organisationId) {
      return;
    }
    if (searchValue === '' && !selectedKlasse.value) {
      timerId.value = setTimeout(() => {
        organisationStore.getKlassenByOrganisationId({
          searchString: searchValue,
          limit: 25,
          administriertVon: [organisationId],
        });
      }, 500);
    } else if (searchValue && searchValue !== selectedKlasseTitle.value) {
      /* cancel pending call */
      clearTimeout(timerId.value);
      /* delay new call 500ms */
      timerId.value = setTimeout(() => {
        organisationStore.getKlassenByOrganisationId({
          searchString: searchValue,
          limit: 25,
          administriertVon: [organisationId],
        });
      }, 500);
    }
  }

  // Clear the selected Organisation once the input field is cleared (This is the only way to fetch all Orgas again)
  // This is also important since we only want to fetch all orgas once the selected Orga is null, otherwise an extra request is made with an empty string
  function clearSelectedOrganisation(): void {
    emits('fieldReset', 'selectedOrganisation');
  }
  // Clear the selected Rolle once the input field is cleared (This is the only way to fetch all Rollen again)
  // This is also important since we only want to fetch all orgas once the selected Rolle is null, otherwise an extra request is made with an empty string
  function clearSelectedRolle(): void {
    emits('fieldReset', 'selectedRolle');
  }

  function clearSelectedRollen(): void {
    emits('fieldReset', 'selectedRollen');
  }

  watch(
    () => props.organisationen,
    async (newOrganisations: TranslatedObject[] | undefined, _oldOrganisations: TranslatedObject[] | undefined) => {
      if (!isSearching && newOrganisations && newOrganisations.length === 1) {
        hasAutoselectedSchule.value = true;
        selectedOrganisation.value = newOrganisations[0]?.value;
        emits('update:selectedOrganisation', selectedOrganisation.value);
      }
    },
    { immediate: true },
  );

  const handleBefristungChange = (value: string | undefined): void => {
    emits('update:befristung', value);
  };

  const handleCalculatedBefristungOptionChange = (value: string | undefined): void => {
    emits('update:calculatedBefristungOption', value);
  };
</script>

<template>
  <div>
    <v-row v-if="showHeadline">
      <h3 class="headline-3">1. {{ $t('admin.organisation.assignOrganisation') }}</h3>
    </v-row>
    <!-- Organisation zuordnen -->
    <FormRow
      ref="form-row"
      :errorLabel="selectedOrganisationProps['error']"
      :isRequired="true"
      labelForId="organisation-select"
      :label="$t('admin.organisation.organisation')"
    >
      <v-autocomplete
        class="mb-5"
        autocomplete="off"
        :class="[{ 'filter-dropdown mb-4': hasAutoselectedSchule }, { selected: selectedOrganisation }]"
        clearable
        :click:clear="clearSelectedOrganisation"
        data-testid="organisation-select"
        density="compact"
        :disabled="hasAutoselectedSchule"
        id="organisation-select"
        ref="organisation-select"
        hide-details
        :items="organisationen"
        item-value="value"
        item-text="title"
        :no-data-text="$t('noDataFound')"
        :placeholder="$t('admin.organisation.selectOrganisation')"
        required="true"
        variant="outlined"
        v-bind="selectedOrganisationProps"
        v-model="selectedOrganisation"
        v-model:search="searchInputOrganisation"
      ></v-autocomplete>
    </FormRow>

    <div v-if="selectedOrganisation">
      <v-row v-if="showHeadline">
        <h3 class="headline-3">2. {{ $t('admin.rolle.assignRolle') }}</h3>
      </v-row>
      <!-- Rollenzuordnung -->
      <FormRow
        :errorLabel="
          allowMultipleRollen ? (selectedRollenProps?.['error'] ?? false) : (selectedRolleProps?.['error'] ?? false)
        "
        labelForId="rolle-select"
        :isRequired="true"
        :label="$t('admin.rolle.rolle')"
      >
        <v-autocomplete
          v-if="allowMultipleRollen"
          autocomplete="off"
          clearable
          @clear="clearSelectedRollen"
          data-testid="rollen-select"
          density="compact"
          id="rollen-select"
          ref="rollen-select"
          :items="rollen"
          item-value="value"
          item-text="title"
          :multiple="allowMultipleRollen"
          :no-data-text="$t('noDataFound')"
          :placeholder="$t('admin.rolle.selectRolle')"
          required="true"
          variant="outlined"
          v-bind="selectedRollenProps"
          v-model="selectedRollen"
          v-model:search="searchInputRolle"
        ></v-autocomplete>
        <v-autocomplete
          v-else-if="!allowMultipleRollen"
          autocomplete="off"
          clearable
          @clear="clearSelectedRolle"
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
          variant="outlined"
          v-bind="selectedRolleProps"
          v-model="selectedRolle"
          v-model:search="searchInputRolle"
        ></v-autocomplete>
      </FormRow>

      <!-- Klasse zuordnen -->
      <FormRow
        v-if="
          allowMultipleRollen
            ? isLernRolle(selectedRollen) && selectedOrganisation
            : isLernRolle(selectedRolle) && selectedOrganisation
        "
        :errorLabel="selectedKlasseProps?.['error'] || false"
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
          @update:search="updateKlassenSearch"
          variant="outlined"
          v-bind="selectedKlasseProps"
          v-model="selectedKlasse"
        ></v-autocomplete>
      </FormRow>
      <!-- Befristung -->
      <v-row v-if="selectedOrganisation && (allowMultipleRollen ? selectedRollen : selectedRolle) && showHeadline">
        <h3 class="headline-3">3. {{ $t('admin.befristung.assignBefristung') }}</h3>
      </v-row>
      <BefristungInput
        v-if="selectedOrganisation && (allowMultipleRollen ? selectedRollen : selectedRolle) && !isModifyRolleDialog"
        :befristungProps="befristungInputProps?.befristungProps"
        :befristungOptionProps="befristungInputProps?.befristungOptionProps"
        :isUnbefristetDisabled="befristungInputProps?.isUnbefristetDisabled"
        :isBefristungRequired="befristungInputProps?.isBefristungRequired"
        :nextSchuljahresende="befristungInputProps?.nextSchuljahresende"
        :befristung="befristungInputProps?.befristung"
        :befristungOption="befristungInputProps?.befristungOption"
        ref="befristung-input-wrapper"
        @update:befristung="handleBefristungChange"
        @update:calculatedBefristungOption="handleCalculatedBefristungOptionChange"
      />
    </div>
  </div>
</template>

<style></style>
