<script setup lang="ts">
  import {
    ServiceProviderKategorie,
    useServiceProviderStore,
    type ServiceProvider,
    type ServiceProviderStore,
  } from '@/stores/ServiceProviderStore';
  import { computed, onBeforeMount, onMounted, ref, type ComputedRef, type Ref } from 'vue';
  import ServiceProviderCategory from '@/components/layout/ServiceProviderCategory.vue';
  import { useAuthStore, type AuthStore } from '@/stores/AuthStore';
  import {
    useTwoFactorAuthentificationStore,
    type TwoFactorAuthentificationStore,
  } from '@/stores/TwoFactorAuthentificationStore';
  import SpshBanner from '@/components/alert/SpshBanner.vue';
  import { useI18n } from 'vue-i18n';
  import { usePersonInfoStore, type PersonInfoStore } from '@/stores/PersonInfoStore';
  import { usePersonStore, type PersonStore } from '@/stores/PersonStore';
  import type { DBiamPersonenzuordnungResponse, PersonTimeLimitInfoResponse } from '@/api-client/generated';
  import { RollenMerkmal } from '@/stores/RolleStore';
  import { adjustDateForTimezoneAndFormat } from '@/utils/date';

  const { t }: { t: Function } = useI18n();

  export type Alert = {
    id: string;
    message: string;
    visible: boolean;
    type: 'error' | 'warning';
  };

  const personInfoStore: PersonInfoStore = usePersonInfoStore();
  const personStore: PersonStore = usePersonStore();
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

  const hasKoPersMerkmal: ComputedRef<boolean> = computed(() => {
    return (
      personStore.personenuebersicht?.zuordnungen.find((zuordnung: DBiamPersonenzuordnungResponse) => {
        return zuordnung.merkmale.includes(RollenMerkmal.KopersPflicht);
      }) !== undefined
    );
  });

  function getUrgencyType(date: Date): 'error' | 'warning' {
    const error: boolean = date.valueOf() < new Date().valueOf() + 14 * 24 * 60 * 60 * 1000;
    return error ? 'error' : 'warning';
  }

  function addAlert(alerts: Alert[], occasion: string, messageKey: string): void {
    const lockInfos: PersonTimeLimitInfoResponse[] = authStore.timeLimitInfos.filter(
      (info: PersonTimeLimitInfoResponse) => info.occasion === occasion,
    );
    lockInfos.forEach((lockInfo: PersonTimeLimitInfoResponse) => {
      const message: string = t(messageKey, {
        date: adjustDateForTimezoneAndFormat(lockInfo.deadline!),
        ...(occasion === 'PERSONENKONTEXT_EXPIRES' && { schule: lockInfo.school, rolle: lockInfo.rolle }),
      });

      const id: string = lockInfo.school
        ? `${lockInfo.occasion}_${lockInfo.school}_${lockInfo.rolle}`
        : lockInfo.occasion;

      alerts.push({
        id: id,
        message: message,
        visible: true,
        type: getUrgencyType(new Date(lockInfo.deadline!)),
      });
    });
  }

  function getBannerAlerts(): Alert[] {
    const alerts: Alert[] = [];

    if (!personInfoStore.personInfo?.person.personalnummer && hasKoPersMerkmal.value) {
      addAlert(alerts, 'KOPERS', 'banner.kopers');
    }

    addAlert(alerts, 'NO_KONTEXTE', 'banner.noKontexte');
    addAlert(alerts, 'PERSONENKONTEXT_EXPIRES', 'banner.kontextExpires');

    return alerts;
  }

  async function initializeStores(): Promise<void> {
    await authStore.initializeAuthStatus();
    await personInfoStore.initPersonInfo();
    await personStore.getPersonenuebersichtById(personInfoStore.personInfo?.person.id ?? '');
  }

  const closedAlerts: Ref<Set<string>> = ref(new Set());
  let alerts: Ref<Alert[]> = ref([]);

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

  onBeforeMount(async () => {
    await initializeStores();
    alerts.value = getBannerAlerts();
    const closedAlertsStr: string | null = sessionStorage.getItem('closedAlerts');
    if (closedAlertsStr) {
      closedAlerts.value = new Set(JSON.parse(closedAlertsStr));
      alerts.value.forEach((alert: Alert) => {
        if (closedAlerts.value.has(alert.id.toString())) {
          alert.visible = false;
        }
      });
    }
  });

  const dismissBannerForSession = (id: string): void => {
    alerts.value.find((alert: Alert) => alert.id === id)!.visible = false;
    closedAlerts.value.add(id);
    sessionStorage.setItem('closedAlerts', JSON.stringify(Array.from(closedAlerts.value)));
  };
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

    <v-row class="flex-nowrap mb-1 mt-1 justify-center">
      <v-col cols="12">
        <SpshBanner
          v-bind:key="alert.id"
          v-for="alert in alerts"
          :id="alert.id.toString()"
          ref="spsh-banner"
          :text="alert.message"
          :type="alert.type"
          :visible="alert.visible"
          @dismiss-banner="dismissBannerForSession"
        ></SpshBanner>
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
