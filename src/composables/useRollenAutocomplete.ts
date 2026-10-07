import {
  useRolleStore,
  type RolleFilter,
  type RolleWithServiceProvidersResponse,
  type RolleStore,
} from '@/stores/RolleStore';
import { dedup } from '@/utils/arrays';
import { computed, onScopeDispose, reactive, ref, watch, type ComputedRef, type Ref } from 'vue';

export type UseRollenAutocompleteReturn = {
  selectedRollen: Ref<RolleWithServiceProvidersResponse[]>;
  searchInput: Ref<string>;
  filter: RolleFilter;
  items: ComputedRef<RolleWithServiceProvidersResponse[]>;
  init: () => Promise<void>;
};

export function useRollenAutocomplete(initialFilter: RolleFilter): UseRollenAutocompleteReturn {
  const rolleStore: RolleStore = useRolleStore();
  const selectedRollen: Ref<RolleWithServiceProvidersResponse[]> = ref<RolleWithServiceProvidersResponse[]>([]);
  const searchInput: Ref<string> = ref('');
  const filter: RolleFilter = reactive<RolleFilter>({ ...initialFilter });
  let timerId: ReturnType<typeof setTimeout> | undefined;

  watch(searchInput, (value: string): void => {
    if (timerId !== undefined) {
      clearTimeout(timerId);
    }

    timerId = setTimeout((): void => {
      filter.searchString = value;
    }, 500);
  });

  watch(
    filter,
    (): void => {
      void rolleStore.getAllRollen({ ...filter });
    },
    { deep: true },
  );

  watch(selectedRollen, (value: RolleWithServiceProvidersResponse[]): void => {
    if (value.length === 0) {
      searchInput.value = '';
    }
  });

  onScopeDispose((): void => {
    if (timerId !== undefined) {
      clearTimeout(timerId);
    }
  });

  const items: ComputedRef<RolleWithServiceProvidersResponse[]> = computed((): RolleWithServiceProvidersResponse[] => {
    return dedup(
      [...selectedRollen.value, ...rolleStore.allRollen],
      (rolle: RolleWithServiceProvidersResponse): string => rolle.id,
    ).sort((first: RolleWithServiceProvidersResponse, second: RolleWithServiceProvidersResponse): number =>
      first.name.localeCompare(second.name),
    );
  });

  async function init(): Promise<void> {
    await rolleStore.getAllRollen({ ...filter });
  }

  return { selectedRollen, searchInput, filter, items, init };
}
