<script setup lang="ts">
  import { usePersonStore } from '@/stores/PersonStore'
  import { useI18n } from 'vue-i18n'

  const personStore = usePersonStore()
  personStore.getAllPersons()

  /* this block is necessary to match data table header types to shut up typescript */
  import type { VDataTable } from 'vuetify/lib/labs/components.mjs'
  type UnwrapReadonlyArrayType<A> = A extends Readonly<Array<infer I>>
    ? UnwrapReadonlyArrayType<I>
    : A
  type DT = InstanceType<typeof VDataTable>
  type ReadonlyDataTableHeader = UnwrapReadonlyArrayType<DT['headers']>

  const { t } = useI18n({ useScope: 'global' })
  const itemsPerPage = 25
  const headers = [
    { title: t('user.name'), key: 'person.name', align: 'start' }
  ] as ReadonlyDataTableHeader[]
</script>

<template>
  <div class="admin">
    <h2>{{ $t('admin.user.management') }}</h2>
    <v-data-table
      v-model:items-per-page="itemsPerPage"
      :headers="headers"
      :items="personStore.allPersons"
      class="elevation-1"
    >
      <template #[`item.person.name`]="{ item }"
        >{{ item.raw.person.name.vorname }} {{ item.raw.person.name.familienname }}</template
      >
    </v-data-table>
  </div>
</template>

<style></style>
