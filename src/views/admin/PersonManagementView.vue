<script setup lang="ts">
  import { computed, onMounted, type ComputedRef, watch, type Ref, ref } from 'vue';
  import { type Composer, useI18n } from 'vue-i18n';
  import type { VDataTableServer } from 'vuetify/lib/components/index.mjs';
  import { type Router, useRouter } from 'vue-router';
  import { useOrganisationStore, type OrganisationStore, type OrganisationResponse } from '@/stores/OrganisationStore';
  import { usePersonStore, type Person, type PersonStore, type Personendatensatz } from '@/stores/PersonStore';
  import {
    usePersonenkontextStore,
    type PersonenkontextStore,
    type Uebersicht,
    type Zuordnung,
  } from '@/stores/PersonenkontextStore';
  import { useRolleStore, type RolleStore, type RolleResponse } from '@/stores/RolleStore';
  import ResultTable from '@/components/admin/ResultTable.vue';
  import LayoutCard from '@/components/cards/LayoutCard.vue';

  const router: Router = useRouter();
  const organisationStore: OrganisationStore = useOrganisationStore();
  const personStore: PersonStore = usePersonStore();
  const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();
  const rolleStore: RolleStore = useRolleStore();
  const { t }: Composer = useI18n({ useScope: 'global' });

  type ReadonlyHeaders = InstanceType<typeof VDataTableServer>['headers'];
  const headers: ReadonlyHeaders = [
    { title: t('person.lastName'), key: 'person.name.familienname', align: 'start' },
    { title: t('person.firstName'), key: 'person.name.vorname', align: 'start' },
    { title: t('person.userName'), key: 'person.referrer', align: 'start' },
    { title: t('person.rolle'), key: 'rollen', align: 'start' },
    { title: t('person.zuordnungen'), key: 'administrationsebenen', align: 'start' },
  ];

  type PersonenWithRolleAndZuordnung = {
    rollen: string;
    administrationsebenen: string;
    person: Person;
  }[];

  type TranslatedObject = {
    value: string;
    title: string;
  };

  const schulen: ComputedRef<TranslatedObject[] | undefined> = computed(() => {
    return organisationStore.allOrganisationen
      .slice(0, 25)
      .map((org: OrganisationResponse) => ({
        value: org.id,
        title: `${org.kennung} (${org.name})`,
      }))
      .sort((a: TranslatedObject, b: TranslatedObject) => a.title.localeCompare(b.title));
  });

  const rollen: ComputedRef<TranslatedObject[] | undefined> = computed(() => {
    return rolleStore.allRollen
    .slice(0, 25)
    .map((rolle: RolleResponse) => ({
      value: rolle.id,
      title: rolle.name,
    }))
    .sort((a: TranslatedObject, b: TranslatedObject) => a.title.localeCompare(b.title));
  });
  
  const klassen: Array<string> = ['Klasse', 'Nicht so klasse'];
  const statuses: Array<string> = ['Aktiv', 'Inaktiv'];
  
  const searchInputRolle: Ref<string> = ref('');
  const searchInputSchule: Ref<string> = ref('');

  function navigateToPersonDetails(_$event: PointerEvent, { item }: { item: Personendatensatz }): void {
    router.push({ name: 'person-details', params: { id: item.person.id } });
  }

  // Maps over allPersons, finds the corresponding zuordnungen for each person by matching the personId, and then extracts and combines
  // the rolle values into a single comma separated string. The result is merged with the original person data, adding a new role property.
  const personenWithUebersicht: ComputedRef<PersonenWithRolleAndZuordnung> = computed(() => {
    return personStore.allPersons.map((person: Personendatensatz) => {
      const uebersicht: Uebersicht = personenkontextStore.allUebersichten?.items.find(
        (ueb: Uebersicht) => ueb?.personId === person.person.id,
      );
      const rollenZuordnungen: string = uebersicht?.zuordnungen.length
        ? uebersicht.zuordnungen.map((zuordnung: Zuordnung) => zuordnung.rolle).join(', ')
        : '-';
      // Choose sskDstNr if available, otherwise sskName.
      const administrationsebenen: string = uebersicht?.zuordnungen.length
        ? uebersicht.zuordnungen
            .map((zuordnung: Zuordnung) => (zuordnung.sskDstNr ? zuordnung.sskDstNr : zuordnung.sskName))
            .join(', ')
        : '-';
      return { ...person, rollen: rollenZuordnungen, administrationsebenen: administrationsebenen };
    });
  });

  // Watcher to detect when the search input for Organisationen is triggered.
  watch(searchInputSchule, async (newValue: string, _oldValue: string) => {
    if (newValue.length >= 3) {
      organisationStore.getAllOrganisationen(newValue);
    } else {
      organisationStore.getAllOrganisationen();
    }
  });

  // Watcher to detect when the search input for Organisationen is triggered.
  watch(searchInputRolle, async (newValue: string, _oldValue: string) => {
    if (newValue.length >= 3) {
      rolleStore.getAllRollen(newValue);
    } else {
      rolleStore.getAllRollen();
    }
});

  onMounted(async () => {
    await organisationStore.getAllOrganisationen();
    await personStore.getAllPersons();
    await personenkontextStore.getAllPersonenuebersichten();
    await rolleStore.getAllRollen();
  });
</script>

<template>
  <div class="admin">
    <h1 class="text-center headline" data-testid="admin-headline">{{ $t('admin.headline') }}</h1>
    <LayoutCard :header="$t('admin.person.management')">
      <v-row
        align="center"
        class="ma-3"
      >
        <v-col
          cols="4"
          class="py-0 text-right"
        >
          <span class="reset-filter">{{ $t("resetFilter") }}</span>
        </v-col>
        <v-col
          cols="2"
          class="py-0"
        >
          <v-autocomplete
            autocomplete="off"
            class="filter-dropdown"
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
            v-model:search="searchInputSchule"
          >
          </v-autocomplete>
        </v-col>
        <v-col
          cols="2"
          class="py-0"
        >
          <v-autocomplete
            autocomplete="off"
            class="filter-dropdown"
            clearable
            data-testid="rolle-select"
            density="compact"
            hide-details
            id="rolle-select"
            :items="rollen"
            item-value="value"
            item-text="title"
            :no-data-text="$t('noDataFound')"
            :placeholder="$t('admin.rolle.rolle')"
            required="true"
            variant="outlined"
            v-model="selectedRolle"
            v-model:search="searchInputRolle"
          >
          </v-autocomplete>
        </v-col>
        <v-col
          cols="2"
          class="py-0"
        >
          <v-autocomplete
            autocomplete="off"
            class="filter-dropdown"
            clearable
            data-testid="klasse-select"
            density="compact"
            hide-details
            id="klasse-select"
            :items="klassen"
            item-value="value"
            item-text="title"
            :no-data-text="$t('noDataFound')"
            :placeholder="$t('admin.klasse.klasse')"
            required="true"
            variant="outlined"
            v-model="selectedKlasse"
          >
          </v-autocomplete>
        </v-col>
        <v-col
          cols="2"
          class="py-0"
        >
          <v-autocomplete
            autocomplete="off"
            class="filter-dropdown"
            clearable
            data-testid="status-select"
            density="compact"
            hide-details
            id="status-select"
            :items="statuses"
            item-value="value"
            item-text="title"
            :no-data-text="$t('noDataFound')"
            :placeholder="$t('admin.status')"
            required="true"
            variant="outlined"
            v-model="selectedStatus"
          >
          </v-autocomplete>
        </v-col>
      </v-row>
      <ResultTable
        data-testid="person-table"
        :items="personenWithUebersicht || []"
        :loading="personStore.loading"
        :headers="headers"
        @onHandleRowClick="navigateToPersonDetails"
        @onUpdateTable="personStore.getAllPersons()"
        :totalItems="personStore.totalPersons"
        item-value-path="person.id"
      >
        <template v-slot:[`item.rolle`]="{ item }">
          <div
            class="ellipsis-wrapper"
            :title="item.rolle"
          >
            {{ item.rolle }}
          </div>
        </template>
        <template v-slot:[`item.administrationsebenen`]="{ item }">
          <div
            class="ellipsis-wrapper"
            :title="item.administrationsebenen"
          >
            {{ item.administrationsebenen }}
          </div>
        </template>
      </ResultTable>
    </LayoutCard>
  </div>
</template>

<style></style>
@/stores/PersonenkontextStore
