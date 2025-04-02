<script setup lang="ts">
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import type { Organisation } from '@/stores/OrganisationStore';
  import { type PersonenWithRolleAndZuordnung, type PersonStore, usePersonStore } from '@/stores/PersonStore';
  import { buildCSV, download } from '@/utils/file';
  import { intersect } from '@/utils/sets';
  import { computed } from 'vue';
  import { type ComputedRef, type Ref, ref } from 'vue';
  import { type Composer, useI18n } from 'vue-i18n';
  import { useDisplay } from 'vuetify';

  type PersonWithRolleAndZuordnung = PersonenWithRolleAndZuordnung[number];
  type CSVHeaders = 'Klassen' | 'Nachname' | 'Vorname' | 'Benutzername' | 'Passwort';
  type CSVRow = Record<CSVHeaders, string | undefined>;

  type Props = {
    errorCode: string;
    isLoading: boolean;
    isDialogVisible: boolean;
    selectedPersons: PersonenWithRolleAndZuordnung;
  };

  type Emits = (event: 'update:dialogExit', finished: boolean) => void;

  const props: Props = defineProps<Props>();
  const emit: Emits = defineEmits<Emits>();

  const { t }: Composer = useI18n({ useScope: 'global' });
  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();

  const personStore: PersonStore = usePersonStore();

  const transformPersonToZuordnungSet = (person?: PersonWithRolleAndZuordnung): Set<string> =>
    new Set(person?.administrationsebenen.split(','));

  const arePersonsOnSameOrganisation: ComputedRef<boolean> = computed(() => {
    if (props.selectedPersons.length <= 1) return true;
    let zuordnungIntersectionSet: Set<string> = transformPersonToZuordnungSet(props.selectedPersons.at(0));
    if (zuordnungIntersectionSet.size === 0) return true;
    for (let i: number = 1; i < props.selectedPersons.length; i++) {
      const newSet: Set<string> = transformPersonToZuordnungSet(props.selectedPersons[i]);
      zuordnungIntersectionSet = intersect(zuordnungIntersectionSet, newSet);
      if (zuordnungIntersectionSet.size === 0) return false;
    }
    return true;
  });
  const successMessage: ComputedRef<string> = computed(() => {
    if (personStore.bulkResetPasswordResult?.complete) return t('admin.person.bulkPasswordReset.success');
    return '';
  });
  const progress: ComputedRef<number> = computed(() => {
    if (!personStore.bulkResetPasswordResult?.progress) return 0;
    return Math.round(personStore.bulkResetPasswordResult.progress * 100);
  });
  const resultFile: ComputedRef<Blob | null> = computed(() => {
    if (!personStore.bulkResetPasswordResult?.complete) return null;
    let rows: Array<CSVRow> = [];
    for (const [id, password] of personStore.bulkResetPasswordResult.passwords.entries()) {
      const personWithRolleAndZuordnung: PersonWithRolleAndZuordnung | undefined = props.selectedPersons.find(
        (p: PersonWithRolleAndZuordnung) => p.person.id === id,
      );
      rows.push({
        Klassen: personWithRolleAndZuordnung?.klassen,
        Nachname: personWithRolleAndZuordnung?.person.name.familienname,
        Vorname: personWithRolleAndZuordnung?.person.name.vorname,
        Benutzername: personWithRolleAndZuordnung?.person.referrer ?? undefined,
        Passwort: password,
      });
    }
    return buildCSV<CSVHeaders>(['Klassen', 'Nachname', 'Vorname', 'Benutzername', 'Passwort'], rows);
  });

  const showPasswordResetDialog: Ref<boolean> = ref(props.isDialogVisible);

  async function closePasswordResetDialog(finished: boolean): Promise<void> {
    showPasswordResetDialog.value = false;
    emit('update:dialogExit', finished);
    personStore.bulkResetPasswordResult = null;
  }

  async function handleResetPassword(personIDs: string[]): Promise<void> {
    await personStore.bulkResetPassword(personIDs);
  }

  function downloadFile(blob: Blob): void {
    download('ergebnis.txt', blob);
  }
</script>

<template>
  <v-dialog
    ref="resetPasswordBulkDialog"
    v-model="showPasswordResetDialog"
    persistent
  >
    <LayoutCard
      data-testid="password-reset-layout-card"
      :header="t('admin.person.resetPassword')"
    >
      <!-- Initial block -->
      <v-container
        class="mt-8 mb-4"
        v-if="progress == 0"
      >
        <template v-if="!arePersonsOnSameOrganisation">
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
        v-if="progress > 0"
        class="mt-4"
      >
        <v-container
          v-if="successMessage"
          data-testid="password-reset-success-text"
        >
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
          v-if="progress < 100"
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
        <!-- Progress Bar -->
        <v-progress-linear
          class="mt-5"
          :modelValue="progress"
          color="primary"
          height="25"
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
              v-if="progress === 0"
              :block="mdAndDown"
              class="secondary"
              @click="closePasswordResetDialog(false)"
              data-testid="password-reset-discard-button"
            >
              {{ t('cancel') }}
            </v-btn>
            <v-btn
              v-else-if="personStore.bulkResetPasswordResult?.complete"
              :block="mdAndDown"
              class="primary"
              @click="closePasswordResetDialog(true)"
              data-testid="password-reset-close-button"
            >
              {{ t('close') }}
            </v-btn>
          </v-col>
          <v-col
            cols="12"
            sm="6"
            md="auto"
          >
            <v-btn
              v-if="progress === 0"
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
              v-else-if="resultFile"
              :block="mdAndDown"
              class="primary"
              @click="downloadFile(resultFile)"
              data-testid="download-result-button"
            >
              {{ t('admin.person.bulkPasswordReset.downloadResult') }}
            </v-btn>
          </v-col>
        </v-row>
      </v-card-actions>
    </LayoutCard>
  </v-dialog>
</template>
