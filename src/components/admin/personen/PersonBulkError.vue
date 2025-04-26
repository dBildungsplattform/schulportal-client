<script setup lang="ts">
  import { ref, type Ref } from 'vue';
  import { useI18n, type Composer } from 'vue-i18n';
  import { useDisplay } from 'vuetify';
  import LayoutCard from '@/components/cards/LayoutCard.vue';

  const { t }: Composer = useI18n({ useScope: 'global' });
  const { mdAndDown }: { mdAndDown: Ref<boolean> } = useDisplay();

  const progress: Ref<number> = ref<number>(0);

  type ErrorEntry = {
    error: string;
    vorname: string;
    nachname: string;
  };

  type Props = {
    errors: ErrorEntry[];
    isDialogVisible: boolean;
  };

  type Emits = {
    (event: 'update:isDialogVisible', isDialogVisible: boolean): void;
  };

  const props: Props = defineProps<Props>();
  const emit: Emits = defineEmits<Emits>();

  const showBulkErrorDialog: Ref<boolean> = ref(props.isDialogVisible);

  function closeBulkErrorDialog(): void {
    progress.value = 0;
    showBulkErrorDialog.value = false;
    emit('update:isDialogVisible', false);
  }
</script>

<template>
  <v-dialog
    v-model="showBulkErrorDialog"
    persistent
  >
    <LayoutCard
      data-testid="rolle-modify-layout-card"
      :closable="false"
      :header="$t('person.bulk.bulkErrorTitle')"
      @onCloseClicked="closeBulkErrorDialog()"
    >
      <v-container>
        <p>{{ t('person.bulk.bulkErrorMessage') }}</p>

        <ol>
          <li
            v-for="(entry, index) in props.errors"
            :key="index"
            class="my-2"
          >
            <div>
              <span class="text-primary font-weight-bold">{{ entry.vorname }} {{ entry.nachname }}</span>
            </div>
            <div class="ml-4">
              <v-alert
                type="error"
                dense
                text="true"
              >
                {{ entry.error }}
              </v-alert>
            </div>
          </li>
        </ol>
      </v-container>

      <v-card-actions class="justify-center">
        <v-row class="py-3 px-2 justify-center">
          <v-spacer class="hidden-sm-and-down"></v-spacer>
          <v-col
            cols="12"
            sm="6"
            md="auto"
          >
            <v-btn
              :block="mdAndDown"
              class="secondary"
              @click="closeBulkErrorDialog"
              data-testid="rolle-modify-discard-button"
            >
              {{ t('person.bulk.closeList') }}
            </v-btn>
          </v-col>
        </v-row>
        <v-row class="py-3 px-2 justify-center">
          <v-col
            cols="12"
            sm="6"
            md="auto"
          >
            <v-btn
              :block="mdAndDown"
              class="primary"
              @click="closeBulkErrorDialog"
              data-testid="rolle-modify-close-button"
            >
              {{ t('person.bulk.saveList') }}
            </v-btn>
          </v-col>
        </v-row>
      </v-card-actions>
    </LayoutCard>
  </v-dialog>
</template>

<style></style>
