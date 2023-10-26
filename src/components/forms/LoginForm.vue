<script setup lang="ts">
  import { ref } from 'vue'

  defineProps<{
    errorCode?: string
    loading?: boolean
  }>()

  const userName = ref('')
  const password = ref('')
</script>

<template>
  <v-sheet
    border="sm"
    class="login-form mx-auto text-center"
    max-width="300"
    rounded="lg"
  >
    <h2 class="h3 mb-4">{{ $t('login.header') }}</h2>
    <div v-if="errorCode">
      <v-row
        align="center"
        class="mb-1 text-error"
      >
        <v-col
          class="mr-3"
          cols="1"
        >
          <v-icon icon="mdi-alert-circle-outline"></v-icon>
        </v-col>
        <v-col>
          <p
            class="text-caption text-left"
            data-testid="error-text"
          >
            {{ $t(`errors.${errorCode}`) }}
          </p>
        </v-col>
      </v-row>
    </div>
    <v-form @submit.prevent="$emit('on-submit', userName, password)">
      <v-text-field
        base-color="#535353"
        class="mb-4"
        color="#535353"
        data-testid="username-input"
        hide-details
        :label="$t('login.username')"
        v-model="userName"
        variant="outlined"
      ></v-text-field>
      <v-text-field
        base-color="#535353"
        class="mb-2"
        color="#535353"
        data-testid="password-input"
        hide-details
        :label="$t('login.password')"
        type="password"
        v-model="password"
        variant="outlined"
      ></v-text-field>
      <p class="text-caption text-grey">
        {{ $t('login.forgotPassword') }}
      </p>

      <v-btn
        block
        class="mt-2"
        data-testid="login-button"
        :loading="loading"
        rounded="xs"
        size="large"
        :text="$t('login.button')"
        type="submit"
        variant="outlined"
      ></v-btn>
    </v-form>
  </v-sheet>
</template>

<style>
  .login-form {
    border-color: #535353 !important;
    padding: 33px 20px 24px;
  }
</style>
