<script setup lang="ts">
  import { useRolleStore, type RolleResponse, type RolleStore } from '@/stores/RolleStore'
  import { computed, onMounted, type ComputedRef } from 'vue'
  import ResultTable from '@/components/admin/ResultTable.vue'
  import { type Composer, useI18n } from 'vue-i18n'
  import type { VDataTableServer } from 'vuetify/lib/components/index.mjs'
  import {
    OrganisationResponseTypEnum,
    useOrganisationStore,
    type Organisation,
    type OrganisationStore
  } from '@/stores/OrganisationStore'

  const rolleStore: RolleStore = useRolleStore()
  const organisationStore: OrganisationStore = useOrganisationStore()

  const { t }: Composer = useI18n({ useScope: 'global' })

  type ReadonlyHeaders = InstanceType<typeof VDataTableServer>['headers']
  const headers: ReadonlyHeaders = [
    { title: t('admin.schule.dienstellennummer'), key: 'kennung', align: 'start' },
    { title: t('admin.schule.schulname'), key: 'name', align: 'start' }
  ]

  const filteredOrganisationen: ComputedRef<Organisation[]> = computed(() => {
    // filter the organisations to only include the ones from Typ "Schule"
    return organisationStore.allOrganisationen.filter(
      (organisation: Organisation) => organisation.typ === OrganisationResponseTypEnum.Schule
    )
  })

  onMounted(async () => {
    await organisationStore.getAllOrganisationen()
  })
</script>

<template>
  <div class="admin">
    <h1 class="text-center headline">{{ $t('admin.headline') }}</h1>
    <ResultTable
      data-testid="role-table"
      :header="$t('admin.rolle.management')"
      :items="filteredOrganisationen || []"
      :loading="rolleStore.loading"
      :headers="headers"
      @onUpdateTable="rolleStore.getAllRollen()"
      :totalItems="rolleStore.allRollen.length"
      item-value-path="id"
      :disableRowClick="true"
    ></ResultTable>
  </div>
</template>

<style></style>
