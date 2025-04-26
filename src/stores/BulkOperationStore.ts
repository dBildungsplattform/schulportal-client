import { defineStore, type Store, type StoreDefinition } from 'pinia';
import { usePersonenkontextStore, type PersonenkontextStore, type Zuordnung } from './PersonenkontextStore';
import { type PersonStore, usePersonStore } from './PersonStore';
import {
  type PersonenApiInterface,
  OrganisationsTyp,
  PersonenApiFactory,
  RollenArt,
  RollenMerkmal,
} from '@/api-client/generated';
import axiosApiInstance from '@/services/ApiService';
import { getResponseErrorCode } from '@/utils/errorHandlers';
import type { TranslatedRolleWithAttrs } from '@/composables/useRollen';
import type { Organisation } from './OrganisationStore';

const personenApi: PersonenApiInterface = PersonenApiFactory(undefined, '', axiosApiInstance);

export enum OperationType {
  MODIFY_ROLLE = 'MODIFY_ROLLE',
  DELETE_PERSON = 'DELETE_PERSON',
  RESET_PASSWORD = 'RESET_PASSWORD',
  ORG_UNASSIGN = 'ORG_UNASSIGN',
}

export type CurrentOperation = {
  type: OperationType | null;
  isRunning: boolean;
  progress: number;
  complete: boolean;
  errors: Map<string, string>;
  data: Map<string, unknown>;
  successMessage?: string;
};

type BulkOperationState = {
  currentOperation: CurrentOperation | null;
};

type BulkOperationGetters = {};

type BulkOperationActions = {
  resetState(): void;
  bulkUnassignPersonenFromOrg(organisationId: string, personIds: string[]): Promise<void>;
  bulkResetPassword(personIds: string[]): Promise<void>;
  bulkModifyPersonenRolle(
    personIDs: string[],
    selectedOrganisationId: string,
    selectedRolleId: string,
    rollen: TranslatedRolleWithAttrs[],
    workflowStepResponseOrganisations: Organisation[],
  ): Promise<void>;
  bulkPersonenDelete(personIDs: string[]): Promise<void>;
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
  state: (): BulkOperationState => ({
    currentOperation: {
      type: null,
      isRunning: false,
      progress: 0,
      complete: false,
      errors: new Map(),
      data: new Map(),
    },
  }),
  actions: {
    resetState() {
      this.currentOperation = {
        type: null,
        isRunning: false,
        progress: 0,
        complete: false,
        errors: new Map(),
        data: new Map(),
        successMessage: undefined,
      };
    },

    async bulkUnassignPersonenFromOrg(organisationId: string, personIDs: string[]): Promise<void> {
      const personStore: PersonStore = usePersonStore();
      const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();

      this.currentOperation = {
        type: OperationType.ORG_UNASSIGN,
        isRunning: true,
        progress: 0,
        complete: false,
        errors: new Map(),
        data: new Map(),
        successMessage: undefined,
      };

      for (let i: number = 0; i < personIDs.length; i++) {
        const personId: string = personIDs[i]!;

        // Fetch the Zuordnungen for this specific user (To send alongside the new one)
        await personStore.getPersonenuebersichtById(personId);

        if (personStore.errorCode) {
          this.currentOperation.errors.set(personId, personStore.errorCode);
          this.currentOperation.progress = Math.ceil(((i + 1) / personIDs.length) * 100);
          continue;
        }

        // Extract the current Zuordnungen for this person
        const existingZuordnungen: Zuordnung[] = personStore.personenuebersicht?.zuordnungen ?? [];

        // Remove the selected Organisation and it's children from the existing Zuordnungen
        // This is done by filtering out any Zuordnung that has the same sskId or administriertVon as the selected organisationId
        const updatedZuordnungen: Zuordnung[] = existingZuordnungen.filter(
          (zuordnung: Zuordnung) => zuordnung.sskId !== organisationId && zuordnung.administriertVon !== organisationId,
        );

        if (updatedZuordnungen.length === existingZuordnungen.length) {
          this.currentOperation.progress = Math.ceil(((i + 1) / personIDs.length) * 100);
          continue;
        }

        // Await the processing of each ID
        await personenkontextStore.updatePersonenkontexte(updatedZuordnungen, personId);

        if (personenkontextStore.errorCode) {
          this.currentOperation.errors.set(personId, personenkontextStore.errorCode);
          this.currentOperation.progress = Math.ceil(((i + 1) / personIDs.length) * 100);
          continue;
        }

        // Update progress for each item processed
        this.currentOperation.progress = Math.ceil(((i + 1) / personIDs.length) * 100);
      }

      this.currentOperation.isRunning = false;
      this.currentOperation.complete = true;
    },

    async bulkResetPassword(personIds: string[]): Promise<void> {
      this.currentOperation = {
        type: OperationType.RESET_PASSWORD,
        isRunning: true,
        progress: 0,
        complete: false,
        errors: new Map(),
        data: new Map(),
        successMessage: undefined,
      };

      for (let i: number = 0; i < personIds.length; i++) {
        const id: string = personIds[i]!;

        try {
          const { data }: { data: string } = await personenApi.personControllerResetPasswordByPersonId(id);
          this.currentOperation.data.set(id, data);
        } catch (error: unknown) {
          const errorCode: string = getResponseErrorCode(error, 'UNSPECIFIED_ERROR');
          this.currentOperation.errors.set(id, errorCode);
        } finally {
          this.currentOperation.progress = Math.ceil(((i + 1) / personIds.length) * 100);
        }
      }

      this.currentOperation.isRunning = false;
      this.currentOperation.complete = true;
    },

    async bulkModifyPersonenRolle(
      personIDs: string[],
      selectedOrganisationId: string,
      selectedRolleId: string,
      rollen: TranslatedRolleWithAttrs[],
      workflowStepResponseOrganisations: Organisation[],
    ): Promise<void> {
      const personStore: PersonStore = usePersonStore();
      const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();

      this.currentOperation = {
        type: OperationType.MODIFY_ROLLE,
        isRunning: true,
        progress: 0,
        complete: false,
        errors: new Map(),
        data: new Map(),
        successMessage: undefined,
      };

      const organisation: Organisation | undefined = workflowStepResponseOrganisations.find(
        (orga: Organisation) => orga.id === selectedOrganisationId,
      );

      if (!organisation) return;

      const baseZuordnung: Zuordnung = {
        sskId: organisation.id,
        rolleId: selectedRolleId,
        klasse: undefined,
        sskDstNr: organisation.kennung ?? '',
        sskName: organisation.name,
        rolle: rollen.find((rolle: TranslatedRolleWithAttrs) => rolle.value === selectedRolleId)?.title || '',
        rollenArt: rollen.find((rolle: TranslatedRolleWithAttrs) => rolle.value === selectedRolleId)
          ?.rollenart as RollenArt,
        administriertVon: organisation.administriertVon ?? '',
        editable: true,
        merkmale: [] as unknown as RollenMerkmal,
        typ: OrganisationsTyp.Schule,
        befristung: undefined,
      };

      for (let i: number = 0; i < personIDs.length; i++) {
        const personId: string = personIDs[i]!;

        await personStore.getPersonenuebersichtById(personId);

        if (personStore.errorCode) {
          this.currentOperation.errors.set(personId, personStore.errorCode);
          this.currentOperation.progress = Math.ceil(((i + 1) / personIDs.length) * 100);
          continue;
        }

        const currentZuordnungen: Zuordnung[] = personStore.personenuebersicht?.zuordnungen || [];
        const combinedZuordnungen: Zuordnung[] = [...currentZuordnungen, { ...baseZuordnung }];

        await personenkontextStore.updatePersonenkontexte(combinedZuordnungen, personId);

        if (personenkontextStore.errorCode) {
          this.currentOperation.errors.set(personId, personenkontextStore.errorCode);
          this.currentOperation.progress = Math.ceil(((i + 1) / personIDs.length) * 100);
          continue;
        }

        this.currentOperation.progress = Math.ceil(((i + 1) / personIDs.length) * 100);
      }

      this.currentOperation.isRunning = false;
      this.currentOperation.complete = true;

      if (this.currentOperation.errors.size === 0) {
        this.currentOperation.successMessage = 'admin.rolle.rollenAssignedSuccessfully';
      }
    },

    async bulkPersonenDelete(personIDs: string[]): Promise<void> {
      const personStore: PersonStore = usePersonStore();

      this.currentOperation = {
        type: OperationType.DELETE_PERSON,
        isRunning: true,
        progress: 0,
        complete: false,
        errors: new Map(),
        data: new Map(),
        successMessage: undefined,
      };

      for (let i: number = 0; i < personIDs.length; i++) {
        const personId: string = personIDs[i]!;

        await personStore.deletePersonById(personId);

        if (personStore.errorCode) {
          this.currentOperation.errors.set(personId, personStore.errorCode);
          this.currentOperation.progress = Math.ceil(((i + 1) / personIDs.length) * 100);
          continue;
        }

        this.currentOperation.progress = Math.ceil(((i + 1) / personIDs.length) * 100);
      }

      this.currentOperation.isRunning = false;
      this.currentOperation.complete = true;

      if (this.currentOperation.errors.size === 0) {
        this.currentOperation.successMessage = 'admin.person.deletePersonBulkSuccessMessage';
      }
    },
  },
});
