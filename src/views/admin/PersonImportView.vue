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
  import {
    ImportDataItemStatus,
    type ImportedUserResponse,
    type ImportStore,
    useImportStore,
  } from '@/stores/ImportStore';
  import { RollenArt } from '@/stores/RolleStore';
  import SpshAlert from '@/components/alert/SpshAlert.vue';

  const organisationStore: OrganisationStore = useOrganisationStore();
  const importStore: ImportStore = useImportStore();
  const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();

  const router: Router = useRouter();
  const { t }: Composer = useI18n({ useScope: 'global' });
  const { smAndDown }: { smAndDown: Ref<boolean> } = useDisplay();

  const confirmationDialogVisible: Ref<boolean> = ref(false);

  const isDownloadingFile: Ref<boolean> = ref(false);

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
      !importStore.importResponse &&
      !importStore.uploadIsLoading &&
      !importStore.importIsLoading &&
      !importStore.errorCode &&
      importStore.importProgress === 0
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
    formContext.resetForm();
    importStore.errorCode = null;
    importStore.uploadResponse = null;
    importStore.importResponse = null;
    importStore.importProgress = 0;
    router.push({ name: 'person-management' });
  }

  function convertToUTF8(buffer: ArrayBuffer): string {
    // Try decoding as UTF-8 first
    const utf8Decoder: TextDecoder = new TextDecoder('utf-8', { fatal: false });
    const utf8Text: string = utf8Decoder.decode(buffer);

    // If decoding as UTF-8 doesn't result in invalid characters
    if (utf8Text && !utf8Text.includes('�')) {
      return utf8Text;
    }

    // Try other encodings (Windows-1252, ISO-8859-1, etc.)
    const encodingsToTry: string[] = ['windows-1252', 'iso-8859-1', 'utf-16', 'utf-16le', 'utf-16be'];

    for (const encoding of encodingsToTry) {
      try {
        const decoder: TextDecoder = new TextDecoder(encoding, { fatal: true });
        const decodedText: string = decoder.decode(buffer);
        // If it successfully decodes without errors, return the decoded text
        return decodedText;
      } catch (e) {
        // If the decoding fails, continue with the next encoding
        continue;
      }
    }

    // If all decoding attempts fail, return a fallback (perhaps empty string or an error message)
    throw new Error('Unable to decode file using known encodings.');
  }

  // Reads the file and converts it to UTF-8
  function readFileAsUTF8(file: File): Promise<string> {
    return new Promise((resolve: (value: string | PromiseLike<string>) => void, reject: (reason?: unknown) => void) => {
      const reader: FileReader = new FileReader();

      reader.onload = (event: ProgressEvent<FileReader>): void => {
        try {
          // Convert from unknown encoding to UTF-8
          const utf8Text: string = convertToUTF8(event.target?.result as ArrayBuffer);
          resolve(utf8Text);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = (error: ProgressEvent<FileReader>): void => reject(error);

      // Read the file as ArrayBuffer
      reader.readAsArrayBuffer(file);
    });
  }

  async function uploadFile(): Promise<void> {
    if (selectedSchule.value === undefined || selectedRolle.value === undefined || !selectedFiles.value?.length) {
      return;
    }

    const originalFile: File = selectedFiles.value[0] as File;

    // Read the file content and convert to UTF-8
    const fileText: string = await readFileAsUTF8(originalFile);

    // Create a new File object with UTF-8 encoded content
    const utf8Blob: Blob = new Blob(['\uFEFF' + fileText], { type: 'text/csv;charset=utf-8' });
    const utf8File: File = new File([utf8Blob], originalFile.name, { type: 'text/csv;charset=utf-8' });

    // Update selected files with the UTF-8 version
    selectedFiles.value![0] = utf8File;

    // Perform the upload with the UTF-8 encoded file
    importStore.uploadPersonenImportFile(selectedSchule.value as string, selectedRolle.value as string, utf8File);
  }

  function anotherImport(): void {
    importStore.errorCode = '';
    importStore.uploadResponse = null;
    importStore.importResponse = null;
    importStore.importProgress = 0;
    formContext.resetForm();
  }

  function backToUpload(): void {
    importStore.errorCode = null;
    importStore.uploadResponse = null;
    importStore.importResponse = null;
  }

  function cancelImport(): void {
    backToUpload();
    confirmationDialogVisible.value = false;
  }

  function openConfirmationDialog(): void {
    confirmationDialogVisible.value = true;
  }

  async function executeImport(): Promise<void> {
    confirmationDialogVisible.value = false;
    const importvorgangId: string = importStore.uploadResponse?.importvorgangId as string;

    await importStore.executePersonenImport(importvorgangId);

    // Only start polling if the execution was successful (no error)
    if (!importStore.errorCode) {
      importStore.startImportStatusPolling(importvorgangId);
    }
  }

  function downloadFileContent(fileContent: string): void {
    const blob: Blob = new Blob([fileContent], { type: 'text/plain' });
    const url: string = window.URL.createObjectURL(blob);

    const link: HTMLAnchorElement = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${t('admin.import.fileName.person')}.txt`);
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);
  }

  function createFileContentFromUsers(users: ImportedUserResponse[]): string {
    const successfulUsers: ImportedUserResponse[] = users.filter(
      (user: ImportedUserResponse) => user.status === ImportDataItemStatus.Success,
    );
    const failedUsers: ImportedUserResponse[] = users.filter(
      (user: ImportedUserResponse) => user.status === ImportDataItemStatus.Failed,
    );

    let fileContent: string = `Schule: ${importStore.importResponse?.organisationsname} - Rolle: ${importStore.importResponse?.rollenname}`;
    fileContent += `\n\n${t('admin.import.successfullyImportedUsersNotice')}\n\n`;
    fileContent += 'Klasse - Vorname - Nachname - Benutzername - Passwort\n';

    successfulUsers.forEach((user: ImportedUserResponse) => {
      fileContent += `${user.klasse} - ${user.vorname} - ${user.nachname} - ${user.benutzername} - ${user.startpasswort}\n`;
    });

    if (failedUsers.length > 0) {
      fileContent += `\n\n${t('admin.import.failedToImportUsersNotice')}\n\n`;
      fileContent += 'Klasse - Vorname - Nachname - Benutzername\n';

      failedUsers.forEach((user: ImportedUserResponse) => {
        fileContent += `${user.klasse} - ${user.vorname} - ${user.nachname} - ${user.benutzername}\n`;
      });
    }

    return fileContent;
  }

  async function downloadFile(): Promise<void> {
    isDownloadingFile.value = true;
    try {
      const totalUsers: number = importStore.importResponse?.total as number;
      const itemsPerPage: number = importStore.importedUsersPerPage;
      const totalPagesNumber: number = Math.ceil(totalUsers / itemsPerPage);

      let allImportedUsers: ImportedUserResponse[] = [];

      for (let pageIndex: number = 0; pageIndex < totalPagesNumber; pageIndex++) {
        const offset: number = pageIndex * itemsPerPage;
        await new Promise((resolve: (value: unknown) => void) => setTimeout(resolve, pageIndex * 600));

        await importStore.getImportedPersons(
          importStore.uploadResponse?.importvorgangId as string,
          offset,
          itemsPerPage,
        );

        allImportedUsers = allImportedUsers.concat(importStore.importResponse?.importedUsers || []);
      }

      const fileContent: string = createFileContentFromUsers(allImportedUsers);
      downloadFileContent(fileContent);
    } catch (error) {
      // While downloading the file, it could happen that some users can't be downloaded even though they were imported successfully...
      // In that case it makes sense to ignore errors and just go forward with the other users for better usability.
      importStore.errorCode = '';
    } finally {
      isDownloadingFile.value = false;
    }
  }

  const onSubmit: (e?: Event | undefined) => Promise<void | undefined> = formContext.handleSubmit(() => {
    uploadFile();
  });

  function isFormDirty(): boolean {
    // Form dirtiness check only if the import was not executed yet
    if (importStore.importProgress === 0) {
      return (
        formContext.isFieldDirty('selectedSchule') ||
        formContext.isFieldDirty('selectedRolle') ||
        formContext.isFieldDirty('selectedFiles')
      );
    }
    return false;
  }
  const showUnsavedChangesDialog: Ref<boolean> = ref(false);
  let blockedNext: () => void = () => {};

  function handleConfirmUnsavedChanges(): void {
    blockedNext();
    importStore.errorCode = '';
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
      // Delete the Imported items once the user leaves the page
      if (importStore.importResponse) {
        const importvorgangId: string = importStore.uploadResponse?.importvorgangId as string;
        importStore.deleteImportVorgangById(importvorgangId);
      }
      importStore.uploadResponse = null;
      importStore.importResponse = null;
      next();
    }
  });

  onMounted(async () => {
    await personenkontextStore.processWorkflowStep({ limit: 25 });
    importStore.uploadResponse = null;
    importStore.importResponse = null;
    importStore.importProgress = 0;
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
      <!-- Import success template -->
      <template v-if="importStore.importProgress === 100 && !importStore.importIsLoading && !isDownloadingFile">
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
                @click="anotherImport"
                data-testid="another-import-button"
              >
                {{ $t('admin.import.anotherImport') }}
              </v-btn>
            </v-col>
            <v-col cols="auto">
              <v-btn
                class="primary"
                @click="downloadFile"
                data-testid="download-all-data-button"
                :disabled="importStore.importIsLoading || importStore.retrievalIsLoading"
              >
                {{ $t('admin.import.downloadUserdata') }}
              </v-btn>
            </v-col>
          </v-row>
        </v-container>
      </template>

      <v-template v-else-if="isDownloadingFile">
        <v-container>
          <v-row class="justify-center">
            <v-col cols="auto">
              <v-icon
                aria-hidden="true"
                class="mr-2"
                icon="mdi-alert-circle-outline"
                size="small"
              ></v-icon>
              <span class="subtitle-2">
                {{ $t('admin.import.doNotCloseNoticeDownload') }}
              </span>
            </v-col>
          </v-row>
          <v-row justify="center">
            <v-col cols="auto">
              <v-progress-circular
                data-testid="loading-spinner"
                indeterminate
              ></v-progress-circular
            ></v-col>
          </v-row>
        </v-container>
      </v-template>

      <!-- Import loading template -->
      <template v-if="importStore.importProgress > 0 && !importStore.errorCode">
        <v-container>
          <v-row
            v-if="importStore.importProgress > 0 && importStore.importProgress !== 100"
            class="justify-center"
          >
            <v-col cols="auto">
              <v-icon
                aria-hidden="true"
                class="mr-2"
                icon="mdi-alert-circle-outline"
                size="small"
              ></v-icon>
              <span class="subtitle-2">
                {{ $t('admin.import.doNotCloseNoticeImport') }}
              </span>
            </v-col>
          </v-row>
          <v-row justify="center">
            <v-col cols="12">
              <v-progress-linear
                data-testid="import-progress-bar"
                :model-value="importStore.importProgress"
                color="primary"
                height="25"
              >
                <template v-slot:default="{ value }">
                  <strong class="text-white">{{ Math.ceil(value) }}%</strong>
                </template>
              </v-progress-linear>
            </v-col>
          </v-row>
        </v-container>
      </template>

      <!-- Upload form -->
      <FormWrapper
        v-if="importStore.importProgress === 0"
        :confirmUnsavedChangesAction="handleConfirmUnsavedChanges"
        :createButtonLabel="$t('admin.import.uploadFile')"
        :discardButtonLabel="$t('nav.backToList')"
        :hideActions="
          showUploadSuccessTemplate ||
          !!importStore.importResponse ||
          importStore.importIsLoading ||
          !!importStore.errorCode
        "
        id="person-import-form"
        :isLoading="importStore.uploadIsLoading"
        :onDiscard="navigateToPersonTable"
        :onSubmit="onSubmit"
        @onShowDialogChange="(value?: boolean) => (showUnsavedChangesDialog = value || false)"
        :showUnsavedChangesDialog="showUnsavedChangesDialog"
      >
        <!-- Error Message Display for error messages from the ImportStore -->
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
                  @click="backToUpload"
                  data-testid="back-to-upload-button"
                >
                  {{ $t('admin.import.backToUpload') }}
                </v-btn>
              </v-col>
              <v-col cols="auto">
                <v-btn
                  class="primary"
                  @click="openConfirmationDialog"
                  data-testid="open-confirmation-dialog-button"
                >
                  {{ $t('admin.import.executeImport') }}
                </v-btn>
              </v-col>
            </v-row>
          </v-container>
        </template>

        <!-- Actual form -->
        <template
          v-if="
            !showUploadSuccessTemplate &&
            !importStore.importResponse &&
            !importStore.importIsLoading &&
            !importStore.errorCode
          "
        >
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
            <v-col class="text-center">
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
              :disabled="importStore.importIsLoading"
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
