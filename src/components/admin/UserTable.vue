<script setup lang="ts">
  import LayoutCard from '@/components/cards/LayoutCard.vue'
  import PasswordReset from '@/components/admin/PasswordReset.vue'
  import { type Composer, useI18n } from 'vue-i18n'
  import type { Person } from '@/stores/PersonStore';

  /* this block is necessary to introduce a table header type for defining table headers
      watch source for updates: https://stackoverflow.com/a/75993081/4790594
   */
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
    { title: t('user.lastName'), key: 'person.name.familienname', align: 'start' },
    { title: t('user.firstName'), key: 'person.name.vorname', align: 'start' },
    { title: t('user.userName'), key: 'person.username', align: 'start' },
    { title: t('user.email'), key: 'person.email', align: 'start' },
    { title: t('action'), key: 'actions', sortable: false }
  ]

  const selected: Array<Person> = []
</script>

<template>
  <LayoutCard
    :header="$t('admin.user.management')"  
  >
    <v-data-table-server
      class="user-table"
      data-testid="user-table"
      density="compact"
      :headers="headers"
      :items="items"
      :items-length="totalItems"
      item-value="person.id"
      @update:options="$emit('onTableUpdate')"
      show-select
      v-model="selected"
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
