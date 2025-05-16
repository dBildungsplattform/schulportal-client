import {
  OrganisationsTyp,
  PersonenApiFactory,
  RollenArt,
  RollenMerkmal,
  type PersonenApiInterface,
} from '@/api-client/generated';
import type { TranslatedRolleWithAttrs } from '@/composables/useRollen';
import axiosApiInstance from '@/services/ApiService';
import { getResponseErrorCode } from '@/utils/errorHandlers';
import { isBefore } from 'date-fns';
import { defineStore, type Store, type StoreDefinition } from 'pinia';
import type { Organisation } from './OrganisationStore';
import { usePersonenkontextStore, type PersonenkontextStore, type Zuordnung } from './PersonenkontextStore';
import { usePersonStore, type PersonStore } from './PersonStore';

const personenApi: PersonenApiInterface = PersonenApiFactory(undefined, '', axiosApiInstance);

export enum OperationType {
  MODIFY_ROLLE = 'MODIFY_ROLLE',
  DELETE_PERSON = 'DELETE_PERSON',
  RESET_PASSWORD = 'RESET_PASSWORD',
  ROLLE_UNASSIGN = 'ROLLE_UNASSIGN',
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
    befristung?: string,
  ): Promise<void>;
  bulkPersonenDelete(personIDs: string[]): Promise<void>;
  bulkUnassignPersonenFromRolle(organisationId: string, rolleId: string, personIDs: string[]): Promise<void>;
  processPersonOperation<T>(
    operationType: OperationType,
    personIDs: string[],
    processFunction: (personId: string, index: number) => Promise<T>,
    successMessage?: string,
  ): Promise<void>;
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

    /**
     * Generic processor function for bulk person operations
     * @param operationType The type of operation being performed
     * @param personIDs Array of person IDs to process
     * @param processFunction Function to process each person ID
     * @param successMessage Optional success message to set when operation completes with no errors
     */
    async processPersonOperation<T>(
      operationType: OperationType,
      personIDs: string[],
      processFunction: (personId: string, index: number) => Promise<T>,
      successMessage?: string,
    ): Promise<void> {
      this.currentOperation = {
        type: operationType,
        isRunning: true,
        progress: 0,
        complete: false,
        errors: new Map(),
        data: new Map(),
        successMessage: undefined,
      };

      for (let i: number = 0; i < personIDs.length; i++) {
        const personId: string = personIDs[i]!;

        try {
          await processFunction(personId, i);
        } finally {
          // Always update progress even if there was an error
          this.currentOperation.progress = Math.ceil(((i + 1) / personIDs.length) * 100);
        }
      }

      this.currentOperation.isRunning = false;
      this.currentOperation.complete = true;

      if (this.currentOperation.errors.size === 0 && successMessage) {
        this.currentOperation.successMessage = successMessage;
      }
    },

    async bulkUnassignPersonenFromOrg(organisationId: string, personIDs: string[]): Promise<void> {
      const personStore: PersonStore = usePersonStore();
      const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();

      await this.processPersonOperation(OperationType.ORG_UNASSIGN, personIDs, async (personId: string) => {
        personStore.errorCode = '';
        personenkontextStore.errorCode = '';
        // Fetch the Zuordnungen for this specific user (To send alongside the new one)
        await personStore.getPersonenuebersichtById(personId);

        if (personStore.errorCode) {
          this.currentOperation?.errors.set(personId, personStore.errorCode);
          return;
        }

        // Extract the current Zuordnungen for this person
        const existingZuordnungen: Zuordnung[] = personStore.personenuebersicht?.zuordnungen ?? [];

        // Remove the selected Organisation and it's children from the existing Zuordnungen
        const updatedZuordnungen: Zuordnung[] = existingZuordnungen.filter(
          (zuordnung: Zuordnung) => zuordnung.sskId !== organisationId && zuordnung.administriertVon !== organisationId,
        );

        if (updatedZuordnungen.length === existingZuordnungen.length) {
          return; // No changes needed
        }

        // Update the personenkontexte
        await personenkontextStore.updatePersonenkontexte(updatedZuordnungen, personId);

        if (personenkontextStore.errorCode) {
          this.currentOperation?.errors.set(personId, personenkontextStore.errorCode);
        }
      });
    },

    async bulkResetPassword(personIds: string[]): Promise<void> {
      await this.processPersonOperation(OperationType.RESET_PASSWORD, personIds, async (id: string) => {
        try {
          const { data }: { data: string } = await personenApi.personControllerResetPasswordByPersonId(id);
          this.currentOperation?.data.set(id, data);
        } catch (error: unknown) {
          const errorCode: string = getResponseErrorCode(error, 'UNSPECIFIED_ERROR');
          this.currentOperation?.errors.set(id, errorCode);
        }
      });
    },

    async bulkModifyPersonenRolle(
      personIDs: string[],
      selectedOrganisationId: string,
      selectedRolleId: string,
      rollen: TranslatedRolleWithAttrs[],
      workflowStepResponseOrganisations: Organisation[],
      befristung?: string,
    ): Promise<void> {
      const personStore: PersonStore = usePersonStore();
      const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();

      const selectedOrganisation: Organisation | undefined = workflowStepResponseOrganisations.find(
        (orga: Organisation) => orga.id === selectedOrganisationId,
      );

      if (!selectedOrganisation) return;

      const baseZuordnung: Zuordnung = {
        sskId: selectedOrganisation.id,
        rolleId: selectedRolleId,
        klasse: undefined,
        sskDstNr: selectedOrganisation.kennung ?? '',
        sskName: selectedOrganisation.name,
        rolle: rollen.find((rolle: TranslatedRolleWithAttrs) => rolle.value === selectedRolleId)?.title ?? '',
        rollenArt: rollen.find((rolle: TranslatedRolleWithAttrs) => rolle.value === selectedRolleId)
          ?.rollenart as RollenArt,
        administriertVon: selectedOrganisation.administriertVon ?? '',
        editable: true,
        merkmale: [] as unknown as RollenMerkmal,
        typ: OrganisationsTyp.Schule,
        befristung,
      };

      await this.processPersonOperation(
        OperationType.MODIFY_ROLLE,
        personIDs,
        async (personId: string) => {
          personStore.errorCode = '';
          personenkontextStore.errorCode = '';
          await personStore.getPersonenuebersichtById(personId);

          if (personStore.errorCode) {
            this.currentOperation?.errors.set(personId, personStore.errorCode);
            return;
          }

          const currentZuordnungen: Zuordnung[] = personStore.personenuebersicht?.zuordnungen || [];
          const newZuordnung: Zuordnung = {
            ...baseZuordnung,
          };

          // If the new kontext is befristet, we use the earliest possible befristung
          if (befristung) {
            newZuordnung.befristung = currentZuordnungen.reduce((earliest: string, zuordnung: Zuordnung) => {
              if (zuordnung.sskId === selectedOrganisation.id && zuordnung.befristung) {
                return isBefore(zuordnung.befristung, earliest) ? zuordnung.befristung : earliest;
              }
              return earliest;
            }, befristung);
          }

          const combinedZuordnungen: Zuordnung[] = [...currentZuordnungen, newZuordnung];

          await personenkontextStore.updatePersonenkontexte(combinedZuordnungen, personId);

          if (personenkontextStore.errorCode) {
            this.currentOperation?.errors.set(personId, personenkontextStore.errorCode);
          }
        },
        'admin.rolle.rollenAssignedSuccessfully',
      );
    },

    async bulkPersonenDelete(personIDs: string[]): Promise<void> {
      const personStore: PersonStore = usePersonStore();

      await this.processPersonOperation(
        OperationType.DELETE_PERSON,
        personIDs,
        async (personId: string) => {
          personStore.errorCode = '';
          await personStore.deletePersonById(personId);

          if (personStore.errorCode) {
            this.currentOperation?.errors.set(personId, personStore.errorCode);
          }
        },
        'admin.person.deletePersonBulkSuccessMessage',
      );
    },

    async bulkUnassignPersonenFromRolle(organisationId: string, rolleId: string, personIDs: string[]): Promise<void> {
      const personStore: PersonStore = usePersonStore();
      const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();

      await this.processPersonOperation(
        OperationType.ROLLE_UNASSIGN,
        personIDs,
        async (personId: string) => {
          personStore.errorCode = '';
          personenkontextStore.errorCode = '';
          await personStore.getPersonenuebersichtById(personId);

          if (personStore.errorCode) {
            this.currentOperation?.errors.set(personId, personStore.errorCode);
            return;
          }

          const existingZuordnungen: Zuordnung[] = personStore.personenuebersicht?.zuordnungen ?? [];

          // Remove Zuordnungen matching both organisationId and rolleId and it's children
          const updatedZuordnungen: Zuordnung[] = existingZuordnungen.filter(
            (zuordnung: Zuordnung) =>
              !(zuordnung.sskId === organisationId && zuordnung.rolleId === rolleId) &&
              zuordnung.administriertVon !== organisationId,
          );

          if (updatedZuordnungen.length === existingZuordnungen.length) {
            return; // No changes needed
          }

          await personenkontextStore.updatePersonenkontexte(updatedZuordnungen, personId);

          if (personenkontextStore.errorCode) {
            this.currentOperation?.errors.set(personId, personenkontextStore.errorCode);
          }
        },
        'admin.rolle.rollenUnassignedSuccessfully',
      );
    },
  },
});
