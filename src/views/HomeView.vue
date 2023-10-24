<script setup lang="ts">
  import { useProviderStore } from '@/stores/ProviderStore'
  import ProviderCard from '@/components/cards/ProviderCard.vue'

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
        <ProviderCard
          :href="provider.url"
          :newTab="true"
          :testId="`provider-card-${provider.id}`"
          :title="provider.name"
          variant="outlined"
        >
        </ProviderCard>
      </v-col>
    </v-row>
  </div>
</template>

<style></style>
