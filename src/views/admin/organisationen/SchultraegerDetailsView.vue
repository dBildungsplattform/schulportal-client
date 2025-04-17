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
    SchuleType,
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

  const assignedSchulen: Ref<Array<Organisation>> = ref([]);
  const unassignedSchulen: Ref<Array<Organisation>> = ref([]);

  const unpersistedSchulenToAssign: ComputedRef<Array<Organisation>> = computed(() =>
    assignedSchulen.value.filter((schule: Organisation) => schule.isNotPersisted),
  );

  const unpersistedSchulenToUnassign: ComputedRef<Array<Organisation>> = computed(() =>
    unassignedSchulen.value.filter((schule: Organisation) => schule.isNotPersisted),
  );

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
  const noAssignedSchulenFoundText: Ref<string> = ref('');

  async function navigateToSchultraegerManagement(): Promise<void> {
    formContext.resetForm();
    await router.push({ name: 'schultraeger-management' });
  }

  async function navigateBackToSchultraegerDetails(): Promise<void> {
    formContext.resetForm();
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

    /* Reset success message and progress bar before processing items */
    successMessage.value = '';
    progress.value = 0;

    if (unpersistedSchulenToAssign.value.length > 0) {
      for (let index: number = 0; index < unpersistedSchulenToAssign.value.length; index++) {
        const schuleId: string = unpersistedSchulenToAssign.value[index]!.id;

        await organisationStore.assignSchuleToTraeger(currentSchultraegerId, { organisationId: schuleId });

        /* Update progress for each item processed */
        progress.value = Math.ceil(((index + 1) / unpersistedSchulenToAssign.value.length) * 100);
      }

      /* Show success message only after all items have been processed */
      if (!organisationStore.errorCode) {
        successMessage.value = t('admin.schultraeger.schulenAssignedSuccessfully');
      }
    }

    if (unpersistedSchulenToUnassign.value.length > 0) {
      for (let index: number = 0; index < unpersistedSchulenToUnassign.value.length; index++) {
        const schuleId: string = unpersistedSchulenToUnassign.value[index]!.id;

        /* assign to traeger's parent */
        if (organisationStore.currentOrganisation?.zugehoerigZu) {
          await organisationStore.assignSchuleToTraeger(organisationStore.currentOrganisation.zugehoerigZu, {
            organisationId: schuleId,
          });
        }

        /* Update progress for each item processed */
        progress.value = Math.ceil(((index + 1) / unpersistedSchulenToUnassign.value.length) * 100);
      }

      /* Show success message only after all items have been processed */
      if (!organisationStore.errorCode) {
        successMessage.value = t('admin.schultraeger.schulenAssignedSuccessfully');
      }
    }
  });

  function prepareSchuleToAssign(schuleToAssign: Organisation): void {
    /* if schule is member of persisted schulen, remove isNotPersistedFlag */
    if (organisationStore.schulenFromTraeger.some((schuleFromTraeger: Organisation) => schuleFromTraeger.id === schuleToAssign.id)) {
      delete schuleToAssign['isNotPersisted'];
    } else {
      schuleToAssign = { ...schuleToAssign, isNotPersisted: true };
    }

    assignedSchulen.value = [schuleToAssign, ...assignedSchulen.value];
    unassignedSchulen.value = unassignedSchulen.value.filter((item: Organisation) => item.id !== schuleToAssign.id);
  }

  function prepareSchuleToUnassign(schule: Organisation): void {
    /* add isNotPersisted flag */
    const schuleWithPersistenceFlag: Organisation = { ...schule, isNotPersisted: true };

    unassignedSchulen.value = [schuleWithPersistenceFlag, ...unassignedSchulen.value];
    assignedSchulen.value = assignedSchulen.value.filter((item: Organisation) => item.id !== schule.id);
  }

  // This method will search for both assigned or unassigned Schulen depending on the parameter "type" which could be either 'assigned' or 'unassigned'.
  async function searchSchulen(searchString: string, type: SchuleType): Promise<void> {
    if (!organisationStore.currentOrganisation) return;

    /* if schule type is assigned, search in frontend */
    if (type === SchuleType.ASSIGNED) {
      noAssignedSchulenFoundText.value =
        assignedSchulen.value.length === 0 ? t('admin.schultraeger.noSchulenAssigned') : '';

      /* if no search string is given, use store variable as leading source to get all schulen from traeger */
      if (!searchString) {
        /* if there are unpersisted schulen to unassign, remove them from list, else keep assignedSchulen value */
        assignedSchulen.value = unpersistedSchulenToUnassign.value.length > 0 ? organisationStore.schulenFromTraeger.filter((schule: Organisation) => {
          return unpersistedSchulenToUnassign.value.some((unpersistedSchule: Organisation) => {
            return unpersistedSchule.id !== schule.id;
          });
        }) : assignedSchulen.value;

        /* if there are unpersisted schulen to assign, prepend them */
        assignedSchulen.value = unpersistedSchulenToAssign.value.length
          ? [...unpersistedSchulenToAssign.value, ...assignedSchulen.value]
          : assignedSchulen.value;
      } else {
        /* search locally in assigned schulen */
        assignedSchulen.value = assignedSchulen.value.filter((schule: Organisation) => {
          const searchStringLowerCase: string = searchString.toLowerCase();
          return (
            schule.name.toLowerCase().includes(searchStringLowerCase) ||
            (schule.kennung && schule.kennung.toLowerCase().includes(searchStringLowerCase))
          );
        });

        /* if input is given and no Schulen were found, show that there were none found */
        noAssignedSchulenFoundText.value =
          assignedSchulen.value.length === 0 && searchString ? t('admin.schultraeger.noSchulenFound') : '';
      }
    } else {
      /* if schule type is unassigned, fetch and search schulen from BE */
      /* cache unpersisted schulen before fetching from backend */
      const unpersistedSchulenToUnassignCache: Array<Organisation> = unpersistedSchulenToUnassign.value;

      await organisationStore.fetchSchulen(
        {
          searchString,
          zugehoerigZu: undefined,
          limit: 50,
        },
        type,
      );

      const currentOrganisationParentId: string | null | undefined = organisationStore.currentOrganisation.zugehoerigZu;
      const unpersistedSchulenToAssignIds: Array<string> = unpersistedSchulenToAssign.value.map(
        (schule: Organisation) => schule.id,
      );

      /* Filter unassigned Schulen to only include those having the same parent (zugehoerigZu) as the current Schultraeger,
         as well as removing the unpersisted schulen that have been assigned to the traeger */
      unassignedSchulen.value = organisationStore.schulenWithoutTraeger.filter(
        (schule: Organisation) =>
          schule.zugehoerigZu === currentOrganisationParentId && !unpersistedSchulenToAssignIds.includes(schule.id),
      );

      /* If no search string is given then ask for Input first */
      if (!searchString) {
        unassignedSchulen.value = [];
        noUnassignedSchulenFoundText.value = t('admin.schultraeger.unassignedSchulenDefaultText');
        return;
      }

      /* if input is given and no Schulen were found, show that there were none found */
      noUnassignedSchulenFoundText.value =
        unassignedSchulen.value.length === 0 && searchString ? t('admin.schultraeger.noSchulenFound') : '';

      /* if there are unpersisted schulen, add them back in after searching */
      unassignedSchulen.value = unpersistedSchulenToUnassignCache.length
        ? [...unpersistedSchulenToUnassignCache, ...unassignedSchulen.value]
        : unassignedSchulen.value;
    }
  }

  onBeforeMount(async () => {
    organisationStore.errorCode = '';
    progress.value = 0;
    successMessage.value = '';

    await organisationStore.getRootKinderSchultraeger();
    await organisationStore.getOrganisationById(currentSchultraegerId, OrganisationsTyp.Traeger);
    await organisationStore.fetchSchulen(
      {
        searchString: '',
        zugehoerigZu: [currentSchultraegerId],
      },
      SchuleType.ASSIGNED,
    );
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
    organisationStore.updatedOrganisation = null;
    progress.value = 0;
    successMessage.value = '';
    organisationStore.errorCode = '';
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
                :noAssignedItemsFoundText="noAssignedSchulenFoundText"
                :noUnassignedItemsFoundText="noUnassignedSchulenFoundText"
                @onHandleAssignedItemClick="prepareSchuleToUnassign"
                @onHandleAssignedItemsSearchFilter="
                  (searchString: string) => searchSchulen(searchString, SchuleType.ASSIGNED)
                "
                @onHandleUnassignedItemClick="prepareSchuleToAssign"
                @onHandleUnassignedItemsSearchFilter="
                  (searchString: string) => searchSchulen(searchString, SchuleType.UNASSIGNED)
                "
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
          <v-divider
            class="border-opacity-100 rounded my-6"
            color="#E5EAEF"
            thickness="6"
          ></v-divider>
        </div>

        <v-row
          v-if="!organisationStore.errorCode && (progress === 0 || progress === 100)"
          class="py-3 px-2 save-cancel-row justify-end"
        >
          <v-col
            v-if="progress === 0 || progress === 100 || organisationStore.updatedOrganisation"
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
              class="primary"
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
      </template>
    </LayoutCard>
  </div>
</template>

<style></style>
