<script setup lang="ts">
  import { computed, onMounted, ref, watch, type ComputedRef, type Ref } from 'vue';
  import ResultTable from '@/components/admin/ResultTable.vue';
  import { type Composer, useI18n } from 'vue-i18n';
  import type { VDataTableServer } from 'vuetify/lib/components/index.mjs';
  import {
    OrganisationsTyp,
    useOrganisationStore,
    type Organisation,
    type OrganisationStore,
  } from '@/stores/OrganisationStore';
  import LayoutCard from '@/components/cards/LayoutCard.vue';

  const organisationStore: OrganisationStore = useOrganisationStore();

  const { t }: Composer = useI18n({ useScope: 'global' });

  type ReadonlyHeaders = InstanceType<typeof VDataTableServer>['headers'];
  const headers: ReadonlyHeaders = [
    {
      title: t('admin.klasse.klasse'),
      key: 'name',
      align: 'start',
    },
  ];

  type TranslatedObject = {
    value: string;
    title: string;
  };

  const selectedSchule: Ref<string | null> = ref(null);
  const selectedKlassen: Ref<Array<string>> = ref([]);
  const finalKlassen: Ref<Array<Organisation> | undefined> = ref(undefined);

  const searchInputSchulen: Ref<string> = ref('');
  const searchInputKlassen: Ref<string> = ref('');

  const schulen: ComputedRef<TranslatedObject[] | undefined> = computed(() => {
    return organisationStore.allOrganisationen
      .slice(0, 25)
      .map((org: Organisation) => ({
        value: org.id,
        title: `${org.kennung} (${org.name})`,
      }))
      .sort((a: TranslatedObject, b: TranslatedObject) => a.title.localeCompare(b.title));
  });

  const klassen: ComputedRef<TranslatedObject[] | undefined> = computed(() => {
    return organisationStore.klassen
      .slice(0, 25)
      .map((org: Organisation) => ({
        value: org.id,
        title: org.name,
      }))
      .sort((a: TranslatedObject, b: TranslatedObject) => a.title.localeCompare(b.title));
  });

  // Watcher to detect when the Schule is selected so the Klasse show all the possible choices using that value.
  watch(selectedSchule, async (newValue: string | null, oldValue: string | null) => {
    if (newValue !== oldValue && newValue !== null) {
      organisationStore.getKlassenByOrganisationId(newValue);
      finalKlassen.value = await organisationStore.getAllOrganisationen({ administriertVon: [newValue] });
    } else if (!newValue) {
      finalKlassen.value = await organisationStore.getAllOrganisationen();
    }
  });
  // Watcher to detect when the search input for Schulen is triggered.
  watch(searchInputSchulen, async (newValue: string, _oldValue: string) => {
    if (newValue.length >= 3) {
      organisationStore.getAllOrganisationen({ searchString: newValue, includeTyp: OrganisationsTyp.Schule });
    } else {
      // If newValue has less than 3 characters, use an empty string instead of newValue to show all Schulen.
      organisationStore.getAllOrganisationen({ includeTyp: OrganisationsTyp.Schule });
    }
  });
  // Watcher to detect when the Klasse is selected
  watch(selectedKlassen, async (newValue: string[] | null, oldValue: string[] | null) => {
    if (newValue !== oldValue && newValue !== null) {
      finalKlassen.value = organisationStore.klassen.filter((klasse) => newValue.includes(klasse.id));
    } else {
      finalKlassen.value = await organisationStore.getAllOrganisationen();
    }
  });

  // Watcher to detect when the search input for Klassen is triggered.
  watch(searchInputKlassen, async (newValue: string, _oldValue: string) => {
    if (newValue.length >= 1 && selectedSchule.value !== null) {
      organisationStore.getKlassenByOrganisationId(selectedSchule.value, newValue);
    } else if (selectedSchule.value !== null) {
      organisationStore.getKlassenByOrganisationId(selectedSchule.value);
    }
  });

  const klassenForTable: ComputedRef<Organisation[] | undefined> = computed(() => {
    // filter the organisations to only include the ones from Typ "Klasse"
    return finalKlassen.value?.filter((organisation: Organisation) => organisation.typ === OrganisationsTyp.Klasse);
  });

  onMounted(async () => {
    finalKlassen.value = await organisationStore.getAllOrganisationen();
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
    <LayoutCard :header="$t('admin.klasse.management')">
      <v-row
        align="center"
        class="ma-3"
        justify="end"
      >
        <v-col
          cols="2"
          class="py-0"
        >
          <v-autocomplete
            autocomplete="off"
            chips
            class="filter-dropdown"
            :class="{ selected: selectedSchule }"
            clearable
            data-testid="schule-select"
            density="compact"
            hide-details
            id="schule-select"
            :items="schulen"
            item-value="value"
            item-text="title"
            :no-data-text="$t('noDataFound')"
            :placeholder="$t('admin.schule.schule')"
            required="true"
            variant="outlined"
            v-model="selectedSchule"
            v-model:search="searchInputSchulen"
          >
          </v-autocomplete>
        </v-col>
        <v-col
          cols="2"
          class="py-0"
        >
          <v-autocomplete
            autocomplete="off"
            chips
            class="filter-dropdown"
            :class="{ selected: selectedKlassen.length > 0 }"
            clearable
            data-testid="klasse-select"
            density="compact"
            hide-details
            id="klasse-select"
            :items="klassen"
            item-value="value"
            item-text="title"
            multiple
            :no-data-text="$t('noDataFound')"
            :placeholder="$t('admin.klasse.klasse')"
            required="true"
            variant="outlined"
            v-model="selectedKlassen"
            v-model:search="searchInputKlassen"
          >
          </v-autocomplete>
        </v-col>
      </v-row>
      <ResultTable
        data-testid="klasse-table"
        :header="$t('admin.klasse.management')"
        :items="klassenForTable || []"
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
