<script setup lang="ts">
  import { computed, onMounted, ref, type ComputedRef, type Ref } from 'vue';
  import ResultTable from '@/components/admin/ResultTable.vue';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import { type Composer, useI18n } from 'vue-i18n';
  import type { VDataTableServer } from 'vuetify/lib/components/index.mjs';
  import { OrganisationsTyp, useOrganisationStore, type Organisation, type OrganisationStore } from '@/stores/OrganisationStore';
  import { type SearchFilterStore, useSearchFilterStore } from '@/stores/SearchFilterStore';
import type { TranslatedObject } from '@/types';

  const organisationStore: OrganisationStore = useOrganisationStore();
  const searchFilterStore: SearchFilterStore = useSearchFilterStore();

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

  const selectedSchulen: Ref<Array<string> | null> = ref(null);
  const searchInputSchulen: Ref<string> = ref('');

  const allSchulen: Ref<Array<Organisation>> = ref([]);

  const translatedSchulen: ComputedRef<TranslatedObject[] | undefined> = computed(() => {
    return allSchulen.value
      .map((org: Organisation) => ({
        value: org.id,
        title: `${org.kennung} (${org.name.trim()})`,
      }))
      .sort((a: TranslatedObject, b: TranslatedObject) => a.title.localeCompare(b.title));
  });

  async function fetchSchulen() {
    await organisationStore.getAllOrganisationen({
      offset: (searchFilterStore.schulenPage - 1) * searchFilterStore.schulenPerPage,
      limit: searchFilterStore.schulenPerPage,
      includeTyp: OrganisationsTyp.Schule,
      systemrechte: ['SCHULEN_VERWALTEN'],
      organisationIds: searchFilterStore.selectedSchulenForSchulen || undefined,
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

  async function updateSelectedSchulen(newValue: Array<string>): Promise<void> {
    if (newValue.length === 0) {
      await searchFilterStore.setSchuleFilterForSchulen(null);
      searchFilterStore.schulenPerPage = 30;
      fetchSchulen();
      return;
    }
    await searchFilterStore.setSchuleFilterForSchulen(newValue);
    searchFilterStore.schulenPerPage = newValue.length;
    fetchSchulen();
  }  

  onMounted(async () => {
    await fetchSchulen();
    allSchulen.value = organisationStore.allSchulen;
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
      <v-row
        align="center"
        class="ma-3"
        justify="end"
      >
        <v-col
          md="3"
          cols="12"
          class="py-md-0"
        >
          <v-autocomplete
            autocomplete="off"
            class="filter-dropdown"
            :class="{ selected: selectedSchulen }"
            clearable
            data-testid="schule-select"
            density="compact"
            hide-details
            id="schule-select"
            :items="translatedSchulen"
            item-value="value"
            item-text="title"
            multiple
            :no-data-text="$t('noDataFound')"
            :placeholder="$t('admin.schule.schule')"
            ref="schule-select"
            required="true"
            variant="outlined"
            @update:modelValue="updateSelectedSchulen"
            v-model="selectedSchulen"
            v-model:search="searchInputSchulen"
          >
            <template v-slot:prepend-item>
              <v-list-item>
                <v-progress-circular
                  indeterminate
                  v-if="organisationStore.loading"
                ></v-progress-circular>
                <span
                  v-else
                  class="filter-header"
                  >{{
                    $t(
                      'admin.schule.schulenFound',
                      { count: organisationStore.totalPaginatedSchulen },
                      organisationStore.totalPaginatedSchulen,
                    )
                  }}</span
                >
              </v-list-item>
            </template>
          </v-autocomplete>
        </v-col>
      </v-row>
      <ResultTable
        :currentPage="searchFilterStore.schulenPage"
        data-testid="schule-table"
        :disableRowClick="true"
        :items="organisationStore.allSchulen"
        :loading="organisationStore.loading"
        :headers="headers"
        item-value-path="id"
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
        </template></ResultTable
      >
    </LayoutCard>
  </div>
</template>

<style></style>
