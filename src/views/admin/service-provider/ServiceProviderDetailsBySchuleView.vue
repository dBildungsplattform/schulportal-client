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
  import { useOrganisationStore, type OrganisationStore } from '@/stores/OrganisationStore';
  import {
    RollenArt,
    useRolleStore,
    type RolleStore,
    type RolleWithServiceProvidersResponse,
  } from '@/stores/RolleStore';
  import RollenerweiterungTreeview, {
    type RolleForSelection,
  } from '@/components/serviceProvider/RollenerweiterungTreeview.vue';
  import { RollenSystemRechtEnum } from '@/api-client/generated';

  const router: Router = useRouter();
  const route: RouteLocationNormalizedLoaded = useRoute();
  const { t }: Composer = useI18n({ useScope: 'global' });

  const serviceProviderStore: ServiceProviderStore = useServiceProviderStore();
  const organisationStore: OrganisationStore = useOrganisationStore();
  const rolleStore: RolleStore = useRolleStore();

  const currentServiceProviderId: string = route.params['id'] as string;

  // ── Edit mode state ────────────────────────────────────────────────────────
  const isEditingRollenerweiterungen: Ref<boolean> = ref(false);
  const selectedRolleIds: Ref<string[]> = ref([]);
  const isSaving: Ref<boolean> = ref(false);

  function navigateToServiceProviderBySchuleTable(): void {
    router.push({ name: 'angebot-management-schulspezifisch' });
  }

  const handleAlertClose = (): void => {
    serviceProviderStore.errorCode = '';
    navigateToServiceProviderBySchuleTable();
  };

  const alertButtonText: ComputedRef<string> = computed(() => {
    switch (serviceProviderStore.errorCode) {
      default:
        return t('nav.backToList');
    }
  });

  const alertButtonAction: ComputedRef<() => void> = computed(() => {
    switch (serviceProviderStore.errorCode) {
      default:
        return navigateToServiceProviderBySchuleTable;
    }
  });

  const errorTitle: ComputedRef<string> = computed(() => {
    return serviceProviderStore.errorCode === 'UNSPECIFIED_ERROR'
      ? t('angebot.loadingErrorTitle')
      : t(`angebot.title.${serviceProviderStore.errorCode}`);
  });

  const errorText: ComputedRef<string> = computed(() => {
    return serviceProviderStore.errorCode === 'UNSPECIFIED_ERROR'
      ? t('angebot.loadingErrorText')
      : t(`angebot.errors.${serviceProviderStore.errorCode}`);
  });

  const organisationIdFromQuery: ComputedRef<string | undefined> = computed(
    () => route.query['orga'] as string | undefined,
  );

  // ── Derived data ──────────────────────────────────────────────────────────
  const existingRolleIds: ComputedRef<string[]> = computed(
    () => serviceProviderStore.rollenerweiterungen?.items?.map((item: { rolleId: string }) => item.rolleId) ?? [],
  );

  const availableRollen: ComputedRef<RolleForSelection[]> = computed(() =>
    (rolleStore.allRollen ?? [])
      .filter((r: RolleWithServiceProvidersResponse) =>
        ([RollenArt.Lehr, RollenArt.Lern, RollenArt.Leit] as RollenArt[]).includes(r.rollenart),
      )
      .map((r: RolleWithServiceProvidersResponse) => ({ id: r.id, name: r.name, rollenart: r.rollenart })),
  );

  // ── Edit mode actions ─────────────────────────────────────────────────────
  async function openEditMode(): Promise<void> {
    // Load available rollen for this organisation if not yet loaded
    if (organisationIdFromQuery.value) {
      await rolleStore.getAllRollen({
        organisationId: organisationIdFromQuery.value,
        systemrecht: RollenSystemRechtEnum.RollenErweitern,
      });
    }
    selectedRolleIds.value = [...existingRolleIds.value];
    isEditingRollenerweiterungen.value = true;
  }

  function cancelEdit(): void {
    isEditingRollenerweiterungen.value = false;
    selectedRolleIds.value = [];
  }

  async function saveRollenerweiterungen(): Promise<void> {
    if (!organisationIdFromQuery.value) {
      return;
    }

    isSaving.value = true;

    const existingSet: Set<string> = new Set(existingRolleIds.value);
    const selectedSet: Set<string> = new Set(selectedRolleIds.value);

    const addErweiterungenForRolleIds: string[] = [...selectedSet].filter((id: string) => !existingSet.has(id));
    const removeErweiterungenForRolleIds: string[] = [...existingSet].filter((id: string) => !selectedSet.has(id));

    await serviceProviderStore.persistRollenerweiterungenForServiceProvider({
      serviceProviderId: currentServiceProviderId,
      organisationId: organisationIdFromQuery.value,
      addErweiterungenForRolleIds,
      removeErweiterungenForRolleIds,
    });

    isSaving.value = false;

    if (!serviceProviderStore.errorCode) {
      isEditingRollenerweiterungen.value = false;
      // Refresh rollenerweiterungen to reflect saved state
      await serviceProviderStore.getRollenerweiterungenById({
        serviceProviderId: currentServiceProviderId,
        organisationId: organisationIdFromQuery.value,
      });
    }
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  onMounted(async () => {
    serviceProviderStore.errorCode = '';
    serviceProviderStore.serviceProviderLogos.clear();

    await Promise.all([
      serviceProviderStore.getManageableServiceProviderById(currentServiceProviderId),
      serviceProviderStore.getServiceProviderLogoById(currentServiceProviderId),
      serviceProviderStore.getRollenerweiterungenById({
        serviceProviderId: currentServiceProviderId,
        organisationId: organisationIdFromQuery.value,
      }),
    ]);

    if (!organisationStore.currentOrganisation && organisationIdFromQuery.value) {
      await organisationStore.getOrganisationById(organisationIdFromQuery.value);
    }
  });
</script>

<template>
  <div>
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
          <SpshAlert
            :modelValue="!!serviceProviderStore.errorCode"
            :buttonText="alertButtonText"
            :buttonAction="alertButtonAction"
            :closable="false"
            ref="service-provider-store-error-alert"
            :showButton="true"
            :text="errorText"
            :title="errorTitle"
            :type="'error'"
            @update:modelValue="handleAlertClose"
          />
        </v-container>
      </v-container>

      <template v-if="!serviceProviderStore.errorCode">
        <v-container>
          <template v-if="serviceProviderStore.currentServiceProvider">
            <v-row data-testid="service-provider-info-row">
              <v-col
                offset="1"
                offset-sm="1"
                offset-md="1"
                offset-lg="1"
              >
                <v-row>
                  <!-- Left column -->
                  <v-col
                    cols="12"
                    md="6"
                  >
                    <div>
                      <LabeledField
                        :label="t('angebot.name')"
                        :value="serviceProviderStore.currentServiceProvider.name"
                        test-id="service-provider-name"
                      />
                      <LabeledField
                        :label="t('angebot.providedBy')"
                        :value="serviceProviderStore.currentServiceProvider.administrationsebene.name"
                        test-id="service-provider-administrationsebene"
                        no-margin-top
                      />
                      <LabeledField
                        :label="t('angebot.requires2FA')"
                        :value="serviceProviderStore.currentServiceProvider.requires2fa ? t('yes') : t('no')"
                        test-id="service-provider-requires-2fa"
                        no-margin-top
                      />
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
                    <LabeledField
                      :label="t('angebot.logo')"
                      is-logo
                      :logo-src="serviceProviderStore.serviceProviderLogos.get(currentServiceProviderId)"
                      :default-logo-src="SchulPortalLogo"
                      test-id="service-provider-logo"
                      md-margin-top
                    />
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
                    <LabeledField
                      :label="t('angebot.link')"
                      :value="serviceProviderStore.currentServiceProvider.url || t('missing')"
                      test-id="service-provider-link"
                      word-break-all
                      no-margin-top
                    />
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
              class="border-opacity-100 rounded mt-16 mb-0 pb-0"
              color="#E5EAEF"
              thickness="6"
            />

            <!-- ── Rollenerweiterungen section ──────────────────────────────── -->
            <v-row>
              <v-col
                offset="1"
                offset-sm="1"
                offset-md="1"
                offset-lg="1"
              >
                <!-- Section header row: label + chips + edit button -->
                <v-row
                  class="mt-4 align-center"
                  :class="{ 'mb-4': isEditingRollenerweiterungen }"
                >
                  <v-col
                    v-if="!isEditingRollenerweiterungen"
                    cols="auto"
                    class="d-flex align-center pr-0"
                  >
                    <span class="subtitle-2">{{ t('angebot.erweiterteRollenAnDerSchule') }}:</span>
                  </v-col>

                  <!-- Read-only chips (hidden while editing) -->
                  <v-col
                    v-if="!isEditingRollenerweiterungen"
                    class="d-flex align-center flex-wrap"
                    data-testid="service-provider-rollenerweiterungen"
                  >
                    <span
                      v-if="serviceProviderStore.rollenerweiterungen?.items?.length === 0"
                      class="text-body"
                    >
                      {{ t('none') }}
                    </span>
                    <v-chip
                      v-for="rollenerweiterung in serviceProviderStore.rollenerweiterungen?.items"
                      :key="rollenerweiterung.rolleName"
                      class="ma-1"
                      color="primary"
                      variant="tonal"
                    >
                      {{ rollenerweiterung.rolleName }}
                    </v-chip>
                  </v-col>

                  <!-- Bearbeiten button (only when not editing and rollenerweiterung is available) -->
                  <v-col
                    v-if="
                      !isEditingRollenerweiterungen &&
                      serviceProviderStore.currentServiceProvider.availableForRollenerweiterung
                    "
                    cols="auto"
                    class="d-flex align-center pl-2"
                  >
                    <v-btn
                      class="primary"
                      data-testid="rollenerweiterung-bearbeiten-button"
                      @click="openEditMode"
                    >
                      {{ t('edit') }}
                    </v-btn>
                  </v-col>
                </v-row>

                <!-- Inline treeview (shown while editing) -->
                <v-expand-transition>
                  <div v-if="isEditingRollenerweiterungen">
                    <RollenerweiterungTreeview
                      :available-rollen="availableRollen"
                      :initially-selected-rolle-ids="existingRolleIds"
                      :loading="rolleStore.loading"
                      @update:selectedRolleIds="selectedRolleIds = $event"
                    />

                    <!-- Save / Cancel actions -->
                    <v-row
                      class="mt-4"
                      justify="end"
                    >
                      <v-col cols="auto">
                        <v-btn
                          class="mr-2 secondary"
                          :disabled="isSaving"
                          variant="text"
                          data-testid="rollenerweiterung-cancel-button"
                          @click="cancelEdit"
                        >
                          {{ t('cancel') }}
                        </v-btn>
                        <v-btn
                          color="primary"
                          data-testid="rollenerweiterung-save-button"
                          :disabled="rolleStore.loading"
                          :loading="isSaving"
                          variant="elevated"
                          @click="saveRollenerweiterungen"
                        >
                          {{ t('save') }}
                        </v-btn>
                      </v-col>
                    </v-row>
                  </div>
                </v-expand-transition>
              </v-col>
            </v-row>
          </template>

          <template v-else-if="serviceProviderStore.loading">
            <v-progress-circular indeterminate />
          </template>
        </v-container>
      </template>
    </LayoutCard>
  </div>
</template>

<style scoped>
  @media (min-width: 1280px) and (max-width: 1600px) {
    .custom-offset {
      margin-left: 0 !important;
    }
  }
</style>
