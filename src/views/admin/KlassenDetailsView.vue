<script setup lang="ts">
  import { useOrganisationStore, type OrganisationStore } from '@/stores/OrganisationStore';
  import { computed, onBeforeMount, onUnmounted, ref, type ComputedRef, type Ref } from 'vue';
  import {
    type Router,
    useRouter,
    type RouteLocationNormalizedLoaded,
    useRoute,
    onBeforeRouteLeave,
    type RouteLocationNormalized,
    type NavigationGuardNext,
  } from 'vue-router';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import SpshAlert from '@/components/alert/SpshAlert.vue';
  import RolleForm from '@/components/form/RolleForm.vue';
  import { type Composer, useI18n } from 'vue-i18n';
  import { useDisplay } from 'vuetify';
  import { type BaseFieldProps, type TypedSchema, useForm } from 'vee-validate';
  import { toTypedSchema } from '@vee-validate/yup';
  import { object, string } from 'yup';
  import { DIN_91379A_EXT } from '@/utils/validation';

  const route: RouteLocationNormalizedLoaded = useRoute();
  const router: Router = useRouter();
  const { t }: Composer = useI18n({ useScope: 'global' });

  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();

  const organisationStore: OrganisationStore = useOrganisationStore();

  const currentOrganisationId: string = route.params['id'] as string;
  const isEditActive: Ref<boolean> = ref(false);

  const creationErrorText: Ref<string> = ref('');
  const creationErrorTitle: Ref<string> = ref('');

  const showUnsavedChangesDialog: Ref<boolean> = ref(false);

  const translatedSchulname: ComputedRef<string | undefined> = computed(() => {
    if (!organisationStore.currentOrganisation?.name) {
      return '---';
    }
    return organisationStore.currentOrganisation.kennung
      ? `${organisationStore.currentOrganisation.kennung} (${organisationStore.currentOrganisation.name})`
      : organisationStore.currentOrganisation.name;
  });

  const validationSchema: TypedSchema = toTypedSchema(
    object({
      selectedSchule: string().required(t('admin.klasse.rules.schule.required')),
      selectedKlassenname: string()
        .matches(DIN_91379A_EXT, t('admin.klasse.rules.klassenname.matches'))
        .required(t('admin.klasse.rules.klassenname.required')),
    }),
  );

  const vuetifyConfig = (state: {
    errors: Array<string>;
  }): { props: { error: boolean; 'error-messages': Array<string> } } => ({
    props: {
      error: !!state.errors.length,
      'error-messages': state.errors,
    },
  });

  type KlasseCreationForm = {
    selectedSchule: string;
    selectedKlassenname: string;
  };

  // eslint-disable-next-line @typescript-eslint/typedef
  const { defineField, handleSubmit, isFieldDirty, resetForm, resetField, setFieldValue } = useForm<KlasseCreationForm>(
    {
      validationSchema,
    },
  );

  const [selectedSchule, selectedSchuleProps]: [
    Ref<string>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineField('selectedSchule', vuetifyConfig);
  const [selectedKlassenname, selectedKlassennameProps]: [
    Ref<string>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = defineField('selectedKlassenname', vuetifyConfig);

  function isFormDirty(): boolean {
    return isFieldDirty('selectedSchule') || isFieldDirty('selectedKlassenname');
  }

  let blockedNext: () => void = () => {};

  function handleConfirmUnsavedChanges(): void {
    isEditActive.value = false;
    showUnsavedChangesDialog.value = false;
    blockedNext();
  }

  function activateEditing(): void {
    isEditActive.value = true;
  }

  function cancelEdit(): void {
    isEditActive.value = false;
  }

  function handleCancel(next: NavigationGuardNext): void {
    if (isFormDirty()) {
      showUnsavedChangesDialog.value = true;
      blockedNext = next;
    } else {
      cancelEdit();
    }
  }

  function preventNavigation(event: BeforeUnloadEvent): void {
    if (!isFormDirty()) return;
    event.preventDefault();
    /* Chrome requires returnValue to be set. */
    event.returnValue = '';
  }

  function navigateToKlasseManagement(): void {
    organisationStore.updatedOrganisation = null;
    router.push({ name: 'rolle-management' });
  }

  const handleAlertClose = (): void => {
    organisationStore.errorCode = '';
    navigateToKlasseManagement();
  };

  onBeforeMount(async () => {
    organisationStore.errorCode = '';
    await organisationStore.getOrganisationById(currentOrganisationId);

    // Set the initial values using the computed properties
    setFieldValue('selectedSchule', translatedSchulname.value || '');
    setFieldValue('selectedKlassenname', organisationStore.currentOrganisation?.name || '');

    /* listen for browser changes and prevent them when form is dirty */
    window.addEventListener('beforeunload', preventNavigation);
  });

  onBeforeRouteLeave((_to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
    if (isFormDirty()) {
      showUnsavedChangesDialog.value = true;
      blockedNext = next;
    } else {
      next();
    }
  });

  onUnmounted(() => {
    window.removeEventListener('beforeunload', preventNavigation);
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
      @onCloseClicked="navigateToKlasseManagement"
      :padded="true"
      :showCloseText="true"
    >
      <!-- Error Message Display -->
      <SpshAlert
        :model-value="!!organisationStore.errorCode"
        :title="creationErrorTitle || $t('admin.rolle.loadingErrorTitle')"
        :type="'error'"
        :closable="false"
        :text="creationErrorText || $t('admin.rolle.loadingErrorText')"
        :showButton="true"
        :buttonText="$t('nav.backToList')"
        :buttonAction="handleAlertClose"
        @update:modelValue="handleAlertClose"
      />

      <template v-if="!organisationStore.updatedOrganisation && !organisationStore.errorCode">
        <v-container>
          <div v-if="organisationStore.currentOrganisation">
            <RolleForm
              :onHandleConfirmUnsavedChanges="handleConfirmUnsavedChanges"
              :onHandleDiscard="navigateToKlasseManagement"
              :onShowDialogChange="(value: boolean) => (showUnsavedChangesDialog = value)"
              :onSubmit="onSubmit"
              :isEditActive="isEditActive"
              :readonly="true"
              ref="rolle-form"
              v-model:selectedSchule="selectedSchule"
              :selectedSchuleProps="selectedSchuleProps"
              v-model:selectedKlassenname="selectedKlassenname"
              :selectedKlassennameProps="selectedKlassennameProps"
              :showUnsavedChangesDialog="showUnsavedChangesDialog"
            ></RolleForm>
            <v-divider
              v-if="isEditActive"
              class="border-opacity-100 rounded"
              color="#E5EAEF"
              thickness="5px"
            ></v-divider>
            <div
              v-if="!isEditActive"
              class="d-flex justify-sm-end"
            >
              <v-col
                cols="12"
                sm="6"
                md="auto"
              >
                <v-btn
                  class="primary ml-lg-8"
                  data-testid="rolle-edit-button"
                  @Click="activateEditing"
                  :block="mdAndDown"
                >
                  {{ $t('edit') }}
                </v-btn>
              </v-col>
            </div>
            <div
              v-else
              class="d-flex justify-end"
            >
              <v-row class="pt-3 px-2 save-cancel-row justify-end">
                <v-col
                  class="cancel-col"
                  cols="12"
                  sm="6"
                  md="auto"
                >
                  <v-btn
                    class="secondary"
                    data-testid="rolle-edit-cancel"
                    @click="handleCancel"
                    :block="mdAndDown"
                  >
                    {{ $t('cancel') }}
                  </v-btn>
                </v-col>
                <v-col
                  cols="12"
                  sm="6"
                  md="auto"
                >
                  <v-btn
                    class="primary"
                    data-testid="rolle-changes-save"
                    @Click="onSubmit"
                    :block="mdAndDown"
                  >
                    {{ $t('save') }}
                  </v-btn>
                </v-col>
              </v-row>
            </div>
          </div>
          <div v-else-if="organisationStore.loading">
            <v-progress-circular indeterminate></v-progress-circular>
          </div>
        </v-container>
      </template>
    </LayoutCard>
  </div>
</template>

<style></style>