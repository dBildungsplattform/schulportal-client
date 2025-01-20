<script setup lang="ts">
  import { computed, onMounted, type ComputedRef, type Ref, ref } from 'vue';
  import { type Composer, useI18n } from 'vue-i18n';
  import type { VDataTableServer } from 'vuetify/lib/components/index.mjs';
  import { type Router, useRouter } from 'vue-router';
  import {
    useOrganisationStore,
    type OrganisationStore,
    type Organisation,
    OrganisationsTyp,
  } from '@/stores/OrganisationStore';
  import { SortField, SortOrder, usePersonStore, type PersonStore, type Personendatensatz } from '@/stores/PersonStore';
  import { usePersonenkontextStore, type PersonenkontextStore } from '@/stores/PersonenkontextStore';
  import { useRolleStore, type RolleStore, type RolleResponse, RollenArt } from '@/stores/RolleStore';
  import { type SearchFilterStore, useSearchFilterStore } from '@/stores/SearchFilterStore';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import ResultTable, { type TableRow } from '@/components/admin/ResultTable.vue';
  import SearchField from '@/components/admin/SearchField.vue';
  import { type TranslatedObject } from '@/types.d';
  import { useOrganisationen } from '@/composables/useOrganisationen';
  import { type TranslatedRolleWithAttrs, useRollen } from '@/composables/useRollen';
  import RolleModify from '@/components/admin/rollen/RolleModify.vue';

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

  type ReadonlyHeaders = InstanceType<typeof VDataTableServer>['headers'];
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
  const selectedOrganisation: Ref<Array<string>> = ref([]);
  const selectedStatus: Ref<string | null> = ref(null);
  const searchFilter: Ref<string> = ref('');

  const selectedRollenObjects: Ref<RolleResponse[]> = ref([]);
  const sortField: Ref<string | null> = ref(null);
  const sortOrder: Ref<SortOrder | null> = ref(null);

  const rolleModifiyDialogVisible: Ref<boolean> = ref(false);
  const selectedOption: Ref<string | null> = ref(null);

  type ActionTypes = {
    [key: string]: string;
  };

  // Define action types with i18n values (Other options will be added here in the future)
  const actionTypes: ActionTypes = {
    MODIFY_ROLLE: t('admin.rolle.edit'),
  };

  // Computed property for generating options dynamically
  const actions: ComputedRef<TranslatedObject[]> = computed(() => {
    return Object.entries(actionTypes).map(([key, value]: [string, string]) => ({
      value: key,
      title: value,
    }));
  });

  const filterOrSearchActive: Ref<boolean> = computed(
    () =>
      (!hasAutoSelectedOrganisation.value && selectedOrganisation.value.length > 0) ||
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

  const rollen: ComputedRef<TranslatedObject[] | undefined> = computed(() => {
    const filteredRollen: RolleResponse[] = personenkontextStore.filteredRollen?.moeglicheRollen || [];
    const uniqueRollen: RolleResponse[] = [...new Set([...filteredRollen, ...selectedRollenObjects.value])];

    return uniqueRollen
      .map((rolle: RolleResponse) => ({
        value: rolle.id,
        title: rolle.name,
      }))
      .sort((a: TranslatedObject, b: TranslatedObject) => a.title.localeCompare(b.title));
  });

  const organisationenForOption: ComputedRef<TranslatedObject[] | undefined> = useOrganisationen();

  const rollenForOption: ComputedRef<TranslatedRolleWithAttrs[] | undefined> = useRollen();

  const lehrRollen: ComputedRef<TranslatedRolleWithAttrs[] | undefined> = computed(() => {
    return rollenForOption.value?.filter((rolle: TranslatedRolleWithAttrs) => rolle.rollenart === RollenArt.Lehr);
  });

  const statuses: Array<string> = ['Aktiv', 'Inaktiv'];

  async function getPaginatedPersonen(page: number): Promise<void> {
    searchFilterStore.personenPage = page;
    await personStore.getAllPersons({
      offset: (searchFilterStore.personenPage - 1) * searchFilterStore.personenPerPage,
      limit: searchFilterStore.personenPerPage,
      organisationIDs: selectedKlassen.value.length ? selectedKlassen.value : selectedOrganisation.value,
      rolleIDs: searchFilterStore.selectedRollen || selectedRollen.value,
      searchFilter: searchFilterStore.searchFilterPersonen || searchFilter.value,
      sortField: searchFilterStore.sortField as SortField,
      sortOrder: searchFilterStore.sortOrder as SortOrder,
    });
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
      organisationIDs: searchFilterStore.selectedOrganisationen || selectedOrganisation.value,
      rolleIDs: searchFilterStore.selectedRollen || selectedRollen.value,
      searchFilter: searchFilterStore.searchFilterPersonen || searchFilter.value,
    });
  }

  async function autoSelectOrganisation(): Promise<void> {
    // Autoselect the Orga for the current user that only has 1 Orga assigned to him.
    if (organisationStore.allOrganisationen.length === 1) {
      selectedOrganisation.value = [organisationStore.allOrganisationen[0]?.id || ''];
      hasAutoSelectedOrganisation.value = true;
      if (selectedOrganisation.value.length) {
        await organisationStore.getFilteredKlassen({
          administriertVon: selectedOrganisation.value,
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

  async function applySearchAndFilters(): Promise<void> {
    await organisationStore.getFilteredKlassen({
      administriertVon: selectedOrganisation.value,
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
    if (selectedOrganisation.value.length) {
      await organisationStore.getFilteredKlassen({
        administriertVon: selectedOrganisation.value,
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
      selectedOrganisation.value = [];
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
        administriertVon: selectedOrganisation.value,
        organisationIds: selectedKlassen.value,
      });

      // set values for klassen dropdown
      if (selectedOrganisation.value.length) {
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
        organisationIds: selectedOrganisation.value,
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

  const handleOption = (newValue: string | null): void => {
    if (!newValue) return;

    switch (newValue) {
      case 'MODIFY_ROLLE':
        rolleModifiyDialogVisible.value = true;
        break;
    }
  };

  // Handles the event when closing the dialog
  const handleDialog = (isDialogVisible: boolean): void => {
    rolleModifiyDialogVisible.value = isDialogVisible;
    selectedOption.value = null;
  };

  onMounted(async () => {
    personenkontextStore.processWorkflowStep({
      limit: 25,
    });
    if (filterOrSearchActive.value) {
      selectedOrganisation.value = searchFilterStore.selectedOrganisationen || [];
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
      organisationIds: selectedOrganisation.value,
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
            :disabled="!filterOrSearchActive"
            @click="resetSearchAndFilter()"
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
            :class="{ selected: selectedOrganisation.length > 0 }"
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
            v-model="selectedOrganisation"
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
                v-if="selectedOrganisation.length < 2"
                class="v-autocomplete__selection-text"
                >{{ item.title }}</span
              >
              <div v-else-if="index === 0">
                {{ $t('admin.schule.schulenSelected', { count: selectedOrganisation.length }) }}
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
            :disabled="!!selectedOrganisation.length"
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
                  :disabled="!selectedOrganisation.length"
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
          <v-select
            clearable
            data-testid="benutzer-edit-select"
            density="compact"
            id="benutzer-edit-select"
            :items="actions"
            item-value="value"
            item-text="title"
            :no-data-text="$t('noDataFound')"
            :placeholder="$t('edit')"
            ref="benutzer-edit-select"
            required="true"
            variant="outlined"
            v-model="selectedOption"
            @update:modelValue="handleOption"
          ></v-select>
          <RolleModify
            v-if="rolleModifiyDialogVisible"
            :organisationen="organisationenForOption"
            :rollen="lehrRollen"
            :isLoading="personenkontextStore.loading"
            :isDialogVisible="rolleModifiyDialogVisible"
            :errorCode="personenkontextStore.errorCode"
            @update:isDialogVisible="handleDialog($event)"
          >
          </RolleModify>
        </v-col>
        <v-spacer></v-spacer>
        <SearchField
          :initialValue="searchFilterStore.searchFilterPersonen ?? ''"
          :hoverText="$t('person.firstNameLastNameReferrerKopersNr')"
          @onApplySearchFilter="handleSearchFilter"
          ref="searchFieldComponent"
        ></SearchField>
      </v-row>
      <ResultTable
        :currentPage="searchFilterStore.personenPage"
        data-testid="person-table"
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
