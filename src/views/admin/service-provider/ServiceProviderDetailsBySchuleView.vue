<script setup lang="ts">
  import {
    ServiceProviderMerkmal,
    useServiceProviderStore,
    type ServiceProviderStore,
  } from '@/stores/ServiceProviderStore';
  import { useI18n, type Composer } from 'vue-i18n';
  import { useRoute, useRouter, type RouteLocationNormalizedLoaded, type Router } from 'vue-router';
  import SpshAlert from '@/components/alert/SpshAlert.vue';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import { computed, onMounted, type ComputedRef } from 'vue';
  import SchulPortalLogo from '@/assets/logos/Schulportal_SH_Bildmarke_RGB_Anwendung_HG_Blau.svg';
  import LabeledField from '@/components/admin/LabeledField.vue';
  import { useOrganisationStore, type OrganisationStore } from '@/stores/OrganisationStore';
  const router: Router = useRouter();
  const route: RouteLocationNormalizedLoaded = useRoute();
  const { t }: Composer = useI18n({ useScope: 'global' });

  const serviceProviderStore: ServiceProviderStore = useServiceProviderStore();
  const organisationStore: OrganisationStore = useOrganisationStore();

  const currentServiceProviderId: string = route.params['id'] as string;

  function navigateToServiceProviderBySchuleTable(): void {
    router.push({ name: 'angebot-management-schulspezifisch' });
  }

  const handleAlertClose = (): void => {
    serviceProviderStore.errorCode = '';
    navigateToServiceProviderBySchuleTable();
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
        return navigateToServiceProviderBySchuleTable;
    }
  });

  const organisationIdFromQuery: ComputedRef<string | undefined> = computed(
    () => route.query['orga'] as string | undefined,
  );

  onMounted(async () => {
    serviceProviderStore.errorCode = '';
    serviceProviderStore.serviceProviderLogos.clear();

    await Promise.all([
      serviceProviderStore.getManageableServiceProviderById(currentServiceProviderId),
      serviceProviderStore.getServiceProviderLogoById(currentServiceProviderId),
      serviceProviderStore.getRollenerweiterungenById({ id: currentServiceProviderId }),
    ]);

    // Restore filter context if missing
    if (!organisationStore.currentOrganisation && organisationIdFromQuery.value) {
      await organisationStore.getOrganisationById(organisationIdFromQuery.value);
    }
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
      data-testid="service-provider-details-by-schule-card"
      :header="`${t('admin.angebot.edit')} ${organisationStore.currentOrganisation?.name ?? ''}`"
      :header-hover-text="organisationStore.currentOrganisation?.name"
      @onCloseClicked="navigateToServiceProviderBySchuleTable"
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
              <v-col
                class="custom-offset"
                offset="1"
                offset-sm="1"
                offset-md="1"
                offset-lg="1"
              >
                <v-row>
                  <!-- Left column (first 4 fields) -->
                  <v-col
                    cols="12"
                    md="6"
                  >
                    <div class="compact-spacing">
                      <!-- Name -->
                      <LabeledField
                        :label="t('angebot.name')"
                        :value="serviceProviderStore.currentServiceProvider.name"
                        test-id="service-provider-name"
                      />

                      <!-- Administrationsebene -->
                      <LabeledField
                        :label="t('angebot.providedBy')"
                        :value="serviceProviderStore.currentServiceProvider.administrationsebene.name"
                        test-id="service-provider-administrationsebene"
                        no-margin-top
                      />

                      <!-- Requires 2FA -->
                      <LabeledField
                        :label="t('angebot.requires2FA')"
                        :value="serviceProviderStore.currentServiceProvider.requires2fa ? t('yes') : t('no')"
                        test-id="service-provider-requires-2fa"
                        no-margin-top
                      />

                      <!-- Can be assigned to Rollen? -->
                      <LabeledField
                        :label="t('angebot.canBeAssignedToRollen')"
                        :value="
                          serviceProviderStore.currentServiceProvider.merkmale.some(
                            (m: ServiceProviderMerkmal) => m === ServiceProviderMerkmal.NachtraeglichZuweisbar,
                          )
                            ? t('yes')
                            : t('no')
                        "
                        test-id="service-provider-can-be-assigned-to-rollen"
                        no-margin-top
                      />
                    </div>
                  </v-col>

                  <!-- Right column -->
                  <v-col
                    cols="12"
                    md="6"
                  >
                    <!-- Logo -->
                    <LabeledField
                      :label="t('angebot.logo')"
                      is-logo
                      :logo-src="serviceProviderStore.serviceProviderLogos.get(currentServiceProviderId)"
                      :default-logo-src="SchulPortalLogo"
                      test-id="service-provider-logo"
                      md-margin-top
                    />

                    <!-- Kategorie -->
                    <LabeledField
                      :label="t('angebot.kategorie')"
                      :value="
                        serviceProviderStore.currentServiceProvider.kategorie
                          ? t(`angebot.kategorien.${serviceProviderStore.currentServiceProvider.kategorie}`)
                          : t('missing')
                      "
                      test-id="service-provider-kategorie"
                      no-margin-top
                    />

                    <!-- URL -->
                    <LabeledField
                      :label="t('angebot.link')"
                      :value="serviceProviderStore.currentServiceProvider.url || t('missing')"
                      test-id="service-provider-link"
                      word-break-all
                      no-margin-top
                    />

                    <!-- Rollenerweiterung -->
                    <LabeledField
                      :label="t('angebot.schulspezifischeRollenerweiterung')"
                      :value="
                        serviceProviderStore.currentServiceProvider.availableForRollenerweiterung ? t('yes') : t('no')
                      "
                      test-id="service-provider-rollenerweiterung"
                      no-margin-top
                    />
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
            <v-divider
              class="border-opacity-100 rounded mt-16"
              color="#E5EAEF"
              thickness="6"
            ></v-divider>
            <v-row class="mt-n6">
              <v-col
                class="custom-offset"
                offset="1"
                offset-sm="1"
                offset-md="1"
                offset-lg="1"
              >
                <v-row class="mt-4 align-center">
                  <v-col
                    cols="auto"
                    class="d-flex align-center pr-2"
                  >
                    <span class="subtitle-2">{{ t('angebot.erweiterteRollenAnDerSchule') }}:</span>
                  </v-col>

                  <v-col
                    class="d-flex align-center flex-wrap"
                    data-testid="service-provider-rollenerweiterungen"
                  >
                    <span
                      class="text-body ml-n3"
                      v-if="serviceProviderStore.rollenerweiterungen?.items?.length === 0"
                      >{{ t('none') }}</span
                    >
                    <v-chip
                      else
                      v-for="rollenerweiterung in serviceProviderStore.rollenerweiterungen?.items"
                      :key="rollenerweiterung.rolleName"
                      class="ma-1"
                      color="primary"
                      variant="tonal"
                    >
                      {{ rollenerweiterung.rolleName }}
                    </v-chip>
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

<style scoped></style>
