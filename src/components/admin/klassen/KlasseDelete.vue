<script setup lang="ts">
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import { computed, ref, type ComputedRef, type Ref } from 'vue';
  import { useI18n, type Composer } from 'vue-i18n';
  import { useDisplay } from 'vuetify';

  const { t }: Composer = useI18n({ useScope: 'global' });

  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();

  type Props = {
    errorCode: string;
    klassenname: string;
    klassenId: string;
    schulname: string;
    isLoading: boolean;
    useIconActivator: boolean;
  };

  type Emits = {
    (event: 'onDeleteKlasse', klasseId: string): void;
    (event: 'onClose'): void;
  };

  const props: Props = defineProps<Props>();

  const emit: Emits = defineEmits<Emits>();

  const errorMessage: Ref<string> = ref('');
  const successDialogVisible: Ref<boolean> = ref(false);

  async function closeKlasseDeleteDialog(isActive: Ref<boolean>): Promise<void> {
    isActive.value = false;
  }

  async function handleKlasseDelete(klasseId: string): Promise<void> {
    emit('onDeleteKlasse', klasseId);
    successDialogVisible.value = true;
  }

  async function closeSuccessDialog(isActive: Ref<boolean>): Promise<void> {
    // Thi is to close the dialog but it does not happen immediately so we add a delay to avoid flickering
    isActive.value = false;

    // Delay hiding success dialog to avoid confirmation flicker (Vue is too fast here and shows the confirmation dialog before the success dialog is closed)
    setTimeout(() => {
      successDialogVisible.value = false;
      emit('onClose');
    }, 300);
  }
  const deleteKlasseConfirmationMessage: ComputedRef<string> = computed(() => {
    if (errorMessage.value || props.errorCode) {
      return '';
    }
    let message: string = '';
    message += `${t('admin.klasse.deleteKlasseConfirmation', {
      klassenname: props.klassenname,
      schulname: props.schulname,
    })}`;
    return message;
  });

  const deleteKlasseSuccessMessage: ComputedRef<string> = computed(() => {
    if (errorMessage.value || props.errorCode) {
      return '';
    }
    let message: string = '';
    message += `${t('admin.klasse.deleteKlasseSuccessMessage', {
      klassenname: props.klassenname,
      schulname: props.schulname,
    })}`;
    return message;
  });
</script>

<template>
  <v-dialog persistent>
    <template v-slot:activator="{ props }">
      <v-btn
        v-if="!useIconActivator"
        class="secondary button"
        data-testid="open-klasse-delete-dialog-button"
        v-bind="props"
        :block="mdAndDown"
      >
        {{ $t('admin.klasse.deleteKlasse') }}
      </v-btn>
      <v-icon
        v-else
        :title="$t('admin.klasse.deleteKlasse')"
        data-testid="open-klasse-delete-dialog-icon"
        icon="mdi-delete"
        size="small"
        v-bind="props"
      ></v-icon>
    </template>

    <template v-slot:default="{ isActive }">
      <LayoutCard
        :headlineTestId="'klasse-delete-success'"
        v-if="successDialogVisible"
        :closable="false"
        :header="$t('admin.klasse.deleteKlasse')"
      >
        <v-card-text>
          <v-container>
            <v-row class="text-body bold justify-center">
              <v-col
                class="text-center"
                cols="10"
              >
                <span data-testid="klasse-delete-success-text">
                  {{ deleteKlasseSuccessMessage }}
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
                class="primary"
                @click.stop="closeSuccessDialog(isActive)"
                data-testid="close-klasse-delete-success-dialog-button"
              >
                {{ $t('close') }}
              </v-btn>
            </v-col>
          </v-row>
        </v-card-actions>
      </LayoutCard>
      <LayoutCard
        :headlineTestId="'klasse-delete-confirmation'"
        v-else
        :closable="true"
        :header="$t('admin.klasse.deleteKlasse')"
        @onCloseClicked="closeKlasseDeleteDialog(isActive)"
      >
        <v-card-text>
          <v-container>
            <v-row
              v-if="errorMessage || errorCode"
              class="text-body text-error"
            >
              <v-col
                class="text-right"
                cols="1"
              >
                <v-icon icon="mdi-alert"></v-icon>
              </v-col>
              <v-col>
                <p data-testid="error-text">
                  {{ errorMessage || errorCode }}
                </p>
              </v-col>
            </v-row>
            <v-row class="text-body bold justify-center">
              <v-col
                class="text-center"
                cols="10"
              >
                <span data-testid="klasse-delete-confirmation-text">
                  {{ deleteKlasseConfirmationMessage }}
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
                class="secondary button"
                @click.stop="closeKlasseDeleteDialog(isActive)"
                data-testid="cancel-klasse-delete-dialog-button"
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
                class="primary button"
                @click.stop="handleKlasseDelete(klassenId)"
                data-testid="klasse-delete-button"
                :disabled="isLoading"
              >
                {{ $t('admin.klasse.deleteKlasse') }}
              </v-btn>
            </v-col>
          </v-row>
        </v-card-actions>
      </LayoutCard>
    </template>
  </v-dialog>
</template>

<style></style>
