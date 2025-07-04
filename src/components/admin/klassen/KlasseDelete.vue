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

  enum State {
    CONFIRM,
    LOADING,
    SUCCESS,
  }

  const props: Props = defineProps<Props>();

  const emit: Emits = defineEmits<Emits>();

  const hasTriggeredAction: Ref<boolean> = ref(false);

  const state: ComputedRef<State> = computed(() => {
    if (props.isLoading) {
      return State.LOADING;
    }
    if (hasTriggeredAction.value) {
      return State.SUCCESS;
    }
    return State.CONFIRM;
  });

  async function closeKlasseDeleteDialog(isActive: Ref<boolean>): Promise<void> {
    isActive.value = false;
  }

  async function handleKlasseDelete(klasseId: string): Promise<void> {
    hasTriggeredAction.value = true;
    emit('onDeleteKlasse', klasseId);
  }

  async function closeSuccessDialog(isActive: Ref<boolean>): Promise<void> {
    await closeKlasseDeleteDialog(isActive);
    emit('onClose');
  }

  const deleteKlasseConfirmationMessage: ComputedRef<string> = computed(() => {
    return t('admin.klasse.deleteKlasseConfirmation', {
      klassenname: props.klassenname,
      schulname: props.schulname,
    });
  });

  const deleteKlasseSuccessMessage: ComputedRef<string> = computed(() => {
    return t('admin.klasse.deleteKlasseSuccessMessage', {
      klassenname: props.klassenname,
      schulname: props.schulname,
    });
  });

  const handleOpenDialog = (newValue: boolean): void => {
    if (newValue) {
      hasTriggeredAction.value = false;
    }
  };
</script>

<template>
  <v-dialog
    persistent
    @update:model-value="handleOpenDialog"
  >
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
        :headlineTestId="state === State.SUCCESS ? 'klasse-delete-success' : 'klasse-delete-confirmation'"
        :closable="state === State.SUCCESS ? false : true"
        :header="$t('admin.klasse.deleteKlasse')"
        @onCloseClicked="closeKlasseDeleteDialog(isActive)"
      >
        <v-card-text>
          <v-container>
            <v-row class="text-body bold justify-center">
              <v-col
                class="text-center"
                cols="10"
              >
                <span
                  v-if="state === State.SUCCESS && !props.errorCode"
                  data-testid="klasse-delete-success-text"
                >
                  {{ deleteKlasseSuccessMessage }}
                </span>
                <span
                  v-else
                  data-testid="klasse-delete-confirmation-text"
                >
                  {{ deleteKlasseConfirmationMessage }}
                </span>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions class="justify-center">
          <v-row class="justify-center">
            <v-col
              v-if="state !== State.SUCCESS"
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
                v-if="state === State.SUCCESS"
                :block="mdAndDown"
                class="primary"
                @click.stop="closeSuccessDialog(isActive)"
                data-testid="close-klasse-delete-success-dialog-button"
              >
                {{ $t('close') }}
              </v-btn>
              <v-btn
                v-else
                :block="mdAndDown"
                class="primary button"
                @click.stop="handleKlasseDelete(klassenId)"
                data-testid="klasse-delete-button"
                :disabled="state === State.LOADING"
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
