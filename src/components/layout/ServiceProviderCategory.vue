<script setup lang="ts">
  import ServiceProviderCard from '@/components/cards/ServiceProviderCard.vue';
  import { type AuthStore, StepUpLevel, useAuthStore } from '@/stores/AuthStore';
  import { type ServiceProvider } from '@/stores/ServiceProviderStore';

  const authStore: AuthStore = useAuthStore();
  const NO_SECOND_FACTOR: string = '/no-second-factor';

  const props: {
    categoryTitle: string;
    serviceProviders: Array<ServiceProvider>;
    hasToken: boolean;
  } = defineProps<{
    categoryTitle: string;
    serviceProviders: Array<ServiceProvider>;
    hasToken: boolean;
  }>();

  function getInternalServiceProviderUrl(target: string): string {
    if (target === 'SCHULPORTAL_ADMINISTRATION') {
      if (authStore.hasPersonenverwaltungPermission) {
        return '/admin/personen';
      }
      if (authStore.hasRollenverwaltungPermission) {
        return '/admin/rollen';
      }
      if (authStore.hasSchulverwaltungPermission) {
        return '/admin/schulen';
      }
      if (authStore.hasKlassenverwaltungPermission) {
        return '/admin/klassen';
      }
    }
    return '';
  }

  function computeUrlAndTab(serviceProvider: ServiceProvider): { url: string; newTab: boolean } {
    if (serviceProvider.target === 'URL') {
      if (serviceProvider.requires2fa && !props.hasToken && authStore.acr !== StepUpLevel.GOLD) {
        return { url: NO_SECOND_FACTOR, newTab: false };
      } else {
        return { url: serviceProvider.url, newTab: true };
      }
    }
    return { url: getInternalServiceProviderUrl(serviceProvider.target), newTab: false };
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
          :href="computeUrlAndTab(serviceProvider).url"
          :newTab="computeUrlAndTab(serviceProvider).newTab"
          :testId="`service-provider-card-${serviceProvider.id}`"
          :title="serviceProvider.name"
          :logoUrl="serviceProvider.logoUrl"
        ></ServiceProviderCard>
      </v-col>
    </v-row>
  </template>
</template>
