<script setup lang="ts">
  import { ref, type Ref } from 'vue';
  import { useI18n, type Composer } from 'vue-i18n';
  import { useDisplay } from 'vuetify';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import { buildCSV, download } from '@/utils/file';

  const { t }: Composer = useI18n({ useScope: 'global' });
  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();

  const progress: Ref<number> = ref<number>(0);

  type ErrorEntry = {
    error: string;
    vorname: string;
    nachname: string;
  };

  type Props = {
    errors: ErrorEntry[];
    isDialogVisible: boolean;
  };

  type Emits = {
    (event: 'update:isDialogVisible', isDialogVisible: boolean): void;
  };

  type CSVHeaders = 'Vorname' | 'Nachname' | 'Error';
  type CSVRow = Record<CSVHeaders, string | undefined>;

  const props: Props = defineProps<Props>();
  const emit: Emits = defineEmits<Emits>();

  const showBulkErrorDialog: Ref<boolean> = ref(props.isDialogVisible);

  // Saves the errors as a text file
  function saveErrorsAsCSV(): void {
    const headers: CSVHeaders[] = ['Vorname', 'Nachname', 'Error'];

    const fileName: string = `massenbearbeitung-errors-${new Date().toLocaleDateString('de-DE').replace(/\./g, '-')}.txt`;

    const csvRows: CSVRow[] = props.errors.map((entry: ErrorEntry) => ({
      Vorname: entry.vorname,
      Nachname: entry.nachname,
      Error: entry.error,
    }));

    const csvContent: string = buildCSV<CSVHeaders>(headers, csvRows);

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
      :header="$t('admin.person.bulk.bulkErrorTitle')"
      @onCloseClicked="closeBulkErrorDialog()"
    >
      <v-container>
        <p class="text-body bold pre-line">{{ t('admin.person.bulk.bulkErrorMessage') }}</p>
        <ol>
          <li
            v-for="(entry, index) in props.errors"
            :key="index"
            class="text-body font-weight-bold my-2 ml-4"
          >
            <div>
              <span class="text-body font-weight-bold">{{ entry.vorname }} {{ entry.nachname }}</span>
            </div>
            <div class="ml-4 text-body">
              <v-alert type="error">
                {{ entry.error }}
              </v-alert>
            </div>
          </li>
        </ol>
      </v-container>

      <v-card-actions class="justify-center">
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
              @click="closeBulkErrorDialog"
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
</template>

<style scoped>
  .pre-line {
    white-space: pre-wrap;
  }
</style>
