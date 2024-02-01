<script setup lang="ts">
  import { usePersonStore, type PersonStore } from '@/stores/PersonStore'
  import { onMounted } from 'vue'
  import UserTable from '@/components/admin/UserTable.vue'

  const personStore: PersonStore = usePersonStore()

  onMounted(async () => {
    await personStore.getAllPersons()
  })
</script>

<template>
  <div class="admin">
    <h1 class="text-center headline">{{ $t('admin.headline') }}</h1>
    <RouterLink to="/admin/users/new">Neue Benutzer anlegen</RouterLink>
    <UserTable
      :items="personStore.allPersons || []"
      :loading="personStore.loading"
      @onUpdateTable="personStore.getAllPersons()"
      :totalItems="personStore.totalPersons"
    ></UserTable>
  </div>
</template>

<style></style>
