<script setup lang="ts">
  import { usePersonStore, type PersonStore, type Personendatensatz } from '@/stores/PersonStore'
  import { onMounted } from 'vue'
  import ResultTable from '@/components/admin/ResultTable.vue'
  import { type Composer, useI18n } from 'vue-i18n'
  import type { VDataTableServer } from 'vuetify/lib/components/index.mjs'

  import { type Router, useRouter } from 'vue-router'

  const personStore: PersonStore = usePersonStore()

  const { t }: Composer = useI18n({ useScope: 'global' })

  type ReadonlyHeaders = InstanceType<typeof VDataTableServer>['headers']
  const headers: ReadonlyHeaders = [
    { title: t('user.lastName'), key: 'person.name.familienname', align: 'start' },
    { title: t('user.firstName'), key: 'person.name.vorname', align: 'start' }
  ]

  const router: Router = useRouter()

  function handleRowClick(_$event: PointerEvent, { item }: { item: Personendatensatz }): void {
    router.push({ name: 'user-details', params: { id: item.person.id } })
  }

  onMounted(async () => {
    await personStore.getAllPersons()
  })
</script>

<template>
  <div class="admin">
    <h1 class="text-center headline">{{ $t('admin.headline') }}</h1>
    <ResultTable
      :items="personStore.allPersons || []"
      :loading="personStore.loading"
      :headers="headers"
      @onHandleRowClick="handleRowClick"
      @onUpdateTable="personStore.getAllPersons()"
      :totalItems="personStore.totalPersons"
    ></ResultTable>
  </div>
</template>

<style></style>
