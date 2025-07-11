<script setup lang="ts">
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import { computed, ref, type Ref, watch } from 'vue';
  import { useRoute } from 'vue-router';
  type Item = {
    label: string;
    value: string;
  };

  type Role = {
    lms: string;
    roles: Array<string>;
  };


  const erWInPortalRoles: Array<string> = ['USER', 'LERN', 'LEHR', 'LEIT', 'SYSADMIN'];

  const schulcloudRoles: Array<string> = ['user', 'Student', 'Teacher', 'Administrator', 'Superhero', 'Expert'];

  const moodleRoles: Array<string> = ['Authenticated User', 'Student', 'Teacher', 'Manager', 'Site Administrator'];

  const route = useRoute();

  const roles: Array<Role> = [
    { lms: 'Schulcloud', roles: schulcloudRoles },
    { lms: 'Moodle', roles: moodleRoles },
  ];
  const selectedInstance: Ref<Item> = ref({ label: '', value: '' });
  const selectedRoles = ref<(string | null)[]>(Array(erWInPortalRoles.length).fill(null));

  const currentRoleOptions = computed<string[]>(() => {
    const foundRole = roles.find((role) => role.lms === selectedInstance.value.label);
    return foundRole ? foundRole.roles : [];
  });

  watch(
    () => route.query['instance'],
    (newInstance) => {
      const instanceLabel = String(newInstance || '');
      selectedInstance.value = { label: instanceLabel, value: instanceLabel };
      selectedRoles.value = Array(erWInPortalRoles.length).fill(null); // <-- keep this
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
              <strong>{{ selectedInstance.label || '...' }}</strong>
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
