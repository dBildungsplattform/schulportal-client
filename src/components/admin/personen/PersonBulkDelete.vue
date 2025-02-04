<script setup lang="ts">
  import { usePersonStore, type PersonStore } from '@/stores/PersonStore';
  import { type Ref, ref } from 'vue';
  import { type Composer, useI18n } from 'vue-i18n';
  import { useDisplay } from 'vuetify';
  import LayoutCard from '@/components/cards/LayoutCard.vue';

  const { t }: Composer = useI18n({ useScope: 'global' });
  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();

  const personStore: PersonStore = usePersonStore();

  const progress: Ref<number> = ref<number>(0);
  const successMessage: Ref<string> = ref<string>('');

  type Props = {
    errorCode: string;
    isLoading: boolean;
    isDialogVisible: boolean;
    personIDs: string[];
  };

  type Emits = (event: 'update:isDialogVisible', isDialogVisible: boolean) => void;

  const props: Props = defineProps<Props>();
  const emit: Emits = defineEmits<Emits>();
  const showDeletePersonDialog: Ref<boolean> = ref(props.isDialogVisible);

  async function closeDeltePersonDialog(): Promise<void> {
    progress.value = 0;
    showDeletePersonDialog.value = false;
    emit('update:isDialogVisible', false);
  }

  async function handleDeletePerson(personIDs: string[]): Promise<void> {
    successMessage.value = '';
    progress.value = 0; // Reset progress bar to 0 at the start

    for (let i: number = 0; i < personIDs.length; i++) {
      const personId: string = personIDs[i] as string;

      // Delete person by ID
      await personStore.deletePersonById(personId);

      // Update progress for each item processed
      progress.value = Math.ceil(((i + 1) / personIDs.length) * 100);

      // Only show success message after all items have been processed
      if (i === personIDs.length - 1) {
        successMessage.value = t('admin.person.deletePersonBulkSuccessMessage');
      }
    }
  }
</script>

<template>
  <v-dialog
    ref="deletePersonBulkDialog"
    v-model="showDeletePersonDialog"
    persistent
  >
    <LayoutCard
      data-testid="person-delete-layout-card"
      :closable="true"
      :header="$t('admin.person.deletePerson')"
      @onCloseClicked="closeDeltePersonDialog()"
    >
      <v-container
        class="mt-4"
        v-if="progress == 0"
      >
        <v-row class="text-body bold justify-center">
          <span data-testid="person-delete-confirmation-text">
            {{ t('admin.person.deletePersonBulkConfirmation') }}
          </span>
        </v-row>
      </v-container>
      <v-container>
        <!-- Progress Bar -->
        <div
          v-if="progress > 0"
          class="mt-4"
        >
          <v-container
            v-if="successMessage"
            data-testid="person-delete-success-text"
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
                {{ $t('admin.doNotCloseBrowserNotice') }}
              </span>
            </v-col>
          </v-row>
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
        </div>
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
              @click="closeDeltePersonDialog"
              data-testid="person-delete-discard-button"
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
              :disabled="personStore.loading"
              class="primary"
              @click="handleDeletePerson(props.personIDs)"
              data-testid="person-delete-submit-button"
              type="submit"
            >
              {{ $t('admin.person.deletePerson') }}
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
              @click="closeDeltePersonDialog"
              data-testid="person-delete-close-button"
            >
              {{ $t('close') }}
            </v-btn>
          </v-col>
        </v-row>
      </v-card-actions>
    </LayoutCard>
  </v-dialog>
</template>
