<script setup lang="ts">
  import ServiceProviderForm from '@/components/admin/service-provider/ServiceProviderForm.vue';
  import type {
    ServiceProviderFormSubmitData,
    ServiceProviderForm as ServiceProviderFormType,
  } from '@/components/admin/service-provider/types';
  import SpshAlert from '@/components/alert/SpshAlert.vue';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import { useAuthStore, type AuthStore } from '@/stores/AuthStore';
  import { RollenSystemRecht } from '@/stores/RolleStore';
  import {
    ServiceProviderMerkmal,
    useServiceProviderStore,
    type ServiceProviderStore,
  } from '@/stores/ServiceProviderStore';
  import { computed, onMounted, onUnmounted, ref, type ComputedRef, type Ref } from 'vue';
  import { useI18n, type Composer } from 'vue-i18n';
  import {
    onBeforeRouteLeave,
    useRoute,
    useRouter,
    type NavigationGuardNext,
    type RouteLocationNormalized,
    type Router,
  } from 'vue-router';

  const serviceProviderStore: ServiceProviderStore = useServiceProviderStore();
  const authStore: AuthStore = useAuthStore();
  const route: RouteLocationNormalized = useRoute();
  const router: Router = useRouter();
  const { t }: Composer = useI18n({ useScope: 'global' });

  const isDirty: Ref<boolean> = ref(false);
  const showUnsavedChangesDialog: Ref<boolean> = ref(false);
  const showSuccessDialog: Ref<boolean> = ref(false);

  let blockedNext: () => void = () => {
    /* empty */
  };

  const serviceProviderId: ComputedRef<string> = computed(() => route.params['id'] as string);
  const organisationIdFromQuery: ComputedRef<string | undefined> = computed(
    () => route.query['orga'] as string | undefined,
  );
  const initialValues: ComputedRef<ServiceProviderFormType | null> = computed(() => {
    if (!serviceProviderStore.currentServiceProvider) {
      return null;
    }
    const logo: string =
      serviceProviderStore.serviceProviderLogos.get(serviceProviderStore.currentServiceProvider.id) ?? '';
    return {
      selectedOrganisationId: serviceProviderStore.currentServiceProvider.administrationsebene.id,
      name: serviceProviderStore.currentServiceProvider.name,
      url: serviceProviderStore.currentServiceProvider.url,
      logo,
      kategorie: serviceProviderStore.currentServiceProvider.kategorie,
      requires2fa: serviceProviderStore.currentServiceProvider.requires2fa,
      nachtraeglichZuweisbar: serviceProviderStore.currentServiceProvider.merkmale.includes(
        ServiceProviderMerkmal.NachtraeglichZuweisbar,
      ),
      verfuegbarFuerRollenerweiterung: serviceProviderStore.currentServiceProvider.merkmale.includes(
        ServiceProviderMerkmal.VerfuegbarFuerRollenerweiterung,
      ),
    };
  });

  const errorText: ComputedRef<string> = computed(() => {
    if (!serviceProviderStore.errorCode) {
      return '';
    }
    return t(`angebot.errors.${serviceProviderStore.errorCode}`);
  });

  function preventNavigation(event: BeforeUnloadEvent): void {
    if (!isDirty.value) {
      return;
    }
    event.preventDefault();
    event.returnValue = '';
  }

  function confirmUnsavedChanges(): void {
    showUnsavedChangesDialog.value = false;
    blockedNext();
    serviceProviderStore.errorCode = '';
  }

  async function discard(): Promise<void> {
    if (isDirty.value) {
      showUnsavedChangesDialog.value = true;
    } else {
      await router.push({
        name: 'angebot-details-schulspezifisch',
        params: { id: serviceProviderId.value },
        query: organisationIdFromQuery.value ? { orga: organisationIdFromQuery.value } : undefined,
      });
    }
  }

  async function submit(values: ServiceProviderFormSubmitData): Promise<void> {
    await serviceProviderStore.updateServiceProvider(serviceProviderId.value, values);
    if (!serviceProviderStore.errorCode) {
      isDirty.value = false;
      showSuccessDialog.value = true;
    }
  }

  async function navigateToServiceProviderDetails(): Promise<void> {
    if (organisationIdFromQuery.value) {
      await router.push({
        name: 'angebot-details-schulspezifisch',
        params: { id: serviceProviderId.value },
        query: { orga: organisationIdFromQuery.value },
      });
    } else {
      await router.push({ name: 'angebot-details', params: { id: serviceProviderId.value } });
    }
  }

  onBeforeRouteLeave((_to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
    if (isDirty.value) {
      showUnsavedChangesDialog.value = true;
      blockedNext = next;
    } else {
      next();
    }
  });

  onMounted(async () => {
    serviceProviderStore.errorCode = '';
    if (serviceProviderId.value) {
      await serviceProviderStore.getManageableServiceProviderById(serviceProviderId.value);
    }
    window.addEventListener('beforeunload', preventNavigation);
  });

  onUnmounted(() => {
    window.removeEventListener('beforeunload', preventNavigation);
  });
</script>

<template>
  <div class="admin">
    <h1
      class="text-center headline"
      data-testid="admin-headline"
    >
      {{ $t('admin.headline') }}
    </h1>
    <LayoutCard
      :closable="!serviceProviderStore.errorCode"
      :header="t('angebot.edit')"
      headlineTestId="service-provider-edit-headline"
      @onCloseClicked="discard"
      :padded="true"
      :showCloseText="true"
    >
      <SpshAlert
        :model-value="!!serviceProviderStore.errorCode"
        :title="$t('angebot.angebotEditErrorTitle')"
        :type="'error'"
        :closable="false"
        :show-button="true"
        :button-action="discard"
        :button-text="$t('angebot.backToServiceProviderList')"
        :text="errorText"
      />
      <ServiceProviderForm
        v-if="!serviceProviderStore.errorCode && serviceProviderStore.currentServiceProvider"
        :is-edit-mode="true"
        :initialValues="initialValues ?? {}"
        :systemrecht="
          authStore.hasAngeboteVerwaltenPermission
            ? RollenSystemRecht.AngeboteVerwalten
            : RollenSystemRecht.AngeboteEingeschraenktVerwalten
        "
        :loading="serviceProviderStore.loading"
        :showUnsavedChangesDialog="showUnsavedChangesDialog"
        @update:dirty="(value: boolean) => (isDirty = value)"
        @click:submit="submit"
        @click:discard="discard"
        @update:showUnsavedChangesDialog="(visible: boolean) => (showUnsavedChangesDialog = visible)"
        @click:confirmUnsaved="confirmUnsavedChanges"
      />

      <v-dialog
        persistent
        :model-value="showSuccessDialog"
      >
        <LayoutCard :header="t('angebot.angebotUpdated')">
          <v-card-text>
            <v-row class="text-body bold justify-center">
              <v-col
                class="text-center"
                cols="10"
              >
                <span>
                  {{
                    t('angebot.angebotUpdatedSuccessfully', {
                      name: serviceProviderStore.updatedServiceProvider?.name ?? '',
                    })
                  }}
                </span>
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions class="justify-center">
            <v-row class="justify-center">
              <v-col
                cols="12"
                sm="6"
                md="4"
              >
                <v-btn
                  class="primary"
                  :data-testid="'close-service-provider-success-dialog-button'"
                  @click.stop="navigateToServiceProviderDetails()"
                >
                  {{ $t('close') }}
                </v-btn>
              </v-col>
            </v-row>
          </v-card-actions>
        </LayoutCard>
      </v-dialog>
    </LayoutCard>
  </div>
</template>
