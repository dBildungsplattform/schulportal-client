<script setup lang="ts">
  import { usePersonStore, type PersonStore } from '@/stores/PersonStore'
  import { onMounted, type Ref, ref } from 'vue'
  import UserTable from '@/components/admin/UserTable.vue'

  const personStore: PersonStore = usePersonStore()

  const password: Ref<string> = ref('')
  const errorCode: Ref<string> = ref('')

  function resetPassword(userId: string): void {
    personStore
      .resetPassword(userId)
      .then((newPassword?: string) => {
        password.value = newPassword || ''
      })
      .catch((error: string) => {
        errorCode.value = error
      })
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
      :totalItems="personStore.totalPersons"
    ></UserTable>
  </div>
</template>

<style></style>
