<script setup lang="ts">
  import { computed, watchEffect, type ComputedRef } from 'vue';
  import { useI18n, type Composer } from 'vue-i18n';

  import ResultTable, { type Headers } from '@/components/admin/ResultTable.vue';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import { useSearchFilterStore, type SearchFilterStore } from '@/stores/SearchFilterStore';
  import {
    useServiceProviderStore,
    type ManageableServiceProviderListEntry,
    type ServiceProviderStore,
  } from '@/stores/ServiceProviderStore';
  import { getDisplayNameForOrg } from '@/utils/formatting';

  type ServiceProviderRow = {
    id: string;
    kategorie: string;
    name: string;
    administrationsebene: string;
    rollen: string;
    hasRollenerweiterung: string;
  };

  const { t }: Composer = useI18n();
  const serviceProviderStore: ServiceProviderStore = useServiceProviderStore();
  const searchFilterStore: SearchFilterStore = useSearchFilterStore();

  const headers: Headers = [
    { title: t('angebot.kategorie'), key: 'kategorie', align: 'start' },
    { title: t('angebot.name'), key: 'name', align: 'start' },
    { title: t('angebot.administrationsebene'), key: 'administrationsebene', align: 'start' },
    { title: t('angebot.rollen'), key: 'rollen', align: 'start' },
    { title: t('angebot.schulspezifischErweitert'), key: 'hasRollenerweiterung', align: 'start' },
  ];
  const items: ComputedRef<ServiceProviderRow[]> = computed(() => {
    return serviceProviderStore.manageableServiceProviders.map((sp: ManageableServiceProviderListEntry) => {
      return {
        id: sp.id,
        kategorie: t(`angebot.kategorien.${sp.kategorie}`),
        name: sp.name,
        administrationsebene: getDisplayNameForOrg(sp.administrationsebene),
        rollen: sp.rollen.map((rolle: ManageableServiceProviderListEntry['rollen'][number]) => rolle.name).join(', '),
        hasRollenerweiterung: sp.hasRollenerweiterung ? t('yes') : t('no'),
      };
    });
  });

  watchEffect(async () => {
    await serviceProviderStore.getManageableServiceProviders(
      searchFilterStore.serviceProviderPage,
      searchFilterStore.serviceProviderPerPage,
    );
  });
</script>

<template>
  <h1
    class="text-center headline"
    data-testid="admin-headline"
  >
    {{ $t('admin.headline') }}
  </h1>
  <LayoutCard :header="t('admin.angebot.management.title')">
    <ResultTable
      :headers
      :items
      :itemsPerPage="searchFilterStore.serviceProviderPerPage"
      :currentPage="searchFilterStore.serviceProviderPage"
      :itemValuePath="'id'"
      :loading="serviceProviderStore.loading"
      :totalItems="serviceProviderStore.totalManageableServiceProviders"
      @onItemsPerPageUpdate="(val: number) => (searchFilterStore.serviceProviderPerPage = val)"
      @onPageUpdate="(val: number) => (searchFilterStore.serviceProviderPage = val)"
    >
      <template v-slot:[`item.rollen`]="{ item }">
        <div
          class="ellipsis-wrapper"
          :title="item.rollen"
        >
          {{ item.rollen }}
        </div>
      </template>
    </ResultTable>
  </LayoutCard>
</template>
