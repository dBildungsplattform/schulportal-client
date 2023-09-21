<script setup lang="ts">
  import { getToken } from '@/services/auth/AuthService'
  import { ref } from 'vue'
  const userName = ref('')
  const password = ref('')
</script>

<template>
  <div class="login">
    <h1>This is a login page</h1>
    <v-sheet max-width="300" class="mx-auto">
    <v-form>
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
        @click.stop="getToken(userName, password)"
        block
        class="mt-2"
        :text="$t('login.button')"
      ></v-btn>
    </v-form>
  </v-sheet>
  </div>
</template>

<style></style>