import { RollenSystemRecht } from '@/api-client/generated';
import { useAuthStore, type AuthStore, type PersonenkontextRolleFields } from '@/stores/AuthStore';
import { OrganisationsTyp, type Organisation } from '@/stores/OrganisationStore';
import { computed, type ComputedRef } from 'vue';

function intersect<T>(a: Array<T>, b: Array<T>): Array<T> {
  return a.filter((el: T) => b.includes(el));
}

function getOnlySchulenWithSystemrechte(
  pks: Array<PersonenkontextRolleFields>,
  systemrechte: Array<RollenSystemRecht>,
): Array<Organisation> {
  const temp: Array<Organisation> = [];
  for (const pk of pks) {
    const isSchule: boolean = pk.organisation.typ === OrganisationsTyp.Schule;
    if (!isSchule) continue;

    const systemrechteIntersection: Array<RollenSystemRecht> = intersect(
      systemrechte,
      pk.rolle.systemrechte as Array<RollenSystemRecht>,
    );
    const hasMatchingSystemrechte: boolean = systemrechteIntersection.length === systemrechte.length;
    if (hasMatchingSystemrechte) {
      temp.push(pk.organisation);
    }
  }
  return temp;
}

export function useAutoselectedSchule(systemrechte: Array<RollenSystemRecht>): {
  hasAutoselectedSchule: ComputedRef<boolean>;
  autoselectedSchule: ComputedRef<Organisation | null>;
} {
  const authStore: AuthStore = useAuthStore();
  const currentUserSchulen: ComputedRef<Array<Organisation>> = computed(() => {
    if (!authStore.currentUser?.personenkontexte) return [];
    return getOnlySchulenWithSystemrechte(authStore.currentUser.personenkontexte, systemrechte);
  });
  const hasAutoselectedSchule: ComputedRef<boolean> = computed(() => currentUserSchulen.value.length === 1);
  const autoselectedSchule: ComputedRef<Organisation | null> = computed(() =>
    hasAutoselectedSchule.value ? (currentUserSchulen.value.at(0) ?? null) : null,
  );

  return { hasAutoselectedSchule, autoselectedSchule };
}
