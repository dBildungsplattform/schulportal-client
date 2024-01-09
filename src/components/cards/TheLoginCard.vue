<script setup lang="ts">
  import SchulPortalLogo from '@/assets/logos/Schulportal_SH_Bildmarke_RGB_Anwendung_HG_Blau.svg'
  import { type RouteLocationNormalizedLoaded, useRoute } from 'vue-router'

  const route: RouteLocationNormalizedLoaded = useRoute()
</script>

<template>
  <v-container fluid>
    <v-card
      class="login-card"
      flat
    >
      <!-- Main title -->
      <v-row
        justify="center"
        no-gutters
      >
        <v-col cols="auto">
          <v-img
            alt="Schulportal logo"
            class="logo"
            :src="SchulPortalLogo"
            :width="50"
            :height="50"
          />
        </v-col>

        <v-card-title class="v-card-title">SCHULPORTAL SH </v-card-title>
      </v-row>

      <v-row
        justify="center"
        no-gutters
      >
        <v-col cols="auto">
          <!-- Subtitle/welcome message -->
          <v-card-text class="v-card-text"> {{ $t('login.title') }}</v-card-text>
        </v-col>
      </v-row>

      <!-- Login Button -->
      <v-row justify="center">
        <v-col
          cols="12"
          sm="8"
          md="6"
          class="d-flex justify-center"
        >
          <v-btn
            class="login-button"
            color="#001E49"
            :href="`/api/frontend/login?redirectUrl=${route.fullPath}`"
          >
            {{ $t('login.button') }}
          </v-btn>
        </v-col>
      </v-row>
    </v-card>
  </v-container>
</template>

<style scoped>
  .login-button {
    width: 15rem;
  }
  .login-card {
    padding: 6.25rem 0; /* Top and bottom padding */
  }

  .v-card-title {
    text-align: center;
    font-weight: bold;
    font-size: 2rem;
    font-family: Tahoma, Geneva, sans-serif;
    color: #001e49;
    margin-bottom: 1rem;
    margin-left: -1rem;
  }
  .v-card-text {
    text-align: center;
    font-size: 1rem;
    font-weight: bold;
    color: #001e49;
  }
</style>
