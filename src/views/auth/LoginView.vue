<script setup lang="ts">
  import LoginForm from '@/components/forms/LoginForm.vue'
  import { useAuthStore } from '@/stores/AuthStore'

  function login(userName: string, password: string) {
    const authStore = useAuthStore()
    return authStore.login(userName, password).catch((error) => console.log(error))
  }
</script>

<template>
  <LoginForm @on-submit="login"></LoginForm>
</template>

<style></style>
