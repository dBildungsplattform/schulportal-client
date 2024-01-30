<script setup lang="ts">
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
        class="mb-5"
        justify="center"
        no-gutters
      >
        <v-col cols="auto">
          <img
            alt="Logo Schulportal"
            class="logo"
            src="@/assets/logos/Schulportal_SH_Wort_Bildmarke_RGB_Anwendung_HG_Weiss.svg"
            width="598"
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
          <span class="headline-2"> {{ $t('login.title') }}</span>
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
  </v-container>
</template>

<style scoped>

  .login-card {
    padding: 6.25rem 0; /* Top and bottom padding */
  }
  
</style>
