<script setup lang="ts">
  import LayoutCard from '@/components/cards/LayoutCard.vue'
  import { type Composer, useI18n } from 'vue-i18n'
  import { type Personendatensatz } from '@/stores/PersonStore'
  import router from '@/router'

  /* this block is necessary to introduce a table header type for defining table headers
      watch source for updates: https://stackoverflow.com/a/75993081/4790594
   */
  import type { VDataTableServer } from 'vuetify/lib/components/index.mjs'
  type ReadonlyHeaders = InstanceType<typeof VDataTableServer>['headers']

  defineProps<{
    items: Personendatensatz[]
    loading: boolean
    totalItems: number
  }>()

  const { t }: Composer = useI18n({ useScope: 'global' })

  const headers: ReadonlyHeaders = [
    { title: t('user.lastName'), key: 'person.name.familienname', align: 'start' },
    { title: t('user.firstName'), key: 'person.name.vorname', align: 'start' }
  ]

  function handleRowClick($event: PointerEvent, { item }: { item: Personendatensatz }): void {
    console.log($event)
    router.push({ name: 'user-details', params: { id: item.person.id } })
  }
</script>

<template>
  <LayoutCard :header="$t('admin.user.management')">
    <v-data-table-server
      class="user-table"
      @click:row="handleRowClick"
      data-testid="user-table"
      density="compact"
      :headers="headers"
      :items="items"
      :items-length="totalItems"
      item-value="person.id"
      select-strategy="page"
      show-select
      @update:options="$emit('onTableUpdate')"
    >
    </v-data-table-server>
  </LayoutCard>
</template>

<style></style>
