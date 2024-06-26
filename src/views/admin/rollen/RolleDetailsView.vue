<script setup lang="ts">
  import { type RolleStore, useRolleStore, RollenMerkmal, RollenSystemRecht } from '@/stores/RolleStore';
  import { useOrganisationStore, type OrganisationStore } from '@/stores/OrganisationStore';
  import { type ServiceProvider } from '@/stores/ServiceProviderStore';
  import { computed, onBeforeMount, ref, type ComputedRef, type Ref } from 'vue';
  import { type Router, useRouter, type RouteLocationNormalizedLoaded, useRoute } from 'vue-router';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import SpshAlert from '@/components/alert/SpshAlert.vue';
  import RolleForm from '@/components/form/RolleForm.vue';
  import { type Composer, useI18n } from 'vue-i18n';

  const route: RouteLocationNormalizedLoaded = useRoute();
  const router: Router = useRouter();
  const { t }: Composer = useI18n({ useScope: 'global' });

  const rolleStore: RolleStore = useRolleStore();
  const organisationStore: OrganisationStore = useOrganisationStore();
  const currentRolleId: string = route.params['id'] as string;

  const showUnsavedChangesDialog: Ref<boolean> = ref(false);

  function navigateToRolleTable(): void {
    router.push({ name: 'rolle-management' });
  }

  const handleAlertClose = (): void => {
    rolleStore.errorCode = '';
    navigateToRolleTable();
  };

  const translatedOrgName: ComputedRef<string | undefined> = computed(() => {
    if (!rolleStore.currentRolle?.administeredBySchulstrukturknoten) {
      return '---';
    }
    return organisationStore.currentOrganisation?.kennung
      ? `${organisationStore.currentOrganisation.kennung} (${organisationStore.currentOrganisation.name})`
      : organisationStore.currentOrganisation?.name;
  });

  const translatedRollenart: ComputedRef<string> = computed(() => {
    if (!rolleStore.currentRolle?.rollenart) {
      return '---';
    }

    return t(`admin.rolle.mappingFrontBackEnd.rollenarten.${rolleStore.currentRolle.rollenart}`);
  });

  const translatedProviderNames: ComputedRef<string> = computed(() => {
    if (!rolleStore.currentRolle?.serviceProviders?.length) {
      return '---';
    }

    return rolleStore.currentRolle.serviceProviders.map((provider: ServiceProvider) => provider.name).join(', ');
  });

  const translatedMerkmale: ComputedRef<string> = computed(() => {
    const merkmale: Array<RollenMerkmal> = Array.from(rolleStore.currentRolle?.merkmale || []);

    if (!merkmale.length) {
      return '---';
    }

    return merkmale
      .map((merkmalKey: RollenMerkmal) => t(`admin.rolle.mappingFrontBackEnd.merkmale.${merkmalKey}`))
      .join(', ');
  });

  const translatedSystemrechte: ComputedRef<string> = computed(() => {
    const systemrechte: Array<RollenSystemRecht> = Array.from(rolleStore.currentRolle?.systemrechte || []);

    if (!systemrechte.length) {
      return '---';
    }

    return systemrechte
      .map((systemrechtKey: RollenSystemRecht) => t(`admin.rolle.mappingFrontBackEnd.systemrechte.${systemrechtKey}`))
      .join(', ');
  });

  function handleConfirmUnsavedChanges(): void {
    return;
  }

  async function navigateToRolleManagement(): Promise<void> {
    await router.push({ name: 'rolle-management' });
    rolleStore.createdRolle = null;
  }

  function onSubmit(): void {
    return;
  }

  onBeforeMount(async () => {
    await rolleStore.getRolleById(currentRolleId);
    await organisationStore.getOrganisationById(rolleStore.currentRolle?.administeredBySchulstrukturknoten || '');
  });
</script>

<template>
  <div class="admin">
    <v-row>
      <v-col cols="12">
        <h1
          class="text-center headline-1"
          data-testid="admin-headline"
        >
          {{ $t('admin.headline') }}
        </h1>
      </v-col>
    </v-row>
    <LayoutCard
      :closable="true"
      data-testid="rolle-details-card"
      :header="$t('admin.rolle.edit')"
      @onCloseClicked="navigateToRolleTable"
      :padded="true"
      :showCloseText="true"
    >
      <!-- Error Message Display -->
      <SpshAlert
        :model-value="!!rolleStore.errorCode"
        :title="$t('admin.rolle.loadingErrorTitle')"
        :type="'error'"
        :closable="false"
        :text="$t('admin.rolle.loadingErrorText')"
        :showButton="true"
        :buttonText="$t('nav.backToList')"
        @update:modelValue="handleAlertClose"
      />

      <template v-if="!rolleStore.errorCode">
        <v-container>
          <div v-if="rolleStore.currentRolle">
            <RolleForm
              :onHandleConfirmUnsavedChanges="handleConfirmUnsavedChanges"
              :onHandleDiscard="navigateToRolleManagement"
              :onShowDialogChange="(value: boolean) => (showUnsavedChangesDialog = value)"
              :onSubmit="onSubmit"
              :readonly="true"
              ref="rolle-form"
              v-model:selectedAdministrationsebene="translatedOrgName"
              v-model:selectedRollenArt="translatedRollenart"
              v-model:selectedRollenName="rolleStore.currentRolle.name"
              v-model:selectedMerkmale="translatedMerkmale"
              v-model:selectedServiceProviders="translatedProviderNames"
              v-model:selectedSystemRechte="translatedSystemrechte"
            ></RolleForm>
          </div>
          <div v-else-if="rolleStore.loading">
            <v-progress-circular indeterminate></v-progress-circular>
          </div>
        </v-container>
      </template>
    </LayoutCard>
  </div>
</template>

<style></style>
