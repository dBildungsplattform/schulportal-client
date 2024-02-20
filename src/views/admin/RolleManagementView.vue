<script setup lang="ts">
  import {
    RolleResponseMerkmaleEnum,
    useRolleStore,
    type RolleResponse,
    type RolleStore
  } from '@/stores/RolleStore'
  import { computed, onMounted, type ComputedRef } from 'vue'
  import ResultTable from '@/components/admin/ResultTable.vue'
  import { type Composer, useI18n } from 'vue-i18n'
  import type { VDataTableServer } from 'vuetify/lib/components/index.mjs'

  const rolleStore: RolleStore = useRolleStore()

  const { t }: Composer = useI18n({ useScope: 'global' })

  type ReadonlyHeaders = InstanceType<typeof VDataTableServer>['headers']
  const headers: ReadonlyHeaders = [
    { title: t('admin.rolle.rollenname'), key: 'name', align: 'start' },
    { title: t('admin.rolle.rollenart'), key: 'rollenart', align: 'start' },
    { title: t('admin.rolle.merkmale'), key: 'merkmale', align: 'start' },
    {
      title: t('admin.rolle.schulstrukurknoten'),
      key: 'administeredBySchulstrukturknoten',
      align: 'start'
    }
  ]

  const transformedRollenAndMerkmale: ComputedRef<
    {
      rollenart: string
      merkmale: string
      id: string
      createdAt: string
      updatedAt: string
      name: string
      administeredBySchulstrukturknoten: string
    }[]
  > = computed(() => {
    return rolleStore.allRollen.map((rolle: RolleResponse) => {
      return {
        ...rolle,
        rollenart: t(`admin.rolle.mappingFrontBackEnd.rollenarten.${rolle.rollenart}`),
        merkmale: Array.from(rolle.merkmale)
          .map((merkmal: RolleResponseMerkmaleEnum) =>
            t(`admin.rolle.mappingFrontBackEnd.merkmale.${merkmal}`)
          )
          .join(', ')
      }
    })
  })

  onMounted(async () => {
    await rolleStore.getAllRollen()
  })
</script>

<template>
  <div class="admin">
    <h1 class="text-center headline">{{ $t('admin.headline') }}</h1>
    <ResultTable
      data-testid="role-table"
      :header="$t('admin.rolle.management')"
      :items="transformedRollenAndMerkmale || []"
      :loading="rolleStore.loading"
      :headers="headers"
      @onUpdateTable="rolleStore.getAllRollen()"
      item-value-path="id"
    ></ResultTable>
  </div>
</template>

<style></style>
