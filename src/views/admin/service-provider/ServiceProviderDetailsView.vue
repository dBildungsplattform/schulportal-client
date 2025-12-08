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
  import { computed, onMounted, ref, type ComputedRef, type Ref } from 'vue';
  import SchulPortalLogo from '@/assets/logos/Schulportal_SH_Bildmarke_RGB_Anwendung_HG_Blau.svg';
  import LabeledField from '@/components/admin/LabeledField.vue';
  import ResultTable, { type Headers } from '@/components/admin/ResultTable.vue';

  const router: Router = useRouter();
  const route: RouteLocationNormalizedLoaded = useRoute();
  const { t }: Composer = useI18n({ useScope: 'global' });

  const serviceProviderStore: ServiceProviderStore = useServiceProviderStore();

  const currentServiceProviderId: string = route.params['id'] as string;

  type ReadonlyHeaders = Headers;
  const headers: ReadonlyHeaders = [
    { title: t('admin.schule.dienststellennummer'), key: 'kennung', align: 'start' },
    { title: t('admin.schule.schulname'), key: 'schule', align: 'start' },
    { title: t('angebot.erweiterteRollen'), key: 'rollenerweiterungen', align: 'start' },
  ];

  const rollenerweiterungPage: Ref<number> = ref(1);
  const rollenerweiterungPerPage: Ref<number> = ref(30);

  const isOpen: Ref<boolean> = ref(false);

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

  async function fetchRollenerweiterungen(): Promise<void> {
    await serviceProviderStore.getRollenerweiterungenById({
      id: currentServiceProviderId,
      offset: (rollenerweiterungPage.value - 1) * rollenerweiterungPerPage.value,
      limit: rollenerweiterungPerPage.value,
    });
  }

  function getPaginatedRollenerweiterungen(page: number): void {
    rollenerweiterungPage.value = page;
    fetchRollenerweiterungen();
  }

  function getPaginatedRollenerweiterungenWithLimit(limit: number): void {
    /* reset page to 1 if entries are equal to or less than selected limit */
    if (serviceProviderStore.rollenerweiterungen && serviceProviderStore.rollenerweiterungen.total <= limit) {
      rollenerweiterungPage.value = 1;
    }

    rollenerweiterungPerPage.value = limit;
    fetchRollenerweiterungen();
  }

  onMounted(async () => {
    serviceProviderStore.errorCode = '';
    serviceProviderStore.serviceProviderLogos.clear();

    await Promise.all([
      serviceProviderStore.getManageableServiceProviderById(currentServiceProviderId),
      serviceProviderStore.getServiceProviderLogoById(currentServiceProviderId),
      serviceProviderStore.getRollenerweiterungenById({ id: currentServiceProviderId }),
    ]);
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
                        :label="t('angebot.administrationsebene')"
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
                      :value="serviceProviderStore.currentServiceProvider.kategorie.toLocaleLowerCase()"
                      test-id="service-provider-kategorie"
                      no-margin-top
                      style="text-transform: capitalize"
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
                      :value="serviceProviderStore.currentServiceProvider.hasRollenerweiterung ? t('yes') : t('no')"
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
                    <span class="subtitle-2">{{ t('angebot.assignedRollen') }}:</span>
                  </v-col>

                  <v-col
                    class="d-flex align-center flex-wrap"
                    data-testid="service-provider-rollen"
                  >
                    <v-chip
                      v-for="rolle in serviceProviderStore.currentServiceProvider.rollen"
                      :key="rolle.id"
                      class="ma-1"
                      color="primary"
                      variant="tonal"
                    >
                      {{ rolle.name }}
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
        <div>
          <v-container class="schulspezifische-rollenerweiterungen">
            <v-divider
              class="border-opacity-100 rounded my-6 mx-4"
              color="#E5EAEF"
              thickness="6"
            ></v-divider>

            <!-- Header row + chevron -->
            <v-row
              class="ml-md-16"
              align="center"
              justify="space-between"
            >
              <v-col cols="auto">
                <h3
                  class="subtitle-1"
                  data-testid="schulspezifische-rollenerweiterungen-section-headline"
                >
                  {{ t('angebot.showSchulspezifischeRollenerweiterungen') }}
                </h3>
              </v-col>

              <!-- Vuetify chevron -->
              <v-col cols="auto">
                <v-btn
                  data-testid="open-schulspezifische-rollenerweiterungen-section-headline-button"
                  icon
                  variant="text"
                  size="small"
                  @click="isOpen = !isOpen"
                  :aria-expanded="isOpen.toString()"
                >
                  <v-icon
                    class="chevron"
                    :class="{ rotate: isOpen }"
                  >
                    mdi-chevron-down
                  </v-icon>
                </v-btn>
              </v-col>
            </v-row>

            <!-- Expandable table -->
            <v-row
              align="center"
              class="mx-16"
              justify="end"
            >
              <v-col cols="12">
                <v-expand-transition>
                  <div v-show="isOpen">
                    <ResultTable
                      ref="result-table"
                      data-testid="rollenerweiterungen-table"
                      :items="serviceProviderStore.rollenerweiterungenUebersicht || []"
                      :loading="serviceProviderStore.loading"
                      :headers="headers"
                      :hide-show-select="true"
                      item-value-path="id"
                      :total-items="serviceProviderStore.rollenerweiterungen?.total || 0"
                      :items-per-page="rollenerweiterungPerPage"
                      @on-items-per-page-update="getPaginatedRollenerweiterungenWithLimit"
                      @on-page-update="getPaginatedRollenerweiterungen"
                    >
                      <template #[`item.schule`]="{ item }">
                        <div
                          class="ellipsis-wrapper"
                          :title="item.schule"
                        >
                          {{ item.schule }}
                        </div>
                      </template>

                      <template #[`item.rollenerweiterungen`]="{ item }">
                        <div
                          class="ellipsis-wrapper"
                          :title="item.rollenerweiterungen"
                        >
                          {{ item.rollenerweiterungen }}
                        </div>
                      </template>
                    </ResultTable>
                  </div>
                </v-expand-transition>
              </v-col>
            </v-row>
          </v-container>
        </div>
      </div>
    </LayoutCard>
  </div>
</template>

<style scoped>
  @media (min-width: 1280px) and (max-width: 1600px) {
    .custom-offset {
      margin-left: 0 !important; /* removes the Vuetify offset */
    }
  }

  .chevron {
    transition: transform 200ms ease;
  }
  .chevron.rotate {
    transform: rotate(180deg);
  }
</style>
