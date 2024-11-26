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
  import ItsLearningSetup from '@/components/admin/schulen/itsLearningSetup.vue';
  import SpshAlert from '@/components/alert/SpshAlert.vue';
  import { onBeforeRouteLeave, useRouter, type Router } from 'vue-router';

  const organisationStore: OrganisationStore = useOrganisationStore();
  const searchFilterStore: SearchFilterStore = useSearchFilterStore();

  const router: Router = useRouter();

  const { t }: Composer = useI18n({ useScope: 'global' });

  type ReadonlyHeaders = InstanceType<typeof VDataTableServer>['headers'];
  const headers: ReadonlyHeaders = [
    {
      title: t('admin.schule.dienststellennummer'),
      key: 'kennung',
      align: 'start',
    },
    { title: t('admin.schule.schulname'), key: 'name', align: 'start' },
    { title: t('admin.schule.itsLearningStatus'), key: 'itslearning', sortable: false, align: 'start' },
  ];

  const allSchulen: Ref<Array<Organisation>> = ref([]);
  const searchFilter: Ref<string> = ref('');

  async function fetchSchulen(): Promise<void> {
    await organisationStore.getAllOrganisationen({
      offset: (searchFilterStore.schulenPage - 1) * searchFilterStore.schulenPerPage,
      limit: searchFilterStore.schulenPerPage,
      includeTyp: OrganisationsTyp.Schule,
      systemrechte: ['SCHULEN_VERWALTEN'],
      searchString: searchFilterStore.searchFilterPersonen || '',
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

  async function handleSearchFilter(filter: string): Promise<void> {
    await searchFilterStore.setSearchFilterForSchulen(filter);
    searchFilter.value = filter;
    fetchSchulen();
  }

  async function toggleItsLearningStatus(organisationId: string): Promise<void> {
    await organisationStore.setItsLearningForSchule(organisationId);
  }

  const handleAlertClose = (): void => {
    organisationStore.errorCode = '';
    router.go(0);
  };

  onMounted(async () => {
    await fetchSchulen();
    allSchulen.value = organisationStore.allSchulen;
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
      {{ $t('admin.headline') }}
    </h1>
    <LayoutCard :header="$t('admin.schule.management')">
      <!-- Error Message Display -->
      <SpshAlert
        :model-value="!!organisationStore.errorCode"
        :title="
          organisationStore.errorCode === 'UNSPECIFIED_ERROR'
            ? $t('admin.schule.loadingErrorTitle')
            : $t(`admin.schule.title.${organisationStore.errorCode}`)
        "
        :type="'error'"
        :closable="false"
        :text="
          organisationStore.errorCode === 'UNSPECIFIED_ERROR'
            ? $t('admin.schule.loadingErrorText')
            : $t(`admin.schule.errors.${organisationStore.errorCode}`)
        "
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
          <SearchField
            :hover-text="$t('admin.schule.schulnameDienststellennummer')"
            @onApplySearchFilter="handleSearchFilter"
            ref="searchFieldComponent"
          ></SearchField>
        </v-row>
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
              :schulId="item.id"
              :itslearningEnabled="item.itslearningEnabled || false"
              @onActivateItslearning="toggleItsLearningStatus(item.id)"
            ></ItsLearningSetup>
          </template>
        </ResultTable>
      </template>
    </LayoutCard>
  </div>
</template>

<style></style>
