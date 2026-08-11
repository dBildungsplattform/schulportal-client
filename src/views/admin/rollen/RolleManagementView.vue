<script setup lang="ts">
  import ResultTable, { type Headers, type TableRow } from '@/components/admin/ResultTable.vue';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import SchulenFilter from '@/components/filter/SchulenFilter.vue';
  import {
    RollenArt,
    RollenMerkmal,
    RollenSystemRecht,
    RolleStore,
    useRolleStore,
    type RolleResponse,
    type RolleTableItem,
  } from '@/stores/RolleStore';
  import { rollenPerPageDefault, useSearchFilterStore, type SearchFilterStore } from '@/stores/SearchFilterStore';
  import { computed, onMounted, type ComputedRef } from 'vue';
  import { useI18n, type Composer } from 'vue-i18n';
  import { useRouter, type Router } from 'vue-router';

  const rolleStore: RolleStore = useRolleStore();
  const searchFilterStore: SearchFilterStore = useSearchFilterStore();

  const router: Router = useRouter();
  const { t }: Composer = useI18n({ useScope: 'global' });

  type MerkmalItem = { title: string; value: RollenMerkmal };
  const allMerkmale: readonly MerkmalItem[] = Object.values(RollenMerkmal).map(
    (merkmal: RollenMerkmal): MerkmalItem => ({
      title: t(`admin.rolle.mappingFrontBackEnd.merkmale.${merkmal}`),
      value: merkmal,
    }),
  );

  type RollenartItem = { title: string; value: RollenArt };
  const allRollenarten: readonly RollenartItem[] = Object.values(RollenArt).map(
    (rollenart: RollenArt): RollenartItem => ({
      title: t(`admin.rolle.mappingFrontBackEnd.rollenarten.${rollenart}`),
      value: rollenart,
    }),
  );

  type ReadonlyHeaders = Headers;
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
      // If the name administeredBySchulstrukturknoten exists, format the administeredBySchulstrukturknoten field accordingly
      let administeredBySchulstrukturknoten: string = '';
      if (rolle.administeredBySchulstrukturknotenName) {
        administeredBySchulstrukturknoten = rolle.administeredBySchulstrukturknotenKennung
          ? `${rolle.administeredBySchulstrukturknotenKennung} (${rolle.administeredBySchulstrukturknotenName})`
          : rolle.administeredBySchulstrukturknotenName;
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

  const isFilterActive: ComputedRef<boolean> = computed(() => {
    return (
      searchFilterStore.selectedMerkmaleForRollen?.length > 0 ||
      searchFilterStore.selectedRollenartenForRollen?.length > 0 ||
      searchFilterStore.selectedOrganisationenForRollen?.length > 0
    );
  });

  function navigateToRolleDetails(_$event: PointerEvent, { item }: { item: RolleTableItem }): void {
    router.push({ name: 'rolle-details', params: { id: item.id } });
  }

  async function getRollen(): Promise<void> {
    await rolleStore.getAllRollen({
      offset: (searchFilterStore.rollenPage - 1) * searchFilterStore.rollenPerPage,
      limit: searchFilterStore.rollenPerPage,
      searchString: '',
      organisationenForFilter: searchFilterStore.selectedOrganisationenForRollen?.length
        ? searchFilterStore.selectedOrganisationenForRollen
        : undefined,
      merkmale: searchFilterStore.selectedMerkmaleForRollen?.length
        ? searchFilterStore.selectedMerkmaleForRollen
        : undefined,
      rollenarten: searchFilterStore.selectedRollenartenForRollen?.length
        ? searchFilterStore.selectedRollenartenForRollen
        : undefined,
    });
  }

  async function getPaginatedRollen(page: number): Promise<void> {
    searchFilterStore.rollenPage = page;
    await getRollen();
  }

  async function setMerkmaleFilter(merkmale: RollenMerkmal[]): Promise<void> {
    searchFilterStore.setMerkmaleFilterForRollen(merkmale);
    searchFilterStore.rollenPage = 1;
    await getRollen();
  }

  async function setRollenartenFilter(rollenarten: RollenArt[]): Promise<void> {
    searchFilterStore.setRollenartenFilterForRollen(rollenarten);
    searchFilterStore.rollenPage = 1;
    await getRollen();
  }

  async function setOrganisationenFilter(organisationen: string[]): Promise<void> {
    searchFilterStore.setOrganisationenFilterForRollen(organisationen ?? []);
    searchFilterStore.rollenPage = 1;
    await getRollen();
  }

  async function getPaginatedRollenWithLimit(limit: number): Promise<void> {
    /* reset page to 1 if entries are equal to or less than selected limit */
    if (rolleStore.totalRollen <= limit) {
      searchFilterStore.rollenPage = 1;
    }

    searchFilterStore.rollenPerPage = limit;
    await getRollen();
  }

  async function resetFilter(): Promise<void> {
    searchFilterStore.setMerkmaleFilterForRollen([]);
    searchFilterStore.setRollenartenFilterForRollen([]);
    searchFilterStore.setOrganisationenFilterForRollen([]);
    searchFilterStore.rollenPage = 1;
    searchFilterStore.rollenPerPage = rollenPerPageDefault;
    await getRollen();
  }

  onMounted(async () => {
    await getRollen();
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
    <LayoutCard
      :header="$t('admin.rolle.management')"
      headlineTestId="rolle-management-headline"
    >
      <v-row class="ma-3 align-start">
        <v-col
          cols="12"
          md="2"
          class="py-md-0 text-md-right align-self-center"
        >
          <v-btn
            class="px-0 reset-filter"
            data-testid="reset-filter-button"
            :disabled="!isFilterActive"
            size="x-small"
            variant="text"
            width="auto"
            @click="resetFilter()"
          >
            {{ $t('resetFilter') }}
          </v-btn>
        </v-col>

        <v-col
          cols="12"
          md="3"
        >
          <SchulenFilter
            multiple
            includeAll
            highlightSelection
            parentId="rolle-management"
            :selectedSchulen="searchFilterStore.selectedOrganisationenForRollen"
            :placeholderText="$t('admin.administrationsebene.administrationsebene')"
            :systemrechteForSearch="[RollenSystemRecht.RollenVerwalten]"
            selectionCountKey="admin.rolle.administrationsebenenSelected"
            hideDetails
            @update:selectedSchulen="setOrganisationenFilter"
          />
        </v-col>

        <v-col
          cols="12"
          md="3"
        >
          <v-autocomplete
            id="rollenarten-filter-select"
            v-model="searchFilterStore.selectedRollenartenForRollen"
            clearable
            class="filter-dropdown"
            :class="{ selected: searchFilterStore.selectedRollenartenForRollen?.length }"
            data-testid="rollenarten-filter-select"
            density="compact"
            hide-details
            :items="allRollenarten"
            item-value="value"
            item-title="title"
            multiple
            :no-data-text="$t('noDataFound')"
            :placeholder="$t('admin.rolle.rollenart')"
            variant="outlined"
            @update:model-value="setRollenartenFilter"
          >
            <template #selection="{ internalItem: item, index }">
              <v-chip v-if="searchFilterStore.selectedRollenartenForRollen.length < 2">
                <span>{{ item.title }}</span>
              </v-chip>
              <span
                v-else-if="index === 0"
                class="selection-count"
              >
                {{
                  $t('admin.rolle.rollenartenSelected', {
                    count: searchFilterStore.selectedRollenartenForRollen.length,
                  })
                }}
              </span>
            </template>
          </v-autocomplete>
        </v-col>

        <v-col
          cols="12"
          md="3"
        >
          <v-autocomplete
            id="merkmale-filter-select"
            v-model="searchFilterStore.selectedMerkmaleForRollen"
            clearable
            class="filter-dropdown"
            :class="{ selected: searchFilterStore.selectedMerkmaleForRollen?.length }"
            data-testid="merkmale-filter-select"
            density="compact"
            hide-details
            :items="allMerkmale"
            item-value="value"
            item-title="title"
            multiple
            :no-data-text="$t('noDataFound')"
            :placeholder="$t('admin.rolle.merkmale')"
            variant="outlined"
            @update:model-value="setMerkmaleFilter"
          >
            <template #selection="{ internalItem: item, index }">
              <v-chip v-if="searchFilterStore.selectedMerkmaleForRollen.length < 2">
                <span>{{ item.title }}</span>
              </v-chip>
              <span
                v-else-if="index === 0"
                class="selection-count"
              >
                {{
                  $t('admin.rolle.merkmaleSelected', {
                    count: searchFilterStore.selectedMerkmaleForRollen.length,
                  })
                }}
              </span>
            </template>
          </v-autocomplete>
        </v-col>
      </v-row>
      <ResultTable
        :current-page="searchFilterStore.rollenPage"
        data-testid="rolle-table"
        :items="transformedRollenAndMerkmale || []"
        :items-per-page="searchFilterStore.rollenPerPage"
        :loading="rolleStore.loading"
        :headers="headers"
        :total-items="rolleStore.totalRollen"
        item-value-path="id"
        @on-handle-row-click="
          (event: PointerEvent, item: TableRow<unknown>) =>
            navigateToRolleDetails(event, item as TableRow<RolleTableItem>)
        "
        @on-items-per-page-update="getPaginatedRollenWithLimit"
        @on-page-update="getPaginatedRollen"
      >
        <template #[`item.serviceProviders`]="{ item }">
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
                {{ serviceProvider.name }}{{ Number(index) < item.serviceProviders.length - 1 ? ', ' : '' }}
              </span>
            </span>
          </div>
        </template>
      </ResultTable>
    </LayoutCard>
  </div>
</template>

<style scoped>
  .selection-count {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
</style>
