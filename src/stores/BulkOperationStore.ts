import { OrganisationsTyp, PersonenApiFactory, RollenArt, type PersonenApiInterface } from '@/api-client/generated';
import axiosApiInstance from '@/services/ApiService';
import { getResponseErrorCode } from '@/utils/errorHandlers';
import { isBefore } from 'date-fns';
import { defineStore, type Store, type StoreDefinition } from 'pinia';
import type { Organisation } from './OrganisationStore';
import {
  mapZuordnungToPersonenkontextUpdate,
  usePersonenkontextStore,
  type PersonenkontextStore,
  type PersonenkontextUpdate,
} from './PersonenkontextStore';
import { usePersonStore, type PersonStore } from './PersonStore';
import { Zuordnung } from './types/Zuordnung';

const personenApi: PersonenApiInterface = PersonenApiFactory(undefined, '', axiosApiInstance);

export enum OperationType {
  MODIFY_ROLLE = 'MODIFY_ROLLE',
  DELETE_PERSON = 'DELETE_PERSON',
  RESET_PASSWORD = 'RESET_PASSWORD',
  ROLLE_UNASSIGN = 'ROLLE_UNASSIGN',
  ORG_UNASSIGN = 'ORG_UNASSIGN',
  CHANGE_KLASSE = 'CHANGE_KLASSE',
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
    workflowStepResponseOrganisations: Organisation[],
    befristung?: string,
    selectedKlasseId?: string,
  ): Promise<void>;
  bulkPersonenDelete(personIDs: string[]): Promise<void>;
  bulkChangeKlasse(personIDs: string[], selectedOrganisationId: string, newKlasseId: string): Promise<void>;
  bulkUnassignPersonenFromRolle(
    organisationId: string,
    rolleId: string,
    personIDs: string[],
    isRolleLern: boolean,
  ): Promise<void>;
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
> = defineStore('bulkOperationStore', {
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

        // Await the processing of each ID
        await personenkontextStore.updatePersonenkontexte(
          updatedZuordnungen.map(mapZuordnungToPersonenkontextUpdate),
          personId,
        );

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
      workflowStepResponseOrganisations: Organisation[],
      befristung?: string,
      selectedKlasseId?: string,
    ): Promise<void> {
      const personStore: PersonStore = usePersonStore();
      const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();

      const selectedOrganisation: Organisation | undefined = workflowStepResponseOrganisations.find(
        (orga: Organisation) => orga.id === selectedOrganisationId,
      );
      if (!selectedOrganisation) return;

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

          type InternalZuordnung = PersonenkontextUpdate & { administriertVon?: string };

          const currentZuordnungen: InternalZuordnung[] =
            personStore.personenuebersicht?.zuordnungen.map((z: Zuordnung) => ({
              organisationId: z.sskId,
              rolleId: z.rolleId,
              befristung: z.befristung ?? undefined,
              administriertVon: z.administriertVon,
            })) || [];

          const newZuordnungen: InternalZuordnung[] = [];

          // --- base organisation context ---
          const orgaZuordnung: InternalZuordnung = {
            organisationId: selectedOrganisation.id,
            rolleId: selectedRolleId,
          };

          if (befristung) {
            orgaZuordnung.befristung = currentZuordnungen.reduce((earliest: string, z: InternalZuordnung) => {
              if (z.organisationId === selectedOrganisation.id && z.befristung) {
                return isBefore(z.befristung, earliest) ? z.befristung : earliest;
              }
              return earliest;
            }, befristung);
          }

          newZuordnungen.push(orgaZuordnung);

          // --- Klassen logic ---
          if (selectedKlasseId) {
            newZuordnungen.push({
              organisationId: selectedKlasseId,
              rolleId: selectedRolleId,
              administriertVon: selectedOrganisation.id,
            });
          } else {
            const klassenZuordnungen: InternalZuordnung[] = currentZuordnungen.filter(
              (z: InternalZuordnung) => z.administriertVon === selectedOrganisation.id,
            );

            for (const klasse of klassenZuordnungen) {
              newZuordnungen.push({
                organisationId: klasse.organisationId,
                rolleId: selectedRolleId,
                administriertVon: selectedOrganisation.id,
              });
            }
          }

          // --- remove administriertVon before sending ---
          const combinedZuordnungen: PersonenkontextUpdate[] = [...currentZuordnungen, ...newZuordnungen]
            .map(({ organisationId, rolleId, befristung: b }: PersonenkontextUpdate) => ({
              organisationId,
              rolleId,
              befristung: b,
            }))
            .filter(
              (zuordnung: InternalZuordnung, index: number, self: InternalZuordnung[]) =>
                index ===
                self.findIndex(
                  (z: InternalZuordnung) =>
                    z.organisationId === zuordnung.organisationId && z.rolleId === zuordnung.rolleId,
                ),
            );

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

    async bulkUnassignPersonenFromRolle(
      organisationId: string,
      rolleId: string,
      personIDs: string[],
      isRolleLern: boolean,
    ): Promise<void> {
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

          const updatedZuordnungen: Zuordnung[] = existingZuordnungen.filter((zuordnung: Zuordnung) => {
            const isExactMatch: boolean = zuordnung.sskId === organisationId && zuordnung.rolleId === rolleId;
            const isChildOfOrganisation: boolean = zuordnung.administriertVon === organisationId;

            // If "lern" type, remove both exact matches and children
            // Otherwise, only remove exact matches
            if (isRolleLern) {
              return !(isExactMatch || isChildOfOrganisation);
            } else {
              return !isExactMatch;
            }
          });

          if (updatedZuordnungen.length === existingZuordnungen.length) {
            return; // No changes needed
          }

          await personenkontextStore.updatePersonenkontexte(
            updatedZuordnungen.map(mapZuordnungToPersonenkontextUpdate),
            personId,
          );

          if (personenkontextStore.errorCode) {
            this.currentOperation?.errors.set(personId, personenkontextStore.errorCode);
          }
        },
        'admin.rolle.rollenUnassignedSuccessfully',
      );
    },

    async bulkChangeKlasse(personIDs: string[], selectedOrganisationId: string, newKlasseId: string) {
      const personStore: PersonStore = usePersonStore();
      const personenkontextStore: PersonenkontextStore = usePersonenkontextStore();

      await this.processPersonOperation(
        OperationType.CHANGE_KLASSE,
        personIDs,
        async (personId: string) => {
          await personStore.getPersonenuebersichtById(personId);
          if (personStore.errorCode) {
            this.currentOperation?.errors.set(personId, personStore.errorCode);
            personStore.errorCode = '';
            return;
          }

          const existingZuordnungen: Zuordnung[] = personStore.personenuebersicht?.zuordnungen ?? [];
          const zuordnungenToBeUpdated: Zuordnung[] = [];
          const zuordnungenToRemainUnchanged: Zuordnung[] = [];

          for (const zuordnung of existingZuordnungen) {
            if (
              zuordnung.administriertVon === selectedOrganisationId &&
              zuordnung.typ === OrganisationsTyp.Klasse &&
              zuordnung.rollenArt === RollenArt.Lern
            ) {
              zuordnungenToBeUpdated.push(zuordnung);
            } else {
              zuordnungenToRemainUnchanged.push(zuordnung);
            }
          }

          const newZuordnungen: Zuordnung[] = zuordnungenToBeUpdated.map((zuordnung: Zuordnung) => {
            const newZuordnung: Zuordnung = Zuordnung.from(zuordnung);
            newZuordnung.sskId = newKlasseId;
            return newZuordnung;
          });

          const combinedZuordnungen: Zuordnung[] = [...zuordnungenToRemainUnchanged, ...newZuordnungen];

          await personenkontextStore.updatePersonenkontexte(
            combinedZuordnungen.map(mapZuordnungToPersonenkontextUpdate),
            personId,
          );

          if (personenkontextStore.errorCode) {
            this.currentOperation?.errors.set(personId, personenkontextStore.errorCode);
            personenkontextStore.errorCode = '';
          }
        },
        'admin.person.bulkChangeKlasse.success',
      );
    },
  },
});
