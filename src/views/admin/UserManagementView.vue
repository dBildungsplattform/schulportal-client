<script setup lang="ts">
  import { useAuthStore } from '@/stores/AuthStore'
  import { usePersonStore } from '@/stores/PersonStore'
  import { ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import PasswordReset from '@/components/admin/PasswordReset.vue'

  const personStore = usePersonStore()
  const authStore = useAuthStore()
  personStore.getAllPersons()

  /* this block is necessary to match data table header types to shut up typescript */
  import type { VDataTable } from 'vuetify/lib/labs/components.mjs'
  type UnwrapReadonlyArrayType<A> = A extends Readonly<Array<infer I>>
    ? UnwrapReadonlyArrayType<I>
    : A
  type DT = InstanceType<typeof VDataTable>
  type ReadonlyDataTableHeader = UnwrapReadonlyArrayType<DT['headers']>

  const { t } = useI18n({ useScope: 'global' })
  const headers = [
    { title: t('user.name'), key: 'person.name', align: 'start' },
    { title: t('action'), key: 'actions', sortable: false }
  ] as ReadonlyDataTableHeader[]
  const itemsPerPage = 25 as number
  const password = ref('')

  async function resetPassword(userId: string) {
    password.value = await authStore.resetPassword(userId)
  }
</script>

<template>
  <div class="admin">
    <h2>{{ $t('admin.user.management') }}</h2>
    <v-data-table
      class="elevation-1"
      data-testid="user-table"
      :headers="headers"
      :items="personStore.allPersons"
      v-model:items-per-page="itemsPerPage"
    >
      <template #[`item.person.name`]="{ item }"
        >{{ item.raw.person.name.vorname }} {{ item.raw.person.name.familienname }}</template
      >
      <template #[`item.actions`]="{ item }">
        <PasswordReset
          :item="item"
          @on-clear-password="password = ''"
          @on-reset-password="resetPassword"
          :password="password"
        >
        </PasswordReset>
      </template>
    </v-data-table>
  </div>
</template>

<style></style>
