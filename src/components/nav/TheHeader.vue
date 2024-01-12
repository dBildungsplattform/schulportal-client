<script setup lang="ts">
  import { type RouteLocationNormalizedLoaded, useRoute } from 'vue-router'
  import { useAuthStore, type AuthStore } from '@/stores/AuthStore'
  import SchulPortalLogo from '@/assets/logos/Schulportal_SH_Bildmarke_RGB_Anwendung_HG_Blau.svg'

  const route: RouteLocationNormalizedLoaded = useRoute()
  const auth: AuthStore = useAuthStore()
</script>

<template>
  <v-app-bar
    :elevation="2"
    color="#001E49"
    height="40"
  >
    <!-- Logo and title -->
    <v-toolbar-title>
      <v-row no-gutters>
        <v-col
          cols="auto"
          class="mr-2"
        >
          <v-img
            alt="SchulPortalLogo"
            :src="SchulPortalLogo"
            :width="30"
            :height="30"
          />
        </v-col>

        <!-- Hide this column on small screens and below -->
        <v-col
          cols="auto"
          class="hidden-sm-and-down"
        >
          <div class="nav-title">SCHULPORTAL <span class="normal-weight">SH</span></div>
        </v-col>
      </v-row>
    </v-toolbar-title>
    <v-spacer></v-spacer>

    <!-- The link should be centralized somewhere else?-->
    <v-btn :href="'https://medienberatung.iqsh.de/schulportal-sh.html'">
      <v-icon
        left
        class="hidden-md-and-up"
        >mdi-help</v-icon
      >
      <span class="hidden-sm-and-down">{{ $t('nav.help') }}</span></v-btn
    >
  </v-app-bar>

  <v-app-bar
    color="#E5EAEF"
    height="30"
    :elevation="0"
  >
    <v-spacer></v-spacer>

    <v-btn
      v-if="!auth.isAuthed"
      color="#001E49"
      :href="`/api/frontend/login?redirectUrl=${route.fullPath}`"
    >
      <template #prepend>
        <v-icon>mdi-login</v-icon>
      </template>
      <span class="hidden-sm-and-down">{{ $t('nav.login') }}</span>
    </v-btn>

    <v-btn
      v-if="auth.isAuthed"
      color="#001E49"
      href="/api/frontend/logout"
    >
      <template #prepend>
        <v-icon>mdi-logout</v-icon>
      </template>
      {{ $t('nav.logout') }}
    </v-btn>
  </v-app-bar>
</template>

<style scoped>
  .nav-title {
    font-weight: 600;
  }
  .v-btn {
    text-transform: none;
  }
  .v-btn:hover {
    text-decoration: underline;
  }
</style>
