<script setup lang="ts">
  import SchulPortalLogo from '@/assets/logos/Schulportal_SH_Bildmarke_RGB_Anwendung_HG_Blau.svg';
  import ServiceProviderForm from '@/components/admin/service-provider/ServiceProviderForm.vue';
  import SuccessTemplate from '@/components/admin/service-provider/SuccessTemplate.vue';
  import type { ServiceProviderFormSubmitData } from '@/components/admin/service-provider/types';
  import SpshAlert from '@/components/alert/SpshAlert.vue';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import { useAutoselectedSchule } from '@/composables/useAutoselectedSchule';
  import { useAuthStore, type AuthStore } from '@/stores/AuthStore';
  import { RollenSystemRecht } from '@/stores/RolleStore';
  import {
    ServiceProviderKategorie,
    ServiceProviderMerkmal,
    useServiceProviderStore,
    type ServiceProviderStore,
  } from '@/stores/ServiceProviderStore';
  import { computed, onMounted, onUnmounted, ref, type ComputedRef, type Ref } from 'vue';
  import { useI18n, type Composer } from 'vue-i18n';
  import {
    onBeforeRouteLeave,
    useRouter,
    type NavigationGuardNext,
    type RouteLocationNormalized,
    type Router,
  } from 'vue-router';

  const serviceProviderStore: ServiceProviderStore = useServiceProviderStore();
  const authStore: AuthStore = useAuthStore();

  const router: Router = useRouter();
  const { t }: Composer = useI18n({ useScope: 'global' });

  const showSuccess: Ref<boolean> = ref(false);

  const selectedOrganisationIdCache: Ref<string | undefined> = ref(undefined);
  const selectedOrganisationNameCache: Ref<string | undefined> = ref(undefined);

  const isDirty: Ref<boolean> = ref(false);

  const relevantSystemrecht: ComputedRef<RollenSystemRecht> = computed(() => {
    if (authStore.hasAngeboteVerwaltenPermission) {
      return RollenSystemRecht.AngeboteVerwalten;
    }
    return RollenSystemRecht.AngeboteEingeschraenktVerwalten;
  });
  const autoSelectedSchuleId: ComputedRef<string | undefined> = computed(() => {
    const { autoselectedSchule } = useAutoselectedSchule([relevantSystemrecht.value]);
    return autoselectedSchule.value?.id;
  });

  const selectedOrganisationName: ComputedRef<string> = computed(() => selectedOrganisationNameCache.value || '');

  function navigateToServiceProviderDetails(): void {
    if (serviceProviderStore.createdServiceProvider) {
      const id: string = serviceProviderStore.createdServiceProvider.id;
      selectedOrganisationNameCache.value = '';
      serviceProviderStore.errorCode = '';
      router.push({
        name: 'angebot-details-schulspezifisch',
        params: { id },
        query: {
          from: 'create-angebot',
          orga: selectedOrganisationIdCache.value,
          autoEdit: 'true',
        },
      });
    }
  }

  function navigateToServiceProviderTable(): void {
    router.push({ name: 'angebot-management-schulspezifisch' });
    selectedOrganisationNameCache.value = '';
    serviceProviderStore.errorCode = '';
    serviceProviderStore.createdServiceProvider = null;
  }

  function navigateToCreatePersonRoute(reload: boolean = false): void | Promise<void> {
    let routeName: string;
    routeName = 'create-angebot';

    if (reload) {
      return router.push({ name: routeName }).then(() => router.go(0));
    } else {
      router.push({ name: routeName });
    }
  }

  function navigateBackToAngebotForm(): void {
    if (serviceProviderStore.errorCode === 'REQUIRED_STEP_UP_LEVEL_NOT_MET') {
      selectedOrganisationNameCache.value = '';
      navigateToCreatePersonRoute(true);
    } else {
      serviceProviderStore.errorCode = '';
      navigateToCreatePersonRoute();
    }
  }

  const showUnsavedChangesDialog: Ref<boolean> = ref(false);
  let blockedNext: () => void = () => {
    /* empty */
  };

  function handleConfirmUnsavedChanges(): void {
    blockedNext();
    serviceProviderStore.errorCode = '';
  }

  function handleDiscard(): void {
    if (isDirty.value) {
      showUnsavedChangesDialog.value = true;
      blockedNext = navigateToServiceProviderTable;
    } else {
      navigateToServiceProviderTable();
    }
  }

  function preventNavigation(event: BeforeUnloadEvent): void {
    if (!isDirty.value) {
      return;
    }
    event.preventDefault();
    event.returnValue = '';
  }

  const onSubmit = async (values: ServiceProviderFormSubmitData) => {
    await serviceProviderStore.createServiceProvider({
      organisationId: values.selectedOrganisation.id,
      name: values.name,
      url: values.url,
      kategorie: values.kategorie,
      requires2fa: values.requires2fa,
      merkmale: values.merkmale,
    });

    if (!serviceProviderStore.errorCode) {
      isDirty.value = false;
      showSuccess.value = true;
      selectedOrganisationIdCache.value = values.selectedOrganisation.id;
      selectedOrganisationNameCache.value = values.selectedOrganisation.name;
    }
  };

  onBeforeRouteLeave((_to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
    if (isDirty.value) {
      showUnsavedChangesDialog.value = true;
      blockedNext = next;
    } else {
      next();
    }
  });

  onMounted(() => {
    serviceProviderStore.errorCode = '';
    serviceProviderStore.createdServiceProvider = null;
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
      :closable="!serviceProviderStore.errorCode && !serviceProviderStore.createdServiceProvider"
      :header="`${t('angebot.addNew')} ${selectedOrganisationName}`"
      :header-hover-text="selectedOrganisationName"
      headlineTestId="service-provider-create-headline"
      @onCloseClicked="navigateToServiceProviderTable"
      :padded="true"
      :showCloseText="true"
    >
      <!-- The form to create a new Angebot -->
      <template v-if="!serviceProviderStore.createdServiceProvider">
        <!-- Error Message -->
        <SpshAlert
          :model-value="!!serviceProviderStore.errorCode"
          :title="$t('angebot.angebotCreateErrorTitle')"
          :type="'error'"
          :closable="false"
          :show-button="true"
          :button-action="navigateBackToAngebotForm"
          :button-text="$t('angebot.backToCreateAngebot')"
          :text="$t(`angebot.errors.${serviceProviderStore.errorCode}`)"
        />
        <ServiceProviderForm
          v-if="!serviceProviderStore.errorCode"
          v-bind="{
            initialValues: {
              selectedOrganisationId: autoSelectedSchuleId,
              name: '',
              url: '',
              logo: SchulPortalLogo,
              kategorie: ServiceProviderKategorie.Schulisch,
              nachtraeglichZuweisbar: true,
              verfuegbarFuerRollenerweiterung: true,
              requires2fa: false,
            },
            showUnsavedChangesDialog,
            systemrecht: relevantSystemrecht,
            errorCode: serviceProviderStore.errorCode,
            loading: serviceProviderStore.loading,
          }"
          @update:dirty="(value: boolean) => (isDirty = value)"
          @click:submit="onSubmit"
          @click:discard="handleDiscard"
          @update:showUnsavedChangesDialog="(visible: boolean) => (showUnsavedChangesDialog = visible)"
          @click:confirmUnsaved="handleConfirmUnsavedChanges"
        />
      </template>

      <!-- Result template on success after submit  -->
      <template v-if="serviceProviderStore.createdServiceProvider && !serviceProviderStore.errorCode">
        <SuccessTemplate
          v-if="showSuccess && serviceProviderStore.createdServiceProvider"
          :success="{
            message: $t('angebot.angebotAddedSuccessfully', { name: serviceProviderStore.createdServiceProvider.name }),
            followingDataChanged: $t('admin.followingDataCreated'),
            data: [
              { label: $t('angebot.providedBy'), value: selectedOrganisationName!, testId: 'success-organisation' },
              {
                label: $t('angebot.name'),
                value: serviceProviderStore.createdServiceProvider.name,
                testId: 'success-name',
              },
              {
                label: $t('angebot.url'),
                value: serviceProviderStore.createdServiceProvider.url,
                testId: 'success-url',
              },
              {
                label: $t('angebot.logo'),
                value: SchulPortalLogo,
                testId: 'success-logo',
                type: 'image',
              },
              {
                label: $t('angebot.kategorie'),
                value: $t(`angebot.kategorien.${serviceProviderStore.createdServiceProvider.kategorie}`),
                testId: 'success-kategorie',
              },
              {
                label: $t('angebot.canBeAssigned'),
                value: serviceProviderStore.createdServiceProvider.merkmale.includes(
                  ServiceProviderMerkmal.NachtraeglichZuweisbar,
                )
                  ? $t('yes')
                  : $t('no'),
                testId: 'success-nachtraeglich-zuweisbar',
              },
              {
                label: $t('angebot.canBeUsed'),
                value: serviceProviderStore.createdServiceProvider.merkmale.includes(
                  ServiceProviderMerkmal.VerfuegbarFuerRollenerweiterung,
                )
                  ? $t('yes')
                  : $t('no'),
                testId: 'success-verfuegbar-fuer-rollenerweiterung',
              },
              {
                label: $t('angebot.requires2FA'),
                value: serviceProviderStore.createdServiceProvider.requires2fa ? $t('yes') : $t('no'),
                testId: 'success-requires-2fa',
              },
            ],
          }"
          :show-to-service-provider-details-button="true"
          :to-service-provider-details-button-text="$t('angebot.toServiceProviderDetails')"
          :showBackButton="true"
          :showCreateAnotherButton="true"
          toServiceProviderDetailsButtonTestId="to-service-provider-details-button"
          @toServiceProviderDetails="navigateToServiceProviderDetails"
        />
      </template>
    </LayoutCard>
  </div>
</template>
<style scoped>
  .logo-box {
    width: 80px;
    height: 80px;
    border: 2px solid #ddd;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .logo-box.selected {
    border-color: #001e49;
    box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
  }
</style>
