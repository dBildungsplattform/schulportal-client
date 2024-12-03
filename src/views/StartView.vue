<script setup lang="ts">
  import {
    ServiceProviderKategorie,
    useServiceProviderStore,
    type ServiceProvider,
    type ServiceProviderStore,
  } from '@/stores/ServiceProviderStore';
  import { computed, onMounted, type ComputedRef } from 'vue';
  import ServiceProviderCategory from '@/components/layout/ServiceProviderCategory.vue';
  import { useAuthStore, type AuthStore } from '@/stores/AuthStore';
  import {
    useTwoFactorAuthentificationStore,
    type TwoFactorAuthentificationStore,
  } from '@/stores/TwoFactorAuthentificationStore';

  const serviceProviderStore: ServiceProviderStore = useServiceProviderStore();
  const twoFactorAuthentificationStore: TwoFactorAuthentificationStore = useTwoFactorAuthentificationStore();
  const authStore: AuthStore = useAuthStore();

  function filterSortProviders(providers: ServiceProvider[], kategorie: ServiceProviderKategorie): ServiceProvider[] {
    return providers
      .filter((provider: ServiceProvider) => provider.kategorie === kategorie)
      .sort((a: ServiceProvider, b: ServiceProvider) => a.name.localeCompare(b.name));
  }

  // Filter service providers by category "EMAIL"
  const emailServiceProviders: ComputedRef<ServiceProvider[]> = computed(() =>
    filterSortProviders(serviceProviderStore.availableServiceProviders, ServiceProviderKategorie.Email),
  );
  // Filter service providers by category "UNTERRICHT"
  const classServiceProviders: ComputedRef<ServiceProvider[]> = computed(() =>
    filterSortProviders(serviceProviderStore.availableServiceProviders, ServiceProviderKategorie.Unterricht),
  );
  // Filter service providers by category "VERWALTUNG"
  const administrationServiceProviders: ComputedRef<ServiceProvider[]> = computed(() =>
    filterSortProviders(serviceProviderStore.availableServiceProviders, ServiceProviderKategorie.Verwaltung),
  );
  // Filter service providers by category "HINWEISE"
  const hintsServiceProviders: ComputedRef<ServiceProvider[]> = computed(() =>
    filterSortProviders(serviceProviderStore.availableServiceProviders, ServiceProviderKategorie.Hinweise),
  );
  // Filter service providers by category "ANGEBOTE"
  const schoolOfferingsServiceProviders: ComputedRef<ServiceProvider[]> = computed(() =>
    filterSortProviders(serviceProviderStore.availableServiceProviders, ServiceProviderKategorie.Angebote),
  );

  function getHasToken(): boolean {
    return twoFactorAuthentificationStore.hasToken ?? false;
  }

  onMounted(async () => {
    await authStore.initializeAuthStatus();
    const personId: string | null | undefined = authStore.currentUser?.personId;
    if (personId) await twoFactorAuthentificationStore.get2FAState(personId);
    await serviceProviderStore.getAvailableServiceProviders();
    for (const provider of serviceProviderStore.availableServiceProviders) {
      if (provider.hasLogo) {
        const logoUrl: string = `/api/provider/${provider.id}/logo`;
        provider.logoUrl = logoUrl;
      }
    }
    sessionStorage.setItem('previousUrl', window.location.pathname + window.location.search);
  });
</script>

<template>
  <v-card
    class="pr-3"
    flat
  >
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
        :hasToken="getHasToken()"
      ></ServiceProviderCategory>
      <!-- Categorie 2: Class -->
      <ServiceProviderCategory
        :categoryTitle="$t('start.categories.class')"
        :serviceProviders="classServiceProviders"
        :hasToken="getHasToken()"
      ></ServiceProviderCategory>
      <!-- Categorie 3: Administration -->
      <ServiceProviderCategory
        :categoryTitle="$t('start.categories.administration')"
        :serviceProviders="administrationServiceProviders"
        :hasToken="getHasToken()"
      ></ServiceProviderCategory>
      <!-- Categorie 4: Hints -->
      <ServiceProviderCategory
        :categoryTitle="$t('start.categories.hints')"
        :serviceProviders="hintsServiceProviders"
        :hasToken="getHasToken()"
      ></ServiceProviderCategory>
      <!-- Categorie 5: School Offerings -->
      <ServiceProviderCategory
        :categoryTitle="$t('start.categories.schoolOfferings')"
        :serviceProviders="schoolOfferingsServiceProviders"
        :hasToken="getHasToken()"
      ></ServiceProviderCategory>
    </template>
  </v-card>
</template>

<style></style>
