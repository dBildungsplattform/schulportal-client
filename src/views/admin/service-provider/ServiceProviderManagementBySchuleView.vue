<script setup lang="ts">
  import { computed, onMounted, ref, watch, watchEffect, type ComputedRef, type Ref } from 'vue';
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
  import SchulenFilter from '@/components/filter/SchulenFilter.vue';
  import { useOrganisationStore, type OrganisationStore } from '@/stores/OrganisationStore';
  import { RollenSystemRecht } from '@/stores/RolleStore';
  import { onBeforeRouteLeave } from 'vue-router';
  import { SortOrder } from '@/utils/sorting';

  type ServiceProviderRow = {
    id: string;
    kategorie: string;
    name: string;
    administrationsebene: string;
    rollen: string;
  };

  const selectedOrganisationId: Ref<string> = ref('');

  const { t }: Composer = useI18n();

  const serviceProviderStore: ServiceProviderStore = useServiceProviderStore();
  const searchFilterStore: SearchFilterStore = useSearchFilterStore();
  const organisationStore: OrganisationStore = useOrganisationStore();

  const headers: Headers = [
    { title: t('angebot.kategorie'), key: 'kategorie', align: 'start' },
    { title: t('angebot.name'), key: 'name', align: 'start' },
    { title: t('angebot.providedBy'), key: 'administrationsebene', align: 'start' },
    { title: t('angebot.erweiterteRollenAnDerSchule'), key: 'rollen', align: 'start' },
  ];

  const items: ComputedRef<ServiceProviderRow[]> = computed(() => {
    return serviceProviderStore.manageableServiceProvidersForOrganisation.map(
      (sp: ManageableServiceProviderListEntry) => {
        return {
          id: sp.id,
          kategorie: t(`angebot.kategorien.${sp.kategorie}`),
          name: sp.name,
          administrationsebene: getDisplayNameForOrg(sp.administrationsebene),
          rollen: sp.rollen.map((rolle: ManageableServiceProviderListEntry['rollen'][number]) => rolle.name).join(', '),
        };
      },
    );
  });

  function resetSearchAndFilter(): void {
    selectedOrganisationId.value = '';
    serviceProviderStore.manageableServiceProvidersForOrganisation = [];
    organisationStore.currentOrganisation = null;
  }

  function setOrganisationFilter(newValue: string | undefined): void {
    selectedOrganisationId.value = newValue ?? '';
    searchFilterStore.setSchuleForSchulischeServiceProvider(newValue ?? null);
  }

  watchEffect(async () => {
    if (selectedOrganisationId.value) {
      await serviceProviderStore.getManageableServiceProvidersForOrganisation(
        selectedOrganisationId.value,
        searchFilterStore.serviceProviderPage,
        searchFilterStore.serviceProviderPerPage,
      );
    }
  });

  watch(
    () => [selectedOrganisationId.value],
    async () => {
      if (selectedOrganisationId.value) {
        await organisationStore.getOrganisationById(selectedOrganisationId.value);
      }
    },
  );

  onBeforeRouteLeave(() => {
    organisationStore.errorCode = '';
  });

  onMounted(() => {
    if (searchFilterStore.selectedSchuleForSchulischeServiceProvider) {
      selectedOrganisationId.value = searchFilterStore.selectedSchuleForSchulischeServiceProvider;
    }
  });
</script>

<template>
  <h1
    class="text-center headline"
    data-testid="admin-headline"
  >
    {{ $t('admin.headline') }}
  </h1>
  <LayoutCard
    :header="`${t('admin.angebot.management.title')} ${organisationStore.currentOrganisation?.name ?? ''}`"
    :header-hover-text="organisationStore.currentOrganisation?.name"
  >
    <v-row
      align="start"
      class="ma-3"
    >
      <v-col
        align-self="center"
        cols="12"
        md="2"
        class="py-md-0 text-md-right"
      >
        <v-btn
          class="px-0 reset-filter"
          data-testid="reset-filter-button"
          :disabled="!selectedOrganisationId"
          size="x-small"
          variant="text"
          width="auto"
          @click="resetSearchAndFilter()"
        >
          {{ $t('resetFilter') }}
        </v-btn>
      </v-col>
      <v-col
        cols="12"
        md="3"
        class="py-md-0"
      >
        <SchulenFilter
          :multiple="false"
          includeAll
          highlightSelection
          parentId="person-management"
          ref="schulenFilter"
          :systemrechteForSearch="[RollenSystemRecht.PersonenVerwalten]"
          :selectedSchulen="selectedOrganisationId ? [selectedOrganisationId] : []"
          @update:selectedSchulen="setOrganisationFilter"
          :placeholderText="$t('admin.schule.schule')"
          hideDetails
        >
          <template #prepend-item>
            <v-list-item>
              <v-progress-circular
                v-if="organisationStore.loading"
                indeterminate
              />
              <span
                v-else
                class="filter-header"
                >{{
                  $t(
                    'admin.schule.schulenFound',
                    { count: organisationStore.organisationenFilters.get('person-management')?.total },
                    organisationStore.organisationenFilters.get('person-management')?.total ?? 0,
                  )
                }}</span
              >
            </v-list-item>
          </template>
        </SchulenFilter>
      </v-col>
    </v-row>
    <ResultTable
      :headers
      :current-sort="{
        key: 'kategorie',
        order: SortOrder.Asc,
      }"
      :items
      :itemsPerPage="searchFilterStore.serviceProviderPerPage"
      :currentPage="searchFilterStore.serviceProviderPage"
      :itemValuePath="'id'"
      :loading="serviceProviderStore.loading"
      :totalItems="serviceProviderStore.totalManageableServiceProviders"
      :no-data-text="$t('angebot.noServiceProvidersAvailable')"
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
