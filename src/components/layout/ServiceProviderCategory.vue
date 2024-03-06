<script setup lang="ts">
  import ServiceProviderCard from '@/components/cards/ServiceProviderCard.vue';
  import { type ServiceProvider } from '@/stores/ServiceProviderStore';

  defineProps<{
    categoryTitle: string;
    serviceProviders: Array<ServiceProvider>;
  }>();
</script>

<template>
  <template v-if="serviceProviders?.length > 0">
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
        md="6"
        lg="4"
      >
        <ServiceProviderCard
          :href="serviceProvider.url"
          :newTab="true"
          :testId="`service-provider-card-${serviceProvider.id}`"
          :title="serviceProvider.name"
          :logoUrl="serviceProvider.logoUrl"
        ></ServiceProviderCard>
      </v-col>
    </v-row>
  </template>
</template>
