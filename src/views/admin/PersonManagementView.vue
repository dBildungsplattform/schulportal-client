<script setup lang="ts">
  import { usePersonStore, type PersonStore, type Personendatensatz } from '@/stores/PersonStore';
  import { onMounted } from 'vue';
  import ResultTable from '@/components/admin/ResultTable.vue';
  import { type Composer, useI18n } from 'vue-i18n';
  import type { VDataTableServer } from 'vuetify/lib/components/index.mjs';

  import { type Router, useRouter } from 'vue-router';

  const personStore: PersonStore = usePersonStore();

  const { t }: Composer = useI18n({ useScope: 'global' });

  type ReadonlyHeaders = InstanceType<typeof VDataTableServer>['headers'];
  const headers: ReadonlyHeaders = [
    { title: t('person.lastName'), key: 'person.name.familienname', align: 'start' },
    { title: t('person.firstName'), key: 'person.name.vorname', align: 'start' },
    { title: t('person.userName'), key: 'person.referrer', align: 'start' },
  ];

  const router: Router = useRouter();

  function navigateToPersonDetails(_$event: PointerEvent, { item }: { item: Personendatensatz }): void {
    router.push({ name: 'person-details', params: { id: item.person.id } });
  }

  onMounted(async () => {
    await personStore.getAllPersons();
  });
</script>

<template>
  <div class="admin">
    <h1 class="text-center headline">{{ $t('admin.headline') }}</h1>
    <ResultTable
      data-testid="person-table"
      :header="$t('admin.person.management')"
      :items="personStore.allPersons || []"
      :loading="personStore.loading"
      :headers="headers"
      @onHandleRowClick="navigateToPersonDetails"
      @onUpdateTable="personStore.getAllPersons()"
      :totalItems="personStore.totalPersons"
      item-value-path="person.id"
    ></ResultTable>
  </div>
</template>

<style></style>
