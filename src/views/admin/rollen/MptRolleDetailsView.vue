<script setup lang="ts">
  import type { ServiceProviderResponse } from '@/api-client/generated';
  import LabeledField from '@/components/admin/LabeledField.vue';
  import AngebotSelectionTreeview, {
    type AngebotForSelection,
  } from '@/components/admin/rollen/AngebotSelectionTreeview.vue';
  import SpshAlert from '@/components/alert/SpshAlert.vue';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import { useOrganisationStore, type OrganisationStore } from '@/stores/OrganisationStore';
  import { useRolleStore, type RolleStore } from '@/stores/RolleStore';
  import { useServiceProviderStore, type ServiceProviderStore } from '@/stores/ServiceProviderStore';
  import { computed, onMounted, onUnmounted, ref, type ComputedRef, type Ref } from 'vue';
  import { useI18n, type Composer } from 'vue-i18n';
  import { useRoute, useRouter, type RouteLocationNormalizedLoaded, type Router } from 'vue-router';

  const { t }: Composer = useI18n({ useScope: 'global' });
  const route: RouteLocationNormalizedLoaded = useRoute();
  const router: Router = useRouter();
  const rolleStore: RolleStore = useRolleStore();
  const organisationStore: OrganisationStore = useOrganisationStore();
  const serviceProviderStore: ServiceProviderStore = useServiceProviderStore();

  const rolleId: string = route.params['id'] as string;
  const organisationId: string = route.query['orga'] as string;
  const selectedServiceProviderIds: Ref<Array<string>> = ref([]);
  const isSaving: Ref<boolean> = ref(false);
  const saveSuccessDialogVisible: Ref<boolean> = ref(false);
  const errorContext: Ref<'load' | 'save'> = ref('load');
  const treeviewKey: Ref<number> = ref(0);

  const existingServiceProviderIds: ComputedRef<Array<string>> = computed(
    (): Array<string> =>
      rolleStore.rollenerweiterungServiceProviders.map(
        (serviceProvider: ServiceProviderResponse): string => serviceProvider.id,
      ),
  );

  const availableServiceProviders: ComputedRef<Array<AngebotForSelection>> = computed(
    (): Array<AngebotForSelection> => serviceProviderStore.allServiceProviders ?? [],
  );

  const errorCode: ComputedRef<string> = computed(
    (): string => rolleStore.errorCode || serviceProviderStore.errorCode || organisationStore.errorCode,
  );

  const hasError: ComputedRef<boolean> = computed(
    (): boolean => Boolean(errorCode.value) || rolleStore.errors.size > 0,
  );

  const loading: ComputedRef<boolean> = computed(
    (): boolean => rolleStore.loading || serviceProviderStore.loading || organisationStore.loading,
  );

  function navigateToMptRollenManagement(): void {
    void router.push({ name: 'mpt-rolle-management' });
  }

  function clearError(): void {
    rolleStore.errorCode = '';
    rolleStore.errors.clear();
    serviceProviderStore.errorCode = '';
    organisationStore.errorCode = '';
  }

  function handleError(): void {
    clearError();
    if (errorContext.value === 'load') {
      navigateToMptRollenManagement();
    }
  }

  function resetSelection(): void {
    selectedServiceProviderIds.value = [...existingServiceProviderIds.value];
    treeviewKey.value += 1;
  }

  async function saveRollenerweiterungen(): Promise<void> {
    errorContext.value = 'save';
    isSaving.value = true;

    await rolleStore.persistRollenerweiterungenForRolle({
      rolleId,
      organisationId,
      existingServiceProviderIds: existingServiceProviderIds.value,
      selectedServiceProviderIds: selectedServiceProviderIds.value,
    });

    if (!rolleStore.errorCode && rolleStore.errors.size === 0) {
      await rolleStore.getRollenerweiterungenForRolle(rolleId, organisationId);
      if (rolleStore.errorCode) {
        saveSuccessDialogVisible.value = false;
        isSaving.value = false;
        return;
      }
      selectedServiceProviderIds.value = [...existingServiceProviderIds.value];
      saveSuccessDialogVisible.value = true;
    }

    isSaving.value = false;
  }

  onMounted(async (): Promise<void> => {
    errorContext.value = 'load';
    clearError();
    rolleStore.errors.clear();

    await rolleStore.getMptRolleById(rolleId, organisationId);
    if (!rolleStore.currentRolle || rolleStore.errorCode) {
      return;
    }

    await rolleStore.getRollenerweiterungenForRolle(rolleId, organisationId);
    if (rolleStore.errorCode) {
      return;
    }

    await Promise.all([
      serviceProviderStore.getServiceProvidersForRollenerweiterung(organisationId),
      organisationStore.currentOrganisation?.id === organisationId
        ? Promise.resolve()
        : organisationStore.getOrganisationById(organisationId),
    ]);

    selectedServiceProviderIds.value = [...existingServiceProviderIds.value];
  });

  onUnmounted((): void => {
    clearError();
  });
</script>

<template>
  <h1
    class="text-center headline"
    data-testid="admin-headline"
  >
    {{ t('admin.headline') }}
  </h1>

  <LayoutCard
    :closable="true"
    data-testid="mpt-rolle-details-card"
    :header="`${t('admin.rolle.mptDetails.title')} ${organisationStore.currentOrganisation?.name ?? ''}`"
    :header-hover-text="organisationStore.currentOrganisation?.name"
    :padded="true"
    :show-close-text="true"
    @on-close-clicked="navigateToMptRollenManagement"
  >
    <v-container
      v-if="hasError"
      class="px-3 px-sm-16"
    >
      <SpshAlert
        :button-action="handleError"
        :button-text="errorContext === 'load' ? t('nav.backToList') : t('close')"
        :closable="false"
        data-testid="mpt-rolle-details-error"
        :model-value="true"
        :show-button="true"
        :text="t(`admin.rolle.mptDetails.${errorContext}ErrorText`)"
        :title="t(`admin.rolle.mptDetails.${errorContext}ErrorTitle`)"
        type="error"
        @update:model-value="handleError"
      />
    </v-container>

    <template v-else-if="rolleStore.currentRolle">
      <v-container>
        <v-row
          class="rolle-summary my-6"
          data-testid="mpt-rolle-info"
        >
          <v-col
            cols="12"
            md="6"
            class="px-md-16"
          >
            <LabeledField
              :label="t('admin.rolle.rollenname')"
              :value="rolleStore.currentRolle.name"
              no-margin-top
              test-id="mpt-rolle-name"
            />
          </v-col>
          <v-col
            cols="12"
            md="6"
            class="px-md-16"
          >
            <LabeledField
              :label="t('admin.rolle.rollenart')"
              :value="t(`admin.rolle.mappingFrontBackEnd.rollenarten.${rolleStore.currentRolle.rollenart}`)"
              no-margin-top
              test-id="mpt-rolle-art"
            />
          </v-col>
        </v-row>

        <v-divider
          class="rolle-summary-divider border-opacity-100 rounded"
          thickness="5"
        />

        <h3
          class="angebot-section-title px-3 py-4"
          data-testid="mpt-rolle-offer-selection-title"
        >
          {{ t('admin.rolle.mptDetails.editOffers') }}
        </h3>
        <v-divider
          class="angebot-section-divider border-opacity-100 rounded"
          thickness="5"
        />

        <v-row class="ma-0">
          <v-col
            cols="12"
            md="5"
            class="px-md-2"
          >
            <AngebotSelectionTreeview
              :key="treeviewKey"
              :available-service-providers="availableServiceProviders"
              :initially-selected-service-provider-ids="existingServiceProviderIds"
              :loading="loading"
              @update:selected-service-provider-ids="selectedServiceProviderIds = $event"
            />
            <v-divider class="angebot-mobile-divider hidden-md-and-up mt-6" />
          </v-col>
          <v-col
            cols="auto"
            class="angebot-desktop-divider-col hidden-sm-and-down mt-3"
          >
          </v-col>
          <v-col
            cols="12"
            md="6"
            class="d-flex align-end justify-end px-4 px-md-12 py-6"
          >
            <v-row class="justify-end w-100">
              <v-col
                cols="12"
                sm="6"
              >
                <v-btn
                  :block="true"
                  class="secondary"
                  data-testid="mpt-rolle-cancel-button"
                  :disabled="loading || isSaving"
                  @click="resetSelection"
                >
                  {{ t('cancel') }}
                </v-btn>
              </v-col>
              <v-col
                cols="12"
                sm="6"
              >
                <v-btn
                  :block="true"
                  class="primary"
                  data-testid="mpt-rolle-save-button"
                  :disabled="loading || availableServiceProviders.length === 0"
                  :loading="isSaving"
                  @click="saveRollenerweiterungen"
                >
                  {{ t('save') }}
                </v-btn>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-container>
    </template>

    <v-container
      v-else
      class="d-flex justify-center pa-8"
    >
      <v-progress-circular indeterminate />
    </v-container>
  </LayoutCard>

  <v-dialog
    v-model="saveSuccessDialogVisible"
    max-width="600px"
    persistent
  >
    <LayoutCard :header="t('admin.rolle.mptDetails.editOffers')">
      <v-card-text class="text-center">
        {{ t('admin.rolle.mptDetails.saveSuccess') }}
      </v-card-text>
      <v-card-actions class="justify-center">
        <v-btn
          class="primary"
          data-testid="mpt-rolle-save-success-close-button"
          @click="saveSuccessDialogVisible = false"
        >
          {{ t('close') }}
        </v-btn>
      </v-card-actions>
    </LayoutCard>
  </v-dialog>
</template>

<style scoped lang="scss">
  @use '@/styles/variables';

  .angebot-section-title {
    color: variables.$primaryColor;
    font-size: variables.$mediumSubtitle1FontSize;
    font-weight: bold;
  }

  .rolle-summary-divider {
    color: variables.$lightGrey;
  }

  .angebot-section-divider {
    color: variables.$cyan;
  }

  .angebot-mobile-divider {
    border-color: variables.$lightGrey;
  }

  .angebot-desktop-divider-col {
    width: 2px;
    align-self: stretch;
    background-color: variables.$lightGrey;
  }
</style>
