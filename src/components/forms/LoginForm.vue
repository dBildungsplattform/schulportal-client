<script setup lang="ts">
  import { ref } from 'vue'

  const userName = ref('')
  const password = ref('')
</script>

<template>
  <div class="login">
    <v-sheet
      max-width="300"
      class="mx-auto"
    >
      <v-form @submit.prevent="$emit('on-submit', userName, password)">
        <v-text-field
          v-model="userName"
          :label="$t('login.username')"
          data-testid="username-input"
        ></v-text-field>
        <v-text-field
          v-model="password"
          type="password"
          :label="$t('login.password')"
          data-testid="password-input"
        ></v-text-field>

        <v-btn
          type="submit"
          block
          class="mt-2"
          :text="$t('login.button')"
          data-testid="login-button"
        ></v-btn>
      </v-form>
    </v-sheet>
  </div>
</template>

<style></style>
