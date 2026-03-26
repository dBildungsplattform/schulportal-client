<script setup lang="ts">
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import { buildCSV, download } from '@/utils/file';
  import { ref, type Ref } from 'vue';
  import { useI18n, type Composer } from 'vue-i18n';
  import { useDisplay } from 'vuetify';
  import type { RollenerweiterungAssignErrorDialogProps } from './types';

  const { t }: Composer = useI18n({ useScope: 'global' });
  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();

  const confirmCloseDialog: Ref<boolean> = ref(false);

  type Emits = {
    (event: 'update:isDialogVisible', isDialogVisible: boolean): void;
  };

  type CSVHeaders = 'Dienststellennummer' | 'Angebot' | 'Rolle' | 'Fehlermeldung';
  type CSVRow = Record<CSVHeaders, string | undefined>;

  const props: RollenerweiterungAssignErrorDialogProps = defineProps<RollenerweiterungAssignErrorDialogProps>();
  const emit: Emits = defineEmits<Emits>();

  // Saves the errors as a text file
  function saveErrorsAsCSV(): void {
    if (!props.errors || props.errors.length === 0) {
      return;
    }
    const headers: CSVHeaders[] = ['Dienststellennummer', 'Angebot', 'Rolle', 'Fehlermeldung'];
    const fileName: string = `Fehler-Rollenerweiterung-${new Date().toLocaleDateString('de-DE').replaceAll('.', '-')}.txt`;

    const csvRows: CSVRow[] = props.errors?.map((entry: RollenerweiterungAssignErrorDialogProps['errors'][number]) => ({
      Dienststellennummer: props.dstNr,
      Angebot: props.serviceProviderName,
      Rolle: entry.rolle,
      Fehlermeldung: entry.message,
    }));

    const csvContent: string = buildCSV<CSVHeaders>(
      headers,
      csvRows,
      t('angebot.schulspezifischeErweiterungen.errorCsvIntroText'),
    );

    const blob: Blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    download(fileName, blob);
  }

  function closeBulkErrorDialog(): void {
    confirmCloseDialog.value = false;
    emit('update:isDialogVisible', false);
  }
</script>

<template>
  <v-dialog
    :model-value="props.isDialogVisible"
    persistent
  >
    <LayoutCard
      data-testid="rollenerweiterung-error-layout-card"
      :closable="false"
      :header="t('angebot.schulspezifischeErweiterungen.assignErrorTitle')"
      @on-close-clicked="confirmCloseDialog = true"
    >
      <v-container>
        <p class="text-body bold pre-line">
          {{ t('angebot.schulspezifischeErweiterungen.assignErrorIntroText') }}
        </p>
        <!-- Error list -->
        <ol>
          <li
            v-for="(entry, index) in props.errors"
            :key="index"
            class="text-body font-weight-bold my-2 ml-4"
          >
            <div>
              <span class="text-body font-weight-bold"
                >{{ props.dstNr }} {{ props.serviceProviderName }} ({{ entry.rolle }})</span
              >
            </div>
            <div class="ml-4 text-body">
              <v-alert
                class="py-2 px-2"
                type="error"
              >
                {{ entry.message }}
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
          <v-spacer class="hidden-sm-and-down" />

          <v-col
            cols="12"
            sm="6"
            md="auto"
          >
            <v-btn
              :block="mdAndDown"
              class="secondary"
              data-testid="rollenerweiterung-error-discard-button"
              @click="confirmCloseDialog = true"
            >
              {{ t('angebot.schulspezifischeErweiterungen.closeList') }}
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
              data-testid="rollenerweiterung-error-save-button"
              @click="saveErrorsAsCSV"
            >
              {{ t('angebot.schulspezifischeErweiterungen.saveList') }}
            </v-btn>
          </v-col>
        </v-row>
      </v-card-actions>
    </LayoutCard>
  </v-dialog>

  <v-dialog
    v-model="confirmCloseDialog"
    persistent
    max-width="900"
  >
    <LayoutCard
      :header="t('angebot.schulspezifischeErweiterungen.assignErrorTitle')"
      @on-close-clicked="confirmCloseDialog = false"
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
                {{ t('angebot.schulspezifischeErweiterungen.closeConfirmationMessage') }}
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
              @click.stop="confirmCloseDialog = false"
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
