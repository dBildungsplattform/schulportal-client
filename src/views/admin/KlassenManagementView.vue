<script setup lang="ts">
  import { computed, onMounted, ref, watch, type ComputedRef, type Ref } from 'vue';
  import ResultTable, { type TableRow } from '@/components/admin/ResultTable.vue';
  import { type Composer, useI18n } from 'vue-i18n';
  import type { VDataTableServer } from 'vuetify/lib/components/index.mjs';
  import {
    OrganisationsTyp,
    useOrganisationStore,
    type Organisation,
    type OrganisationStore,
  } from '@/stores/OrganisationStore';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import { useAuthStore, type AuthStore } from '@/stores/AuthStore';
  import type { UserinfoPersonenkontext } from '@/stores/PersonenkontextStore';
  import { useSearchFilterStore, type SearchFilterStore } from '@/stores/SearchFilterStore';
  import { type Mutable, type TranslatedObject } from '@/types.d';
  import { onBeforeRouteLeave, useRouter, type Router } from 'vue-router';
  import KlasseDelete from '@/components/admin/klassen/KlasseDelete.vue';
  import SpshAlert from '@/components/alert/SpshAlert.vue';

  const authStore: AuthStore = useAuthStore();
  const organisationStore: OrganisationStore = useOrganisationStore();
  const searchFilterStore: SearchFilterStore = useSearchFilterStore();
  const { t }: Composer = useI18n({ useScope: 'global' });

  const router: Router = useRouter();

  type TableHeaders = VDataTableServer['headers'];

  // Define headers as a mutable array
  let headers: Ref<Mutable<TableHeaders>> = ref([
    {
      title: t('admin.klasse.klasse'),
      key: 'name',
      align: 'start',
      width: '250px',
    },
    {
      title: t('action'),
      key: 'actions',
      align: 'center',
      sortable: false,
      width: '250px',
    },
  ]);

  const selectedSchule: Ref<string | null> = ref(null);
  const selectedKlassen: Ref<Array<string>> = ref([]);
  const finalKlassen: ComputedRef<Organisation[]> = computed(() => {
    // If there are selected Klassen, filter the allKlassen to show only those
    if (selectedKlassen.value.length > 0) {
      return organisationStore.allKlassen.filter((klasse: Organisation) => selectedKlassen.value.includes(klasse.id));
    }

    // Otherwise, return allKlassen as is
    return organisationStore.allKlassen;
  });

  const klassenOptions: Ref<TranslatedObject[] | undefined> = ref([]);

  const searchInputSchulen: Ref<string> = ref('');
  const searchInputKlassen: Ref<string> = ref('');
  const hasAutoselectedSchule: Ref<boolean> = ref(false);

  const timerId: Ref<ReturnType<typeof setTimeout> | undefined> = ref<ReturnType<typeof setTimeout>>();

  // Variable to track the number of Klassen found depending on the search. The variable totalKlasse in the store controls the table paging and can't be used here correctly.
  let totalKlassen: number = 0;

  const schulen: ComputedRef<TranslatedObject[] | undefined> = computed(() => {
    return organisationStore.allSchulen
      .map((org: Organisation) => ({
        value: org.id,
        title: `${org.kennung} (${org.name.trim()})`,
      }))
      .sort((a: TranslatedObject, b: TranslatedObject) => a.title.localeCompare(b.title));
  });
  const errorTitle: ComputedRef<string> = computed(() => {
    if (!organisationStore.errorCode) {
      return '';
    }
    return organisationStore.errorCode === 'UNSPECIFIED_ERROR'
      ? t('admin.klasse.loadingErrorTitle')
      : t(`admin.klasse.title.${organisationStore.errorCode}`);
  });
  const errorText: ComputedRef<string> = computed(() => {
    if (!organisationStore.errorCode) {
      return '';
    }
    return organisationStore.errorCode === 'UNSPECIFIED_ERROR'
      ? t('admin.klasse.loadingErrorText')
      : t(`admin.klasse.errors.${organisationStore.errorCode}`);
  });

  async function fetchKlassenBySelectedSchuleId(schuleId: string | null): Promise<void> {
    // Fetch Klassen related to the selected Schule
    await organisationStore.getKlassenByOrganisationId({
      offset: (searchFilterStore.klassenPage - 1) * searchFilterStore.klassenPerPage,
      limit: searchFilterStore.klassenPerPage,
      administriertVon: [schuleId || ''],
      organisationIds: searchFilterStore.selectedKlassenForKlassen || [],
    });

    if (selectedKlassen.value.length > 0) {
      // Filter finalKlassen (table) to only include the selected Klassen even when we change the page.
      organisationStore.allKlassen = organisationStore.klassen.filter((klasse: Organisation) =>
        selectedKlassen.value.includes(klasse.id),
      );
    } else {
      organisationStore.allKlassen = organisationStore.klassen;
    }
    // Update the klassenOptions for the dropdown with the Klassen found before
    klassenOptions.value = organisationStore.klassen.map((org: Organisation) => ({
      value: org.id,
      title: org.name,
    }));
    totalKlassen = klassenOptions.value.length;
  }

  async function getPaginatedKlassen(page: number): Promise<void> {
    searchFilterStore.klassenPage = page || 1;

    if (selectedSchule.value) {
      fetchKlassenBySelectedSchuleId(selectedSchule.value);
    } else {
      await organisationStore.getAllOrganisationen({
        offset: (searchFilterStore.klassenPage - 1) * searchFilterStore.klassenPerPage,
        limit: searchFilterStore.klassenPerPage,
        includeTyp: OrganisationsTyp.Klasse,
        systemrechte: ['KLASSEN_VERWALTEN'],
      });
    }
  }

  async function getPaginatedKlassenWithLimit(limit: number): Promise<void> {
    /* reset page to 1 if entries are equal to or less than selected limit */
    if (organisationStore.totalOrganisationen <= limit) {
      searchFilterStore.klassenPage = 1;
    }

    searchFilterStore.klassenPerPage = limit || 1;

    if (selectedSchule.value) {
      fetchKlassenBySelectedSchuleId(selectedSchule.value);
    } else {
      await organisationStore.getAllOrganisationen({
        offset: (searchFilterStore.klassenPage - 1) * searchFilterStore.klassenPerPage,
        limit: searchFilterStore.klassenPerPage,
        includeTyp: OrganisationsTyp.Klasse,
        systemrechte: ['KLASSEN_VERWALTEN'],
      });
    }
  }

  async function applySearchAndFilters(): Promise<void> {
    await fetchKlassenBySelectedSchuleId(searchFilterStore.selectedSchuleForKlassen);

    const klassenCopy: Organisation[] = JSON.parse(JSON.stringify(organisationStore.klassen));

    if (searchFilterStore.selectedKlassenForKlassen?.length && searchFilterStore.selectedKlassenForKlassen.length > 0) {
      // In the table show only the Klassen that are selected
      organisationStore.allKlassen = klassenCopy.filter((klasse: Organisation) =>
        searchFilterStore.selectedKlassenForKlassen?.includes(klasse.id),
      );
    }
  }

  async function updateSelectedSchule(newValue: string | null): Promise<void> {
    await searchFilterStore.setSchuleFilterForKlassen(newValue);
    if (newValue !== null) {
      selectedKlassen.value = [];
      organisationStore.allKlassen = [];
      await fetchKlassenBySelectedSchuleId(newValue);
    } else {
      // Reset selectedKlassen and klassenOptions when Schule is unselected
      selectedKlassen.value = [];
      klassenOptions.value = [];
      organisationStore.allKlassen = [];
      searchFilterStore.selectedKlassenForKlassen = [];
      totalKlassen = 0;

      // Fetch all Klassen when no Schule is selected
      await organisationStore.getAllOrganisationen({
        offset: (searchFilterStore.klassenPage - 1) * searchFilterStore.klassenPerPage,
        limit: 25,
        includeTyp: OrganisationsTyp.Klasse,
        systemrechte: ['KLASSEN_VERWALTEN'],
      });
      klassenOptions.value = organisationStore.allKlassen.map((org: Organisation) => ({
        value: org.id,
        title: org.name,
      }));
    }
    totalKlassen = organisationStore.allKlassen.length;
  }

  async function updateSelectedKlassen(newValue: string[]): Promise<void> {
    await searchFilterStore.setKlasseFilterForKlassen(newValue);
    if (newValue.length > 0 && selectedSchule.value !== null) {
      await organisationStore.getKlassenByOrganisationId({
        offset: (searchFilterStore.klassenPage - 1) * searchFilterStore.klassenPerPage,
        limit: searchFilterStore.klassenPerPage,
        includeTyp: OrganisationsTyp.Klasse,
        systemrechte: ['KLASSEN_VERWALTEN'],
        administriertVon: [selectedSchule.value],
        organisationIds: newValue,
      });
      // Filter finalKlassen (table) to only include the selected Klassen
      organisationStore.allKlassen = organisationStore.klassen.filter((klasse: Organisation) =>
        newValue.includes(klasse.id),
      );
      // The dropdown for Klassen is also updated to show the selectedKlassen on top of the ones already there. (The call to getKlassenByOrganisationId before this will take care of that)
      klassenOptions.value = organisationStore.klassen.map((org: Organisation) => ({
        value: org.id,
        title: org.name,
      }));
    } else if (selectedSchule.value !== null) {
      // If no Klassen are selected but a Schule is selected, show all Klassen for the selected Schule
      organisationStore.allKlassen = organisationStore.klassen;
    } else {
      // If no Klassen and no Schule are selected, show all Klassen
      await organisationStore.getAllOrganisationen({
        offset: (searchFilterStore.klassenPage - 1) * searchFilterStore.klassenPerPage,
        limit: searchFilterStore.klassenPerPage,
        includeTyp: OrganisationsTyp.Klasse,
        systemrechte: ['KLASSEN_VERWALTEN'],
      });
    }
  }

  // Computed property to get the title of the selected organisation
  const selectedOrganisationTitle: ComputedRef<string | undefined> = computed(() => {
    return schulen.value?.find((org: TranslatedObject) => org.value === selectedSchule.value)?.title;
  });

  // Using a watcher instead of modelUpdate since we need the old Value as well.
  // Default behavior of the autocomplete is to reset the newValue to empty string and that causes another request to be made
  watch(searchInputSchulen, async (newValue: string, oldValue: string) => {
    clearTimeout(timerId.value);

    if (oldValue === selectedOrganisationTitle.value) {
      return;
    }
    // If searchValue is empty and selectedOrganisation does not have a value, fetch initial data
    if (newValue === '' && !selectedSchule.value) {
      timerId.value = setTimeout(async () => {
        // Fetch Schulen matching the search string when it has 3 or more characters
        await organisationStore.getAllOrganisationen({
          includeTyp: OrganisationsTyp.Schule,
          limit: 25,
          systemrechte: ['KLASSEN_VERWALTEN'],
        });
      }, 500);
    } else if (newValue && newValue !== selectedOrganisationTitle.value) {
      // If searchValue is not empty and different from the current title, proceed with the search
      timerId.value = setTimeout(async () => {
        // Fetch Schulen matching the search string when it has 3 or more characters
        await organisationStore.getAllOrganisationen({
          searchString: newValue,
          includeTyp: OrganisationsTyp.Schule,
          limit: 25,
          systemrechte: ['KLASSEN_VERWALTEN'],
        });
      }, 500);
    } else if (newValue === '' && selectedSchule.value) {
      // If searchValue is empty and an organization is selected, fetch roles for the selected organization
      timerId.value = setTimeout(async () => {
        await organisationStore.getAllOrganisationen({
          searchString: newValue,
          includeTyp: OrganisationsTyp.Schule,
          limit: 25,
          systemrechte: ['KLASSEN_VERWALTEN'],
        });
      }, 500);
    }
  });

  async function updateKlassenSearch(searchValue: string): Promise<void> {
    if (searchValue.length >= 1 && selectedSchule.value !== null) {
      // Fetch Klassen matching the search string and selected schule
      await organisationStore.getAllOrganisationen({
        offset: (searchFilterStore.klassenPage - 1) * searchFilterStore.klassenPerPage,
        limit: searchFilterStore.klassenPerPage,
        administriertVon: [selectedSchule.value],
        searchString: searchValue,
        includeTyp: OrganisationsTyp.Klasse,
        systemrechte: ['KLASSEN_VERWALTEN'],
        organisationIds: selectedKlassen.value,
      });
      // Here we need to update the dropdown again because there is a searchString present
      klassenOptions.value = organisationStore.allKlassen.map((org: Organisation) => ({
        value: org.id,
        title: org.name,
      }));
      // Extract the selected Klassen IDs into a Set for efficient lookup
      const selectedKlassenIds: Set<string> = new Set(selectedKlassen.value.map((klasseId: string) => klasseId));

      // Normalize the search value to lowercase
      const normalizedSearchValue: string = searchValue.toLowerCase();

      // Filter the options to get only those matching the search results (case-insensitive)
      const searchMatchedOptions: TranslatedObject[] = klassenOptions.value.filter((klasseOption: TranslatedObject) =>
        klasseOption.title.toLowerCase().includes(normalizedSearchValue),
      );

      // Count the selected Klassen that match the search results
      const matchedSelectedKlassen: TranslatedObject[] = searchMatchedOptions.filter((klasseOption: TranslatedObject) =>
        selectedKlassenIds.has(klasseOption.value),
      );

      // Count only the search-matched Klassen that are not in the selected list
      const filteredOptions: TranslatedObject[] = searchMatchedOptions.filter(
        (klasseOption: TranslatedObject) => !selectedKlassenIds.has(klasseOption.value),
      );

      // Calculate the total Klassen by summing up unique matches
      totalKlassen = filteredOptions.length + matchedSelectedKlassen.length;
    } else if (searchValue.length >= 1 && selectedSchule.value === null) {
      await organisationStore.getAllOrganisationen({
        offset: (searchFilterStore.klassenPage - 1) * searchFilterStore.klassenPerPage,
        limit: searchFilterStore.klassenPerPage,
        searchString: searchValue,
        includeTyp: OrganisationsTyp.Klasse,
        systemrechte: ['KLASSEN_VERWALTEN'],
      });
    } else if (searchValue.length < 1 && selectedSchule.value === null) {
      await organisationStore.getAllOrganisationen({
        offset: (searchFilterStore.klassenPage - 1) * searchFilterStore.klassenPerPage,
        limit: searchFilterStore.klassenPerPage,
        includeTyp: OrganisationsTyp.Klasse,
        systemrechte: ['KLASSEN_VERWALTEN'],
      });
    } else if (searchValue === '' && selectedSchule.value !== null && selectedKlassen.value.length === 0) {
      // Fetch all Klassen for the selected Schule when the search string is cleared
      await organisationStore.getAllOrganisationen({
        searchString: searchValue,
        offset: (searchFilterStore.klassenPage - 1) * searchFilterStore.klassenPerPage,
        limit: searchFilterStore.klassenPerPage,
        administriertVon: [selectedSchule.value],
        includeTyp: OrganisationsTyp.Klasse,
        systemrechte: ['KLASSEN_VERWALTEN'],
      });
      // Here we need to update the dropdown again but with an empty searchstring
      klassenOptions.value = organisationStore.allKlassen.map((org: Organisation) => ({
        value: org.id,
        title: org.name,
      }));
      totalKlassen = klassenOptions.value.length;
    } else if (searchValue === '' && selectedSchule.value !== null && selectedKlassen.value.length !== 0) {
      // Fetch all Klassen for the selected Schule when the search string is cleared
      await organisationStore.getAllOrganisationen({
        searchString: searchValue,
        offset: (searchFilterStore.klassenPage - 1) * searchFilterStore.klassenPerPage,
        limit: searchFilterStore.klassenPerPage,
        administriertVon: [selectedSchule.value],
        includeTyp: OrganisationsTyp.Klasse,
        systemrechte: ['KLASSEN_VERWALTEN'],
        organisationIds: selectedKlassen.value,
      });
      // Here we need to update the dropdown again but with an empty searchstring and already selected Klassen
      klassenOptions.value = organisationStore.allKlassen.map((org: Organisation) => ({
        value: org.id,
        title: org.name,
      }));
      // The number of Klassen comes from the number of klassen from the dropdown
      totalKlassen = klassenOptions.value.length;
    }
  }

  // Checks if the filter is active or not
  const filterActive: Ref<boolean> = computed(() => {
    if (hasAutoselectedSchule.value) {
      return selectedKlassen.value.length > 0;
    }
    return !!selectedSchule.value || selectedKlassen.value.length > 0;
  });

  // Function to reset search and filter
  async function resetSearchAndFilter(): Promise<void> {
    // Clear search input for Klassen
    searchInputKlassen.value = '';
    // Clear selected Klassen
    selectedKlassen.value = [];
    // Clear the store
    searchFilterStore.setSchuleFilterForKlassen(null);
    searchFilterStore.setKlasseFilterForKlassen([]);

    // If the user has an autoselected Schule, do not reset it
    if (hasAutoselectedSchule.value && selectedSchule.value !== null) {
      // Fetch all Klassen for the selected Schule
      organisationStore.getKlassenByOrganisationId({ limit: 25, administriertVon: [selectedSchule.value] });
      organisationStore.allKlassen = organisationStore.klassen;
    } else {
      // Clear search input for Schulen
      searchInputSchulen.value = '';
      // Clear selected Schule
      selectedSchule.value = null;
      // Reset klassenOptions
      klassenOptions.value = [];
      // Refetch all data
      await organisationStore.getAllOrganisationen({
        includeTyp: OrganisationsTyp.Schule,
        limit: 25,
        systemrechte: ['KLASSEN_VERWALTEN'],
      });
      await organisationStore.getAllOrganisationen({
        offset: (searchFilterStore.klassenPage - 1) * searchFilterStore.klassenPerPage,
        limit: searchFilterStore.klassenPerPage,
        includeTyp: OrganisationsTyp.Klasse,
        systemrechte: ['KLASSEN_VERWALTEN'],
      });
    }
  }
  // Checks the current logged in user's kontexte and compares that to the organisations in the DB.
  // If the user has exactly 1 matching organisation then the Schule will be autoselectd for him.
  async function handleUserContext(): Promise<void> {
    const personenkontexte: Array<UserinfoPersonenkontext> = authStore.currentUser?.personenkontexte || [];
    if (personenkontexte.length > 0) {
      if (organisationStore.allSchulen.length === 1 && !searchFilterStore.selectedSchuleForKlassen) {
        selectedSchule.value = organisationStore.allSchulen[0]?.id || null;
        if (selectedSchule.value) {
          await organisationStore.getKlassenByOrganisationId({ administriertVon: [selectedSchule.value] });
          hasAutoselectedSchule.value = true;
          totalKlassen = klassenOptions.value?.length || 0;
        }
      } else if (headers.value) {
        headers.value = [
          {
            title: t('admin.schule.dienststellennummer'),
            key: 'schuleDetails',
            align: 'start',
            width: '350px',
          },
          ...headers.value,
        ];
      }
    }
  }

  function navigateToKlassenDetails(_$event: PointerEvent, { item }: { item: Organisation }): void {
    router.push({ name: 'klasse-details', params: { id: item.id } });
  }
  onMounted(async () => {
    // If the store holds a Schule already then use it
    if (searchFilterStore.selectedSchuleForKlassen) {
      selectedSchule.value = searchFilterStore.selectedSchuleForKlassen;
      selectedKlassen.value = searchFilterStore.selectedKlassenForKlassen || [];
      await applySearchAndFilters();
    } else {
      await organisationStore.getAllOrganisationen({
        offset: (searchFilterStore.klassenPage - 1) * searchFilterStore.klassenPerPage,
        limit: searchFilterStore.klassenPerPage,
        includeTyp: OrganisationsTyp.Klasse,
        systemrechte: ['KLASSEN_VERWALTEN'],
      });
      await organisationStore.getAllOrganisationen({
        offset: (searchFilterStore.klassenPage - 1) * searchFilterStore.klassenPerPage,
        limit: 25,
        includeTyp: OrganisationsTyp.Schule,
        systemrechte: ['KLASSEN_VERWALTEN'],
      });
      // Initialize klassenOptions with all Klassen
      klassenOptions.value = organisationStore.allKlassen.map((org: Organisation) => ({
        value: org.id,
        title: org.name,
      }));
    }
    // Handle user context
    await handleUserContext();
  });

  async function deleteKlasse(organisationId: string): Promise<void> {
    await organisationStore.deleteOrganisationById(organisationId);
  }

  const handleAlertClose = (): void => {
    organisationStore.errorCode = '';
    router.go(0);
  };

  onBeforeRouteLeave(async () => {
    organisationStore.errorCode = '';
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
    <LayoutCard :header="$t('admin.klasse.management')">
      <!-- Error Message Display -->
      <SpshAlert
        :model-value="!!organisationStore.errorCode"
        :title="errorTitle"
        :type="'error'"
        :closable="false"
        :text="errorText"
        :showButton="true"
        :buttonText="$t('nav.backToList')"
        :buttonAction="handleAlertClose"
        @update:modelValue="handleAlertClose"
      />
      <template v-if="!organisationStore.errorCode">
        <v-row
          align="center"
          class="ma-3"
          justify="end"
        >
          <v-col
            cols="12"
            md="2"
            class="py-md-0 text-md-right"
          >
            <v-btn
              class="px-0 reset-filter"
              data-testid="reset-filter-button"
              :disabled="!filterActive"
              @click="resetSearchAndFilter()"
              size="x-small"
              variant="text"
              width="auto"
            >
              {{ $t('resetFilter') }}
            </v-btn>
          </v-col>
          <v-col
            md="3"
            cols="12"
            class="py-md-0"
          >
            <v-autocomplete
              autocomplete="off"
              class="filter-dropdown"
              :class="{ selected: selectedSchule }"
              clearable
              data-testid="schule-select"
              density="compact"
              :disabled="hasAutoselectedSchule"
              hide-details
              id="schule-select"
              :items="schulen"
              item-value="value"
              item-text="title"
              :no-data-text="$t('noDataFound')"
              :placeholder="$t('admin.schule.schule')"
              ref="schule-select"
              required="true"
              variant="outlined"
              @update:modelValue="updateSelectedSchule"
              v-model="selectedSchule"
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
                        { count: organisationStore.totalPaginatedSchulen },
                        organisationStore.totalPaginatedSchulen,
                      )
                    }}</span
                  >
                </v-list-item>
              </template>
            </v-autocomplete>
          </v-col>
          <v-col
            md="3"
            cols="12"
            class="py-md-0"
          >
            <v-tooltip
              :disabled="!!selectedSchule"
              location="top"
            >
              <template v-slot:activator="{ props }">
                <div v-bind="props">
                  <v-autocomplete
                    autocomplete="off"
                    chips
                    class="filter-dropdown"
                    :class="{ selected: selectedKlassen.length > 0 }"
                    clearable
                    data-testid="klasse-select"
                    density="compact"
                    :disabled="!selectedSchule"
                    hide-details
                    id="klasse-select"
                    ref="klasse-select"
                    :items="klassenOptions"
                    item-value="value"
                    item-text="title"
                    multiple
                    :no-data-text="$t('noDataFound')"
                    :placeholder="$t('admin.klasse.klassen')"
                    required="true"
                    @update:search="updateKlassenSearch"
                    variant="outlined"
                    @update:modelValue="updateSelectedKlassen"
                    v-model="selectedKlassen"
                    v-model:search="searchInputKlassen"
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
                          >{{ $t('admin.klasse.klassenFound', { count: totalKlassen }, totalKlassen) }}</span
                        >
                      </v-list-item>
                    </template>
                  </v-autocomplete>
                </div>
              </template>
              <span>{{ $t('admin.schule.selectSchuleFirst') }}</span>
            </v-tooltip>
          </v-col>
        </v-row>
        <ResultTable
          :currentPage="searchFilterStore.klassenPage"
          data-testid="klasse-table"
          :header="$t('admin.klasse.management')"
          :items="finalKlassen || []"
          :loading="organisationStore.loading"
          :headers="headers"
          @onHandleRowClick="
            (event: PointerEvent, item: TableRow<unknown>) =>
              navigateToKlassenDetails(event, item as TableRow<Organisation>)
          "
          @onItemsPerPageUpdate="getPaginatedKlassenWithLimit"
          @onPageUpdate="getPaginatedKlassen"
          :totalItems="organisationStore.totalKlassen"
          :itemsPerPage="searchFilterStore.klassenPerPage"
          item-value-path="id"
        >
          <template v-slot:[`item.schuleDetails`]="{ item }">
            <div
              class="ellipsis-wrapper"
              :title="item.schuleDetails"
            >
              {{ item.schuleDetails }}
            </div>
          </template>
          <template v-slot:[`item.actions`]="{ item }">
            <KlasseDelete
              :errorCode="organisationStore.errorCode"
              :klassenname="item.name"
              :klassenId="item.id"
              :schulname="item.schuleDetails"
              :useIconActivator="true"
              :isLoading="organisationStore.loading"
              @onDeleteKlasse="deleteKlasse(item.id)"
            ></KlasseDelete>
          </template>
        </ResultTable>
      </template>
    </LayoutCard>
  </div>
</template>
