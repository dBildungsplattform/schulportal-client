import { watch, type ComputedRef, type Ref } from 'vue';
import { getNextSchuljahresende } from './date';
import type { useForm } from 'vee-validate';
import { useRollen, type TranslatedRolleWithAttrs } from '@/composables/useRollen';
import { RollenMerkmal } from '@/stores/RolleStore';

export enum BefristungOption {
  SCHULJAHRESENDE = 'schuljahresende',
  UNBEFRISTET = 'unbefristet',
}

type Props = {
  selectedBefristung: Ref<string | undefined>;
  selectedBefristungOption: Ref<string | undefined>;
  calculatedBefristung: Ref<string | undefined>;
  formContext: ReturnType<typeof useForm>;
  selectedRolle: Ref<string | undefined>;
};

export type BefristungUtilsType = {
  handleBefristungUpdate: (value: string | undefined) => void;
  handleBefristungOptionUpdate: (value: string | undefined) => void;
  setupWatchers: () => void;
};

const rollen: ComputedRef<TranslatedRolleWithAttrs[] | undefined> = useRollen();

// Checks if the selected Rolle has Befristungspflicht
export function isBefristungspflichtRolle(selectedRolleId: string | undefined): boolean {
  return (
    rollen.value?.some(
      (r: TranslatedRolleWithAttrs) => r.value === selectedRolleId && r.merkmale?.has(RollenMerkmal.BefristungPflicht),
    ) || false
  );
}

/**
 * Provides utilities for managing Befristung-related state and logic.
 */
export function useBefristungUtils(props: {
  formContext: ReturnType<typeof useForm>;
  selectedBefristung: Ref<string | undefined>;
  selectedBefristungOption: Ref<string | undefined>;
  calculatedBefristung: Ref<string | undefined>;
  selectedRolle: Ref<string | undefined>;
}): BefristungUtilsType {
  const { selectedBefristung, selectedBefristungOption, calculatedBefristung, selectedRolle, formContext }: Props =
    props;

  const handleBefristungUpdate = (value: string | undefined): void => {
    selectedBefristung.value = value;
  };

  const handleBefristungOptionUpdate = (value: string | undefined): void => {
    calculatedBefristung.value = value;
    if (!value) {
      selectedBefristungOption.value = BefristungOption.UNBEFRISTET;
    }
    selectedBefristungOption.value = BefristungOption.SCHULJAHRESENDE;
  };

  // Setup the watchers
  const setupWatchers = (): void => {
    const createWatcher = <T>(
      watchedValue: Ref<T | undefined>,
      onValueChange: (newValue: T | undefined) => void,
    ): void => {
      watch(watchedValue, onValueChange, { immediate: true });
    };

    // Watcher for resetting radio button when a date is picked using date-input
    createWatcher(selectedBefristung, (newValue: string | undefined) => {
      if (newValue) {
        selectedBefristungOption.value = undefined;
      }
    });

    // Watcher for resetting the text input for date if a radio button was selected
    createWatcher(selectedBefristungOption, (newValue: string | undefined) => {
      if (newValue) {
        formContext.resetField('selectedBefristung');
      }
    });

    // Watcher to set an initial value for the radio buttons depending on the selected Rolle
    createWatcher(selectedRolle, (newValue: string | undefined) => {
      if (isBefristungspflichtRolle(newValue)) {
        selectedBefristungOption.value = BefristungOption.SCHULJAHRESENDE;
        calculatedBefristung.value = getNextSchuljahresende();
      } else {
        selectedBefristungOption.value = BefristungOption.UNBEFRISTET;
        calculatedBefristung.value = undefined;
      }
    });
  };

  return {
    handleBefristungUpdate,
    handleBefristungOptionUpdate,
    setupWatchers,
  };
}
