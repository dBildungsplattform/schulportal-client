<script setup lang="ts">
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import { erWInPortalRoles } from '@/enums/user-roles';
  import { useOrganisationStore, type Organisation, type OrganisationStore } from '@/stores/OrganisationStore';
  import { useRollenartStore, type RollenartListLms, type RollenartStore } from '@/stores/RollenartStore';
  import { computed, onMounted, ref, watch, type Ref } from 'vue';
  import { useRoute, type RouteLocationNormalizedLoaded } from 'vue-router';

  const route: RouteLocationNormalizedLoaded = useRoute();
  const rollenartStore: RollenartStore = useRollenartStore();
  const retrievedLmsOrganisations: Ref<Organisation[]> = ref([]);
  const organisationStore: OrganisationStore = useOrganisationStore();

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

  watch(
    () => route.query['instance'],
    (newInstance) => {
      const instanceLabel: string = String(newInstance || '');
      const matchedOrg: Organisation | undefined = retrievedLmsOrganisations.value.find(
        (org: Organisation) => org.name.toLowerCase() === instanceLabel.toLowerCase(),
      );

      selectedInstance.value = matchedOrg?.name || instanceLabel;
      selectedRoles.value = Array(retrievedRoles.value.length).fill(null);
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
            <th><strong>ErWIn-Portal</strong></th>
            <th>
              <strong>{{ selectedInstance || '...' }}</strong>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(role, index) in erWInPortalRoles"
            :key="index"
          >
            <td>{{ role }}</td>
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
      <!-- Save button can be removed if not needed, can be decided later-->
      <v-row
        justify="end"
        class="mt-4 me-4 pb-4"
      >
        <v-btn
          color="primary"
          variant="elevated"
          size="large"
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
