<script setup lang="ts">
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import {
    type BulkResetPasswordResult,
    type PersonenWithRolleAndZuordnung,
    type PersonStore,
    usePersonStore,
  } from '@/stores/PersonStore';
  import { buildCSV, download } from '@/utils/file';
  import { computed, type ComputedRef, type Ref } from 'vue';
  import { type Composer, useI18n } from 'vue-i18n';
  import { useDisplay } from 'vuetify';

  type PersonWithRolleAndZuordnung = PersonenWithRolleAndZuordnung[number];
  type CSVHeaders = 'Klasse' | 'Nachname' | 'Vorname' | 'Benutzername' | 'Passwort';
  type CSVRow = Record<CSVHeaders, string | undefined>;

  type Props = {
    isDialogVisible: boolean;
    isSelectionFromSingleSchule: boolean;
    selectedSchuleKennung?: string;
    selectedPersons: PersonenWithRolleAndZuordnung;
  };

  type Emits = (event: 'update:dialogExit', finished: boolean) => void;

  enum State {
    INITIAL,
    PROGRESSING,
    FINISHED,
  }

  const props: Props = defineProps<Props>();
  const emit: Emits = defineEmits<Emits>();

  const { t }: Composer = useI18n({ useScope: 'global' });
  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();

  const personStore: PersonStore = usePersonStore();

  // Computed that determines the state of the operation. Could either be initial (Progress === 0) or Progressing (progress > 0) or finished (operation is complete)
  const progressState: ComputedRef<State> = computed(() => {
    const result: BulkResetPasswordResult | null = personStore.bulkResetPasswordResult;

    if (result?.complete === true) {
      return State.FINISHED;
    }

    if (result?.progress !== undefined && result.progress > 0) {
      return State.PROGRESSING;
    }

    return State.INITIAL;
  });

  // Calculates the progress dynamically (Requests are sent sequentially and for every response we get the bar increments)
  const progress: ComputedRef<number> = computed(() => {
    if (!personStore.bulkResetPasswordResult?.progress) return 0;
    return Math.round(personStore.bulkResetPasswordResult.progress * 100);
  });

  // Create the file and returns the Blob
  const resultFile: ComputedRef<Blob | null> = computed(() => {
    const result: BulkResetPasswordResult | null = personStore.bulkResetPasswordResult;

    if (!result?.complete) return null;

    const rows: Array<CSVRow> = [];

    // For every password in the Map find the corresponding person (using the key) and merge them together in the file.
    for (const [id, password] of result.passwords.entries()) {
      const personWithRolleAndZuordnung: PersonWithRolleAndZuordnung | undefined = props.selectedPersons.find(
        (p: PersonWithRolleAndZuordnung) => p.person.id === id,
      );

      if (personWithRolleAndZuordnung) {
        rows.push({
          Klasse: personWithRolleAndZuordnung.klassen,
          Nachname: personWithRolleAndZuordnung.person.name.familienname,
          Vorname: personWithRolleAndZuordnung.person.name.vorname,
          Benutzername: personWithRolleAndZuordnung.person.referrer || '',
          Passwort: password,
        });
      }
    }

    const csv: string = buildCSV<CSVHeaders>(['Klasse', 'Nachname', 'Vorname', 'Benutzername', 'Passwort'], rows);

    return new Blob([csv], { type: 'text/csv' });
  });

  async function closePasswordResetDialog(finished: boolean): Promise<void> {
    emit('update:dialogExit', finished);
    personStore.bulkResetPasswordResult = null;
  }

  async function handleResetPassword(personIDs: string[]): Promise<void> {
    await personStore.bulkResetPassword(personIDs);
  }

  function downloadFile(blob: Blob): void {
    const filename: string = props.selectedSchuleKennung ? `PW_${props.selectedSchuleKennung}.txt` : 'PW.txt';
    download(filename, blob);
  }
</script>

<template>
  <v-dialog
    ref="resetPasswordBulkDialog"
    :model-value="isDialogVisible"
    persistent
  >
    <LayoutCard
      data-testid="password-reset-layout-card"
      :header="t('admin.person.resetPassword')"
    >
      <!-- Initial block -->
      <v-container
        class="mt-8 mb-4"
        v-if="progressState === State.INITIAL"
      >
        <template v-if="!isSelectionFromSingleSchule">
          <v-row class="text-body text-error justify-center">
            <v-icon
              class="mr-4"
              icon="mdi-alert"
            ></v-icon>
            <span data-testid="error-text">
              {{ t('admin.person.bulkPasswordReset.error.onlyOneSchool') }}
            </span>
          </v-row>
        </template>
        <v-row
          v-else
          class="text-body bold justify-center"
        >
          <span data-testid="password-reset-confirmation-text">
            {{ t('admin.person.bulkPasswordReset.confirmation') }}
          </span>
        </v-row>
      </v-container>

      <!-- In progress -->
      <v-container
        v-if="progressState === State.PROGRESSING"
        class="mt-4"
      >
        <v-row
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
              data-testid="password-reset-progressing-notice"
            >
              {{ t('admin.doNotCloseBrowserNotice') }}
            </span>
          </v-col>
        </v-row>
        <!-- Progress Bar -->
        <v-progress-linear
          class="mt-5"
          :modelValue="progress"
          color="primary"
          height="25"
          data-testid="password-reset-progressbar"
        >
          <template v-slot:default="{ value }">
            <strong class="text-white">{{ Math.ceil(value) }}%</strong>
          </template>
        </v-progress-linear>
      </v-container>

      <!-- Result -->
      <v-container v-if="progressState === State.FINISHED">
        <v-row justify="center">
          <v-col cols="auto">
            <v-icon
              small
              color="#1EAE9C"
              icon="mdi-check-circle"
            ></v-icon>
          </v-col>
        </v-row>
        <p
          class="mt-2 text-center"
          data-testid="password-reset-success-text"
        >
          {{ t('admin.person.bulkPasswordReset.success') }}
        </p>
        <p class="mt-2 text-center"></p>
      </v-container>

      <v-card-actions class="justify-center">
        <v-row class="py-3 px-2 justify-center">
          <v-col
            cols="12"
            sm="6"
            md="auto"
          >
            <v-btn
              v-if="progressState === State.FINISHED"
              :block="mdAndDown"
              class="secondary"
              @click="closePasswordResetDialog(true)"
              data-testid="password-reset-close-button"
            >
              {{ t('close') }}
            </v-btn>
            <v-btn
              v-else-if="progressState === State.INITIAL"
              :block="mdAndDown"
              class="secondary"
              @click="closePasswordResetDialog(false)"
              data-testid="password-reset-discard-button"
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
              v-if="progressState === State.INITIAL && isSelectionFromSingleSchule"
              :block="mdAndDown"
              :disabled="personStore.loading"
              class="primary"
              @click="handleResetPassword(props.selectedPersons.map((p: PersonWithRolleAndZuordnung) => p.person.id))"
              data-testid="password-reset-submit-button"
              type="submit"
            >
              {{ t('admin.person.resetPassword') }}
            </v-btn>
            <v-btn
              v-if="progressState === State.FINISHED && resultFile"
              :block="mdAndDown"
              class="primary"
              @click="downloadFile(resultFile)"
              data-testid="download-result-button"
              :disabled="personStore.loading"
            >
              {{ t('admin.person.bulkPasswordReset.downloadResult') }}
            </v-btn>
          </v-col>
        </v-row>
      </v-card-actions>
    </LayoutCard>
  </v-dialog>
</template>
