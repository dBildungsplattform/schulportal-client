<script setup lang="ts">
  import PasswordReset from '@/components/admin/PasswordReset.vue'
  
  /* this block is necessary to introduce a table header type to shut up typescript when defining table headers */
  import type { VDataTable } from 'vuetify/lib/labs/components.mjs'
  type UnwrapReadonlyArrayType<A> = A extends Readonly<Array<infer I>>
    ? UnwrapReadonlyArrayType<I>
    : A
  type DT = InstanceType<typeof VDataTable>
  type ReadonlyDataTableHeader = UnwrapReadonlyArrayType<DT['headers']>

  defineProps<{
    headers?: ReadonlyDataTableHeader[]
    items?: any[]
    loading?: boolean
    password?: string
  }>()

  const itemsPerPage = 25 as number

</script>

<template>
  <v-data-table
      class="elevation-1"
      data-testid="user-table"
      :headers="headers"
      :items="items"
      v-model:items-per-page="itemsPerPage"
      :update:itemsPerPage="$emit('onItemsPerPageUpdate', itemsPerPage)"
    >
      <template #[`item.person.name`]="{ item }"
        >{{ item.raw.person.name.vorname }} {{ item.raw.person.name.familienname }}</template
      >
      <template #[`item.actions`]="{ item }">
        <PasswordReset
          :item="item"
          @onClearPassword="$emit('onClearPassword')"
          @onResetPassword="$emit('onResetPassword', item.raw.person.id)"
          :password="password"
        >
        </PasswordReset>
      </template>
    </v-data-table>
</template>

<style>

</style>