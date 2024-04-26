<script setup lang="ts">
  import ServiceProviderCard from '@/components/cards/ServiceProviderCard.vue';
  import { type ServiceProvider } from '@/stores/ServiceProviderStore';

  defineProps<{
    categoryTitle: string;
    serviceProviders: Array<ServiceProvider>;
  }>();

  function getInternalServiceProviderUrl(target: string): string {
    if (target === 'SCHULPORTAL_ADMINISTRATION') return '/admin/personen';
    return '';
  }
</script>

<template>
  <template v-if="serviceProviders?.length">
    <v-row>
      <label class="mx-3">{{ categoryTitle }}</label>
      <v-col>
        <v-divider
          class="border-opacity-100 rounded"
          color="#E5EAEF"
          thickness="6"
        ></v-divider>
      </v-col>
    </v-row>
    <v-row>
      <v-col
        v-for="serviceProvider in serviceProviders"
        :key="serviceProvider.id"
        cols="12"
        sm="6"
        lg="4"
      >
        <ServiceProviderCard
          :href="
            serviceProvider.target === 'URL'
              ? serviceProvider.url
              : getInternalServiceProviderUrl(serviceProvider.target)
          "
          :newTab="serviceProvider.target === 'URL'"
          :testId="`service-provider-card-${serviceProvider.id}`"
          :title="serviceProvider.name"
          :logoUrl="serviceProvider.logoUrl"
        ></ServiceProviderCard>
      </v-col>
    </v-row>
  </template>
</template>
