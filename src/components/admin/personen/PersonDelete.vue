<script setup lang="ts">
  import { computed, type ComputedRef, ref, type Ref } from 'vue';
  import { type Personendatensatz } from '@/stores/PersonStore';
  import { type Composer, useI18n } from 'vue-i18n';
  import { useDisplay } from 'vuetify';
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import { type Router, useRouter } from 'vue-router';
  import SpshTooltip from '@/components/admin/SpshTooltip.vue';

  const { t }: Composer = useI18n({ useScope: 'global' });
  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();

  const router: Router = useRouter();

  type Props = {
    disabled: boolean;
    errorCode: string;
    person: Personendatensatz;
    isLoading: boolean;
  };

  type Emits = {
    (event: 'onDeletePerson', personId: string): void;
  };
  const props: Props = defineProps<Props>();
  const emit: Emits = defineEmits<Emits>();
  const errorMessage: Ref<string> = ref('');
  const successDialogVisible: Ref<boolean> = ref(false);

  const deletePersonConfirmationMessage: ComputedRef<string> = computed(() => {
    if (errorMessage.value || props.errorCode) {
      return '';
    }
    let message: string = '';
    message += `${t('admin.person.deletePersonConfirmation', {
      firstname: props.person.person.name.vorname,
      lastname: props.person.person.name.familienname,
    })}`;
    return message;
  });

  const deletePersonSuccessMessage: ComputedRef<string> = computed(() => {
    if (errorMessage.value || props.errorCode) {
      return '';
    }
    let message: string = '';
    message += `${t('admin.person.deletePersonSuccessMessage', {
      firstname: props.person.person.name.vorname,
      lastname: props.person.person.name.familienname,
    })}`;
    return message;
  });

  async function closePersonDeleteDialog(isActive: Ref<boolean>): Promise<void> {
    isActive.value = false;
  }

  async function handlePersonDelete(personId: string): Promise<void> {
    emit('onDeletePerson', personId);
    successDialogVisible.value = true;
  }

  async function closeSuccessDialogAndPushToManagement(): Promise<void> {
    successDialogVisible.value = false;
    router.push({ name: 'person-management' });
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
      :header="$t('admin.person.deletePerson')"
    >
      <v-card-text>
        <v-container>
          <v-row class="text-body text-center bold px-md-16">
            <v-col
              offset="1"
              cols="10"
            >
              <span data-testid="person-delete-success-text">
                {{ deletePersonSuccessMessage }}
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
              data-testid="close-person-delete-success-dialog-button"
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
      <v-col
        cols="12"
        sm="6"
        md="auto"
        class="pb-0"
      >
        <SpshTooltip
          :enabledCondition="!disabled"
          :disabledText="$t('person.finishEditFirst')"
          :enabledText="$t('admin.person.deletePerson')"
          position="start"
        >
          <v-btn
            class="secondary button"
            data-testid="open-person-delete-dialog-button"
            :disabled="disabled"
            v-bind="props"
            :block="mdAndDown"
          >
            {{ $t('admin.person.deletePerson') }}
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
        :header="$t('admin.person.deletePerson')"
        @onCloseClicked="closePersonDeleteDialog(isActive)"
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
            <v-row class="text-body text-center bold">
              <v-col
                offset="1"
                cols="10"
              >
                <span data-testid="person-delete-confirmation-text">
                  {{ deletePersonConfirmationMessage }}
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
                @click.stop="closePersonDeleteDialog(isActive)"
                data-testid="close-person-delete-dialog-button"
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
                @click.stop="handlePersonDelete(person.person.id)"
                data-testid="person-delete-button"
                :disabled="isLoading"
              >
                {{ $t('admin.person.deletePerson') }}
              </v-btn>
            </v-col>
          </v-row>
        </v-card-actions>
      </LayoutCard>
    </template>
  </v-dialog>
</template>

<style></style>
