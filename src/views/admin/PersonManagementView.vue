<script setup lang="ts">
  import { usePersonStore, type Person, type PersonStore, type Personendatensatz } from '@/stores/PersonStore';
  import { computed, onMounted, ref, type ComputedRef, type Ref } from 'vue';
  import ResultTable from '@/components/admin/ResultTable.vue';
  import { type Composer, useI18n } from 'vue-i18n';
  import type { VDataTableServer } from 'vuetify/lib/components/index.mjs';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import SearchField from '@/components/admin/SearchField.vue';

  import { type Router, useRouter } from 'vue-router';
  import {
    usePersonenkontextStore,
    type PersonenkontextStore,
    type Uebersicht,
    type Zuordnung,
  } from '@/stores/PersonenkontextStore';
  import { OrganisationsTyp } from '@/stores/OrganisationStore';
  const personStore: PersonStore = usePersonStore();
  const personenKontextStore: PersonenkontextStore = usePersonenkontextStore();

  const { t }: Composer = useI18n({ useScope: 'global' });
  const searchFilter: Ref<string> = ref('');

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
  const router: Router = useRouter();

  function navigateToPersonDetails(_$event: PointerEvent, { item }: { item: Personendatensatz }): void {
    router.push({ name: 'person-details', params: { id: item.person.id } });
  }

  // Maps over allPersons, finds the corresponding zuordnungen for each person by matching the personId, and then extracts and combines
  // the rolle values into a single comma separated string. The result is merged with the original person data, adding a new role property.
  const personenWithUebersicht: ComputedRef<PersonenWithRolleAndZuordnung> = computed(() => {
    return personStore.allPersons.map((person: Personendatensatz) => {
      const uebersicht: Uebersicht = personenKontextStore.allUebersichten?.items.find(
        (ueb: Uebersicht) => ueb?.personId === person.person.id,
      );
      const rollen: string = uebersicht?.zuordnungen.length
        ? uebersicht.zuordnungen.map((zuordnung: Zuordnung) => zuordnung.rolle).join(', ')
        : '---';
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
      const klassen: string = uebersicht?.zuordnungen.some(
        (zuordnung: Zuordnung) => zuordnung.typ === OrganisationsTyp.Klasse,
      )
        ? uebersicht.zuordnungen
            .filter((zuordnung: Zuordnung) => zuordnung.typ === OrganisationsTyp.Klasse)
            .map((zuordnung: Zuordnung) => (zuordnung.sskName.length ? zuordnung.sskName : '---'))
            .join(', ')
        : '---';
      return {
        ...person,
        rollen: rollen,
        administrationsebenen: administrationsebenen,
        klassen: klassen,
        person: { ...person.person, personalnummer: personalnummer },
      };
    });
  });

  const handleSearchFilter = (filter: string): void => {
    searchFilter.value = filter;
    personStore.getAllPersons(searchFilter.value);
  };

  onMounted(async () => {
    await personStore.getAllPersons('');
    await personenKontextStore.getAllPersonenuebersichten();
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
      <SearchField
        :hover-text="$t('person.firstNameLastNameReferrerKopersNr')"
        @onApplySearchFilter="handleSearchFilter"
      ></SearchField>
      <ResultTable
        data-testid="person-table"
        :items="personenWithUebersicht || []"
        :loading="personStore.loading"
        :headers="headers"
        @onHandleRowClick="navigateToPersonDetails"
        @onUpdateTable="personStore.getAllPersons('')"
        :totalItems="personStore.totalPersons"
        item-value-path="person.id"
      ></ResultTable>
    </LayoutCard>
  </div>
</template>

<style></style>
