<script setup lang="ts">
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import { type Ref } from 'vue';
  import { type Composer, useI18n } from 'vue-i18n';
  import { useDisplay } from 'vuetify';

  type Props = {
    isDialogVisible: boolean;
    header: string;
  };
  type Emits = (event: 'update:dialogExit') => void;

  defineProps<Props>();
  const emit: Emits = defineEmits<Emits>();
  const { t }: Composer = useI18n({ useScope: 'global' });
  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();

  async function closeDialog(): Promise<void> {
    emit('update:dialogExit');
  }
</script>

<template>
  <v-dialog
    ref="one-school-alert-dialog"
    :modelValue="isDialogVisible"
    persistent
  >
    <LayoutCard
      v-if="isDialogVisible"
      data-testid="one-school-alert-layout-card"
      :header="header"
    >
      <v-container class="mt-8 mb-4">
        <v-row class="text-body text-error justify-center">
          <v-icon
            class="mr-4"
            icon="mdi-alert"
          ></v-icon>
          <span data-testid="error-text">
            {{ t('admin.person.onlyOneSchoolAlert') }}
          </span>
        </v-row>
      </v-container>

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
              @click="closeDialog()"
              data-testid="one-school-alert-cancel-button"
            >
              {{ t('cancel') }}
            </v-btn>
          </v-col>
        </v-row>
      </v-card-actions>
    </LayoutCard>
  </v-dialog>
</template>
