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
        <v-col cols="auto">
          <v-card-title class="v-card-title"
            >SCHULPORTAL <span class="normal-weight">SH</span></v-card-title
          >
        </v-col>
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
          md="8"
          sm="6"
          class="d-flex justify-center"
        >
          <v-hover>
            <template v-slot:default="{ isHovering, props }">
              <v-btn
                v-bind="props"
                class="login-button"
                :color="isHovering ? '#325E91' : '#001E49'"
                :href="`/api/frontend/login?redirectUrl=${route.fullPath}`"
              >
                {{ $t('login.button') }}
              </v-btn>
            </template>
          </v-hover>
        </v-col>
      </v-row>
    </v-card>
  </v-container>
</template>

<style scoped>
  .login-button {
    max-width: 15rem; /* Max width instead of fixed width */
    width: 100%; /* Full width, capped by max-width */
    text-transform: none;
  }
  .login-card {
    padding: 6.25rem 0; /* Top and bottom padding */
  }

  .v-card-title {
    text-align: center;
    font-weight: bolder;
    font-size: 2rem;
    color: #001e49;
    margin-bottom: 1rem;
    margin-left: -1rem;
  }
  .v-card-text {
    text-align: center;
    font-size: 1rem;
    font-weight: bolder;
    color: #001e49;
  }
</style>
