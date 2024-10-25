<script setup lang="ts">
  import { ref, type Ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useDisplay } from 'vuetify';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import { type Router, useRouter } from 'vue-router';
  import { type Rolle } from '@/stores/RolleStore';

  useI18n({ useScope: 'global' });
  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();

  const router: Router = useRouter();

  type Props = {
    errorCode: string;
    rolle: Rolle;
  };

  type Emits = {
    (event: 'onDeleteRolle', rolleId: string): void;
  };
  defineProps<Props>();
  const emit: Emits = defineEmits<Emits>();
  const errorMessage: Ref<string> = ref('');
  const successDialogVisible: Ref<boolean> = ref(false);

  async function closeRolleDeleteDialog(isActive: Ref<boolean>): Promise<void> {
    isActive.value = false;
  }

  async function handleRolleDelete(rolleId: string): Promise<void> {
    emit('onDeleteRolle', rolleId);
    successDialogVisible.value = true;
  }

  async function closeSuccessDialogAndPushToManagement(): Promise<void> {
    successDialogVisible.value = false;
    router.push({ name: 'rolle-management' });
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
      :header="$t('admin.rolle.deleteRolle')"
    >
      <v-card-text>
        <v-container>
          <v-row class="text-body bold px-md-16">
            <v-col
              offset="3"
              cols="10"
            >
              <span data-testid="rolle-delete-success-text">
                {{ $t('admin.rolle.deleteRolleSuccessMessage') }}
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
              @click.stop="closeSuccessDialogAndPushToManagement()"
              data-testid="close-rolle-delete-success-dialog-button"
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
        class="secondary button"
        data-testid="open-rolle-delete-dialog-button"
        v-bind="props"
        :block="mdAndDown"
      >
        {{ $t('admin.rolle.deleteRolle') }}
      </v-btn>
    </template>

    <template
      v-if="!successDialogVisible"
      v-slot:default="{ isActive }"
    >
      <LayoutCard
        :closable="true"
        :header="$t('admin.rolle.deleteRolle')"
        @onCloseClicked="closeRolleDeleteDialog(isActive)"
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
                <span data-testid="rolle-delete-confirmation-text">
                  {{ $t('admin.rolle.deleteRolleConfirmation') }}
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
                @click.stop="closeRolleDeleteDialog(isActive)"
                data-testid="cancel-rolle-delete-button"
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
                @click.stop="handleRolleDelete(rolle.id)"
                data-testid="rolle-delete-button"
              >
                {{ $t('admin.rolle.deleteRolle') }}
              </v-btn>
            </v-col>
          </v-row>
        </v-card-actions>
      </LayoutCard>
    </template>
  </v-dialog>
</template>

<style></style>
