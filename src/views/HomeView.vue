<script setup lang="ts">
  import { useProviderStore } from '@/stores/ProviderStore'

  const providerStore = useProviderStore()
  providerStore.getAllProviders()
  const providers = providerStore.allProviders
</script>

<template>
  <div class="home">
    <h1>This is gonna be the home page</h1>
    <v-row>
      <v-col
        v-for="provider in providers"
        :key="provider.id"
        cols="12"
      >
        <a :href="provider.url">
          <v-card
            :title="provider.name"
          >
          </v-card>
        </a>
      </v-col>
    </v-row>
  </div>
</template>

<style>
  
</style>
