<script setup lang="ts">
  import { type RouteLocationNormalizedLoaded, RouterLink, useRoute } from 'vue-router'
  import { useAuthStore, type AuthStore } from '@/stores/AuthStore'

  const route: RouteLocationNormalizedLoaded = useRoute()
  const auth: AuthStore = useAuthStore()
</script>

<template>
  <v-app-bar :elevation="2">
    <v-spacer></v-spacer>
    <RouterLink to="/">{{ $t('nav.landing') }}</RouterLink>
    <v-spacer></v-spacer>
    <RouterLink
      to="/home"
      v-if="auth.isAuthed"
      >{{ $t('nav.home') }}</RouterLink
    >
    <v-spacer></v-spacer>
    <v-btn
      v-if="!auth.isAuthed"
      :href="`/api/frontend/login?redirectUrl=${route.fullPath}`"
      >{{ $t('nav.login') }}</v-btn
    >
    <v-spacer></v-spacer>
    <v-btn
      v-if="auth.isAuthed"
      class="secondary"
      href="/api/frontend/logout"
      >{{ $t('nav.logout') }}</v-btn
    >
    <v-spacer></v-spacer>
  </v-app-bar>
</template>
