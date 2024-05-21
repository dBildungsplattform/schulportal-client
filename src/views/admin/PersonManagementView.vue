<script setup lang="ts">
  import { computed, onMounted, type ComputedRef, watch, type Ref, ref } from 'vue';
  import { type Composer, useI18n } from 'vue-i18n';
  import type { VDataTableServer } from 'vuetify/lib/components/index.mjs';

  import { type Router, useRouter } from 'vue-router';
  import {
    useOrganisationStore,
    type OrganisationStore,
    type Organisation,
    OrganisationsTyp,
  } from '@/stores/OrganisationStore';
  import { usePersonStore, type Person, type PersonStore, type Personendatensatz } from '@/stores/PersonStore';
  import {
    usePersonenkontextStore,
    type PersonenkontextStore,
    type Uebersicht,
    type Zuordnung,
  } from '@/stores/PersonenkontextStore';
  import { useRolleStore, type RolleStore, type RolleResponse } from '@/stores/RolleStore';
  import { type SearchFilterStore, useSearchFilterStore } from '@/stores/SearchFilterStore';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import ResultTable from '@/components/admin/ResultTable.vue';
  import SearchField from '@/components/admin/SearchField.vue';

  const searchFilterStore: SearchFilterStore = useSearchFilterStore();

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
    { title: t('person.kopersnr'), key: 'person.personalnummer', align: 'start' },
    { title: t('person.rolle'), key: 'rollen', align: 'start' },
    { title: t('person.zuordnungen'), key: 'administrationsebenen', align: 'start' },
    { title: t('person.klasse'), key: 'klassen', align: 'start' },
  ];

  type PersonenWithRolleAndZuordnung = {
    rollen: string;
    administrationsebenen: string;
    klassen: string;
    person: Person;
  }[];

  type TranslatedObject = {
    value: string;
    title: string;
  };

  const schulen: ComputedRef<TranslatedObject[] | undefined> = computed(() => {
    return organisationStore.allOrganisationen
      .slice(0, 25)
      .map((org: Organisation) => ({
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

  const searchInputRollen: Ref<string> = ref('');
  const searchInputSchulen: Ref<string> = ref('');

  const selectedRollen: Ref<Array<string>> = ref([]);
  const selectedSchulen: Ref<Array<string>> = ref([]);
  const searchFilter: Ref<string> = ref('');

  const filterOrSearchActive: Ref<boolean> = computed(() => selectedSchulen.value.length > 0 || selectedRollen.value.length > 0 || searchFilter.value.length > 0);

  function navigateToPersonDetails(_$event: PointerEvent, { item }: { item: Personendatensatz }): void {
    router.push({ name: 'person-details', params: { id: item.person.id } });
  }

  function resetSearchAndFilter(): void {
    searchInputSchulen.value = '';
    searchInputRollen.value = '';
    selectedSchulen.value = [];
    selectedRollen.value = [];
    personStore.getAllPersons({});
  }

  // Maps over allPersons, finds the corresponding zuordnungen for each person by matching the personId, and then extracts and combines
  // the rolle values into a single comma separated string. The result is merged with the original person data, adding a new role property.
  const personenWithUebersicht: ComputedRef<PersonenWithRolleAndZuordnung> = computed(() => {
    return personStore.allPersons.map((person: Personendatensatz) => {
      const uebersicht: Uebersicht = personenkontextStore.allUebersichten?.items.find(
        (ueb: Uebersicht) => ueb?.personId === person.person.id,
      );
      const uniqueRollen: Set<string> = new Set<string>();
      uebersicht?.zuordnungen.forEach((zuordnung: Zuordnung) => uniqueRollen.add(zuordnung.rolle));
      const rollenZuordnungen: string = uniqueRollen.size > 0 ? Array.from(uniqueRollen).join(', ') : '---';

      // Choose sskDstNr if available, otherwise sskName.
      const administrationsebenen: string = uebersicht?.zuordnungen.length
        ? uebersicht.zuordnungen
            .filter((zuordnung: Zuordnung) => zuordnung.typ !== OrganisationsTyp.Klasse)
            .map((zuordnung: Zuordnung) => (zuordnung.sskDstNr ? zuordnung.sskDstNr : zuordnung.sskName))
            .join(', ')
        : '---';
      // Check if personalnummer is null, if so, replace it with "---"
      const personalnummer: string = person.person.personalnummer ?? '---';
      // Check if the uebersicht has a zuordnung of type "Klasse" if no then show directly "---" without filtering or mapping
      const klassenZuordnungen: string = uebersicht?.zuordnungen.some(
        (zuordnung: Zuordnung) => zuordnung.typ === OrganisationsTyp.Klasse,
      )
        ? uebersicht.zuordnungen
            .filter((zuordnung: Zuordnung) => zuordnung.typ === OrganisationsTyp.Klasse)
            .map((zuordnung: Zuordnung) => (zuordnung.sskName.length ? zuordnung.sskName : '---'))
            .join(', ')
        : '---';
      return {
        ...person,
        rollen: rollenZuordnungen,
        administrationsebenen: administrationsebenen,
        klassen: klassenZuordnungen,
        person: { ...person.person, personalnummer: personalnummer },
      };
    });
  });

  const handleSearchFilter = (filter: string): void => {
    searchFilter.value = filter;
    personStore.getAllPersons({ searchFilter: searchFilter.value });
  };

  // Watcher to detect when the search input for Organisationen is triggered.
  watch(searchInputSchulen, async (newValue: string, _oldValue: string) => {
    if (newValue?.length >= 3) {
      organisationStore.getAllOrganisationen({ searchString: newValue, includeTyp: OrganisationsTyp.Schule });
    } else {
      organisationStore.getAllOrganisationen({ includeTyp: OrganisationsTyp.Schule });
    }
  });

  // Watcher to detect when the search input for Organisationen is triggered.
  watch(searchInputRollen, async (newValue: string, _oldValue: string) => {
    if (newValue?.length >= 3) {
      rolleStore.getAllRollen();
    } else {
      rolleStore.getAllRollen();
    }
  });

  watch(selectedSchulen, async (newValue: Array<string>, _oldValue: Array<string>) => {
    if (newValue?.length > 0) {
      personStore.getAllPersons({ organisationIDs: newValue });
    } else {
      personStore.getAllPersons({});
    }
  });

  watch(selectedRollen, async (newValue: Array<string>, _oldValue: Array<string>) => {
    if (newValue?.length > 0) {
      personStore.getAllPersons({ rolleIDs: newValue });
    } else {
      personStore.getAllPersons({});
    }
  });

  onMounted(async () => {
    if (searchFilterStore.searchFilter === '') {
      await personStore.getAllPersons({});
    }
    await organisationStore.getAllOrganisationen({ includeTyp: OrganisationsTyp.Schule });
    await personenkontextStore.getAllPersonenuebersichten();
    await rolleStore.getAllRollen();
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
    <LayoutCard :header="$t('admin.person.management')">
      <v-row
        align="center"
        class="ma-3"
        justify="end"
      >
        <v-col
          cols="4"
          class="py-0 text-right"
        >
          <v-btn
            class="reset-filter"
            :disabled="!filterOrSearchActive"
            @click="resetSearchAndFilter()"
            size="x-small"
            variant="text"
            width="auto"
          >
            {{ $t('resetFilter') }}
          </v-btn>
        </v-col>
        <v-col
          cols="2"
          class="py-0"
        >
          <v-autocomplete
            autocomplete="off"
            chips
            class="filter-dropdown"
            :class="{ 'selected': selectedSchulen.length > 0 }"
            clearable
            data-testid="schule-select"
            density="compact"
            hide-details
            id="schule-select"
            :items="schulen"
            item-value="value"
            item-text="title"
            multiple
            :no-data-text="$t('noDataFound')"
            :placeholder="$t('admin.schule.schule')"
            required="true"
            single-line
            variant="outlined"
            v-model="selectedSchulen"
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
            clearable
            data-testid="rolle-select"
            density="compact"
            hide-details
            id="rolle-select"
            :items="rollen"
            item-value="value"
            item-text="title"
            multiple
            :no-data-text="$t('noDataFound')"
            :placeholder="$t('admin.rolle.rolle')"
            required="true"
            variant="outlined"
            v-model="selectedRollen"
            v-model:search="searchInputRollen"
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
          >
          </v-autocomplete>
        </v-col>
      </v-row>
      <v-row
        align="center"
        class="ma-3"
        justify="end"
      >
        <SearchField
          :hover-text="$t('person.firstNameLastNameReferrerKopersNr')"
          @onApplySearchFilter="handleSearchFilter"
        ></SearchField>
      </v-row>
      <ResultTable
        data-testid="person-table"
        :items="personenWithUebersicht || []"
        :loading="personStore.loading"
        :headers="headers"
        @onHandleRowClick="navigateToPersonDetails"
        @onUpdateTable="personStore.getAllPersons({})"
        :totalItems="personStore.totalPersons"
        item-value-path="person.id"
        ><template v-slot:[`item.rollen`]="{ item }">
          <div
            class="ellipsis-wrapper"
            :title="item.rollen"
          >
            {{ item.rollen }}
          </div> </template
        ><template v-slot:[`item.administrationsebenen`]="{ item }">
          <div
            class="ellipsis-wrapper"
            :title="item.administrationsebenen"
          >
            {{ item.administrationsebenen }}
          </div>
        </template></ResultTable
      >
    </LayoutCard>
  </div>
</template>

<style></style>
