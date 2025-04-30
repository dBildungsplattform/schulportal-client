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

  const state: Ref<State> = ref(State.INITIAL);
  const selectedKlasse: Ref<string | null> = ref(null);

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
</script>

<template>
  <LayoutCard
    data-testid="change-klasse-layout-card"
    :header="t('admin.person.bulkChangeKlasse.title')"
  >
    <v-container>
      <template v-if="state === State.INITIAL">
        <v-autocomplete
          data-testid="bulk-change-klasse-select"
          ref="bulk-change-klasse-select"
          :items="availableKlassen"
          v-model="selectedKlasse"
          required="true"
        />
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
            data-testid="bulk-change-klasse-discard-button"
            @click="emit('update:dialogExit', false)"
            >{{ t('cancel') }}</v-btn
          >
          <v-btn
            v-else-if="state === State.FINISHED"
            class="secondary"
            @click="emit('update:dialogExit', true)"
            data-testid="password-reset-close-button"
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
