<script setup lang="ts">
  import { computed, onMounted, ref, type ComputedRef, type Ref } from 'vue';
  import ResultTable from '@/components/admin/ResultTable.vue';
  import { type Composer, useI18n } from 'vue-i18n';
  import type { VDataTableServer } from 'vuetify/lib/components/index.mjs';
  import {
    OrganisationsTyp,
    useOrganisationStore,
    type Organisation,
    type OrganisationStore,
  } from '@/stores/OrganisationStore';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import type { UserinfoPersonenkontext } from '@/stores/PersonenkontextStore';
  import { useAuthStore, type AuthStore } from '@/stores/AuthStore';
  import { type TranslatedObject } from '@/types.d';
  import { useRouter, type Router } from 'vue-router';

  const organisationStore: OrganisationStore = useOrganisationStore();
  const authStore: AuthStore = useAuthStore();
  const { t }: Composer = useI18n({ useScope: 'global' });

  const router: Router = useRouter();

  type ReadonlyHeaders = VDataTableServer['$props']['headers'];
  type UnwrapReadonlyArray<A> = A extends Readonly<Array<infer I>> ? I : never;
  type ReadonlyDataTableHeader = UnwrapReadonlyArray<ReadonlyHeaders>;

  // Utility type to make headers mutable
  type DeepMutable<T> = { -readonly [P in keyof T]: DeepMutable<T[P]> };
  type DataTableHeader = DeepMutable<ReadonlyDataTableHeader>;

  // Define headers as a mutable array
  const headers: Ref<DataTableHeader[]> = ref([
    {
      title: t('admin.klasse.klasse'),
      key: 'name',
      align: 'start',
    } as DataTableHeader,
  ]);

  const selectedSchule: Ref<string | null> = ref(null);
  const selectedKlassen: Ref<Array<string>> = ref([]);
  const finalKlassen: Ref<Array<Organisation>> = ref([]);
  const klassenOptions: Ref<TranslatedObject[] | undefined> = ref([]);

  const searchInputSchulen: Ref<string> = ref('');
  const searchInputKlassen: Ref<string> = ref('');
  const hasAutoselectedSchule: Ref<boolean> = ref(false);

  const schuleMap: Ref<
    Map<string, string | null | undefined> & Omit<Map<string, string | null | undefined>, keyof Map<never, never>>
  > = ref(new Map<string, string | null | undefined>());

  const schulen: ComputedRef<TranslatedObject[] | undefined> = computed(() => {
    return organisationStore.allOrganisationen
      .map((org: Organisation) => ({
        value: org.id,
        title: `${org.kennung} (${org.name.trim()})`,
      }))
      .sort((a: TranslatedObject, b: TranslatedObject) => a.title.localeCompare(b.title));
  });

  // Create a map that holds all Schulen with their id, kennung and name
  async function fetchSchuleMap(): Promise<Map<string, string>> {
    await organisationStore.getAllOrganisationen({
      includeTyp: OrganisationsTyp.Schule,
      systemrechte: ['KLASSEN_VERWALTEN'],
    });
    return new Map(
      organisationStore.allOrganisationen.map((org: Organisation) => [org.id, `${org.kennung} (${org.name.trim()})`]),
    );
  }
  // Retrieve the parent Schule from the Klasse using the map's key
  function getSchuleDetails(klasse: Organisation): { schuleDetails: string } {
    const schuleDetails: string | undefined = schuleMap.value.get(klasse.administriertVon || '') ?? '---';
    return {
      schuleDetails,
    };
  }

  async function updateSelectedSchule(newValue: string | null): Promise<void> {
    if (newValue !== null) {
      // Fetch Klassen related to the selected Schule
      await organisationStore.getKlassenByOrganisationId(newValue);
      // Update the klassenOptions for the dropdown
      klassenOptions.value = organisationStore.klassen.map((org: Organisation) => ({
        value: org.id,
        title: org.name,
      }));

      // Update finalKlassen to show in the table
      finalKlassen.value = organisationStore.klassen.map((klasse: Organisation) => ({
        ...klasse,
        ...getSchuleDetails(klasse),
      }));
    } else {
      // Reset selectedKlassen and klassenOptions when Schule is unselected
      selectedKlassen.value = [];
      klassenOptions.value = [];
      organisationStore.totalKlassen = 0;

      // Fetch all Klassen when no Schule is selected
      await organisationStore.getAllOrganisationen({
        includeTyp: OrganisationsTyp.Klasse,
        systemrechte: ['KLASSEN_VERWALTEN'],
      });
      klassenOptions.value = organisationStore.allKlassen.map((org: Organisation) => ({
        value: org.id,
        title: org.name,
      }));

      // Update finalKlassen to include schuleKennung
      finalKlassen.value = organisationStore.allKlassen.map((klasse: Organisation) => ({
        ...klasse,
        ...getSchuleDetails(klasse),
      }));
    }
  }

  async function updateSelectedKlassen(newValue: string[]): Promise<void> {
    if (newValue.length > 0 && selectedSchule.value !== null) {
      // Filter finalKlassen to only include the selected Klassen
      finalKlassen.value = organisationStore.klassen
        .filter((klasse: Organisation) => newValue.includes(klasse.id))
        .map((klasse: Organisation) => ({
          ...klasse,
          ...getSchuleDetails(klasse),
        }));
    } else if (selectedSchule.value !== null) {
      // If no Klassen are selected but a Schule is selected, show all Klassen for the selected Schule
      finalKlassen.value = organisationStore.klassen.map((klasse: Organisation) => ({
        ...klasse,
        ...getSchuleDetails(klasse),
      }));
    } else {
      // If no Klassen and no Schule are selected, show all Klassen
      await organisationStore.getAllOrganisationen({
        includeTyp: OrganisationsTyp.Klasse,
        systemrechte: ['KLASSEN_VERWALTEN'],
      });
      finalKlassen.value = organisationStore.allKlassen.map((klasse: Organisation) => ({
        ...klasse,
        ...getSchuleDetails(klasse),
      }));
    }
  }

  async function updateSchulenSearch(searchValue: string): Promise<void> {
    if (searchValue.length >= 1) {
      // Fetch Schulen matching the search string when it has 3 or more characters
      await organisationStore.getAllOrganisationen({
        searchString: searchValue,
        includeTyp: OrganisationsTyp.Schule,
        systemrechte: ['KLASSEN_VERWALTEN'],
      });
    } else {
      // Fetch all Schulen when the search string is less than 3 characters
      await organisationStore.getAllOrganisationen({
        includeTyp: OrganisationsTyp.Schule,
        systemrechte: ['KLASSEN_VERWALTEN'],
      });
    }
  }

  async function updateKlassenSearch(searchValue: string): Promise<void> {
    if (searchValue.length >= 1 && selectedSchule.value !== null) {
      // Fetch Klassen matching the search string and selected schule
      await organisationStore.getAllOrganisationen({
        administriertVon: [selectedSchule.value],
        searchString: searchValue,
        includeTyp: OrganisationsTyp.Klasse,
        systemrechte: ['KLASSEN_VERWALTEN'],
      });
    } else if (searchValue.length >= 1 && selectedSchule.value === null) {
      await organisationStore.getAllOrganisationen({
        searchString: searchValue,
        includeTyp: OrganisationsTyp.Klasse,
        systemrechte: ['KLASSEN_VERWALTEN'],
      });
    } else if (searchValue.length < 1 && selectedSchule.value === null) {
      await organisationStore.getAllOrganisationen({
        includeTyp: OrganisationsTyp.Klasse,
        systemrechte: ['KLASSEN_VERWALTEN'],
      });
    } else if (selectedSchule.value !== null) {
      // Fetch all Klassen for the selected Schule when the search string is cleared
      await organisationStore.getAllOrganisationen({
        administriertVon: [selectedSchule.value],
        includeTyp: OrganisationsTyp.Klasse,
        systemrechte: ['KLASSEN_VERWALTEN'],
      });
    }
  }

  // Checks if the filter is active or not
  const filterActive: Ref<boolean> = computed(() => !!selectedSchule.value || selectedKlassen.value.length > 0);

  // Function to reset search and filter
  async function resetSearchAndFilter(): Promise<void> {
    // Clear search input for Klassen
    searchInputKlassen.value = '';
    // Clear selected Klassen
    selectedKlassen.value = [];

    // If the user has an autoselected Schule, do not reset it
    if (hasAutoselectedSchule.value && selectedSchule.value !== null) {
      // Fetch all Klassen for the selected Schule
      organisationStore.getKlassenByOrganisationId(selectedSchule.value).then(() => {
        finalKlassen.value = organisationStore.klassen.map((klasse: Organisation) => ({
          ...klasse,
          ...getSchuleDetails(klasse),
        }));
      });
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
        systemrechte: ['KLASSEN_VERWALTEN'],
      });
      await organisationStore.getAllOrganisationen({
        includeTyp: OrganisationsTyp.Klasse,
        systemrechte: ['KLASSEN_VERWALTEN'],
      });
      finalKlassen.value = organisationStore.allKlassen.map((klasse: Organisation) => ({
        ...klasse,
        ...getSchuleDetails(klasse),
      }));
    }
  }
  // Checks the current logged in user's kontexte and compares that to the organisations in the DB.
  // If the user has exactly 1 matching organisation then the Schule will be autoselectd for him.
  async function handleUserContext(): Promise<void> {
    const personenkontexte: Array<UserinfoPersonenkontext> | null = authStore.currentUser?.personenkontexte || [];
    if (personenkontexte.length > 0) {
      if (organisationStore.allOrganisationen.length === 1) {
        selectedSchule.value = organisationStore.allOrganisationen[0]?.id || null;
        if (selectedSchule.value) {
          await organisationStore.getKlassenByOrganisationId(selectedSchule.value);
          finalKlassen.value = organisationStore.klassen.map((klasse: Organisation) => ({
            ...klasse,
            ...getSchuleDetails(klasse),
          }));
          hasAutoselectedSchule.value = true;
        }
      } else {
        headers.value.unshift({
          title: t('admin.schule.dienststellennummer'),
          key: 'schuleDetails',
          align: 'start',
        } as DataTableHeader);
      }
    }
  }

  function navigateToKlassenDetails(_$event: PointerEvent, { item }: { item: Organisation }): void {
    router.push({ name: 'klasse-details', params: { id: item.id } });
  }
  onMounted(async () => {
    await organisationStore.getAllOrganisationen({
      includeTyp: OrganisationsTyp.Schule,
      systemrechte: ['SCHULEN_VERWALTEN'],
    });
    await organisationStore.getAllOrganisationen({
      includeTyp: OrganisationsTyp.Klasse,
      systemrechte: ['KLASSEN_VERWALTEN'],
    });
    // Initialize klassenOptions with all classes
    klassenOptions.value = organisationStore.allKlassen.map((org: Organisation) => ({
      value: org.id,
      title: org.name,
    }));

    // Fetch Schule map
    schuleMap.value = await fetchSchuleMap();

    // Handle user context
    await handleUserContext();

    // Update finalKlassen with Schule details
    finalKlassen.value = organisationStore.allKlassen.map((klasse: Organisation) => ({
      ...klasse,
      ...getSchuleDetails(klasse),
    }));
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
            @update:search="updateSchulenSearch"
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
                      { count: organisationStore.totalOrganisationen },
                      organisationStore.totalOrganisationen,
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
                </v-autocomplete>
              </div>
            </template>
            <span>{{ $t('admin.schule.selectSchuleFirst') }}</span>
          </v-tooltip>
        </v-col>
      </v-row>
      <ResultTable
        data-testid="klasse-table"
        :header="$t('admin.klasse.management')"
        :items="finalKlassen || []"
        :loading="organisationStore.loading"
        :headers="headers"
        @onUpdateTable="
          organisationStore.getAllOrganisationen({
            includeTyp: OrganisationsTyp.Klasse,
            systemrechte: ['KLASSEN_VERWALTEN'],
          })
        "
        @onHandleRowClick="navigateToKlassenDetails"
        :totalItems="organisationStore.allKlassen.length"
        item-value-path="id"
      >
        <template v-slot:[`item.schuleDetails`]="{ item }">
          <div
            class="ellipsis-wrapper"
            :title="item.schuleDetails"
          >
            {{ item.schuleDetails }}
          </div>
        </template></ResultTable
      >
    </LayoutCard>
  </div>
</template>
