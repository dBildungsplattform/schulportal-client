<script setup lang="ts">
  import ResultTable, { type TableItem, type TableRow } from '@/components/admin/ResultTable.vue';
  import SearchField from '@/components/admin/SearchField.vue';
  import SpshTooltip from '@/components/admin/SpshTooltip.vue';
  import PersonBulkChangeKlasse from '@/components/admin/personen/PersonBulkChangeKlasse.vue';
  import PersonBulkDelete from '@/components/admin/personen/PersonBulkDelete.vue';
  import PersonBulkPasswordReset from '@/components/admin/personen/PersonBulkPasswordReset.vue';
  import RolleModify from '@/components/admin/rollen/RolleModify.vue';
  import RolleUnassign from '@/components/admin/rollen/RolleUnassign.vue';
  import OrganisationUnassign from '@/components/admin/schulen/OrganisationUnassign.vue';
  import InfoDialog from '@/components/alert/InfoDialog.vue';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import KlassenFilter from '@/components/filter/KlassenFilter.vue';
  import SchulenFilter from '@/components/filter/SchulenFilter.vue';
  import { useAutoselectedSchule } from '@/composables/useAutoselectedSchule';
  import { useOrganisationen } from '@/composables/useOrganisationen';
  import { type TranslatedRolleWithAttrs, useRollen } from '@/composables/useRollen';
  import { type AuthStore, useAuthStore } from '@/stores/AuthStore';
  import { OperationType } from '@/stores/BulkOperationStore';
  import { type Organisation, type OrganisationStore, useOrganisationStore } from '@/stores/OrganisationStore';
  import { type PersonStore, SortField, usePersonStore } from '@/stores/PersonStore';
  import { type PersonenkontextStore, usePersonenkontextStore } from '@/stores/PersonenkontextStore';
  import {
    type RolleResponse,
    type RolleStore,
    RollenArt,
    RollenSystemRecht,
    useRolleStore,
  } from '@/stores/RolleStore';
  import { type SearchFilterStore, useSearchFilterStore } from '@/stores/SearchFilterStore';
  import type { PersonWithZuordnungen } from '@/stores/types/PersonWithZuordnungen';
  import { type TranslatedObject } from '@/types.d';
  import { SortOrder } from '@/utils/sorting';
  import { type ComputedRef, type Ref, computed, onMounted, ref, watch } from 'vue';
  import { type Composer, useI18n } from 'vue-i18n';
  import { type Router, useRouter } from 'vue-router';
  import type { VDataTableServer } from 'vuetify/lib/components/index.mjs';

  const searchFieldComponent: Ref = ref();

  const router: Router = useRouter();
  const organisationStore: OrganisationStore = useOrganisationStore();
  const personStore: PersonStore = usePersonStore();
  const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();
  const rolleStore: RolleStore = useRolleStore();
  const searchFilterStore: SearchFilterStore = useSearchFilterStore();
  const { t }: Composer = useI18n({ useScope: 'global' });

  let timerId: ReturnType<typeof setTimeout>;
  const {
    hasAutoselectedSchule,
  }: {
    hasAutoselectedSchule: ComputedRef<boolean>;
  } = useAutoselectedSchule([RollenSystemRecht.PersonenVerwalten]);

  const selectedPersonIds: Ref<string[]> = ref<string[]>([]);
  const selectedPersonen: ComputedRef<Map<string, PersonWithZuordnungen>> = computed(() => {
    const persons: Map<string, PersonWithZuordnungen> = new Map();
    for (const personId of selectedPersonIds.value) {
      const person: PersonWithZuordnungen | undefined = personStore.allUebersichten.get(personId);
      if (!person) continue;

      persons.set(personId, person);
    }
    return persons;
  });
  const resultTable: Ref = ref(null);

  type ReadonlyHeaders = VDataTableServer['headers'];
  export type PersonRow = {
    id: string;
    familienname: string;
    vorname: string;
    referrer: string;
    personalnummer: string;
    rollen: string;
    administrationsebenen: string;
    klassen: string;
  };
  const headers: ReadonlyHeaders = [
    { title: t('person.lastName'), key: 'familienname', align: 'start' },
    { title: t('person.firstName'), key: 'vorname', align: 'start' },
    { title: t('person.userName'), key: 'referrer', align: 'start' },
    { title: t('person.kopersNr'), key: 'personalnummer', align: 'start' },
    { title: t('person.rolle'), key: 'rollen', align: 'start', sortable: false },
    { title: t('person.zuordnungen'), key: 'administrationsebenen', align: 'start', sortable: false },
    { title: t('person.klasse'), key: 'klassen', align: 'start', sortable: false },
  ];
  const personRows: ComputedRef<Array<PersonRow>> = computed(() => {
    const rows: Array<PersonRow> = [];
    for (const personWithZuordnungen of personStore.allUebersichten.values()) {
      const personRow: PersonRow = {
        id: personWithZuordnungen.id,
        familienname: personWithZuordnungen.name.familienname,
        vorname: personWithZuordnungen.name.vorname,
        referrer: personWithZuordnungen.referrer,
        personalnummer: personWithZuordnungen.getPersonalnummerAsString(t('missing')),
        rollen: personWithZuordnungen.rollenAsString,
        administrationsebenen: personWithZuordnungen.administrationsebenenAsString,
        klassen: personWithZuordnungen.klassenZuordnungenAsString,
      };
      rows.push(personRow);
    }
    return rows;
  });

  const searchInputRollen: Ref<string> = ref('');
  const searchInputOrganisationen: Ref<string> = ref('');

  const selectedOrganisationen: Ref<Array<Organisation>> = ref([]);
  const selectedKlassen: Ref<Array<string> | undefined> = ref(searchFilterStore.selectedKlassen ?? []);
  const selectedRollen: Ref<Array<string>> = ref([]);
  const selectedOrganisationIds: Ref<Array<string>> = ref([]);
  const selectedStatus: Ref<string | null> = ref(null);
  const searchFilter: Ref<string> = ref('');

  const selectedRollenObjects: Ref<RolleResponse[]> = ref([]);
  const sortField: Ref<string | null> = ref(null);
  const sortOrder: Ref<SortOrder | null> = ref(null);

  const rolleModifiyDialogVisible: Ref<boolean> = ref(false);
  const benutzerDeleteDialogVisible: Ref<boolean> = ref(false);
  const passwordResetDialogVisible: Ref<boolean> = ref(false);
  const organisationUnassignDialogVisible: Ref<boolean> = ref(false);
  const changeKlasseDialogVisible: Ref<boolean> = ref(false);
  const rolleUnassignDialogVisible: Ref<boolean> = ref(false);

  const onlyOneOrganisationAlertDialogVisible: Ref<boolean> = ref(false);
  const invalidSelectionAlertMessages: Ref<Array<string>> = ref([]);
  const onlyOneRolleAlertDialogVisible: Ref<boolean> = ref(false);

  const selectedOption: Ref<string | null> = ref(null);

  const authStore: AuthStore = useAuthStore();

  // Computed property for generating options dynamically for v-selects
  const actions: ComputedRef<TranslatedObject[]> = computed(() => {
    const actionTypeTitles: Map<OperationType, string> = new Map();

    if (authStore.hasPersonenverwaltungPermission) {
      actionTypeTitles.set(OperationType.RESET_PASSWORD, t('admin.person.resetPassword'));
      actionTypeTitles.set(OperationType.CHANGE_KLASSE, t('admin.person.bulkChangeKlasse.transfer'));
      actionTypeTitles.set(OperationType.ORG_UNASSIGN, t('admin.person.bulkUnassignOrganisation.cancelZuordnung'));
      actionTypeTitles.set(OperationType.ROLLE_UNASSIGN, t('admin.rolle.bulkRollenzuordnung.unassignRolleZuordnung'));
      actionTypeTitles.set(OperationType.MODIFY_ROLLE, t('admin.rolle.assignRolle'));
    }

    if (authStore.hasPersonenLoeschenPermission) {
      actionTypeTitles.set(OperationType.DELETE_PERSON, t('admin.person.deletePerson'));
    }

    return [...actionTypeTitles.entries()].map(([key, value]: [string, string]) => ({
      value: key,
      title: value,
    }));
  });

  const filterOrSearchActive: Ref<boolean> = computed(
    () =>
      (!hasAutoselectedSchule.value && selectedOrganisationIds.value.length > 0) ||
      selectedRollen.value.length > 0 ||
      !!searchFilterStore.selectedOrganisationen?.length ||
      !!searchFilterStore.selectedRollen?.length ||
      !!searchFilterStore.searchFilterPersonen ||
      (selectedKlassen.value && selectedKlassen.value.length > 0) ||
      !!selectedStatus.value,
  );

  const selectedOrganisationKennung: ComputedRef<string> = computed(() => {
    if (selectedOrganisationIds.value.length !== 1) {
      return '';
    }
    const organisation: Organisation | undefined = selectedOrganisationen.value[0];
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

  // Only Rollen from type LEHR
  const lehrRollen: ComputedRef<TranslatedRolleWithAttrs[] | undefined> = computed(() => {
    return rollenForForm.value?.filter((rolle: TranslatedRolleWithAttrs) => rolle.rollenart === RollenArt.Lehr);
  });

  const statuses: Array<string> = ['Aktiv', 'Inaktiv'];

  async function applySearchAndFilters(): Promise<void> {
    await personStore.getAllPersons({
      offset: (searchFilterStore.personenPage - 1) * searchFilterStore.personenPerPage,
      limit: searchFilterStore.personenPerPage,
      organisationIDs: searchFilterStore.selectedKlassen?.length
        ? searchFilterStore.selectedKlassen
        : searchFilterStore.selectedOrganisationen || [],
      rolleIDs: searchFilterStore.selectedRollen || [],
      searchFilter: searchFilterStore.searchFilterPersonen || '',
      sortField: searchFilterStore.personenSortField as SortField,
      sortOrder: searchFilterStore.personenSortOrder as SortOrder,
    });
  }

  async function getPaginatedPersonen(page: number): Promise<void> {
    searchFilterStore.personenPage = page;
    await personStore.getAllPersons({
      offset: (searchFilterStore.personenPage - 1) * searchFilterStore.personenPerPage,
      limit: searchFilterStore.personenPerPage,
      organisationIDs: selectedKlassen.value?.length ? selectedKlassen.value : selectedOrganisationIds.value,
      rolleIDs: searchFilterStore.selectedRollen || selectedRollen.value,
      searchFilter: searchFilterStore.searchFilterPersonen || searchFilter.value,
      sortField: searchFilterStore.personenSortField as SortField,
      sortOrder: searchFilterStore.personenSortOrder as SortOrder,
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
      organisationIDs: searchFilterStore.selectedOrganisationen || selectedOrganisationIds.value,
      rolleIDs: searchFilterStore.selectedRollen || selectedRollen.value,
      searchFilter: searchFilterStore.searchFilterPersonen || searchFilter.value,
    });

    await applySearchAndFilters();
  }

  async function updateKlassenSelection(newValue: Array<string>): Promise<void> {
    searchFilterStore.setKlasseFilterForPersonen(newValue);
    applySearchAndFilters();
    selectedKlassen.value = newValue;
  }

  async function setRolleFilter(newValue: Array<string>): Promise<void> {
    searchFilterStore.setRolleFilterForPersonen(newValue);
    // Update selectedRollenObjects based on the new selection
    selectedRollenObjects.value = newValue
      .map((rolleId: string) => {
        const existingRolle: RolleResponse | undefined = personenkontextStore.filteredRollen?.moeglicheRollen.find(
          (r: RolleResponse) => r.id === rolleId,
        );
        return existingRolle;
      })
      .filter((rolle: RolleResponse | undefined): rolle is RolleResponse => rolle !== undefined);

    searchFilterStore.setRolleFilterWithObjectsForPersonen(newValue, selectedRollenObjects.value);
    applySearchAndFilters();
  }

  function setSelectedOrganisationen(newValue: Array<Organisation> | Organisation): void {
    selectedOrganisationen.value = Array.isArray(newValue) ? newValue : [newValue];
  }

  async function setOrganisationFilter(newValue: Array<string> | undefined): Promise<void> {
    selectedOrganisationIds.value = newValue ?? [];
    searchFilterStore.setOrganisationFilterForPersonen(newValue ?? []);
    searchFilterStore.setKlasseFilterForPersonen([]);
    selectedKlassen.value = [];
    applySearchAndFilters();
  }

  function navigateToPersonDetails(_$event: PointerEvent, { item }: { item: PersonRow }): void {
    router.push({ name: 'person-details', params: { id: item.id } });
  }

  function resetSearchAndFilter(): void {
    searchFilter.value = '';
    searchFieldComponent.value.searchFilter = '';
    searchFilterStore.setKlasseFilterForPersonen([]);
    searchFilterStore.setRolleFilterForPersonen([]);
    searchFilterStore.setRolleFilterWithObjectsForPersonen([], []);
    searchFilterStore.setSearchFilterForPersonen('');
    /* do not reset orgas if orga was autoselected */
    if (!hasAutoselectedSchule.value) {
      selectedOrganisationIds.value = [];
      searchFilterStore.setOrganisationFilterForPersonen([]);
    }
    searchInputOrganisationen.value = '';
    searchInputRollen.value = '';
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
    searchFilterStore.setSearchFilterForPersonen(filter);
    searchFilter.value = filter;
    await applySearchAndFilters();
  }

  async function updateRollenSearch(searchValue: string): Promise<void> {
    clearTimeout(timerId);

    timerId = setTimeout(async () => {
      await personenkontextStore.getPersonenkontextRolleWithFilter(searchValue, 25);

      // If there are selected rollen not in the search results, add them to filteredRollen
      const moeglicheRollen: RolleResponse[] = personenkontextStore.filteredRollen?.moeglicheRollen || [];
      const missingRollen: RolleResponse[] = searchFilterStore.selectedRollenObjects.filter(
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

  const handleFocusChange = async (focused: boolean): Promise<void> => {
    if (!focused && searchInputRollen.value) {
      searchInputRollen.value = '';
      await updateRollenSearch(searchInputRollen.value);
    }
  };

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
      searchFilterStore.currentSort = {
        key: update.sortField,
        order: update.sortOrder,
      };
    }

    sortOrder.value = update.sortOrder as SortOrder;

    // Save the sorting values in the store
    searchFilterStore.personenSortField = sortField.value;
    searchFilterStore.personenSortOrder = sortOrder.value;

    // Fetch the sorted data
    getPaginatedPersonen(searchFilterStore.personenPage);
  }

  const invalidSelectionAlertHeader: ComputedRef<string> = computed(() => {
    return actions.value.find((action: TranslatedObject) => action.value === selectedOption.value)?.title || '';
  });

  const selectedOrganisation: ComputedRef<Organisation[] | Organisation> = computed(() => {
    const organisation: Organisation[] | Organisation = selectedOrganisationen.value;
    return organisation;
  });

  const onlyLernRollenSelected: ComputedRef<boolean> = computed(() => {
    for (const personId of selectedPersonIds.value) {
      const person: PersonWithZuordnungen | undefined = personStore.allUebersichten.get(personId);
      if (!person) continue;
      const { rollenArten }: PersonWithZuordnungen = person;
      if (!(rollenArten.size === 1 && rollenArten.has(RollenArt.Lern))) {
        return false;
      }
    }
    return true;
  });

  const singleSchuleSelected: ComputedRef<boolean> = computed(() => {
    const val: string[] | string = selectedOrganisationIds.value;
    if (Array.isArray(val)) return val.length === 1;
    return true;
  });

  const selectedRolle: ComputedRef<RolleResponse | undefined> = computed(() => {
    return selectedRollenObjects.value.find((rolle: RolleResponse) => rolle.id === selectedRollen.value[0]);
  });

  const checkSingleOrgAndOnlyLernDisplayDialog = (dialog: Ref<boolean>): void => {
    const messages: Array<string> = [];
    if (!singleSchuleSelected.value) messages.push(t('admin.person.onlyOneSchuleAlert'));
    if (!onlyLernRollenSelected.value) messages.push(t('admin.person.onlyLernRollenAlert'));
    if (messages.length > 0) {
      onlyOneOrganisationAlertDialogVisible.value = true;
      invalidSelectionAlertMessages.value = messages;
      return;
    }
    dialog.value = true;
  };

  const validateSingleSchuleSelection = (): boolean => {
    if (!singleSchuleSelected.value) {
      onlyOneOrganisationAlertDialogVisible.value = true;
      invalidSelectionAlertMessages.value = [t('admin.person.onlyOneSchuleAlert')];
      return false;
    }
    return true;
  };

  const validateSingleRolleSelection = (): boolean => {
    if (selectedRollen.value.length > 1) {
      onlyOneRolleAlertDialogVisible.value = true;
      return false;
    }
    return true;
  };

  // Handle the selected action
  const handleOption = (newValue: string | null): void => {
    if (!newValue) return;

    switch (newValue) {
      case OperationType.MODIFY_ROLLE:
        rolleModifiyDialogVisible.value = true;
        break;

      case OperationType.DELETE_PERSON:
        benutzerDeleteDialogVisible.value = true;
        break;

      case OperationType.RESET_PASSWORD:
        if (validateSingleSchuleSelection()) {
          passwordResetDialogVisible.value = true;
        }
        break;
      case OperationType.ORG_UNASSIGN:
        if (validateSingleSchuleSelection()) {
          organisationUnassignDialogVisible.value = true;
        }
        break;

      case OperationType.ROLLE_UNASSIGN:
        if (!validateSingleSchuleSelection()) return;
        if (!validateSingleRolleSelection()) return;
        rolleUnassignDialogVisible.value = true;
        break;
      case OperationType.CHANGE_KLASSE:
        checkSingleOrgAndOnlyLernDisplayDialog(changeKlasseDialogVisible);
        break;
    }
  };

  // Handles the event when closing the dialog
  const handleRolleModifyDialog = (isDialogVisible: boolean): void => {
    rolleModifiyDialogVisible.value = isDialogVisible;
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

  const handleUnassignRolleDialog = async (finished: boolean): Promise<void> => {
    rolleUnassignDialogVisible.value = false;
    selectedOption.value = null;
    if (finished) {
      selectedPersonIds.value = [];
      await getPaginatedPersonen(searchFilterStore.personenPage);
      resultTable.value.resetSelection();
    }
  };

  const handleBulkKlasseChangeDialog = async (finished: boolean): Promise<void> => {
    changeKlasseDialogVisible.value = false;
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
    selectedPersonIds.value = selectedPersonIds.value.filter((id: string) => personStore.allUebersichten.has(id));
  }
  // Whenever the array of items of the table (personStore.personenWithUebersicht) changes (Filters, search function, page update etc...) update the selection.
  watch(
    () => personStore.allUebersichten,
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

  // Used for to show the number of klassen found in the filter
  const totalKlassen: ComputedRef<number> = computed(
    () => organisationStore.klassenFilters.get('personen-management')?.total ?? 0,
  );

  onMounted(async () => {
    if (filterOrSearchActive.value) {
      selectedOrganisationIds.value = searchFilterStore.selectedOrganisationen || [];
      selectedRollen.value = searchFilterStore.selectedRollen || [];
      selectedKlassen.value = searchFilterStore.selectedKlassen || [];
      selectedRollenObjects.value = searchFilterStore.selectedRollenObjects;
      // We should apply the search filter if the store for it holds a value, otherwise the values will show as UUIDs...
      await applySearchAndFilters();
    }

    await getPaginatedPersonen(searchFilterStore.personenPage);
    await personenkontextStore.getPersonenkontextRolleWithFilter('', 25);
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
          <SchulenFilter
            multiple
            includeAll
            highlightSelection
            parentId="person-management"
            ref="schulenFilter"
            :systemrechteForSearch="[RollenSystemRecht.PersonenVerwalten]"
            :selectedSchulen="selectedOrganisationIds"
            @update:selectedSchulen="setOrganisationFilter"
            @update:selectedSchulenObjects="setSelectedOrganisationen"
            :placeholderText="$t('admin.schule.schule')"
            hideDetails
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
                      { count: organisationStore.organisationenFilters.get('person-management')?.total },
                      organisationStore.organisationenFilters.get('person-management')?.total ?? 0,
                    )
                  }}</span
                >
              </v-list-item>
            </template>
          </SchulenFilter>
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
            @update:focused="handleFocusChange"
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
            :disabled="selectedOrganisationIds.length > 0"
            location="top"
          >
            <template v-slot:activator="{ props }">
              <div v-bind="props">
                <KlassenFilter
                  parentId="personen-management"
                  :systemrechteForSearch="[RollenSystemRecht.KlassenVerwalten]"
                  :multiple="true"
                  :readonly="selectedOrganisationIds.length == 0"
                  :hideDetails="true"
                  :highlightSelection="true"
                  :selectedKlassen="selectedKlassen"
                  @update:selectedKlassen="updateKlassenSelection"
                  :placeholderText="t('admin.klasse.klassen')"
                  ref="klasse-select"
                  :administriertVon="selectedOrganisationIds ? selectedOrganisationIds : undefined"
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
                        >{{ t('admin.klasse.klassenFound', { count: totalKlassen }, totalKlassen) }}</span
                      >
                    </v-list-item>
                  </template>
                </KlassenFilter>
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
          <InfoDialog
            id="invalid-selection-alert-dialog"
            :isDialogVisible="onlyOneOrganisationAlertDialogVisible"
            :header="invalidSelectionAlertHeader"
            :messages="invalidSelectionAlertMessages"
            @update:dialogExit="
              () => {
                onlyOneOrganisationAlertDialogVisible = false;
                selectedOption = null;
              }
            "
          />
          <InfoDialog
            id="only-one-rolle-notice"
            :isDialogVisible="onlyOneRolleAlertDialogVisible"
            :header="invalidSelectionAlertHeader"
            :messages="[$t('admin.person.onlyOneRolleAlert')]"
            @update:dialogExit="
              () => {
                onlyOneRolleAlertDialogVisible = false;
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
            :selectedPersonen
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
            :selectedPersonen
            @update:dialogExit="handleBulkDeleteDialog($event)"
          >
          </PersonBulkDelete>
          <PersonBulkPasswordReset
            ref="person-bulk-password-reset"
            v-if="passwordResetDialogVisible"
            :isDialogVisible="passwordResetDialogVisible"
            :selectedSchuleKennung="selectedOrganisationKennung"
            :selectedPersonen
            @update:dialogExit="handleBulkPasswordResetDialog($event)"
          >
          </PersonBulkPasswordReset>
          <OrganisationUnassign
            ref="organisation-unassign"
            v-if="organisationUnassignDialogVisible && selectedOrganisation"
            :isDialogVisible="organisationUnassignDialogVisible"
            :selectedPersonen
            :selectedOrganisation="
              Array.isArray(selectedOrganisation)
                ? (selectedOrganisation[0] ?? ({} as Organisation))
                : (selectedOrganisation ?? ({} as Organisation))
            "
            @update:dialogExit="handleUnassignOrgDialog($event)"
          >
          </OrganisationUnassign>
          <RolleUnassign
            ref="rolle-unassign"
            v-if="rolleUnassignDialogVisible && selectedOrganisation"
            :isDialogVisible="rolleUnassignDialogVisible"
            :organisationen="organisationenForForm"
            :selectedPersonen="Array.isArray(selectedPersonen) ? selectedPersonen[0] : selectedPersonen"
            :selectedOrganisationFromFilter="
              Array.isArray(selectedOrganisation)
                ? (selectedOrganisation[0] ?? ({} as Organisation))
                : (selectedOrganisation ?? ({} as Organisation))
            "
            :selectedRolleFromFilter="selectedRolle!"
            @update:dialogExit="handleUnassignRolleDialog($event)"
          >
          </RolleUnassign>
          <PersonBulkChangeKlasse
            v-if="changeKlasseDialogVisible"
            :isDialogVisible="changeKlasseDialogVisible"
            :selectedPersonen
            :selectedSchuleId="
              Array.isArray(selectedOrganisation) ? selectedOrganisation[0]?.id : selectedOrganisation?.id
            "
            @update:dialog-exit="handleBulkKlasseChangeDialog"
          />
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
        :items="personRows"
        :itemsPerPage="searchFilterStore.personenPerPage"
        :loading="personStore.loading"
        :headers="headers"
        :currentSort="searchFilterStore.currentSort"
        @onHandleRowClick="
          (event: PointerEvent, item: TableRow<unknown>) => navigateToPersonDetails(event, item as TableRow<PersonRow>)
        "
        @onItemsPerPageUpdate="getPaginatedPersonenWithLimit"
        @onPageUpdate="getPaginatedPersonen"
        @onTableUpdate="handleTableSorting"
        @update:selectedRows="handleSelectedRows"
        :modelValue="selectedPersonIds as unknown as TableItem[]"
        :totalItems="personStore.totalPersons"
        item-value-path="id"
      >
        <template v-slot:[`item.rollen`]="{ item }">
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
        </template>
      </ResultTable>
    </LayoutCard>
  </div>
</template>

<style></style>
