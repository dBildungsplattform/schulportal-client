<script setup lang="ts">
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import { computed, ref, type ComputedRef, type Ref } from 'vue';
  import { useDisplay } from 'vuetify';
  import { OrganisationsTyp } from '@/stores/OrganisationStore';

  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();

  // Props
  interface Props {
    organisationId: string;
    organisationsTyp: OrganisationsTyp;
    isLoading: boolean;
    useIconActivator: boolean;
    headerText: string;
    confirmationMessage: string;
    successMessage: string;
    errorMessage?: string;
  }

  const props = defineProps<Props>();

  // Emits
  interface Emits {
    (event: 'onDeleteOrganisation', organisationId: string): void;
    (event: 'onClose'): void;
  }
  const emit = defineEmits<Emits>();

  // State
  enum State {
    CONFIRM,
    LOADING,
    COMPLETE,
  }

  const hasTriggeredAction = ref(false);
  const isClosing = ref(false);

  const typForTestId: ComputedRef<string> = computed(() => {
    return props.organisationsTyp.toLowerCase().replace(' ', '-');
  });

  const state: ComputedRef<State> = computed(() => {
    if (isClosing.value) {
      return State.COMPLETE;
    }
    if (props.isLoading) {
      return State.LOADING;
    }
    return hasTriggeredAction.value ? State.COMPLETE : State.CONFIRM;
  });

  function closeOrganisationDeleteDialog(isActive: Ref<boolean>): void {
    isActive.value = false;
  }

  function handleOrganisationDelete(organisationId: string): void {
    hasTriggeredAction.value = true;
    emit('onDeleteOrganisation', organisationId);
  }

  function closeCompleteDialog(isActive: Ref<boolean>): void {
    isClosing.value = true;
    closeOrganisationDeleteDialog(isActive);
    emit('onClose');
  }

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
    <template #activator="{ props: activatorProps }">
      <v-btn
        v-if="!props.useIconActivator"
        class="secondary button"
        :data-testid="`open-${typForTestId}-delete-dialog-button`"
        v-bind="activatorProps"
        :block="mdAndDown"
      >
        {{ props.headerText }}
      </v-btn>
      <v-icon
        v-else
        :title="props.headerText"
        :data-testid="`open-${typForTestId}-delete-dialog-icon`"
        icon="mdi-delete"
        size="small"
        v-bind="activatorProps"
      />
    </template>

    <template #default="{ isActive }">
      <LayoutCard
        :headline-test-id="
          state === State.COMPLETE ? `${typForTestId}-delete-success` : `${typForTestId}-delete-confirmation`
        "
        :closable="state !== State.COMPLETE"
        :header="props.headerText"
        @on-close-clicked="closeOrganisationDeleteDialog(isActive)"
      >
        <v-card-text>
          <v-container>
            <v-row class="text-body bold justify-center">
              <v-col
                class="text-center"
                cols="10"
              >
                <span
                  v-if="state === State.COMPLETE && !props.errorMessage"
                  :data-testid="`${typForTestId}-delete-success-text`"
                >
                  {{ props.successMessage }}
                </span>
                <span
                  v-else-if="state === State.COMPLETE && props.errorMessage"
                  :data-testid="`${typForTestId}-delete-error-text`"
                >
                  {{ props.errorMessage }}
                </span>
                <span
                  v-else
                  :data-testid="`${typForTestId}-delete-confirmation-text`"
                >
                  {{ props.confirmationMessage }}
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
                :data-testid="`cancel-${typForTestId}-delete-dialog-button`"
                @click.stop="closeOrganisationDeleteDialog(isActive)"
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
                v-if="state === State.COMPLETE"
                :block="mdAndDown"
                class="primary"
                :data-testid="`close-${typForTestId}-delete-success-dialog-button`"
                @click.stop="closeCompleteDialog(isActive)"
              >
                {{ $t('close') }}
              </v-btn>
              <v-btn
                v-else
                :block="mdAndDown"
                class="primary button"
                :data-testid="`${typForTestId}-delete-button`"
                :disabled="state === State.LOADING"
                @click.stop="handleOrganisationDelete(props.organisationId)"
              >
                {{ props.headerText }}
              </v-btn>
            </v-col>
          </v-row>
        </v-card-actions>
      </LayoutCard>
    </template>
  </v-dialog>
</template>
