<script setup lang="ts">
  import { computed, type ComputedRef } from 'vue'
  import LayoutCard from '@/components/cards/LayoutCard.vue'
  import { type Composer, useI18n } from 'vue-i18n'

  /* this block is necessary to introduce a table header type for defining table headers
      watch source for updates: https://stackoverflow.com/a/75993081/4790594
   */
  import type { VDataTableServer } from 'vuetify/lib/components/index.mjs'
  type ReadonlyHeaders = InstanceType<typeof VDataTableServer>['headers']

  type GenericItem = Record<string, unknown>

  type Props = {
    items: GenericItem[]
    loading: boolean
    totalItems: number
    headers: ReadonlyHeaders
  }
  const props: Props = defineProps<Props>()

  const { t }: Composer = useI18n({ useScope: 'global' })

  // TODO: these two values will come from the API in the future
  const itemsPerPage: number = 25
  const page: number = 1

  const pageText: ComputedRef<string> = computed<string>(() => {
    const totalItems: number = props.items.length
    const firstPageItem: number = (page - 1) * itemsPerPage + 1
    const lastPageItem: number = Math.min(page * itemsPerPage, totalItems)
    const interval: string = `${firstPageItem} - ${lastPageItem}`

    return t('pagination.pageText', { interval: interval, total: totalItems })
  })
</script>

<template>
  <LayoutCard :header="$t('admin.user.management')">
    <v-data-table-server
      class="user-table"
      @click:row="
        ($event: PointerEvent, item: GenericItem[]) => $emit('onHandleRowClick', $event, item)
      "
      data-testid="user-table"
      density="compact"
      :headers="headers"
      :items="items"
      :items-length="totalItems"
      :items-per-page-options="[{ value: -1, title: $t('pagination.all') }]"
      :items-per-page-text="$t('itemsPerPage')"
      item-value="person.id"
      :page-text="pageText"
      select-strategy="page"
      show-select
      @update:options="$emit('onTableUpdate')"
    >
    </v-data-table-server>
  </LayoutCard>
</template>

<style></style>
