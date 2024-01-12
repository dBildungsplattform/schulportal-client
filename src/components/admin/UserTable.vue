<script setup lang="ts">
  import { computed, type ComputedRef } from 'vue'
  import LayoutCard from '@/components/cards/LayoutCard.vue'
  import PasswordReset from '@/components/admin/PasswordReset.vue'
  import { type Composer, useI18n } from 'vue-i18n'
  import { type Personendatensatz } from '@/stores/PersonStore'

  /* this block is necessary to introduce a table header type for defining table headers
      watch source for updates: https://stackoverflow.com/a/75993081/4790594
   */
  import type { VDataTableServer } from 'vuetify/lib/components/index.mjs'
  type ReadonlyHeaders = InstanceType<typeof VDataTableServer>['headers']

  type Props = {
    errorCode: string
    items: Personendatensatz[]
    loading: boolean
    password: string
    totalItems: number
  }

  const props: Props = defineProps<Props>()

  const { t }: Composer = useI18n({ useScope: 'global' })

  const headers: ReadonlyHeaders = [
    { title: t('user.lastName'), key: 'person.name.familienname', align: 'start' },
    { title: t('user.firstName'), key: 'person.name.vorname', align: 'start' },
    { title: t('action'), key: 'actions', sortable: false }
  ]

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
      <template #[`item.actions`]="{ item }">
        <PasswordReset
          :errorCode="errorCode"
          :person="item.person"
          @onClearPassword="$emit('onClearPassword')"
          @onResetPassword="$emit('onResetPassword', item.person.id)"
          :password="password"
        >
        </PasswordReset>
      </template>
    </v-data-table-server>
  </LayoutCard>
</template>

<style></style>
