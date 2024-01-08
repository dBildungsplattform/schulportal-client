<script setup lang="ts">
  import { type RouteLocationNormalizedLoaded, RouterLink, useRoute } from 'vue-router'
  import { useAuthStore, type AuthStore } from '@/stores/AuthStore'

  const route: RouteLocationNormalizedLoaded = useRoute()
  const auth: AuthStore = useAuthStore()
</script>

<template>
  <v-app-bar
    :elevation="2"
    color="#02093B"
    height="40"
  >
    <!-- Logo and title -->
    <v-toolbar-title class="d-flex align-center"> SCHULPORTAL SH </v-toolbar-title>
    <v-spacer></v-spacer>

    <v-btn> {{ $t('nav.help') }}</v-btn>
  </v-app-bar>

  <v-app-bar
    color="#ECEFF1"
    height="30"
  >
    <v-spacer></v-spacer>

    <v-btn
      v-if="!auth.isAuthed"
      :href="`/api/frontend/login?redirectUrl=${route.fullPath}`"
    >
      <template #prepend>
        <v-icon>mdi-login</v-icon>
      </template>
      {{ $t('nav.login') }}
    </v-btn>

    <v-btn
      v-else
      class="secondary"
      href="/api/frontend/logout"
    >
      <template #prepend>
        <v-icon>mdi-logout</v-icon>
      </template>
      {{ $t('nav.logout') }}
    </v-btn>
  </v-app-bar>
</template>
