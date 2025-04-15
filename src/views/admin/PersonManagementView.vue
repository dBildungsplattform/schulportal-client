<script setup lang="ts">
  import ResultTable, { type TableItem, type TableRow } from '@/components/admin/ResultTable.vue';
  import SearchField from '@/components/admin/SearchField.vue';
  import SpshTooltip from '@/components/admin/SpshTooltip.vue';
  import PersonBulkDelete from '@/components/admin/personen/PersonBulkDelete.vue';
  import PersonBulkPasswordReset from '@/components/admin/personen/PersonBulkPasswordReset.vue';
  import RolleModify from '@/components/admin/rollen/RolleModify.vue';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import { useOrganisationen } from '@/composables/useOrganisationen';
  import { type TranslatedRolleWithAttrs, useRollen } from '@/composables/useRollen';
  import { type AuthStore, useAuthStore } from '@/stores/AuthStore';
  import {
    type Organisation,
    type OrganisationStore,
    OrganisationsTyp,
    useOrganisationStore,
  } from '@/stores/OrganisationStore';
  import {
    type PersonStore,
    type PersonenWithRolleAndZuordnung,
    type Personendatensatz,
    SortField,
    SortOrder,
    usePersonStore,
  } from '@/stores/PersonStore';
  import { type PersonenkontextStore, usePersonenkontextStore } from '@/stores/PersonenkontextStore';
  import { type RolleResponse, type RolleStore, RollenArt, RollenMerkmal, useRolleStore } from '@/stores/RolleStore';
  import { type SearchFilterStore, useSearchFilterStore } from '@/stores/SearchFilterStore';
  import { type TranslatedObject } from '@/types.d';
  import { type ComputedRef, type Ref, computed, onMounted, ref, watch } from 'vue';
  import { type Composer, useI18n } from 'vue-i18n';
  import { type Router, useRouter } from 'vue-router';
  import type { VDataTableServer } from 'vuetify/lib/components/index.mjs';
  import OrganisationUnassign from '@/components/admin/schulen/OrganisationUnassign.vue';
  import OneSchoolAlert from '@/components/alert/OneSchoolAlert.vue';

  const searchFieldComponent: Ref = ref();

  const router: Router = useRouter();
  const organisationStore: OrganisationStore = useOrganisationStore();
  const personStore: PersonStore = usePersonStore();
  const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();
  const rolleStore: RolleStore = useRolleStore();
  const searchFilterStore: SearchFilterStore = useSearchFilterStore();
  const { t }: Composer = useI18n({ useScope: 'global' });

  let timerId: ReturnType<typeof setTimeout>;
  const hasAutoSelectedOrganisation: Ref<boolean> = ref(false);

  const selectedPersonIds: Ref<string[]> = ref<string[]>([]);
  const selectedPersons: ComputedRef<PersonenWithRolleAndZuordnung> = computed(() => {
    return (
      personStore.personenWithUebersicht?.filter((p: PersonenWithRolleAndZuordnung[number]) =>
        selectedPersonIds.value.includes(p.person.id),
      ) ?? []
    );
  });
  const resultTable: Ref = ref(null);

  type ReadonlyHeaders = VDataTableServer['headers'];
  const headers: ReadonlyHeaders = [
    { title: t('person.lastName'), key: 'person.name.familienname', align: 'start' },
    { title: t('person.firstName'), key: 'person.name.vorname', align: 'start' },
    { title: t('person.userName'), key: 'person.referrer', align: 'start' },
    { title: t('person.kopersNr'), key: 'person.personalnummer', align: 'start' },
    { title: t('person.rolle'), key: 'rollen', align: 'start', sortable: false },
    { title: t('person.zuordnungen'), key: 'administrationsebenen', align: 'start', sortable: false },
    { title: t('person.klasse'), key: 'klassen', align: 'start', sortable: false },
  ];

  const searchInputKlassen: Ref<string> = ref('');
  const searchInputRollen: Ref<string> = ref('');
  const searchInputOrganisationen: Ref<string> = ref('');

  const klassenOptions: Ref<TranslatedObject[] | undefined> = ref([]);
  // Variable to track the number of Klassen found depending on the search. The variable totalKlasse in the store controls the table paging and can't be used here correctly.
  let totalKlassen: number = 0;
  const selectedKlassen: Ref<Array<string>> = ref([]);
  const selectedRollen: Ref<Array<string>> = ref([]);
  const selectedOrganisationId: Ref<Array<string>> = ref([]);
  const selectedStatus: Ref<string | null> = ref(null);
  const searchFilter: Ref<string> = ref('');

  const selectedRollenObjects: Ref<RolleResponse[]> = ref([]);
  const sortField: Ref<string | null> = ref(null);
  const sortOrder: Ref<SortOrder | null> = ref(null);

  const rolleModifiyDialogVisible: Ref<boolean> = ref(false);
  const benutzerDeleteDialogVisible: Ref<boolean> = ref(false);
  const passwordResetDialogVisible: Ref<boolean> = ref(false);
  const organisationUnassignDialogVisible: Ref<boolean> = ref(false);
  const onlyOneSchoolAlertDialogVisible: Ref<boolean> = ref(false);

  const selectedOption: Ref<string | null> = ref(null);

  const authStore: AuthStore = useAuthStore();

  // Define an enum for action types (Other pairs will be added here for each new bulk feature)
  enum ActionTypes {
    MODIFY_ROLLE = 'MODIFY_ROLLE',
    DELETE_PERSON = 'DELETE_PERSON',
    RESET_PASSWORD = 'RESET_PASSWORD',
    ORG_UNASSIGN = 'ORG_UNASSIGN',
  }

  // Computed property for generating options dynamically for v-selects
  const actions: ComputedRef<TranslatedObject[]> = computed(() => {
    const actionTypeTitles: Map<ActionTypes, string> = new Map();
    actionTypeTitles.set(ActionTypes.MODIFY_ROLLE, t('admin.rolle.assignRolle'));
    if (authStore.hasPersonenLoeschenPermission) {
      actionTypeTitles.set(ActionTypes.DELETE_PERSON, t('admin.person.deletePerson'));
    }

    if (authStore.hasPersonenverwaltungPermission) {
      actionTypeTitles.set(ActionTypes.RESET_PASSWORD, t('admin.person.resetPassword'));
      actionTypeTitles.set(ActionTypes.ORG_UNASSIGN, t('admin.person.bulkUnassignOrganisation.cancelZuordnung'));
    }

    return [...actionTypeTitles.entries()].map(([key, value]: [string, string]) => ({
      value: key,
      title: value,
    }));
  });

  const filterOrSearchActive: Ref<boolean> = computed(
    () =>
      (!hasAutoSelectedOrganisation.value && selectedOrganisationId.value.length > 0) ||
      selectedRollen.value.length > 0 ||
      !!searchFilterStore.selectedOrganisationen?.length ||
      !!searchFilterStore.selectedRollen?.length ||
      !!searchFilterStore.searchFilterPersonen ||
      selectedKlassen.value.length > 0 ||
      !!selectedStatus.value,
  );

  const organisationen: ComputedRef<TranslatedObject[] | undefined> = computed(() => {
    return organisationStore.allOrganisationen.map((org: Organisation) => ({
      value: org.id,
      // Only concatenate if the kennung is present (Should not be for LAND)
      title: org.kennung ? `${org.kennung} (${org.name})` : org.name,
    }));
  });

  const selectedOrganisationKennung: ComputedRef<string> = computed(() => {
    if (selectedOrganisationId.value.length !== 1) {
      return '';
    }
    const id: string = selectedOrganisationId.value[0]!;
    const organisation: Organisation | undefined = organisationStore.allOrganisationen.find(
      (org: Organisation) => org.id === id,
    );
    return organisation?.kennung ?? '';
  });

  const rollen: ComputedRef<TranslatedObject[] | undefined> = computed(() => {
    const filteredRollen: RolleResponse[] = personenkontextStore.filteredRollen?.moeglicheRollen || [];
    const uniqueRollenMap: Map<string, RolleResponse> = new Map();

    [...filteredRollen, ...selectedRollenObjects.value].forEach((rolle: RolleResponse) => {
      uniqueRollenMap.set(rolle.id, rolle);
    });

    return [...uniqueRollenMap.values()]
      .map((rolle: RolleResponse) => ({
        value: rolle.id,
        title: rolle.name,
      }))
      .sort((a: TranslatedObject, b: TranslatedObject) => a.title.localeCompare(b.title));
  });

  const organisationenForForm: ComputedRef<TranslatedObject[] | undefined> = useOrganisationen();

  const rollenForForm: ComputedRef<TranslatedRolleWithAttrs[] | undefined> = useRollen();

  // Only Rollen from type LEHR and without any Befristungspflicht wil be offered for now
  const lehrRollen: ComputedRef<TranslatedRolleWithAttrs[] | undefined> = computed(() => {
    return rollenForForm.value?.filter(
      (rolle: TranslatedRolleWithAttrs) =>
        rolle.rollenart === RollenArt.Lehr && !rolle.merkmale?.has(RollenMerkmal.BefristungPflicht),
    );
  });

  const statuses: Array<string> = ['Aktiv', 'Inaktiv'];

  async function applySearchAndFilters(): Promise<void> {
    await organisationStore.getFilteredKlassen({
      administriertVon: selectedOrganisationId.value,
      searchString: searchInputKlassen.value,
    });
    // THe dropdown should be updated as well here alongside the count
    klassenOptions.value = organisationStore.klassen.map((org: Organisation) => ({
      value: org.id,
      title: org.name,
    }));
    totalKlassen = klassenOptions.value.length;
    personStore.getAllPersons({
      offset: (searchFilterStore.personenPage - 1) * searchFilterStore.personenPerPage,
      limit: searchFilterStore.personenPerPage,
      organisationIDs: searchFilterStore.selectedKlassen?.length
        ? searchFilterStore.selectedKlassen
        : searchFilterStore.selectedOrganisationen || [],
      rolleIDs: searchFilterStore.selectedRollen || [],
      searchFilter: searchFilterStore.searchFilterPersonen || '',
      sortField: searchFilterStore.sortField as SortField,
      sortOrder: searchFilterStore.sortOrder as SortOrder,
    });
  }

  async function getPaginatedPersonen(page: number): Promise<void> {
    searchFilterStore.personenPage = page;
    await personStore.getAllPersons({
      offset: (searchFilterStore.personenPage - 1) * searchFilterStore.personenPerPage,
      limit: searchFilterStore.personenPerPage,
      organisationIDs: selectedKlassen.value.length ? selectedKlassen.value : selectedOrganisationId.value,
      rolleIDs: searchFilterStore.selectedRollen || selectedRollen.value,
      searchFilter: searchFilterStore.searchFilterPersonen || searchFilter.value,
      sortField: searchFilterStore.sortField as SortField,
      sortOrder: searchFilterStore.sortOrder as SortOrder,
    });

    await applySearchAndFilters();
  }

  async function getPaginatedPersonenWithLimit(limit: number): Promise<void> {
    /* reset page to 1 if entries are equal to or less than selected limit */
    if (personStore.totalPersons <= limit) {
      searchFilterStore.personenPage = 1;
    }

    searchFilterStore.personenPerPage = limit;
    await personStore.getAllPersons({
      offset: (searchFilterStore.personenPage - 1) * searchFilterStore.personenPerPage,
      limit: searchFilterStore.personenPerPage,
      organisationIDs: searchFilterStore.selectedOrganisationen || selectedOrganisationId.value,
      rolleIDs: searchFilterStore.selectedRollen || selectedRollen.value,
      searchFilter: searchFilterStore.searchFilterPersonen || searchFilter.value,
    });

    await applySearchAndFilters();
  }

  async function autoSelectOrganisation(): Promise<void> {
    // Autoselect the Orga for the current user that only has 1 Orga assigned to him.
    if (organisationStore.allOrganisationen.length === 1) {
      selectedOrganisationId.value = [organisationStore.allOrganisationen[0]?.id || ''];
      hasAutoSelectedOrganisation.value = true;
      if (selectedOrganisationId.value.length) {
        await organisationStore.getFilteredKlassen({
          administriertVon: selectedOrganisationId.value,
          searchString: searchInputKlassen.value,
        });
        // Dropdown wasn't updated. Ideally it should be automatically updated once the selectedOrganisation holds a value.
        klassenOptions.value = organisationStore.klassen
          .map((org: Organisation) => ({
            value: org.id,
            title: org.name,
          }))
          .sort((a: TranslatedObject, b: TranslatedObject) => a.title.localeCompare(b.title));
        totalKlassen = klassenOptions.value.length;
      }
    }
  }

  async function setKlasseFilter(newValue: Array<string>): Promise<void> {
    await searchFilterStore.setKlasseFilterForPersonen(newValue);
    applySearchAndFilters();
  }

  async function setRolleFilter(newValue: Array<string>): Promise<void> {
    await searchFilterStore.setRolleFilterForPersonen(newValue);
    // Update selectedRollenObjects based on the new selection
    selectedRollenObjects.value = newValue
      .map((rolleId: string) => {
        const existingRolle: RolleResponse | undefined = personenkontextStore.filteredRollen?.moeglicheRollen.find(
          (r: RolleResponse) => r.id === rolleId,
        );
        return existingRolle;
      })
      .filter((rolle: RolleResponse | undefined): rolle is RolleResponse => rolle !== undefined);

    await searchFilterStore.setRolleFilterWithObjectsForPersonen(newValue, selectedRollenObjects.value);
    applySearchAndFilters();
  }

  async function setOrganisationFilter(newValue: Array<string>): Promise<void> {
    await searchFilterStore.setOrganisationFilterForPersonen(newValue);
    await searchFilterStore.setKlasseFilterForPersonen([]);
    selectedKlassen.value = [];
    if (selectedOrganisationId.value.length) {
      await organisationStore.getFilteredKlassen({
        administriertVon: selectedOrganisationId.value,
        searchString: searchInputKlassen.value,
      });
      // set values for klassen dropdown
      klassenOptions.value = organisationStore.klassen
        .map((org: Organisation) => ({
          value: org.id,
          title: org.name,
        }))
        .sort((a: TranslatedObject, b: TranslatedObject) => a.title.localeCompare(b.title));
      totalKlassen = klassenOptions.value.length;
    }
    applySearchAndFilters();
  }

  function navigateToPersonDetails(_$event: PointerEvent, { item }: { item: Personendatensatz }): void {
    router.push({ name: 'person-details', params: { id: item.person.id } });
  }

  function resetSearchAndFilter(): void {
    searchFilter.value = '';
    searchFieldComponent.value.searchFilter = '';
    searchFilterStore.setKlasseFilterForPersonen([]);
    searchFilterStore.setRolleFilterForPersonen([]);
    searchFilterStore.setSearchFilterForPersonen('');
    /* do not reset orgas if orga was autoselected */
    if (!hasAutoSelectedOrganisation.value) {
      selectedOrganisationId.value = [];
      searchFilterStore.setOrganisationFilterForPersonen([]);
    }
    searchInputOrganisationen.value = '';
    searchInputRollen.value = '';
    searchInputKlassen.value = '';
    selectedRollen.value = [];
    selectedKlassen.value = [];
    selectedStatus.value = null;
    searchFilterStore.personenPage = 1;
    searchFilterStore.personenPerPage = 30;
    searchFilterStore.currentSort = null;
    selectedPersonIds.value = [];
    personStore.getAllPersons({
      offset: (searchFilterStore.personenPage - 1) * searchFilterStore.personenPerPage,
      limit: searchFilterStore.personenPerPage,
      searchFilter: '',
      sortField: SortField.Familienname,
      sortOrder: SortOrder.Asc,
    });
  }

  async function handleSearchFilter(filter: string): Promise<void> {
    await searchFilterStore.setSearchFilterForPersonen(filter);
    searchFilter.value = filter;
    applySearchAndFilters();
  }

  function updateKlassenSearch(searchValue: string): void {
    /* cancel pending call */
    clearTimeout(timerId);

    /* delay new call 500ms */
    timerId = setTimeout(async () => {
      // fetch new klassen based on search value and include selected klassen
      await organisationStore.getFilteredKlassen({
        searchString: searchValue,
        administriertVon: selectedOrganisationId.value,
        organisationIds: selectedKlassen.value,
      });

      // set values for klassen dropdown
      if (selectedOrganisationId.value.length) {
        klassenOptions.value = organisationStore.klassen
          .map((org: Organisation) => ({
            value: org.id,
            title: org.name,
          }))
          .sort((a: TranslatedObject, b: TranslatedObject) => a.title.localeCompare(b.title));

        // Extract the selected Klassen IDs into a Set for efficient lookup
        const selectedKlassenIds: Set<string> = new Set(selectedKlassen.value.map((klasseId: string) => klasseId));

        // Normalize the search value to lowercase
        const normalizedSearchValue: string = searchValue.toLowerCase();

        // Filter the options to get only those matching the search results (case-insensitive)
        const searchMatchedOptions: TranslatedObject[] = klassenOptions.value.filter((klasseOption: TranslatedObject) =>
          klasseOption.title.toLowerCase().includes(normalizedSearchValue),
        );

        // Count the selected Klassen that match the search results
        const matchedSelectedKlassen: TranslatedObject[] = searchMatchedOptions.filter(
          (klasseOption: TranslatedObject) => selectedKlassenIds.has(klasseOption.value),
        );

        // Count only the search-matched Klassen that are not in the selected list
        const filteredOptions: TranslatedObject[] = searchMatchedOptions.filter(
          (klasseOption: TranslatedObject) => !selectedKlassenIds.has(klasseOption.value),
        );

        // Calculate the total Klassen by summing up unique matches
        totalKlassen = filteredOptions.length + matchedSelectedKlassen.length;
      }
    }, 500);
  }

  function updateOrganisationSearch(searchValue: string): void {
    /* cancel pending call */
    clearTimeout(timerId);

    /* delay new call 500ms */
    timerId = setTimeout(() => {
      organisationStore.getAllOrganisationen({
        searchString: searchValue,
        excludeTyp: [OrganisationsTyp.Klasse],
        limit: 25,
        systemrechte: ['PERSONEN_VERWALTEN'],
        organisationIds: selectedOrganisationId.value,
      });
    }, 500);
  }

  async function updateRollenSearch(searchValue: string): Promise<void> {
    clearTimeout(timerId);

    timerId = setTimeout(async () => {
      await personenkontextStore.getPersonenkontextRolleWithFilter(searchValue, 25);

      // If there are selected rollen not in the search results, add them to filteredRollen
      const moeglicheRollen: RolleResponse[] = personenkontextStore.filteredRollen?.moeglicheRollen || [];
      const missingRollen: RolleResponse[] = selectedRollenObjects.value.filter(
        (rolle: RolleResponse) => !moeglicheRollen.some((r: RolleResponse) => r.id === rolle.id),
      );

      if (missingRollen.length > 0 && personenkontextStore.filteredRollen) {
        personenkontextStore.filteredRollen = {
          moeglicheRollen: [...moeglicheRollen, ...missingRollen],
          total: personenkontextStore.filteredRollen.total + missingRollen.length,
        };
        // Update the total count of found Rollen.
        personenkontextStore.totalFilteredRollen = personenkontextStore.totalFilteredRollen + missingRollen.length;
      }
    }, 500);
  }

  // Define a mapping between complex table keys and expected backend keys
  const keyMapping: Record<string, SortField> = {
    'person.name.familienname': SortField.Familienname,
    'person.name.vorname': SortField.Vorname,
    'person.referrer': SortField.Referrer,
    'person.personalnummer': SortField.Personalnummer,
  };

  // Helper method that maps the key in the ResultTable to the name of the column in the backend
  function mapKeyToBackend(key: string): string {
    return keyMapping[key] || key;
  }

  // Triggers sorting for the selected column
  async function handleTableSorting(update: {
    sortField: string | undefined;
    sortOrder: 'asc' | 'desc';
  }): Promise<void> {
    if (update.sortField) {
      sortField.value = mapKeyToBackend(update.sortField);

      await searchFilterStore.setCurrentSortForPersonen({
        key: update.sortField,
        order: update.sortOrder,
      });
    }

    sortOrder.value = update.sortOrder as SortOrder;

    // Save the sorting values in the store
    searchFilterStore.setSortFieldForPersonen(sortField.value);
    searchFilterStore.setSortOrderForPersonen(sortOrder.value);

    // Fetch the sorted data
    getPaginatedPersonen(searchFilterStore.personenPage);
  }

  const singleSchoolSelected: ComputedRef<boolean> = computed(() => {
    return selectedOrganisationId.value.length === 1;
  });

  const singleSchoolAlertHeader: ComputedRef<string> = computed(() => {
    return actions.value.find((action: TranslatedObject) => action.value === selectedOption.value)?.title || '';
  });

  const selectedOrganisation: ComputedRef<Organisation | undefined> = computed(() => {
    return organisationStore.allOrganisationen.find((org: Organisation) => org.id === selectedOrganisationId.value[0]);
  });

  const checkSingleOrgDisplayDialog = (dialog: Ref<boolean>): void => {
    if (!singleSchoolSelected.value) {
      onlyOneSchoolAlertDialogVisible.value = true;
      return;
    }
    dialog.value = true;
  };

  // Handle the selected action
  const handleOption = (newValue: string | null): void => {
    if (!newValue) return;

    switch (newValue) {
      case ActionTypes.MODIFY_ROLLE:
        rolleModifiyDialogVisible.value = true;
        break;
      case ActionTypes.DELETE_PERSON:
        benutzerDeleteDialogVisible.value = true;
        break;
      case ActionTypes.RESET_PASSWORD:
        checkSingleOrgDisplayDialog(passwordResetDialogVisible);
        break;
      case ActionTypes.ORG_UNASSIGN:
        checkSingleOrgDisplayDialog(organisationUnassignDialogVisible);
    }
  };

  // Handles the event when closing the dialog
  const handleRolleModifyDialog = (isDialogVisible: boolean): void => {
    rolleModifiyDialogVisible.value = isDialogVisible;
    organisationUnassignDialogVisible.value = isDialogVisible;
    selectedOption.value = null;
  };

  const handleBulkDeleteDialog = async (finished: boolean): Promise<void> => {
    benutzerDeleteDialogVisible.value = false;
    selectedOption.value = null;
    if (finished) {
      selectedPersonIds.value = [];
      await getPaginatedPersonen(searchFilterStore.personenPage);
      resultTable.value.resetSelection();
    }
  };

  const handleBulkPasswordResetDialog = async (_finished: boolean): Promise<void> => {
    passwordResetDialogVisible.value = false;
    selectedOption.value = null;
  };
  const handleUnassignOrgDialog = async (finished: boolean): Promise<void> => {
    organisationUnassignDialogVisible.value = false;
    selectedOption.value = null;
    if (finished) {
      selectedPersonIds.value = [];
      await getPaginatedPersonen(searchFilterStore.personenPage);
      resultTable.value.resetSelection();
    }
  };

  function handleSelectedRows(selectedItems: TableItem[]): void {
    // Directly assign the selected items to selectedPersonIds since the emitted tableItems are always IDs of the specific rows
    selectedPersonIds.value = selectedItems as unknown as string[];
  }

  // This method filters the selectedPersonIds to avoid items being selected when they are not included in the current table "items"
  function updateSelectedRowsAfterFilter(): void {
    const visiblePersonIds: string[] | undefined = personStore.personenWithUebersicht?.map(
      (person: Personendatensatz) => person.person.id,
    );
    selectedPersonIds.value = selectedPersonIds.value.filter((id: string) => visiblePersonIds?.includes(id));
  }
  // Whenever the array of items of the table (personStore.personenWithUebersicht) changes (Filters, search function, page update etc...) update the selection.
  watch(
    () => personStore.personenWithUebersicht,
    () => {
      updateSelectedRowsAfterFilter();
    },
  );

  // If no filter or search is active then de-select everything.
  watch(filterOrSearchActive, (newValue: boolean) => {
    if (!newValue) {
      selectedPersonIds.value = [];
    }
  });

  onMounted(async () => {
    personenkontextStore.processWorkflowStep({
      limit: 25,
    });
    if (filterOrSearchActive.value) {
      selectedOrganisationId.value = searchFilterStore.selectedOrganisationen || [];
      selectedRollen.value = searchFilterStore.selectedRollen || [];
      selectedKlassen.value = searchFilterStore.selectedKlassen || [];
      selectedRollenObjects.value = searchFilterStore.selectedRollenObjects;
      // We should apply the search filter if the store for it holds a value, otherwise the values will show as UUIDs...
      await applySearchAndFilters();
    }

    await organisationStore.getAllOrganisationen({
      excludeTyp: [OrganisationsTyp.Klasse],
      systemrechte: ['PERSONEN_VERWALTEN'],
      limit: 25,
      organisationIds: selectedOrganisationId.value,
    });

    await getPaginatedPersonen(searchFilterStore.personenPage);
    await personenkontextStore.getPersonenkontextRolleWithFilter('', 25);

    autoSelectOrganisation();
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
    <LayoutCard :header="$t('admin.person.management')">
      <v-row
        align="start"
        class="ma-3"
        justify="end"
      >
        <v-col
          align-self="center"
          cols="12"
          md="2"
          class="py-md-0 text-md-right"
        >
          <v-btn
            class="px-0 reset-filter"
            @click="resetSearchAndFilter()"
            data-testid="reset-filter-button"
            :disabled="!filterOrSearchActive"
            size="x-small"
            variant="text"
            width="auto"
          >
            {{ $t('resetFilter') }}
          </v-btn>
        </v-col>
        <v-col
          cols="12"
          md="3"
          class="py-md-0"
        >
          <v-autocomplete
            autocomplete="off"
            class="filter-dropdown"
            :class="{ selected: selectedOrganisationId.length > 0 }"
            clearable
            data-testid="schule-select"
            density="compact"
            :disabled="hasAutoSelectedOrganisation"
            hide-details
            id="schule-select"
            :items="organisationen"
            item-value="value"
            item-text="title"
            multiple
            :no-data-text="$t('noDataFound')"
            :placeholder="$t('admin.schule.schule')"
            ref="schule-select"
            required="true"
            @update:modelValue="setOrganisationFilter"
            @update:search="updateOrganisationSearch"
            variant="outlined"
            v-model="selectedOrganisationId"
            v-model:search="searchInputOrganisationen"
          >
            <template v-slot:prepend-item>
              <v-list-item>
                <v-progress-circular
                  indeterminate
                  v-if="organisationStore.loading"
                ></v-progress-circular>
                <span
                  v-else
                  class="filter-header"
                  >{{
                    $t(
                      'admin.schule.schulenFound',
                      { count: organisationStore.totalPaginatedOrganisationen },
                      organisationStore.totalPaginatedOrganisationen,
                    )
                  }}</span
                >
              </v-list-item>
            </template>
            <template v-slot:selection="{ item, index }">
              <span
                v-if="selectedOrganisationId.length < 2"
                class="v-autocomplete__selection-text"
                >{{ item.title }}</span
              >
              <div v-else-if="index === 0">
                {{ $t('admin.schule.schulenSelected', { count: selectedOrganisationId.length }) }}
              </div>
            </template>
          </v-autocomplete>
        </v-col>
        <v-col
          cols="12"
          md="3"
          class="py-md-0"
        >
          <v-autocomplete
            autocomplete="off"
            class="filter-dropdown"
            :class="{ selected: selectedRollen.length > 0 }"
            clearable
            data-testid="rolle-select"
            density="compact"
            hide-details
            id="rolle-select"
            :items="rollen"
            item-value="value"
            item-text="title"
            multiple
            :no-data-text="$t('noDataFound')"
            :placeholder="$t('admin.rolle.rolle')"
            ref="rolle-select"
            required="true"
            @update:modelValue="setRolleFilter"
            @update:search="updateRollenSearch"
            variant="outlined"
            v-model="selectedRollen"
            v-model:search="searchInputRollen"
          >
            <template v-slot:prepend-item>
              <v-list-item>
                <v-progress-circular
                  indeterminate
                  v-if="rolleStore.loading"
                ></v-progress-circular>
                <span
                  v-else
                  class="filter-header"
                  >{{
                    $t(
                      'admin.rolle.rollenFound',
                      { count: personenkontextStore.totalFilteredRollen },
                      personenkontextStore.totalFilteredRollen,
                    )
                  }}</span
                >
              </v-list-item>
            </template>
            <template v-slot:selection="{ item, index }">
              <v-chip v-if="selectedRollen.length < 2">
                <span>{{ item.title }}</span>
              </v-chip>
              <div v-else-if="index === 0">
                {{ $t('admin.rolle.rollenSelected', { count: selectedRollen.length }) }}
              </div>
            </template>
          </v-autocomplete>
        </v-col>
        <v-col
          cols="12"
          md="2"
          class="py-md-0"
        >
          <v-tooltip
            :disabled="!!selectedOrganisationId.length"
            location="top"
          >
            <template v-slot:activator="{ props }">
              <div v-bind="props">
                <v-autocomplete
                  autocomplete="off"
                  class="filter-dropdown"
                  :class="{ selected: selectedKlassen.length > 0 }"
                  clearable
                  data-testid="klasse-select"
                  density="compact"
                  :disabled="!selectedOrganisationId.length"
                  hide-details
                  id="klasse-select"
                  :items="klassenOptions"
                  item-value="value"
                  item-text="title"
                  multiple
                  :no-data-text="$t('noDataFound')"
                  :placeholder="$t('admin.klasse.klasse')"
                  ref="klasse-select"
                  required="true"
                  @update:modelValue="setKlasseFilter"
                  @update:search="updateKlassenSearch"
                  variant="outlined"
                  v-model="selectedKlassen"
                  v-model:search="searchInputKlassen"
                >
                  <template v-slot:prepend-item>
                    <v-list-item>
                      <v-progress-circular
                        indeterminate
                        v-if="organisationStore.loadingKlassen"
                      ></v-progress-circular>
                      <span
                        v-else
                        class="filter-header"
                        >{{ $t('admin.klasse.klassenFound', { count: totalKlassen }, totalKlassen) }}</span
                      >
                    </v-list-item>
                  </template>
                  <template v-slot:selection="{ item, index }">
                    <v-chip v-if="selectedKlassen.length < 2">
                      <span>{{ item.title }}</span>
                    </v-chip>
                    <div v-else-if="index === 0">
                      {{ $t('admin.klasse.klassenSelected', { count: selectedKlassen.length }) }}
                    </div>
                  </template>
                </v-autocomplete>
              </div>
            </template>
            <span>{{ $t('admin.schule.selectSchuleFirst') }}</span>
          </v-tooltip>
        </v-col>
        <v-col
          cols="12"
          md="2"
          class="py-md-0"
        >
          <v-autocomplete
            autocomplete="off"
            chips
            class="filter-dropdown"
            clearable
            data-testid="status-select"
            density="compact"
            hide-details
            id="status-select"
            :items="statuses"
            item-value="value"
            item-text="title"
            :no-data-text="$t('noDataFound')"
            :placeholder="$t('admin.status')"
            required="true"
            variant="outlined"
            v-model="selectedStatus"
          >
          </v-autocomplete>
        </v-col>
      </v-row>
      <v-row
        class="ma-3 mb-n4"
        justify="start"
      >
        <v-col
          md="3"
          cols="12"
        >
          <SpshTooltip
            :enabledCondition="selectedPersonIds.length > 0"
            :disabledText="$t('admin.person.choosePersonFirst')"
            position="top"
          >
            <v-select
              v-if="authStore.hasPersonenBulkPermission"
              clearable
              data-testid="benutzer-edit-select"
              density="compact"
              :disabled="selectedPersonIds.length === 0"
              id="benutzer-edit-select"
              :items="actions"
              item-value="value"
              item-text="title"
              :no-data-text="$t('noDataFound')"
              :placeholder="$t('edit')"
              ref="benutzer-bulk-edit-select"
              required="true"
              variant="outlined"
              v-model="selectedOption"
              @update:modelValue="handleOption"
            ></v-select>
          </SpshTooltip>
          <OneSchoolAlert
            :isDialogVisible="onlyOneSchoolAlertDialogVisible"
            :header="singleSchoolAlertHeader"
            @update:dialogExit="
              () => {
                onlyOneSchoolAlertDialogVisible = false;
                selectedOption = null;
              }
            "
          />
          <RolleModify
            ref="person-bulk-rolle-modify"
            v-if="rolleModifiyDialogVisible"
            :organisationen="organisationenForForm"
            :rollen="lehrRollen"
            :isLoading="personenkontextStore.loading"
            :isDialogVisible="rolleModifiyDialogVisible"
            :errorCode="personenkontextStore.errorCode"
            :personIDs="selectedPersonIds"
            @update:isDialogVisible="handleRolleModifyDialog($event)"
            @update:getUebersichten="getPaginatedPersonen(searchFilterStore.personenPage)"
          >
          </RolleModify>
          <PersonBulkDelete
            ref="person-bulk-delete"
            v-if="benutzerDeleteDialogVisible"
            :errorCode="personStore.errorCode"
            :isLoading="personStore.loading"
            :isDialogVisible="benutzerDeleteDialogVisible"
            :personIDs="selectedPersonIds"
            @update:dialogExit="handleBulkDeleteDialog($event)"
          >
          </PersonBulkDelete>
          <PersonBulkPasswordReset
            ref="person-bulk-password-reset"
            v-if="passwordResetDialogVisible"
            :isDialogVisible="passwordResetDialogVisible"
            :isSelectionFromSingleSchule="selectedOrganisationId.length === 1"
            :selectedSchuleKennung="selectedOrganisationKennung"
            :selectedPersons
            @update:dialogExit="handleBulkPasswordResetDialog($event)"
          >
          </PersonBulkPasswordReset>
          <OrganisationUnassign
            ref="organisation-unassign"
            v-if="organisationUnassignDialogVisible && selectedOrganisation"
            :isDialogVisible="organisationUnassignDialogVisible"
            :selectedPersonenIds="selectedPersonIds"
            :selectedOrganisation="selectedOrganisation"
            @update:dialogExit="handleUnassignOrgDialog($event)"
          >
          </OrganisationUnassign>
        </v-col>
        <!-- Display the number of selected checkboxes -->
        <v-col
          v-if="authStore.hasPersonenBulkPermission && selectedPersonIds.length > 0"
          cols="12"
          md="4"
          class="mt-md-5 mt-n10"
        >
          <p class="text-body">{{ selectedPersonIds.length }} {{ $t('selected') }}</p>
        </v-col>
        <v-spacer></v-spacer>
        <SearchField
          :initialValue="searchFilterStore.searchFilterPersonen ?? ''"
          :inputCols="6"
          :inputColsMd="3"
          :buttonCols="6"
          :buttonColsMd="2"
          :hoverText="$t('person.firstNameLastNameReferrerKopersNr')"
          @onApplySearchFilter="handleSearchFilter"
          ref="searchFieldComponent"
        ></SearchField>
      </v-row>
      <ResultTable
        :currentPage="searchFilterStore.personenPage"
        data-testid="person-table"
        ref="resultTable"
        :items="personStore.personenWithUebersicht || []"
        :itemsPerPage="searchFilterStore.personenPerPage"
        :loading="personStore.loading"
        :headers="headers"
        :currentSort="searchFilterStore.currentSort"
        @onHandleRowClick="
          (event: PointerEvent, item: TableRow<unknown>) =>
            navigateToPersonDetails(event, item as TableRow<Personendatensatz>)
        "
        @onItemsPerPageUpdate="getPaginatedPersonenWithLimit"
        @onPageUpdate="getPaginatedPersonen"
        @onTableUpdate="handleTableSorting"
        @update:selectedRows="handleSelectedRows"
        :modelValue="selectedPersonIds as unknown as TableItem[]"
        :totalItems="personStore.totalPersons"
        item-value-path="person.id"
        ><template v-slot:[`item.rollen`]="{ item }">
          <div
            class="ellipsis-wrapper"
            :title="item.rollen"
          >
            {{ item.rollen }}
          </div> </template
        ><template v-slot:[`item.administrationsebenen`]="{ item }">
          <div
            class="ellipsis-wrapper"
            :title="item.administrationsebenen"
          >
            {{ item.administrationsebenen }}
          </div>
        </template></ResultTable
      >
    </LayoutCard>
  </div>
</template>

<style></style>
