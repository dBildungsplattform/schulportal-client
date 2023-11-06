<script setup lang="ts">
  import { RouterLink, useRoute } from 'vue-router'
  import { useAuthStore } from '@/stores/AuthStore'

  const route = useRoute()
  const auth = useAuthStore()
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
      @click.stop="() => auth.login(route.fullPath)"
      >{{ $t('nav.login') }}</v-btn
    >
    <v-spacer></v-spacer>
    <v-btn
      v-if="auth.isAuthed"
      @click.stop="auth.logout"
      >{{ $t('nav.logout') }}</v-btn
    >
    <v-spacer></v-spacer>
  </v-app-bar>
</template>
