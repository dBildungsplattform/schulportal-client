<script setup lang="ts">
  import { useProviderStore } from '@/stores/ProviderStore'

  const providerStore = useProviderStore()
  providerStore.getAllProviders()

  const errorCode = providerStore.errorCode
</script>

<template>
  <div class="home">
    <h1>{{ $t('home.allProviders') }}</h1>

    <v-progress-circular
      v-if="providerStore.loading"
      indeterminate
    ></v-progress-circular>

    <p
      v-if="errorCode"
      class="text-caption text-left"
      data-testid="error-text"
    >
      {{ $t(`errors.${errorCode}`) }}
    </p>

    <v-row v-else>
      <v-col
        v-for="provider in providerStore.allProviders"
        cols="12"
        :key="provider.id"
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
            <v-icon icon="mdi-home"></v-icon>
          </template>
          <template #append>
            <v-icon
              @click.prevent
              icon="mdi-heart-outline"
            ></v-icon>
          </template>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<style></style>
