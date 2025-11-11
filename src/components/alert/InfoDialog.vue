<script setup lang="ts">
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import { type Ref } from 'vue';
  import { type Composer, useI18n } from 'vue-i18n';
  import { useDisplay } from 'vuetify';

  type Props = {
    id: string;
    isDialogVisible: boolean;
    header: string;
    messages: Array<string>;
  };
  type Emits = (event: 'update:dialogExit') => void;

  defineProps<Props>();
  const emit: Emits = defineEmits<Emits>();
  const { t }: Composer = useI18n({ useScope: 'global' });
  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();

  function closeDialog(): void {
    emit('update:dialogExit');
  }
</script>

<template>
  <v-dialog
    :ref="`${id}-dialog`"
    :model-value="isDialogVisible"
    persistent
  >
    <LayoutCard
      v-if="isDialogVisible"
      :data-testid="`${id}-layout-card`"
      :header="header"
    >
      <v-container
        :data-testid="`${id}-text`"
        class="mt-8 mb-4"
      >
        <v-row
          v-for="message of messages"
          :key="message"
          class="text-body text-error justify-center mb-1"
        >
          <v-icon
            class="mr-4"
            icon="mdi-alert"
          />
          <span>
            {{ message }}
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
              class="secondary"
              :data-testid="`${id}-cancel-button`"
              @click="closeDialog()"
            >
              {{ t('cancel') }}
            </v-btn>
          </v-col>
        </v-row>
      </v-card-actions>
    </LayoutCard>
  </v-dialog>
</template>
