<script setup lang="ts">
  import PersonBulkError from '@/components/admin/personen/PersonBulkError.vue';
  import PersonenkontextCreate from '@/components/admin/personen/PersonenkontextCreate.vue';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import { useBulkErrors, type BulkErrorList } from '@/composables/useBulkErrors';
  import type { TranslatedRolleWithAttrs } from '@/composables/useRollen';
  import { useBulkOperationStore, type BulkOperationStore } from '@/stores/BulkOperationStore';
  import { OperationContext, usePersonenkontextStore, type PersonenkontextStore } from '@/stores/PersonenkontextStore';
  import type { PersonWithZuordnungen } from '@/stores/types/PersonWithZuordnungen';
  import type { TranslatedObject } from '@/types';
  import { isBefristungspflichtRolle, useBefristungUtils, type BefristungUtilsType } from '@/utils/befristung';
  import { formatDateToISO, getNextSchuljahresende } from '@/utils/date';
  import { befristungSchema, isKopersRolle } from '@/utils/validationPersonenkontext';
  import { toTypedSchema } from '@vee-validate/yup';
  import { useForm, type BaseFieldProps, type FormContext, type TypedSchema } from 'vee-validate';
  import { computed, ref, watchEffect, type ComputedRef, type Ref } from 'vue';
  import { useI18n, type Composer } from 'vue-i18n';
  import { useDisplay } from 'vuetify';
  import { object, string } from 'yup';

  type Props = {
    errorCode: string;
    organisationen: TranslatedObject[] | undefined;
    rollen: TranslatedRolleWithAttrs[] | undefined;
    isLoading: boolean;
    isDialogVisible: boolean;
    selectedPersonen: Map<string, PersonWithZuordnungen>;
  };

  type Emits = {
    (event: 'update:isDialogVisible', isDialogVisible: boolean): void;
    (event: 'update:getUebersichten'): void;
  };

  const props: Props = defineProps<Props>();
  const emit: Emits = defineEmits<Emits>();

  const { t }: Composer = useI18n({ useScope: 'global' });
  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();

  const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();
  const bulkOperationStore: BulkOperationStore = useBulkOperationStore();

  const canCommit: Ref<boolean> = ref(false);
  const showModifyRolleDialog: Ref<boolean> = ref(props.isDialogVisible);
  const showErrorDialog: Ref<boolean, boolean> = ref(false);
  const calculatedBefristung: Ref<string | undefined> = ref('');
  const isBefristungRequired: Ref<boolean, boolean> = ref(false);

  const successMessage: ComputedRef<string> = computed(() =>
    bulkOperationStore.currentOperation?.successMessage ? t(bulkOperationStore.currentOperation.successMessage) : '',
  );

  // Define the error list for the selected persons using the useBulkErrors composable
  const bulkErrorList: ComputedRef<BulkErrorList[]> = computed(() => useBulkErrors(t, props.selectedPersonen));

  // Define the form validation schema for the Personenkontext
  export type ZuordnungCreationForm = {
    selectedRolle: string;
    selectedOrganisation: string;
    selectedBefristung: Date;
    selectedBefristungOption: string;
  };

  const validationSchema = (): TypedSchema<ZuordnungCreationForm> => {
    return toTypedSchema(
      object({
        selectedRolle: string().required(t('admin.rolle.rules.rolle.required')),
        selectedOrganisation: string().required(t('admin.organisation.rules.organisation.required')),
        selectedBefristung: befristungSchema(t),
      }),
    );
  };

  const getVuetifyConfig = (state: {
    errors: Array<string>;
  }): { props: { error: boolean; 'error-messages': Array<string> } } => ({
    props: {
      error: !!state.errors.length,
      'error-messages': state.errors,
    },
  });

  const formContext: FormContext<ZuordnungCreationForm, ZuordnungCreationForm> = useForm<ZuordnungCreationForm>({
    validationSchema: validationSchema(),
  });

  const [selectedOrganisation, selectedOrganisationProps]: [
    Ref<string | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = formContext.defineField('selectedOrganisation', getVuetifyConfig);

  const [selectedRolle, selectedRolleProps]: [
    Ref<string | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = formContext.defineField('selectedRolle', getVuetifyConfig);

  const selectedRollen: ComputedRef<Array<string>> = computed(() => {
    return selectedRolle.value ? [selectedRolle.value] : [];
  });

  const showKopersHint: ComputedRef<boolean> = computed(() => {
    return isKopersRolle(selectedRollen.value, props.rollen);
  });

  const [selectedBefristung, selectedBefristungProps]: [
    Ref<string | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = formContext.defineField('selectedBefristung', getVuetifyConfig);

  const [selectedBefristungOption, selectedBefristungOptionProps]: [
    Ref<string | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = formContext.defineField('selectedBefristungOption', getVuetifyConfig);

  watchEffect(async () => {
    if (selectedRolle.value) {
      isBefristungRequired.value = await isBefristungspflichtRolle([selectedRolle.value]);
    } else {
      isBefristungRequired.value = false;
    }
  });

  const {
    handleBefristungUpdate,
    handleBefristungOptionUpdate,
    setupRolleWatcher,
    setupWatchers,
  }: BefristungUtilsType = useBefristungUtils({
    formContext,
    selectedBefristung,
    selectedBefristungOption,
    calculatedBefristung,
    selectedRollen,
  });
  setupRolleWatcher();
  setupWatchers();

  async function closeModifyRolleDeleteDialog(): Promise<void> {
    if (bulkOperationStore.currentOperation) {
      bulkOperationStore.resetState();
    }
    showModifyRolleDialog.value = false;
    personenkontextStore.errorCode = '';
    emit('update:isDialogVisible', false);
  }

  function handleFieldReset(field: string): void {
    if (field === 'selectedRolle') {
      formContext.resetField('selectedRolle');
    }
  }

  // Creates a new Personenkontext for an array of Person IDs. For each processed ID the progress bar will increment according to the total number of items to process
  async function handleModifyRolle(personIDs: string[]): Promise<void> {
    const befristungDate: string | undefined = selectedBefristung.value
      ? selectedBefristung.value
      : calculatedBefristung.value;

    // Format the date in ISO 8601 format if it exists
    const formattedBefristung: string | undefined = befristungDate ? formatDateToISO(befristungDate) : undefined;

    await bulkOperationStore.bulkModifyPersonenRolle(
      personIDs,
      selectedOrganisation.value!,
      selectedRolle.value!,
      personenkontextStore.workflowStepResponse?.organisations || [],
      formattedBefristung,
    );

    if (bulkOperationStore.currentOperation?.errors && bulkOperationStore.currentOperation.errors.size > 0) {
      showErrorDialog.value = true;
    }

    emit('update:getUebersichten');
  }

  const onSubmitModifyRolle: (e?: Event) => Promise<Promise<void> | undefined> = formContext.handleSubmit(async () => {
    const personIDs: string[] = [...props.selectedPersonen.keys()];
    await handleModifyRolle(personIDs);
  });
</script>

<template>
  <v-dialog
    v-model="showModifyRolleDialog"
    persistent
  >
    <LayoutCard
      data-testid="rolle-modify-layout-card"
      :closable="false"
      :header="t('admin.rolle.assignRolle')"
      @onCloseClicked="closeModifyRolleDeleteDialog()"
    >
      <v-form
        data-testid="rolle-assign-form"
        @submit="onSubmitModifyRolle"
      >
        <v-container>
          <!-- Form Component -->
          <template v-if="bulkOperationStore.currentOperation?.progress === 0">
            <PersonenkontextCreate
              ref="personenkontext-create"
              :operationContext="OperationContext.PERSON_BEARBEITEN"
              :showHeadline="false"
              :organisationen="organisationen"
              :rollen="rollen"
              :selectedOrganisationProps="selectedOrganisationProps"
              :selectedRolleProps="selectedRolleProps"
              :befristungInputProps="{
                befristungProps: selectedBefristungProps,
                befristungOptionProps: selectedBefristungOptionProps,
                isUnbefristetDisabled: isBefristungRequired,
                isBefristungRequired,
                nextSchuljahresende: getNextSchuljahresende(),
                befristung: selectedBefristung,
                befristungOption: selectedBefristungOption,
              }"
              v-model:selectedOrganisation="selectedOrganisation"
              v-model:selectedRolle="selectedRolle"
              @update:selectedOrganisation="(value?: string) => (selectedOrganisation = value)"
              @update:selectedRolle="(value?: string) => (selectedRolle = value)"
              @update:canCommit="canCommit = $event"
              @update:befristung="handleBefristungUpdate"
              @update:calculatedBefristungOption="handleBefristungOptionUpdate"
              @fieldReset="handleFieldReset"
            />

            <v-row
              v-if="showKopersHint"
              class="text-body bold px-md-16"
              data-testid="no-kopersnr-information"
            >
              <v-col
                offset="2"
                cols="10"
              >
                <p>
                  {{ t('admin.person.bulkRolleModify.noKopersNrInfoText') }}
                </p>
              </v-col>
            </v-row>
          </template>

          <!-- Progress Bar -->
          <div
            v-if="bulkOperationStore.currentOperation && bulkOperationStore.currentOperation?.progress > 0"
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
              v-if="bulkOperationStore.currentOperation?.progress < 100"
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
                  {{ t('admin.doNotCloseBrowserNotice') }}
                </span>
              </v-col>
            </v-row>
            <v-progress-linear
              class="mt-5"
              :modelValue="bulkOperationStore.currentOperation?.progress"
              color="primary"
              height="25"
            >
              <template v-slot:default="{ value }">
                <strong class="text-white">{{ Math.ceil(value) }}%</strong>
              </template>
            </v-progress-linear>
          </div>
        </v-container>

        <v-card-actions class="justify-center">
          <!-- Action Buttons -->
          <v-row
            v-if="bulkOperationStore.currentOperation?.progress === 0"
            class="py-3 px-2 justify-center"
          >
            <v-spacer class="hidden-sm-and-down"></v-spacer>

            <v-col
              cols="12"
              sm="6"
              md="auto"
            >
              <v-btn
                :block="mdAndDown"
                class="secondary"
                @click="closeModifyRolleDeleteDialog"
                data-testid="rolle-modify-discard-button"
              >
                {{ t('cancel') }}
              </v-btn>
            </v-col>

            <v-col
              cols="12"
              sm="6"
              md="auto"
            >
              <v-btn
                :block="mdAndDown"
                type="submit"
                class="primary"
                :disabled="!canCommit || bulkOperationStore.currentOperation.isRunning"
                data-testid="rolle-modify-submit-button"
              >
                {{ t('admin.rolle.assignRolle') }}
              </v-btn>
            </v-col>
          </v-row>

          <v-row
            v-if="bulkOperationStore.currentOperation?.progress === 100"
            class="py-3 px-2 justify-center"
          >
            <v-col
              cols="12"
              sm="6"
              md="auto"
            >
              <v-btn
                :block="mdAndDown"
                class="primary"
                @click="closeModifyRolleDeleteDialog"
                data-testid="rolle-modify-close-button"
              >
                {{ t('close') }}
              </v-btn>
            </v-col>
          </v-row>
        </v-card-actions>
      </v-form>
    </LayoutCard>
  </v-dialog>

  <!-- Error Dialog -->
  <template v-if="showErrorDialog">
    <PersonBulkError
      :bulkOperationName="t('admin.rolle.assignRolle')"
      :isDialogVisible="showErrorDialog"
      @update:isDialogVisible="
        (val: boolean) => {
          showErrorDialog = val;
          if (!val) {
            closeModifyRolleDeleteDialog();
          }
        }
      "
      :errors="bulkErrorList"
    />
  </template>
</template>
