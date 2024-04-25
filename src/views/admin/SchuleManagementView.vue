<script setup lang="ts">
  import { computed, onMounted, type ComputedRef } from 'vue';
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

  const filteredOrganisationen: ComputedRef<Organisation[]> = computed(() => {
    // filter the organisations to only include the ones from Typ "Schule"
    return organisationStore.allOrganisationen.filter(
      (organisation: Organisation) => organisation.typ === OrganisationsTyp.Schule,
    );
  });

  onMounted(async () => {
    await organisationStore.getAllOrganisationen();
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
        :items="filteredOrganisationen || []"
        :loading="organisationStore.loading"
        :headers="headers"
        @onUpdateTable="organisationStore.getAllOrganisationen()"
        :totalItems="organisationStore.allOrganisationen.length"
        item-value-path="id"
        :disableRowClick="true"
      ></ResultTable>
    </LayoutCard>
  </div>
</template>

<style></style>
