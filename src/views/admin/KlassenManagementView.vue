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
  import type { UserinfoPersonenkontext } from '@/stores/PersonenkontextStore';
  import { useAuthStore, type AuthStore } from '@/stores/AuthStore';

  const organisationStore: OrganisationStore = useOrganisationStore();
  const authStore: AuthStore = useAuthStore();
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
  const isSchuleDropdownDisabled: Ref<boolean> = ref(false);

  const schulen: ComputedRef<TranslatedObject[] | undefined> = computed(() => {
    return organisationStore.allOrganisationen
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
      organisationStore.totalKlassen = 0;

      // Re-enable the dropdown
      isSchuleDropdownDisabled.value = false;
      // Fetch all Klassen when no Schule is selected
      await organisationStore.getAllOrganisationen({ includeTyp: OrganisationsTyp.Klasse });
      finalKlassen.value = organisationStore.allKlassen;
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
        // If no Klassen and no Schule are selected, show all Klassen
        await organisationStore.getAllOrganisationen({ includeTyp: OrganisationsTyp.Klasse });
        finalKlassen.value = organisationStore.allKlassen;
      }
    }
  });

  // Watcher to search Schulen based on input text
  watch(searchInputSchulen, async (newValue: string, _oldValue: string) => {
    if (newValue.length >= 1) {
      // Fetch Schulen matching the search string when it has 3 or more characters
      await organisationStore.getAllOrganisationen({ searchString: newValue, includeTyp: OrganisationsTyp.Schule });
    } else {
      // Fetch all Schulen when the search string is less than 3 characters
      await organisationStore.getAllOrganisationen({ includeTyp: OrganisationsTyp.Schule });
    }
  });

  // Watcher to search Klassen based on input text
  watch(searchInputKlassen, async (newValue: string, _oldValue: string) => {
    if (newValue.length >= 1 && selectedSchule.value !== null) {
      // Fetch Klassen for the selected Schule matching the search string
      await organisationStore.getKlassenByOrganisationId(selectedSchule.value, newValue);

    } else if (selectedSchule.value !== null) {
      // Fetch all Klassen for the selected Schule when the search string is cleared
      await organisationStore.getKlassenByOrganisationId(selectedSchule.value);

    }
  });

  // Checks if the filter is active or not
  const filterActive: Ref<boolean> = computed(() => !!selectedSchule.value);

  function resetSearchAndFilter(): void {
    // Clear search inputs
    searchInputSchulen.value = '';
    searchInputKlassen.value = '';

    // Clear selected values
    selectedSchule.value = null;
    selectedKlassen.value = [];

    // Reset klassenOptions
    klassenOptions.value = [];

    // Refetch all data
    organisationStore.getAllOrganisationen({ includeTyp: OrganisationsTyp.Schule }).then(() => {
      organisationStore.getAllOrganisationen({ includeTyp: OrganisationsTyp.Klasse }).then(() => {
        finalKlassen.value = organisationStore.allKlassen;
      });
    });
  }

  onMounted(async () => {
    await organisationStore.getAllOrganisationen({ includeTyp: OrganisationsTyp.Schule });
    await organisationStore.getAllOrganisationen({ includeTyp: OrganisationsTyp.Klasse });

    // Autoselect the Schule for the current user that only has 1 Schule assigned to him.
    const personenkontexte: Array<UserinfoPersonenkontext> | null = authStore.currentUser?.personenkontexte || [];
    if (personenkontexte.length > 0) {
      const matchingOrganisations: UserinfoPersonenkontext[] = personenkontexte.filter(
        (kontext: UserinfoPersonenkontext) =>
          organisationStore.allOrganisationen.some((org: Organisation) => org.id === kontext.organisationsId),
      );

      if (matchingOrganisations.length === 1) {
        const matchedOrganisation: UserinfoPersonenkontext | undefined = matchingOrganisations[0];

        selectedSchule.value = matchedOrganisation?.organisationsId || null;
        if (selectedSchule.value) {
          await organisationStore.getKlassenByOrganisationId(selectedSchule.value);
          finalKlassen.value = organisationStore.klassen;
          isSchuleDropdownDisabled.value = true;
        }
      }
    }
    finalKlassen.value = organisationStore.allKlassen;
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
          cols="12"
          md="2"
          class="py-md-0 text-md-right"
        >
          <v-btn
            class="px-0 reset-filter"
            :disabled="!filterActive"
            @click="resetSearchAndFilter()"
            size="x-small"
            variant="text"
            width="auto"
          >
            {{ $t('resetFilter') }}
          </v-btn>
        </v-col>
        <v-col
          md="3"
          cols="12"
          class="py-md-0"
        >
          <v-autocomplete
            autocomplete="off"
            class="filter-dropdown"
            :class="{ selected: selectedSchule }"
            clearable
            data-testid="schule-select"
            density="compact"
            hide-details
            id="schule-select"
            ref="schule-select"
            :items="schulen"
            item-value="value"
            item-text="title"
            :no-data-text="$t('noDataFound')"
            :placeholder="$t('admin.schule.schule')"
            required="true"
            variant="outlined"
            v-model="selectedSchule"
            v-model:search="searchInputSchulen"
            :disabled="isSchuleDropdownDisabled"
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
                    organisationStore.totalOrganisationen === 1
                      ? $t('admin.schule.schuleFound', { total: organisationStore.totalOrganisationen })
                      : $t('admin.schule.schulenFound', { total: organisationStore.totalOrganisationen })
                  }}</span
                >
              </v-list-item>
            </template>
          </v-autocomplete>
        </v-col>
        <v-col
          md="3"
          cols="12"
          class="py-md-0"
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
            ref="klasse-select"
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
                    organisationStore.totalKlassen === 1
                      ? $t('admin.klasse.klasseFound', { total: organisationStore.totalKlassen })
                      : $t('admin.klasse.klassenFound', { total: organisationStore.totalKlassen })
                  }}</span
                >
              </v-list-item>
            </template>
          </v-autocomplete>
        </v-col>
      </v-row>
      <ResultTable
        data-testid="klasse-table"
        :header="$t('admin.klasse.management')"
        :items="finalKlassen || []"
        :loading="organisationStore.loading"
        :headers="headers"
        @onUpdateTable="organisationStore.getAllOrganisationen()"
        :totalItems="organisationStore.allKlassen.length"
        item-value-path="id"
        :disableRowClick="true"
      />
    </LayoutCard>
  </div>
</template>
