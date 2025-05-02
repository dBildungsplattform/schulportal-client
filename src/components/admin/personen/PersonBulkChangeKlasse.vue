<script setup lang="ts">
  import LayoutCard from '@/components/cards/LayoutCard.vue';
  import { type BulkOperationStore, useBulkOperationStore } from '@/stores/BulkOperationStore';
  import type { TranslatedObject } from '@/types';
  import { computed, type ComputedRef, type Ref, ref } from 'vue';
  import { type Composer, useI18n } from 'vue-i18n';

  enum State {
    INITIAL,
    PROGRESSING,
    FINISHED,
  }

  type Props = {
    selectedSchuleId?: string;
    selectedPersonIds?: string[];
    availableKlassen?: TranslatedObject[];
  };
  const props: Props = defineProps<Props>();

  type Emits = (event: 'update:dialogExit', finished: boolean) => void;
  const emit: Emits = defineEmits<Emits>();

  const { t }: Composer = useI18n({ useScope: 'global' });
  const bulkOperationStore: BulkOperationStore = useBulkOperationStore();

  const selectedKlasse: Ref<string | null> = ref(null);

  const state: ComputedRef<State> = computed(() => {
    if (bulkOperationStore.currentOperation?.complete) return State.FINISHED;
    if (bulkOperationStore.currentOperation?.isRunning) return State.PROGRESSING;
    return State.INITIAL;
  });
  const progress: ComputedRef<number> = computed(() => {
    if (!bulkOperationStore.currentOperation?.progress) return 0;
    return bulkOperationStore.currentOperation.progress;
  });

  const canCommit: ComputedRef<boolean> = computed(() => {
    if (selectedKlasse.value) return true;
    return false;
  });

  const bulkChangeKlasse = async (): Promise<void> => {
    if (!selectedKlasse.value) return;
    await bulkOperationStore.bulkChangeKlasse(
      props.selectedPersonIds ?? [],
      props.selectedSchuleId ?? '',
      selectedKlasse.value,
    );
  };

  const handleCloseDialog = (): void => {
    if (state.value === State.FINISHED) {
      emit('update:dialogExit', true);
    } else {
      emit('update:dialogExit', false);
    }
    if (bulkOperationStore.currentOperation) {
      bulkOperationStore.resetState();
    }
  };
</script>

<template>
  <LayoutCard
    data-testid="change-klasse-layout-card"
    :header="t('admin.person.bulkChangeKlasse.title')"
  >
    <v-container>
      <template v-if="state === State.INITIAL">
        <v-row
          align="center"
          justify="center"
        >
          <v-col align="right">
            <label
              for="bulk-change-klasse-select"
              :required="true"
            >
              {{ t('admin.person.bulkChangeKlasse.nextKlasse') }}
            </label>
          </v-col>
          <v-col>
            <v-autocomplete
              autocomplete="off"
              clearable
              density="compact"
              id="bulk-change-klasse-select"
              ref="bulk-change-klasse-select"
              :no-data-text="t('noDataFound')"
              :placeholder="t('admin.klasse.selectKlasse')"
              :hide-details="true"
              variant="outlined"
              data-testid="bulk-change-klasse-select"
              :items="availableKlassen"
              v-model="selectedKlasse"
              required="true"
            />
          </v-col>
        </v-row>
      </template>
      <template v-if="state === State.PROGRESSING">
        <v-row
          align="center"
          justify="center"
        >
          <v-col cols="auto">
            <v-icon
              aria-hidden="true"
              class="mr-2"
              icon="mdi-alert-circle-outline"
              size="small"
            ></v-icon>
            <span
              class="subtitle-2"
              data-testid="bulk-change-klasse-progressing-notice"
            >
              {{ t('admin.doNotCloseBrowserNotice') }}
            </span>
          </v-col>
        </v-row>
        <!-- Progress Bar -->
        <v-progress-linear
          class="mt-5"
          :modelValue="progress"
          color="primary"
          height="25"
          data-testid="bulk-change-klasse-progressbar"
        >
          <template v-slot:default="{ value }">
            <strong class="text-white">{{ Math.ceil(value) }}%</strong>
          </template>
        </v-progress-linear>
      </template>
      <template v-if="state === State.FINISHED">
        <v-row justify="center">
          <v-col cols="auto">
            <v-icon
              small
              color="#1EAE9C"
              icon="mdi-check-circle"
            ></v-icon>
          </v-col>
        </v-row>
        <p
          class="mt-2 text-center"
          data-testid="bulk-change-klasse-success-text"
        >
          {{ t('admin.person.bulkChangeKlasse.success') }}
        </p>
      </template>
    </v-container>

    <v-card-actions class="justify-center">
      <v-row class="py-3 px-2 justify-center">
        <v-col
          cols="12"
          sm="6"
          md="auto"
        >
          <v-btn
            v-if="state === State.INITIAL"
            class="secondary"
            data-testid="bulk-change-klasse-discard-button"
            @click="handleCloseDialog"
            >{{ t('cancel') }}</v-btn
          >
          <v-btn
            v-else-if="state === State.FINISHED"
            class="secondary"
            @click="handleCloseDialog"
            data-testid="bulk-change-klasse-close-button"
          >
            {{ t('close') }}
          </v-btn>
        </v-col>
        <v-col
          cols="12"
          sm="6"
          md="auto"
          v-if="state === State.INITIAL"
        >
          <v-btn
            class="primary"
            :disabled="!canCommit"
            data-testid="bulk-change-klasse-button"
            @click.stop="bulkChangeKlasse"
            >{{ t('admin.person.bulkChangeKlasse.title') }}</v-btn
          >
        </v-col>
      </v-row>
    </v-card-actions>
  </LayoutCard>
</template>
