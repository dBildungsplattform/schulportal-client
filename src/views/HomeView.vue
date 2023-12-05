<script setup lang="ts">
  import { useProviderStore, type ProviderStore } from '@/stores/ProviderStore'
  import ProviderCard from '@/components/cards/ProviderCard.vue'

  const providerStore: ProviderStore = useProviderStore()
  providerStore.getAllProviders()
</script>

<template>
  <div class="home">
    <h2 class="text-h4">{{ $t('home.allProviders') }}</h2>

    <v-progress-circular
      v-if="providerStore.loading"
      indeterminate
    ></v-progress-circular>

    <p
      v-if="providerStore.errorCode"
      class="text-caption text-left"
      data-testid="error-text"
    >
      {{ $t(`errors.${providerStore.errorCode}`) }}
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

    <h2 class="text-h4">{{ $t('home.administration') }}</h2>
    <v-row>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <ProviderCard
          :testId="'provider-card-admin'"
          :to="'/admin/users'"
          :title="$t('nav.admin')"
          variant="outlined"
        >
        </ProviderCard>
      </v-col>
    </v-row>
  </div>
</template>

<style></style>
