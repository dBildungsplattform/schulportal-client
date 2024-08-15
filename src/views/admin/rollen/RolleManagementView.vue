<script setup lang="ts">
  import { RollenMerkmal, useRolleStore, type Rolle, type RolleResponse, type RolleStore } from '@/stores/RolleStore';
  import { computed, onMounted, type ComputedRef } from 'vue';
  import ResultTable from '@/components/admin/ResultTable.vue';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import { type Composer, useI18n } from 'vue-i18n';
  import type { VDataTableServer } from 'vuetify/lib/components/index.mjs';
  import { useOrganisationStore, type Organisation, type OrganisationStore } from '@/stores/OrganisationStore';
  import { useRouter, type Router } from 'vue-router';
  import { useSearchFilterStore, type SearchFilterStore } from '@/stores/SearchFilterStore';

  const rolleStore: RolleStore = useRolleStore();
  const organisationStore: OrganisationStore = useOrganisationStore();
  const searchFilterStore: SearchFilterStore = useSearchFilterStore();

  const router: Router = useRouter();
  const { t }: Composer = useI18n({ useScope: 'global' });

  type ReadonlyHeaders = InstanceType<typeof VDataTableServer>['headers'];
  const headers: ReadonlyHeaders = [
    { title: t('admin.rolle.rollenname'), key: 'name', align: 'start' },
    { title: t('admin.rolle.rollenart'), key: 'rollenart', align: 'start' },
    { title: t('admin.rolle.merkmale'), key: 'merkmale', align: 'start' },
    { title: t('admin.serviceProvider.serviceProvider'), key: 'serviceProviders', align: 'start' },
    {
      title: t('admin.administrationsebene.administrationsebene'),
      key: 'administeredBySchulstrukturknoten',
      align: 'start',
    },
  ];

  const transformedRollenAndMerkmale: ComputedRef<
    {
      rollenart: string;
      merkmale: string;
      id: string;
      createdAt: string;
      updatedAt: string;
      name: string;
      administeredBySchulstrukturknoten: string;
    }[]
  > = computed(() => {
    return rolleStore.allRollen.map((rolle: RolleResponse) => {
      // Find the organization that matches the rolle.administeredBySchulstrukturknoten
      const matchingOrganisation: Organisation | undefined = organisationStore.allOrganisationen.find(
        (organisation: Organisation) => organisation.id === rolle.administeredBySchulstrukturknoten,
      );

      // If a matching organization is found, format the administeredBySchulstrukturknoten field accordingly
      let administeredBySchulstrukturknoten: string = '';
      if (matchingOrganisation) {
        administeredBySchulstrukturknoten = matchingOrganisation.kennung
          ? `${matchingOrganisation.kennung} (${matchingOrganisation.name})`
          : matchingOrganisation.name;
      }

      const formattedMerkmale: string =
        Array.from(rolle.merkmale).length > 0
          ? Array.from(rolle.merkmale)
              .map((merkmal: RollenMerkmal) => t(`admin.rolle.mappingFrontBackEnd.merkmale.${merkmal}`))
              .join(', ')
          : '---'; // Return dash if merkmale is empty or not defined

      return {
        ...rolle,
        rollenart: t(`admin.rolle.mappingFrontBackEnd.rollenarten.${rolle.rollenart}`),
        merkmale: formattedMerkmale,
        administeredBySchulstrukturknoten,
      };
    });
  });

  function navigateToRolleDetails(_$event: PointerEvent, { item }: { item: Rolle }): void {
    router.push({ name: 'rolle-details', params: { id: item.id } });
  }

  function getPaginatedRollen(page: number): void {
    searchFilterStore.rollenPage = page;
    rolleStore.getAllRollen({
      offset: (searchFilterStore.rollenPage - 1) * searchFilterStore.rollenPerPage,
      limit: searchFilterStore.rollenPerPage,
      searchString: '',
    });
  }

  function getPaginatedRollenWithLimit(limit: number): void {
    /* reset page to 1 if entries are equal to or less than selected limit */
    if (rolleStore.totalRollen <= limit) {
      searchFilterStore.rollenPage = 1;
    }

    searchFilterStore.rollenPerPage = limit;
    rolleStore.getAllRollen({
      offset: (searchFilterStore.rollenPage - 1) * searchFilterStore.rollenPerPage,
      limit: searchFilterStore.rollenPerPage,
      searchString: '',
    });
  }

  onMounted(async () => {
    await organisationStore.getAllOrganisationen();
    await rolleStore.getAllRollen({
      offset: (searchFilterStore.rollenPage - 1) * searchFilterStore.rollenPerPage,
      limit: searchFilterStore.rollenPerPage,
      searchString: '',
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
    <LayoutCard :header="$t('admin.rolle.management')">
      <ResultTable
        :currentPage="searchFilterStore.rollenPage"
        data-testid="rolle-table"
        :items="transformedRollenAndMerkmale || []"
        :itemsPerPage="searchFilterStore.rollenPerPage"
        :loading="rolleStore.loading"
        :headers="headers"
        @onHandleRowClick="navigateToRolleDetails"
        @onItemsPerPageUpdate="getPaginatedRollenWithLimit"
        @onPageUpdate="getPaginatedRollen"
        :totalItems="rolleStore.totalRollen"
        item-value-path="id"
      >
        <template v-slot:[`item.serviceProviders`]="{ item }">
          <div class="ellipsis-wrapper">
            <span
              v-if="!item.serviceProviders.length"
              title="---"
              >---</span
            >
            <span :title="item.serviceProviders.map((provider: any) => provider.name).join(', ')">
              <span
                v-for="(serviceProvider, index) in item.serviceProviders"
                :key="serviceProvider.id"
              >
                {{ serviceProvider.name }}{{ index < item.serviceProviders.length - 1 ? ', ' : '' }}
              </span>
            </span>
          </div>
        </template>
      </ResultTable>
    </LayoutCard>
  </div>
</template>

<style></style>
