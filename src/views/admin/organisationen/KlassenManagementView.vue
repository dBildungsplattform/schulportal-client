<script setup lang="ts">
  import KlasseDelete from '@/components/admin/klassen/KlasseDelete.vue';
  import ResultTable, { type TableRow } from '@/components/admin/ResultTable.vue';
  import SpshAlert from '@/components/alert/SpshAlert.vue';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import SchulenFilter from '@/components/filter/SchulenFilter.vue';
  import { useAutoselectedSchule } from '@/composables/useAutoselectedSchule';
  import {
    OrganisationsTyp,
    useOrganisationStore,
    type Organisation,
    type OrganisationenFilter,
    type OrganisationStore,
  } from '@/stores/OrganisationStore';
  import { RollenSystemRecht } from '@/stores/RolleStore';
  import { useSearchFilterStore, type SearchFilterStore } from '@/stores/SearchFilterStore';
  import { type Mutable, type TranslatedObject } from '@/types.d';
  import { computed, reactive, ref, watch, watchEffect, type ComputedRef, type Reactive, type Ref } from 'vue';
  import { useI18n, type Composer } from 'vue-i18n';
  import { onBeforeRouteLeave, useRouter, type Router } from 'vue-router';
  import type { VDataTableServer } from 'vuetify/lib/components/index.mjs';

  const organisationStore: OrganisationStore = useOrganisationStore();
  const searchFilterStore: SearchFilterStore = useSearchFilterStore();
  const { t }: Composer = useI18n({ useScope: 'global' });

  const router: Router = useRouter();

  type TableHeaders = VDataTableServer['headers'];

  const defaultHeaders: TableHeaders = [
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
  ];
  // Define headers as a mutable array
  let headers: Ref<Mutable<TableHeaders>> = ref([...defaultHeaders]);

  const { hasAutoselectedSchule }: ReturnType<typeof useAutoselectedSchule> = useAutoselectedSchule([
    RollenSystemRecht.KlassenVerwalten,
  ]);

  const pageOffset: ComputedRef<number> = computed(
    () => (searchFilterStore.klassenPage - 1) * searchFilterStore.klassenPerPage,
  );

  const selectedSchule: Ref<string | undefined> = ref(searchFilterStore.selectedSchuleForKlassen || undefined);
  const klassenListFilter: ComputedRef<OrganisationenFilter> = computed(() => {
    const initialFilter: OrganisationenFilter = {
      includeTyp: OrganisationsTyp.Klasse,
      systemrechte: [RollenSystemRecht.KlassenVerwalten],
      offset: pageOffset.value,
      limit: searchFilterStore.klassenPerPage,
      organisationIds: searchFilterStore.selectedKlassenForKlassen || [],
    };
    if (selectedSchule.value) initialFilter.administriertVon = [selectedSchule.value];
    return initialFilter;
  });

  const searchInputKlassen: Ref<string> = ref('');
  const selectedKlassen: Ref<Array<string>> = ref(searchFilterStore.selectedKlassenForKlassen || []);
  let klassenAutocompleteDebounceTimer: ReturnType<typeof setTimeout> | undefined;
  const klassenAutocompleteFilter: Reactive<OrganisationenFilter> = reactive({
    offset: 0,
    limit: 200,
    organisationIds: searchFilterStore.selectedKlassenForKlassen || [],
    systemrechte: [RollenSystemRecht.KlassenVerwalten],
    searchString: '',
    administriertVon: searchFilterStore.selectedSchuleForKlassen
      ? [searchFilterStore.selectedSchuleForKlassen]
      : undefined,
  });

  const klassenOptions: ComputedRef<TranslatedObject[] | undefined> = computed(() => {
    return organisationStore.klassen.map((klasse: Organisation) => ({
      value: klasse.id,
      title: klasse.name,
    }));
  });

  const finalKlassen: ComputedRef<Organisation[]> = computed(() => {
    // If there are selected Klassen, filter the allKlassen to show only those
    if (selectedKlassen.value.length > 0) {
      return organisationStore.allKlassen.filter((klasse: Organisation) => selectedKlassen.value.includes(klasse.id));
    }

    // Otherwise, return allKlassen as is
    return organisationStore.allKlassen;
  });
  const totalKlassen: ComputedRef<number> = computed(() => organisationStore.totalKlassen);

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

  function getPaginatedKlassen(page: number): void {
    searchFilterStore.klassenPage = page;
  }

  function getPaginatedKlassenWithLimit(limit: number): void {
    /* reset page to 1 if entries are equal to or less than selected limit */
    if (organisationStore.totalOrganisationen <= limit) {
      searchFilterStore.klassenPage = 1;
    }
    searchFilterStore.klassenPerPage = limit;
  }

  // // Checks if the filter is active or not
  const filterActive: Ref<boolean> = computed(() => {
    if (hasAutoselectedSchule.value) {
      return selectedKlassen.value.length > 0;
    }
    return !!selectedSchule.value || selectedKlassen.value.length > 0;
  });

  // // Function to reset search and filter
  async function resetSearchAndFilter(): Promise<void> {
    // Clear search input for Klassen
    searchInputKlassen.value = '';
    // Clear selected Klassen
    selectedKlassen.value = [];
    // Clear the store
    searchFilterStore.setSchuleFilterForKlassen(null);
    searchFilterStore.setKlasseFilterForKlassen([]);
    searchFilterStore.klassenPage = 1;

    // If the user has an autoselected Schule, do not reset it
    if (!hasAutoselectedSchule.value) {
      selectedSchule.value = undefined;
    }
  }

  async function updateSchuleSelection(id: string | undefined): Promise<void> {
    if (selectedSchule.value == id) return;
    selectedSchule.value = id;
    await searchFilterStore.setSchuleFilterForKlassen(id ?? null);
    searchFilterStore.klassenPage = 1;
    if (id) {
      klassenAutocompleteFilter.administriertVon = [id];
    } else {
      await resetSearchAndFilter();
    }
  }

  async function updateKlassenSelection(ids: string[] | undefined): Promise<void> {
    await searchFilterStore.setKlasseFilterForKlassen(ids ?? null);
    klassenAutocompleteFilter.organisationIds = ids ?? [];
  }

  function clearKlasseSearchInput(focused: boolean): void {
    if (!focused) searchInputKlassen.value = '';
  }

  async function deleteKlasse(organisationId: string): Promise<void> {
    await organisationStore.deleteOrganisationById(organisationId);
  }

  const handleAlertClose = (): void => {
    organisationStore.errorCode = '';
    router.go(0);
  };

  function navigateToKlassenDetails(_$event: PointerEvent, { item }: { item: Organisation }): void {
    router.push({ name: 'klasse-details', params: { id: item.id } });
  }

  watch(
    hasAutoselectedSchule,
    () => {
      if (hasAutoselectedSchule.value) {
        headers.value = [...defaultHeaders];
      } else {
        headers.value = [
          {
            title: t('admin.schule.dienststellennummer'),
            key: 'schuleDetails',
            align: 'start',
            width: '350px',
          },
          ...defaultHeaders,
        ];
      }
    },
    { immediate: true },
  );

  function updateKlasseSearchstring(searchString: string): void {
    klassenAutocompleteFilter.searchString = searchString;
  }

  watch(searchInputKlassen, updateKlasseSearchstring);

  watchEffect(async () => {
    await organisationStore.getAllOrganisationen(klassenListFilter.value);
  });

  watch(
    klassenAutocompleteFilter,
    async (updatedFilter: OrganisationenFilter | undefined) => {
      if (!selectedSchule.value) return;
      const timeout: number = klassenAutocompleteDebounceTimer ? 500 : 0;
      if (klassenAutocompleteDebounceTimer) clearTimeout(klassenAutocompleteDebounceTimer);
      klassenAutocompleteDebounceTimer = setTimeout(async () => {
        await organisationStore.getKlassenByOrganisationId(updatedFilter);
      }, timeout);
    },
    {
      deep: true,
      immediate: true,
    },
  );

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
      {{ t('admin.headline') }}
    </h1>
    <LayoutCard :header="t('admin.klasse.management')">
      <!-- Error Message Display -->
      <SpshAlert
        :model-value="!!organisationStore.errorCode"
        :title="errorTitle"
        :type="'error'"
        :closable="false"
        :text="errorText"
        :showButton="true"
        :buttonText="t('nav.backToList')"
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
              {{ t('resetFilter') }}
            </v-btn>
          </v-col>
          <v-col
            md="3"
            cols="12"
            class="py-md-0"
          >
            <SchulenFilter
              :systemrechte-for-search="[RollenSystemRecht.KlassenVerwalten]"
              :multiple="false"
              :hideDetails="true"
              :highlightSelection="true"
              :selectedSchulen="selectedSchule"
              @update:selectedSchulen="updateSchuleSelection"
              :placeholderText="t('admin.schule.schule')"
              ref="schule-select"
            >
              <template v-slot:prepend-item>
                <v-list-item>
                  <v-progress-circular
                    indeterminate
                    v-if="organisationStore.schulenFilter.loading"
                  ></v-progress-circular>
                  <span
                    v-else
                    class="filter-header"
                    >{{
                      t(
                        'admin.schule.schulenFound',
                        { count: organisationStore.schulenFilter.total },
                        organisationStore.schulenFilter.total,
                      )
                    }}</span
                  >
                </v-list-item>
              </template>
            </SchulenFilter>
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
                    :no-data-text="t('noDataFound')"
                    :placeholder="t('admin.klasse.klassen')"
                    required="true"
                    variant="outlined"
                    v-model="selectedKlassen"
                    @update:model-value="updateKlassenSelection"
                    @update:focused="clearKlasseSearchInput"
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
                          >{{ t('admin.klasse.klassenFound', { count: totalKlassen }, totalKlassen) }}</span
                        >
                      </v-list-item>
                    </template>
                  </v-autocomplete>
                </div>
              </template>
              <span>{{ t('admin.schule.selectSchuleFirst') }}</span>
            </v-tooltip>
          </v-col>
        </v-row>
        <ResultTable
          :currentPage="searchFilterStore.klassenPage"
          data-testid="klasse-table"
          :header="t('admin.klasse.management')"
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
              :schulname="item.schuleDetails ?? ''"
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
