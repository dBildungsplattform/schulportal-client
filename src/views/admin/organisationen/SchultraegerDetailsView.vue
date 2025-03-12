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
  import SchultraegerSuccessTemplate from '@/components/admin/schultraeger/SchultraegerSuccessTemplate.vue';
  import SpshTooltip from '@/components/admin/SpshTooltip.vue';

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

  const progress: Ref<number> = ref<number>(0);
  const successMessage: Ref<string> = ref<string>('');

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

  const noUnassignedSchulenFoundText: Ref<string> = ref(t('admin.schultraeger.unassignedSchulenDefaultText'));

  async function navigateToSchultraegerManagement(): Promise<void> {
    formContext.resetForm();
    organisationStore.updatedOrganisation = null;
    progress.value = 0;
    successMessage.value = '';
    organisationStore.errorCode = '';
    await router.push({ name: 'schultraeger-management' });
  }

  async function navigateBackToSchultraegerDetails(): Promise<void> {
    formContext.resetForm();
    organisationStore.updatedOrganisation = null;
    progress.value = 0;
    successMessage.value = '';
    await router.push({ name: 'schultraeger-details' }).then(() => {
      router.go(0);
    });
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

    /* reset success message and progress bar before processing items */
    successMessage.value = '';
    progress.value = 0;

    if (assignableSchulen.value.length > 0) {
      assignableSchulen.value.forEach(async (schuleId: string, index: number) => {
        await organisationStore.assignSchuleToTraeger(currentSchultraegerId, { organisationId: schuleId });

        /* Update progress for each item processed */
        progress.value = Math.ceil(((index + 1) / assignableSchulen.value.length) * 100);

        /* Only show success message after all items have been processed */
        if (index === assignableSchulen.value.length - 1 && !organisationStore.errorCode) {
          successMessage.value = t('admin.schultraeger.schulenAssignedSuccessfully');
        }
      });
    }
  });

  function addAssignableSchule(schule: Organisation): void {
    assignableSchulen.value.push(schule.id);
    assignedSchulen.value = [schule, ...assignedSchulen.value];
    unassignedSchulen.value = unassignedSchulen.value.filter((item: Organisation) => item.id !== schule.id);
  }

  async function searchInAssignedSchulen(searchString: string): Promise<void> {
    if (!organisationStore.currentOrganisation) return;
    await organisationStore.fetchSchulenFromTraeger({
      searchString: searchString,
      zugehoerigZu: [currentSchultraegerId],
    });
    assignedSchulen.value = organisationStore.schulenFromTraeger;
  }

  async function searchInUnassignedSchulen(searchString: string): Promise<void> {
    if (!organisationStore.currentOrganisation || !searchString) return;
    await organisationStore.fetchSchulenWithoutTraeger({
      limit: 50,
      searchString: searchString,
      zugehoerigZu: [organisationStore.currentOrganisation.zugehoerigZu!],
    });
    unassignedSchulen.value = organisationStore.schulenWithoutTraeger;

    if (unassignedSchulen.value.length === 0) {
      noUnassignedSchulenFoundText.value = t('admin.schultraeger.noSchulenFound');
    }

    if (assignableSchulen.value.length > 0) {
      unassignedSchulen.value = unassignedSchulen.value.filter(
        (schule: Organisation) => !assignableSchulen.value.includes(schule.id),
      );
    }
  }

  onBeforeMount(async () => {
    organisationStore.errorCode = '';
    progress.value = 0;
    successMessage.value = '';

    await organisationStore.getRootKinderSchultraeger();
    await organisationStore.getOrganisationById(currentSchultraegerId, OrganisationsTyp.Traeger);
    await organisationStore.fetchSchulenFromTraeger({
      searchString: '',
      zugehoerigZu: [currentSchultraegerId],
    });
    assignedSchulen.value = organisationStore.schulenFromTraeger;

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
          v-if="progress === 0 && !organisationStore.updatedOrganisation"
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
            :title="$t('admin.schultraeger.schultraegerDetailsErrorTitle')"
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
          v-if="!organisationStore.errorCode && progress === 0 && !organisationStore.updatedOrganisation"
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
                :noUnassignedItemsFoundText="noUnassignedSchulenFoundText"
                @onHandleAssignedItemsSearchFilter="searchInAssignedSchulen"
                @onHandleUnassignedItemClick="addAssignableSchule"
                @onHandleUnassignedItemsSearchFilter="searchInUnassignedSchulen"
                :unassignedItems="unassignedSchulen"
                :unassignedItemsHeader="$t('admin.schultraeger.schulenWithoutTraeger')"
              >
                <template v-slot="{ item }">
                  <SpshTooltip
                    :enabledCondition="true"
                    :enabledText="`(${item.kennung}) ${item.name}`"
                  >
                    {{ `(${item.kennung}) ${item.name}` }}
                  </SpshTooltip>
                </template>
              </RelationshipAssign>
            </v-row>
          </v-container>
        </v-container>

        <!-- Result template on success after submit  -->
        <template v-if="organisationStore.updatedOrganisation && !organisationStore.errorCode">
          <SchultraegerSuccessTemplate
            :successMessage="$t('admin.schultraeger.schultraegerUpdatedSuccessfully')"
            :followingDataChanged="$t('admin.followingDataCreated')"
            :changedData="[
              {
                label: $t('admin.schultraeger.schultraegername'),
                value: organisationStore.updatedOrganisation.name,
                testId: 'updated-schultraeger-name',
              },
            ]"
            :backButtonText="$t('nav.backToDetails')"
            :createAnotherButtonText="$t('admin.schultraeger.createAnother')"
            :showBackButton="false"
            :showCreateAnotherButton="false"
            backButtonTestId="back-to-details-button"
            createAnotherButtonTestId="create-another-schultraeger-button"
            @onNavigateBackToSchultraegerManagement="navigateToSchultraegerManagement"
          />
        </template>

        <!-- Progress Bar -->
        <div
          v-if="progress > 0 && !organisationStore.errorCode"
          class="mt-4"
        >
          <v-container v-if="successMessage">
            <v-row justify="center">
              <v-col cols="auto">
                <v-icon
                  small
                  color="#1EAE9C"
                  icon="mdi-check-circle"
                ></v-icon>
              </v-col>
            </v-row>
            <p class="mt-2 text-center">
              {{ successMessage }}
            </p>
          </v-container>
          <v-row
            v-if="progress < 100"
            align="center"
            justify="center"
          >
            <v-col cols="auto">
              <v-icon
                aria-hidden="true"
                class="mr-2"
                icon="mdi-alert-circle-outline"
                size="small"
              ></v-icon>
              <span class="subtitle-2">
                {{ $t('admin.doNotCloseBrowserNotice') }}
              </span>
            </v-col>
          </v-row>
          <v-progress-linear
            class="mt-5"
            :modelValue="progress"
            color="primary"
            height="25"
          >
            <template v-slot:default="{ value }">
              <strong class="text-white">{{ Math.ceil(value) }}%</strong>
            </template>
          </v-progress-linear>
        </div>

        <v-row
          v-if="!organisationStore.errorCode"
          class="pt-3 px-2 save-cancel-row justify-end"
        >
          <v-col
            cols="12"
            sm="6"
            md="auto"
          >
            <v-btn
              class="secondary"
              data-testid="go-to-schultraeger-management-button"
              @click="navigateToSchultraegerManagement"
              :block="mdAndDown"
            >
              {{ $t('nav.backToList') }}
            </v-btn>
          </v-col>
          <v-col
            v-if="progress === 100 || organisationStore.updatedOrganisation"
            cols="12"
            sm="6"
            md="auto"
          >
            <v-btn
              class="secondary"
              data-testid="back-to-schultraeger-button"
              @click="navigateBackToSchultraegerDetails"
              :block="mdAndDown"
            >
              {{ $t('nav.backToDetails') }}
            </v-btn>
          </v-col>
          <v-col
            v-if="progress === 0 && !organisationStore.updatedOrganisation"
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

        <SpshAlert
          :model-value="!!organisationStore.errorCode"
          :title="$t('admin.schultraeger.schultraegerDetailsErrorTitle')"
          :type="'error'"
          :closable="false"
          :text="organisationStore.errorCode ? $t(`admin.schultraeger.errors.${organisationStore.errorCode}`) : ''"
          :showButton="true"
          :buttonText="$t('admin.schultraeger.backToSchultraeger')"
          :buttonAction="navigateBackToSchultraegerDetails"
          buttonClass="primary"
        />
      </template>
    </LayoutCard>
  </div>
</template>

<style></style>
