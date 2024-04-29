<script setup lang="ts">
  import { RollenMerkmal, useRolleStore, type RolleResponse, type RolleStore } from '@/stores/RolleStore';
  import { computed, onMounted, type ComputedRef } from 'vue';
  import ResultTable from '@/components/admin/ResultTable.vue';
  import { type Composer, useI18n } from 'vue-i18n';
  import type { VDataTableServer } from 'vuetify/lib/components/index.mjs';
  import { useOrganisationStore, type Organisation, type OrganisationStore } from '@/stores/OrganisationStore';
  import LayoutCard from '@/components/cards/LayoutCard.vue';

  const rolleStore: RolleStore = useRolleStore();
  const organisationStore: OrganisationStore = useOrganisationStore();

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

  onMounted(async () => {
    await rolleStore.getAllRollen();
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
    <LayoutCard :header="$t('admin.rolle.management')">
      <ResultTable
        data-testid="role-table"
        :header="$t('admin.rolle.management')"
        :items="transformedRollenAndMerkmale || []"
        :loading="rolleStore.loading"
        :headers="headers"
        @onUpdateTable="rolleStore.getAllRollen()"
        :totalItems="rolleStore.allRollen.length"
        item-value-path="id"
        :disableRowClick="true"
        :no-data-text="$t('noDataFound')"
      >
        <template v-slot:[`item.serviceProviders`]="{ item }">
          <span v-if="!item.serviceProviders.length">-</span>
          <span
            v-for="(serviceProvider, index) in item.serviceProviders"
            :key="serviceProvider.id"
          >
            {{ serviceProvider.name }}{{ index < item.serviceProviders.length - 1 ? ', ' : '' }}
          </span>
        </template>
      </ResultTable>
    </LayoutCard>
  </div>
</template>

<style></style>
