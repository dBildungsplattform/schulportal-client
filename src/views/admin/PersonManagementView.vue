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
  import { usePersonStore, type Person, type PersonStore, type Personendatensatz } from '@/stores/PersonStore';
  import {
    usePersonenkontextStore,
    type PersonenkontextStore,
    type Uebersicht,
    type Zuordnung,
  } from '@/stores/PersonenkontextStore';
  import { useRolleStore, type RolleStore, type RolleResponse } from '@/stores/RolleStore';
  import { type SearchFilterStore, useSearchFilterStore } from '@/stores/SearchFilterStore';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import ResultTable, { type TableRow } from '@/components/admin/ResultTable.vue';
  import SearchField from '@/components/admin/SearchField.vue';
  import { type TranslatedObject } from '@/types.d';
  import { setPreviousUrl } from '@/utils/routing';

  const searchFieldComponent: Ref = ref();

  const router: Router = useRouter();
  const organisationStore: OrganisationStore = useOrganisationStore();
  const personStore: PersonStore = usePersonStore();
  const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();
  const rolleStore: RolleStore = useRolleStore();
  const searchFilterStore: SearchFilterStore = useSearchFilterStore();
  const { t }: Composer = useI18n({ useScope: 'global' });

  let timerId: ReturnType<typeof setTimeout>;
  const hasAutoselectedSchule: Ref<boolean> = ref(false);

  type ReadonlyHeaders = InstanceType<typeof VDataTableServer>['headers'];
  const headers: ReadonlyHeaders = [
    { title: t('person.lastName'), key: 'person.name.familienname', align: 'start' },
    { title: t('person.firstName'), key: 'person.name.vorname', align: 'start' },
    { title: t('person.userName'), key: 'person.referrer', align: 'start' },
    { title: t('person.kopersnr'), key: 'person.personalnummer', align: 'start' },
    { title: t('person.rolle'), key: 'rollen', align: 'start' },
    { title: t('person.zuordnungen'), key: 'administrationsebenen', align: 'start' },
    { title: t('person.klasse'), key: 'klassen', align: 'start' },
  ];

  type PersonenWithRolleAndZuordnung = {
    rollen: string;
    administrationsebenen: string;
    klassen: string;
    person: Person;
  }[];

  const searchInputKlassen: Ref<string> = ref('');
  const searchInputRollen: Ref<string> = ref('');
  const searchInputSchulen: Ref<string> = ref('');

  const selectedKlassen: Ref<Array<string>> = ref([]);
  const selectedRollen: Ref<Array<string>> = ref([]);
  const selectedSchulen: Ref<Array<string>> = ref([]);
  const selectedStatus: Ref<string | null> = ref(null);
  const searchFilter: Ref<string> = ref('');

  const filterOrSearchActive: Ref<boolean> = computed(
    () =>
      (!hasAutoselectedSchule.value && selectedSchulen.value.length > 0) ||
      selectedRollen.value.length > 0 ||
      !!searchFilterStore.selectedSchulen?.length ||
      !!searchFilterStore.selectedRollen?.length ||
      !!searchFilterStore.searchFilter ||
      selectedKlassen.value.length > 0 ||
      !!selectedStatus.value,
  );

  const schulen: ComputedRef<TranslatedObject[] | undefined> = computed(() => {
    return organisationStore.allSchulen
      .slice(0, 25)
      .map((org: Organisation) => ({
        value: org.id,
        title: `${org.kennung} (${org.name})`,
      }))
      .sort((a: TranslatedObject, b: TranslatedObject) => a.title.localeCompare(b.title));
  });

  const rollen: ComputedRef<TranslatedObject[] | undefined> = computed(() => {
    return personenkontextStore.filteredRollen?.moeglicheRollen
      .slice(0, 25)
      .map((rolle: RolleResponse) => ({
        value: rolle.id,
        title: rolle.name,
      }))
      .sort((a: TranslatedObject, b: TranslatedObject) => a.title.localeCompare(b.title));
  });

  const klassen: ComputedRef<TranslatedObject[] | undefined> = computed(() => {
    if (selectedSchulen.value.length) {
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

  function getPaginatedPersonen(page: number): void {
    searchFilterStore.personenPage = page;
    personStore.getAllPersons({
      offset: (searchFilterStore.personenPage - 1) * searchFilterStore.personenPerPage,
      limit: searchFilterStore.personenPerPage,
      organisationIDs: searchFilterStore.selectedSchulen || selectedSchulen.value,
      rolleIDs: searchFilterStore.selectedRollen || selectedRollen.value,
      searchFilter: searchFilterStore.searchFilter || searchFilter.value,
    });
  }

  function getPaginatedPersonenWithLimit(limit: number): void {
    /* reset page to 1 if entries are equal to or less than selected limit */
    if (personStore.totalPersons <= limit) {
      searchFilterStore.personenPage = 1;
    }

    searchFilterStore.personenPerPage = limit;
    personStore.getAllPersons({
      offset: (searchFilterStore.personenPage - 1) * searchFilterStore.personenPerPage,
      limit: searchFilterStore.personenPerPage,
      organisationIDs: searchFilterStore.selectedSchulen || selectedSchulen.value,
      rolleIDs: searchFilterStore.selectedRollen || selectedRollen.value,
      searchFilter: searchFilterStore.searchFilter || searchFilter.value,
    });
  }

  function autoSelectSchule(): void {
    // Autoselect the Schule for the current user that only has 1 Schule assigned to him.
    if (organisationStore.allOrganisationen.length === 1) {
      selectedSchulen.value = [organisationStore.allOrganisationen[0]?.id || ''];
      hasAutoselectedSchule.value = true;
    }
  }

  function applySearchAndFilters(): void {
    personStore.getAllPersons({
      offset: (searchFilterStore.personenPage - 1) * searchFilterStore.personenPerPage,
      limit: searchFilterStore.personenPerPage,
      organisationIDs: searchFilterStore.selectedKlassen?.length
        ? searchFilterStore.selectedKlassen
        : searchFilterStore.selectedSchulen || [],
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

  async function setSchuleFilter(newValue: Array<string>): Promise<void> {
    await searchFilterStore.setSchuleFilter(newValue);
    await searchFilterStore.setKlasseFilter([]);
    selectedKlassen.value = [];
    if (selectedSchulen.value.length) {
      await organisationStore.getFilteredKlassen({
        administriertVon: selectedSchulen.value,
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
    /* do not reset schulen if schule was autoselected */
    if (!hasAutoselectedSchule.value) {
      selectedSchulen.value = [];
    }
    searchInputSchulen.value = '';
    searchInputRollen.value = '';
    searchInputKlassen.value = '';
    selectedRollen.value = [];
    selectedKlassen.value = [];
    selectedStatus.value = null;
    searchFilterStore.personenPage = 1;
    searchFilterStore.personenPerPage = 30;
    personStore.getAllPersons({
      offset: (searchFilterStore.personenPage - 1) * searchFilterStore.personenPerPage,
      limit: searchFilterStore.personenPerPage,
      searchFilter: '',
    });
  }

  // Maps over allPersons, finds the corresponding zuordnungen for each person by matching the personId, and then extracts and combines
  // the rolle values into a single comma separated string. The result is merged with the original person data, adding a new role property.
  const personenWithUebersicht: ComputedRef<PersonenWithRolleAndZuordnung> = computed(() => {
    return personStore.allPersons.map((person: Personendatensatz) => {
      const uebersicht: Uebersicht = personenkontextStore.allUebersichten?.items.find(
        (ueb: Uebersicht) => ueb?.personId === person.person.id,
      );
      const uniqueRollen: Set<string> = new Set<string>();
      uebersicht?.zuordnungen.forEach((zuordnung: Zuordnung) => uniqueRollen.add(zuordnung.rolle));
      const rollenZuordnungen: string = uniqueRollen.size > 0 ? Array.from(uniqueRollen).join(', ') : '---';

      // Collect unique administrationsebenen
      const uniqueAdministrationsebenen: Set<string> = new Set<string>();
      uebersicht?.zuordnungen
        .filter((zuordnung: Zuordnung) => zuordnung.typ !== OrganisationsTyp.Klasse)
        .forEach((zuordnung: Zuordnung) =>
          uniqueAdministrationsebenen.add(zuordnung.sskDstNr ? zuordnung.sskDstNr : zuordnung.sskName),
        );
      const administrationsebenen: string =
        uniqueAdministrationsebenen.size > 0 ? Array.from(uniqueAdministrationsebenen).join(', ') : '---';
      // Check if personalnummer is null, if so, replace it with "---"
      const personalnummer: string = person.person.personalnummer ?? '---';
      // Check if the uebersicht has a zuordnung of type "Klasse" if no then show directly "---" without filtering or mapping
      const klassenZuordnungen: string = uebersicht?.zuordnungen.some(
        (zuordnung: Zuordnung) => zuordnung.typ === OrganisationsTyp.Klasse,
      )
        ? uebersicht.zuordnungen
            .filter((zuordnung: Zuordnung) => zuordnung.typ === OrganisationsTyp.Klasse)
            .map((zuordnung: Zuordnung) => (zuordnung.sskName.length ? zuordnung.sskName : '---'))
            .join(', ')
        : '---';
      return {
        ...person,
        rollen: rollenZuordnungen,
        administrationsebenen: administrationsebenen,
        klassen: klassenZuordnungen,
        person: { ...person.person, personalnummer: personalnummer },
      };
    });
  });

  const handleSearchFilter = (filter: string): void => {
    searchFilter.value = filter;
    applySearchAndFilters();
  };

  function updateKlassenSearch(searchValue: string): void {
    /* cancel pending call */
    clearTimeout(timerId);

    /* delay new call 500ms */
    timerId = setTimeout(() => {
      organisationStore.getFilteredKlassen({ searchString: searchValue, administriertVon: selectedSchulen.value });
    }, 500);
  }

  function updateSchulenSearch(searchValue: string): void {
    /* cancel pending call */
    clearTimeout(timerId);

    /* delay new call 500ms */
    timerId = setTimeout(() => {
      organisationStore.getAllOrganisationen({
        searchString: searchValue,
        includeTyp: OrganisationsTyp.Schule,
        systemrechte: ['PERSONEN_VERWALTEN'],
      });
    }, 500);
  }

  function updateRollenSearch(searchValue: string): void {
    /* cancel pending call */
    clearTimeout(timerId);

    /* delay new call 500ms */
    timerId = setTimeout(() => {
      personenkontextStore.getPersonenkontextRolleWithFilter(searchValue);
    }, 500);
  }

  onMounted(async () => {
    setPreviousUrl();
    if (filterOrSearchActive.value) {
      selectedSchulen.value = searchFilterStore.selectedSchulen || [];
      selectedRollen.value = searchFilterStore.selectedRollen || [];
    }

    await organisationStore.getAllOrganisationen({
      includeTyp: OrganisationsTyp.Schule,
      systemrechte: ['PERSONEN_VERWALTEN'],
    });
    await organisationStore.getFilteredKlassen({
      includeTyp: OrganisationsTyp.Klasse,
      systemrechte: ['KLASSEN_VERWALTEN'],
    });
    await personenkontextStore.getAllPersonenuebersichten();
    await personenkontextStore.getPersonenkontextRolleWithFilter('');

    autoSelectSchule();
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
            :class="{ selected: selectedSchulen.length > 0 }"
            clearable
            data-testid="schule-select"
            density="compact"
            :disabled="hasAutoselectedSchule"
            hide-details
            id="schule-select"
            :items="schulen"
            item-value="value"
            item-text="title"
            multiple
            :no-data-text="$t('noDataFound')"
            :placeholder="$t('admin.schule.schule')"
            ref="schule-select"
            required="true"
            @update:modelValue="setSchuleFilter"
            @update:search="updateSchulenSearch"
            variant="outlined"
            v-model="selectedSchulen"
            v-model:search="searchInputSchulen"
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
                      { count: organisationStore.totalSchulen },
                      organisationStore.totalSchulen,
                    )
                  }}</span
                >
              </v-list-item>
            </template>
            <template v-slot:selection="{ item, index }">
              <span
                v-if="selectedSchulen.length < 2"
                class="v-autocomplete__selection-text"
                >{{ item.title }}</span
              >
              <div v-else-if="index === 0">
                {{ $t('admin.schule.schulenSelected', { count: selectedSchulen.length }) }}
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
            :disabled="!!selectedSchulen.length"
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
                  :disabled="!selectedSchulen.length"
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
                            { count: organisationStore.totalKlassen },
                            organisationStore.totalKlassen,
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
        :items="personenWithUebersicht || []"
        :itemsPerPage="searchFilterStore.personenPerPage"
        :loading="personStore.loading"
        :headers="headers"
        @onHandleRowClick="
          (event: PointerEvent, item: TableRow<unknown>) =>
            navigateToPersonDetails(event, item as TableRow<Personendatensatz>)
        "
        @onItemsPerPageUpdate="getPaginatedPersonenWithLimit"
        @onPageUpdate="getPaginatedPersonen"
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
