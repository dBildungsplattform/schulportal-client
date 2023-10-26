<script setup lang="ts">
  import LoginForm from '@/components/forms/LoginForm.vue'
  import { useAuthStore } from '@/stores/AuthStore'

  const authStore = useAuthStore()

  function login(userName: string, password: string) {
    authStore.login(userName, password)
  }
</script>

<template>
  <LoginForm
    @on-submit="login"
    :loading="authStore.loading"
    :errorCode="authStore.errorCode"
  ></LoginForm>
</template>

<style></style>
