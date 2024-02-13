<script setup lang="ts">
  import { useServiceProviderStore, type ServiceProviderStore } from '@/stores/ServiceProviderStore'
  import ServiceProviderCard from '@/components/cards/ServiceProviderCard.vue'

  const serviceProviderStore: ServiceProviderStore = useServiceProviderStore()
  serviceProviderStore.getAllServiceProviders()
</script>

<template>
  <div class="home">
    <h2 class="text-h4">{{ $t('start.allServiceProviders') }}</h2>

    <v-progress-circular
      v-if="serviceProviderStore.loading"
      indeterminate
    ></v-progress-circular>

    <p
      v-if="serviceProviderStore.errorCode"
      class="text-caption text-left"
      data-testid="error-text"
    >
      {{ $t(`errors.${serviceProviderStore.errorCode}`) }}
    </p>

    <v-row v-else>
      <v-col
        v-for="serviceProvider in serviceProviderStore.allServiceProviders"
        cols="12"
        :key="serviceProvider.id"
        sm="6"
        md="4"
      >
        <ServiceProviderCard
          :href="serviceProvider.url"
          :newTab="true"
          :testId="`service-provider-card-${serviceProvider.id}`"
          :title="serviceProvider.name"
          variant="outlined"
        >
        </ServiceProviderCard>
      </v-col>
    </v-row>

    <h2 class="text-h4">{{ $t('start.administration') }}</h2>
    <v-row>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <ServiceProviderCard
          :testId="'service-provider-card-admin'"
          :to="'/admin/personen'"
          :title="$t('nav.admin')"
          variant="outlined"
        >
        </ServiceProviderCard>
      </v-col>
    </v-row>
  </div>
</template>

<style></style>
