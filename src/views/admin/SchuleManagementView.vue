<script setup lang="ts">
  import { onMounted } from 'vue';
  import ResultTable from '@/components/admin/ResultTable.vue';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import { type Composer, useI18n } from 'vue-i18n';
  import type { VDataTableServer } from 'vuetify/lib/components/index.mjs';
  import { OrganisationsTyp, useOrganisationStore, type OrganisationStore } from '@/stores/OrganisationStore';
  import { type SearchFilterStore, useSearchFilterStore } from '@/stores/SearchFilterStore';
  import ItsLearningSetup from '@/components/admin/schulen/itsLearningSetup.vue';

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
    { title: t('admin.schule.itsLearning'), key: 'itslearning', sortable: false, align: 'start' },
  ];

  function getPaginatedSchulen(page: number): void {
    searchFilterStore.schulenPage = page;
    organisationStore.getAllOrganisationen({
      offset: (searchFilterStore.schulenPage - 1) * searchFilterStore.schulenPerPage,
      limit: searchFilterStore.schulenPerPage,
      includeTyp: OrganisationsTyp.Schule,
      systemrechte: ['SCHULEN_VERWALTEN'],
    });
  }

  function getPaginatedSchulenWithLimit(limit: number): void {
    /* reset page to 1 if entries are equal to or less than selected limit */
    if (organisationStore.totalOrganisationen <= limit) {
      searchFilterStore.schulenPage = 1;
    }

    searchFilterStore.schulenPerPage = limit;
    organisationStore.getAllOrganisationen({
      offset: (searchFilterStore.schulenPage - 1) * searchFilterStore.schulenPerPage,
      limit: searchFilterStore.schulenPerPage,
      includeTyp: OrganisationsTyp.Schule,
      systemrechte: ['SCHULEN_VERWALTEN'],
    });
  }

  async function toggleItsLearningStatus(organisationId: string): Promise<void> {
    await organisationStore.setItsLearningForSchule(organisationId);
  }

  onMounted(async () => {
    await organisationStore.getAllOrganisationen({
      offset: (searchFilterStore.schulenPage - 1) * searchFilterStore.schulenPerPage,
      limit: searchFilterStore.schulenPerPage,
      includeTyp: OrganisationsTyp.Schule,
      systemrechte: ['SCHULEN_VERWALTEN'],
    });
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
      <ResultTable
        :currentPage="searchFilterStore.schulenPage"
        data-testid="schule-table"
        :items="organisationStore.allSchulen || []"
        :loading="organisationStore.loading"
        :headers="headers"
        item-value-path="id"
        :disableRowClick="true"
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
        </template>
        <template v-slot:[`item.itslearning`]="{ item }">
          <ItsLearningSetup
            :errorCode="organisationStore.errorCode"
            :schulname="item.name"
            :schuleId="item.id"
            :itslearningEnabled="item.itslearningEnabled"
            @onActivateItslearning="toggleItsLearningStatus(item.id)"
          ></ItsLearningSetup>
        </template>
      </ResultTable>
    </LayoutCard>
  </div>
</template>

<style></style>
