<script setup lang="ts">
  import KlasseDelete from '@/components/admin/klassen/KlasseDelete.vue';
  import ResultTable, { type TableRow } from '@/components/admin/ResultTable.vue';
  import SpshAlert from '@/components/alert/SpshAlert.vue';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import KlassenFilter from '@/components/filter/KlassenFilter.vue';
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
  import { type Mutable } from '@/types.d';
  import { OrganisationSortField, SortOrder } from '@/utils/sorting';
  import { computed, ref, watch, watchEffect, type ComputedRef, type Ref } from 'vue';
  import { useI18n, type Composer } from 'vue-i18n';
  import { onBeforeRouteLeave, useRouter, type Router } from 'vue-router';
  import type { VDataTableServer } from 'vuetify/lib/components/index.mjs';

  const organisationStore: OrganisationStore = useOrganisationStore();
  const searchFilterStore: SearchFilterStore = useSearchFilterStore();
  const { t }: Composer = useI18n({ useScope: 'global' });

  const router: Router = useRouter();

  type TableHeaders = VDataTableServer['headers'];

  const klasseColumnKey: string = 'name';

  const defaultHeaders: TableHeaders = [
    {
      title: t('admin.klasse.klasse'),
      key: klasseColumnKey,
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
  const hasSelectedSchule: ComputedRef<boolean> = computed(
    () => (selectedSchule.value !== undefined && selectedSchule.value !== '') || hasAutoselectedSchule.value,
  );
  const selectedKlassen: Ref<Array<string>> = ref(searchFilterStore.selectedKlassenForKlassen || []);
  const klassenListFilter: ComputedRef<OrganisationenFilter> = computed(() => {
    const initialFilter: OrganisationenFilter = {
      includeTyp: OrganisationsTyp.Klasse,
      systemrechte: [RollenSystemRecht.KlassenVerwalten],
      offset: pageOffset.value,
      limit: searchFilterStore.klassenPerPage,
      organisationIds: selectedKlassen.value,
      sortField: searchFilterStore.organisationenSortField ?? undefined,
      sortOrder: searchFilterStore.organisationenSortOrder ?? undefined,
    };
    if (selectedSchule.value) initialFilter.administriertVon = [selectedSchule.value];
    return initialFilter;
  });
  const administriertVonForKlassenFilter: Ref<Array<string>> = ref([]);

  const finalKlassen: ComputedRef<Organisation[]> = computed(() => {
    // If there are selected Klassen, filter allKlassen to show only those that are selected
    if (selectedKlassen.value.length > 0) {
      return organisationStore.allKlassen.filter((klasse: Organisation) => selectedKlassen.value.includes(klasse.id));
    }

    // Otherwise, return allKlassen as is
    return organisationStore.allKlassen;
  });

  // Used for to show the number of klassen found in the filter. It uses the store key 'klassen-management' to get the total count of this specific view.
  const totalKlassen: ComputedRef<number> = computed(
    () => organisationStore.klassenFilters.get('klassen-management')?.total ?? 0,
  );

  // Used for the total count of Klassen in the table
  const totalKlassenCount: ComputedRef<number> = computed(() => {
    if (selectedKlassen.value.length > 0) {
      return finalKlassen.value.length;
    }
    return organisationStore.totalKlassen;
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

  function setKlassenPage(page: number): void {
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
    // Clear selected Klassen
    selectedKlassen.value = [];
    // Clear the store
    searchFilterStore.setSchuleFilterForKlassen(null);
    searchFilterStore.setKlasseFilterForKlassen([]);
    searchFilterStore.klassenPage = 1;
    searchFilterStore.organisationenSortField = null;
    searchFilterStore.organisationenSortOrder = null;

    // If the user has an autoselected Schule, do not reset it
    if (!hasAutoselectedSchule.value) {
      selectedSchule.value = undefined;
    }
  }

  async function updateSchuleSelection(id: string | undefined): Promise<void> {
    if (selectedSchule.value == id) return;
    selectedSchule.value = id;
    searchFilterStore.setSchuleFilterForKlassen(id ?? null);
    searchFilterStore.klassenPage = 1;
    if (!id) {
      await resetSearchAndFilter();
    }
  }

  async function updateKlassenSelection(ids: string[] | undefined): Promise<void> {
    selectedKlassen.value = ids ?? [];
    searchFilterStore.setKlasseFilterForKlassen(ids ?? null);
  }

  async function reloadData(filter: OrganisationenFilter): Promise<void> {
    await organisationStore.getAllOrganisationen(filter);
  }

  async function deleteKlasse(organisationId: string): Promise<void> {
    await organisationStore.deleteOrganisationById(organisationId);
  }

  const handleAlertClose = async (): Promise<void> => {
    organisationStore.errorCode = '';
    await reloadData(klassenListFilter.value);
  };

  const handleKlasseDeleteClose = async (): Promise<void> => {
    await reloadData(klassenListFilter.value);
  };

  function navigateToKlassenDetails(_$event: PointerEvent, { item }: { item: Organisation }): void {
    router.push({ name: 'klasse-details', params: { id: item.id } });
  }

  async function handleTableSorting(update: {
    sortField: string | undefined;
    sortOrder: 'asc' | 'desc';
  }): Promise<void> {
    if (update.sortField && Object.values(OrganisationSortField).includes(update.sortField as OrganisationSortField)) {
      searchFilterStore.organisationenSortField = update.sortField as OrganisationSortField;
      searchFilterStore.organisationenSortOrder = update.sortOrder as SortOrder;
    }
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
            sortable: false,
            width: '350px',
          },
          ...defaultHeaders,
        ];
      }
    },
    { immediate: true },
  );

  watch(selectedSchule, (newValue: string | undefined) => {
    administriertVonForKlassenFilter.value.shift();
    if (newValue) {
      administriertVonForKlassenFilter.value.push(newValue);
    }
  });

  watchEffect(async () => {
    await reloadData(klassenListFilter.value);
  });

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
    <LayoutCard
      :header="t('admin.klasse.management')"
      headlineTestId="klasse-management-headline"
    >
      <!-- Error Message Display -->
      <SpshAlert
        :buttonAction="handleAlertClose"
        :buttonText="t('nav.backToList')"
        :closable="false"
        dataTestIdPrefix="klasse-management-error"
        :modelValue="!!organisationStore.errorCode"
        :showButton="true"
        :text="errorText"
        :title="errorTitle"
        :type="'error'"
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
              parentId="klassen-management"
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
                    v-if="organisationStore.organisationenFilters.get('klassen-management')?.loading"
                  ></v-progress-circular>
                  <span
                    v-else
                    class="filter-header"
                    >{{
                      t(
                        'admin.schule.schulenFound',
                        { count: organisationStore.organisationenFilters.get('klassen-management')?.total },
                        organisationStore.organisationenFilters.get('klassen-management')?.total ?? 0,
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
              :disabled="hasSelectedSchule"
              location="top"
            >
              <template v-slot:activator="{ props }">
                <div v-bind="props">
                  <KlassenFilter
                    parentId="klassen-management"
                    :systemrechteForSearch="[RollenSystemRecht.KlassenVerwalten]"
                    :multiple="true"
                    :readonly="!hasSelectedSchule"
                    :hideDetails="true"
                    :highlightSelection="true"
                    :selectedKlassen="selectedKlassen"
                    :totalKlassen="totalKlassen"
                    @update:selectedKlassen="updateKlassenSelection"
                    :placeholderText="t('admin.klasse.klassen')"
                    ref="klasse-select"
                    :administriertVon="administriertVonForKlassenFilter"
                  >
                    <template v-slot:prepend-item>
                      <v-list-item>
                        <v-progress-circular
                          data-testid="klassen-filter-progress"
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
              <span>{{ t('admin.schule.selectSchuleFirst') }}</span>
            </v-tooltip>
          </v-col>
        </v-row>
        <ResultTable
          ref="resultTable"
          :currentPage="searchFilterStore.klassenPage"
          data-testid="klasse-table"
          :header="t('admin.klasse.management')"
          :items="finalKlassen || []"
          :loading="organisationStore.loading"
          :headers="headers"
          :currentSort="{
            key: searchFilterStore.organisationenSortField ?? klasseColumnKey,
            order: searchFilterStore.organisationenSortOrder ?? SortOrder.Asc,
          }"
          @onHandleRowClick="
            (event: PointerEvent, item: TableRow<unknown>) =>
              navigateToKlassenDetails(event, item as TableRow<Organisation>)
          "
          @onItemsPerPageUpdate="getPaginatedKlassenWithLimit"
          @onPageUpdate="setKlassenPage"
          @onTableUpdate="handleTableSorting"
          :totalItems="totalKlassenCount"
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
              :klassenname="item.name"
              :klassenId="item.id"
              :schulname="item.schuleDetails ?? ''"
              :errorCode="organisationStore.errorCode"
              :useIconActivator="true"
              :isLoading="organisationStore.loading"
              @onDeleteKlasse="deleteKlasse(item.id)"
              @onClose="handleKlasseDeleteClose"
            ></KlasseDelete>
          </template>
        </ResultTable>
      </template>
    </LayoutCard>
  </div>
</template>
