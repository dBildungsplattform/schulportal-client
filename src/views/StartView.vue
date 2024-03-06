<script setup lang="ts">
  import {
    ServiceProviderKategorie,
    useServiceProviderStore,
    type ServiceProvider,
    type ServiceProviderStore,
  } from '@/stores/ServiceProviderStore';
  import { computed, onMounted, type ComputedRef } from 'vue';
  import ServiceProviderCard from '@/components/cards/ServiceProviderCard.vue';
  import ServiceProviderCategory from '@/components/providers/ServiceProviderCategory.vue';

  const serviceProviderStore: ServiceProviderStore = useServiceProviderStore();

  // Filter service providers by category "EMAIL"
  const emailServiceProviders: ComputedRef<ServiceProvider[]> = computed(() => {
    return serviceProviderStore.allServiceProviders.filter(
      (provider: ServiceProvider) => provider.kategorie === ServiceProviderKategorie.Email,
    );
  });
  // Filter service providers by category "UNTERRICHT"
  const classServiceProviders: ComputedRef<ServiceProvider[]> = computed(() => {
    return serviceProviderStore.allServiceProviders.filter(
      (provider: ServiceProvider) => provider.kategorie === ServiceProviderKategorie.Unterricht,
    );
  });
  // Filter service providers by category "VERWALTUNG"
  const administrationServiceProviders: ComputedRef<ServiceProvider[]> = computed(() => {
    return serviceProviderStore.allServiceProviders.filter(
      (provider: ServiceProvider) => provider.kategorie === ServiceProviderKategorie.Verwaltung,
    );
  });
  // Filter service providers by category "HINWEISE"
  const hintsServiceProviders: ComputedRef<ServiceProvider[]> = computed(() => {
    return serviceProviderStore.allServiceProviders.filter(
      (provider: ServiceProvider) => provider.kategorie === ServiceProviderKategorie.Hinweise,
    );
  });
  // Filter service providers by category "ANGEBOTE"
  const schoolOfferingsServiceProviders: ComputedRef<ServiceProvider[]> = computed(() => {
    return serviceProviderStore.allServiceProviders.filter(
      (provider: ServiceProvider) => provider.kategorie === ServiceProviderKategorie.Angebote,
    );
  });

  onMounted(async () => {
    await serviceProviderStore.getAllServiceProviders();
    for (const provider of serviceProviderStore.allServiceProviders) {
      if (provider.hasLogo) {
        const logoUrl: string = `/api/provider/${provider.id}/logo`;
        provider.logoUrl = logoUrl;
      }
    }
  });
</script>

<template>
  <v-card flat>
    <v-row class="flex-nowrap mb-1 justify-center">
      <v-col cols="auto">
        <h2
          class="headline-1"
          data-testid="start-card-headline"
        >
          {{ $t('start.categories.homePage') }}
        </h2>
      </v-col>
    </v-row>
    <v-divider
      class="border-opacity-100 rounded"
      color="#1EAE9C"
      thickness="5px"
    ></v-divider>
    <v-row class="flex-nowrap my-3">
      <v-col cols="auto">
        <h2
          class="headline-2"
          data-testid="all-service-provider-title"
        >
          {{ $t('start.allServiceProviders') }}
        </h2>
      </v-col>
    </v-row>
    <!-- Template to be displayed in case the providers are still being loaded -->
    <template v-if="serviceProviderStore.loading">
      <v-progress-circular indeterminate></v-progress-circular>
    </template>
    <!-- Template to be displayed in case loading the providers throws an error -->
    <template v-else-if="serviceProviderStore.errorCode">
      <p
        class="text-caption text-left"
        data-testid="error-text"
      >
        {{ $t(`errors.${serviceProviderStore.errorCode}`) }}
      </p>
    </template>
    <!-- Template to be displayed in case of no error nor loading -->
    <template v-else>
      <!-- Categorie 1: Work Email -->
      <ServiceProviderCategory
        :categoryTitle="$t('start.categories.workEmail')"
        :serviceProviders="emailServiceProviders"
      ></ServiceProviderCategory>
      <!-- Categorie 2: Class -->
      <ServiceProviderCategory
        :categoryTitle="$t('start.categories.class')"
        :serviceProviders="classServiceProviders"
      ></ServiceProviderCategory>
      <!-- Categorie 3: Administration -->
      <ServiceProviderCategory
        :categoryTitle="$t('start.categories.administration')"
        :serviceProviders="administrationServiceProviders"
      >
        <!-- This provider is always available for now and doesn't come from the backend so it's passed inside the slot -->
        <ServiceProviderCard
          :testId="'service-provider-card-admin'"
          :to="'/admin/personen'"
          :title="$t('nav.admin')"
        >
        </ServiceProviderCard>
      </ServiceProviderCategory>
      <!-- Categorie 4: Hints -->
      <ServiceProviderCategory
        :categoryTitle="$t('start.categories.hints')"
        :serviceProviders="hintsServiceProviders"
      ></ServiceProviderCategory>
      <!-- Categorie 5: School Offerings -->
      <ServiceProviderCategory
        :categoryTitle="$t('start.categories.schoolOfferings')"
        :serviceProviders="schoolOfferingsServiceProviders"
      ></ServiceProviderCategory>
    </template>
  </v-card>
</template>

<style></style>
