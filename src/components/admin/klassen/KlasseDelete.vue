<script setup lang="ts">
  import { computed, ref, type ComputedRef, type Ref } from 'vue';
  import { useI18n, type Composer } from 'vue-i18n';
  import { useDisplay } from 'vuetify';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import { type Router, useRouter } from 'vue-router';

  const { t }: Composer = useI18n({ useScope: 'global' });

  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();
  const router: Router = useRouter();
  type Props = {
    errorCode: string;
    klassenname: string;
    klassenId: string;
    useIconActivator: boolean;
  };

  type Emits = {
    (event: 'onDeleteKlasse', klasseId: string): void;
  };

  const props: Props = defineProps<Props>();

  const emit: Emits = defineEmits<Emits>();

  const errorMessage: Ref<string> = ref('');
  const successDialogVisible: Ref<boolean> = ref(false);

  async function closePasswordResetDialog(isActive: Ref<boolean>): Promise<void> {
    isActive.value = false;
  }

  async function handleKlasseDelete(klasseId: string): Promise<void> {
    emit('onDeleteKlasse', klasseId);
    successDialogVisible.value = true;
  }

  async function closeSuccessDialogAndPushToManagent(): Promise<void> {
    successDialogVisible.value = false;
    if (router.currentRoute.value.name === 'klasse-management') {
      router.go(0);
    } else {
      router.push({ name: 'klasse-management' });
    }
  }

  const deleteKlasseConfirmationMessage: ComputedRef<string> = computed(() => {
    if (errorMessage.value || props.errorCode) {
      return '';
    }
    let message: string = '';
    message += `${t('admin.klasse.deleteKlasseConfirmation', {
      name: props.klassenname,
    })}`;
    return message;
  });

  const deleteKlasseSuccessMessage: ComputedRef<string> = computed(() => {
    if (errorMessage.value || props.errorCode) {
      return '';
    }
    let message: string = '';
    message += `${t('admin.klasse.deleteKlasseSuccessMessage', {
      name: props.klassenname,
    })}`;
    return message;
  });
</script>

<template>
  <v-dialog
    v-model="successDialogVisible"
    persistent
  >
    <LayoutCard
      v-if="successDialogVisible"
      :closable="false"
      :header="$t('admin.klasse.deleteKlasse')"
    >
      <v-card-text>
        <v-container>
          <v-row class="text-body bold px-md-16">
            <v-col
              offset="3"
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
              @click.stop="closeSuccessDialogAndPushToManagent()"
              data-testid="close-klasse-delete-success-dialog-button"
            >
              {{ $t('close') }}
            </v-btn>
          </v-col>
        </v-row>
      </v-card-actions>
    </LayoutCard>
  </v-dialog>
  <v-dialog
    v-if="!successDialogVisible"
    persistent
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

    <template
      v-if="!successDialogVisible"
      v-slot:default="{ isActive }"
    >
      <LayoutCard
        :closable="true"
        :header="$t('admin.klasse.deleteKlasse')"
        @onCloseClicked="closePasswordResetDialog(isActive)"
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
            <v-row class="text-body bold">
              <v-col
                offset="3"
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
                @click.stop="closePasswordResetDialog(isActive)"
                data-testid="close-klasse-delete-dialog-button"
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
