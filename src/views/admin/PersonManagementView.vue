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
  import { useRolleStore, type RolleStore, type RolleResponse } from '@/stores/RolleStore';
  import { type SearchFilterStore, useSearchFilterStore } from '@/stores/SearchFilterStore';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import ResultTable, { type TableRow } from '@/components/admin/ResultTable.vue';
  import SearchField from '@/components/admin/SearchField.vue';
  import { type TranslatedObject } from '@/types.d';

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

  const selectedKlassen: Ref<Array<string>> = ref([]);
  const selectedRollen: Ref<Array<string>> = ref([]);
  const selectedOrganisation: Ref<Array<string>> = ref([]);
  const selectedStatus: Ref<string | null> = ref(null);
  const searchFilter: Ref<string> = ref('');

  const sortField: Ref<string | null> = ref(null);
  const sortOrder: Ref<string | null> = ref(null);

  const filterOrSearchActive: Ref<boolean> = computed(
    () =>
      (!hasAutoSelectedOrganisation.value && selectedOrganisation.value.length > 0) ||
      selectedRollen.value.length > 0 ||
      !!searchFilterStore.selectedOrganisationen?.length ||
      !!searchFilterStore.selectedRollen?.length ||
      !!searchFilterStore.searchFilter ||
      !!searchFilterStore.sortField || 
      !!searchFilterStore.sortOrder ||
      selectedKlassen.value.length > 0 ||
      !!selectedStatus.value,
  );

  const organisationen: ComputedRef<TranslatedObject[] | undefined> = computed(() => {
    return organisationStore.allOrganisationen
      .map((org: Organisation) => ({
        value: org.id,
        // Only concatenate if the kennung is present (Should not be for LAND)
        title: org.kennung ? `${org.kennung} (${org.name})` : org.name,
      }))
      .sort((a: TranslatedObject, b: TranslatedObject) => a.title.localeCompare(b.title));
  });

  const rollen: ComputedRef<TranslatedObject[] | undefined> = computed(() => {
    return personenkontextStore.filteredRollen?.moeglicheRollen
      .map((rolle: RolleResponse) => ({
        value: rolle.id,
        title: rolle.name,
      }))
      .sort((a: TranslatedObject, b: TranslatedObject) => a.title.localeCompare(b.title));
  });

  const klassen: ComputedRef<TranslatedObject[] | undefined> = computed(() => {
    if (selectedOrganisation.value.length) {
      return organisationStore.klassen
        .slice(0, 25)
        .map((org: Organisation) => ({
          value: org.id,
          title: org.name,
        }))
        .sort((a: TranslatedObject, b: TranslatedObject) => a.title.localeCompare(b.title));
    }
    return [];
  });

  const statuses: Array<string> = ['Aktiv', 'Inaktiv'];

  async function getPaginatedPersonen(page: number): Promise<void> {
    searchFilterStore.personenPage = page;
    await personStore.getAllPersons({
      offset: (searchFilterStore.personenPage - 1) * searchFilterStore.personenPerPage,
      limit: searchFilterStore.personenPerPage,
      organisationIDs: selectedKlassen.value.length ? selectedKlassen.value : selectedOrganisation.value,
      rolleIDs: searchFilterStore.selectedRollen || selectedRollen.value,
      searchFilter: searchFilterStore.searchFilter || searchFilter.value,
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
      searchFilter: searchFilterStore.searchFilter || searchFilter.value,
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
      }
    }
  }

  function applySearchAndFilters(): void {
    personStore.getAllPersons({
      offset: (searchFilterStore.personenPage - 1) * searchFilterStore.personenPerPage,
      limit: searchFilterStore.personenPerPage,
      organisationIDs: searchFilterStore.selectedKlassen?.length
        ? searchFilterStore.selectedKlassen
        : searchFilterStore.selectedOrganisationen || [],
      rolleIDs: searchFilterStore.selectedRollen || [],
      searchFilter: searchFilterStore.searchFilter || '',
    });
  }

  async function setKlasseFilter(newValue: Array<string>): Promise<void> {
    await searchFilterStore.setKlasseFilter(newValue);
    applySearchAndFilters();
  }

  async function setRolleFilter(newValue: Array<string>): Promise<void> {
    await searchFilterStore.setRolleFilter(newValue);
    applySearchAndFilters();
  }

  async function setOrganisationFilter(newValue: Array<string>): Promise<void> {
    await searchFilterStore.setOrganisationFilter(newValue);
    await searchFilterStore.setKlasseFilter([]);
    selectedKlassen.value = [];
    if (selectedOrganisation.value.length) {
      await organisationStore.getFilteredKlassen({
        administriertVon: selectedOrganisation.value,
        searchString: searchInputKlassen.value,
      });
    }
    applySearchAndFilters();
  }

  function navigateToPersonDetails(_$event: PointerEvent, { item }: { item: Personendatensatz }): void {
    router.push({ name: 'person-details', params: { id: item.person.id } });
  }

  function resetSearchAndFilter(): void {
    searchFilter.value = '';
    searchFieldComponent.value.searchFilter = '';
    searchFilterStore.setKlasseFilter([]);
    searchFilterStore.setRolleFilter([]);
    /* do not reset orgas if orga was autoselected */
    if (!hasAutoSelectedOrganisation.value) {
      selectedOrganisation.value = [];
      searchFilterStore.setOrganisationFilter([]);
    }
    searchInputOrganisationen.value = '';
    searchInputRollen.value = '';
    searchInputKlassen.value = '';
    selectedRollen.value = [];
    selectedKlassen.value = [];
    selectedStatus.value = null;
    searchFilterStore.personenPage = 1;
    searchFilterStore.personenPerPage = 30;
    searchFilterStore.sortField = '';
    searchFilterStore.sortOrder = '';
    personStore.getAllPersons({
      offset: (searchFilterStore.personenPage - 1) * searchFilterStore.personenPerPage,
      limit: searchFilterStore.personenPerPage,
      searchFilter: '',
      sortField: SortField.Familienname,
      sortOrder: SortOrder.Asc,
    });
  }

  const handleSearchFilter = (filter: string): void => {
    searchFilter.value = filter;
    applySearchAndFilters();
  };

  function updateKlassenSearch(searchValue: string): void {
    /* cancel pending call */
    clearTimeout(timerId);

    /* delay new call 500ms */
    timerId = setTimeout(() => {
      organisationStore.getFilteredKlassen({ searchString: searchValue, administriertVon: selectedOrganisation.value });
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

  function updateRollenSearch(searchValue: string): void {
    /* cancel pending call */
    clearTimeout(timerId);

    /* delay new call 500ms */
    timerId = setTimeout(() => {
      personenkontextStore.getPersonenkontextRolleWithFilter(searchValue, 25);
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
  function handleTableSorting(update: { sortField: string | undefined; sortOrder: 'asc' | 'desc' }): void {
    if (update.sortField) {
      sortField.value = mapKeyToBackend(update.sortField);
    }

    sortOrder.value = update.sortOrder;

    // Save the sorting values in the store
    searchFilterStore.setSortField(sortField.value);
    searchFilterStore.setSortOrder(sortOrder.value)

    // Fetch the sorted data
    getPaginatedPersonen(searchFilterStore.personenPage);
  }

  onMounted(async () => {
    if (filterOrSearchActive.value) {
      selectedOrganisation.value = searchFilterStore.selectedOrganisationen || [];
      selectedRollen.value = searchFilterStore.selectedRollen || [];
      selectedKlassen.value = searchFilterStore.selectedKlassen || [];
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
                  :items="klassen"
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
                        >{{
                          $t(
                            'admin.klasse.klassenFound',
                            { count: organisationStore.totalPaginatedKlassen },
                            organisationStore.totalPaginatedKlassen,
                          )
                        }}</span
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
        align="center"
        class="ma-3"
        justify="end"
      >
        <SearchField
          :hover-text="$t('person.firstNameLastNameReferrerKopersNr')"
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
