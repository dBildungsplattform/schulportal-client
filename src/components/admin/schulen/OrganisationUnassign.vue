<script setup lang="ts">
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import { type Organisation } from '@/stores/OrganisationStore';
  import { computed, ref, type ComputedRef, type Ref } from 'vue';
  import { type Composer, useI18n } from 'vue-i18n';
  import { useDisplay } from 'vuetify';
  import { getDisplayNameForOrg } from '@/utils/formatting';
  import { useBulkOperationStore, type BulkOperationStore } from '@/stores/BulkOperationStore';
  import { type BulkErrorList, useBulkErrors } from '@/composables/useBulkErrors';
  import type { PersonenWithRolleAndZuordnung } from '@/stores/PersonStore';
  import PersonBulkError from '@/components/admin/personen/PersonBulkError.vue';

  const { t }: Composer = useI18n({ useScope: 'global' });
  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();

  const bulkOperationStore: BulkOperationStore = useBulkOperationStore();

  type PersonWithRolleAndZuordnung = PersonenWithRolleAndZuordnung[number];

  type Props = {
    isDialogVisible: boolean;
    selectedPersons: PersonenWithRolleAndZuordnung;
    selectedOrganisation: Organisation;
  };

  type Emits = (event: 'update:dialogExit', finished: boolean) => void;

  const props: Props = defineProps<Props>();
  const emit: Emits = defineEmits<Emits>();

  async function closeDialog(finished: boolean): Promise<void> {
    bulkOperationStore.resetState();
    emit('update:dialogExit', finished);
  }

  const showErrorDialog: Ref<boolean, boolean> = ref(false);

  // Define the error list for the selected persons using the useBulkErrors composable
  const bulkErrorList: ComputedRef<BulkErrorList[]> = computed(() => useBulkErrors(props.selectedPersons));

  async function handleOrgUnassign(): Promise<void> {
    await bulkOperationStore.bulkUnassignPersonenFromOrg(
      props.selectedOrganisation.id,
      props.selectedPersons.map((person: PersonWithRolleAndZuordnung) => person.person.id),
    );

    if (bulkOperationStore.currentOperation?.errors && bulkOperationStore.currentOperation.errors.size > 0) {
      showErrorDialog.value = true;
    }
  }
</script>

<template>
  <v-dialog
    :modelValue="props.isDialogVisible"
    persistent
  >
    <LayoutCard
      data-testid="org-unassign-layout-card"
      :header="$t('admin.person.bulkUnassignOrganisation.cancelZuordnung')"
    >
      <!-- Initial block -->
      <v-container
        class="mt-8 mb-4"
        v-if="bulkOperationStore.currentOperation?.progress === 0"
      >
        <v-row class="text-body bold justify-center">
          <v-col
            class="text-center"
            cols="10"
          >
            <div data-testid="org-unassign-confirmation-text">
              {{ t('admin.person.bulkUnassignOrganisation.confirmation') }}
            </div>
            <div data-testid="org-unassign-affected-school">
              {{
                t('admin.person.bulkUnassignOrganisation.affectedSchool', {
                  schule: getDisplayNameForOrg(selectedOrganisation),
                })
              }}
            </div>
          </v-col>
        </v-row>
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
            {{ $t('admin.person.bulkUnassignOrganisation.success') }}
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
              data-testid="org-unassign-progressing-notice"
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
          data-testid="org-unassign-progressbar"
        >
          <template v-slot:default="{ value }">
            <strong class="text-white">{{ Math.ceil(value) }}%</strong>
          </template>
        </v-progress-linear>
      </v-container>

      <v-card-actions class="justify-center">
        <v-row class="py-3 px-2 justify-center">
          <v-col
            cols="12"
            sm="6"
            md="auto"
          >
            <v-btn
              v-if="bulkOperationStore.currentOperation?.progress === 100"
              :block="mdAndDown"
              class="secondary"
              @click="closeDialog(true)"
              data-testid="org-unassign-close-button"
            >
              {{ t('close') }}
            </v-btn>
            <v-btn
              v-else-if="bulkOperationStore.currentOperation?.progress === 0"
              :block="mdAndDown"
              class="secondary"
              @click="closeDialog(false)"
              data-testid="org-unassign-discard-button"
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
              v-if="bulkOperationStore.currentOperation?.progress === 0"
              :block="mdAndDown"
              :disabled="bulkOperationStore.currentOperation?.isRunning"
              class="primary"
              @click="handleOrgUnassign()"
              data-testid="org-unassign-submit-button"
              type="submit"
            >
              {{ t('admin.person.bulkUnassignOrganisation.cancelZuordnung') }}
            </v-btn>
          </v-col>
        </v-row>
      </v-card-actions>
    </LayoutCard>
  </v-dialog>
  <template v-if="showErrorDialog">
    <PersonBulkError
      :bulkOperationName="$t('admin.person.bulkUnassignOrganisation.cancelZuordnung')"
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
