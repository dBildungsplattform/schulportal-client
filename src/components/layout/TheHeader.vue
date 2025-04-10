<script setup lang="ts">
  import { type RouteLocationNormalizedLoaded, useRoute } from 'vue-router';
  import { useAuthStore, type AuthStore } from '@/stores/AuthStore';

  const route: RouteLocationNormalizedLoaded = useRoute();
  const auth: AuthStore = useAuthStore();
</script>

<template>
  <v-app-bar
    color="#001E49"
    data-testid="header"
    height="60"
  >
    <!-- Logo and title -->
    <v-app-bar-title class="fill-height">
      <v-row
        no-gutters
        class="align-center fill-height"
      >
        <v-col
          class="hidden-sm-and-down"
          cols="auto"
        >
          <router-link :to="auth.isAuthed ? '/start' : '/'">
            <img
              alt="Logo ErWIn Portal"
              src="@/assets/logos/erwin_logos/Logo-ErWIn-Portal-weiss.svg"
              width="354"
              height="60"
            />
          </router-link>
        </v-col>

        <!-- Hide this column on small screens and below -->
        <v-col
          cols="auto"
          class="hidden-md-and-up"
        >
          <router-link :to="auth.isAuthed ? '/start' : '/'">
            <img
              alt="Logo ErWIn Portal"
              src="@/assets/logos/erwin_logos/Logo-ErWIn-Portal-weiss.svg"
              width="33"
              height="33"
            />
          </router-link>
        </v-col>
      </v-row>
    </v-app-bar-title>
    <v-spacer></v-spacer>

    <v-toolbar-items>
      <v-col class="align-self-center mr-2">
        <a
          class="secondary"
          data-testid="help-button"
          href="https://www.bmbf.de/bmbf/de/forschung/zukunftsstrategie/foerderung-in-der-forschung/foerderung-in-der-forschung_node.html"
          rel="noopener noreferrer"
          target="_blank"
        >
          <v-icon
            class="hidden-md-and-up mr-2"
            icon="mdi-help-circle-outline"
          ></v-icon>
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
          :href="`/api/auth/login?redirectUrl=${route.fullPath}`"
        >
          <v-icon
            class="mr-2"
            icon="mdi-login"
          ></v-icon>
          <!-- Hide this on small screens and below -->
          <span class="hidden-sm-and-down">{{ $t('nav.login') }}</span>
        </a>
      </v-col>
    </v-toolbar-items>

    <v-toolbar-items v-if="auth.isAuthed">
      <v-col class="d-flex align-self-center mr-2">
        <a
          class="primary d-flex"
          data-testid="nav-profile-button"
          href="/profile"
        >
          <v-icon
            class="mr-2"
            icon="mdi-account-outline"
          ></v-icon>
          <span class="hidden-sm-and-down nowrap">{{ $t('nav.profile') }}</span>
        </a>
      </v-col>
      <v-col class="align-self-center mr-2 d-flex">
        <a
          class="primary d-flex"
          data-testid="nav-logout-button"
          href="/api/auth/logout"
        >
          <v-icon
            class="mr-2"
            icon="mdi-logout"
          ></v-icon>
          <span class="hidden-sm-and-down">{{ $t('nav.logout') }}</span>
        </a>
      </v-col>
    </v-toolbar-items>
  </v-app-bar>
</template>

<style scoped>
  .nowrap {
    white-space: nowrap;
  }
</style>