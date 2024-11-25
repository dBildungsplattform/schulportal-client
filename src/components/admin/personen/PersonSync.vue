<script setup lang="ts">
  import SpshTooltip from '@/components/admin/SpshTooltip.vue';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import { type Personendatensatz } from '@/stores/PersonStore';
  import { ref, type Ref } from 'vue';
  import { useI18n, type Composer } from 'vue-i18n';
  import { useDisplay } from 'vuetify';

  const { t }: Composer = useI18n({ useScope: 'global' });
  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();

  type Props = {
    disabled: boolean;
    errorCode: string;
    person: Personendatensatz;
    isLoading: boolean;
  };

  type Emits = {
    (event: 'onSyncPerson', personId: string): void;
  };

  const props: Props = defineProps<Props>();
  const emit: Emits = defineEmits<Emits>();

  const successDialogVisible: Ref<boolean> = ref(false);

  async function closeSyncDialog(isActive: Ref<boolean>): Promise<void> {
    isActive.value = false;
  }

  async function closeDialogAndHandlePersonSync(isActive: Ref<boolean>, personId: string): Promise<void> {
    emit('onSyncPerson', personId);
    isActive.value = false;
    successDialogVisible.value = true;
  }

  async function closeSuccessDialog(): Promise<void> {
    successDialogVisible.value = false;
  }
</script>

<template>
  <v-dialog
    v-model="successDialogVisible"
    persistent
  >
    <LayoutCard
      v-if="successDialogVisible"
      :closable="false"
      :header="$t('admin.person.syncPerson')"
    >
      <v-card-text>
        <v-container>
          <v-row class="text-body bold px-md-16">
            <v-col
              offset="2"
              cols="8"
              class="text-center"
            >
              <span data-testid="person-sync-success-text">
                {{ t('admin.person.syncPersonSuccessMessage') }}
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
              @click.stop="closeSuccessDialog()"
              data-testid="close-person-sync-success-dialog-button"
            >
              {{ $t('close') }}
            </v-btn>
          </v-col>
        </v-row>
      </v-card-actions>
    </LayoutCard>
  </v-dialog>
  <v-dialog persistent>
    <template v-slot:activator="{ props }">
      <v-col
        cols="12"
        sm="6"
        md="auto"
      >
        <SpshTooltip
          :enabledCondition="!disabled"
          :disabledText="$t('person.finishEditFirst')"
          :enabledText="$t('admin.person.syncPerson')"
          position="start"
        >
          <v-btn
            class="primary"
            data-testid="open-person-sync-dialog-button"
            :disabled="disabled"
            v-bind="props"
            :block="mdAndDown"
          >
            {{ $t('admin.person.syncPerson') }}
          </v-btn>
        </SpshTooltip>
      </v-col>
    </template>

    <template
      v-if="!successDialogVisible"
      v-slot:default="{ isActive }"
    >
      <LayoutCard
        :closable="true"
        :header="$t('admin.person.syncPerson')"
        @onCloseClicked="closeSyncDialog(isActive)"
      >
        <v-card-text>
          <v-container>
            <v-row
              v-if="props.errorCode"
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
                  {{ t(`errors.${props.errorCode}`) }}
                </p>
              </v-col>
            </v-row>
            <v-row class="text-body bold">
              <v-col
                offset="2"
                cols="8"
              >
                <span data-testid="person-sync-confirmation-text">
                  {{ t('admin.person.syncPersonConfirmation') }}
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
                @click.stop="closeSyncDialog(isActive)"
                data-testid="close-person-sync-dialog-button"
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
                @click.stop="closeDialogAndHandlePersonSync(isActive, person.person.id)"
                data-testid="person-sync-button"
                :disabled="!isLoading"
              >
                {{ $t('proceed') }}
              </v-btn>
            </v-col>
          </v-row>
        </v-card-actions>
      </LayoutCard>
    </template>
  </v-dialog>
</template>

<style></style>
