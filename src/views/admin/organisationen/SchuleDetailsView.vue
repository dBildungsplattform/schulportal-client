<script setup lang="ts">
  import LabeledField from '@/components/admin/LabeledField.vue';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import { OrganisationStore, ParentInfo, useOrganisationStore } from '@/stores/OrganisationStore';
  import { onMounted } from 'vue';
  import { Composer, useI18n } from 'vue-i18n';
  import { useRoute, useRouter, type RouteLocationNormalizedLoaded, type Router } from 'vue-router';

  const organisationStore: OrganisationStore = useOrganisationStore();

  const router: Router = useRouter();
  const route: RouteLocationNormalizedLoaded = useRoute();
  const { t }: Composer = useI18n({ useScope: 'global' });
  const currentSchuleId: string = route.params['id'] as string;

  const navigateToSchulenÜbersicht = (): void => {
    router.push({ name: 'schule-management' });
  };

  const mapSchulform = (id: string | undefined | null): string => {
    const schultraeger: ParentInfo | undefined = organisationStore.parentsTree.find(
      (parent: ParentInfo) => parent.id === id,
    );

    return schultraeger?.name ?? t('admin.organisation.unknownOrganisation');
  };
  onMounted(async () => {
    organisationStore.errorCode = '';
    await Promise.all([
      organisationStore.getOrganisationById(currentSchuleId),
      organisationStore.getOrganisationParentsTree(currentSchuleId),
    ]);
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
      :closable="!organisationStore.errorCode"
      data-testid="schule-details-card"
      :header="t('admin.schule.edit')"
      @onCloseClicked="navigateToSchulenÜbersicht"
      :padded="true"
      :showCloseText="true"
    >
      <div v-if="!organisationStore.errorCode">
        <v-container
          class="px-3 px-sm-16"
          data-testid="schule-details-container"
        >
          <div v-if="organisationStore.currentOrganisation">
            <v-row class="mt-2">
              <v-col
                cols="12"
                md="6"
              >
                <div class="compact-spacing">
                  <LabeledField
                    :label="t('admin.schule.dienststellennummer')"
                    :value="organisationStore.currentOrganisation.kennung ?? ''"
                    test-id="schule-dienststellennummer"
                  />
                  <LabeledField
                    :label="t('admin.schule.schulname')"
                    :value="organisationStore.currentOrganisation.name"
                    test-id="schule-name"
                  />
                  <LabeledField
                    :label="t('admin.schule.emailAdresse')"
                    :value="organisationStore.currentOrganisation.emailAdresse ?? ''"
                    test-id="schule-email"
                  />
                </div>
              </v-col>
              <v-col
                cols="12"
                md="6"
              >
                <div class="compact-spacing">
                  <LabeledField
                    :label="t('admin.schule.schulform')"
                    :value="mapSchulform(organisationStore.currentOrganisation.administriertVon)"
                    test-id="schule-schulform"
                  />
                  <LabeledField
                    :label="t('admin.schule.itsLearningActive')"
                    :value="organisationStore.currentOrganisation.itslearningEnabled ? t('yes') : t('no')"
                    test-id="schule-itslearning-enabled"
                  />
                </div>
              </v-col>
            </v-row>
          </div>
          <div v-else-if="organisationStore.loading">
            <v-progress-circular indeterminate></v-progress-circular>
          </div>
        </v-container>
      </div>
    </LayoutCard>
  </div>
</template>
