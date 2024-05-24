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
  const finalKlassen: Ref<Array<Organisation>> = ref([]);
  const klassenOptions: Ref<TranslatedObject[] | undefined> = ref([]);

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

  // Watcher to update Klassen and options when Schule is selected or unselected
  watch(selectedSchule, async (newValue: string | null, oldValue: string | null) => {
    if (newValue !== oldValue && newValue !== null) {
      // Fetch Klassen related to the selected Schule
      await organisationStore.getKlassenByOrganisationId(newValue);
      // Update the klassenOptions for the dropdown
      klassenOptions.value = organisationStore.klassen.map((org: Organisation) => ({
        value: org.id,
        title: org.name,
      }));
      // Update finalKlassen to show in the table
      finalKlassen.value = organisationStore.klassen;
    } else {
      // Reset selectedKlassen and klassenOptions when Schule is unselected
      selectedKlassen.value = [];
      klassenOptions.value = [];
      // Fetch all organisations when no Schule is selected
      finalKlassen.value = (await organisationStore.getAllOrganisationen()) || [];
    }
  });

  // Watcher to update finalKlassen when Klassen are selected or unselected
  watch(selectedKlassen, async (newValue: string[] | null, oldValue: string[] | null) => {
    if (newValue !== oldValue) {
      if (newValue && newValue.length > 0) {
        // Filter finalKlassen to only include the selected Klassen
        finalKlassen.value = organisationStore.klassen.filter((klasse: Organisation) => newValue.includes(klasse.id));
      } else if (selectedSchule.value !== null) {
        // If no Klassen are selected but a Schule is selected, show all Klassen for the selected Schule
        finalKlassen.value = organisationStore.klassen;
      } else {
        // If no Klassen and no Schule are selected, show all organisations
        finalKlassen.value = (await organisationStore.getAllOrganisationen()) || [];
      }
    }
  });

  // Watcher to search Schulen based on input text
  watch(searchInputSchulen, async (newValue: string, _oldValue: string) => {
    if (newValue.length >= 3) {
      // Fetch Schulen matching the search string when it has 3 or more characters
      organisationStore.getAllOrganisationen({ searchString: newValue, includeTyp: OrganisationsTyp.Schule });
    } else {
      // Fetch all Schulen when the search string is less than 3 characters
      organisationStore.getAllOrganisationen({ includeTyp: OrganisationsTyp.Schule });
    }
  });

  // Watcher to search Klassen based on input text
  watch(searchInputKlassen, async (newValue: string, _oldValue: string) => {
    if (newValue.length >= 1 && selectedSchule.value !== null) {
      // Fetch Klassen for the selected Schule matching the search string
      organisationStore.getKlassenByOrganisationId(selectedSchule.value, newValue);
    } else if (selectedSchule.value !== null) {
      // Fetch all Klassen for the selected Schule when the search string is cleared
      organisationStore.getKlassenByOrganisationId(selectedSchule.value);
    }
  });

  // Computed property to filter finalKlassen to only include those of type Klasse
  const klassenForTable: ComputedRef<Organisation[]> = computed(() => {
    return finalKlassen.value.filter((organisation: Organisation) => organisation.typ === OrganisationsTyp.Klasse);
  });

  // Fetch all organisations when the component is mounted
  onMounted(async () => {
    finalKlassen.value = (await organisationStore.getAllOrganisationen()) || [];
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
          />
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
            :items="klassenOptions"
            item-value="value"
            item-text="title"
            multiple
            :no-data-text="$t('noDataFound')"
            :placeholder="$t('admin.klasse.klasse')"
            required="true"
            variant="outlined"
            v-model="selectedKlassen"
            v-model:search="searchInputKlassen"
          />
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
      />
    </LayoutCard>
  </div>
</template>
