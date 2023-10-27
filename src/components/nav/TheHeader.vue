<script setup lang="ts">
  import { RouterLink } from 'vue-router'
  import { useAuthStore } from '@/stores/AuthStore'

  const auth = useAuthStore()
</script>

<template>
  <v-app-bar :elevation="2">
    <v-spacer></v-spacer>
    <RouterLink to="/">{{ $t('nav.landing') }}</RouterLink>
    <v-spacer></v-spacer>
    <RouterLink
      to="/home"
      v-if="auth.user"
      >{{ $t('nav.home') }}</RouterLink
    >
    <v-spacer></v-spacer>
    <RouterLink
      to="/login"
      v-if="!auth.user"
      >{{ $t('nav.login') }}</RouterLink
    >
    <v-spacer></v-spacer>
    <v-btn
      class="secondary"
      @click.stop="auth.logout"
      v-if="auth.user"
    >
      {{ $t('nav.logout') }}
    </v-btn>
    <v-spacer></v-spacer>
  </v-app-bar>
</template>
