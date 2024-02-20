<script setup lang="ts">
  import { useRolleStore, type RolleStore } from '@/stores/RolleStore'
  import { onMounted } from 'vue'
  import ResultTable from '@/components/admin/ResultTable.vue'
  import { type Composer, useI18n } from 'vue-i18n'
  import type { VDataTableServer } from 'vuetify/lib/components/index.mjs'

  const rolleStore: RolleStore = useRolleStore()

  const { t }: Composer = useI18n({ useScope: 'global' })

  type ReadonlyHeaders = InstanceType<typeof VDataTableServer>['headers']
  const headers: ReadonlyHeaders = [
    { title: t('admin.rolle.rollenname'), key: 'name', align: 'start' },
    {
      title: t('admin.rolle.schulstrukurknoten'),
      key: 'administeredBySchulstrukturknoten',
      align: 'start'
    },
    { title: t('admin.rolle.rollenart'), key: 'rollenart', align: 'start' },
    { title: t('admin.rolle.merkmale'), key: 'merkmale', align: 'start' }
  ]

  onMounted(async () => {
    await rolleStore.getAllRollen()
  })
</script>

<template>
  <div class="admin">
    <h1 class="text-center headline">{{ $t('admin.headline') }}</h1>
    <ResultTable
      :header="$t('admin.rolle.management')"
      :items="rolleStore.allRollen || []"
      :loading="rolleStore.loading"
      :headers="headers"
      @onUpdateTable="rolleStore.getAllRollen()"
      item-value-path="id"
    ></ResultTable>
  </div>
</template>

<style></style>
