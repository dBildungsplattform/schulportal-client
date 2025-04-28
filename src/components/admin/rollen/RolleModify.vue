<script setup lang="ts">
  import { computed, ref, type ComputedRef, type Ref } from 'vue';
  import { useI18n, type Composer } from 'vue-i18n';
  import { useDisplay } from 'vuetify';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import type { TranslatedObject } from '@/types';
  import { toTypedSchema } from '@vee-validate/yup';
  import { useForm, type BaseFieldProps, type TypedSchema } from 'vee-validate';
  import { object, string } from 'yup';
  import PersonenkontextCreate from '@/components/admin/personen/PersonenkontextCreate.vue';
  import type { TranslatedRolleWithAttrs } from '@/composables/useRollen';
  import { useBulkOperationStore, type BulkOperationStore } from '@/stores/BulkOperationStore';
  import { usePersonenkontextStore, type PersonenkontextStore } from '@/stores/PersonenkontextStore';
  import type { PersonenWithRolleAndZuordnung } from '@/stores/PersonStore';
  import PersonBulkError from '@/components/admin/personen/PersonBulkError.vue';
  import { useBulkErrors, type BulkErrorList } from '@/composables/useBulkErrors';

  const { t }: Composer = useI18n({ useScope: 'global' });
  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();

  const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();
  const bulkOperationStore: BulkOperationStore = useBulkOperationStore();

  const canCommit: Ref<boolean> = ref(false);

  type Props = {
    errorCode: string;
    organisationen: TranslatedObject[] | undefined;
    rollen: TranslatedRolleWithAttrs[] | undefined;
    isLoading: boolean;
    isDialogVisible: boolean;
    selectedPersons: PersonenWithRolleAndZuordnung;
  };

  type Emits = {
    (event: 'update:isDialogVisible', isDialogVisible: boolean): void;
    (event: 'update:getUebersichten'): void;
  };

  const props: Props = defineProps<Props>();
  const emit: Emits = defineEmits<Emits>();

  const showModifyRolleDialog: Ref<boolean> = ref(props.isDialogVisible);

  const showErrorDialog: Ref<boolean, boolean> = ref(false);

  const successMessage: ComputedRef<string> = computed(() =>
    bulkOperationStore.currentOperation?.successMessage ? t(bulkOperationStore.currentOperation.successMessage) : '',
  );

  // Define the error list for the selected persons using the useBulkErrors composable
  const bulkErrorList: ComputedRef<BulkErrorList[]> = computed(() => useBulkErrors(props.selectedPersons));

  // Define the form validation schema for the Personenkontext
  export type ZuordnungCreationForm = {
    selectedRolle: string;
    selectedOrganisation: string;
  };

  export type PersonenkontextFieldDefinitions = {
    selectedRolle: Ref<string | undefined>;
    selectedRolleProps: Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>;
    selectedOrganisation: Ref<string | undefined>;
    selectedOrganisationProps: Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>;
  };

  const validationSchema = (): TypedSchema<ZuordnungCreationForm> => {
    return toTypedSchema(
      object({
        selectedRolle: string().required(t('admin.rolle.rules.rolle.required')),
        selectedOrganisation: string().required(t('admin.organisation.rules.organisation.required')),
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

  const formContext: ReturnType<typeof useForm> = useForm<ZuordnungCreationForm>({
    validationSchema,
  });

  const [selectedOrganisation, selectedOrganisationProps]: [
    Ref<string | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = formContext.defineField('selectedOrganisation', getVuetifyConfig);

  const [selectedRolle, selectedRolleProps]: [
    Ref<string | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = formContext.defineField('selectedRolle', getVuetifyConfig);

  async function closeModifyRolleDeleteDialog(): Promise<void> {
    if (bulkOperationStore.currentOperation) {
      bulkOperationStore.resetState();
    }
    showModifyRolleDialog.value = false;
    personenkontextStore.$reset();
    emit('update:isDialogVisible', false);
  }

  function handleFieldReset(field: string): void {
    if (field === 'selectedRolle') {
      selectedRolle.value = undefined;
    }
  }

  // Creates a new Personenkontext for an array of Person IDs. For each processed ID the progress bar will increment according to the total number of items to process
  async function handleModifyRolle(personIDs: string[]): Promise<void> {
    await bulkOperationStore.bulkModifyPersonenRolle(
      personIDs,
      selectedOrganisation.value!,
      selectedRolle.value!,
      props.rollen || [],
      personenkontextStore.workflowStepResponse?.organisations || [],
    );

    emit('update:getUebersichten');

    if (bulkOperationStore.currentOperation?.errors && bulkOperationStore.currentOperation.errors.size > 0) {
      showErrorDialog.value = true;
    }
  }
</script>

<template>
  <v-dialog
    v-model="showModifyRolleDialog"
    persistent
  >
    <LayoutCard
      data-testid="rolle-modify-layout-card"
      :closable="false"
      :header="$t('admin.rolle.assignRolle')"
      @onCloseClicked="closeModifyRolleDeleteDialog()"
    >
      <v-container>
        <!-- Form Component -->
        <PersonenkontextCreate
          v-if="bulkOperationStore.currentOperation?.progress === 0"
          ref="personenkontext-create"
          :showHeadline="false"
          :isModifyRolleDialog="showModifyRolleDialog"
          :organisationen="organisationen"
          :rollen="rollen"
          :selectedOrganisationProps="selectedOrganisationProps"
          :selectedRolleProps="selectedRolleProps"
          v-model:selectedOrganisation="selectedOrganisation"
          v-model:selectedRolle="selectedRolle"
          @update:selectedOrganisation="(value?: string) => (selectedOrganisation = value)"
          @update:selectedRolle="(value?: string) => (selectedRolle = value)"
          @update:canCommit="canCommit = $event"
          @fieldReset="handleFieldReset"
        />

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
                {{ $t('admin.doNotCloseBrowserNotice') }}
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
              {{ $t('cancel') }}
            </v-btn>
          </v-col>
          <v-col
            cols="12"
            sm="6"
            md="auto"
          >
            <v-btn
              :block="mdAndDown"
              :disabled="!canCommit || bulkOperationStore.currentOperation.isRunning"
              class="primary"
              @click="handleModifyRolle(props.selectedPersons.map((person) => person.person.id))"
              data-testid="rolle-modify-submit-button"
              type="submit"
            >
              {{ $t('admin.rolle.assignRolle') }}
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
              {{ $t('close') }}
            </v-btn>
          </v-col>
        </v-row>
      </v-card-actions>
    </LayoutCard>
  </v-dialog>
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

<style></style>
