<script setup lang="ts">
  import { useServiceProviderStore, type ServiceProviderStore } from '@/stores/ServiceProviderStore';
  import { useI18n, type Composer } from 'vue-i18n';
  import { useRoute, useRouter, type RouteLocationNormalizedLoaded, type Router } from 'vue-router';
  import SpshAlert from '@/components/alert/SpshAlert.vue';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import { computed, onMounted, type ComputedRef } from 'vue';
  import SchulPortalLogo from '@/assets/logos/Schulportal_SH_Bildmarke_RGB_Anwendung_HG_Blau.svg';

  const router: Router = useRouter();
  const route: RouteLocationNormalizedLoaded = useRoute();
  const { t }: Composer = useI18n({ useScope: 'global' });

  const serviceProviderStore: ServiceProviderStore = useServiceProviderStore();

  const currentServiceProviderId: string = route.params['id'] as string;

  function navigateToServiceProviderTable(): void {
    router.push({ name: 'angebot-management' });
  }

  const handleAlertClose = (): void => {
    serviceProviderStore.errorCode = '';
    navigateToServiceProviderTable();
  };

  // Default for now - in the future when Edit functionality is added, this will have more error codes as cases to handle accordingly
  const alertButtonText: ComputedRef<string> = computed(() => {
    switch (serviceProviderStore.errorCode) {
      default:
        return t('nav.backToList');
    }
  });

  const alertButtonActionKopers: ComputedRef<() => void> = computed(() => {
    switch (serviceProviderStore.errorCode) {
      default:
        return navigateToServiceProviderTable;
    }
  });

  onMounted(async () => {
    serviceProviderStore.errorCode = '';
    serviceProviderStore.currentServiceProvider = null;
    serviceProviderStore.currentServiceProviderLogo = null;
    await serviceProviderStore.getManageableServiceProviderById(currentServiceProviderId);
    await serviceProviderStore.getServiceProviderLogoById(currentServiceProviderId);
  });
</script>

<template>
  <div class="admin">
    <h1
      class="text-center headline"
      data-testid="admin-headline"
    >
      {{ t('admin.headline') }}
    </h1>
    <LayoutCard
      :closable="!serviceProviderStore.errorCode"
      data-testid="service-provider-details-card"
      :header="t('admin.angebot.edit')"
      @onCloseClicked="navigateToServiceProviderTable"
      :padded="true"
      :showCloseText="true"
    >
      <v-container
        v-if="!!serviceProviderStore.errorCode"
        class="px-3 px-sm-16"
      >
        <v-container class="px-lg-16">
          <!-- Error Message Display if the serviceProviderStore throws any kind of error (Not being able to load the service provider) -->
          <SpshAlert
            :modelValue="!!serviceProviderStore.errorCode"
            :buttonText="alertButtonText"
            :buttonAction="alertButtonActionKopers"
            :closable="false"
            ref="service-provider-store-error-alert"
            :showButton="true"
            :text="t(`admin.service-provider.errors.${serviceProviderStore.errorCode}`)"
            :title="t(`admin.service-provider.title.${serviceProviderStore.errorCode}`)"
            :type="'error'"
            @update:modelValue="handleAlertClose"
          />
        </v-container>
      </v-container>

      <div v-if="!serviceProviderStore.errorCode">
        <v-container class="service-provider-info">
          <div v-if="serviceProviderStore.currentServiceProvider">
            <v-row id="service-provider-info-row">
              <v-col offset="1">
                <v-row>
                  <!-- Left column (first 4 fields) -->
                  <v-col
                    cols="12"
                    md="6"
                  >
                    <!-- Name -->
                    <v-row class="mt-4 align-center">
                      <v-col
                        cols="auto"
                        class="d-flex align-center pr-2"
                      >
                        <span class="subtitle-2">{{ t('angebot.name') }}:</span>
                      </v-col>
                      <v-col
                        cols="auto"
                        class="d-flex align-center"
                        data-testid="service-provider-name"
                      >
                        <span class="text-body text-break">
                          {{ serviceProviderStore.currentServiceProvider.name }}
                        </span>
                      </v-col>
                    </v-row>

                    <!-- Administrationsebene -->
                    <v-row class="mt-4 align-center">
                      <v-col
                        cols="auto"
                        class="d-flex align-center pr-2"
                      >
                        <span class="subtitle-2">{{ t('angebot.administrationsebene') }}:</span>
                      </v-col>
                      <v-col
                        cols="auto"
                        class="d-flex align-center"
                        data-testid="service-provider-administrationsebene"
                      >
                        <span class="text-body text-break">
                          {{ serviceProviderStore.currentServiceProvider.administrationsebene.name }}
                        </span>
                      </v-col>
                    </v-row>

                    <!-- Requires 2FA -->
                    <v-row class="mt-4 align-center">
                      <v-col
                        cols="auto"
                        class="d-flex align-center pr-2"
                      >
                        <span class="subtitle-2">{{ t('angebot.requires2FA') }}:</span>
                      </v-col>
                      <v-col
                        cols="auto"
                        class="d-flex align-center"
                        data-testid="service-provider-requires-2fa"
                      >
                        <span class="text-body text-break">
                          {{ serviceProviderStore.currentServiceProvider.requires2fa ? t('yes') : t('no') }}
                        </span>
                      </v-col>
                    </v-row>

                    <!-- Kategorie -->
                    <v-row class="mt-4 align-center">
                      <v-col
                        cols="auto"
                        class="d-flex align-center pr-2"
                      >
                        <span class="subtitle-2">{{ t('angebot.kategorie') }}:</span>
                      </v-col>
                      <v-col
                        cols="auto"
                        class="d-flex align-center"
                        data-testid="service-provider-kategorie"
                      >
                        <span class="text-body text-break">
                          {{ serviceProviderStore.currentServiceProvider.kategorie.toLocaleLowerCase() }}
                        </span>
                      </v-col>
                    </v-row>
                  </v-col>

                  <!-- Right column (last 3 fields) -->
                  <v-col
                    cols="12"
                    md="6"
                  >
                    <!-- Rollenerweiterung -->
                    <v-row class="mt-md-4 align-center">
                      <v-col
                        cols="auto"
                        class="d-flex align-center pr-2"
                      >
                        <span class="subtitle-2">{{ t('angebot.schulspezifischeRollenerweiterung') }}:</span>
                      </v-col>
                      <v-col
                        cols="auto"
                        class="d-flex align-center"
                        data-testid="service-provider-rollenerweiterung"
                      >
                        <span class="text-body text-break">
                          {{ serviceProviderStore.currentServiceProvider.hasRollenerweiterung ? t('yes') : t('no') }}
                        </span>
                      </v-col>
                    </v-row>

                    <!-- URL -->
                    <v-row class="mt-4 align-center">
                      <v-col
                        cols="auto"
                        class="d-flex align-center pr-2"
                      >
                        <span class="subtitle-2">{{ t('angebot.link') }}:</span>
                      </v-col>
                      <v-col
                        cols="auto"
                        class="d-flex align-center"
                        data-testid="service-provider-link"
                      >
                        <span class="text-body text-break">
                          {{
                            serviceProviderStore.currentServiceProvider.url
                              ? serviceProviderStore.currentServiceProvider.url
                              : t('missing')
                          }}
                        </span>
                      </v-col>
                    </v-row>

                    <!-- Logo -->
                    <v-row class="mt-4 align-center">
                      <v-col
                        cols="auto"
                        class="d-flex align-center pr-2"
                      >
                        <span class="subtitle-2">{{ t('angebot.logo') }}:</span>
                      </v-col>
                      <v-col
                        class="d-flex align-center"
                        data-testid="service-provider-logo"
                      >
                        <v-img
                          v-if="serviceProviderStore.currentServiceProviderLogo"
                          alt="provider-logo"
                          class="service-provider-logo"
                          :src="serviceProviderStore.currentServiceProviderLogo"
                          max-width="35"
                        />
                        <v-img
                          v-else
                          alt="schulportal-logo"
                          class="service-provider-logo"
                          :src="SchulPortalLogo"
                          contain
                          max-width="35"
                        />
                      </v-col>
                    </v-row>
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
          </div>

          <div v-else-if="serviceProviderStore.loading">
            <v-progress-circular indeterminate></v-progress-circular>
          </div>
        </v-container>
      </div>
    </LayoutCard>
  </div>
</template>
