<script setup lang="ts">
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import { buildCSV, download } from '@/utils/file';
  import { ref, type Ref } from 'vue';
  import { useI18n, type Composer } from 'vue-i18n';
  import { useDisplay } from 'vuetify';

  const { t }: Composer = useI18n({ useScope: 'global' });
  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();

  const progress: Ref<number> = ref<number>(0);
  const closeBulkErrorDialogDialogVisible: Ref<boolean> = ref(false);

  type ErrorEntry = {
    error: string;
    vorname: string;
    nachname: string;
    username: string;
  };

  type Props = {
    bulkOperationName: string;
    errors: ErrorEntry[];
    isDialogVisible: boolean;
    filename?: string;
    passwords?: Blob | null;
  };

  type Emits = {
    (event: 'update:isDialogVisible', isDialogVisible: boolean): void;
  };

  type CSVHeaders = 'Vorname' | 'Nachname' | 'Benutzername' | 'Fehlermeldung';
  type CSVRow = Record<CSVHeaders, string | undefined>;

  const props: Props = defineProps<Props>();
  const emit: Emits = defineEmits<Emits>();

  const showBulkErrorDialog: Ref<boolean> = ref(props.isDialogVisible);

  // Saves the errors as a text file
  function saveErrorsAsCSV(): void {
    const headers: CSVHeaders[] = ['Vorname', 'Nachname', 'Benutzername', 'Fehlermeldung'];

    const fileName: string = `Fehler-Mehrfachbearbeitung-${new Date().toLocaleDateString('de-DE').replace(/\./g, '-')}.txt`;

    const csvRows: CSVRow[] = props.errors.map((entry: ErrorEntry) => ({
      Vorname: entry.vorname,
      Nachname: entry.nachname,
      Benutzername: entry.username,
      Fehlermeldung: entry.error,
    }));

    const actionIntroText: string = t('admin.person.bulk.bulkErrorMessageShort', {
      bulkOperationName: props.bulkOperationName,
    });

    const csvContent: string = buildCSV<CSVHeaders>(headers, csvRows, actionIntroText);

    const blob: Blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    download(fileName, blob);
  }

  function closeBulkErrorDialog(): void {
    progress.value = 0;
    showBulkErrorDialog.value = false;
    emit('update:isDialogVisible', false);
  }
</script>

<template>
  <v-dialog
    v-model="showBulkErrorDialog"
    persistent
  >
    <LayoutCard
      data-testid="person-bulk-error-layout-card"
      :closable="false"
      :header="
        props.bulkOperationName === t('admin.person.resetPassword') && passwords
          ? t('admin.person.resetPassword')
          : $t('admin.person.bulk.bulkErrorTitle')
      "
      @onCloseClicked="closeBulkErrorDialogDialogVisible = true"
    >
      <!-- This container is scrollable because of the max height -->
      <v-container style="max-height: 60vh; overflow-y: auto">
        <template v-if="props.bulkOperationName === t('admin.person.resetPassword') && passwords">
          <!-- Success message and download -->
          <v-row
            class="my-4"
            justify="center"
          >
            <v-col cols="auto">
              <v-icon
                small
                color="#1EAE9C"
                icon="mdi-check-circle"
              />
            </v-col>
          </v-row>
          <p class="mt-2 text-center">
            {{ t('admin.person.bulk.bulkPasswordReset.success') }}
          </p>
          <v-row class="mt-4 justify-center">
            <v-col
              cols="12"
              sm="6"
              md="auto"
            >
              <v-btn
                :block="mdAndDown"
                class="primary"
                data-testid="person-bulk-error-download-passwords-button"
                @click="() => passwords && download(filename ?? 'default-filename.csv', passwords)"
              >
                {{ t('admin.person.bulk.bulkPasswordReset.downloadResult') }}
              </v-btn>
            </v-col>
          </v-row>
          <v-divider
            class="border-opacity-100 rounded my-8"
            thickness="5px"
          />
        </template>

        <!-- Error list -->
        <p
          v-if="props.bulkOperationName === t('admin.person.resetPassword') && passwords"
          class="headline-2 mb-4"
        >
          {{ $t('admin.person.bulk.bulkErrorTitle') }}
        </p>
        <p class="text-body bold pre-line">
          {{
            t('admin.person.bulk.bulkErrorMessage', {
              bulkOperationName: props.bulkOperationName,
            })
          }}
        </p>
        <ol>
          <li
            v-for="(entry, index) in props.errors"
            :key="index"
            class="text-body font-weight-bold my-2 ml-4"
          >
            <div>
              <span class="text-body font-weight-bold"
                >{{ entry.vorname }} {{ entry.nachname }} ({{ entry.username }})</span
              >
            </div>
            <div class="ml-4 text-body">
              <v-alert
                class="py-2 px-2"
                type="error"
              >
                {{ entry.error }}
              </v-alert>
            </div>
          </li>
        </ol>
      </v-container>

      <!-- Actions remain fixed -->
      <v-card-actions
        class="justify-center"
        style="border-top: 1px solid #e5eaef"
      >
        <v-row class="py-3 px-2 justify-center">
          <v-spacer class="hidden-sm-and-down"></v-spacer>

          <v-col
            cols="12"
            sm="6"
            md="auto"
          >
            <v-btn
              :block="mdAndDown"
              class="secondary"
              @click="closeBulkErrorDialogDialogVisible = true"
              data-testid="person-bulk-error-discard-button"
            >
              {{ t('admin.person.bulk.closeList') }}
            </v-btn>
          </v-col>

          <v-col
            cols="12"
            sm="6"
            md="auto"
          >
            <v-btn
              :block="mdAndDown"
              class="primary"
              @click="saveErrorsAsCSV"
              data-testid="person-bulk-error-save-button"
            >
              {{ t('admin.person.bulk.saveList') }}
            </v-btn>
          </v-col>
        </v-row>
      </v-card-actions>
    </LayoutCard>
  </v-dialog>

  <v-dialog
    v-model="closeBulkErrorDialogDialogVisible"
    persistent
    max-width="900"
  >
    <LayoutCard
      :header="$t('admin.person.bulk.bulkErrorTitle')"
      @onCloseClicked="closeBulkErrorDialogDialogVisible = false"
    >
      <v-card-text>
        <v-container class="my-4">
          <v-row
            class="text-body text-error justify-center"
            align="center"
          >
            <v-col
              class="text-center"
              cols="12"
            >
              <v-icon
                class="mr-2 pb-1"
                icon="mdi-alert"
              />
              <span>
                {{ t('admin.person.bulk.closeBulkErrorDialogConfirmationMessage') }}
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
              :block="mdAndDown"
              class="secondary"
              data-testid="cancel-close-bulk-error-dialog-button"
              @click.stop="closeBulkErrorDialogDialogVisible = false"
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
              :block="mdAndDown"
              class="primary"
              data-testid="confirm-close-bulk-error-dialog-button"
              @click.stop="closeBulkErrorDialog"
            >
              {{ $t('close') }}
            </v-btn>
          </v-col>
        </v-row>
      </v-card-actions>
    </LayoutCard>
  </v-dialog>
</template>

<style scoped>
  .pre-line {
    white-space: pre-wrap;
  }
</style>
