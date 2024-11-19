<script setup lang="ts">
  import FormWrapper from '@/components/form/FormWrapper.vue';
  import FormRow from '@/components/form/FormRow.vue';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import {
    onBeforeRouteLeave,
    useRouter,
    type NavigationGuardNext,
    type RouteLocationNormalized,
    type Router,
  } from 'vue-router';
  import { useRollen, type TranslatedRolleWithAttrs } from '@/composables/useRollen';
  import { usePersonenkontextStore, type PersonenkontextStore } from '@/stores/PersonenkontextStore';
  import { useSchulen } from '@/composables/useSchulen';
  import { computed, onMounted, onUnmounted, ref, watch, type ComputedRef, type Ref } from 'vue';
  import type { TranslatedObject } from '@/types';
  import { useForm, type BaseFieldProps, type FormContext, type TypedSchema } from 'vee-validate';
  import { toTypedSchema } from '@vee-validate/yup';
  import { array, mixed, object, string } from 'yup';
  import { useI18n, type Composer } from 'vue-i18n';
  import { useDisplay } from 'vuetify';
  import { useOrganisationStore, type OrganisationStore } from '@/stores/OrganisationStore';
  import { type ImportStore, useImportStore } from '@/stores/ImportStore';
  import { RollenArt } from '@/stores/RolleStore';
  import SpshAlert from '@/components/alert/SpshAlert.vue';

  const organisationStore: OrganisationStore = useOrganisationStore();
  const importStore: ImportStore = useImportStore();
  const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();

  const router: Router = useRouter();
  const { t }: Composer = useI18n({ useScope: 'global' });
  const { smAndDown }: { smAndDown: Ref<boolean> } = useDisplay();
  const confirmationDialogVisible: Ref<boolean> = ref(false);

  const allRollen: ComputedRef<TranslatedRolleWithAttrs[] | undefined> = useRollen();
  const lernRollen: ComputedRef<TranslatedRolleWithAttrs[] | undefined> = computed(() => {
    if (!allRollen.value) {
      return [];
    }

    return allRollen.value.filter((rolle: TranslatedRolleWithAttrs) => {
      return rolle.rollenart === RollenArt.Lern;
    });
  });
  const schulen: ComputedRef<TranslatedObject[] | undefined> = useSchulen();
  const searchInputSchule: Ref<string> = ref('');

  let timerId: ReturnType<typeof setTimeout>;

  const validationSchema: TypedSchema = toTypedSchema(
    object({
      selectedSchule: string().required(t('admin.import.rules.schule.required')),
      selectedRolle: string().required(t('admin.import.rules.rolle.required')),
      selectedFiles: array()
        .of(mixed())
        .required(t('admin.import.rules.files.required'))
        .length(1, t('admin.import.rules.files.required')),
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

  type PersonImportForm = {
    selectedSchule: string;
    selectedRolle: string;
    selectedFiles: Array<File>;
  };

  const formContext: FormContext<PersonImportForm, PersonImportForm> = useForm<PersonImportForm>({
    validationSchema,
  });

  const [selectedSchule, selectedSchuleProps]: [
    Ref<string | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = formContext.defineField('selectedSchule', vuetifyConfig);

  const [selectedRolle, selectedRolleProps]: [
    Ref<string | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = formContext.defineField('selectedRolle', vuetifyConfig);

  const [selectedFiles, selectedFilesProps]: [
    Ref<Array<File> | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = formContext.defineField('selectedFiles', vuetifyConfig);

  // Computed property to get the title of the selected schule
  const selectedSchuleTitle: ComputedRef<string | undefined> = computed(() => {
    return schulen.value?.find((org: TranslatedObject) => org.value === selectedSchule.value)?.title;
  });

  watch(selectedSchule, async (newValue: string | undefined, oldValue: string | undefined) => {
    if (newValue && newValue !== oldValue) {
      // Fetch rollen after selecting the organization
      await personenkontextStore.processWorkflowStep({
        organisationId: newValue,
        limit: 25,
      });

      // Reset the selectedRolle field only if oldValue was not undefined
      if (oldValue !== undefined) {
        selectedRolle.value = undefined;
      }
    } else if (!newValue) {
      // If the organization is cleared, reset selectedRolle
      selectedRolle.value = undefined;
    }

    importStore.uploadResponse = null;
  });

  watch(selectedFiles, (newValue: File[] | undefined, oldValue: File[] | undefined) => {
    if (newValue && newValue[0] !== oldValue?.[0]) {
      importStore.uploadResponse = null;
    }
  });

  watch(searchInputSchule, (newValue: string | undefined, _oldValue: string | undefined) => {
    if (!newValue || newValue === selectedSchuleTitle.value) {
      return;
    }

    /* cancel pending call */
    clearTimeout(timerId);

    /* delay new call 500ms */
    timerId = setTimeout(() => {
      personenkontextStore.processWorkflowStep({
        organisationName: newValue,
        limit: 25,
      });
    }, 500);
  });

  const showUploadSuccessTemplate: ComputedRef<boolean> = computed(() => {
    return (
      (importStore.uploadResponse?.isValid as boolean) &&
      !importStore.importedData &&
      !importStore.uploadIsLoading &&
      !importStore.importIsLoading &&
      !importStore.errorCode
    );
  });

  const totalImportItems: ComputedRef<number> = computed(() => {
    return importStore.uploadResponse?.totalImportDataItems as number;
  });

  function clearSelectedRolle(): void {
    selectedRolle.value = undefined;
  }

  function clearSelectedSchule(): void {
    selectedSchule.value = undefined;
  }

  function navigateToPersonTable(): void {
    router.push({ name: 'person-management' });
  }

  function uploadFile(): void {
    if (selectedSchule.value === undefined || selectedRolle.value === undefined || !selectedFiles.value?.length) {
      return;
    }

    importStore.uploadPersonenImportFile(
      selectedSchule.value as string,
      selectedRolle.value as string,
      selectedFiles.value[0] as File,
    );
  }

  function anotherImport(): void {
    importStore.uploadResponse = null;
    importStore.importedData = null;
    formContext.resetForm();
  }

  function backToUpload(): void {
    importStore.errorCode = null;
    importStore.uploadResponse = null;
    importStore.importedData = null;
  }

  function cancelImport(): void {
    backToUpload();
    confirmationDialogVisible.value = false;
  }

  function openConfirmationDialog(): void {
    confirmationDialogVisible.value = true;
  }

  function executeImport(): void {
    confirmationDialogVisible.value = false;
    importStore.executePersonenImport(
      importStore.uploadResponse?.importvorgangId as string,
      selectedSchule.value as string,
      selectedRolle.value as string,
    );
  }

  function downloadFile(): void {
    const blob: Blob = new Blob([importStore.importedData as File], { type: 'text/plain' });
    const url: string = window.URL.createObjectURL(blob);
    const link: HTMLAnchorElement = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${t('admin.import.fileName.person')}.txt`);
    document.body.appendChild(link);
    link.click();
  }

  const onSubmit: (e?: Event | undefined) => Promise<void | undefined> = formContext.handleSubmit(() => {
    uploadFile();
  });

  function isFormDirty(): boolean {
    return (
      formContext.isFieldDirty('selectedSchule') ||
      formContext.isFieldDirty('selectedRolle') ||
      formContext.isFieldDirty('selectedFiles')
    );
  }
  const showUnsavedChangesDialog: Ref<boolean> = ref(false);
  let blockedNext: () => void = () => {};

  function handleConfirmUnsavedChanges(): void {
    blockedNext();
  }

  function preventNavigation(event: BeforeUnloadEvent): void {
    if (!isFormDirty()) return;
    event.preventDefault();
    /* Chrome requires returnValue to be set. */
    event.returnValue = '';
  }

  onBeforeRouteLeave((_to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
    if (isFormDirty()) {
      showUnsavedChangesDialog.value = true;
      blockedNext = next;
    } else {
      importStore.uploadResponse = null;
      importStore.importedData = null;
      next();
    }
  });

  onMounted(async () => {
    await personenkontextStore.processWorkflowStep({ limit: 25 });
    importStore.uploadResponse = null;
    importStore.importedData = null;
    organisationStore.errorCode = '';
    /* listen for browser changes and prevent them when form is dirty */
    window.addEventListener('beforeunload', preventNavigation);
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
      :closable="true"
      data-testid="person-import-card"
      :header="$t('admin.person.import')"
      @onCloseClicked="navigateToPersonTable"
      :padded="true"
      :showCloseText="true"
    >
      <!-- Error Message Display for error messages from the personStore -->
      <SpshAlert
        :model-value="!!importStore.errorCode"
        :title="$t('admin.import.uploadErrorTitle')"
        :type="'error'"
        :closable="false"
        :showButton="true"
        :buttonText="$t('admin.import.backToUpload')"
        :buttonAction="backToUpload"
        :text="$t(`admin.import.errors.${importStore.errorCode}`)"
      />

      <!-- Import success template -->
      <template v-if="importStore.importedData && !importStore.importIsLoading && !importStore.errorCode">
        <v-container>
          <v-row justify="center">
            <v-col cols="auto">
              <v-icon
                aria-hidden="true"
                color="#1EAE9C"
                icon="mdi-check-circle"
                small
              >
              </v-icon>
            </v-col>
          </v-row>
          <v-row justify="center">
            <v-col
              class="subtitle-1"
              cols="auto"
            >
              <span data-testid="person-import-success-text">
                {{ $t('admin.import.importedSuccessfully') }}
              </span>
            </v-col>
          </v-row>
          <v-row justify="center">
            <v-col cols="auto">
              <v-btn
                class="secondary"
                @click="anotherImport()"
                data-testid="another-import-button"
              >
                {{ $t('admin.import.anotherImport') }}
              </v-btn>
            </v-col>
            <v-col cols="auto">
              <v-btn
                class="primary"
                @click="downloadFile()"
                data-testid="download-file-button"
              >
                {{ $t('admin.import.downloadUserdata') }}
              </v-btn>
            </v-col>
          </v-row>
        </v-container>
      </template>

      <!-- Import loading template -->
      <template v-if="importStore.importIsLoading && !importStore.errorCode">
        <v-container>
          <v-row justify="center">
            <v-col cols="auto">
              <v-progress-circular
                data-testid="import-progress-spinner"
                indeterminate
                size="64"
              ></v-progress-circular>
            </v-col>
          </v-row>
        </v-container>
      </template>

      <!-- Upload form -->
      <FormWrapper
        v-if="!importStore.errorCode"
        :confirmUnsavedChangesAction="handleConfirmUnsavedChanges"
        :createButtonLabel="$t('admin.import.uploadFile')"
        :discardButtonLabel="$t('nav.backToList')"
        :hideActions="showUploadSuccessTemplate"
        id="person-import-form"
        :onDiscard="navigateToPersonTable"
        :onSubmit="onSubmit"
        @onShowDialogChange="(value?: boolean) => (showUnsavedChangesDialog = value || false)"
        :showUnsavedChangesDialog="showUnsavedChangesDialog"
      >
        <!-- Upload success template -->
        <template v-if="showUploadSuccessTemplate">
          <v-container>
            <v-row justify="center">
              <v-col cols="auto">
                <v-icon
                  aria-hidden="true"
                  color="#1EAE9C"
                  icon="mdi-check-circle"
                  small
                >
                </v-icon>
              </v-col>
            </v-row>
            <v-row justify="center">
              <v-col
                class="subtitle-1"
                cols="auto"
              >
                <span data-testid="person-upload-success-text">
                  {{ $t('admin.import.uploadedSuccessfully') }}
                  {{ $t('admin.import.recordsReadyForImport', { count: totalImportItems }) }}
                </span>
              </v-col>
            </v-row>
            <v-row justify="center">
              <v-col cols="auto">
                <v-btn
                  class="secondary"
                  @click="backToUpload()"
                  data-testid="back-to-upload-button"
                >
                  {{ $t('admin.import.backToUpload') }}
                </v-btn>
              </v-col>
              <v-col cols="auto">
                <v-btn
                  class="primary"
                  @click="openConfirmationDialog()"
                  data-testid="open-confirmation-dialog-button"
                >
                  {{ $t('admin.import.executeImport') }}
                </v-btn>
              </v-col>
            </v-row>
          </v-container>
        </template>

        <!-- Actual form -->
        <template v-if="!showUploadSuccessTemplate">
          <!-- Schulauswahl -->
          <FormRow
            :errorLabel="selectedSchuleProps['error']"
            :isRequired="true"
            labelForId="schule-select"
            :label="$t('admin.schule.schule')"
          >
            <v-autocomplete
              autocomplete="off"
              clearable
              @click:clear="clearSelectedSchule"
              data-testid="schule-select"
              density="compact"
              id="schule-select"
              ref="schule-select"
              :items="schulen"
              item-value="value"
              item-text="title"
              :no-data-text="$t('noDataFound')"
              :placeholder="$t('admin.schule.selectSchule')"
              required="true"
              variant="outlined"
              v-bind="selectedSchuleProps"
              v-model="selectedSchule"
              v-model:search="searchInputSchule"
            ></v-autocomplete>
          </FormRow>

          <!-- Rollenauswahl (currently limited to SuS) -->
          <FormRow
            :errorLabel="selectedRolleProps['error']"
            labelForId="rolle-select"
            :isRequired="true"
            :label="$t('admin.rolle.rolle')"
          >
            <v-autocomplete
              autocomplete="off"
              clearable
              @click:clear="clearSelectedRolle"
              data-testid="rolle-select"
              density="compact"
              id="rolle-select"
              ref="rolle-select"
              :items="lernRollen"
              item-value="value"
              item-text="title"
              :no-data-text="$t('noDataFound')"
              :placeholder="$t('admin.rolle.selectRolle')"
              required="true"
              variant="outlined"
              v-bind="selectedRolleProps"
              v-model="selectedRolle"
            ></v-autocomplete>
          </FormRow>

          <!-- File Upload -->
          <FormRow
            :errorLabel="selectedFilesProps['error']"
            :isRequired="true"
            labelForId="file-upload"
            :label="$t('admin.import.uploadFile')"
          >
            <v-file-input
              accept=".csv"
              data-testid="file-input"
              :label="$t('admin.import.selectOrDropFile')"
              prepend-icon=""
              prepend-inner-icon="mdi-paperclip"
              variant="outlined"
              v-model="selectedFiles"
              v-bind="selectedFilesProps"
            ></v-file-input>
          </FormRow>
        </template>

        <!-- Invalid data template -->
        <template v-if="importStore.uploadResponse?.totalInvalidImportDataItems">
          <v-alert
            class="border-md mt-4"
            data-testid="invalid-import-data-alert"
            type="error"
            variant="outlined"
          >
            <v-row>
              <v-col
                class="primary-text-color"
                cols="auto"
              >
                <strong data-testid="import-errors-title">{{ $t('admin.import.errors.followingDataInvalid') }}</strong>
              </v-col>
            </v-row>
            <v-row
              v-for="(invalidItem, index) in importStore.uploadResponse.invalidImportDataItems"
              :key="index"
              class="invalid-items"
              :data-testid="`invalid-item-row-${index + 1}`"
              dense
            >
              <v-col
                class="primary-text-color"
                cols="3"
              >
                <span data-testid="invalid-item-nachname">{{ invalidItem.nachname }}</span>
              </v-col>
              <v-col
                class="primary-text-color"
                cols="3"
              >
                <span data-testid="invalid-item-vorname">{{ invalidItem.vorname }}</span>
              </v-col>
              <v-col
                class="primary-text-color"
                cols="1"
              >
                <span data-testid="invalid-item-klasse">{{ invalidItem.klasse }}</span>
              </v-col>
              <v-col
                class="primary-text-color"
                cols="5"
              >
                <span
                  v-for="(error, index) in invalidItem.validationErrors"
                  :key="index"
                  data-testid="invalid-item-errors"
                >
                  {{ $t(`admin.import.errors.${error}`)
                  }}{{ index < invalidItem.validationErrors.length - 1 ? ', ' : '' }}
                </span>
              </v-col>
            </v-row>
          </v-alert>
        </template>
      </FormWrapper>
    </LayoutCard>
  </div>
  <v-dialog
    v-model="confirmationDialogVisible"
    persistent
  >
    <LayoutCard
      v-if="confirmationDialogVisible"
      :closable="false"
      :header="$t('admin.person.import')"
    >
      <v-card-text>
        <v-container>
          <v-row class="text-body bold ml-2">
            <v-col
              offset="1"
              cols="10"
            >
              <span data-testid="person-import-confirmation-text">
                {{ $t('admin.import.confirmationText') }}
              </span>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
      <v-card-actions class="justify-center">
        <v-row class="justify-center">
          <v-col
            cols="12"
            sm="6"
            md="4"
          >
            <v-btn
              :block="smAndDown"
              class="secondary"
              @click="cancelImport()"
              data-testid="cancel-import-button"
            >
              {{ $t('cancel') }}
            </v-btn>
          </v-col>
          <v-col
            cols="12"
            sm="6"
            md="4"
          >
            <v-btn
              :block="smAndDown"
              class="primary"
              @click="executeImport()"
              data-testid="execute-import-button"
            >
              {{ $t('admin.import.executeImport') }}
            </v-btn>
          </v-col>
        </v-row>
      </v-card-actions>
    </LayoutCard>
  </v-dialog>
</template>

<style lang="scss" scoped>
  .invalid-items {
    font-size: 16px;
  }
</style>
