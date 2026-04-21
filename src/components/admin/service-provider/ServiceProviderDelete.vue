<script setup lang="ts">
  import { computed, ref, type ComputedRef, type Ref, type WritableComputedRef } from 'vue';
  import { useI18n, type Composer } from 'vue-i18n';
  import { useDisplay } from 'vuetify';

  import LayoutCard from '@/components/cards/LayoutCard.vue';

  const { t }: Composer = useI18n({ useScope: 'global' });

  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();

  type Props = {
    modelValue: boolean;
    errorCode: string;
    serviceProviderId: string;
    serviceProviderName: string;
    isLoading: boolean;
  };

  type Emits = {
    (event: 'update:modelValue', value: boolean): void;
    (event: 'onDeleteServiceProvider', serviceProviderId: string): void;
    (event: 'onClose', completed: boolean): void;
  };

  enum State {
    CONFIRM,
    LOADING,
    COMPLETE,
  }

  const props: Props = defineProps<Props>();

  const emit: Emits = defineEmits<Emits>();

  const model: WritableComputedRef<boolean, boolean> = computed({
    get: () => props.modelValue,
    set: (val: boolean) => emit('update:modelValue', val),
  });

  const hasTriggeredAction: Ref<boolean> = ref(false);
  const isClosing: Ref<boolean> = ref(false);

  const state: ComputedRef<State> = computed(() => {
    // NOTE: order of checks and the two different paths into COMPLETE are important here
    // this freezes the content of the dialog in the complete state, while the close-animation is running
    // otherwise it will briefly show the initial template, because the isLoading-prop is true
    if (isClosing.value) {
      return State.COMPLETE;
    }
    if (props.isLoading) {
      return State.LOADING;
    }
    return hasTriggeredAction.value ? State.COMPLETE : State.CONFIRM;
  });

  function closeServiceProviderDeleteDialog(isActive: Ref<boolean>, successful: boolean): void {
    isActive.value = false;
    emit('onClose', successful);
  }

  function handleServiceProviderDelete(serviceProviderId: string): void {
    hasTriggeredAction.value = true;
    emit('onDeleteServiceProvider', serviceProviderId);
  }

  function closeSuccessDialog(isActive: Ref<boolean>): void {
    isClosing.value = true;
    closeServiceProviderDeleteDialog(isActive, props.errorCode === '');
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
    v-model="model"
    @after-leave="resetState"
  >
    <template #default="{ isActive }">
      <LayoutCard
        :headline-test-id="
          state === State.COMPLETE ? 'service-provider-delete-complete' : 'service-provider-delete-confirmation'
        "
        :closable="state === State.COMPLETE ? false : true"
        :header="$t('admin.angebot.delete.title')"
        @on-close-clicked="closeServiceProviderDeleteDialog(isActive, false)"
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
                    t(`admin.angebot.errors.${props.errorCode}`, {
                      serviceProviderName: props.serviceProviderName,
                    })
                  }}
                </span>
                <span
                  v-else-if="state === State.COMPLETE && !props.errorCode"
                  data-testid="service-provider-delete-complete-text"
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
              v-if="state !== State.COMPLETE"
              cols="12"
              sm="6"
              md="4"
            >
              <v-btn
                :block="mdAndDown"
                class="secondary button"
                data-testid="cancel-service-provider-delete-dialog-button"
                @click.stop="closeServiceProviderDeleteDialog(isActive, false)"
              >
                {{ $t('cancel') }}
              </v-btn>
            </v-col>
            <v-col
              cols="12"
              sm="6"
              md="4"
            >
              <template> </template>
              <v-btn
                v-if="state === State.COMPLETE"
                :block="mdAndDown"
                class="primary"
                :data-testid="
                  props.errorCode
                    ? 'close-service-provider-delete-error-dialog-button'
                    : 'close-service-provider-delete-success-dialog-button'
                "
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
