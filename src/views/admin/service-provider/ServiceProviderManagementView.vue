<script setup lang="ts">
  import { computed, ref, watchEffect, type ComputedRef, type Ref } from 'vue';
  import { useI18n, type Composer } from 'vue-i18n';
  import { useRouter, type Router } from 'vue-router';

  import ResultTable, { type Headers, type TableRow } from '@/components/admin/ResultTable.vue';
  import ServiceProviderDelete from '@/components/admin/service-provider/ServiceProviderDelete.vue';
  import SpshAlert from '@/components/alert/SpshAlert.vue';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import { useSearchFilterStore, type SearchFilterStore } from '@/stores/SearchFilterStore';
  import {
    useServiceProviderStore,
    type ManageableServiceProviderListEntry,
    type ServiceProviderStore,
  } from '@/stores/ServiceProviderStore';
  import { getDisplayNameForOrg } from '@/utils/formatting';

  type ServiceProviderRow = {
    id: string;
    kategorie: string;
    name: string;
    administrationsebene: string;
    rollen: string;
    hasRollenerweiterung: string;
    isDeleteAuthorized: boolean;
  };

  const router: Router = useRouter();
  const { t }: Composer = useI18n();

  const serviceProviderStore: ServiceProviderStore = useServiceProviderStore();
  const searchFilterStore: SearchFilterStore = useSearchFilterStore();

  const cachedServiceProviderId: Ref<string | null> = ref(null);

  const serviceProviderToDelete: Ref<ServiceProviderRow | null> = ref(null);
  const isDeleteDialogOpen: Ref<boolean, boolean> = ref(false);

  const errorTitle: ComputedRef<string> = computed(() => {
    if (!serviceProviderStore.errorCode) {
      return '';
    }
    return t(`admin.angebot.title.${serviceProviderStore.errorCode}`);
  });

  const errorText: ComputedRef<string> = computed(() => {
    if (!serviceProviderStore.errorCode) {
      return '';
    }
    const serviceProviderName: string =
      serviceProviderStore.manageableServiceProviders.find(
        (sp: ManageableServiceProviderListEntry) => sp.id === cachedServiceProviderId.value,
      )?.name ?? '';
    return t(`admin.angebot.errors.${serviceProviderStore.errorCode}`, {
      serviceProviderName,
    });
  });

  const headers: Headers = [
    { title: t('angebot.kategorie'), key: 'kategorie', align: 'start' },
    { title: t('angebot.name'), key: 'name', align: 'start' },
    { title: t('angebot.administrationsebene'), key: 'administrationsebene', align: 'start' },
    { title: t('angebot.rollen'), key: 'rollen', align: 'start' },
    { title: t('angebot.schulspezifischErweitert'), key: 'hasRollenerweiterung', align: 'start' },
    {
      title: t('action'),
      key: 'actions',
      align: 'center',
      sortable: false,
      width: '250px',
    },
  ];

  async function reloadData(): Promise<void> {
    await serviceProviderStore.getManageableServiceProviders(
      searchFilterStore.serviceProviderPage,
      searchFilterStore.serviceProviderPerPage,
    );
  }

  const handleAlertClose = async (): Promise<void> => {
    serviceProviderStore.errorCode = '';
    await reloadData();
  };

  async function onDelete(id: string): Promise<void> {
    await serviceProviderStore.deleteServiceProvider(id);
    cachedServiceProviderId.value = id;
  }

  async function onCloseDeleteDialogWrapper(successful: boolean): Promise<void> {
    isDeleteDialogOpen.value = false;

    if (!successful) {
      serviceProviderStore.errorCode = '';
      serviceProviderToDelete.value = null;
      return;
    }

    serviceProviderStore.manageableServiceProviders = serviceProviderStore.manageableServiceProviders.filter(
      (sp: ManageableServiceProviderListEntry) => sp.id !== cachedServiceProviderId.value,
    );

    await reloadData();

    serviceProviderToDelete.value = null;
  }

  const items: ComputedRef<ServiceProviderRow[]> = computed(() => {
    return serviceProviderStore.manageableServiceProviders.map((sp: ManageableServiceProviderListEntry) => {
      return {
        id: sp.id,
        kategorie: t(`angebot.kategorien.${sp.kategorie}`),
        name: sp.name,
        administrationsebene: getDisplayNameForOrg(sp.administrationsebene),
        rollen:
          sp.rollen.length > 0
            ? sp.rollen.map((rolle: ManageableServiceProviderListEntry['rollen'][number]) => rolle.name).join(', ')
            : '---',
        hasRollenerweiterung: sp.rollenerweiterungen && sp.rollenerweiterungen.length > 0 ? t('yes') : t('no'),
        isDeleteAuthorized: sp.isDeleteAuthorized,
      };
    });
  });

  function navigateToServiceProviderDetails(_$event: PointerEvent, { item }: { item: ServiceProviderRow }): void {
    router.push({ name: 'angebot-details', params: { id: item.id } });
  }

  watchEffect(async () => {
    await reloadData();
  });
</script>

<template>
  <h1
    class="text-center headline"
    data-testid="admin-headline"
  >
    {{ $t('admin.headline') }}
  </h1>
  <LayoutCard :header="t('admin.angebot.management.title')">
    <SpshAlert
      :button-action="handleAlertClose"
      :button-text="t('nav.backToList')"
      :closable="false"
      data-test-id-prefix="service-provider-management-error"
      :model-value="!!serviceProviderStore.errorCode"
      :show-button="true"
      :text="errorText"
      :title="errorTitle"
      :type="'error'"
    />
    <ResultTable
      v-if="!serviceProviderStore.errorCode"
      :headers
      :items
      :itemsPerPage="searchFilterStore.serviceProviderPerPage"
      :currentPage="searchFilterStore.serviceProviderPage"
      :itemValuePath="'id'"
      :loading="serviceProviderStore.loading"
      :totalItems="serviceProviderStore.totalManageableServiceProviders"
      @onItemsPerPageUpdate="(val: number) => (searchFilterStore.serviceProviderPerPage = val)"
      @onPageUpdate="(val: number) => (searchFilterStore.serviceProviderPage = val)"
      @onHandleRowClick="
        (event: PointerEvent, item: TableRow<unknown>) =>
          navigateToServiceProviderDetails(event, item as TableRow<ServiceProviderRow>)
      "
    >
      <template v-slot:[`item.rollen`]="{ item }">
        <div
          class="ellipsis-wrapper"
          :title="item.rollen"
        >
          {{ item.rollen }}
        </div>
      </template>
      <template #[`item.actions`]="{ item }: { item: ServiceProviderRow }">
        <v-icon
          v-if="item.isDeleteAuthorized"
          icon="mdi-delete"
          size="small"
          data-testid="open-service-provider-delete-dialog-icon"
          @click.stop="
            () => {
              serviceProviderToDelete = item;
              isDeleteDialogOpen = true;
            }
          "
        />
      </template>
    </ResultTable>
    <ServiceProviderDelete
      v-if="serviceProviderToDelete"
      v-model="isDeleteDialogOpen"
      :error-code="serviceProviderStore.errorCode"
      :is-loading="serviceProviderStore.loading"
      :service-provider-id="serviceProviderToDelete.id"
      :service-provider-name="serviceProviderToDelete.name"
      @on-delete-service-provider="onDelete"
      @on-close="onCloseDeleteDialogWrapper"
    />
  </LayoutCard>
</template>
