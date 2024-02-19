<script setup lang="ts">
  import { usePersonStore, type PersonStore } from '@/stores/PersonStore'
  import { onMounted } from 'vue'
  import ResultTable from '@/components/admin/ResultTable.vue'

  const personStore: PersonStore = usePersonStore()

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
      @onUpdateTable="personStore.getAllPersons()"
      :totalItems="personStore.totalPersons"
    ></ResultTable>
  </div>
</template>

<style></style>
