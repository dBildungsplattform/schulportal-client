import { watch, type ComputedRef, type Ref } from 'vue';
import { getNextSchuljahresende } from './dateUtils';
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
  const rolle: TranslatedRolleWithAttrs | undefined = rollen.value?.find(
    (r: TranslatedRolleWithAttrs) => r.value === selectedRolleId,
  );

  return !!rolle && !!rolle.merkmale && rolle.merkmale.has(RollenMerkmal.BefristungPflicht);
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
    calculatedBefristung.value = value;
  };

  // Calculates the Befristung depending on the selected radio button. Each radio button illustrates a date (Either 31st July or undefined)
  // The backend will receive the calculatedBefristung.
  function handleBefristungOptionChange(value: string | undefined): void {
    switch (value) {
      case BefristungOption.SCHULJAHRESENDE: {
        calculatedBefristung.value = getNextSchuljahresende();
        formContext.resetField('selectedBefristung'); // Reset the date picker
        break;
      }
      case BefristungOption.UNBEFRISTET: {
        calculatedBefristung.value = undefined;
        formContext.resetField('selectedBefristung');
        break;
      }
    }
  }

  const handleBefristungOptionUpdate = (value: string | undefined): void => {
    selectedBefristungOption.value = value;
    handleBefristungOptionChange(value);
  };

  // Setup the watchers
  const setupWatchers = (): void => {
    // Watcher to reset the radio button in case the date was picked using date-input
    watch(
      selectedBefristung,
      (newValue: string | undefined) => {
        if (newValue) {
          selectedBefristungOption.value = undefined;
        }
      },
      { immediate: true },
    );

    // Watcher to set an initial value for the radio buttons depending on the selected Rolle
    watch(
      selectedRolle,
      (newValue: string | undefined) => {
        if (isBefristungspflichtRolle(newValue)) {
          selectedBefristungOption.value = BefristungOption.SCHULJAHRESENDE;
          calculatedBefristung.value = getNextSchuljahresende();
        } else {
          selectedBefristungOption.value = BefristungOption.UNBEFRISTET;
          calculatedBefristung.value = undefined;
        }
      },
      { immediate: true },
    );
  };

  return {
    handleBefristungUpdate,
    handleBefristungOptionUpdate,
    setupWatchers,
  };
}
