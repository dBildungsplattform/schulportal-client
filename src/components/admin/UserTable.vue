<script setup lang="ts">
  import PasswordReset from '@/components/admin/PasswordReset.vue'
  import { useI18n } from 'vue-i18n'

  /* this block is necessary to introduce a table header type to shut up typescript when defining table headers */
  import type { VDataTableServer } from 'vuetify/lib/components/index.mjs'
  type ReadonlyHeaders = InstanceType<typeof VDataTableServer>['headers']

  defineProps<{
    items: any[]
    loading: boolean
    password: string
    totalItems: number
  }>()

  const { t } = useI18n({ useScope: 'global' })

  const headers: ReadonlyHeaders = [
    { title: t('user.name'), key: 'person.name', align: 'start' },
    { title: t('action'), key: 'actions', sortable: false }
  ]

  let itemsPerPage: number = 25
</script>

<template>
  <v-data-table-server
    class="elevation-1"
    data-testid="user-table"
    :headers="headers"
    :items="items"
    :items-length="totalItems"
    v-model:items-per-page="itemsPerPage"
    :update:itemsPerPage="$emit('onItemsPerPageUpdate', itemsPerPage)"
    @update:options="$emit('onTableUpdate')"
  >
    <template #[`item.person.name`]="{ item }"
      >{{ item.raw.person.name.vorname }} {{ item.raw.person.name.familienname }}</template
    >
    <template #[`item.actions`]="{ item }">
      <PasswordReset
        :person="item.raw.person"
        @onClearPassword="$emit('onClearPassword')"
        @onResetPassword="$emit('onResetPassword', item.raw.person.id)"
        :password="password"
      >
      </PasswordReset>
    </template>
  </v-data-table-server>
</template>

<style></style>
