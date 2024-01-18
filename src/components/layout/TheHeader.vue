<script setup lang="ts">
  import { type RouteLocationNormalizedLoaded, useRoute } from 'vue-router'
  import { useAuthStore, type AuthStore } from '@/stores/AuthStore'
  import SchulPortalLogo from '@/assets/logos/Schulportal_SH_Bildmarke_RGB_Anwendung_HG_Blau.svg'

  const route: RouteLocationNormalizedLoaded = useRoute()
  const auth: AuthStore = useAuthStore()
</script>

<template>
  <v-app-bar
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
          <!-- Conditional rendering of logo link -->
          <router-link :to="auth.isAuthed ? '/start' : '/'">
            <v-img
              alt="SchulPortalLogo"
              :src="SchulPortalLogo"
              :width="30"
              :height="30"
            />
          </router-link>
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

    <v-toolbar-items>
      <v-btn
        data-testid="help-button"
        :href="'https://medienberatung.iqsh.de/schulportal-sh.html'"
        target="_blank"
        rel="noopener noreferrer"
      >
        <v-icon
          left
          class="hidden-md-and-up"
          >mdi-help</v-icon
        >
        <span class="hidden-sm-and-down">{{ $t('nav.help') }}</span></v-btn
      >
    </v-toolbar-items>
  </v-app-bar>

  <v-app-bar
    color="#E5EAEF"
    height="30"
    :elevation="0"
  >
    <v-spacer></v-spacer>

    <v-toolbar-items>
      <v-btn
        data-testid="nav-login-button"
        v-if="!auth.isAuthed"
        color="#001E49"
        :href="`/api/frontend/login?redirectUrl=${route.fullPath}`"
      >
        <template #prepend>
          <v-icon>mdi-login</v-icon>
        </template>
        <!-- Hide this on small screens and below -->
        <span class="hidden-sm-and-down">{{ $t('nav.login') }}</span>
      </v-btn>

      <v-btn
        data-testid="nav-logout-button"
        v-if="auth.isAuthed"
        color="#001E49"
        href="/api/frontend/logout"
      >
        <template #prepend>
          <v-icon>mdi-logout</v-icon>
        </template>
        {{ $t('nav.logout') }}
      </v-btn>
    </v-toolbar-items>
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
