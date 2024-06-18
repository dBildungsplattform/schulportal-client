<script setup lang="ts">
  import { type RolleStore, useRolleStore } from '@/stores/RolleStore';
  import { onBeforeMount } from 'vue';
  import { type Router, useRouter, type RouteLocationNormalizedLoaded, useRoute } from 'vue-router';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import SpshAlert from '@/components/alert/SpshAlert.vue';

  const rolleStore: RolleStore = useRolleStore();

  const route: RouteLocationNormalizedLoaded = useRoute();
  const router: Router = useRouter();
  const currentRolleId: string = route.params['id'] as string;

  function navigateToRolleTable(): void {
    router.push({ name: 'rolle-management' });
  }

  const handleAlertClose = (): void => {
    rolleStore.errorCode = '';
    navigateToRolleTable();
  };

  onBeforeMount(async () => {
    await rolleStore.getRolleById(currentRolleId);
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
            <!-- Administrationsebene (Organisation) -->
            <v-row>
              <v-col
                class="text-right"
                sm="3"
                cols="5"
              >
                <span class="subtitle-2"> {{ $t('admin.administrationsebene.administrationsebene') }}: </span>
              </v-col>
              <v-col
                cols="auto"
                data-testid="rolle-administrationsebene"
              >
                {{ rolleStore.currentRolle.administeredBySchulstrukturknoten }}
              </v-col>
            </v-row>
            <!-- Rollenart -->
            <v-row>
              <v-col
                class="text-right"
                sm="3"
                cols="5"
              >
                <span class="subtitle-2"> {{ $t('admin.rolle.rollenart') }}: </span>
              </v-col>
              <v-col
                cols="auto"
                data-testid="rolle-rollenart"
              >
                {{ rolleStore.currentRolle.rollenart }}
              </v-col>
            </v-row>
            <!-- Rollenname -->
            <v-row>
              <v-col
                class="text-right"
                sm="3"
                cols="5"
              >
                <span class="subtitle-2"> {{ $t('admin.rolle.rollenname') }}: </span>
              </v-col>
              <v-col
                cols="auto"
                data-testid="rolle-name"
              >
                {{ rolleStore.currentRolle.name }}
              </v-col>
            </v-row>
            <!-- Rollenmerkmale -->
            <v-row>
              <v-col
                class="text-right"
                sm="3"
                cols="5"
              >
                <span class="subtitle-2"> {{ $t('admin.rolle.merkmale') }}: </span>
              </v-col>
              <v-col
                cols="auto"
                data-testid="rolle-merkmale"
              >
                {{ rolleStore.currentRolle.merkmale ?? '---' }}
              </v-col>
            </v-row>
            <!-- Angebote (ServiceProvider) -->
            <v-row>
              <v-col
                class="text-right"
                sm="3"
                cols="5"
              >
                <span class="subtitle-2"> {{ $t('admin.serviceProvider.serviceProvider') }}: </span>
              </v-col>
              <v-col
                cols="auto"
                data-testid="rolle-angebote"
              >
                {{ rolleStore.currentRolle.serviceProviders ?? '---' }}
              </v-col>
            </v-row>
            <!-- Systemrechte -->
            <v-row>
              <v-col
                class="text-right"
                sm="3"
                cols="5"
              >
                <span class="subtitle-2"> {{ $t('admin.rolle.systemrechte') }}: </span>
              </v-col>
              <v-col
                cols="auto"
                data-testid="rolle-systemrechte"
              >
                {{ rolleStore.currentRolle.systemrechte ?? '---' }}
              </v-col>
            </v-row>
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
