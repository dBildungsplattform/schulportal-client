<script setup lang="ts">
  import PersonBulkError from '@/components/admin/personen/PersonBulkError.vue';
  import PersonenkontextCreate from '@/components/admin/personen/PersonenkontextCreate.vue';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import { useBulkErrors, type BulkErrorList } from '@/composables/useBulkErrors';
  import { useRollen, type TranslatedRolleWithAttrs } from '@/composables/useRollen';
  import { useBulkOperationStore, type BulkOperationStore } from '@/stores/BulkOperationStore';
  import { type Organisation } from '@/stores/OrganisationStore';
  import { OperationContext, usePersonenkontextStore, type PersonenkontextStore } from '@/stores/PersonenkontextStore';
  import { RollenArt, type RolleResponse } from '@/stores/RolleStore';
  import type { PersonWithZuordnungen } from '@/stores/types/PersonWithZuordnungen';
  import type { TranslatedObject } from '@/types';
  import { toTypedSchema } from '@vee-validate/yup';
  import { useForm, type BaseFieldProps, type TypedSchema } from 'vee-validate';
  import { computed, ref, watch, type ComputedRef, type Ref } from 'vue';
  import { useI18n, type Composer } from 'vue-i18n';
  import { useDisplay } from 'vuetify';
  import { object, string } from 'yup';

  const { t }: Composer = useI18n({ useScope: 'global' });
  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();

  const bulkOperationStore: BulkOperationStore = useBulkOperationStore();
  const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();

  type Props = {
    isDialogVisible: boolean;
    organisationen: TranslatedObject[] | undefined;
    selectedPersonen: Map<string, PersonWithZuordnungen>;
    selectedOrganisationFromFilter: Organisation;
    selectedRolleFromFilter?: RolleResponse;
  };

  type Emits = {
    (event: 'update:dialogExit', finished: boolean): void;
  };
  const props: Props = defineProps<Props>();
  const emit: Emits = defineEmits<Emits>();

  async function closeDialog(finished: boolean): Promise<void> {
    bulkOperationStore.resetState();
    emit('update:dialogExit', finished);
  }
  const showErrorDialog: Ref<boolean, boolean> = ref(false);

  // Local state for selectedOrganisation to avoid mutating the prop directly
  const selectedOrganisationFromFilterId: Ref<string> = ref<string>(props.selectedOrganisationFromFilter.id);

  const rollenForForm: ComputedRef<TranslatedRolleWithAttrs[] | undefined> = useRollen();

  // Define the error list for the selected persons using the useBulkErrors composable
  const bulkErrorList: ComputedRef<BulkErrorList[]> = computed(() => useBulkErrors(t, props.selectedPersonen));

  export type RolleUnassignForm = {
    selectedRolle: string;
  };

  export type PersonenkontextFieldDefinitions = {
    selectedRolle: Ref<string | undefined>;
    selectedRolleProps: Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>;
  };

  const validationSchema = (): TypedSchema<RolleUnassignForm> => {
    return toTypedSchema(
      object({
        selectedRolle: string().required(t('admin.rolle.rules.rolle.required')),
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

  const formContext: ReturnType<typeof useForm> = useForm<RolleUnassignForm>({
    validationSchema,
  });

  const [selectedRolle, selectedRolleProps]: [
    Ref<string | undefined>,
    Ref<BaseFieldProps & { error: boolean; 'error-messages': Array<string> }>,
  ] = formContext.defineField('selectedRolle', getVuetifyConfig);

  function handleFieldReset(field: string): void {
    if (field === 'selectedRolle') {
      selectedRolle.value = undefined;
    }
  }

  function isLernRolle(selectedRolleId: string | undefined): boolean {
    if (!selectedRolleId) return false;

    const rolle: TranslatedRolleWithAttrs | undefined = rollenForForm.value?.find(
      (r: TranslatedRolleWithAttrs) => r.value === selectedRolleId,
    );

    return rolle?.rollenart === RollenArt.Lern;
  }

  async function handleRolleUnassign(): Promise<void> {
    const rolleId: string = selectedRolle.value ?? props.selectedRolleFromFilter?.id ?? '';
    const isRolleLern: boolean =
      selectedRolle.value != null
        ? isLernRolle(selectedRolle.value)
        : props.selectedRolleFromFilter?.rollenart === RollenArt.Lern;

    await bulkOperationStore.bulkUnassignPersonenFromRolle(
      selectedOrganisationFromFilterId.value,
      rolleId,
      [...props.selectedPersonen.keys()],
      isRolleLern,
    );

    if (bulkOperationStore.currentOperation?.errors && bulkOperationStore.currentOperation.errors.size > 0) {
      showErrorDialog.value = true;
    }
  }

  watch(
    () => props.selectedOrganisationFromFilter.id,
    async (newValue: string) => {
      await personenkontextStore.processWorkflowStep({
        operationContext: OperationContext.PERSON_BEARBEITEN,
        organisationId: newValue,
        rollenIds: props.selectedRolleFromFilter ? [props.selectedRolleFromFilter.id] : [],
        limit: 25,
      });
    },
    { immediate: true },
  );
</script>

<template>
  <v-dialog
    :modelValue="props.isDialogVisible"
    persistent
  >
    <LayoutCard
      data-testid="rolle-unassign-layout-card"
      :header="$t('admin.rolle.bulkRollenzuordnung.unassignRolleZuordnung')"
    >
      <!-- Initial block -->
      <v-container
        class="mt-8 mb-4"
        v-if="bulkOperationStore.currentOperation?.progress === 0"
      >
        <template v-if="bulkOperationStore.currentOperation?.progress === 0">
          <PersonenkontextCreate
            v-if="bulkOperationStore.currentOperation?.progress === 0"
            :operationContext="OperationContext.PERSON_BEARBEITEN"
            ref="personenkontext-create"
            :showHeadline="false"
            :selectedOrganisation="selectedOrganisationFromFilterId"
            :organisationen="props.organisationen"
            :rollen="rollenForForm"
            :selectedRolleProps="selectedRolleProps"
            :isRolleUnassignForm="true"
            :selectedRolle="props.selectedRolleFromFilter ? props.selectedRolleFromFilter.id : undefined"
            @update:selectedRolle="(value?: string) => (selectedRolle = value)"
            @fieldReset="handleFieldReset"
          />
        </template>
      </v-container>

      <!-- In progress -->
      <v-container
        v-if="
          bulkOperationStore.currentOperation?.progress !== undefined &&
          bulkOperationStore.currentOperation?.progress > 0
        "
        class="mt-4"
      >
        <v-container v-if="bulkOperationStore.currentOperation?.progress === 100">
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
            {{ $t('admin.rolle.bulkRollenzuordnung.success') }}
          </p>
        </v-container>
        <v-row
          v-if="
            bulkOperationStore.currentOperation?.progress !== undefined &&
            bulkOperationStore.currentOperation?.progress < 100
          "
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
            <span
              class="subtitle-2"
              data-testid="rolle-unassign-progressing-notice"
            >
              {{ t('admin.doNotCloseBrowserNotice') }}
            </span>
          </v-col>
        </v-row>
        <!-- Progress Bar -->
        <v-progress-linear
          class="mt-5"
          :modelValue="bulkOperationStore.currentOperation?.progress"
          color="primary"
          height="25"
          data-testid="rolle-unassign-progressbar"
        >
          <template v-slot:default="{ value }">
            <strong class="text-white">{{ Math.ceil(value) }}%</strong>
          </template>
        </v-progress-linear>
      </v-container>

      <v-card-actions>
        <v-row
          class="py-3 px-2"
          justify="end"
        >
          <!-- Success state: -->
          <template v-if="bulkOperationStore.currentOperation?.progress === 100">
            <v-col
              cols="12"
              class="d-flex justify-center"
            >
              <v-btn
                :block="mdAndDown"
                class="primary"
                @click="closeDialog(true)"
                data-testid="rolle-unassign-close-button"
              >
                {{ t('close') }}
              </v-btn>
            </v-col>
          </template>

          <!-- In-progress or initial state -->
          <template v-else-if="bulkOperationStore.currentOperation?.progress === 0">
            <v-col
              cols="12"
              sm="6"
              md="auto"
            >
              <v-btn
                :block="mdAndDown"
                class="secondary"
                @click="closeDialog(false)"
                data-testid="rolle-unassign-discard-button"
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
                :disabled="bulkOperationStore.currentOperation?.isRunning"
                class="primary"
                @click="handleRolleUnassign()"
                data-testid="rolle-unassign-submit-button"
                type="submit"
              >
                {{ t('admin.rolle.bulkRollenzuordnung.unassignRolleZuordnung') }}
              </v-btn>
            </v-col>
          </template>
        </v-row>
      </v-card-actions>
    </LayoutCard>
  </v-dialog>
  <template v-if="showErrorDialog">
    <PersonBulkError
      :bulkOperationName="$t('admin.rolle.bulkRollenzuordnung.unassignRolleZuordnung')"
      :isDialogVisible="showErrorDialog"
      @update:isDialogVisible="
        (val: boolean) => {
          showErrorDialog = val;
          if (!val) {
            closeDialog(true);
          }
        }
      "
      :errors="bulkErrorList"
    />
  </template>
</template>

<style></style>
