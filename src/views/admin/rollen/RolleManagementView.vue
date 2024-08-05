<script setup lang="ts">
  import { RollenMerkmal, useRolleStore, type RolleTableItem, type RolleResponse, type RolleStore } from '@/stores/RolleStore';
  import { computed, onMounted, type ComputedRef } from 'vue';
  import ResultTable from '@/components/admin/ResultTable.vue';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import { type Composer, useI18n } from 'vue-i18n';
  import type { VDataTableServer } from 'vuetify/lib/components/index.mjs';
  import { useOrganisationStore, type Organisation, type OrganisationStore } from '@/stores/OrganisationStore';
  import { useRouter, type Router } from 'vue-router';

  const rolleStore: RolleStore = useRolleStore();
  const organisationStore: OrganisationStore = useOrganisationStore();

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

  const transformedRollenAndMerkmale: ComputedRef<RolleTableItem[]> = computed(() => {
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

  function navigateToRolleDetails(_$event: PointerEvent, item: RolleTableItem ): void {
    router.push({ name: 'rolle-details', params: { id: item.id } });
  }

  onMounted(async () => {
    await rolleStore.getAllRollen('');
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
        :items="transformedRollenAndMerkmale || []"
        :loading="rolleStore.loading"
        :headers="headers"
        @onHandleRowClick="navigateToRolleDetails"
        @onUpdateTable="rolleStore.getAllRollen('')"
        :totalItems="rolleStore.allRollen.length"
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
