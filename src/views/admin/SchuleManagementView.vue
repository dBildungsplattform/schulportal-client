<script setup lang="ts">
  import { onMounted, type Ref, ref } from 'vue';
  import ResultTable from '@/components/admin/ResultTable.vue';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import { type Composer, useI18n } from 'vue-i18n';
  import type { VDataTableServer } from 'vuetify/lib/components/index.mjs';
  import { OrganisationsTyp, useOrganisationStore, type OrganisationStore } from '@/stores/OrganisationStore';

  const organisationStore: OrganisationStore = useOrganisationStore();

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

  const schulenPerPage: Ref<number> = ref(30);
  const schulenPage: Ref<number> = ref(1);

  function getPaginatedSchulen(page: number): void {
    schulenPage.value = page || 1;
    organisationStore.getAllOrganisationen({
      offset: (schulenPage.value - 1) * schulenPerPage.value,
      limit: schulenPerPage.value,
      includeTyp: OrganisationsTyp.Schule,
      systemrechte: ['SCHULEN_VERWALTEN'],
    });
  }

  function getPaginatedSchulenWithLimit(limit: number): void {
    /* reset page to 1 if entries are equal to or less than selected limit */
    if (organisationStore.totalOrganisationen <= limit) {
      schulenPage.value = 1;
    }

    schulenPerPage.value = limit || 1;
    organisationStore.getAllOrganisationen({
      offset: (schulenPage.value - 1) * schulenPerPage.value,
      limit: schulenPerPage.value,
      includeTyp: OrganisationsTyp.Schule,
      systemrechte: ['SCHULEN_VERWALTEN'],
    });
  }

  onMounted(async () => {
    await organisationStore.getAllOrganisationen({
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
        data-testid="schule-table"
        :items="organisationStore.allSchulen || []"
        :loading="organisationStore.loading"
        :headers="headers"
        item-value-path="id"
        :disableRowClick="true"
        @onItemsPerPageUpdate="getPaginatedSchulenWithLimit"
        @onPageUpdate="getPaginatedSchulen"
        :totalItems="organisationStore.totalSchulen"
        :itemsPerPage="schulenPerPage"
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
