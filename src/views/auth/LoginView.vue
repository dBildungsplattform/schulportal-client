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
    :errorCode="authStore.errorCode"
    :loading="authStore.loading"
    @onSubmit="login"
  ></LoginForm>
</template>

<style></style>
