<script setup lang="ts">
  import { ref } from 'vue'
  import LoginForm from '@/components/forms/LoginForm.vue'
  import { useAuthStore } from '@/stores/AuthStore'

  const errorCode = ref('')

  function login(userName: string, password: string) {
    const authStore = useAuthStore()
    return authStore.login(userName, password).catch((error) => {
      console.log(error?.response?.data.code)
      errorCode.value = error?.response?.data.code || 'UNSPECIFIED_ERROR'
    })
  }
</script>

<template>
  <LoginForm
    @on-submit="login"
    :errorCode="errorCode"
  ></LoginForm>
</template>

<style></style>
