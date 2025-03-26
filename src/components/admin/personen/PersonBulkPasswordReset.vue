<script setup lang="ts">
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import { type PersonStore, usePersonStore } from '@/stores/PersonStore';
  import { buildCSV, download } from '@/utils/file';
  import { computed } from 'vue';
  import { type ComputedRef, type Ref, ref } from 'vue';
  import { type Composer, useI18n } from 'vue-i18n';
  import { useDisplay } from 'vuetify';

  const { t }: Composer = useI18n({ useScope: 'global' });
  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();

  const personStore: PersonStore = usePersonStore();

  const successMessage: ComputedRef<string> = computed(() => {
    if (personStore.bulkResetPasswordResult?.complete) return t('admin.person.resetPasswordBulkSuccessMessage');
    return '';
  });
  const progress: ComputedRef<number> = computed(() => {
    if (!personStore.bulkResetPasswordResult?.progress) return 0;
    return Math.round(personStore.bulkResetPasswordResult.progress * 100);
  });
  const resultFile: ComputedRef<Blob | null> = computed(() => {
    if (!personStore.bulkResetPasswordResult?.complete) return null;
    let entries = [];
    for (const [id, password] of personStore.bulkResetPasswordResult.passwords.entries()) {
      entries.push({
        Benutzer: id,
        Passwort: password,
      });
    }
    return buildCSV(['Benutzer', 'Passwort'], entries);
  });

  type Props = {
    errorCode: string;
    isLoading: boolean;
    isDialogVisible: boolean;
    personIDs: string[];
  };

  type Emits = (event: 'update:dialogExit', finished: boolean) => void;

  const props: Props = defineProps<Props>();
  const emit: Emits = defineEmits<Emits>();
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
      <v-container
        class="mt-8 mb-4"
        v-if="progress == 0"
      >
        <v-row class="text-body bold justify-center">
          <span data-testid="password-reset-confirmation-text">
            {{ t('admin.person.resetPasswordBulkConfirmation') }}
          </span>
        </v-row>
      </v-container>

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
          <v-btn
            v-if="resultFile"
            :block="mdAndDown"
            class="primary"
            @click="downloadFile(resultFile)"
            data-testid="download-result-button"
          >
            {{ 'Download' }}
          </v-btn>
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
        <v-row
          v-if="progress === 0"
          class="py-3 px-2 justify-center"
        >
          <v-col
            cols="12"
            sm="6"
            md="auto"
          >
            <v-btn
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
              :block="mdAndDown"
              :disabled="personStore.loading"
              class="primary"
              @click="handleResetPassword(props.personIDs)"
              data-testid="password-reset-submit-button"
              type="submit"
            >
              {{ t('admin.person.resetPassword') }}
            </v-btn>
          </v-col>
        </v-row>
        <v-row
          v-if="progress === 100"
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
              @click="closePasswordResetDialog(true)"
              data-testid="password-reset-close-button"
            >
              {{ t('close') }}
            </v-btn>
          </v-col>
        </v-row>
      </v-card-actions>
    </LayoutCard>
  </v-dialog>
</template>
