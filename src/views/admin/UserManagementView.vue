<script setup lang="ts">
  import { usePersonStore } from '@/stores/PersonStore'
  import { ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import UserTable from '@/components/admin/UserTable.vue'

  const personStore = usePersonStore()
  personStore.getAllPersons()

  /* this block is necessary to introduce a table header type to shut up typescript when defining table headers */
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
  const itemsPerPage = ref(25)
  const password = ref('')

  async function resetPassword(userId: string) {
    password.value = await personStore.resetPassword(userId)
  }

  function updateItemsPerPage(newValue: number) {
    itemsPerPage.value = newValue
  }
</script>

<template>
  <div class="admin">
    <h2>{{ $t('admin.user.management') }}</h2>
    <UserTable
      :headers="headers"
      :items="personStore.allPersons"
      :loading="personStore.loading"
      @onClearPassword="password = ''"
      @onItemsPerPageUpdate="updateItemsPerPage"
      @onResetPassword="resetPassword"
      :password="password"
    ></UserTable>
  </div>
</template>

<style></style>
