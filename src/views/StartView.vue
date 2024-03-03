<script setup lang="ts">
  import {
    ServiceProviderKategorie,
    useServiceProviderStore,
    type ServiceProvider,
    type ServiceProviderStore,
  } from '@/stores/ServiceProviderStore';
  import ServiceProviderCard from '@/components/cards/ServiceProviderCard.vue';
  import { computed, type ComputedRef } from 'vue';

  const serviceProviderStore: ServiceProviderStore = useServiceProviderStore();
  serviceProviderStore.getAllServiceProviders();

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
</script>

<template>
  <v-card flat>
    <v-row class="flex-nowrap my-1 justify-center">
      <v-col cols="auto">
        <h2
          class="headline-1"
          data-testid="start-card-headline"
        >
          {{ $t('start.homePage') }}
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
      <template v-if="emailServiceProviders.length > 0">
        <v-row>
          <label class="mx-3">{{ $t('start.workEmail') }}</label>
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
            v-for="serviceProvider in emailServiceProviders"
            :key="serviceProvider.id"
            cols="12"
            sm="6"
            md="4"
          >
            <ServiceProviderCard
              :href="serviceProvider.url"
              :newTab="true"
              :testId="`service-provider-card-${serviceProvider.id}`"
              :title="serviceProvider.name"
              variant="outlined"
            ></ServiceProviderCard>
          </v-col>
        </v-row>
      </template>
      <!-- Categorie 2: Class -->
      <template v-if="classServiceProviders.length > 0">
        <v-row>
          <label class="mx-3">{{ $t('start.class') }}</label>
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
            v-for="serviceProvider in classServiceProviders"
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
      </template>
      <!-- Categorie 3: Administration -->
      <v-row>
        <label class="mx-3">{{ $t('start.administration') }}</label>
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
          v-for="serviceProvider in administrationServiceProviders"
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
        <!-- This provider is always available since it doesn't come from the backend -->
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
      <!-- Categorie 4: Hints -->
      <template v-if="hintsServiceProviders.length > 0">
        <v-row>
          <label class="mx-3">{{ $t('start.hints') }}</label>
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
            v-for="serviceProvider in hintsServiceProviders"
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
      </template>
      <!-- Categorie 5: School Offerings -->
      <template v-if="schoolOfferingsServiceProviders.length > 0">
        <v-row>
          <label class="mx-3">{{ $t('start.schoolOfferings') }}</label>
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
            v-for="serviceProvider in schoolOfferingsServiceProviders"
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
      </template>
    </template>
  </v-card>
</template>

<style></style>
