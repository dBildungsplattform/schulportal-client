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
  const isClosing: Ref<boolean> = ref(false);

  const state: ComputedRef<State> = computed(() => {
    // NOTE: order of checks and the two different paths into SUCCESS are important here
    // this freezes the content of the dialog in the success state, while the close-animation is running
    // otherwise it will briefly show the initial template, because the isLoading-prop is true
    if (isClosing.value) {
      return State.SUCCESS;
    }
    if (props.isLoading) {
      return State.LOADING;
    }
    return hasTriggeredAction.value ? State.SUCCESS : State.CONFIRM;
  });

  function closeKlasseDeleteDialog(isActive: Ref<boolean>): void {
    isActive.value = false;
  }

  function handleKlasseDelete(klasseId: string): void {
    hasTriggeredAction.value = true;
    emit('onDeleteKlasse', klasseId);
  }

  function closeSuccessDialog(isActive: Ref<boolean>): void {
    isClosing.value = true;
    closeKlasseDeleteDialog(isActive);
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

  const resetState = (): void => {
    hasTriggeredAction.value = false;
    isClosing.value = false;
  };
</script>

<template>
  <v-dialog
    persistent
    @after-leave="resetState"
  >
    <template #activator="{ props }">
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
      />
    </template>

    <template #default="{ isActive }">
      <LayoutCard
        :headline-test-id="state === State.SUCCESS ? 'klasse-delete-success' : 'klasse-delete-confirmation'"
        :closable="state === State.SUCCESS ? false : true"
        :header="$t('admin.klasse.deleteKlasse')"
        @on-close-clicked="closeKlasseDeleteDialog(isActive)"
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
                data-testid="cancel-klasse-delete-dialog-button"
                @click.stop="closeKlasseDeleteDialog(isActive)"
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
                data-testid="close-klasse-delete-success-dialog-button"
                @click.stop="closeSuccessDialog(isActive)"
              >
                {{ $t('close') }}
              </v-btn>
              <v-btn
                v-else
                :block="mdAndDown"
                class="primary button"
                data-testid="klasse-delete-button"
                :disabled="state === State.LOADING"
                @click.stop="handleKlasseDelete(klassenId)"
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
