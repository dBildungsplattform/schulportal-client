<script setup lang="ts">
  import { useProviderStore } from '@/stores/ProviderStore'

  const providerStore = useProviderStore()
  // TODO: replace hardcoded personId with currentPersonId
  providerStore.getAllProviders('1')
</script>

<template>
  <div class="home">
    <h1>This is gonna be the home page</h1>
    <v-row>
      <v-col
        v-for="provider in providerStore.allProviders"
        :key="provider.id"
        cols="12"
        sm="6"
        md="4"
      >
          <v-card
            :href="provider.url"
            target="_blank"
            variant="outlined"
            :data-testid="`provider-card-${provider.id}`"
            :title="provider.name"
          >
            <template #prepend>
              <!-- this slot is a placeholder for the provider image -->
              <v-icon>mdi-home</v-icon>
            </template>
            <template #append>
              <v-icon @click.prevent>mdi-heart-outline</v-icon>
            </template>
          </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<style></style>
