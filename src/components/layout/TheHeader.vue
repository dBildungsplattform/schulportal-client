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
    height="60"
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

    <v-toolbar-items>
      <v-col class="align-self-center mr-2">
        <a
          class="secondary"
          data-testid="help-button"
          href="https://medienberatung.iqsh.de/schulportal-sh.html"
          rel="noopener noreferrer"
          target="_blank"
        >
          <v-icon class="hidden-md-and-up" icon="mdi-help-circle-outline"></v-icon>
          <span class="hidden-sm-and-down">{{ $t('nav.help') }}</span>
        </a>
      </v-col>
    </v-toolbar-items>
  </v-app-bar>

  <v-app-bar
    color="#E5EAEF"
    height="40"
    :elevation="0"
  >
    <v-spacer></v-spacer>

    <v-toolbar-items v-if="!auth.isAuthed">
      <v-col class="align-self-center mr-2">
        <a
          class="primary"
          data-testid="nav-login-button"
          :href="`/api/frontend/login?redirectUrl=${route.fullPath}`"
        >
          <v-icon icon="mdi-login"></v-icon>
          <span class="hidden-sm-and-down">{{ $t('nav.login') }}</span>
        </a>
      </v-col>
    </v-toolbar-items>
    
    <v-toolbar-items v-if="auth.isAuthed">
      <v-col class="align-self-center mr-2">
        <a
          
          class="primary"
          data-testid="nav-logout-button"
          href="/api/frontend/logout"
        >
          <v-icon icon="mdi-logout"></v-icon>
          <span class="hidden-sm-and-down">{{ $t('nav.logout') }}</span>
        </a>
      </v-col>
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
