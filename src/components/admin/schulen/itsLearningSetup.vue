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
    schulname: string;
    schulId: string;
    itslearningEnabled: boolean;
  };

  type Emits = {
    (event: 'onActivateItslearning', schuleId: string): void;
  };

  const props: Props = defineProps<Props>();

  const emit: Emits = defineEmits<Emits>();

  const errorMessage: Ref<string> = ref('');
  const successDialogVisible: Ref<boolean> = ref(false);

  async function closeActivateSchuleDialog(isActive: Ref<boolean>): Promise<void> {
    isActive.value = false;
  }

  async function handleSchuleToItsLearning(schuleId: string): Promise<void> {
    emit('onActivateItslearning', schuleId);
    successDialogVisible.value = true;
  }

  async function closeSuccessDialogAndPushToManagement(): Promise<void> {
    successDialogVisible.value = false;
    if (router.currentRoute.value.name === 'schule-management') {
      router.go(0);
    } else {
      router.push({ name: 'schule-management' });
    }
  }

  const activateSchuleItsLearningConfirmationMessage: ComputedRef<string> = computed(() => {
    if (errorMessage.value || props.errorCode) {
      return '';
    }
    let message: string = '';
    message += `${t('admin.schule.activateSchuleConfirmationMessage', {
      schulname: props.schulname,
    })}`;
    return message;
  });

  const retransmitSchuleConfirmationMessage: ComputedRef<string> = computed(() => {
    if (errorMessage.value || props.errorCode) {
      return '';
    }
    let message: string = '';
    message += `${t('admin.schule.retransmitSchuleConfirmationMessage', {
      schulname: props.schulname,
    })}`;
    return message;
  });

  const activateItsLearningSuccessMessage: ComputedRef<string> = computed(() => {
    if (errorMessage.value || props.errorCode) {
      return '';
    }
    let message: string = '';
    message += `${t('admin.schule.activateSchuleSuccessMessage', {
      schulname: props.schulname,
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
      :header="$t('admin.schule.activateInItsLearning')"
    >
      <v-card-text>
        <v-container>
          <v-row class="text-body bold justify-center">
            <v-col
              cols="10"
              class="text-center"
            >
              <span data-testid="activate-schule-sync-itslearning-success-text">
                {{ activateItsLearningSuccessMessage }}
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
              data-testid="close-schule-sync-itslearning-dialog-button"
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
      <v-icon
        class="ml-10"
        v-if="itslearningEnabled"
        :title="$t('admin.schule.retransmit')"
        data-testid="open-schule-itslearning-resync-dialog-icon"
        icon="mdi-reload"
        size="small"
        v-bind="props"
      >
      </v-icon>
      <v-icon
        class="ml-10"
        v-else
        :title="$t('admin.schule.enableNow')"
        data-testid="open-schule-itslearning-sync-dialog-icon"
        icon="mdi-power"
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
        :header="$t('admin.schule.activateInItsLearning')"
        @onCloseClicked="closeActivateSchuleDialog(isActive)"
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
                cols="10"
                class="text-center"
              >
                <span
                  v-if="props.itslearningEnabled"
                  data-testid="schule-retransmit-in-itslearning-confirmation-text"
                >
                  {{ retransmitSchuleConfirmationMessage }}
                </span>
                <span
                  v-else
                  data-testid="schule-activate-in-itslearning-confirmation-text"
                >
                  {{ activateSchuleItsLearningConfirmationMessage }}
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
                @click.stop="closeActivateSchuleDialog(isActive)"
                data-testid="cancel-schule-activate-in-itslearning-dialog-button"
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
                @click.stop="handleSchuleToItsLearning(props.schulId)"
                data-testid="schule-itslearning-sync-button"
              >
                {{ itslearningEnabled ? $t('admin.schule.retransmit') : $t('admin.schule.activateInItsLearning') }}
              </v-btn>
            </v-col>
          </v-row>
        </v-card-actions>
      </LayoutCard>
    </template>
  </v-dialog>
</template>

<style></style>
