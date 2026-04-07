<script setup lang="ts">
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import { computed, ref, type ComputedRef, type Ref } from 'vue';
  import { useI18n, type Composer } from 'vue-i18n';
  import { useDisplay } from 'vuetify';

  const { t }: Composer = useI18n({ useScope: 'global' });

  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();

  type Props = {
    errorCode: string;
    serviceProviderId: string;
    serviceProviderName: string;
    isLoading: boolean;
  };

  type Emits = {
    (event: 'onDeleteServiceProvider', serviceProviderId: string): void;
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

  function closeServiceProviderDeleteDialog(isActive: Ref<boolean>): void {
    isActive.value = false;
  }

  function handleServiceProviderDelete(serviceProviderId: string): void {
    hasTriggeredAction.value = true;
    emit('onDeleteServiceProvider', serviceProviderId);
  }

  function closeSuccessDialog(isActive: Ref<boolean>): void {
    isClosing.value = true;
    closeServiceProviderDeleteDialog(isActive);
    emit('onClose');
  }

  const deleteServiceProviderConfirmationMessage: ComputedRef<string> = computed(() => {
    return t('admin.angebot.delete.confirmation', {
      serviceProviderName: props.serviceProviderName,
    });
  });

  const deleteServiceProviderSuccessMessage: ComputedRef<string> = computed(() => {
    return t('admin.angebot.delete.success', {
      serviceProviderName: props.serviceProviderName,
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
      <v-icon
        :title="$t('admin.angebot.delete.title')"
        data-testid="open-service-provider-delete-dialog-icon"
        icon="mdi-delete"
        size="small"
        v-bind="props"
      />
    </template>

    <template #default="{ isActive }">
      <LayoutCard
        :headline-test-id="
          state === State.SUCCESS ? 'service-provider-delete-success' : 'service-provider-delete-confirmation'
        "
        :closable="state === State.SUCCESS ? false : true"
        :header="$t('admin.angebot.delete.title')"
        @on-close-clicked="closeServiceProviderDeleteDialog(isActive)"
      >
        <v-card-text>
          <v-container>
            <v-row class="text-body bold justify-center">
              <v-col
                class="text-center"
                cols="10"
              >
                <span v-if="props.errorCode">
                  {{
                    t(`admin.angebot.delete.errors.${props.errorCode}`, {
                      serviceProviderName: props.serviceProviderName,
                    })
                  }}
                </span>
                <span
                  v-else-if="state === State.SUCCESS && !props.errorCode"
                  data-testid="service-provider-delete-success-text"
                >
                  {{ deleteServiceProviderSuccessMessage }}
                </span>
                <span
                  v-else
                  data-testid="service-provider-delete-confirmation-text"
                >
                  {{ deleteServiceProviderConfirmationMessage }}
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
                data-testid="cancel-service-provider-delete-dialog-button"
                @click.stop="closeServiceProviderDeleteDialog(isActive)"
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
                data-testid="close-service-provider-delete-success-dialog-button"
                @click.stop="closeSuccessDialog(isActive)"
              >
                {{ $t('close') }}
              </v-btn>
              <v-btn
                v-else
                :block="mdAndDown"
                class="primary button"
                data-testid="service-provider-delete-button"
                :disabled="state === State.LOADING"
                @click.stop="handleServiceProviderDelete(serviceProviderId)"
              >
                {{ $t('admin.angebot.delete.action') }}
              </v-btn>
            </v-col>
          </v-row>
        </v-card-actions>
      </LayoutCard>
    </template>
  </v-dialog>
</template>
