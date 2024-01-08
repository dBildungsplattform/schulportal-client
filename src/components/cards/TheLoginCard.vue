<script setup lang="ts">
   import SchulPortalLogo from "@/assets/logos/Schulportal_SH_Bildmarke_RGB_Anwendung_HG_Blau.svg"
   import { type RouteLocationNormalizedLoaded, useRoute } from 'vue-router'

   const route: RouteLocationNormalizedLoaded = useRoute()
</script>

<template>
  <v-card
    class="login-card"
    flat
  >
    <!-- Main title -->
    <v-row justify="center" no-gutters>
        <v-col cols="auto" > 
          <v-img alt="Schulportal logo" class="logo" :src="SchulPortalLogo" :width="50" :height="50"/> 
        </v-col>

       <v-card-title class="v-card-title" >SCHULPORTAL SH </v-card-title>
    </v-row>

    <v-row justify="center" no-gutters>
      <v-col cols="auto">
      <!-- Subtitle/welcome message -->
      <v-card-text class="v-card-text">Willkommen im Schulportal SH.</v-card-text>
      </v-col>
    
    </v-row>
   
    <!-- Login Button -->
    <v-row justify="center">
      <v-col
        cols="12"
        sm="8"
        md="6"
      >
        <v-btn 
            depressed
            color="#001E49"
            justify="center"
            block
            :href="`/api/frontend/login?redirectUrl=${route.fullPath}`"
            >
            {{ $t('nav.login') }}
        </v-btn>
        
      </v-col>
    </v-row>
  </v-card>
</template>


<style scoped>
  .login-card {
    padding: 100px 0; /* Top and bottom padding */
  }

  .v-card-title {
    text-align: center;
    font-weight: bold;
    font-size: 2rem;
    font-family: Tahoma, Geneva, sans-serif;
    color: #001E49;   
    margin-bottom: 1rem;
    margin-left: -1rem;
  }
  .v-card-text {
    text-align: center;
    font-size: 1rem;
    font-weight: bold;
    color: #001E49;
    margin-left: 2rem;
  }
</style>
