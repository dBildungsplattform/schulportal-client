import { defineStore, type Store, type StoreDefinition } from 'pinia';
import { usePersonenkontextStore, type PersonenkontextStore, type Zuordnung } from './PersonenkontextStore';
import { type PersonStore, usePersonStore } from './PersonStore';

type BulkOperationState = {
  isOperationRunning: boolean;
  progress: number;
  errors: Map<string, string>;
};

type BulkOperationGetters = {};
type BulkOperationActions = {
  unassignPersonenFromOrg(organisationId: string, personIds: string[]): Promise<void>;
};

export type BulkOperationStore = Store<
  'bulkOperationStore',
  BulkOperationState,
  BulkOperationGetters,
  BulkOperationActions
>;

export const useBulkOperationStore: StoreDefinition<
  'bulkOperationStore',
  BulkOperationState,
  BulkOperationGetters,
  BulkOperationActions
> = defineStore({
  id: 'bulkOperationStore',
  state: (): BulkOperationState => {
    return {
      isOperationRunning: false,
      progress: 0,
      errors: new Map<string, string>(),
    };
  },
  actions: {
    async unassignPersonenFromOrg(organisationId: string, personIDs: string[]): Promise<void> {
      const personStore: PersonStore = usePersonStore();
      const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();

      this.isOperationRunning = true;
      this.progress = 0;
      for (let i: number = 0; i < personIDs.length; i++) {
        const personId: string = personIDs[i] as string;

        await personStore.getPersonenuebersichtById(personId);

        if (personStore.errorCode) {
          this.errors.set(personId, personStore.errorCode);
          continue;
        }

        const existingZuordnungen: Zuordnung[] = personStore.personenuebersicht?.zuordnungen ?? [];

        const updatedZuordnungen: Zuordnung[] = existingZuordnungen.filter(
          (zuordnung: Zuordnung) => zuordnung.sskId !== organisationId && zuordnung.administriertVon !== organisationId,
        );

        if (updatedZuordnungen.length === existingZuordnungen.length) {
          this.progress = Math.ceil(((i + 1) / personIDs.length) * 100);
          continue;
        }

        await personenkontextStore.updatePersonenkontexte(updatedZuordnungen, personId);

        if (personenkontextStore.errorCode) {
          this.errors.set(personId, personenkontextStore.errorCode);
        }

        this.progress = Math.ceil(((i + 1) / personIDs.length) * 100);
      }
      this.isOperationRunning = false;
    },
  },
});
