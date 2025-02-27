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
      title: t('admin.schultraeger.schultraegername'),
      key: 'name',
      align: 'start',
    },
    { title: t('admin.schule.schulen'), key: 'name', align: 'start' },
  ];

  const allSchulen: Ref<Array<Organisation>> = ref([]);

  async function fetchSchultraeger(): Promise<void> {
    await organisationStore.getAllOrganisationen({
      offset: (searchFilterStore.schulenPage - 1) * searchFilterStore.schulenPerPage,
      limit: searchFilterStore.schulenPerPage,
      includeTyp: OrganisationsTyp.Schultraeger,
      systemrechte: ['SCHULTRAEGER_VERWALTEN'],
      searchString: searchFilterStore.searchFilterSchulen || '',
    });
  }

  function getPaginatedSchultraeger(page: number): void {
    searchFilterStore.schulenPage = page;
    fetchSchultraeger();
  }

  function getPaginatedSchulenWithLimit(limit: number): void {
    /* reset page to 1 if entries are equal to or less than selected limit */
    if (organisationStore.totalOrganisationen <= limit) {
      searchFilterStore.schulenPage = 1;
    }

    searchFilterStore.schulenPerPage = limit;
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
          @onPageUpdate="getPaginatedSchultraeger"
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
