<script setup lang="ts">
  import { usePersonStore } from '@/stores/PersonStore'
  import { ref } from 'vue'
  import UserTable from '@/components/admin/UserTable.vue'

  const personStore = usePersonStore()
  
  const password = ref('')
  
  let itemsPerPage = ref(25)

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
      :items="personStore.allPersons || []"
      :loading="personStore.loading"
      @onClearPassword="password = ''"
      @onItemsPerPageUpdate="updateItemsPerPage"
      @onResetPassword="resetPassword"
      @onUpdateTable="personStore.getAllPersons()"
      :password="password"
      :totalItems="personStore.allPersons.length"
    ></UserTable>
  </div>
</template>

<style></style>
