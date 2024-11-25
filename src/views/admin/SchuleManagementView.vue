<script setup lang="ts">
  import { onMounted, ref, type Ref } from 'vue';
  import ResultTable from '@/components/admin/ResultTable.vue';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import { type Composer, useI18n } from 'vue-i18n';
  import type { VDataTableServer } from 'vuetify/lib/components/index.mjs';
  import {
    OrganisationsTyp,
    useOrganisationStore,
    type Organisation,
    type OrganisationStore,
  } from '@/stores/OrganisationStore';
  import { type SearchFilterStore, useSearchFilterStore } from '@/stores/SearchFilterStore';
  import SearchField from '@/components/admin/SearchField.vue';

  const organisationStore: OrganisationStore = useOrganisationStore();
  const searchFilterStore: SearchFilterStore = useSearchFilterStore();

  const { t }: Composer = useI18n({ useScope: 'global' });

  type ReadonlyHeaders = InstanceType<typeof VDataTableServer>['headers'];
  const headers: ReadonlyHeaders = [
    {
      title: t('admin.schule.dienststellennummer'),
      key: 'kennung',
      align: 'start',
    },
    { title: t('admin.schule.schulname'), key: 'name', align: 'start' },
  ];

  const allSchulen: Ref<Array<Organisation>> = ref([]);
  const searchFilter: Ref<string> = ref('');

  async function fetchSchulen(): Promise<void> {
    await organisationStore.getAllOrganisationen({
      offset: (searchFilterStore.schulenPage - 1) * searchFilterStore.schulenPerPage,
      limit: searchFilterStore.schulenPerPage,
      includeTyp: OrganisationsTyp.Schule,
      systemrechte: ['SCHULEN_VERWALTEN'],
      searchString: searchFilterStore.searchFilter || '',
    });
  }

  function getPaginatedSchulen(page: number): void {
    searchFilterStore.schulenPage = page;
    fetchSchulen();
  }

  function getPaginatedSchulenWithLimit(limit: number): void {
    /* reset page to 1 if entries are equal to or less than selected limit */
    if (organisationStore.totalOrganisationen <= limit) {
      searchFilterStore.schulenPage = 1;
    }

    searchFilterStore.schulenPerPage = limit;
    fetchSchulen();
  }

  const handleSearchFilter = (filter: string): void => {
    searchFilter.value = filter;
    fetchSchulen();
  };

  onMounted(async () => {
    await fetchSchulen();
    allSchulen.value = organisationStore.allSchulen;
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
    <LayoutCard :header="$t('admin.schule.management')">
      <v-row
        align="center"
        class="ma-3"
        justify="end"
      >
        <SearchField
          :hover-text="$t('admin.schule.schulnameDienststellennummer')"
          @onApplySearchFilter="handleSearchFilter"
          ref="searchFieldComponent"
        ></SearchField>
      </v-row>
      <ResultTable
        :currentPage="searchFilterStore.schulenPage"
        data-testid="schule-table"
        :disableRowClick="true"
        :items="organisationStore.allSchulen"
        :loading="organisationStore.loading"
        :headers="headers"
        item-value-path="id"
        @onItemsPerPageUpdate="getPaginatedSchulenWithLimit"
        @onPageUpdate="getPaginatedSchulen"
        ref="result-table"
        :totalItems="organisationStore.totalSchulen"
        :itemsPerPage="searchFilterStore.schulenPerPage"
      >
        <template v-slot:[`item.name`]="{ item }">
          <div
            class="ellipsis-wrapper"
            :title="item.name"
          >
            {{ item.name }}
          </div>
        </template></ResultTable
      >
    </LayoutCard>
  </div>
</template>

<style></style>
