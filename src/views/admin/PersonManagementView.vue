<script setup lang="ts">
  import { usePersonStore, type Person, type PersonStore, type Personendatensatz } from '@/stores/PersonStore';
  import { computed, onMounted, type ComputedRef } from 'vue';
  import ResultTable from '@/components/admin/ResultTable.vue';
  import { type Composer, useI18n } from 'vue-i18n';
  import type { VDataTableServer } from 'vuetify/lib/components/index.mjs';

  import { type Router, useRouter } from 'vue-router';
  import {
    usePersonenkontextStore,
    type PersonenkontextStore,
    type Uebersicht,
    type Zuordnung,
  } from '@/stores/PersonenKontextStore';
  const personStore: PersonStore = usePersonStore();
  const personenKontextStore: PersonenkontextStore = usePersonenkontextStore();

  const { t }: Composer = useI18n({ useScope: 'global' });

  type ReadonlyHeaders = InstanceType<typeof VDataTableServer>['headers'];
  const headers: ReadonlyHeaders = [
    { title: t('person.lastName'), key: 'person.name.familienname', align: 'start' },
    { title: t('person.firstName'), key: 'person.name.vorname', align: 'start' },
    { title: t('person.userName'), key: 'person.referrer', align: 'start' },
    { title: t('person.rolle'), key: 'rolle', align: 'start' },
    { title: t('person.zuordnung'), key: 'administrationsebenen', align: 'start' },
  ];

  type PersonenWithRolleAndZuordnung = {
    rolle: string;
    administrationsebenen: string;
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
      const uebersicht: Uebersicht = personenKontextStore.allUebersichte?.items.find(
        (ueb: Uebersicht) => ueb?.personId === person.person.id,
      );
      const rollen: string = uebersicht?.zuordnungen.length
        ? uebersicht.zuordnungen.map((zuordnung: Zuordnung) => zuordnung.rolle).join(', ')
        : '-';
      // Choose sskDstNr if available, otherwise sskName.
      const administrationsebenen: string = uebersicht?.zuordnungen.length
        ? uebersicht.zuordnungen
            .map((zuordnung: Zuordnung) => (zuordnung.sskDstNr ? zuordnung.sskDstNr : zuordnung.sskName))
            .join(', ')
        : '-';
      return { ...person, rolle: rollen, administrationsebenen: administrationsebenen };
    });
  });

  onMounted(async () => {
    await personStore.getAllPersons();
    await personenKontextStore.getAllPersonenuebersichte();
  });
</script>

<template>
  <div class="admin">
    <h1 class="text-center headline">{{ $t('admin.headline') }}</h1>
    <ResultTable
      data-testid="person-table"
      :header="$t('admin.person.management')"
      :items="personenWithUebersicht || []"
      :loading="personStore.loading"
      :headers="headers"
      @onHandleRowClick="navigateToPersonDetails"
      @onUpdateTable="personStore.getAllPersons()"
      :totalItems="personStore.totalPersons"
      item-value-path="person.id"
      ><template v-slot:[`item.rolle`]="{ item }">
        <div
          class="ellipsis-wrapper"
          :title="item.rolle"
        >
          {{ item.rolle }}
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
  </div>
</template>

<style>
  .ellipsis-wrapper {
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    max-width: 200px;
  }
</style>
