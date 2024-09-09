import type { ComputedRef, Ref } from 'vue';
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
};

export type BefristungUtilsType = {
  handleBefristungUpdate: (value: string | undefined) => void;
  handleBefristungOptionUpdate: (value: string | undefined) => void;
};

const rollen: ComputedRef<TranslatedRolleWithAttrs[] | undefined> = useRollen();

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
  const { selectedBefristung, selectedBefristungOption, calculatedBefristung, formContext }: Props = props;

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

  return {
    handleBefristungUpdate,
    handleBefristungOptionUpdate,
  };
}

// Checks if the selected Rolle has Befristungspflicht
export function isBefristungspflichtRolle(selectedRolleId: string | undefined): boolean {
  const rolle: TranslatedRolleWithAttrs | undefined = rollen.value?.find(
    (r: TranslatedRolleWithAttrs) => r.value === selectedRolleId,
  );

  return !!rolle && !!rolle.merkmale && rolle.merkmale.has(RollenMerkmal.BefristungPflicht);
}
