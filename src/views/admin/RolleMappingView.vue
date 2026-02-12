<script setup lang="ts">
  import type { RollenMappingRolleResponse } from '@/api-client/generated';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import { erWInPortalRoles } from '@/enums/user-roles';
  import { useOrganisationStore, type Organisation, type OrganisationStore } from '@/stores/OrganisationStore';
  import { useRollenartStore, type RollenartListLms, type RollenartStore } from '@/stores/RollenartStore';
  import { useRollenMappingStore, type RollenMapping, type RollenMappingStore } from '@/stores/RollenMappingStore';
  import { useRolleStore, type RolleStore } from '@/stores/RolleStore';
  import {
    useServiceProviderStore,
    type ServiceProvider,
    type ServiceProviderStore,
  } from '@/stores/ServiceProviderStore';
  import { computed, onMounted, ref, watch, type Ref } from 'vue';
  import { useRoute, type RouteLocationNormalizedLoaded } from 'vue-router';

  const route: RouteLocationNormalizedLoaded = useRoute();
  const rollenartStore: RollenartStore = useRollenartStore();
  const retrievedLmsOrganisations: Ref<Organisation[]> = ref([]);
  const organisationStore: OrganisationStore = useOrganisationStore();
  const serviceProviderStore: ServiceProviderStore = useServiceProviderStore();
  const rolleStore: RolleStore = useRolleStore();
  const rollenMappingStore: RollenMappingStore = useRollenMappingStore();
  const dynamicErWInPortalRoles: Ref<RollenMappingRolleResponse[]> = ref([]);
  const chosenServiceProvider: Ref<ServiceProvider | null> = ref(null);
  const existingRollenMapping: Ref<RollenMapping[]> = ref([]);

  const retrievedRoles: Ref<string[]> = ref([]);
  const selectedInstance: Ref<string> = ref('');
  const selectedRoles: Ref<(string | null)[]> = ref(Array(erWInPortalRoles.length).fill(null));
  const roles: Ref<RollenartListLms[]> = ref([]);

  const currentRoleOptions: Ref<string[]> = computed((): string[] => {
    const foundRoles: RollenartListLms | undefined = roles.value.find(
      (role: RollenartListLms) => role.lmsName.toLowerCase() === selectedInstance.value.toLowerCase(),
    );
    return foundRoles ? Array.from(new Set(foundRoles.rollenartList)) : [];
  });

  onMounted(async (): Promise<void> => {
    await rollenartStore.getAllRollenart();
    retrievedRoles.value = rollenartStore.rollenartList;

    await organisationStore.getLmsOrganisations();
    retrievedLmsOrganisations.value = organisationStore.retrievedLmsOrganisations;

    roles.value = retrievedLmsOrganisations.value.map(
      (org: Organisation): RollenartListLms => ({
        lmsName: org.name,
        rollenartList: retrievedRoles.value,
      }),
    );

    const instanceLabel: string = String(route.query['instance'] || '');
    const matchedOrg: Organisation | undefined = retrievedLmsOrganisations.value.find(
      (org: Organisation) => org.name.toLowerCase() === instanceLabel.toLowerCase(),
    );

    selectedInstance.value = matchedOrg?.name || instanceLabel;
    selectedRoles.value = Array(retrievedRoles.value.length).fill(null);
  });

  async function saveChosenRolesForMapping(): Promise<void> {
    const serviceProvider: ServiceProvider | null = chosenServiceProvider.value;
    if (!serviceProvider || !serviceProvider.id) return;

    await Promise.all(
      selectedRoles.value.map(async (chosenRole: string | null, index: number) => {
        const erwInPortalRole: RollenMappingRolleResponse | undefined = dynamicErWInPortalRoles.value[index];
        if (!erwInPortalRole) return;

        // Find existing mapping for this rolleId
        const existingMapping: RollenMapping | undefined = existingRollenMapping.value.find(
          (mapping: RollenMapping) =>
            mapping.rolleId === erwInPortalRole.id && mapping.serviceProviderId === serviceProvider.id,
        );

        if (chosenRole && !existingMapping) {
          await rollenMappingStore.createRollenMapping({
            rolleId: erwInPortalRole.id,
            serviceProviderId: serviceProvider.id,
            mapToLmsRolle: chosenRole,
          });
        } else if (chosenRole && existingMapping && existingMapping.mapToLmsRolle !== chosenRole) {
          await rollenMappingStore.updateRollenMapping(existingMapping.id, chosenRole);
        } else if (!chosenRole && existingMapping?.id) {
          await rollenMappingStore.deleteRollenMappingById(existingMapping.id);
        }
      }),
    );

    await rollenMappingStore.getRollenMappingsForServiceProvider(serviceProvider.id);
    existingRollenMapping.value = rollenMappingStore.allRollenMappings;
  }

  watch(
    () => route.query['instance'] as string | string[] | null | undefined,
    async (newInstance: string | string[] | null | undefined): Promise<void> => {
      const instanceLabel: string = String(newInstance || '');

      await serviceProviderStore.getAllServiceProviders();

      const foundSp: ServiceProvider | undefined = serviceProviderStore.allServiceProviders.find(
        (sp: ServiceProvider) => sp.name.toLowerCase() === instanceLabel.toLowerCase(),
      );
      chosenServiceProvider.value = foundSp ?? null;

      if (!chosenServiceProvider.value || !chosenServiceProvider.value.id) {
        existingRollenMapping.value = [];
        dynamicErWInPortalRoles.value = [];
        selectedRoles.value = [];
        return;
      }

      await rollenMappingStore.getRollenMappingsForServiceProvider(chosenServiceProvider.value.id);
      existingRollenMapping.value = rollenMappingStore.allRollenMappings;

      await rolleStore.getRollenByServiceProviderId(chosenServiceProvider.value.id);
      dynamicErWInPortalRoles.value = rolleStore.rollenRetrievedByServiceProvider;

      selectedRoles.value = dynamicErWInPortalRoles.value.map((role: RollenMappingRolleResponse) => {
        const existingMapping: RollenMapping | undefined = existingRollenMapping.value.find(
          (mapping: RollenMapping) =>
            mapping.rolleId === role.id && mapping.serviceProviderId === chosenServiceProvider.value!.id,
        );
        if (existingMapping) return existingMapping.mapToLmsRolle;
        else {
          return null;
        }
      });
    },
    { immediate: true },
  );
</script>

<template>
  <div class="admin">
    <h1
      class="text-center headline"
      data-testid="admin-headline"
    >
      {{ $t('admin.headline') }}
    </h1>

    <LayoutCard :header="$t('admin.rolle.mapping')">
      <v-row
        align="start"
        class="ma-3"
        justify="end"
      >
      </v-row>

      <v-table
        data-testid="rolle-table"
        class="text-body-1"
      >
        <thead>
          <tr>
            <th scope="erWInPortalRolesCol">
              <strong>ErWIn-Portal</strong>
            </th>
            <th scope="rollenArtCol">
              <strong>RollenArt</strong>
            </th>
            <th scope="roleSelectionCol">
              <strong>{{ route.query['instance'] || '...' }}</strong>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(role, index) in dynamicErWInPortalRoles"
            :key="index"
          >
            <td>{{ role.name }}</td>
            <td>{{ role.rollenart }}</td>
            <td class="align-start">
              <v-select
                v-model="selectedRoles[index]"
                :items="currentRoleOptions"
                :label="$t('admin.Role')"
                variant="outlined"
                clearable
                chips
                density="compact"
                class="fixed-select"
                id="role-select"
                :no-data-text="$t('noDataFound')"
                :placeholder="$t('admin.Role')"
                :multiple="false"
                style="width: 300px"
              />
            </td>
          </tr>
        </tbody>
      </v-table>
      <v-row
        justify="end"
        class="mt-4 me-4 pb-4"
      >
        <v-btn
          color="primary"
          variant="elevated"
          size="large"
          @click="saveChosenRolesForMapping()"
        >
          {{ $t('admin.save') }}
        </v-btn>
      </v-row>
    </LayoutCard>
  </div>
</template>

<style scoped>
  .align-start {
    text-align: start;
  }
  .fixed-select {
    text-align: left;
  }
  .fixed-select .v-field__input {
    text-align: left !important;
    padding-left: 12px !important;
  }
  .fixed-select .v-select__selection-text {
    text-align: left !important;
  }
</style>
