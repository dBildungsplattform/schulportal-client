<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted, type Ref } from 'vue';
  import {
    useRoute,
    useRouter,
    onBeforeRouteLeave,
    type NavigationGuardNext,
    type RouteLocationNormalized,
  } from 'vue-router';
  import { useServiceProviderStore } from '@/stores/ServiceProviderStore';
  import { useAuthStore } from '@/stores/AuthStore';
  import ServiceProviderForm from '@/components/admin/service-provider/ServiceProviderForm.vue';
  import SpshAlert from '@/components/alert/SpshAlert.vue';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import { useI18n } from 'vue-i18n';
  import type { ServiceProviderFormSubmitData } from '@/components/admin/service-provider/types';
  import { RollenSystemRecht } from '@/stores/RolleStore';

  const serviceProviderStore = useServiceProviderStore();
  const authStore = useAuthStore();
  const route = useRoute();
  const router = useRouter();
  const { t } = useI18n({ useScope: 'global' });

  const isDirty: Ref<boolean> = ref(false);
  const showUnsavedChangesDialog: Ref<boolean> = ref(false);
  let blockedNext: NavigationGuardNext | (() => void) = () => {};

  const serviceProviderId = computed(() => route.params['id'] as string);

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

  function preventNavigation(event: BeforeUnloadEvent): void {
    if (!isDirty.value) return;
    event.preventDefault();
    event.returnValue = '';
  }

  onBeforeRouteLeave((_to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
    if (isDirty.value) {
      showUnsavedChangesDialog.value = true;
      blockedNext = next;
    } else {
      next();
    }
  });

  function handleConfirmUnsavedChanges(): void {
    if (typeof blockedNext === 'function') blockedNext();
    serviceProviderStore.errorCode = '';
  }

  function handleDiscard(): void {
    if (isDirty.value) {
      showUnsavedChangesDialog.value = true;
      blockedNext = () => router.push({ name: 'angebot-management-schulspezifisch' });
    } else {
      router.push({ name: 'angebot-management-schulspezifisch' });
    }
  }

  async function onSubmit(values: ServiceProviderFormSubmitData): Promise<void> {
    await serviceProviderStore.updateServiceProvider(values);
    if (!serviceProviderStore.errorCode) {
      isDirty.value = false;
      router.push({ name: 'angebot-details-schulspezifisch', params: { id: serviceProviderId.value } });
    }
  }
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
      @onCloseClicked="handleDiscard"
      :padded="true"
      :showCloseText="true"
    >
      <SpshAlert
        :model-value="!!serviceProviderStore.errorCode"
        :title="$t('angebot.angebotEditErrorTitle')"
        :type="'error'"
        :closable="false"
        :show-button="true"
        :button-action="handleDiscard"
        :button-text="$t('angebot.backToServiceProviderList')"
        :text="$t(`angebot.errors.${serviceProviderStore.errorCode}`)"
      />
      <ServiceProviderForm
        v-if="!serviceProviderStore.errorCode && serviceProviderStore.currentServiceProvider"
        :initialValues="serviceProviderStore.currentServiceProvider"
        :systemrecht="
          authStore.hasAngeboteVerwaltenPermission
            ? RollenSystemRecht.AngeboteVerwalten
            : RollenSystemRecht.AngeboteEingeschraenktVerwalten
        "
        :loading="serviceProviderStore.loading"
        @update:dirty="(value: boolean) => (isDirty = value)"
        @click:submit="onSubmit"
        @click:discard="handleDiscard"
        :showUnsavedChangesDialog="showUnsavedChangesDialog"
        @update:showUnsavedChangesDialog="(visible: boolean) => (showUnsavedChangesDialog = visible)"
        @click:confirmUnsaved="handleConfirmUnsavedChanges"
      />
    </LayoutCard>
  </div>
</template>
