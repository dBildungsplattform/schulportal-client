<script setup lang="ts">
  import { usePersonStore } from '@/stores/PersonStore'
  import { onMounted, ref } from 'vue'
  import UserTable from '@/components/admin/UserTable.vue'

  const personStore = usePersonStore()
  
  const password = ref('')
  const errorCode = ref('')

  function resetPassword(userId: string) {
    personStore.resetPassword(userId).then((newPassword) => {
      password.value = newPassword ||''
    }).catch((error) => {
      errorCode.value = error.message
    }) || ''
  }

  onMounted(async () => {
    await personStore.getAllPersons()
  })
</script>

<template>
  <div class="admin">
    <h2>{{ $t('admin.user.management') }}</h2>
    <UserTable
      :errorCode="errorCode"
      :items="personStore.allPersons || []"
      :loading="personStore.loading"
      @onClearPassword="password = ''"
      @onResetPassword="resetPassword"
      @onUpdateTable="personStore.getAllPersons()"
      :password="password"
      :totalItems="personStore.allPersons.length"
    ></UserTable>
  </div>
</template>

<style></style>
