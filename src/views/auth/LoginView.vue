<script setup lang="ts">
  import { ref } from 'vue'
  import { useAuthStore } from '@/stores/AuthStore'

  const userName = ref('')
  const password = ref('')

  function login() {
    const authStore = useAuthStore()
    return authStore.login(userName.value, password.value).catch(error => console.log(error))
}
</script>

<template>
  <div class="login">
    <h1>This is a login page</h1>
    <v-sheet max-width="300" class="mx-auto">
    <v-form @submit.prevent="login">
      <v-text-field
        v-model="userName"
        :label="$t('login.username')"
      ></v-text-field>
      <v-text-field
        v-model="password"
        type="password"
        :label="$t('login.password')"
      ></v-text-field>

      <v-btn
        type="submit"
        block
        class="mt-2"
        :text="$t('login.button')"
      ></v-btn>
    </v-form>
  </v-sheet>
  </div>
</template>

<style></style>