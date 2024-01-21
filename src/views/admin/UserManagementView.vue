<script setup lang="ts">
  import { usePersonStore, type PersonStore } from '@/stores/PersonStore'
  import { onMounted } from 'vue'
  import UserTable from '@/components/admin/UserTable.vue'

  const personStore: PersonStore = usePersonStore()

  onMounted(async () => {
    await personStore.getAllPersons()
  })

  const testPerson = {
    person: {
      id: '1',
      name: {
        familienname: 'Mustermann',
        vorname: 'Max'
      }
    },
    personenkontexte: [
      {
        id: 'context1'
      }
      // Add more contexts if needed
    ]
  }
</script>

<template>
  <div class="admin">
    <h1 class="text-center headline">{{ $t('admin.headline') }}</h1>
    <UserTable
      :items="[testPerson]"
      :loading="personStore.loading"
      @onUpdateTable="personStore.getAllPersons()"
      :totalItems="personStore.totalPersons"
    ></UserTable>
  </div>
</template>

<style></style>
