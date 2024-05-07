<script setup lang="ts">
  import { type RouteLocationNormalizedLoaded, useRoute } from 'vue-router';

  const route: RouteLocationNormalizedLoaded = useRoute();
</script>

<template>
  <v-card
    class="login-card"
    data-testid="login-card"
    flat
  >
    <!-- Main title -->
    <v-row
      class="mb-5"
      justify="center"
      no-gutters
    >
      <v-col cols="auto">
        <img
          aria-hidden="true"
          alt="Logo Schulportal"
          class="logo"
          src="@/assets/logos/Schulportal_SH_Wort_Bildmarke_RGB_Anwendung_HG_Weiss.svg"
          width="540"
        />
      </v-col>
    </v-row>

    <v-row
      class="mb-7"
      justify="center"
      no-gutters
    >
      <v-col cols="auto">
        <!-- Subtitle/welcome message -->
        <h1
          class="headline-2"
          data-testid="landing-headline"
        >
          {{ $t('landingTitle') }}
        </h1>
      </v-col>
    </v-row>

    <!-- Login Button -->
    <v-row justify="center">
      <v-col
        cols="12"
        md="8"
        sm="6"
        class="d-flex justify-center"
      >
        <v-btn
          data-testid="login-button"
          class="primary"
          :href="`/api/auth/login?redirectUrl=${route.fullPath}`"
        >
          {{ $t('login.button') }}
        </v-btn>
      </v-col>
    </v-row>
  </v-card>
</template>

<style scoped>
  .login-card {
    padding: 6.25rem 0;
  }

  @media (max-width: 680px) {
    .logo {
      width: 100%;
      max-width: 380px;
    }
  }
</style>
