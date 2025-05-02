<script setup lang="ts">
  import KlasseDelete from '@/components/admin/klassen/KlasseDelete.vue';
  import ResultTable, { type TableRow } from '@/components/admin/ResultTable.vue';
  import SpshAlert from '@/components/alert/SpshAlert.vue';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import SchulenFilter from '@/components/filter/SchulenFilter.vue';
  import KlassenFilter from '@/components/filter/KlassenFilter.vue';
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
  import { computed, ref, watch, watchEffect, type ComputedRef, type Ref } from 'vue';
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

  const selectedKlassen: Ref<Array<string>> = ref(searchFilterStore.selectedKlassenForKlassen || []);



  const finalKlassen: ComputedRef<Organisation[]> = computed(() => {
    // If there are selected Klassen, filter the w to show only those
    if (selectedKlassen.value.length > 0) {
      return organisationStore.allKlassen.filter((klasse: Organisation) => selectedKlassen.value.includes(klasse.id));
    }

    // Otherwise, return allKlassen as is
    return organisationStore.allKlassen;
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
    if (!id) {
      await resetSearchAndFilter();
    }
  }

  async function updateKlassenSelection(ids: string[] | undefined): Promise<void> {
    selectedKlassen.value = ids ?? [];
    await searchFilterStore.setKlasseFilterForKlassen(ids ?? null);
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

  watchEffect(async () => {
    await organisationStore.getAllOrganisationen(klassenListFilter.value);
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
              <template v-slot:activator="">
                <KlassenFilter
                  :systemrechte-for-search="[RollenSystemRecht.KlassenVerwalten]"
                  :multiple="false"
                  :hideDetails="true"
                  :highlightSelection="true"
                  :selectedKlassen="selectedKlassen"
                  @update:selectedKlassen="updateKlassenSelection"
                  :placeholderText="t('admin.klasse.klassen')"
                  ref="klasse-select"
                  :administriertVon="selectedSchule ? [selectedSchule] : undefined"
                ></KlassenFilter>
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
