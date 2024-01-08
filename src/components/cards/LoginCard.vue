<template>
  <v-card
    class="login-card"
    flat
  >
    <v-card-title class="v-card-title" >SCHULPORTAL SH</v-card-title>
    <v-card-subtitle class="v-card-subtitle">Willkommen im Schulportal SH.</v-card-subtitle>
    <v-row justify="center">
      <v-col
        cols="12"
        sm="8"
        md="6"
      >
        <div class="login-button">
          <v-btn
            depressed
            color="#1A237E"
            class="white--text mb-4"
          >
            Anmelden
          </v-btn>
        </div>
      </v-col>
    </v-row>
  </v-card>
</template>

<script setup lang="ts">
  // Script setup remains the same if you have no additional logic to add
</script>

<style scoped>
  .login-card {
    padding: 40px 0; /* Top and bottom padding */
    border-radius: 0; /* No rounded corners for the card */
  }

  .v-card-title {
    text-align: center;
    font-weight: bold;
    font-size: 2rem;
    color: #02093B
;
    
  }
  .v-card-subtitle {
    text-align: center;
    font-size: 1.2rem;
    font-weight: bold;
  }

  .login-button {
    text-align: center;
    width: 100%;
    display: inline-block;
  }
  /* You might not need .main-title anymore unless you want to add more specific styles */
</style>
