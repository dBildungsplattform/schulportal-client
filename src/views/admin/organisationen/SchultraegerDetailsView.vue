<script setup lang="ts">
  import { computed, onBeforeMount, onUnmounted, ref, type ComputedRef, type Ref } from 'vue';
  import { useI18n, type Composer } from 'vue-i18n';
  import {
    type Router,
    useRouter,
    onBeforeRouteLeave,
    type RouteLocationNormalized,
    type NavigationGuardNext,
    type RouteLocationNormalizedLoaded,
    useRoute,
  } from 'vue-router';
  import { useDisplay } from 'vuetify';
  import {
    OrganisationsTyp,
    type SchultraegerFormType,
    useOrganisationStore,
    type Organisation,
    type OrganisationStore,
  } from '@/stores/OrganisationStore';
  import { useForm, type TypedSchema, type FormContext } from 'vee-validate';
  import {
    getDirtyState,
    getSchultraegerFieldDefinitions,
    getValidationSchema,
    type SchultraegerFieldDefinitions,
  } from '@/utils/validationSchultraeger';
  import SpshAlert from '@/components/alert/SpshAlert.vue';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import SchultraegerForm from '@/components/admin/schultraeger/SchultraegerForm.vue';
  import RelationshipAssign from '@/components/admin/RelationshipAssign.vue';

  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();

  const { t }: Composer = useI18n({ useScope: 'global' });
  const validationSchema: TypedSchema = getValidationSchema(t);
  const router: Router = useRouter();
  const route: RouteLocationNormalizedLoaded = useRoute();
  const organisationStore: OrganisationStore = useOrganisationStore();

  const currentSchultraegerId: string = route.params['id'] as string;

  const assignableSchulen: Ref<Array<string>> = ref([]);
  const assignedSchulen: Ref<Array<Organisation>> = ref([]);
  const unassignedSchulen: Ref<Array<Organisation>> = ref([]);

  // eslint-disable-next-line @typescript-eslint/typedef
  const { resetForm } = useForm<SchultraegerFormType>({
    validationSchema,
  });

  const formContext: FormContext<SchultraegerFormType, SchultraegerFormType> = useForm<SchultraegerFormType>({
    validationSchema,
  });

  const {
    selectedSchultraegerform,
    selectedSchultraegername,
    selectedSchultraegernameProps,
  }: SchultraegerFieldDefinitions = getSchultraegerFieldDefinitions(formContext);

  const rootChildSchultraegerList: ComputedRef<Organisation[]> = computed(() => {
    return organisationStore.schultraeger;
  });

  const isFormDirty: ComputedRef<boolean> = computed(() => getDirtyState(formContext));
  const showUnsavedChangesDialog: Ref<boolean> = ref(false);
  let blockedNext: () => void = () => {};

  function handleConfirmUnsavedChanges(): void {
    showUnsavedChangesDialog.value = false;
    blockedNext();
    organisationStore.errorCode = '';
  }

  async function navigateToSchultraegerManagement(): Promise<void> {
    organisationStore.createdSchule = null;
  }

  async function navigateBackToSchultraegerDetails(): Promise<void> {
    if (organisationStore.errorCode === 'REQUIRED_STEP_UP_LEVEL_NOT_MET') {
      resetForm();
      await router.push({ name: 'schultraeger-details' }).then(() => {
        router.go(0);
      });
    } else {
      organisationStore.errorCode = '';
      await router.push({ name: 'schultraeger-details' });
    }
  }

  function preventNavigation(event: BeforeUnloadEvent): void {
    if (!isFormDirty.value) return;
    event.preventDefault();
    /* Chrome requires returnValue to be set. */
    event.returnValue = '';
  }

  const onSubmit: (e?: Event | undefined) => Promise<Promise<void> | undefined> = formContext.handleSubmit(async () => {
    if (
      selectedSchultraegername.value &&
      selectedSchultraegername.value !== organisationStore.currentOrganisation?.name
    ) {
      await organisationStore.updateOrganisationById(
        currentSchultraegerId,
        selectedSchultraegername.value,
        OrganisationsTyp.Traeger,
      );
    }

    if (assignableSchulen.value.length > 0) {
      assignableSchulen.value.forEach(async (schuleId: string) => {
        await organisationStore.assignSchuleToTraeger(currentSchultraegerId, { organisationId: schuleId });
      });
    }
  });

  function handleCancel(next: NavigationGuardNext): void {
    if (isFormDirty.value) {
      showUnsavedChangesDialog.value = true;
      blockedNext = next;
    } else {
      navigateToSchultraegerManagement();
    }
  }

  function addAssignableSchule(schule: Organisation): void {
    assignableSchulen.value.push(schule.id);
    assignedSchulen.value = [schule, ...assignedSchulen.value];
    unassignedSchulen.value = unassignedSchulen.value.filter((item: Organisation) => item.id !== schule.id);
  }

  async function searchInAssignedSchulen(searchString: string): Promise<void> {
    if (!organisationStore.currentOrganisation) return;
    assignedSchulen.value = await organisationStore.getSchulenByTraegerId({
      searchString: searchString,
      zugehoerigZu: [currentSchultraegerId],
    });
  }

  async function searchInUnassignedSchulen(searchString: string): Promise<void> {
    if (!organisationStore.currentOrganisation || !searchString) return;
    unassignedSchulen.value = await organisationStore.getSchulenByTraegerId({
      limit: 50,
      searchString: searchString,
      zugehoerigZu: [organisationStore.currentOrganisation.zugehoerigZu!],
    });

    if (assignableSchulen.value.length > 0) {
      unassignedSchulen.value = unassignedSchulen.value.filter(
        (schule: Organisation) => !assignableSchulen.value.includes(schule.id),
      );
    }
  }

  onBeforeMount(async () => {
    organisationStore.errorCode = '';

    await organisationStore.getRootKinderSchultraeger();
    await organisationStore.getOrganisationById(currentSchultraegerId, OrganisationsTyp.Traeger);
    assignedSchulen.value = await organisationStore.getSchulenByTraegerId({
      searchString: '',
      zugehoerigZu: [currentSchultraegerId],
    });

    // Set the initial values using the computed properties
    if (rootChildSchultraegerList.value.length > 0) {
      formContext.setFieldValue(
        'selectedSchultraegerform',
        rootChildSchultraegerList.value.find(
          (schultraeger: Organisation) => schultraeger.id === organisationStore.currentOrganisation?.zugehoerigZu,
        )?.id || '',
      );
    }
    formContext.setFieldValue('selectedSchultraegername', organisationStore.currentOrganisation?.name);

    /* listen for browser changes and prevent them when form is dirty */
    window.addEventListener('beforeunload', preventNavigation);
  });

  onBeforeRouteLeave((_to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
    if (isFormDirty.value) {
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
    <h1
      class="text-center headline"
      data-testid="admin-headline"
    >
      {{ $t('admin.headline') }}
    </h1>
    <LayoutCard
      :closable="!organisationStore.errorCode"
      @onCloseClicked="navigateToSchultraegerManagement"
      :header="$t('admin.schultraeger.edit')"
      :padded="true"
      :showCloseText="true"
    >
      <!-- The form to edit the current Schultraeger -->
      <template v-if="organisationStore.currentOrganisation">
        <SchultraegerForm
          :errorCode="organisationStore.errorCode"
          :isLoading="organisationStore.loading"
          :onHandleConfirmUnsavedChanges="handleConfirmUnsavedChanges"
          :onHandleDiscard="navigateToSchultraegerManagement"
          :onShowDialogChange="(value?: boolean) => (showUnsavedChangesDialog = value || false)"
          :onSubmit="onSubmit"
          :readonly="true"
          ref="schultraeger-edit-form"
          :rootChildSchultraegerList="rootChildSchultraegerList"
          :selectedSchultraegernameProps="selectedSchultraegernameProps"
          :showUnsavedChangesDialog="showUnsavedChangesDialog"
          v-model:selectedSchultraegerform="selectedSchultraegerform"
          v-model:selectedSchultraegername="selectedSchultraegername"
        >
          <!-- Error Message Display if error on submit -->
          <!-- To trigger unsaved changes dialog the alert has to be inside the form wrapper -->
          <SpshAlert
            :model-value="!!organisationStore.errorCode"
            :title="$t('admin.schultraeger.schultraegerCreateErrorTitle')"
            :type="'error'"
            :closable="false"
            :text="organisationStore.errorCode ? $t(`admin.schultraeger.errors.${organisationStore.errorCode}`) : ''"
            :showButton="true"
            :buttonText="$t('admin.schultraeger.backToSchultraeger')"
            :buttonAction="navigateBackToSchultraegerDetails"
            buttonClass="primary"
          />
        </SchultraegerForm>

        <v-container
          v-if="!organisationStore.errorCode"
          class="px-3 px-sm-16"
        >
          <v-container class="px-lg-16">
            <v-row>
              <v-col>
                <h3 class="headline-3">3. {{ $t('admin.schultraeger.assignSchulenOrganisationally') }}</h3>
              </v-col>
            </v-row>
            <v-row class="align-center mt-8 px-5">
              <RelationshipAssign
                :assignedItems="assignedSchulen"
                :assignedItemsHeader="$t('admin.schultraeger.schulenOfThisTraeger', { amount: assignedSchulen.length })"
                noAssignedItemsFoundText=""
                :noUnassignedItemsFoundText="$t('admin.schultraeger.unassignedSchulenDefaultText')"
                @onHandleAssignedItemsSearchFilter="searchInAssignedSchulen"
                @onHandleUnassignedItemClick="addAssignableSchule"
                @onHandleUnassignedItemsSearchFilter="searchInUnassignedSchulen"
                :unassignedItems="unassignedSchulen"
                :unassignedItemsHeader="$t('admin.schultraeger.schulenWithoutTraeger')"
              >
                <template v-slot="{ item }">
                  {{ `(${item.kennung}) ${item.name}` }}
                </template>
              </RelationshipAssign>
            </v-row>
          </v-container>
        </v-container>

        <v-row
          v-if="!organisationStore.errorCode"
          class="pt-3 px-2 save-cancel-row justify-end"
        >
          <v-col
            class="cancel-col"
            cols="12"
            sm="6"
            md="auto"
          >
            <v-btn
              class="secondary"
              data-testid="schultraeger-edit-cancel-button"
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
              data-testid="schultraeger-edit-save-button"
              @click="onSubmit"
              :block="mdAndDown"
              :disabled="organisationStore.loading"
            >
              {{ $t('save') }}
            </v-btn>
          </v-col>
        </v-row>
      </template>
    </LayoutCard>
  </div>
</template>

<style></style>
