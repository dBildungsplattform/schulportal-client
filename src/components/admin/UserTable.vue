<script setup lang="ts">
  import PasswordReset from '@/components/admin/PasswordReset.vue'
  import { Composer, useI18n } from 'vue-i18n'
  import { Person } from '@/stores/PersonStore'

  /* this block is necessary to introduce a table header type to shut up typescript when defining table headers */
  import type { VDataTableServer } from 'vuetify/lib/components/index.mjs'
  type ReadonlyHeaders = InstanceType<typeof VDataTableServer>['headers']

  defineProps<{
    errorCode: string
    items: Person[]
    loading: boolean
    password: string
    totalItems: number
  }>()

  const { t }: Composer = useI18n({ useScope: 'global' })

  const headers: ReadonlyHeaders = [
    { title: t('user.name'), key: 'person.name', align: 'start' },
    { title: t('action'), key: 'actions', sortable: false }
  ]
</script>

<template>
  <v-data-table-server
    class="elevation-1"
    data-testid="user-table"
    :headers="headers"
    :items="items"
    :items-length="totalItems"
    @update:options="$emit('onTableUpdate')"
  >
    <template #[`item.person.name`]="{ item }"
      >{{ item.person.name.vorname }} {{ item.person.name.familienname }}</template
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
</template>

<style></style>
